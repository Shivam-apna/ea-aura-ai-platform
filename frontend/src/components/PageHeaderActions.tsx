import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Video, Presentation, FileSpreadsheet, FileText } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip as ShadcnTooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface PageHeaderActionsProps {
  title: string;
}

const PageHeaderActions: React.FC<PageHeaderActionsProps> = ({ title }) => {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState('last-30-days');

  const handleDownload = (type: string) => {
    toast.info(`Simulating ${type} download...`);
    console.log(`Download ${type} triggered.`);
    // In a real app, this would trigger a backend API call to generate and serve the file.
  };

  return (
    <>
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-[15px] font-bold text-foreground mb-2">
            {title}
          </h1>
        </div>
        <div className="flex items-center space-x-1">
          {/* Video Icon */}
          <ShadcnTooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-gray-400 hover:bg-muted hover:text-primary transition-colors" onClick={() => setIsVideoModalOpen(true)}>
                <Video className="h-5 w-5" />
                <span className="sr-only">Watch Tutorial</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Watch Tutorial</p>
            </TooltipContent>
          </ShadcnTooltip>

          {/* PowerPoint Icon */}
          <ShadcnTooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-gray-400 hover:bg-muted hover:text-primary transition-colors" onClick={() => handleDownload('PPT')}>
                <Presentation className="h-5 w-5" />
                <span className="sr-only">Download PPT</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Download PPT</p>
            </TooltipContent>
          </ShadcnTooltip>

          {/* Excel Icon */}
          <ShadcnTooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-gray-400 hover:bg-muted hover:text-primary transition-colors" onClick={() => handleDownload('Excel')}>
                <FileSpreadsheet className="h-5 w-5" />
                <span className="sr-only">Export Excel</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Export Excel</p>
            </TooltipContent>
          </ShadcnTooltip>

          {/* PDF Icon */}
          <ShadcnTooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-gray-400 hover:bg-muted hover:text-primary transition-colors" onClick={() => handleDownload('PDF')}>
                <FileText className="h-5 w-5" />
                <span className="sr-only">Export PDF</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Export PDF</p>
            </TooltipContent>
          </ShadcnTooltip>

          {/* Date Range Filter */}
          <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
            <SelectTrigger className="w-auto bg-transparent border-none p-0 text-black font-medium [&>svg]:h-3 [&>svg]:w-3 [&>svg]:ml-1 hover:underline focus:ring-0 focus:ring-offset-0">
              <SelectValue placeholder="Select Date Range" />
            </SelectTrigger>
            <SelectContent className="neumorphic-card text-popover-foreground border border-border" align="end">
              <SelectItem value="today" className="focus:bg-accent focus:text-accent-foreground">Today</SelectItem>
              <SelectItem value="this-week" className="focus:bg-accent focus:text-accent-foreground">This Week</SelectItem>
              <SelectItem value="last-30-days" className="focus:bg-accent focus:text-accent-foreground">Last 30 Days</SelectItem>
              <SelectItem value="custom" className="focus:bg-accent focus:text-accent-foreground">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Video Tutorial Modal */}
      <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
        <DialogContent className="sm:max-w-[800px] h-[500px] flex flex-col neumorphic-card border border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-primary">Dashboard Tutorial</DialogTitle>
          </DialogHeader>
          <div className="flex-grow w-full">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ" // Example YouTube video
              title="Dashboard Tutorial Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="rounded-lg"
            ></iframe>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PageHeaderActions;