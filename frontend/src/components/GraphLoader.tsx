import React from 'react';
import { useTheme } from '@/components/ThemeProvider';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CircleStop } from 'lucide-react';

interface GraphLoaderProps {
  onCancel: () => void;
}

const GraphLoader: React.FC<GraphLoaderProps> = ({ onCancel }) => {
  const { theme } = useTheme();
  const isDarkTheme = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Dark mode colors
  const darkPrimaryBarColor = '#4DA3FF'; // Accent blue
  const darkSecondaryBarColor = '#6CCF7F'; // Light green
  const darkTextColor = '#E0E0E0'; // Lighter neutral
  const darkOverlayBg = 'rgba(0,0,0,0.65)';

  // Light mode colors (current)
  const lightPrimaryBarColor = '#4CB2FF';
  const lightSecondaryBarColor = '#A8C574';
  const lightTextColor = '#2563eb'; // text-blue-600
  const lightOverlayBg = 'rgba(255,255,255,0.3)';

  const overlayBg = isDarkTheme ? darkOverlayBg : lightOverlayBg;
  const primaryBarColor = isDarkTheme ? darkPrimaryBarColor : lightPrimaryBarColor;
  const secondaryBarColor = isDarkTheme ? darkSecondaryBarColor : lightSecondaryBarColor;
  const textColor = isDarkTheme ? darkTextColor : lightTextColor;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center backdrop-blur" style={{ backgroundColor: overlayBg }}>
      <div className="flex flex-col items-center gap-4">
        <svg width="80" height="40" viewBox="0 0 90 40" fill="none">
          <rect x="10" y="20" width="10" height="20" rx="2" fill={primaryBarColor}>
            <animate attributeName="height" values="20;35;20" dur="1s" repeatCount="indefinite" />
            <animate attributeName="y" values="20;5;20" dur="1s" repeatCount="indefinite" />
          </rect>
          <rect x="30" y="10" width="10" height="30" rx="2" fill={secondaryBarColor}>
            <animate attributeName="height" values="30;15;30" dur="1s" repeatCount="indefinite" />
            <animate attributeName="y" values="10;25;10" dur="1s" repeatCount="indefinite" />
          </rect>
          <rect x="50" y="25" width="10" height="15" rx="2" fill={primaryBarColor}>
            <animate attributeName="height" values="15;30;15" dur="1s" repeatCount="indefinite" />
            <animate attributeName="y" values="25;10;25" dur="1s" repeatCount="indefinite" />
          </rect>
          <rect x="70" y="15" width="10" height="25" rx="2" fill={secondaryBarColor}>
            <animate attributeName="height" values="25;10;25" dur="1s" repeatCount="indefinite" />
            <animate attributeName="y" values="15;30;15" dur="1s" repeatCount="indefinite" />
          </rect>
        </svg>
        <span className="text-lg font-semibold animate-pulse" style={{ color: textColor }}>
          Generating your dashboard...
        </span>
        <Button
          onClick={onCancel}
          variant="ghost"
          size="sm"
          className={cn(
            "mt-2 flex items-center gap-2 text-white",
            isDarkTheme
              ? "bg-primary hover:bg-red-600" // Dark mode: primary blue, hover red
              : "bg-[rgb(59,130,246)] hover:bg-[rgb(233,73,73)]" // Light mode: original blue, hover red
          )}
        >
          <CircleStop className="h-4 w-4" /> Cancel
        </Button>
      </div>
    </div>
  );
};

export default GraphLoader;