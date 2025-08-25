"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, Download, FileText, XCircle, Loader2, Building, Cloud, AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { HolographicCard } from './Dashboard';
import { authService } from '@/services/authService';
import { getApiEndpoint } from '@/config/environment';
import { keycloakAdminService } from '@/services/keycloakAdminService';
import GoogleDriveForm from '@/components/GoogleDriveForm';
import { fileUploadService, UploadedFile, GoogleDriveCredentials } from '@/services/fileUploadService'; // Import new service and types
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"; // Import table components

const UploadData: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]); // Changed to array for multi-file
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Enhanced States for Organization dropdown
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string; alias?: string; domain?: string }>>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>("");
  const [isFetchingOrganizations, setIsFetchingOrganizations] = useState(true);
  const [organizationError, setOrganizationError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // State for "Connect to data source" dropdown
  const [selectedDataSourceOption, setSelectedDataSourceOption] = useState<string>("");

  // States for Google Drive Form
  const [isGoogleDriveFormOpen, setIsGoogleDriveFormOpen] = useState(false);
  const [googleDriveCredentials, setGoogleDriveCredentials] = useState<GoogleDriveCredentials | null>(null);

  // New states for uploaded files table
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isFetchingUploadedFiles, setIsFetchingUploadedFiles] = useState(false);
  const [uploadedFilesError, setUploadedFilesError] = useState<string | null>(null);

  // Enhanced organization fetching function with detailed logging and error handling
  const fetchOrganizations = useCallback(async (showLoading = true) => {
    console.log("UploadData: Starting organization fetch...");
    
    if (showLoading) {
      setIsFetchingOrganizations(true);
    }
    setOrganizationError(null);

    try {
      // Check authentication first
      const token = authService.getAccessToken();
      console.log("UploadData: Auth token available:", !!token);
      
      if (!token) {
        throw new Error("No authentication token available. Please log in.");
      }

      // Clear cached tokens on retry
      if (retryCount > 0) {
        console.log("UploadData: Clearing cached tokens for retry...");
        keycloakAdminService.clearTokens();
      }

      console.log("UploadData: Calling keycloakAdminService.getOrganizations()...");
      const fetchedOrgs = await keycloakAdminService.getOrganizations();
      
      console.log("UploadData: Raw API response:", fetchedOrgs);
      console.log("UploadData: Number of organizations received:", fetchedOrgs.length);

      // Process organizations similar to Users.tsx
      const processedOrgs = fetchedOrgs.map((org: any) => ({
        id: org.id,
        name: org.name,
        alias: org.alias || org.name,
        domain: org.domains?.[0]?.name || org.domain || 'N/A'
      }));

      console.log("UploadData: Processed organizations:", processedOrgs);

      setOrganizations(processedOrgs);
      setRetryCount(0);
      setOrganizationError(null);

      if (processedOrgs.length === 0) {
        const warningMsg = "No organizations found. Please create an organization first.";
        setOrganizationError(warningMsg);
        toast.warning(warningMsg);
      } else {
        console.log(`UploadData: Successfully loaded ${processedOrgs.length} organization${processedOrgs.length > 1 ? 's' : ''}`);
        toast.success(`Loaded ${processedOrgs.length} organization${processedOrgs.length > 1 ? 's' : ''}`);
      }

    } catch (error: any) {
      console.error("UploadData: Organization fetch error:", error);
      console.error("UploadData: Error message:", error.message);
      
      let errorMessage = 'Failed to load organizations';
      
      if (error.message?.includes('401') || error.message?.includes('Authentication failed')) {
        errorMessage = 'Authentication failed. Please check your admin permissions and try logging out and back in.';
      } else if (error.message?.includes('403') || error.message?.includes('Access denied')) {
        errorMessage = 'Access denied. You do not have permission to view organizations.';
      } else if (error.message?.includes('404') && error.message?.includes('organizations')) {
        errorMessage = 'Organizations API not found. Please ensure Organizations feature is enabled in Keycloak (requires version 22+).';
      } else if (error.message?.includes('No authentication token')) {
        errorMessage = 'Please log in again to access organizations.';
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else {
        errorMessage = `Failed to load organizations: ${error.message}`;
      }

      setOrganizationError(errorMessage);
      setOrganizations([]);
      setRetryCount(prev => prev + 1);

      toast.error(errorMessage);
    } finally {
      if (showLoading) {
        setIsFetchingOrganizations(false);
      }
    }
  }, [retryCount]);

  // Fetch organizations on component mount
  useEffect(() => {
    console.log("UploadData: useEffect triggered - fetching organizations");
    fetchOrganizations();
  }, [fetchOrganizations]);

  // Fetch uploaded files when organization or agent changes
  const fetchUploadedFiles = useCallback(async () => {
    if (!selectedOrganizationId || !selectedAgent) {
      setUploadedFiles([]);
      return;
    }

    setIsFetchingUploadedFiles(true);
    setUploadedFilesError(null);
    try {
      const files = await fileUploadService.getUploadedFiles(selectedOrganizationId, selectedAgent);
      setUploadedFiles(files);
      toast.success(`Loaded ${files.length} uploaded file(s).`);
    } catch (error: any) {
      console.error("Error fetching uploaded files:", error);
      setUploadedFilesError(error.message || "Failed to load uploaded files.");
      toast.error(error.message || "Failed to load uploaded files.");
    } finally {
      setIsFetchingUploadedFiles(false);
    }
  }, [selectedOrganizationId, selectedAgent]);

  useEffect(() => {
    // Only fetch uploaded files if the table is supposed to be visible
    if (selectedDataSourceOption === "upload-file-from-system") {
      fetchUploadedFiles();
    } else {
      setUploadedFiles([]); // Clear files if table is hidden
    }
  }, [fetchUploadedFiles, selectedDataSourceOption]);

  // Retry function for organizations
  const handleRetryOrganizations = () => {
    console.log("UploadData: Manual retry triggered");
    setRetryCount(0);
    fetchOrganizations();
  };

  // Refresh organizations function
  const refreshOrganizations = () => {
    console.log("UploadData: Manual refresh triggered");
    toast.info("Refreshing organizations...");
    fetchOrganizations(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      const allowedTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/json'
      ];
      const invalidFiles = files.filter(file => {
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        const isAllowedExtension = ['csv', 'xls', 'xlsx', 'json'].includes(fileExtension || '');
        return !(allowedTypes.includes(file.type) || isAllowedExtension);
      });

      if (invalidFiles.length === 0) {
        setSelectedFiles(files);
      } else {
        setSelectedFiles([]);
        toast.error("Invalid file type(s) detected. Please upload CSV, Excel (XLS/XLSX), or JSON files.");
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    if (selectedFiles.length === 1 && fileInputRef.current) {
      fileInputRef.current.value = ''; // Clear input if last file is removed
    }
  };

  const handleDataSourceChange = (value: string) => {
    setSelectedDataSourceOption(value);
    setSelectedFiles([]); // Clear files when data source changes
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsGoogleDriveFormOpen(false);
    setGoogleDriveCredentials(null);

    if (value === "connect-to-google-drive") {
      setIsGoogleDriveFormOpen(true);
    }
  };

  const handleGoogleDriveFormSubmit = (credentials: GoogleDriveCredentials) => {
    setGoogleDriveCredentials(credentials);
    setIsGoogleDriveFormOpen(false);
    toast.success("Google Drive credentials saved!");
  };

  const handleSubmitInternal = async () => {
    // Validate organization selection
    if (!selectedOrganizationId) {
      toast.error("Please select an organization before submitting.");
      return;
    }
    // Validate agent selection
    if (!selectedAgent) {
      toast.error("Please select an agent before submitting.");
      return;
    }
    // Validate files or Google Drive credentials
    if (selectedDataSourceOption === "upload-file-from-system" && selectedFiles.length === 0) {
      toast.error("Please select at least one file to upload.");
      return;
    }
    if (selectedDataSourceOption === "connect-to-google-drive" && !googleDriveCredentials) {
      toast.error("Please provide Google Drive credentials.");
      return;
    }

    setIsLoading(true);
    toast.info("Submitting request for processing...");

    try {
      const selectedOrg = organizations.find(org => org.id === selectedOrganizationId);
      const organizationName = selectedOrg ? selectedOrg.name : 'Unknown';

      await fileUploadService.uploadFiles(
        selectedFiles,
        selectedAgent,
        selectedOrganizationId,
        organizationName,
        selectedDataSourceOption,
        googleDriveCredentials || undefined
      );

      console.log("UploadData: Submission successful.");
      toast.success(`Request submitted for processing by ${selectedAgent} for ${organizationName}!`);

      // Refresh the uploaded files table
      fetchUploadedFiles();

      // Reset form
      setSelectedAgent("");
      setSelectedFiles([]);
      // setSelectedOrganizationId(""); // Keep selected organization for convenience
      setSelectedDataSourceOption("");
      setGoogleDriveCredentials(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error: any) {
      console.error("UploadData: Error during data submission:", error);
      toast.error(error.message || "An unexpected error occurred during submission.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    if (selectedDataSourceOption === "connect-to-google-drive" && !googleDriveCredentials) {
      setIsGoogleDriveFormOpen(true);
      toast.info("Please provide Google Drive credentials.");
      return;
    }
    handleSubmitInternal();
  };

  const handleCancel = () => {
    setSelectedAgent("");
    setSelectedFiles([]);
    setSelectedOrganizationId("");
    setSelectedDataSourceOption("");
    setGoogleDriveCredentials(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsLoading(false);
    toast.info("Upload process cancelled.");
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;
    
    toast.info("Deleting file...");
    try {
      await fileUploadService.deleteFile(fileId);
      toast.success("File deleted successfully!");
      fetchUploadedFiles(); // Refresh table
    } catch (error: any) {
      console.error("Error deleting file:", error);
      toast.error(error.message || "Failed to delete file.");
    }
  };

  const handleDownloadFile = async (fileId: string, filename: string) => {
    toast.info(`Downloading ${filename}...`);
    try {
      const response = await fileUploadService.downloadFile(fileId);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("File downloaded successfully!");
    } catch (error: any) {
      console.error("Error downloading file:", error);
      toast.error(error.message || "Failed to download file.");
    }
  };

  // Determine if the main submit button should be disabled
  const isSubmitDisabled = isLoading ||
    !selectedAgent ||
    !selectedOrganizationId ||
    !selectedDataSourceOption ||
    (selectedDataSourceOption === "upload-file-from-system" && selectedFiles.length === 0) ||
    (selectedDataSourceOption === "connect-to-google-drive" && !googleDriveCredentials) ||
    isFetchingOrganizations ||
    organizations.length === 0;

  const submitButtonText = selectedDataSourceOption === "upload-file-from-system" ? "Upload" : "Submit for Processing";

  return (
    <div className="p-4 grid grid-cols-1 gap-4 h-full min-h-screen bg-background overflow-auto">
      <HolographicCard className="col-span-full neumorphic-card flex flex-col max-h-[calc(100vh-120px)]"> {/* Added flex flex-col and max-h */}
        <CardHeader className="pb-3"> {/* Reduced padding-bottom */}
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-primary" /> Upload Dataset (Organizations API)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-3 flex flex-col flex-grow overflow-hidden"> {/* Added flex flex-col flex-grow overflow-hidden */}
          <div className="flex-grow overflow-y-auto pr-2"> {/* This div will scroll */}
            <p className="text-muted-foreground mb-4 text-sm"> {/* Reduced mb and text size */}
              Select an AURA agent, an organization, and a data source to process your dataset.
            </p>

            {/* Organization Error Display */}
            {organizationError && (
              <div className="mb-4 p-3 border border-destructive/20 bg-destructive/10 rounded-lg flex items-center gap-3 text-sm"> {/* Reduced mb and padding */}
                <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" /> {/* Reduced icon size */}
                <div className="flex-1">
                  <p className="text-destructive font-medium">Failed to load organizations</p>
                  <p className="text-destructive/80 text-xs">{organizationError}</p> {/* Reduced text size */}
                  {organizationError.includes('Organizations API') && (
                    <p className="text-destructive/80 text-xs mt-1"> {/* Reduced text size */}
                      Please ensure Organizations feature is enabled in Keycloak (requires Keycloak 22+)
                    </p>
                  )}
                </div>
                <Button
                  onClick={handleRetryOrganizations}
                  variant="outline"
                  size="sm"
                  className="border-destructive/20 text-destructive hover:bg-destructive/10 h-7 px-3 text-xs" // Reduced button size
                >
                  Retry
                </Button>
              </div>
            )}

            <div className="space-y-4"> {/* Reduced space-y from 6 to 4 */}
              {/* Select Agent */}
              <div className="space-y-2">
                <label htmlFor="select-agent" className="text-sm font-medium text-muted-foreground">Select Agent</label>
                <div className="flex items-center gap-2">
                  <Select onValueChange={setSelectedAgent} value={selectedAgent} disabled={isLoading}>
                    <SelectTrigger id="select-agent" className="flex-grow bg-input border-border text-foreground h-9 text-sm"> {/* Reduced height and text size */}
                      <SelectValue placeholder="Choose agent..." />
                    </SelectTrigger>
                    <SelectContent className="neumorphic-card text-popover-foreground border border-border bg-card">
                      <SelectItem value="business-vitality-agent">Business Vitality Agent</SelectItem>
                      <SelectItem value="customer-analyzer-agent">Customer Analyzer Agent</SelectItem>
                      <SelectItem value="mission-alignment-agent">Mission Alignment Agent</SelectItem>
                      <SelectItem value="brand-index-agent">Brand Index Agent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Enhanced Select Organization */}
              <div className="space-y-2">
                <label htmlFor="select-organization" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Building className="h-4 w-4" /> Select Organization
                  {!isFetchingOrganizations && organizations.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={refreshOrganizations}
                      className="h-5 px-1 text-xs text-muted-foreground hover:text-foreground ml-2"
                      title="Refresh organizations"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  )}
                </label>
                <Select
                  value={selectedOrganizationId}
                  onValueChange={setSelectedOrganizationId}
                  disabled={isLoading || isFetchingOrganizations || organizations.length === 0}
                >
                  <SelectTrigger id="select-organization" className="w-full bg-input border-border text-foreground h-9 text-sm"> {/* Reduced height and text size */}
                    {isFetchingOrganizations ? (
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading organizations...
                      </span>
                    ) : organizationError ? (
                      <span className="text-destructive">Error loading organizations</span>
                    ) : organizations.length === 0 ? (
                      <span className="text-muted-foreground">No organizations available</span>
                    ) : (
                      <SelectValue placeholder="Select an organization" />
                    )}
                  </SelectTrigger>
                  <SelectContent className="neumorphic-card text-popover-foreground border border-border bg-card">
                    {organizations.length === 0 && !isFetchingOrganizations ? (
                      <SelectItem value="no-orgs" disabled>
                        {organizationError ? "Failed to load organizations" : "No organizations found"}
                      </SelectItem>
                    ) : (
                      organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                          {org.domain && org.domain !== 'N/A' && (
                            <span className="text-xs text-muted-foreground ml-2">({org.domain})</span>
                          )}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {organizations.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {organizations.length} organization{organizations.length !== 1 ? 's' : ''} available
                  </p>
                )}
              </div>

              {/* Connect to Data Source Dropdown */}
              <div className="space-y-2">
                <label htmlFor="select-data-source" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Cloud className="h-4 w-4" /> Connect to data source
                </label>
                <Select
                  value={selectedDataSourceOption}
                  onValueChange={handleDataSourceChange}
                  disabled={isLoading}
                >
                  <SelectTrigger id="select-data-source" className="w-full bg-input border-border text-foreground h-9 text-sm"> {/* Reduced height and text size */}
                    <SelectValue placeholder="Select data source..." />
                  </SelectTrigger>
                  <SelectContent className="neumorphic-card text-popover-foreground border border-border bg-card">
                    <SelectItem value="connect-to-google-drive">Connect to Google Drive</SelectItem>
                    <SelectItem value="upload-file-from-system">Upload File from System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* File Upload Input (Multi-file) */}
              {selectedDataSourceOption === "upload-file-from-system" && (
                <div className="space-y-2">
                  <label htmlFor="file-upload" className="text-sm font-medium text-muted-foreground">Upload File(s)</label>
                  <div className="flex items-center gap-2">
                    <input
                      id="file-upload"
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={isLoading}
                      accept=".csv, .xls, .xlsx, .json"
                      multiple // Allow multiple files
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                      className="flex-grow justify-start bg-input border-border text-foreground hover:bg-input/80 h-9 text-sm" // Reduced height and text size
                    >
                      <UploadCloud className="h-4 w-4 mr-2" />
                      {selectedFiles.length > 0 ? `${selectedFiles.length} file(s) selected` : "Choose File(s) (CSV, Excel, JSON)"}
                    </Button>
                  </div>
                  {selectedFiles.length > 0 && (
                    <div className="space-y-1 mt-2">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between text-xs text-muted-foreground p-1 bg-muted/50 rounded-md">
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" /> {file.name} ({(file.size / 1024).toFixed(2)} KB)
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveFile(index)}
                            disabled={isLoading}
                            className="h-6 w-6 text-destructive hover:bg-destructive/10"
                          >
                            <XCircle className="h-3 w-3" />
                            <span className="sr-only">Remove file</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Google Drive Credentials Status */}
              {selectedDataSourceOption === "connect-to-google-drive" && googleDriveCredentials && (
                <div className="space-y-2 p-3 border border-green-500/50 bg-green-500/10 rounded-md text-sm text-green-700">
                  <p className="font-semibold">Google Drive Credentials Provided!</p>
                  <p className="text-xs">Project ID: {googleDriveCredentials.project_id}</p>
                  <p className="text-xs">Client Email: {googleDriveCredentials.client_email}</p>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={() => setIsGoogleDriveFormOpen(true)}
                    className="p-0 h-auto text-green-700 hover:text-green-800 underline"
                  >
                    Edit Credentials
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons - Pinned to bottom */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 mt-auto border-t border-border">
            <Button variant="outline" onClick={handleCancel} disabled={isLoading} className="w-full sm:w-auto h-9 px-4 py-2 text-sm">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitDisabled}
              title={
                organizations.length === 0 
                  ? "No organizations available - please create an organization first"
                  : isSubmitDisabled 
                    ? "Please fill all required fields"
                    : "Submit for processing"
              }
              className="w-full sm:w-auto h-9 px-4 py-2 text-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...
                </>
              ) : (
                submitButtonText
              )}
            </Button>
          </div>
        </CardContent>
      </HolographicCard>

      {/* Google Drive Credentials Form Popup */}
      <GoogleDriveForm
        isOpen={isGoogleDriveFormOpen}
        onClose={() => setIsGoogleDriveFormOpen(false)}
        onSubmit={handleGoogleDriveFormSubmit}
        isLoading={isLoading}
      />

      {/* Table of Already Uploaded Files - Conditionally rendered */}
      {selectedDataSourceOption === "upload-file-from-system" && (
        <HolographicCard className="col-span-full neumorphic-card flex flex-col max-h-[calc(100vh-120px)]"> {/* Added flex flex-col and max-h */}
          <CardHeader className="pb-3"> {/* Reduced padding-bottom */}
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Uploaded Files
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3 flex-grow overflow-hidden"> {/* Added flex-grow overflow-hidden */}
            {/* This div will handle scrolling for the table */}
            <div className="overflow-y-auto max-h-full pr-2"> 
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground min-w-[150px]">Filename</TableHead>
                    <TableHead className="text-muted-foreground min-w-[120px]">Upload Date</TableHead>
                    <TableHead className="text-muted-foreground min-w-[120px]">Uploaded By</TableHead>
                    <TableHead className="text-muted-foreground min-w-[150px]">Organization</TableHead>
                    <TableHead className="text-muted-foreground min-w-[120px]">Agent</TableHead>
                    <TableHead className="text-muted-foreground text-right min-w-[100px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isFetchingUploadedFiles ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-20 text-center text-muted-foreground text-sm"> {/* Reduced height and text size */}
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Loading uploaded files...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : uploadedFilesError ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-20 text-center text-muted-foreground text-sm"> {/* Reduced height and text size */}
                        <div className="flex flex-col items-center gap-2">
                          <AlertCircle className="h-6 w-6 text-destructive" /> {/* Reduced icon size */}
                          <span>Error loading files</span>
                          <Button
                            onClick={fetchUploadedFiles}
                            variant="outline"
                            size="sm"
                            className="border-destructive/20 text-destructive hover:bg-destructive/10 h-7 px-3 text-xs" // Reduced button size
                          >
                            Retry
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : uploadedFiles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-20 text-center text-muted-foreground text-sm"> {/* Reduced height and text size */}
                        No files uploaded for this organization and agent.
                      </TableCell>
                    </TableRow>
                  ) : (
                    uploadedFiles.map((file) => (
                      <TableRow key={file.id} className="border-border">
                        <TableCell className="font-medium text-foreground text-sm">{file.filename}</TableCell> {/* Reduced text size */}
                        <TableCell className="text-foreground text-sm">{new Date(file.uploadDate).toLocaleDateString()}</TableCell> {/* Reduced text size */}
                        <TableCell className="text-foreground text-sm">{file.uploadedBy}</TableCell> {/* Reduced text size */}
                        <TableCell className="text-foreground text-sm">{file.organizationName}</TableCell> {/* Reduced text size */}
                        <TableCell className="text-foreground text-sm">{file.agent}</TableCell> {/* Reduced text size */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-primary hover:bg-muted" // Reduced button size
                              onClick={() => handleDownloadFile(file.id, file.filename)}
                              title="Download Dataset"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10" // Reduced button size
                              onClick={() => handleDeleteFile(file.id)}
                              title="Delete Dataset"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </HolographicCard>
      )}
    </div>
  );
};

export default UploadData;