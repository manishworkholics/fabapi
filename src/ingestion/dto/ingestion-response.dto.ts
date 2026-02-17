import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO for ingestion job operations
 */
export class IngestionResponseDto {
  @ApiProperty({
    description: 'Unique job identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  jobId: string;

  @ApiProperty({
    description: 'Current status of the job',
    enum: ['queued', 'downloading', 'uploading', 'completed', 'failed', 'staged', 'awaiting_upload'],
    example: 'queued',
  })
  status: string;
}

