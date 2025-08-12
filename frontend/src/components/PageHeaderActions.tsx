import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Video, Presentation, FileSpreadsheet, FileText, Download, Speech } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip as ShadcnTooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import ClipLoader from "react-spinners/ClipLoader";
import { useTheme } from '@/components/ThemeProvider';
import VoiceAssistant, { CompactVoiceVisualizer } from "@/components/AvatarVisualizer"
import { stopCurrentTTS } from "@/utils/avatars";


interface PageHeaderActionsProps {
  title: string;
  className?: string;
  onDownloadPDF?: () => void;
  downloadingPdf?: boolean;
  hasChartsData?: boolean;
  onCreateTTS?: () => void;
  ttsLoading?: boolean;
  isSpeaking?: boolean;
  setIsSpeaking?: (speaking: boolean) => void;
}

const PageHeaderActions: React.FC<PageHeaderActionsProps> = ({
  title,
  className,
  onDownloadPDF,
  downloadingPdf = false,
  hasChartsData = false,
  onCreateTTS,
  ttsLoading = false,
  isSpeaking = false,
  setIsSpeaking
}) => {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const { theme } = useTheme(); // Get the current theme
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  const iconColorClass = theme === 'dark' ? 'text-white' : 'text-primary'; // Conditional class
  // Add this useEffect in PageHeaderActions component
  useEffect(() => {

    if (!isSpeaking && !ttsLoading && isVoiceModalOpen) {

      const timer = setTimeout(() => {

        setIsVoiceModalOpen(false);
      }, 500); // Add delay here - was missing

      return () => {

        clearTimeout(timer);
      };
    }
  }, [isSpeaking, ttsLoading, isVoiceModalOpen]);

  const handleDownload = (type: string) => {
    if (type === 'PDF' && onDownloadPDF) {
      onDownloadPDF();
    } else {
      toast.info(`Simulating ${type} download...`);
      console.log(`Download ${type} triggered.`);
    }
  };

  const handleTTSClick = () => {
    console.log('🎤 TTS button clicked');
    setIsVoiceModalOpen(true);
    if (onCreateTTS) {
      onCreateTTS();
    }
  };

  const handleVoiceModalClose = (open: boolean) => {
    console.log(' Voice modal close triggered:', { open, isSpeaking, setIsSpeakingAvailable: !!setIsSpeaking });

    setIsVoiceModalOpen(open);

    if (!open) {
      if (setIsSpeaking) {
        // Stop audio when dialog closes

        stopCurrentTTS(setIsSpeaking);
        console.log('✅ stopCurrentTTS called');
      } else {
        stopCurrentTTS(() => {
          console.log('⚠️ Dummy setIsSpeaking called - state might not update in UI');
        });
      }
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
          {/* <ShadcnTooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={cn("h-8 w-8 rounded-full hover:bg-muted hover:text-foreground transition-colors", iconColorClass)} onClick={() => setIsVideoModalOpen(true)}>
                <Video className="h-5 w-5" />
                <span className="sr-only">Watch Demo</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Watch Demo</p>
            </TooltipContent>
          </ShadcnTooltip> */}

          {/* PowerPoint Icon */}
          {/* <ShadcnTooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={cn("h-8 w-8 rounded-full hover:bg-muted hover:text-foreground transition-colors", iconColorClass)} onClick={() => handleDownload('PPT')}>
                <Presentation className="h-5 w-5" />
                <span className="sr-only">Export to PowerPoint</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Export to PowerPoint</p>
            </TooltipContent>
          </ShadcnTooltip> */}

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
          {/* TTS/Avatar Button - Updated to disable while speaking */}
          <ShadcnTooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8 rounded-full hover:bg-muted hover:text-foreground transition-colors", iconColorClass)}
                onClick={handleTTSClick}
                disabled={ttsLoading || isSpeaking}
              >
                {ttsLoading ? (
                  <ClipLoader size={16} color="currentColor" />
                ) : (
                  <Speech className={cn("h-4 w-4", theme === 'dark' ? 'text-white' : 'text-primary')} />
                )}
                <span className="sr-only">Voice Summary</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {ttsLoading
                  ? 'Generating voice...'
                  : isSpeaking
                    ? 'Currently speaking...'
                    : 'Voice Summary'
                }
              </p>
            </TooltipContent>
          </ShadcnTooltip>
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
              src=""
              title="Dashboard Tutorial Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="rounded-lg"
            ></iframe>
          </div>
        </DialogContent>
      </Dialog>
      {/* Voice Assistant Modal - Updated with debug handler */}
      {/* <Dialog open={isVoiceModalOpen} onOpenChange={handleVoiceModalClose}>
        <DialogContent className="sm:max-w-[400px] h-[350px] flex flex-col neumorphic-card border border-border text-foreground bg-card">
          <DialogHeader>
            <DialogTitle className="text-primary">Voice Assistant</DialogTitle>
          </DialogHeader>
          <div className="flex-grow flex items-center justify-center">
            <VoiceAssistant
              isLoading={ttsLoading}
              isSpeaking={isSpeaking}
              onToggleListening={() => { }}
              onCreateTTS={onCreateTTS}
              className=""
            />
          </div>
        </DialogContent>
      </Dialog> */}

      {/* ✅ Floating Voice Orb When Speaking */}
      {isSpeaking && (
        <div className="fixed bottom-4 left-4 z-[9999] bg-[rgb(229_242_253)] rounded-full shadow-xl p-2">
          <CompactVoiceVisualizer isSpeaking={isSpeaking} />
        </div>
      )}
    </>
  );
};

export default PageHeaderActions;