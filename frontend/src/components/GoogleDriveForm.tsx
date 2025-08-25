"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, X, HardDrive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface GoogleDriveCredentials {
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  // Fixed non-editable fields
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
  universe_domain: string;
}

interface GoogleDriveFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: GoogleDriveCredentials) => void;
  isLoading?: boolean;
}

const FIXED_CREDENTIALS = {
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/agent-228%40gen-lang-client-0611224325.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

const GoogleDriveForm: React.FC<GoogleDriveFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<Partial<GoogleDriveCredentials>>({
    project_id: '',
    private_key_id: '',
    private_key: '',
    client_email: '',
    client_id: '',
  });

  const [errors, setErrors] = useState<Partial<GoogleDriveCredentials>>({});

  const handleInputChange = (field: keyof GoogleDriveCredentials, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<GoogleDriveCredentials> = {};
    const requiredFields: Array<keyof GoogleDriveCredentials> = [
      'project_id', 'private_key_id', 'private_key', 'client_email', 'client_id'
    ];

    requiredFields.forEach(field => {
      if (!formData[field]?.trim()) {
        newErrors[field] = `${field.replace(/_/g, ' ')} is required`;
      }
    });

    // Basic email validation for client_email
    if (formData.client_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.client_email)) {
      newErrors.client_email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({ ...formData, ...FIXED_CREDENTIALS } as GoogleDriveCredentials);
    } else {
      toast.error("Please fill in all required fields correctly.");
    }
  };

  const handleClose = () => {
    setFormData({
      project_id: '',
      private_key_id: '',
      private_key: '',
      client_email: '',
      client_id: '',
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Google Drive Credentials
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Editable Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['project_id', 'private_key_id', 'client_email', 'client_id'].map(field => (
              <div key={field} className="space-y-2">
                <Label htmlFor={field} className="text-sm font-medium">
                  {field.replace(/_/g, ' ')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={field}
                  value={formData[field as keyof typeof formData] || ''}
                  onChange={(e) => handleInputChange(field as keyof GoogleDriveCredentials, e.target.value)}
                  className={cn(errors[field as keyof GoogleDriveCredentials] && 'border-red-500')}
                  disabled={isLoading}
                />
                {errors[field as keyof GoogleDriveCredentials] && (
                  <p className="text-sm text-red-500">{errors[field as keyof GoogleDriveCredentials]}</p>
                )}
              </div>
            ))}
          </div>

          {/* Private Key (Textarea) */}
          <div className="space-y-2">
            <Label htmlFor="private_key" className="text-sm font-medium">
              private_key <span className="text-red-500">*</span>
            </Label>
            <textarea
              id="private_key"
              value={formData.private_key || ''}
              onChange={(e) => handleInputChange('private_key', e.target.value)}
              placeholder="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
              rows={6}
              className={cn(
                "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                errors.private_key && 'border-red-500'
              )}
              disabled={isLoading}
            />
            {errors.private_key && (
              <p className="text-sm text-red-500">{errors.private_key}</p>
            )}
          </div>

          {/* Non-editable Fields */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-md font-semibold text-muted-foreground">Fixed Credentials (Non-editable)</h3>
            {Object.entries(FIXED_CREDENTIALS).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key} className="text-sm font-medium text-muted-foreground">
                  {key.replace(/_/g, ' ')}
                </Label>
                <Input
                  id={key}
                  value={value}
                  readOnly
                  className="bg-muted text-muted-foreground cursor-not-allowed"
                />
              </div>
            ))}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Credentials'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GoogleDriveForm;