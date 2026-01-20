import { Injectable, Logger, NotFoundException, Inject } from '@nestjs/common';
import { S3Client, GetObjectCommand, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PrismaService } from '../prisma/prisma.service';
import { IngestionWorker } from './ingestion.worker';
import { QuoteService } from '../quote/quote.service';
import { S3_CLIENT } from '../s3/s3.provider';
import {
  StartIngestionDto,
  IngestionResponseDto,
  RecentFileDto,
  RequestUploadUrlDto,
  UploadUrlResponseDto,
  ConfirmUploadDto,
} from './dto';

/**
 * IngestionService
 * 
 * Handles business logic for ingestion operations:
 * - Creating ingestion jobs
 * - Listing recent files with presigned URLs
 * - Retrieving file metadata
 */
@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);
  private readonly s3Bucket: string;
  private readonly signedUrlTtl: number;
  private readonly kmsKeyId: string | undefined;

  constructor(
    private readonly prisma: PrismaService,
    private readonly worker: IngestionWorker,
    private readonly quoteService: QuoteService,
    @Inject(S3_CLIENT) private readonly s3Client: S3Client,
  ) {
    this.s3Bucket = process.env.S3_BUCKET || 'fabspace-ingestions';
    // Default 1 hour (3600 seconds), configurable via env
    this.signedUrlTtl = parseInt(process.env.SIGNED_URL_TTL || '3600', 10);
    this.kmsKeyId = process.env.KMS_KEY_ID;
  }

  /**
   * Start a new ingestion job from URL
   */
  async startIngestion(
    userId: string,
    dto: StartIngestionDto,
  ): Promise<IngestionResponseDto> {
    this.logger.log(`Creating ingestion job for user ${userId}`);

    // Create job record with 'queued' status
    const job = await this.prisma.ingestionJob.create({
      data: {
        userId,
        sourceUrl: dto.sourceUrl,
        status: 'queued',
      },
    });

    // Trigger async processing (fire and forget)
    // In production, you might want to use a proper queue (SQS, Bull, etc.)
    this.worker.runJob(job.id).catch((error) => {
      this.logger.error(
        `Failed to process job ${job.id}: ${error.message}`,
        error.stack,
      );
    });

    return {
      jobId: job.id,
      status: job.status,
    };
  }

  /**
   * Stage a file upload (demo for small files)
   * Validates size limit and immediately uploads to S3
   */
  async stageUpload(
    userId: string,
    file: Express.Multer.File,
  ): Promise<IngestionResponseDto> {
    const maxSizeMB = parseInt(process.env.MAX_DB_STAGE_MB || '50', 10);
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      throw new Error(
        `File size exceeds maximum allowed size of ${maxSizeMB}MB`,
      );
    }

    this.logger.log(
      `Creating staged upload for user ${userId}, file size: ${file.size} bytes`,
    );

    // Create job record with 'staged' status
    const job = await this.prisma.ingestionJob.create({
      data: {
        userId,
        sourceUrl: file.originalname, // Store original filename as sourceUrl
        status: 'staged',
      },
    });

    // Process the staged upload immediately
    this.worker
      .handleStagedUpload(job.id, userId, file.buffer, file.originalname)
      .catch((error) => {
        this.logger.error(
          `Failed to process staged upload ${job.id}: ${error.message}`,
          error.stack,
        );
      });

    return {
      jobId: job.id,
      status: 'staged',
    };
  }

  /**
   * Get recent completed files for a user with presigned URLs
   */
  async getRecentFiles(userId: string, limit: number): Promise<RecentFileDto[]> {
    this.logger.log(`Fetching recent files for user ${userId}, limit: ${limit}`);

    const jobs = await this.prisma.ingestionJob.findMany({
      where: {
        userId,
        status: 'completed',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      select: {
        s3Key: true,
        createdAt: true,
        sizeBytes: true,
        sha256: true,
        s3Bucket: true,
      },
    });

    // Generate presigned URLs for each file
    const filesWithUrls = await Promise.all(
      jobs.map(async (job) => {
        const url = await this.generatePresignedUrl(
          job.s3Bucket || this.s3Bucket,
          job.s3Key!,
        );

        return {
          key: job.s3Key!,
          createdAt: job.createdAt,
          sizeBytes: job.sizeBytes!.toString(), // Convert BigInt to string for JSON serialization
          sha256: job.sha256!,
          url,
        };
      }),
    );

    return filesWithUrls;
  }

  /**
   * Get file metadata by job ID
   */
  async getFileById(userId: string, jobId: string) {
    const job = await this.prisma.ingestionJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }

    // Verify ownership
    if (job.userId !== userId) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }

    if (job.status !== 'completed') {
      throw new NotFoundException(
        `Job ${jobId} is not completed (status: ${job.status})`,
      );
    }

    if (!job.s3Key || !job.s3Bucket) {
      throw new NotFoundException(`Job ${jobId} has no associated S3 object`);
    }

    return {
      bucket: job.s3Bucket,
      key: job.s3Key,
      sizeBytes: job.sizeBytes,
      sha256: job.sha256,
    };
  }

  /**
   * Get S3 object metadata using HEAD request
   */
  async getS3ObjectMetadata(bucket: string, key: string) {
    try {
      const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      return {
        contentType: response.ContentType || 'application/zip',
        contentLength: response.ContentLength || 0,
        etag: response.ETag || '',
      };
    } catch (error) {
      this.logger.error(
        `Failed to get S3 metadata for ${bucket}/${key}: ${error.message}`,
      );
      throw new NotFoundException(`File not found in S3`);
    }
  }

  /**
   * Stream file from S3
   */
  async streamFileFromS3(bucket: string, key: string) {
    try {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      return response.Body;
    } catch (error) {
      this.logger.error(
        `Failed to stream file from S3 ${bucket}/${key}: ${error.message}`,
      );
      throw new NotFoundException(`File not found in S3`);
    }
  }

  /**
   * Generate a presigned URL for S3 GET operation
   */
  private async generatePresignedUrl(
    bucket: string,
    key: string,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, {
      expiresIn: this.signedUrlTtl,
    });
  }

  /**
   * Generate a presigned URL for direct file upload to S3
   * 
   * Flow:
   * 1. Create job with status 'awaiting_upload'
   * 2. Generate presigned PUT URL
   * 3. Return URL and job ID to client
   * 4. Client uploads directly to S3
   * 5. Client calls confirmUpload to mark as completed
   */
  async generateUploadUrl(
    userId: string,
    dto: RequestUploadUrlDto,
  ): Promise<UploadUrlResponseDto> {
    this.logger.log(`Generating upload URL for user ${userId}`);

    // Create job record with 'awaiting_upload' status
    const job = await this.prisma.ingestionJob.create({
      data: {
        userId,
        sourceUrl: dto.filename || 'direct-upload',
        status: 'awaiting_upload',
      },
    });

    // Generate S3 key
    const s3Key = `ingestions/${userId}/${job.id}.zip`;

    // Create PUT command with metadata
    const putCommand = new PutObjectCommand({
      Bucket: this.s3Bucket,
      Key: s3Key,
      ContentType: 'application/zip',
      ServerSideEncryption: this.kmsKeyId ? 'aws:kms' : undefined,
      SSEKMSKeyId: this.kmsKeyId,
      Tagging: `userId=${encodeURIComponent(userId)}`,
    });

    // Generate presigned URL for PUT operation
    const uploadUrl = await getSignedUrl(this.s3Client, putCommand, {
      expiresIn: this.signedUrlTtl,
    });

    // Build fields object for client
    const fields: Record<string, string> = {
      'Content-Type': 'application/zip',
    };

    if (this.kmsKeyId) {
      fields['x-amz-server-side-encryption'] = 'aws:kms';
      fields['x-amz-server-side-encryption-aws-kms-key-id'] = this.kmsKeyId;
    }

    this.logger.log(`Generated upload URL for job ${job.id}`);

    return {
      jobId: job.id,
      uploadUrl,
      s3Key,
      expiresIn: this.signedUrlTtl,
      fields,
    };
  }

  /**
   * Confirm that an upload has been completed
   * 
   * Updates job status from 'awaiting_upload' to 'completed'
   * and retrieves file metadata from S3
   */
  async confirmUpload(
    userId: string,
    jobId: string,
    dto: ConfirmUploadDto,
  ): Promise<IngestionResponseDto> {
    this.logger.log(`Confirming upload for job ${jobId}`);

    // Verify job exists and user owns it
    const job = await this.prisma.ingestionJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }

    if (job.userId !== userId) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }

    if (job.status !== 'awaiting_upload') {
      throw new Error(
        `Job ${jobId} is not awaiting upload (status: ${job.status})`,
      );
    }

    // Get S3 key
    const s3Key = `ingestions/${userId}/${jobId}.zip`;

    // Verify file exists in S3 and get metadata
    try {
      const metadata = await this.getS3ObjectMetadata(this.s3Bucket, s3Key);

      // Update job with completion details
      await this.prisma.ingestionJob.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          s3Bucket: this.s3Bucket,
          s3Key,
          sizeBytes: BigInt(metadata.contentLength),
          // Note: SHA-256 not computed for direct uploads
          // Could be added later by triggering Lambda on S3 event
        },
      });

      this.logger.log(`Upload confirmed for job ${jobId}`);

      // Automatically create a quick quotation for the completed upload
      try {
        const userIdNumber = parseInt(userId, 10);
        await this.quoteService.createQuickQuotation(
          userIdNumber,
          jobId,
          job.sourceUrl,
        );
        this.logger.log(
          `Quick quotation created for direct upload job ${jobId}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to create quick quotation for job ${jobId}: ${error.message}`,
          error.stack,
        );
        // Don't fail the job if quotation creation fails
      }

      return {
        jobId,
        status: 'completed',
      };
    } catch (error) {
      // File doesn't exist in S3
      this.logger.error(
        `Failed to confirm upload for job ${jobId}: ${error.message}`,
      );
      
      // Update job to failed status
      await this.prisma.ingestionJob.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          error: 'File not found in S3 after upload',
        },
      });

      throw new NotFoundException(
        `Upload verification failed. File not found in S3.`,
      );
    }
  }
}

