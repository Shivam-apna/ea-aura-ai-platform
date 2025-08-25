import { getApiEndpoint } from '@/config/environment';
import { authService } from './authService';

interface UploadedFile {
  id: string;
  filename: string;
  uploadDate: string;
  uploadedBy: string; // User ID or username
  organizationId: string;
  organizationName: string;
  agent: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileSize: number;
  fileType: string;
}

interface GoogleDriveCredentials {
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
  universe_domain: string;
}

class FileUploadService {
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = await authService.getTokenWithRefresh();
    if (!token) {
      throw new Error('Authentication token not found. Please log in again.');
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `API request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        // Ignore parsing error if response is not JSON
      }
      throw new Error(errorMessage);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return response; // Return raw response for downloads
  }

  // Upload multiple files
  async uploadFiles(
    files: File[],
    agent: string,
    organizationId: string,
    organizationName: string,
    dataSourceOption: string,
    googleDriveCredentials?: GoogleDriveCredentials
  ): Promise<any> {
    const formData = new FormData();
    formData.append('agent', agent);
    formData.append('organizationId', organizationId);
    formData.append('organizationName', organizationName);
    formData.append('dataSourceOption', dataSourceOption);

    files.forEach(file => {
      formData.append('files', file); // 'files' is the key for multiple files
    });

    if (googleDriveCredentials) {
      formData.append('googleDriveCredentials', JSON.stringify(googleDriveCredentials));
    }

    const endpoint = getApiEndpoint("/api/upload-batch"); // New endpoint for batch upload
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: formData,
      // No 'Content-Type' header for FormData, browser sets it automatically
    });
  }

  // Fetch uploaded files for a specific organization and agent
  async getUploadedFiles(organizationId: string, agent: string): Promise<UploadedFile[]> {
    const endpoint = getApiEndpoint(`/api/uploaded-files?organizationId=${organizationId}&agent=${agent}`);
    return this.makeRequest(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Delete an uploaded file
  async deleteFile(fileId: string): Promise<any> {
    const endpoint = getApiEndpoint(`/api/uploaded-files/${fileId}`);
    return this.makeRequest(endpoint, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Download an uploaded file
  async downloadFile(fileId: string): Promise<Response> {
    const endpoint = getApiEndpoint(`/api/uploaded-files/${fileId}/download`);
    return this.makeRequest(endpoint, {
      method: 'GET',
    });
  }
}

export const fileUploadService = new FileUploadService();
export type { UploadedFile, GoogleDriveCredentials };