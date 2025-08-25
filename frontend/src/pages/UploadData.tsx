"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, Download, FileText, XCircle, Loader2, Eye, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { HolographicCard } from './Dashboard';
import { authService } from '@/services/authService';
import { getApiEndpoint } from '@/config/environment'; // Import getApiEndpoint
import { keycloakAdminService } from '@/services/keycloakAdminService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Types for file upload functionality
interface UploadedFile {
  id: string;
  filename: string;
  uploadDate: string;
  uploadedBy: string;
  organizationId: string;
  organizationName: string;
  agent: string;
  status: 'completed' | 'processing' | 'failed';
  fileSize: number;
  fileType: string;
}

interface Organization {
  id: string;
  name: string;
  alias: string;
  domain: string;
}

const UploadData: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedOrganization, setSelectedOrganization] = useState<string>("");
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [dataSourceOption, setDataSourceOption] = useState<'upload' | 'connect-to-google-drive'>('upload');
  const [googleDriveCredentials, setGoogleDriveCredentials] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load organizations and uploaded files on component mount
  useEffect(() => {
    loadOrganizations();
  }, []);

  // Load uploaded files when agent or organization changes
  useEffect(() => {
    if (selectedAgent && selectedOrganization) {
      loadUploadedFiles();
    }
  }, [selectedAgent, selectedOrganization]);

  const loadOrganizations = async () => {
    try {
      const orgs = await keycloakAdminService.getOrganizations();
      setOrganizations(orgs);
    } catch (error) {
      console.error('Failed to load organizations:', error);
      toast.error('Failed to load organizations');
    }
  };

  const loadUploadedFiles = async () => {
    if (!selectedAgent || !selectedOrganization) return;

    try {
      setIsLoadingFiles(true);
      
      // Updated to use getApiEndpoint pattern
      const response = await fetch(getApiEndpoint(`/v1/uploaded-files?organizationId=${selectedOrganization}&agent=${selectedAgent}`), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authService.getAccessToken()}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load files: ${response.statusText}`);
      }

      const files = await response.json();
      setUploadedFiles(files);
    } catch (error) {
      console.error('Failed to load uploaded files:', error);
      toast.error('Failed to load uploaded files');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleDownloadTemplate = () => {
    toast.info("Downloading template...");
    // Simulate file download
    const dummyData = "Column1,Column2,Column3\nValue1,Value2,Value3";
    const blob = new Blob([dummyData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Template downloaded!");
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = [
        'text/csv',
        'application/vnd.ms-excel', // .xls
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/json',
        'text/plain', // .txt
        'application/xml' // .xml
      ];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const isAllowedExtension = ['csv', 'xls', 'xlsx', 'json', 'txt', 'xml'].includes(fileExtension || '');

      if (allowedTypes.includes(file.type) || isAllowedExtension) {
        setSelectedFile(file);
      } else {
        setSelectedFile(null);
        toast.error("Invalid file type. Please upload a CSV, Excel (XLS/XLSX), JSON, TXT, or XML file.");
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!selectedAgent) {
      toast.error("Please select an agent.");
      return;
    }
    if (!selectedOrganization) {
      toast.error("Please select an organization.");
      return;
    }
    if (dataSourceOption === 'upload' && !selectedFile) {
      toast.error("Please select a file to upload.");
      return;
    }
    if (dataSourceOption === 'connect-to-google-drive' && !googleDriveCredentials.trim()) {
      toast.error("Please provide Google Drive credentials.");
      return;
    }

    setIsLoading(true);
    toast.info("Uploading file and submitting request for processing...");

    try {
      const formData = new FormData();
      
      if (selectedFile) {
        formData.append('files', selectedFile);
      }
      
      formData.append('agent', selectedAgent);
      formData.append('organizationId', selectedOrganization);
      
      const selectedOrg = organizations.find(org => org.id === selectedOrganization);
      formData.append('organizationName', selectedOrg?.name || '');
      formData.append('dataSourceOption', dataSourceOption);
      
      if (googleDriveCredentials) {
        formData.append('googleDriveCredentials', googleDriveCredentials);
      }

      const accessToken = authService.getAccessToken();
      if (!accessToken) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      // Updated to use getApiEndpoint pattern
      const response = await fetch(getApiEndpoint("/v1/upload-batch"), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          // Don't set Content-Type header when using FormData - let the browser set it
        },
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = `Upload failed: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.details || errorMessage;
        } catch (e) {
          // Fallback to status text if JSON parsing fails
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("Upload successful:", result);
      toast.success(`File uploaded and request submitted for processing by ${selectedAgent}!`);

      // Reset form
      setSelectedAgent("");
      setSelectedFile(null);
      setGoogleDriveCredentials('');
      setDataSourceOption('upload');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Reload uploaded files
      await loadUploadedFiles();

    } catch (error: any) {
      console.error("Error during file upload:", error);
      toast.error(error.message || "An unexpected error occurred during upload.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedAgent("");
    setSelectedFile(null);
    setGoogleDriveCredentials('');
    setDataSourceOption('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsLoading(false);
    toast.info("Upload process cancelled.");
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      // Updated to use getApiEndpoint pattern
      const response = await fetch(getApiEndpoint(`/v1/uploaded-files/${fileId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authService.getAccessToken()}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete file: ${response.statusText}`);
      }

      toast.success('File deleted successfully');
      await loadUploadedFiles(); // Reload the files list
    } catch (error) {
      console.error('Failed to delete file:', error);
      toast.error('Failed to delete file');
    }
  };

  const handleDownloadFile = async (fileId: string, filename: string) => {
    try {
      // Updated to use getApiEndpoint pattern
      const response = await fetch(getApiEndpoint(`/v1/uploaded-files/${fileId}/download`), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authService.getAccessToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('File downloaded successfully');
    } catch (error) {
      console.error('Failed to download file:', error);
      toast.error('Failed to download file');
    }
  };

  return (
    <div className="p-4 grid grid-cols-1 gap-4 h-full bg-background">
      <HolographicCard className="col-span-full neumorphic-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-primary" /> Upload Dataset
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Select an AURA agent and organization to process a structured dataset.
          </p>

          <div className="space-y-6">
            {/* Select Organization */}
            <div className="space-y-2">
              <label htmlFor="select-organization" className="text-sm font-medium text-muted-foreground">Select Organization</label>
              <Select onValueChange={setSelectedOrganization} value={selectedOrganization} disabled={isLoading}>
                <SelectTrigger id="select-organization" className="bg-input border-border text-foreground">
                  <SelectValue placeholder="Choose organization..." />
                </SelectTrigger>
                <SelectContent className="neumorphic-card text-popover-foreground border border-border bg-card">
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Select Agent */}
            <div className="space-y-2">
              <label htmlFor="select-agent" className="text-sm font-medium text-muted-foreground">Select Agent</label>
              <div className="flex items-center gap-2">
                <Select onValueChange={setSelectedAgent} value={selectedAgent} disabled={isLoading}>
                  <SelectTrigger id="select-agent" className="flex-grow bg-input border-border text-foreground">
                    <SelectValue placeholder="Choose agent..." />
                  </SelectTrigger>
                  <SelectContent className="neumorphic-card text-popover-foreground border border-border bg-card">
                    <SelectItem value="business-vitality-agent">Business Vitality Agent</SelectItem>
                    <SelectItem value="customer-analyzer-agent">Customer Analyzer Agent</SelectItem>
                    <SelectItem value="mission-alignment-agent">Mission Alignment Agent</SelectItem>
                    <SelectItem value="brand-index-agent">Brand Index Agent</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={handleDownloadTemplate} disabled={isLoading} className="flex-shrink-0">
                  <Download className="h-4 w-4 mr-2" /> Download Template
                </Button>
              </div>
            </div>

            {/* Data Source Option */}
            <div className="space-y-2">
              <label htmlFor="data-source" className="text-sm font-medium text-muted-foreground">Data Source</label>
              <Select onValueChange={(value: 'upload' | 'connect-to-google-drive') => setDataSourceOption(value)} value={dataSourceOption} disabled={isLoading}>
                <SelectTrigger id="data-source" className="bg-input border-border text-foreground">
                  <SelectValue placeholder="Choose data source..." />
                </SelectTrigger>
                <SelectContent className="neumorphic-card text-popover-foreground border border-border bg-card">
                  <SelectItem value="upload">Upload File</SelectItem>
                  <SelectItem value="connect-to-google-drive">Connect to Google Drive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Conditional rendering based on data source option */}
            {dataSourceOption === 'upload' ? (
              /* File Upload Input */
              <div className="space-y-2">
                <label htmlFor="file-upload" className="text-sm font-medium text-muted-foreground">Upload File</label>
                <div className="flex items-center gap-2">
                  <input
                    id="file-upload"
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isLoading}
                    accept=".csv, .xls, .xlsx, .json, .txt, .xml"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="flex-grow justify-start bg-input border-border text-foreground hover:bg-input/80"
                  >
                    <UploadCloud className="h-4 w-4 mr-2" />
                    {selectedFile ? selectedFile.name : "Choose File (CSV, Excel, JSON, TXT, XML)"}
                  </Button>
                  {selectedFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleRemoveFile}
                      disabled={isLoading}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <XCircle className="h-4 w-4" />
                      <span className="sr-only">Remove file</span>
                    </Button>
                  )}
                </div>
                {selectedFile && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <FileText className="h-3 w-3" /> {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>
            ) : (
              /* Google Drive Credentials Input */
              <div className="space-y-2">
                <label htmlFor="google-drive-creds" className="text-sm font-medium text-muted-foreground">Google Drive Credentials</label>
                <textarea
                  id="google-drive-creds"
                  value={googleDriveCredentials}
                  onChange={(e) => setGoogleDriveCredentials(e.target.value)}
                  placeholder="Paste your Google Drive service account credentials JSON here..."
                  className="w-full min-h-[100px] p-3 rounded-md bg-input border-border text-foreground resize-vertical"
                  disabled={isLoading}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={
                  isLoading || 
                  !selectedAgent || 
                  !selectedOrganization || 
                  (dataSourceOption === 'upload' && !selectedFile) || 
                  (dataSourceOption === 'connect-to-google-drive' && !googleDriveCredentials.trim())
                }
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...
                  </>
                ) : (
                  'Submit for Processing'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </HolographicCard>

      {/* Uploaded Files Section */}
      {selectedAgent && selectedOrganization && (
        <HolographicCard className="col-span-full neumorphic-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Uploaded Files
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingFiles ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span className="text-muted-foreground">Loading files...</span>
              </div>
            ) : uploadedFiles.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">Filename</TableHead>
                    <TableHead className="text-muted-foreground">Upload Date</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground">File Size</TableHead>
                    <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uploadedFiles.map((file) => (
                    <TableRow key={file.id} className="border-border">
                      <TableCell className="font-medium text-foreground">{file.filename}</TableCell>
                      <TableCell className="text-foreground">
                        {new Date(file.uploadDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-semibold",
                          file.status === 'completed' && "bg-green-600/20 text-green-400",
                          file.status === 'processing' && "bg-yellow-600/20 text-yellow-400",
                          file.status === 'failed' && "bg-red-600/20 text-red-400"
                        )}>
                          {file.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-foreground">
                        {(file.fileSize / 1024).toFixed(2)} KB
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadFile(file.id, file.filename)}
                            className="h-8 w-8"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteFile(file.id)}
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No files uploaded for this agent and organization.
              </div>
            )}
          </CardContent>
        </HolographicCard>
      )}
    </div>
  );
};

export default UploadData;
