# Quick Quote Integration - Implementation Summary

## Overview
This document describes the complete integration between the file ingestion system and the quick quote creation feature. When a user uploads a file to S3, a quick quote is automatically created and associated with the user.

## Changes Made

### 1. Updated `src/ingestion/ingestion.service.ts`
- **Added QuoteService injection** to enable quote creation from the ingestion service
- **Updated `confirmUpload` method** to automatically create a quick quote when a presigned URL upload is confirmed
- The quote creation happens after the file is verified in S3 and the job is marked as completed

### 2. Updated `src/schema.gql`
- **Added `QUICK_QUOTE` to QuoteType enum** to match the Prisma schema
- This ensures the GraphQL API can handle quick quote types

### 3. Updated `src/quote/entities/quote.entity.ts`
- **Added `QUICK_QUOTE` to the QuoteType enum** in the TypeScript entity definition
- The enum is properly registered with GraphQL via `registerEnumType`

### 4. Updated `src/ingestion/dto/ingestion-response.dto.ts`
- **Added `awaiting_upload` to the status enum** to properly document all possible job statuses

## Complete Upload Flow

### Flow 1: Presigned URL Upload (Large Files)
```
1. User calls POST /ingestions/upload-url
   → Creates job with status 'awaiting_upload'
   → Returns presigned URL

2. User uploads file directly to S3 using the presigned URL
   → File is stored at: s3://{bucket}/ingestions/{userId}/{jobId}.zip

3. User calls POST /ingestions/{jobId}/confirm
   → Verifies file exists in S3
   → Updates job status to 'completed'
   → 🆕 Automatically creates a QUICK_QUOTE tied to the user
   → Quote is created with:
     - quoteType: 'QUICK_QUOTE'
     - userId: from the user who uploaded
     - ingestionJobId: linked to the upload job
     - status: 'PENDING'
     - title: "Quick Quote: {filename}"
     - description: Auto-generated description

4. User can retrieve quotes via GraphQL:
   query {
     quickQuotations {
       quoteId
       quoteName
       title
       description
       status
       createdAt
     }
   }
```

### Flow 2: URL-based Ingestion
```
1. User calls POST /ingestions with sourceUrl
   → Downloads file from URL
   → Uploads to S3
   → Creates QUICK_QUOTE automatically (via IngestionWorker.runJob)
```

### Flow 3: Staged Upload (Small Files)
```
1. User calls POST /ingestions/stage with multipart form data
   → Processes file immediately
   → Uploads to S3
   → Creates QUICK_QUOTE automatically (via IngestionWorker.handleStagedUpload)
```

## Quote Creation Details

### Quote Service Method
The `createQuickQuotation` method in `QuoteService`:
- Checks if a quote already exists for the ingestion job (prevents duplicates)
- Generates a unique quote ID based on the user's company name
- Extracts filename from the source URL for the quote name
- Creates a quote with sensible defaults:
  - `quoteType`: 'QUICK_QUOTE'
  - `status`: 'PENDING'
  - `budget`: 0 (can be updated by user later)
  - `turnTime`: 0
  - `isDraft`: false
  - `quoteMaterials`: []
  - `quoteFiles`: []

### User Association
- The quote is tied to the user via the `userId` field
- The user ID is converted from string (stored in IngestionJob) to number (required by Quote)
- Only the user who created the ingestion job can access their quotes

## API Endpoints

### REST Endpoints (Ingestion)
- `POST /ingestions/upload-url` - Generate presigned upload URL
- `POST /ingestions/:id/confirm` - Confirm upload completion (creates quote)
- `POST /ingestions` - Start URL-based ingestion (creates quote)
- `POST /ingestions/stage` - Stage small file upload (creates quote)

### GraphQL Endpoints (Quotes)
- `query quickQuotations` - Get all quick quotes for the authenticated user
- `query quote(quoteId: String!)` - Get a specific quote by ID
- `query myQuotes` - Get all quotes for the user (including quick quotes)

## Data Models

### IngestionJob (Prisma)
```prisma
model IngestionJob {
  id        String   @id @default(uuid())
  userId    String   // Stored as string
  sourceUrl String
  status    String   // queued | downloading | uploading | completed | failed | staged | awaiting_upload
  s3Bucket  String?
  s3Key     String?
  sizeBytes BigInt?
  sha256    String?
  error     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  quote     Quote?   // One-to-one relation
}
```

### Quote (Prisma)
```prisma
model Quote {
  id             Int            @id @default(autoincrement())
  quoteId        String         @unique
  userId         Int            // Stored as number
  ingestionJobId String?        @unique
  ingestionJob   IngestionJob?  @relation(fields: [ingestionJobId], references: [id])
  quoteType      QuoteType      @default(OPEN_QUOTE)
  status         QuoteStatus    @default(PENDING)
  // ... other fields
}

enum QuoteType {
  OPEN_QUOTE
  FIXED_QUOTE
  QUICK_QUOTE  // 🆕 Added for automatic quotes
}
```

## Error Handling

### Quote Creation Failures
- If quote creation fails, the ingestion job still completes successfully
- Errors are logged but don't cause the upload to fail
- This ensures file uploads aren't blocked by quote creation issues

### Duplicate Prevention
- The `createQuickQuotation` method checks for existing quotes with the same `ingestionJobId`
- Returns existing quote if found (idempotent)

## Testing

### Manual Testing Steps
1. **Get Upload URL**
   ```bash
   curl -X POST http://localhost:3000/ingestions/upload-url \
     -H "Authorization: Bearer {token}" \
     -H "Content-Type: application/json" \
     -d '{"filename": "project.zip"}'
   ```

2. **Upload File to S3**
   ```bash
   curl -X PUT "{uploadUrl}" \
     -H "Content-Type: application/zip" \
     --data-binary @project.zip
   ```

3. **Confirm Upload**
   ```bash
   curl -X POST http://localhost:3000/ingestions/{jobId}/confirm \
     -H "Authorization: Bearer {token}" \
     -H "Content-Type: application/json" \
     -d '{}'
   ```

4. **Get Quick Quotes**
   ```graphql
   query {
     quickQuotations {
       quoteId
       quoteName
       title
       description
       status
       createdAt
       user {
         email
         firstName
         lastName
       }
     }
   }
   ```

## Security Considerations

- All endpoints require authentication via `AccessTokenGuard`
- Users can only access their own ingestion jobs and quotes
- S3 uploads use presigned URLs with time-based expiration (default 1 hour)
- Optional KMS encryption for S3 objects

## Future Enhancements

1. **Add REST endpoint for quick quotes** (currently only GraphQL)
2. **Compute SHA-256 hash** for presigned URL uploads (currently only for URL/staged uploads)
3. **Add webhook notifications** when quotes are created
4. **Allow customization** of default quote values
5. **Add quote templates** for different file types

