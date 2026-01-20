import { Module } from '@nestjs/common';
import { S3ClientProvider } from './s3.provider';

/**
 * S3Module
 * 
 * Provides configured S3Client for injection across the application.
 * Uses IAM roles in production, falls back to local credentials in dev.
 */
@Module({
  providers: [S3ClientProvider],
  exports: [S3ClientProvider],
})
export class S3Module {}

