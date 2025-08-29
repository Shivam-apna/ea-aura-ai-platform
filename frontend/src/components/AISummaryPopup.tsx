import React from 'react';
import { X, Lightbulb } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
 
interface AISummaryPopupProps {
  summaryText: string;
  onClose: () => void;
  className?: string;
}
 
const AISummaryPopup: React.FC<AISummaryPopupProps> = ({ summaryText, onClose, className }) => {
  return (
    <Card className={cn(
      "w-full bg-background/95 backdrop-blur-sm shadow-lg border border-blue-300/50", // Removed absolute positioning classes
      className
    )}>
      <CardContent className="p-4 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close summary"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-start gap-2 mb-2">
          <Lightbulb className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="font-semibold text-sm text-foreground">AI Insight:</p>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {summaryText || "No Summary"} {/* Display "No Summary" if summaryText is empty */}
        </p>
      </CardContent>
    </Card>
  );
};
 
export default AISummaryPopup;