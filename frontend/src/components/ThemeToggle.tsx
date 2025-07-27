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
        "bg-white border border-gray-200", // Light mode background and border
        "dark:bg-black dark:border-gray-700", // Dark mode background and border
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      )}
    >
      {/* Sun Icon (Left) */}
      <Sun
        className={cn(
          "absolute left-1.5 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors duration-300 z-10", // Adjusted size
          isLight ? "text-[#3AA7F8]" : "text-gray-500" // Vibrant blue for active, gray for inactive
        )}
      />

      {/* Moon Icon (Right) */}
      <Moon
        className={cn(
          "absolute right-1.5 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors duration-300 z-10", // Adjusted size
          !isLight ? "text-[#3AA7F8]" : "text-gray-500" // Vibrant blue for active, gray for inactive
        )}
      />

      {/* Sliding Knob */}
      <span
        className={cn(
          "absolute top-1/2 -translate-y-1/2 h-7 w-7 rounded-full shadow-lg transition-all duration-300 ease-in-out", // Adjusted size
          isLight ? "left-[calc(100%-theme('width.7')-theme('spacing.1'))]" : "left-[2px]", // Dynamic left positioning
          "bg-[#3AA7F8]" // Vibrant blue knob color
        )}
      />
    </button>
  );
};

export default ThemeToggle;