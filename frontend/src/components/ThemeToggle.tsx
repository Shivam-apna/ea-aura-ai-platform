import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { cn } from '@/lib/utils';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const isLight = theme === 'light';

  const handleToggleTheme = () => {
    setTheme(isLight ? 'dark' : 'light');
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isLight}
      aria-label="Toggle theme"
      onClick={handleToggleTheme}
      className={cn(
        "relative flex items-center h-8 w-[70px] rounded-full cursor-pointer transition-colors duration-300", // Adjusted height and width
        "bg-secondary border border-border", // Light mode background and border - changed bg-white to bg-secondary, border-gray-200 to border-border
        "dark:bg-secondary dark:border-border", // Dark mode background and border - changed bg-black to bg-secondary, border-gray-700 to border-border
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      )}
    >
      {/* Sun Icon (Left) */}
      <Sun
        className={cn(
          "absolute left-1.5 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors duration-300 z-10", // Adjusted size
          isLight ? "text-primary" : "text-muted-foreground" // Vibrant blue for active, gray for inactive - changed text-[#3AA7F8] to text-primary, text-gray-500 to text-muted-foreground
        )}
      />

      {/* Moon Icon (Right) */}
      <Moon
        className={cn(
          "absolute right-1.5 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors duration-300 z-10", // Adjusted size
          !isLight ? "text-primary" : "text-muted-foreground" // Vibrant blue for active, gray for inactive - changed text-[#3AA7F8] to text-primary, text-gray-500 to text-muted-foreground
        )}
      />

      {/* Sliding Knob */}
      <span
        className={cn(
          "absolute top-1/2 -translate-y-1/2 h-7 w-7 rounded-full shadow-lg transition-all duration-300 ease-in-out", // Adjusted size
          isLight ? "left-[calc(100%-theme('width.7')-theme('spacing.1'))]" : "left-[2px]", // Dynamic left positioning
          "bg-primary" // Vibrant blue knob color - changed bg-[#3AA7F8] to bg-primary
        )}
      />
    </button>
  );
};

export default ThemeToggle;