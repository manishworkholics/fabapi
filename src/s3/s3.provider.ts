import { S3Client } from '@aws-sdk/client-s3';
import { Provider } from '@nestjs/common';

/**
 * S3 Client Provider
 * 
 * In production: Uses IAM instance/task role credentials (no static keys)
 * In development: Falls back to local AWS credentials from ~/.aws/credentials
 * 
 * Environment variables:
 * - AWS_REGION: AWS region for S3 (default: us-east-1)
 * - AWS_ENDPOINT: Optional custom endpoint (useful for LocalStack in dev)
 */
export const S3_CLIENT = 'S3_CLIENT';

export const S3ClientProvider: Provider = {
  provide: S3_CLIENT,
  useFactory: () => {
    return new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      // maxAttempts for automatic retries
      maxAttempts: 5,
      // In production, IAM roles are used automatically (no credentials needed)
      // In dev, SDK will look for credentials in ~/.aws/credentials or environment
      ...(process.env.AWS_ENDPOINT && {
        endpoint: process.env.AWS_ENDPOINT,
        forcePathStyle: true, // Required for LocalStack
      }),
    });
  },
};

