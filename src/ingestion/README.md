# Ingestion Feature Documentation

## Overview

The Ingestion feature provides a production-ready file ingestion system that downloads files from URLs or accepts direct uploads, stores them in S3, and provides access through presigned URLs or direct downloads.

## Architecture

### Components

- **IngestionModule**: Main module that wires up all dependencies
- **IngestionController**: Handles URL-based ingestion and staged uploads
- **RecentController**: Lists recent files with presigned URLs
- **FilesController**: Direct file download through the server
- **IngestionService**: Business logic layer
- **IngestionWorker**: Background processing (application service, not a separate process)
- **S3Module**: Provides configured S3Client

### Database Schema

```prisma
model IngestionJob {
  id        String   @id @default(uuid())
  userId    String
  sourceUrl String
  status    String   // queued | downloading | uploading | completed | failed | staged
  s3Bucket  String?
  s3Key     String?
  sizeBytes BigInt?
  sha256    String?
  error     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId, createdAt])
}
```

## API Endpoints

### 1. Start Ingestion from URL

**POST** `/ingestions`

Downloads a file from a remote URL and uploads it to S3.

**Request:**
```json
{
  "sourceUrl": "https://example.com/files/project.zip"
}
```

**Response:**
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "queued"
}
```

**Flow:**
1. Creates job with status `queued`
2. Validates URL format
3. Triggers async download and upload
4. Returns immediately with job ID
5. Worker downloads file (with optional Authorization header)
6. Validates content type (must be ZIP)
7. Computes SHA-256 while streaming
8. Uploads to S3 with multipart upload (8MB parts)
9. Updates job status to `completed` with metadata

### 2. Stage File Upload

**POST** `/ingestions/stage`

Uploads a small file directly via multipart form data.

**Request:**
- Content-Type: `multipart/form-data`
- Field: `file` (ZIP file)

**Response:**
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "staged"
}
```

**Flow:**
1. Validates file size (must be < MAX_DB_STAGE_MB)
2. Validates file type (must be ZIP)
3. Creates job with status `staged`
4. Computes SHA-256
5. Uploads to S3 immediately
6. Updates status to `completed`

### 3. List Recent Files

**GET** `/recent?limit=20`

Lists recent completed ingestion jobs with presigned download URLs.

**Query Parameters:**
- `limit` (optional): Number of files to return (1-100, default: 20)

**Response:**
```json
[
  {
    "key": "ingestions/123/550e8400-e29b-41d4-a716-446655440000.zip",
    "createdAt": "2025-11-03T21:54:33.000Z",
    "sizeBytes": "1048576",
    "sha256": "abc123def456...",
    "url": "https://s3.amazonaws.com/bucket/key?X-Amz-Algorithm=..."
  }
]
```

**Features:**
- Only returns files owned by authenticated user
- Presigned URLs are time-limited (configured via SIGNED_URL_TTL)
- Ordered by creation time (newest first)

### 4. Direct File Download

**GET** `/files/:id`

Downloads a file by job ID, streaming from S3 through the server.

**Response:**
- Content-Type: `application/zip`
- Content-Disposition: `attachment; filename="<jobId>.zip"`
- Stream: File bytes

**Flow:**
1. Verifies job exists and user owns it
2. Validates job is completed
3. Gets S3 object metadata (HEAD request)
4. Streams file from S3 to response
5. Returns 404 if file not found or unauthorized

## Environment Variables

### Required

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5434/fabspace_db"

# JWT Authentication
JWT_SECRET="your-secret-key"

# S3 Configuration
S3_BUCKET="fabspace-ingestions"
AWS_REGION="us-east-1"
```

### Optional

```bash
# AWS KMS Encryption (recommended for production)
KMS_KEY_ID="arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012"

# AWS Custom Endpoint (for LocalStack in development)
AWS_ENDPOINT="http://localhost:4566"

# File Size Limits
MAX_DB_STAGE_MB="50"  # Maximum file size for staged uploads (default: 50MB)

# Presigned URL TTL
SIGNED_URL_TTL="3600"  # Seconds (default: 3600 = 1 hour)

# Partner API Token (TODO: Move to AWS Secrets Manager)
PARTNER_API_TOKEN="your-partner-api-token"
```

## AWS Credentials

### Production

Uses **IAM instance/task roles** (no static credentials needed).

- ECS Task Role
- EC2 Instance Role
- Lambda Execution Role

Ensure the role has the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectTagging",
        "s3:GetObject",
        "s3:HeadObject"
      ],
      "Resource": "arn:aws:s3:::fabspace-ingestions/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt",
        "kms:GenerateDataKey"
      ],
      "Resource": "arn:aws:kms:us-west-2:053199591967:key/c4e2274e-fcd2-4243-9a73-d5bb337c8455"
    }
  ]
}
```

### Development

Falls back to local AWS credentials:
- `~/.aws/credentials`
- AWS CLI configuration
- Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)

## Security Features

### Error Handling

**IngestionExceptionFilter** provides safe error responses:
- Sanitizes AWS SDK errors
- Hides sensitive information
- Logs detailed errors server-side
- Returns consistent error format

### Authentication

All endpoints require JWT authentication (`@UseGuards(AccessTokenGuard)`).

### File Validation

- Content type validation (must be ZIP)
- File size limits (configurable)
- Ownership verification
- URL validation

### S3 Security

- Optional KMS encryption
- User-based S3 key paths: `ingestions/{userId}/{jobId}.zip`
- Resource tagging with userId
- Presigned URLs with time limits

## TODOs

1. **Partner API Token Retrieval**: Currently uses environment variable. Should be moved to AWS Secrets Manager or similar secure storage.

2. **Queue System**: Consider using SQS or Bull for better job processing in high-scale scenarios.

3. **Job Status Monitoring**: Add webhooks or polling endpoint for job status updates.

4. **Retry Logic**: Add automatic retries for failed downloads.

5. **Cleanup Jobs**: Implement a cron job to clean up old/failed jobs.

6. **Metrics & Monitoring**: Add CloudWatch metrics for job success/failure rates.

## Installation

1. Install dependencies:

```bash
npm install @aws-sdk/client-s3 @aws-sdk/lib-storage @aws-sdk/s3-request-presigner undici
```

2. Run Prisma migration:

```bash
npx prisma migrate dev
```

3. Update `.env` with required environment variables

4. Start the application:

```bash
npm run dev
```

## Testing

Run unit tests:

```bash
npm test -- ingestion
```

Run e2e tests:

```bash
npm run test:e2e -- ingestion
```

## Swagger Documentation

API documentation is available at `/api` when the server is running.

## Examples

### cURL Examples

**Start ingestion:**
```bash
curl -X POST http://localhost:3000/ingestions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sourceUrl": "https://example.com/file.zip"}'
```

**Stage upload:**
```bash
curl -X POST http://localhost:3000/ingestions/stage \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/file.zip"
```

**List recent files:**
```bash
curl http://localhost:3000/recent?limit=10 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Download file:**
```bash
curl http://localhost:3000/files/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -o downloaded.zip
```

## Architecture Decisions

### Why Application Service (not Worker Process)?

The IngestionWorker is an application service, not a separate worker process, for simplicity. For production at scale, consider:
- AWS SQS + Lambda for serverless processing
- Bull + Redis for in-process job queues
- Separate worker containers in ECS

### Why Multipart Upload?

Uses AWS SDK's `Upload` class with 8MB parts for:
- Better reliability (automatic retries per part)
- Support for large files
- Efficient memory usage (streaming)

### Why SHA-256?

Computed during streaming for:
- Data integrity verification
- Deduplication support (future)
- Audit trail

### Why Presigned URLs?

For `GET /recent`:
- Reduces server load (clients download directly from S3)
- Better scalability
- Time-limited access

For `GET /files/:id`:
- Server-side validation and authorization
- Consistent error handling
- Additional processing (if needed)

## Production Checklist

- [ ] Configure IAM roles with least-privilege permissions
- [ ] Enable KMS encryption for S3
- [ ] Set up CloudWatch alarms for failed jobs
- [ ] Implement rate limiting
- [ ] Add request/response logging
- [ ] Set up S3 lifecycle policies for old files
- [ ] Move sensitive tokens to Secrets Manager
- [ ] Configure CORS for cross-origin uploads
- [ ] Set up VPC endpoints for S3 (cost optimization)
- [ ] Implement job cleanup cron
- [ ] Add metrics dashboards
- [ ] Set up alerts for disk space (if staging locally)

## How to use:
# 1. Request upload URL
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"filename": "project.zip"}' \
  http://your-api/ingestions/upload-url

# 2. Upload file to returned URL (direct to S3)
curl -X PUT \
  -H "Content-Type: application/zip" \
  --data-binary "@file.zip" \
  "PRESIGNED_URL_FROM_STEP_1"

# 3. Confirm upload
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://your-api/ingestions/JOB_ID/confirm

