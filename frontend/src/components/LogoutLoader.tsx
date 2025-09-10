import React from 'react';
import { ClipLoader } from 'react-spinners';
import { useTheme } from '@/components/ThemeProvider';
import { cn } from '@/lib/utils';

const LogoutLoader: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  // Use primary color for spinner, which is theme-aware
  const spinnerColor = 'hsl(var(--primary))'; 

  return (
    <div className={cn(
      "fixed inset-0 z-[9999] flex flex-col items-center justify-center",
      "bg-background text-foreground transition-opacity duration-300 ease-out"
    )}>
      <ClipLoader size={50} color={spinnerColor} />
      <p className="mt-4 text-lg font-semibold">Logging out...</p>
    </div>
  );
};

export default LogoutLoader;