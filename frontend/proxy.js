import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import fetch from 'node-fetch';
import bodyParser from 'body-parser';
import multer from 'multer'; // Import multer for handling multipart/form-data

const app = express();
const PROXY_PORT = 5001;

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() }); // Store files in memory

// Enable CORS for your frontend origin
app.use(cors({
  origin: "http://localhost:5000",
  credentials: false
}));

// ---- Keycloak Service Account Configuration ----
const KEYCLOAK_BASE_URL = process.env.KEYCLOAK_BASE_URL || "http://localhost:8080";
const KEYCLOAK_REALM = "myrealm"; 
const KEYCLOAK_CLIENT_ID = "myclient";
const KEYCLOAK_CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET || "5ahtCMZjoBpa4YzHzDSj4MAZlRlMPuTO";

console.log(`Proxy: Initializing with Keycloak at ${KEYCLOAK_BASE_URL}`);
console.log(`Proxy: Realm: ${KEYCLOAK_REALM}, Client: ${KEYCLOAK_CLIENT_ID}`);
console.log(`Proxy: Client Secret: ${KEYCLOAK_CLIENT_SECRET ? '[SET]' : '[NOT SET]'}`);

// (Optional) simple token cache for the service account token
let cachedServiceToken = null;
let serviceTokenExpiresAt = 0;

async function getServiceAccountToken() {
  const now = Date.now();
  if (cachedServiceToken && now < serviceTokenExpiresAt - 5000) {
    return cachedServiceToken;
  }

  console.log("Fetching new Keycloak service account token...");
  const url = `${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;
  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", KEYCLOAK_CLIENT_ID);
  params.append("client_secret", KEYCLOAK_CLIENT_SECRET);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Keycloak service account token fetch failed: ${res.status} ${text}`);
    }

    const data = await res.json();
    cachedServiceToken = data.access_token;
    serviceTokenExpiresAt = Date.now() + (data.expires_in * 1000);
    console.log("Keycloak service account token obtained successfully.");
    return cachedServiceToken;
  } catch (error) {
    console.error("Error getting Keycloak service account token:", error);
    throw error;
  }
}

// Test token endpoint for debugging
app.get('/api/test-token', async (req, res) => {
  const userToken = req.headers.authorization?.replace('Bearer ', '');
  
  if (!userToken) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const response = await fetch(`${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/userinfo`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    
    if (response.ok) {
      const userInfo = await response.json();
      
      let tokenPayload = {};
      try {
        tokenPayload = JSON.parse(atob(userToken.split('.')[1]));
      } catch (e) {
        console.error('Failed to decode token:', e);
      }
      
      res.json({ 
        valid: true, 
        user: userInfo,
        roles: {
          realm_access: tokenPayload.realm_access,
          resource_access: tokenPayload.resource_access
        },
        message: 'Token is valid'
      });
    } else {
      res.status(401).json({ 
        valid: false, 
        message: `Token validation failed: ${response.status}` 
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// FIXED: Custom Keycloak API handler with proper organization member handling
app.use('/api/keycloak', express.raw({ type: 'application/json' }), async (req, res) => {
  console.log(`\n--- PROXY REQUEST ---`);
  console.log(`Proxy: Received ${req.method} request to ${req.originalUrl}`);
  console.log(`Proxy: Path: ${req.path}`);
  console.log(`Proxy: Query: ${JSON.stringify(req.query)}`);
  
  const userToken = req.headers.authorization?.replace('Bearer ', '');
  
  if (!userToken) {
    console.log('Proxy: ❌ No authorization token provided');
    return res.status(401).json({ error: 'No authorization token' });
  }

  let targetPath = req.originalUrl.replace('/api/keycloak', '');
  
  let queryString = '';
  if (Object.keys(req.query).length > 0) {
    queryString = '?' + new URLSearchParams(req.query).toString();
    const queryIndex = targetPath.indexOf('?');
    if (queryIndex !== -1) {
      targetPath = targetPath.substring(0, queryIndex);
    }
  }
  
  if (!targetPath.startsWith('/admin')) {
    targetPath = '/admin' + targetPath;
  }
  
  const keycloakUrl = `${KEYCLOAK_BASE_URL}${targetPath}${queryString}`;
  console.log(`Proxy: 🎯 Forwarding to Keycloak: ${req.method} ${keycloakUrl}`);
  
  try {
    const requestOptions = {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    // Handle request body
    if (req.method !== 'GET' && req.method !== 'DELETE' && req.method !== 'HEAD') {
      // Special handling for Organization Members API
      if (
        req.method === 'POST' &&
        /^\/admin\/realms\/[^/]+\/organizations\/[^/]+\/members$/.test(targetPath)
      ) {
        // Parse the raw buffer to get the user ID
        let bodyString = req.body.toString('utf8');
        console.log('Proxy: Raw body string:', bodyString);
        
        // Parse the JSON to extract the user ID
        let userId;
        try {
          // If it's already a JSON string like "user-id", parse it
          if (bodyString.startsWith('"') && bodyString.endsWith('"')) {
            userId = JSON.parse(bodyString);
          } else {
            // Otherwise parse as JSON object or use as plain string
            try {
              const parsed = JSON.parse(bodyString);
              userId = typeof parsed === 'string' ? parsed : parsed.userId || parsed.id;
            } catch {
              userId = bodyString;
            }
          }
        } catch (error) {
          console.error('Failed to parse body:', error);
          return res.status(400).json({ error: 'Invalid request body format' });
        }
        
        // Format as raw JSON string for Keycloak
        requestOptions.body = `"${userId}"`;
        console.log('Proxy: [Organization AddMember] Sending to Keycloak:', requestOptions.body);
      } else if (req.body && req.body.length > 0) {
        // For all other endpoints, forward the body as-is
        requestOptions.body = req.body.toString('utf8');
        console.log(`Proxy: 📤 Standard body:`, requestOptions.body);
      }
    }

    console.log(`Proxy: 🔄 Making request with method: ${requestOptions.method}`);

    const response = await fetch(keycloakUrl, requestOptions);
    
    console.log(`Proxy: ✅ Keycloak response status: ${response.status} ${response.statusText}`);

    if (response.status === 204) {
      console.log('Proxy: ✅ Keycloak returned 204 No Content - operation successful');
      return res.status(200).json({ ok: true, message: 'Operation successful' });
    }

    if (response.status === 201) {
      console.log('Proxy: ✅ Keycloak returned 201 Created - resource created successfully');
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log(`Proxy: 📥 Created resource response:`, data);
        return res.status(201).json(data);
      } else {
        return res.status(201).json({ ok: true, message: 'Resource created successfully' });
      }
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log(`Proxy: 📥 Keycloak JSON response (${data.length || Object.keys(data).length} items):`, 
        Array.isArray(data) ? `[Array of ${data.length} items]` : data);
      return res.status(response.status).json(data);
    } else {
      const text = await response.text();
      console.log(`Proxy: 📥 Keycloak text response:`, text.substring(0, 200) + (text.length > 200 ? '...' : ''));
      
      if (response.ok) {
        return res.status(response.status).json({ ok: true, message: text || 'Operation successful' });
      } else {
        console.log(`Proxy: ❌ Error response: ${response.status}`);
        return res.status(response.status).json({ error: text || `HTTP ${response.status} Error` });
      }
    }

  } catch (error) {
    console.error('Proxy: ❌ Error communicating with Keycloak:', error.message);
    console.error('Proxy: ❌ Error details:', error);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'Cannot connect to Keycloak server',
        details: `Connection refused to ${KEYCLOAK_BASE_URL}`,
        suggestion: 'Check if Keycloak is running'
      });
    } else if (error.code === 'ENOTFOUND') {
      return res.status(503).json({ 
        error: 'Keycloak server not found',
        details: `Could not resolve ${KEYCLOAK_BASE_URL}`,
        suggestion: 'Check Keycloak URL configuration'
      });
    } else if (error.name === 'AbortError') {
      return res.status(408).json({ 
        error: 'Request timeout',
        details: 'Request to Keycloak timed out'
      });
    } else {
      return res.status(500).json({ 
        error: 'Proxy error communicating with Keycloak',
        details: error.message
      });
    }
  }
});

// --- NEW FILE UPLOAD AND MANAGEMENT ROUTES ---
// These routes will forward to your actual backend service for file storage and database interaction.
// You need to implement the backend service that listens to these endpoints.

// Endpoint for batch file upload
app.post('/api/upload-batch', upload.array('files'), async (req, res) => {
  console.log('\n--- FILE UPLOAD PROXY ---');
  console.log('Proxy: Received batch file upload request.');
  
  const userToken = req.headers.authorization?.replace('Bearer ', '');
  if (!userToken) {
    return res.status(401).json({ error: 'No authorization token' });
  }

  // Extract metadata from body (parsed by multer as req.body)
  const { agent, organizationId, organizationName, dataSourceOption, googleDriveCredentials } = req.body;
  const files = req.files; // Removed 'as Express.Multer.File[]'
  
  console.log('Proxy: Upload metadata:', { agent, organizationId, organizationName, dataSourceOption });
  console.log('Proxy: Number of files:', files ? files.length : 0);
  if (googleDriveCredentials) {
    console.log('Proxy: Google Drive credentials provided.');
  }

  // --- IMPORTANT: Implement your actual backend logic here ---
  // This is where you would:
  // 1. Validate the organizationId and agent.
  // 2. Store the files (e.g., to S3, Google Cloud Storage, or local disk).
  // 3. Persist file metadata (filename, path, uploadDate, uploadedBy, organizationId, agent, etc.) in your database.
  // 4. Ensure transactional integrity: if any file upload or database record fails, roll back the entire batch.
  // 5. Handle Google Drive credentials if dataSourceOption is 'connect-to-google-drive'.

  // For demonstration, we'll just return a success message.
  if (!organizationId || !agent || (!files && !googleDriveCredentials)) {
    return res.status(400).json({ error: 'Missing required fields for upload.' });
  }

  // Simulate backend processing
  const uploadedFileRecords = files.map(file => ({
  id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
  filename: file.originalname,
  uploadDate: new Date().toISOString(),
  uploadedBy: 'current_user_id_from_token', // Extract from userToken
  organizationId: organizationId,
  organizationName: organizationName,
  agent: agent,
  status: 'completed',
  fileSize: file.size,
  fileType: file.mimetype,
}));


  console.log('Proxy: Simulated batch upload success.');
  res.status(200).json({ 
    message: 'Files uploaded and processed successfully (simulated).',
    uploadedFiles: uploadedFileRecords
  });
});

// Endpoint to get uploaded files for an organization and agent
app.get('/api/uploaded-files', async (req, res) => {
  console.log('\n--- FETCH UPLOADED FILES PROXY ---');
  console.log('Proxy: Received request to fetch uploaded files.');

  const userToken = req.headers.authorization?.replace('Bearer ', '');
  if (!userToken) {
    return res.status(401).json({ error: 'No authorization token' });
  }

  const { organizationId, agent } = req.query;

  if (!organizationId || !agent) {
    return res.status(400).json({ error: 'Missing organizationId or agent query parameters.' });
  }

  console.log(`Proxy: Fetching files for Org: ${organizationId}, Agent: ${agent}`);

  // --- IMPORTANT: Implement your actual backend logic here ---
  // This is where you would:
  // 1. Query your database for files associated with the given organizationId and agent.
  // 2. Return a list of file metadata.

  // Simulate database response
  const simulatedFiles = [
    { id: 'file-1', filename: 'sales_q1_2023.csv', uploadDate: '2023-01-15T10:00:00Z', uploadedBy: 'user1', organizationId: 'org-1', organizationName: 'Acme Corp', agent: 'business-vitality-agent', status: 'completed', fileSize: 12345, fileType: 'text/csv' },
    { id: 'file-2', filename: 'customer_feedback.json', uploadDate: '2023-02-20T11:30:00Z', uploadedBy: 'user2', organizationId: 'org-1', organizationName: 'Acme Corp', agent: 'customer-analyzer-agent', status: 'completed', fileSize: 54321, fileType: 'application/json' },
    { id: 'file-3', filename: 'mission_report.xlsx', uploadDate: '2023-03-10T14:00:00Z', uploadedBy: 'user1', organizationId: 'org-2', organizationName: 'Globex Inc', agent: 'mission-alignment-agent', status: 'processing', fileSize: 98765, fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  ];

  const filteredFiles = simulatedFiles.filter(file => 
    file.organizationId === organizationId && file.agent === agent
  );

  console.log(`Proxy: Simulated ${filteredFiles.length} files found.`);
  res.status(200).json(filteredFiles);
});

// Endpoint to delete an uploaded file
app.delete('/api/uploaded-files/:fileId', async (req, res) => {
  console.log('\n--- DELETE UPLOADED FILE PROXY ---');
  console.log('Proxy: Received request to delete file.');

  const userToken = req.headers.authorization?.replace('Bearer ', '');
  if (!userToken) {
    return res.status(401).json({ error: 'No authorization token' });
  }

  const { fileId } = req.params;

  // --- IMPORTANT: Implement your actual backend logic here ---
  // This is where you would:
  // 1. Delete the file from your storage.
  // 2. Remove its record from your database.

  // Simulate deletion
  console.log(`Proxy: Simulated deletion of file: ${fileId}`);
  res.status(200).json({ message: `File ${fileId} deleted successfully (simulated).` });
});

// Endpoint to download an uploaded file
app.get('/api/uploaded-files/:fileId/download', async (req, res) => {
  console.log('\n--- DOWNLOAD UPLOADED FILE PROXY ---');
  console.log('Proxy: Received request to download file.');

  const userToken = req.headers.authorization?.replace('Bearer ', '');
  if (!userToken) {
    return res.status(401).json({ error: 'No authorization token' });
  }

  const { fileId } = req.params;

  // --- IMPORTANT: Implement your actual backend logic here ---
  // This is where you would:
  // 1. Retrieve the file from your storage based on fileId.
  // 2. Set appropriate headers (Content-Disposition, Content-Type).
  // 3. Stream the file back to the client.

  // Simulate file download
  const dummyFileContent = `This is a dummy file for ${fileId}. Your actual file content would be here.`;
  res.setHeader('Content-Disposition', `attachment; filename="downloaded_file_${fileId}.txt"`);
  res.setHeader('Content-Type', 'text/plain');
  console.log(`Proxy: Simulated download of file: ${fileId}`);
  res.status(200).send(dummyFileContent);
});


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    keycloakUrl: KEYCLOAK_BASE_URL,
    realm: KEYCLOAK_REALM,
    clientId: KEYCLOAK_CLIENT_ID,
    hasClientSecret: !!KEYCLOAK_CLIENT_SECRET
  });
});

// Debug endpoint
app.get('/debug/config', (req, res) => {
  res.json({
    keycloakBaseUrl: KEYCLOAK_BASE_URL,
    realm: KEYCLOAK_REALM,
    clientId: KEYCLOAK_CLIENT_ID,
    hasClientSecret: !!KEYCLOAK_CLIENT_SECRET,
    nodeEnv: process.env.NODE_ENV || 'development',
    proxyPort: PROXY_PORT
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Proxy: Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal proxy error',
    message: err.message 
  });
});

// Start server
app.listen(PROXY_PORT, () => {
  console.log(`\n🚀 Keycloak Admin Proxy Server Started`);
  console.log(`📡 Port: ${PROXY_PORT}`);
  console.log(`🎯 Keycloak URL: ${KEYCLOAK_BASE_URL}`);
  console.log(`🌍 Realm: ${KEYCLOAK_REALM}`);
  console.log(`🔑 Client ID: ${KEYCLOAK_CLIENT_ID}`);
  console.log(`🔐 Client Secret: ${KEYCLOAK_CLIENT_SECRET ? '[CONFIGURED]' : '[MISSING]'}`);
  console.log(`\n📋 Available Endpoints:`);
  console.log(`   • Health Check: http://localhost:${PROXY_PORT}/health`);
  console.log(`   • Token Test: http://localhost:${PROXY_PORT}/api/test-token`);
  console.log(`   • Debug Config: http://localhost:${PROXY_PORT}/debug/config`);
  console.log(`   • Keycloak Admin API: http://localhost:${PROXY_PORT}/api/keycloak/*`);
  console.log(`   • File Upload API: http://localhost:${PROXY_PORT}/api/upload-batch`);
  console.log(`   • Fetch Files API: http://localhost:${PROXY_PORT}/api/uploaded-files`);
  console.log(`   • Delete File API: http://localhost:${PROXY_PORT}/api/uploaded-files/:fileId`);
  console.log(`   • Download File API: http://localhost:${PROXY_PORT}/api/uploaded-files/:fileId/download`);
  console.log(`\n🌐 Frontend CORS Origin: http://localhost:5000`);
  console.log(`\n✅ Proxy server ready to handle requests!`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT. Gracefully shutting down proxy server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM. Gracefully shutting down proxy server...');
  process.exit(0);
});