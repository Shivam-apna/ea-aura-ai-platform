import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Video, Presentation, FileSpreadsheet, FileText, Download } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip as ShadcnTooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import ClipLoader from "react-spinners/ClipLoader";
import { useTheme } from '@/components/ThemeProvider'; // Import useTheme

interface PageHeaderActionsProps {
  title: string;
  className?: string;
  onDownloadPDF?: () => void; // New prop for PDF download handler
  downloadingPdf?: boolean; // New prop for loading state
  hasChartsData?: boolean; // New prop to check if charts data exists
}

const PageHeaderActions: React.FC<PageHeaderActionsProps> = ({
  title,
  className,
  onDownloadPDF,
  downloadingPdf = false,
  hasChartsData = false
}) => {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const { theme } = useTheme(); // Get the current theme

  const iconColorClass = theme === 'dark' ? 'text-white' : 'text-primary'; // Conditional class

  const handleDownload = (type: string) => {
    if (type === 'PDF' && onDownloadPDF) {
      onDownloadPDF();
    } else {
      toast.info(`Simulating ${type} download...`);
      console.log(`Download ${type} triggered.`);
    }
  };

  return (
    <>
      <div className={cn("flex justify-between items-center py-2 w-full max-w-[1500px] mx-auto px-6", className)}>
        <div>
          <h1 className="text-base font-semibold text-foreground">
            {title}
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          {/* Video Icon */}
          <ShadcnTooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={cn("h-8 w-8 rounded-full hover:bg-muted hover:text-foreground transition-colors", iconColorClass)} onClick={() => setIsVideoModalOpen(true)}>
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
              <Button variant="ghost" size="icon" className={cn("h-8 w-8 rounded-full hover:bg-muted hover:text-foreground transition-colors", iconColorClass)} onClick={() => handleDownload('PPT')}>
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
              <Button variant="ghost" size="icon" className={cn("h-8 w-8 rounded-full hover:bg-muted hover:text-foreground transition-colors", iconColorClass)} onClick={() => handleDownload('Excel')}>
                <FileSpreadsheet className="h-5 w-5" />
                <span className="sr-only">Export to Excel</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Export to Excel</p>
            </TooltipContent>
          </ShadcnTooltip>

          {/* PDF Download Button - Updated with conditional rendering and loading state */}
          {hasChartsData && (
            <ShadcnTooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("h-8 w-8 rounded-full hover:bg-muted hover:text-foreground transition-colors", iconColorClass)}
                  onClick={() => handleDownload('PDF')}
                  disabled={downloadingPdf}
                >
                  {downloadingPdf ? (
                    <ClipLoader size={16} color="currentColor" />
                  ) : (
                    <FileText className="h-5 w-5" />
                  )}
                  <span className="sr-only">Download PDF</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{downloadingPdf ? 'Generating PDF...' : 'Download PDF'}</p>
              </TooltipContent>
            </ShadcnTooltip>
          )}
        </div>
      </div>

      {/* Video Tutorial Modal */}
      <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
        <DialogContent className="sm:max-w-[800px] h-[500px] flex flex-col neumorphic-card border border-border text-foreground bg-card">
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