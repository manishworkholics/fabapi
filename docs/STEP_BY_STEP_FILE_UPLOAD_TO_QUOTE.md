# Step-by-Step: Create Quote from File Upload

This guide shows you **exactly** how to upload a file and automatically create a quote. There are three different methods you can use.

---

## Method 1: Presigned URL Upload (Recommended for Large Files)

This is a **3-step process** for files larger than 50MB.

### Step 1: Request a Presigned Upload URL

**API Call:**
```bash
POST /ingestions/upload-url
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "filename": "my-pcb-design.zip"
}
```

**Example with cURL:**
```bash
curl -X POST http://localhost:3000/ingestions/upload-url \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "my-pcb-design.zip"
  }'
```

**Response:**
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "uploadUrl": "https://fabspace-ingestions.s3.amazonaws.com/ingestions/123/550e8400-e29b-41d4-a716-446655440000.zip?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...",
  "s3Key": "ingestions/123/550e8400-e29b-41d4-a716-446655440000.zip",
  "expiresIn": 3600,
  "fields": {
    "Content-Type": "application/zip"
  }
}
```

**What happens:**
- ✅ A new ingestion job is created with status `awaiting_upload`
- ✅ A presigned URL is generated (valid for 1 hour)
- ✅ You receive a `jobId` to track the upload
- ⏳ **No quote created yet** - waiting for file upload

---

### Step 2: Upload Your File to S3

**API Call:**
```bash
PUT {uploadUrl}
Content-Type: application/zip
```

**Example with cURL:**
```bash
curl -X PUT "https://fabspace-ingestions.s3.amazonaws.com/ingestions/123/550e8400-e29b-41d4-a716-446655440000.zip?X-Amz-Algorithm=..." \
  -H "Content-Type: application/zip" \
  --data-binary @/path/to/my-pcb-design.zip
```

**Example with JavaScript (Browser):**
```javascript
const file = document.getElementById('fileInput').files[0];

const response = await fetch(uploadUrl, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/zip'
  },
  body: file
});

if (response.ok) {
  console.log('File uploaded successfully!');
  const etag = response.headers.get('ETag');
  console.log('ETag:', etag); // Save this for step 3 (optional)
}
```

**Example with Python:**
```python
import requests

with open('my-pcb-design.zip', 'rb') as file:
    response = requests.put(
        upload_url,
        data=file,
        headers={'Content-Type': 'application/zip'}
    )
    
if response.status_code == 200:
    print('File uploaded successfully!')
    etag = response.headers.get('ETag')
    print(f'ETag: {etag}')
```

**Response:**
```
HTTP 200 OK
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
```

**What happens:**
- ✅ File is uploaded directly to S3
- ✅ S3 returns an ETag (hash of the file)
- ⏳ **Still no quote created** - need to confirm upload

---

### Step 3: Confirm Upload & Create Quote

**API Call:**
```bash
POST /ingestions/{jobId}/confirm
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

**Request Body (optional):**
```json
{
  "etag": "\"33a64df551425fcc55e4d42a148795d9f25f89d4\""
}
```

**Example with cURL:**
```bash
curl -X POST http://localhost:3000/ingestions/550e8400-e29b-41d4-a716-446655440000/confirm \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "etag": "\"33a64df551425fcc55e4d42a148795d9f25f89d4\""
  }'
```

**Response:**
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed"
}
```

**What happens:**
- ✅ Server verifies file exists in S3
- ✅ Ingestion job status updated to `completed`
- ✅ **🎉 QUICK QUOTE AUTOMATICALLY CREATED!** 🎉
- ✅ Quote is linked to your user account
- ✅ Quote is linked to the ingestion job

---

### Step 4: Retrieve Your Quote

**Option A: Get All Quick Quotes (GraphQL)**

```graphql
query {
  quickQuotations {
    quoteId
    quoteName
    title
    description
    status
    quoteType
    budget
    turnTime
    createdAt
    user {
      id
      email
      firstName
      lastName
    }
    bids {
      id
      amount
      bidder {
        email
      }
    }
  }
}
```

**Example Response:**
```json
{
  "data": {
    "quickQuotations": [
      {
        "quoteId": "ACME-2024-001",
        "quoteName": "my-pcb-design",
        "title": "Quick Quote: my-pcb-design",
        "description": "Auto-generated quick quotation for ingested application from my-pcb-design.zip",
        "status": "PENDING",
        "quoteType": "QUICK_QUOTE",
        "budget": 0,
        "turnTime": 0,
        "createdAt": "2024-11-04T12:30:00Z",
        "user": {
          "id": "123",
          "email": "user@example.com",
          "firstName": "John",
          "lastName": "Doe"
        },
        "bids": []
      }
    ]
  }
}
```

**Option B: Get Specific Quote by ID (GraphQL)**

```graphql
query {
  quote(quoteId: "ACME-2024-001") {
    quoteId
    quoteName
    title
    description
    status
    quoteType
    quoteMaterials
    quoteFiles
    pcbBoards
    stencils
    components
    turnTime
    budget
    hasNDA
    createdAt
    updatedAt
  }
}
```

**Option C: Get All Your Quotes (includes Quick Quotes)**

```graphql
query {
  myQuotes(params: {
    sortBy: createdAt
    sortOrder: desc
    page: 1
    limit: 10
  }) {
    quotes {
      quoteId
      quoteName
      title
      quoteType
      status
      createdAt
    }
    totalCount
  }
}
```

---

## Method 2: Direct Upload (For Files Under 50MB)

This is a **1-step process** for smaller files.

### Single Step: Upload File Directly

**API Call:**
```bash
POST /ingestions/stage
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: multipart/form-data
```

**Example with cURL:**
```bash
curl -X POST http://localhost:3000/ingestions/stage \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "file=@/path/to/my-pcb-design.zip"
```

**Example with JavaScript (Browser):**
```javascript
const formData = new FormData();
const fileInput = document.getElementById('fileInput');
formData.append('file', fileInput.files[0]);

const response = await fetch('http://localhost:3000/ingestions/stage', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  },
  body: formData
});

const result = await response.json();
console.log('Job ID:', result.jobId);
console.log('Status:', result.status);
```

**Example with Python:**
```python
import requests

files = {'file': open('my-pcb-design.zip', 'rb')}
headers = {'Authorization': f'Bearer {access_token}'}

response = requests.post(
    'http://localhost:3000/ingestions/stage',
    files=files,
    headers=headers
)

result = response.json()
print(f"Job ID: {result['jobId']}")
print(f"Status: {result['status']}")
```

**Response:**
```json
{
  "jobId": "660e8400-e29b-41d4-a716-446655440111",
  "status": "staged"
}
```

**What happens:**
- ✅ File is uploaded to the server
- ✅ Server immediately uploads to S3
- ✅ Ingestion job status updated to `completed`
- ✅ **🎉 QUICK QUOTE AUTOMATICALLY CREATED!** 🎉

Then use **Step 4** above to retrieve your quote!

---

## Method 3: Upload from URL

This is a **1-step process** if your file is already hosted somewhere.

### Single Step: Provide File URL

**API Call:**
```bash
POST /ingestions
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "sourceUrl": "https://example.com/files/my-pcb-design.zip"
}
```

**Example with cURL:**
```bash
curl -X POST http://localhost:3000/ingestions \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "sourceUrl": "https://example.com/files/my-pcb-design.zip"
  }'
```

**Response:**
```json
{
  "jobId": "770e8400-e29b-41d4-a716-446655440222",
  "status": "queued"
}
```

**What happens:**
- ✅ Server downloads file from the URL (async)
- ✅ Server uploads to S3
- ✅ Ingestion job status updated to `completed`
- ✅ **🎉 QUICK QUOTE AUTOMATICALLY CREATED!** 🎉
- ⏱️ This happens in the background (may take a few seconds/minutes)

Then use **Step 4** above to retrieve your quote!

---

## Complete Frontend Example (React + TypeScript)

Here's a complete example showing the full flow:

```typescript
import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

const GET_QUICK_QUOTES = gql`
  query GetQuickQuotes {
    quickQuotations {
      quoteId
      quoteName
      title
      description
      status
      createdAt
    }
  }
`;

function FileUploadToQuote() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  
  const { data, refetch } = useQuery(GET_QUICK_QUOTES);

  const handleFileUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    
    try {
      // Step 1: Get presigned URL
      const urlResponse = await fetch('/ingestions/upload-url', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ filename: file.name })
      });
      
      const { jobId, uploadUrl } = await urlResponse.json();
      setJobId(jobId);
      
      // Step 2: Upload to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/zip'
        },
        body: file
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }
      
      const etag = uploadResponse.headers.get('ETag');
      
      // Step 3: Confirm upload
      const confirmResponse = await fetch(`/ingestions/${jobId}/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ etag })
      });
      
      if (!confirmResponse.ok) {
        throw new Error('Confirmation failed');
      }
      
      alert('✅ File uploaded and quote created successfully!');
      
      // Step 4: Refresh quotes
      await refetch();
      
    } catch (error) {
      console.error('Upload error:', error);
      alert('❌ Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h2>Upload File & Create Quote</h2>
      
      <input
        type="file"
        accept=".zip"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      
      <button onClick={handleFileUpload} disabled={!file || uploading}>
        {uploading ? 'Uploading...' : 'Upload & Create Quote'}
      </button>
      
      {jobId && <p>Job ID: {jobId}</p>}
      
      <h3>Your Quick Quotes</h3>
      {data?.quickQuotations?.map((quote: any) => (
        <div key={quote.quoteId} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
          <h4>{quote.quoteName}</h4>
          <p><strong>Quote ID:</strong> {quote.quoteId}</p>
          <p><strong>Title:</strong> {quote.title}</p>
          <p><strong>Status:</strong> {quote.status}</p>
          <p><strong>Created:</strong> {new Date(quote.createdAt).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}

export default FileUploadToQuote;
```

---

## Troubleshooting

### Issue: Quote not created after upload

**Check:**
1. Verify the file was actually uploaded to S3
2. Check server logs for errors
3. Ensure the confirmation step succeeded
4. Query GraphQL to see if quote exists:
   ```graphql
   query {
     quickQuotations {
       quoteId
     }
   }
   ```

### Issue: "Job not found" error

**Solution:**
- Make sure you're using the correct `jobId` from Step 1
- Verify you're authenticated as the same user who created the job

### Issue: Upload URL expired

**Solution:**
- Presigned URLs expire after 1 hour (configurable)
- Request a new URL and start over

### Issue: File not found in S3

**Solution:**
- Ensure Step 2 (actual upload to S3) succeeded
- Check that you used the exact `uploadUrl` from Step 1
- Verify file size isn't 0 bytes

---

## Summary

| Method | Steps | Use Case | Quote Created |
|--------|-------|----------|---------------|
| **Presigned URL** | 3 steps | Large files (>50MB) | ✅ After confirmation |
| **Direct Upload** | 1 step | Small files (<50MB) | ✅ Immediately |
| **URL Ingestion** | 1 step | File already hosted | ✅ After download completes |

All methods automatically create a `QUICK_QUOTE` that:
- ✅ Is tied to your user account
- ✅ Has status `PENDING`
- ✅ Can be retrieved via GraphQL `quickQuotations` query
- ✅ Can receive bids from EMS providers
- ✅ Can be updated/edited by the user later

