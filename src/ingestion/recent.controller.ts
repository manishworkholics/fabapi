import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';

import { AccessTokenGuard } from '../auth/guards/accessToken.guard';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { JWTPayload } from '../auth/types';

import { IngestionService } from './ingestion.service';
import { RecentQueryDto, RecentFileDto } from './dto';

/**
 * RecentController
 * 
 * Handles listing recent completed ingestion files with presigned download URLs
 */
@ApiTags('ingestion')
@ApiBearerAuth()
@Controller('recent')
@UseGuards(AccessTokenGuard)
export class RecentController {
  constructor(private readonly ingestionService: IngestionService) {}

  /**
   * Get recent completed files for the authenticated user
   * 
   * Returns a list of recently completed ingestion jobs with:
   * - S3 key
   * - File metadata (size, SHA-256, creation time)
   * - Presigned URL for download (time-limited)
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List recent completed files',
    description:
      'Returns a list of recently completed ingestion jobs for the authenticated user. ' +
      'Each file includes a presigned URL for downloading (TTL configured via SIGNED_URL_TTL env var).',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of files to return (1-100, default: 20)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of recent files',
    type: [RecentFileDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getRecent(
    @AuthUser() user: JWTPayload,
    @Query() query: RecentQueryDto,
  ): Promise<RecentFileDto[]> {
    // Convert numeric userId to string for querying
    const userId = user.userId.toString();
    const limit = query.limit || 20;

    return this.ingestionService.getRecentFiles(userId, limit);
  }
}

