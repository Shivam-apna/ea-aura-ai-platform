"use client";

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
// Removed: import PageHeaderActions from "@/components/PageHeaderActions";
import { HolographicCard } from './Dashboard'; // Import HolographicCard

const UploadData: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

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

  const handleSubmit = async () => {
    if (!selectedAgent) {
      toast.error("Please select an agent.");
      return;
    }

    setIsLoading(true);
    toast.info("Submitting request for processing...");

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log("Submitting:", { agent: selectedAgent });
    toast.success(`Request submitted for processing by ${selectedAgent}!`);

    // Reset form
    setSelectedAgent("");
    setIsLoading(false);
  };

  const handleCancel = () => {
    setSelectedAgent("");
    setIsLoading(false);
    toast.info("Upload process cancelled.");
  };

  return (
    <div className="p-4 grid grid-cols-1 gap-4 h-full bg-background">
      {/* Removed PageHeaderActions component */}

      <HolographicCard className="col-span-full neumorphic-card flex-grow">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-primary" /> Upload Dataset
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Select an AURA agent to process a structured dataset for this tenant.
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
                    {/* Add more agents as needed */}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={handleDownloadTemplate} disabled={isLoading} className="flex-shrink-0">
                  <Download className="h-4 w-4 mr-2" /> Download Template
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading || !selectedAgent}>
                {isLoading ? 'Processing...' : 'Submit for Processing'}
              </Button>
            </div>
          </div>
        </CardContent>
      </HolographicCard>
    </div>
  );
};

export default UploadData;