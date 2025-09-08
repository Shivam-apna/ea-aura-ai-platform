"use client";

import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, Download, FileText, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { HolographicCard } from './Dashboard'; // Import HolographicCard
import { authService } from '@/services/authService'; // Import authService to get token
import { getApiEndpoint } from '@/config/environment'; // Import getApiEndpoint
import { useAuth } from '@/contexts/AuthContext';
import { keycloakAdminService } from '@/services/keycloakAdminService';

// Define the mapping between agents and their corresponding sub_index values
const AGENT_SUB_INDEX_MAP = {
  "business-vitality-agent": "business_vitality_dataset",
  "customer-analyzer-agent": "customer_survey_dataset",
  "mission-alignment-agent": "mission_alignment_dataset",
  "brand-index-agent": "brand_index_dataset",
};

// Static index name as mentioned in requirements
const INDEX_NAME = "agent_dataset";

// Organizations will be loaded from Keycloak



const UploadData: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [selectedTenant, setSelectedTenant] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [orgLoading, setOrgLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  
  // Load organizations from Keycloak
  const loadOrganizations = async () => {
    setOrgLoading(true);
    try {
      const orgs = await keycloakAdminService.getOrganizations();
      setOrganizations(orgs);
    } catch (error: any) {
      console.error('Failed to load organizations:', error);
      toast.error('Failed to load organizations');
    } finally {
      setOrgLoading(false);
    }
  };

  // Load organizations on component mount
  React.useEffect(() => {
    loadOrganizations();
  }, []);

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
        'application/json'
      ];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const isAllowedExtension = ['csv', 'xls', 'xlsx', 'json'].includes(fileExtension || '');

      if (allowedTypes.includes(file.type) || isAllowedExtension) {
        setSelectedFile(file);
      } else {
        setSelectedFile(null);
        toast.error("Invalid file type. Please upload a CSV, Excel (XLS/XLSX), or JSON file.");
        if (fileInputRef.current) {
          fileInputRef.current.value = ''; // Clear the file input
        }
      }
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Clear the file input
    }
  };

  const handleSubmit = async () => {
    if (!selectedAgent) {
      toast.error("Please select an agent.");
      return;
    }
    if (!selectedTenant) {
      toast.error("Please select a tenant.");
      return;
    }
    if (!selectedFile) {
      toast.error("Please select a file to upload.");
      return;
    }

    setIsLoading(true);
    toast.info("Uploading file and submitting request for processing...");

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('sub_index', AGENT_SUB_INDEX_MAP[selectedAgent as keyof typeof AGENT_SUB_INDEX_MAP]);
      formData.append('index_name', INDEX_NAME);
      formData.append('tenant_id', `"${selectedTenant}"`); // Wrap tenant_id in quotes as shown in curl

      const accessToken = authService.getAccessToken();
      if (!accessToken) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      // Updated API endpoint to match your curl command
      const response = await fetch(getApiEndpoint("/v1/uploadfile"), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          // 'Content-Type': 'multipart/form-data' is automatically set by fetch when using FormData
        },
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = `Upload failed: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          // Fallback to status text if JSON parsing fails
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("Upload successful:", result);
      
      const selectedTenantName = organizations.find(org => org.id === selectedTenant)?.name || selectedTenant;
      toast.success(`File uploaded and request submitted for processing by ${selectedAgent} for ${selectedTenantName}!`);

      // Reset form
      setSelectedAgent("");
      setSelectedTenant("");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error: any) {
      console.error("Error during file upload:", error);
      toast.error(error.message || "An unexpected error occurred during upload.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedAgent("");
    setSelectedTenant("");
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsLoading(false);
    toast.info("Upload process cancelled.");
  };

  return (
    <div className="p-4 grid grid-cols-1 gap-4 h-full bg-background">
      <HolographicCard className="col-span-full neumorphic-card flex-grow">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-primary" /> Upload Dataset
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Select an AURA agent and tenant to process a structured dataset.
          </p>

          <div className="space-y-6">
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

            {/* Select Organization */}
            <div className="space-y-2">
              <label htmlFor="select-tenant" className="text-sm font-medium text-muted-foreground">Select Organization</label>
              <Select onValueChange={setSelectedTenant} value={selectedTenant} disabled={isLoading || orgLoading}>
                <SelectTrigger id="select-tenant" className="bg-input border-border text-foreground">
                  <SelectValue placeholder={orgLoading ? "Loading organizations..." : "Choose organization..."} />
                </SelectTrigger>
                <SelectContent className="neumorphic-card text-popover-foreground border border-border bg-card">
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name} {org.domain ? `(${org.domain})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* File Upload Input */}
            <div className="space-y-2">
              <label htmlFor="file-upload" className="text-sm font-medium text-muted-foreground">Upload File</label>
              <div className="flex items-center gap-2">
                <input
                  id="file-upload"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden" // Hide the default file input
                  disabled={isLoading}
                  accept=".csv, .xls, .xlsx, .json" // Specify accepted file types
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="flex-grow justify-start bg-input border-border text-foreground hover:bg-input/80"
                >
                  <UploadCloud className="h-4 w-4 mr-2" />
                  {selectedFile ? selectedFile.name : "Choose File (CSV, Excel, JSON)"}
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

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading || !selectedAgent || !selectedTenant || !selectedFile} className="text-white">
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
    </div>
  );
};

export default UploadData;