import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * DTO for requesting a presigned upload URL
 */
export class RequestUploadUrlDto {
  @ApiProperty({
    description: 'Original filename (optional, for tracking purposes)',
    example: 'project-design.zip',
    required: false,
  })
  @IsOptional()
  @IsString()
  filename?: string;
}

/**
 * Response DTO containing presigned upload URL and job information
 */
export class UploadUrlResponseDto {
  @ApiProperty({
    description: 'Unique job identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  jobId: string;

  @ApiProperty({
    description: 'Presigned URL for uploading file to S3',
    example: 'https://fabspace-ingestions.s3.amazonaws.com/...',
  })
  uploadUrl: string;

  @ApiProperty({
    description: 'S3 key where the file will be stored',
    example: 'ingestions/user123/550e8400-e29b-41d4-a716-446655440000.zip',
  })
  s3Key: string;

  @ApiProperty({
    description: 'Expiration time of the presigned URL in seconds',
    example: 3600,
  })
  expiresIn: number;

  @ApiProperty({
    description: 'Required fields to include in the upload request',
    example: {
      'Content-Type': 'application/zip',
      'x-amz-server-side-encryption': 'aws:kms',
      'x-amz-server-side-encryption-aws-kms-key-id': 'arn:aws:kms:...',
    },
  })
  fields: Record<string, string>;
}

/**
 * DTO for confirming upload completion
 */
export class ConfirmUploadDto {
  @ApiProperty({
    description: 'ETag returned by S3 after upload (optional)',
    example: '"33a64df551425fcc55e4d42a148795d9f25f89d4"',
    required: false,
  })
  @IsOptional()
  @IsString()
  etag?: string;
}
