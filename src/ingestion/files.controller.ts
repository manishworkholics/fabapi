import {
  Controller,
  Get,
  Param,
  UseGuards,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';

import { AccessTokenGuard } from '../auth/guards/accessToken.guard';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { JWTPayload } from '../auth/types';

import { IngestionService } from './ingestion.service';
import { Readable } from 'stream';

/**
 * FilesController
 *
 * Handles direct file downloads from S3 through the server
 */
@ApiTags('ingestion')
@ApiBearerAuth()
@Controller('files')
@UseGuards(AccessTokenGuard)
export class FilesController {
  constructor(private readonly ingestionService: IngestionService) {}

  /**
   * Download a file by job ID
   *
   * Flow:
   * 1. Verify job exists and user owns it
   * 2. Get S3 object metadata (HEAD request)
   * 3. Stream file from S3 to response
   * 4. Set appropriate headers (Content-Type, Content-Length, ETag)
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Download a file by job ID',
    description:
      'Downloads a completed ingestion file by its job ID. ' +
      'Streams the file directly from S3 through the server. ' +
      'Returns 404 if the file does not exist or the user does not own it.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Job ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'File downloaded successfully',
    content: {
      'application/zip': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'File not found or user does not own it',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async downloadFile(
    @AuthUser() user: JWTPayload,
    @Param('id') jobId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    // Convert numeric userId to string
    const userId = user.userId.toString();

    // Get file metadata and verify ownership
    const fileInfo = await this.ingestionService.getFileById(userId, jobId);

    // Get S3 object metadata (HEAD request)
    const metadata = await this.ingestionService.getS3ObjectMetadata(
      fileInfo.bucket,
      fileInfo.key,
    );

    // Set response headers
    res.set({
      'Content-Type': metadata.contentType,
      'Content-Length': metadata.contentLength.toString(),
      'Content-Disposition': `attachment; filename="${jobId}.zip"`,
      ETag: metadata.etag,
    });

    // Stream file from S3
    const body = await this.ingestionService.streamFileFromS3(
      fileInfo.bucket,
      fileInfo.key,
    );

    // Convert AWS SDK Body to Node.js Readable stream
    const stream = body as Readable;

    return new StreamableFile(stream);
  }
}
