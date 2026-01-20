import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for recent file information with presigned URL
 */
export class RecentFileDto {
  @ApiProperty({
    description: 'S3 object key',
    example: 'ingestions/user123/550e8400-e29b-41d4-a716-446655440000.zip',
  })
  key: string;

  @ApiProperty({
    description: 'File creation timestamp',
    example: '2025-11-03T21:54:33.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1048576,
  })
  sizeBytes: bigint | string;

  @ApiProperty({
    description: 'SHA-256 checksum of the file',
    example: 'abc123def456...',
  })
  sha256: string;

  @ApiProperty({
    description: 'Presigned URL for downloading the file (time-limited)',
    example: 'https://s3.amazonaws.com/bucket/key?...',
  })
  url: string;
}

