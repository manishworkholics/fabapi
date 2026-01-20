import {
  Body,
  Controller,
  Post,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';

import { AccessTokenGuard } from '../auth/guards/accessToken.guard';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { JWTPayload } from '../auth/types';

import { IngestionService } from './ingestion.service';
import {
  StartIngestionDto,
  IngestionResponseDto,
  RequestUploadUrlDto,
  UploadUrlResponseDto,
  ConfirmUploadDto,
} from './dto';

/**
 * IngestionController
 *
 * Handles ingestion operations:
 * - POST /ingestions: Start ingestion from URL
 * - POST /ingestions/stage: Stage upload for small files
 * - POST /ingestions/upload-url: Generate presigned upload URL for large files
 * - POST /ingestions/:id/confirm: Confirm direct upload completion
 */
@ApiTags('ingestion')
@ApiBearerAuth()
@Controller('ingestions')
@UseGuards(AccessTokenGuard)
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  /**
   * Start a new ingestion job from a URL
   *
   * Flow:
   * 1. Create job with status 'queued'
   * 2. Trigger async download and upload to S3
   * 3. Return job ID immediately
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Start ingestion from URL',
    description:
      'Creates a new ingestion job that downloads a file from the provided URL and uploads it to S3. ' +
      'The file must be a ZIP archive. Returns immediately with a job ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Job created successfully',
    type: IngestionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid URL or validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async startIngestion(
    @AuthUser() user: JWTPayload,
    @Body() dto: StartIngestionDto,
  ): Promise<IngestionResponseDto> {
    // Convert numeric userId to string for storage
    const userId = user.userId.toString();
    return this.ingestionService.startIngestion(userId, dto);
  }

  /**
   * Stage a file upload directly (for small files)
   *
   * Flow:
   * 1. Validate file size against MAX_DB_STAGE_MB
   * 2. Create job with status 'staged'
   * 3. Compute SHA-256 and upload to S3 immediately
   * 4. Update status to 'completed'
   */
  @Post('stage')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Stage a file upload (small files only)',
    description:
      'Upload a small file directly via multipart form data. ' +
      'File size is limited by MAX_DB_STAGE_MB environment variable (default: 50MB). ' +
      'The file is immediately uploaded to S3 and the job is marked as completed.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'ZIP file to upload',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'File staged successfully',
    type: IngestionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'File too large or invalid',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async stageUpload(
    @AuthUser() user: JWTPayload,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<IngestionResponseDto> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate that it's a ZIP file
    const isZip =
      file.mimetype === 'application/zip' ||
      file.mimetype === 'application/x-zip-compressed' ||
      file.originalname?.toLowerCase().endsWith('.zip');

    if (!isZip) {
      throw new BadRequestException('Only ZIP files are supported');
    }

    // Convert numeric userId to string for storage
    const userId = user.userId.toString();
    return this.ingestionService.stageUpload(userId, file);
  }

  /**
   * Generate a presigned upload URL for direct upload to S3
   *
   * Flow:
   * 1. Create job with status 'awaiting_upload'
   * 2. Generate presigned PUT URL
   * 3. Client uploads file to the URL
   * 4. Client calls confirm endpoint
   */
  @Post('upload-url')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate presigned upload URL for large files',
    description:
      'Creates a new ingestion job and returns a presigned URL for direct upload to S3. ' +
      'Use this for large files that should be uploaded directly to S3. ' +
      'After uploading, call the confirm endpoint to mark the upload as complete.',
  })
  @ApiResponse({
    status: 200,
    description: 'Presigned URL generated successfully',
    type: UploadUrlResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async generateUploadUrl(
    @AuthUser() user: JWTPayload,
    @Body() dto: RequestUploadUrlDto,
  ): Promise<UploadUrlResponseDto> {
    const userId = user.userId.toString();
    return await this.ingestionService.generateUploadUrl(userId, dto);
  }

  /**
   * Confirm that a direct upload has been completed
   *
   * Flow:
   * 1. Verify file exists in S3
   * 2. Get file metadata (size, etag)
   * 3. Update job status to 'completed'
   */
  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirm direct upload completion',
    description:
      'Confirms that a file has been uploaded directly to S3 using a presigned URL. ' +
      'This endpoint verifies the file exists and updates the job status to completed.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Job ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Upload confirmed successfully',
    type: IngestionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Job not found or file not found in S3',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async confirmUpload(
    @AuthUser() user: JWTPayload,
    @Param('id') jobId: string,
    @Body() dto: ConfirmUploadDto,
  ): Promise<IngestionResponseDto> {
    const userId = user.userId.toString();
    return await this.ingestionService.confirmUpload(userId, jobId, dto);
  }
}
