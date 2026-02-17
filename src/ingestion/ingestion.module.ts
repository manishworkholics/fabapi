import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';

import { PrismaModule } from '../prisma/prisma.module';
import { S3Module } from '../s3/s3.module';
import { QuoteModule } from '../quote/quote.module';

import { IngestionController } from './ingestion.controller';
import { RecentController } from './recent.controller';
import { FilesController } from './files.controller';
import { IngestionService } from './ingestion.service';
import { IngestionWorker } from './ingestion.worker';
import { StorageEngine } from 'multer';

/**
 * IngestionModule
 *
 * Provides complete ingestion functionality:
 * - URL-based ingestion (download from remote URL → S3)
 * - Staged uploads (small files via multipart form)
 * - Recent file listing with presigned URLs
 * - Direct file downloads
 *
 * Dependencies:
 * - PrismaModule: Database access
 * - S3Module: S3Client for AWS operations
 * - MulterModule: File upload handling
 */
@Module({
  imports: [
    PrismaModule,
    S3Module,
    QuoteModule, // Import QuoteModule to access QuoteService
    MulterModule.register({
      // Store files in memory (not on disk)
      storage: 'memory' as unknown as StorageEngine,
      limits: {
        // Maximum file size from environment or 50MB default
        fileSize:
          parseInt(process.env.MAX_DB_STAGE_MB || '50', 10) * 1024 * 1024,
      },
    }),
  ],
  controllers: [IngestionController, RecentController, FilesController],
  providers: [IngestionService, IngestionWorker],
  exports: [IngestionService],
})
export class IngestionModule {}
