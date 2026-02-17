import { Injectable, Inject, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { request } from 'undici';
import { createHash } from 'crypto';
import { Readable } from 'stream';
import { PrismaService } from '../prisma/prisma.service';
import { QuoteService } from '../quote/quote.service';
import { S3_CLIENT } from '../s3/s3.provider';

/**
 * IngestionWorker
 * 
 * Application service class (not a separate process) that handles the actual
 * download and upload work for ingestion jobs.
 * 
 * TODO: Retrieve partner API authorization token from secure storage/secrets manager
 */
@Injectable()
export class IngestionWorker {
  private readonly logger = new Logger(IngestionWorker.name);
  private readonly s3Bucket: string;
  private readonly kmsKeyId?: string;
  private readonly partnerApiToken?: string; // TODO: Load from secrets manager

  constructor(
    @Inject(S3_CLIENT) private readonly s3Client: S3Client,
    private readonly prisma: PrismaService,
    private readonly quoteService: QuoteService,
  ) {
    this.s3Bucket = process.env.S3_BUCKET || 'fabspace-ingestions';
    this.kmsKeyId = process.env.KMS_KEY_ID;
    // TODO: Retrieve this from AWS Secrets Manager or similar secure storage
    this.partnerApiToken = process.env.PARTNER_API_TOKEN;
  }

  /**
   * Main entry point for running an ingestion job
   */
  async runJob(jobId: string): Promise<void> {
    try {
      const job = await this.prisma.ingestionJob.findUnique({
        where: { id: jobId },
      });

      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      this.logger.log(`Starting job ${jobId} for user ${job.userId}`);

      // Update status to downloading
      await this.prisma.ingestionJob.update({
        where: { id: jobId },
        data: { status: 'downloading' },
      });

      // Download from source URL
      const { stream, contentLength } = await this.downloadFromUrl(job.sourceUrl);

      // Compute SHA-256 while streaming
      const hashStream = createHash('sha256');
      let downloadedBytes = 0;

      // Create a pass-through that computes hash
      const passthroughStream = new Readable({
        read() {},
      });

      stream.on('data', (chunk: Buffer) => {
        hashStream.update(chunk);
        downloadedBytes += chunk.length;
        passthroughStream.push(chunk);
      });

      stream.on('end', () => {
        passthroughStream.push(null);
      });

      stream.on('error', (err) => {
        passthroughStream.destroy(err);
      });

      // Update status to uploading
      await this.prisma.ingestionJob.update({
        where: { id: jobId },
        data: { status: 'uploading' },
      });

      // Upload to S3
      const s3Key = `ingestions/${job.userId}/${jobId}.zip`;
      await this.uploadToS3(passthroughStream, s3Key, job.userId);

      // Wait for hash computation to complete
      const sha256 = hashStream.digest('hex');

      // Finalize job as completed
      await this.prisma.ingestionJob.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          s3Bucket: this.s3Bucket,
          s3Key,
          sizeBytes: BigInt(downloadedBytes),
          sha256,
        },
      });

      this.logger.log(
        `Job ${jobId} completed successfully. Size: ${downloadedBytes} bytes, SHA-256: ${sha256}`,
      );

      // Automatically create a quick quotation for the completed ingestion
      try {
        const userIdNumber = parseInt(job.userId, 10);
        await this.quoteService.createQuickQuotation(
          userIdNumber,
          jobId,
          job.sourceUrl,
        );
        this.logger.log(
          `Quick quotation created for ingestion job ${jobId}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to create quick quotation for job ${jobId}: ${error.message}`,
          error.stack,
        );
        // Don't fail the job if quotation creation fails
      }
    } catch (error) {
      this.logger.error(`Job ${jobId} failed: ${error.message}`, error.stack);

      // Update job as failed
      await this.prisma.ingestionJob.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          error: error.message || 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * Download file from source URL with validation
   */
  private async downloadFromUrl(
    sourceUrl: string,
  ): Promise<{ stream: Readable; contentLength: number }> {
    const headers: Record<string, string> = {};

    // TODO: Retrieve token from secure storage (e.g., AWS Secrets Manager)
    // For now, using environment variable as placeholder
    if (this.partnerApiToken) {
      headers['Authorization'] = `Bearer ${this.partnerApiToken}`;
    }

    this.logger.debug(`Downloading from ${sourceUrl}`);

    const response = await request(sourceUrl, {
      method: 'GET',
      headers,
    });

    // Validate response
    if (response.statusCode !== 200) {
      throw new Error(
        `Failed to download from ${sourceUrl}: HTTP ${response.statusCode}`,
      );
    }

    // Validate content type
    const contentType = response.headers['content-type'] as string;
    const isZip =
      contentType?.includes('application/zip') ||
      contentType?.includes('application/x-zip-compressed') ||
      sourceUrl.toLowerCase().endsWith('.zip');

    if (!isZip) {
      throw new Error(
        `Invalid content type: ${contentType}. Only ZIP files are supported.`,
      );
    }

    const contentLength = parseInt(
      (response.headers['content-length'] as string) || '0',
      10,
    );

    return {
      stream: response.body as unknown as Readable,
      contentLength,
    };
  }

  /**
   * Upload file to S3 using multipart upload
   */
  private async uploadToS3(
    stream: Readable,
    key: string,
    userId: string,
  ): Promise<void> {
    this.logger.debug(`Uploading to S3: ${this.s3Bucket}/${key}`);

    const uploadParams: any = {
      Bucket: this.s3Bucket,
      Key: key,
      Body: stream,
      ContentType: 'application/zip',
    };

    // Add KMS encryption if configured
    if (this.kmsKeyId) {
      uploadParams.ServerSideEncryption = 'aws:kms';
      uploadParams.SSEKMSKeyId = this.kmsKeyId;
    }

    // Add tagging
    uploadParams.Tagging = `userId=${encodeURIComponent(userId)}`;

    const upload = new Upload({
      client: this.s3Client,
      params: uploadParams,
      // 8MB part size for multipart uploads
      partSize: 8 * 1024 * 1024,
      queueSize: 4,
    });

    // Monitor progress
    upload.on('httpUploadProgress', (progress) => {
      if (progress.loaded && progress.total) {
        const percent = ((progress.loaded / progress.total) * 100).toFixed(2);
        this.logger.debug(`Upload progress: ${percent}%`);
      }
    });

    await upload.done();
    this.logger.log(`Successfully uploaded to S3: ${key}`);
  }

  /**
   * Handle staged uploads (small files from multipart form)
   */
  async handleStagedUpload(
    jobId: string,
    userId: string,
    buffer: Buffer,
    originalFilename: string,
  ): Promise<void> {
    try {
      this.logger.log(`Processing staged upload for job ${jobId}`);

      // Compute SHA-256
      const sha256 = createHash('sha256').update(buffer).digest('hex');

      // Update status to uploading
      await this.prisma.ingestionJob.update({
        where: { id: jobId },
        data: { status: 'uploading' },
      });

      // Upload to S3
      const s3Key = `ingestions/${userId}/${jobId}.zip`;
      const stream = Readable.from(buffer);
      await this.uploadToS3(stream, s3Key, userId);

      // Finalize job as completed
      const completedJob = await this.prisma.ingestionJob.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          s3Bucket: this.s3Bucket,
          s3Key,
          sizeBytes: BigInt(buffer.length),
          sha256,
        },
      });

      this.logger.log(
        `Staged job ${jobId} completed. Size: ${buffer.length} bytes, SHA-256: ${sha256}`,
      );

      // Automatically create a quick quotation for the completed staged upload
      try {
        const userIdNumber = parseInt(userId, 10);
        await this.quoteService.createQuickQuotation(
          userIdNumber,
          jobId,
          originalFilename,
        );
        this.logger.log(
          `Quick quotation created for staged upload job ${jobId}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to create quick quotation for staged job ${jobId}: ${error.message}`,
          error.stack,
        );
        // Don't fail the job if quotation creation fails
      }
    } catch (error) {
      this.logger.error(
        `Staged job ${jobId} failed: ${error.message}`,
        error.stack,
      );

      await this.prisma.ingestionJob.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          error: error.message || 'Unknown error',
        },
      });

      throw error;
    }
  }
}

