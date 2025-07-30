import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Video, Presentation, FileSpreadsheet, FileText } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip as ShadcnTooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils'; // Import cn for conditional classes

interface PageHeaderActionsProps {
  title: string;
  className?: string; // Added className prop
}

const PageHeaderActions: React.FC<PageHeaderActionsProps> = ({ title, className }) => {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState('today'); // Changed default to 'today'

  const handleDownload = (type: string) => {
    toast.info(`Simulating ${type} download...`);
    console.log(`Download ${type} triggered.`);
    // In a real app, this would trigger a backend API call to generate and serve the file.
  };

  return (
    <>
      <div className={cn("flex justify-between items-center py-2", className)}> {/* Apply the passed className */}
        <div>
          <h1 className="text-base font-semibold text-foreground"> {/* Changed text-[#121212] to text-foreground */}
            {title}
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          {/* Video Icon */}
          <ShadcnTooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-primary hover:bg-muted hover:text-primary transition-colors" onClick={() => setIsVideoModalOpen(true)}> {/* Changed text-[#2f55d4] to text-primary */}
                <Video className="h-5 w-5" />
                <span className="sr-only">Watch Demo</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Watch Demo</p>
            </TooltipContent>
          </ShadcnTooltip>

          {/* PowerPoint Icon */}
          <ShadcnTooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-primary hover:bg-muted hover:text-primary transition-colors" onClick={() => handleDownload('PPT')}> {/* Changed text-[#2f55d4] to text-primary */}
                <Presentation className="h-5 w-5" />
                <span className="sr-only">Export to PowerPoint</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Export to PowerPoint</p>
            </TooltipContent>
          </ShadcnTooltip>

          {/* Excel Icon */}
          <ShadcnTooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-primary hover:bg-muted hover:text-primary transition-colors" onClick={() => handleDownload('Excel')}> {/* Changed text-[#2f55d4] to text-primary */}
                <FileSpreadsheet className="h-5 w-5" />
                <span className="sr-only">Export to Excel</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Export to Excel</p>
            </TooltipContent>
          </ShadcnTooltip>

          {/* PDF Icon */}
          <ShadcnTooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-primary hover:bg-muted hover:text-primary transition-colors" onClick={() => handleDownload('PDF')}> {/* Changed text-[#2f55d4] to text-primary */}
                <FileText className="h-5 w-5" />
                <span className="sr-only">Download PDF</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Download PDF</p>
            </TooltipContent>
          </ShadcnTooltip>

          {/* Date Range Filter */}
          <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
            <SelectTrigger className="w-auto bg-transparent border-none p-0 text-primary font-normal text-sm [&>svg]:h-4 [&>svg]:w-4 [&>svg]:ml-1 hover:underline focus:ring-0 focus:ring-offset-0"> {/* Changed text-[#2f55d4] to text-primary */}
              <SelectValue placeholder="Select Date Range" />
            </SelectTrigger>
            <SelectContent className="neumorphic-card text-popover-foreground border border-border">
              <SelectItem value="today" className="focus:bg-accent focus:text-accent-foreground">Today</SelectItem>
              <SelectItem value="last-7-days" className="focus:bg-accent focus:text-accent-foreground">Last 7 Days</SelectItem>
              <SelectItem value="last-30-days" className="focus:bg-accent focus:text-accent-foreground">Last 30 Days</SelectItem>
              <SelectItem value="custom" className="focus:bg-accent focus:text-accent-foreground">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Video Tutorial Modal */}
      <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
        <DialogContent className="sm:max-w-[800px] h-[500px] flex flex-col neumorphic-card border border-border text-foreground bg-card"> {/* Added bg-card */}
          <DialogHeader>
            <DialogTitle className="text-primary">Dashboard Tutorial</DialogTitle>
          </DialogHeader>
          <div className="flex-grow w-full">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ"
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