# Uploading Large Files with Presigned URLs

This guide explains how to upload large files directly to S3 using presigned URLs.

## Overview

For large files (>50MB), you can use the presigned URL approach which allows direct upload to S3 without streaming through the server. This is more efficient and supports files of any size.

## Upload Flow

```
Client                     API Server                    S3
  |                             |                         |
  |-- 1. Request Upload URL --->|                         |
  |                             |                         |
  |<--- 2. Return URL + JobID --|                         |
  |                             |                         |
  |------------- 3. Upload File Directly ----------------->|
  |                             |                         |
  |-- 4. Confirm Upload ------->|                         |
  |                             |--- Verify File Exists ->|
  |                             |                         |
  |<--- 5. Confirmation --------|                         |
```

## Step-by-Step Guide

### Step 1: Request Upload URL

**Endpoint:** `POST /ingestions/upload-url`

**Request:**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"filename": "my-project.zip"}' \
  https://api.fabspace.com/ingestions/upload-url
```

**Response:**
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "uploadUrl": "https://fabspace-ingestions.s3.amazonaws.com/ingestions/user123/550e8400-e29b-41d4-a716-446655440000.zip?X-Amz-Algorithm=AWS4-HMAC-SHA256&...",
  "s3Key": "ingestions/user123/550e8400-e29b-41d4-a716-446655440000.zip",
  "expiresIn": 3600,
  "fields": {
    "Content-Type": "application/zip",
    "x-amz-server-side-encryption": "aws:kms",
    "x-amz-server-side-encryption-aws-kms-key-id": "arn:aws:kms:..."
  }
}
```

### Step 2: Upload File to S3

Use the presigned URL to upload your file directly to S3:

**Using cURL:**
```bash
curl -X PUT \
  -H "Content-Type: application/zip" \
  -H "x-amz-server-side-encryption: aws:kms" \
  -H "x-amz-server-side-encryption-aws-kms-key-id: arn:aws:kms:..." \
  --data-binary "@/path/to/your/file.zip" \
  "https://fabspace-ingestions.s3.amazonaws.com/ingestions/user123/550e8400-e29b-41d4-a716-446655440000.zip?X-Amz-Algorithm=..."
```

**Using JavaScript/Fetch:**
```javascript
async function uploadFile(uploadUrl, file, fields) {
  const headers = {
    'Content-Type': fields['Content-Type'],
  };
  
  // Add KMS headers if present
  if (fields['x-amz-server-side-encryption']) {
    headers['x-amz-server-side-encryption'] = fields['x-amz-server-side-encryption'];
  }
  if (fields['x-amz-server-side-encryption-aws-kms-key-id']) {
    headers['x-amz-server-side-encryption-aws-kms-key-id'] = 
      fields['x-amz-server-side-encryption-aws-kms-key-id'];
  }

  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: headers,
    body: file,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  // Get ETag from response
  const etag = response.headers.get('ETag');
  return etag;
}

// Usage
const file = document.getElementById('fileInput').files[0];
const etag = await uploadFile(response.uploadUrl, file, response.fields);
```

**Using Python:**
```python
import requests

def upload_file(upload_url, file_path, fields):
    headers = {
        'Content-Type': fields['Content-Type'],
    }
    
    # Add KMS headers if present
    if 'x-amz-server-side-encryption' in fields:
        headers['x-amz-server-side-encryption'] = fields['x-amz-server-side-encryption']
    if 'x-amz-server-side-encryption-aws-kms-key-id' in fields:
        headers['x-amz-server-side-encryption-aws-kms-key-id'] = \
            fields['x-amz-server-side-encryption-aws-kms-key-id']
    
    with open(file_path, 'rb') as f:
        response = requests.put(upload_url, headers=headers, data=f)
    
    response.raise_for_status()
    return response.headers.get('ETag')

# Usage
etag = upload_file(
    upload_url=response['uploadUrl'],
    file_path='/path/to/file.zip',
    fields=response['fields']
)
```

### Step 3: Confirm Upload

After successfully uploading to S3, confirm the upload with the API:

**Endpoint:** `POST /ingestions/:jobId/confirm`

**Request:**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"etag": "\"33a64df551425fcc55e4d42a148795d9f25f89d4\""}' \
  https://api.fabspace.com/ingestions/550e8400-e29b-41d4-a716-446655440000/confirm
```

**Response:**
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed"
}
```

## Complete Example (JavaScript)

```javascript
async function uploadLargeFile(file, accessToken) {
  const API_BASE = 'https://api.fabspace.com';
  
  // Step 1: Request upload URL
  const urlResponse = await fetch(`${API_BASE}/ingestions/upload-url`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ filename: file.name }),
  });
  
  if (!urlResponse.ok) {
    throw new Error('Failed to get upload URL');
  }
  
  const { jobId, uploadUrl, fields } = await urlResponse.json();
  console.log(`Got upload URL for job: ${jobId}`);
  
  // Step 2: Upload file to S3
  const headers = {
    'Content-Type': fields['Content-Type'],
  };
  
  if (fields['x-amz-server-side-encryption']) {
    headers['x-amz-server-side-encryption'] = fields['x-amz-server-side-encryption'];
  }
  if (fields['x-amz-server-side-encryption-aws-kms-key-id']) {
    headers['x-amz-server-side-encryption-aws-kms-key-id'] = 
      fields['x-amz-server-side-encryption-aws-kms-key-id'];
  }
  
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: headers,
    body: file,
  });
  
  if (!uploadResponse.ok) {
    throw new Error('Failed to upload file to S3');
  }
  
  const etag = uploadResponse.headers.get('ETag');
  console.log('File uploaded successfully');
  
  // Step 3: Confirm upload
  const confirmResponse = await fetch(
    `${API_BASE}/ingestions/${jobId}/confirm`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ etag }),
    }
  );
  
  if (!confirmResponse.ok) {
    throw new Error('Failed to confirm upload');
  }
  
  const result = await confirmResponse.json();
  console.log('Upload confirmed:', result);
  
  return result;
}

// Usage
const fileInput = document.getElementById('fileInput');
const file = fileInput.files[0];
const accessToken = 'your-jwt-token';

uploadLargeFile(file, accessToken)
  .then(result => console.log('Success:', result))
  .catch(error => console.error('Error:', error));
```

## Important Notes

### File Requirements
- **Must be a ZIP file** - Only `.zip` files are accepted
- **No size limit** - Presigned URLs support files of any size
- **Expiration** - Upload URLs expire after 1 hour (configurable via `SIGNED_URL_TTL`)

### Headers
When uploading to S3, you **must** include:
- `Content-Type: application/zip`
- Any KMS encryption headers provided in the `fields` object

### Error Handling

**If upload to S3 fails:**
- The job will remain in `awaiting_upload` status
- You can request a new upload URL and retry
- The job will be cleaned up after 24 hours (if configured)

**If confirmation fails:**
- Make sure the file was actually uploaded to S3
- Verify you're using the correct job ID
- Check that the upload URL hasn't expired

### Job Status Flow
1. `awaiting_upload` - Job created, waiting for file upload
2. `completed` - File uploaded and verified in S3

## Alternative: Small Files

For files under 50MB (configurable), you can use the simpler multipart upload:

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@/path/to/file.zip" \
  https://api.fabspace.com/ingestions/stage
```

This uploads the file through the server and completes immediately.

## Environment Variables

- `S3_BUCKET` - S3 bucket name (default: `fabspace-ingestions`)
- `SIGNED_URL_TTL` - Presigned URL expiration in seconds (default: `3600`)
- `KMS_KEY_ID` - KMS key for encryption (optional)
- `MAX_DB_STAGE_MB` - Maximum size for staged uploads (default: `50`)

## Security

- All endpoints require JWT authentication
- Files are stored with user-based S3 keys: `ingestions/{userId}/{jobId}.zip`
- Optional KMS encryption for files at rest
- Presigned URLs are time-limited
- User ownership is verified at every step

