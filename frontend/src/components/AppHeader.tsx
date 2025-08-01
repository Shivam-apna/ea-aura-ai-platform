import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { RefreshCw, Bell } from 'lucide-react';
import { useKeycloak } from '@/components/Auth/KeycloakProvider';
import { cn } from '@/lib/utils';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '@/components/ThemeProvider';
import { format } from 'date-fns'; // Import format from date-fns

// Import both logo images with correct filenames
import logoLightImage from '../images/EA-AURA.AI.svg';
import logoDarkImage from '../images/EA-AURA.AI_Black.svg';

interface AppHeaderProps {
  companyName: string;
  onSelectAgent: (agent: string) => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ companyName, onSelectAgent }) => {
  const [mounted, setMounted] = useState(false);
  const { keycloak, authenticated } = useKeycloak();
  const { theme } = useTheme();

  // State for current date and time
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Update date and time every minute
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60 * 1000); // Update every minute

    return () => clearInterval(intervalId); // Clear interval on component unmount
  }, []);

  // Format time and date
  const formattedTime = format(currentDateTime, 'h:mm a').toLowerCase();
  const formattedDate = format(currentDateTime, 'EEEE dd MMM yyyy'); // Changed 'yy' to 'yyyy' for full year
  const timezone = '(IST)'; // Static timezone as requested

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Show light theme by default until mounted
  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 w-full bg-background px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
          <img
            src={logoLightImage}
            alt="EA-AURA.AI Logo"
            className="h-20 w-auto object-contain transition-opacity duration-300"
            onError={(e) => {
              console.error('Light logo failed to load');
            }}
          />
        </Link>
        <div className="flex items-center gap-3"> {/* Adjusted gap to ml-3 */}
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <RefreshCw className="h-5 w-5" />
            <span className="sr-only">Refresh Data</span>
          </Button>
          <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
            <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          </Button>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-background px-6 py-3 flex items-center justify-between">
      {/* Left: Logo with CSS fallback approach */}
      <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
        {/* Light mode logo - hidden in dark mode */}
        <img
          src={logoLightImage}
          alt="EA-AURA.AI Logo"
          className="h-20 w-auto object-contain block dark:hidden transition-opacity duration-300"
          onError={(e) => {
            console.error('Light logo failed to load');
          }}
        />
        {/* Dark mode logo - hidden in light mode */}
        <img
          src={logoDarkImage}
          alt="EA-AURA.AI Black Logo"
          className="h-20 w-auto object-contain hidden dark:block transition-opacity duration-300"
          onError={(e) => {
            console.error('Dark logo failed to load');
            // Fallback to light logo if dark logo fails to load
            (e.target as HTMLImageElement).src = logoLightImage;
            (e.target as HTMLImageElement).classList.remove('hidden', 'dark:block');
            (e.target as HTMLImageElement).classList.add('block');
          }}
        />
      </Link>

      {/* Right: Header Actions (Date/Time, Theme Toggle, Refresh, Bell) */}
      <div className="flex items-center gap-3"> {/* Adjusted gap to ml-3 */}
        {/* Date and Time Display */}
        <div className="text-sm text-foreground font-normal mr-1 h-8 flex items-center"> {/* Changed text-primary to text-foreground */}
          {formattedTime}, {formattedDate} {timezone}
        </div>

        <ThemeToggle />

        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-foreground hover:bg-muted hover:text-foreground transition-colors"> {/* Changed text-primary to text-foreground */}
          <RefreshCw className="h-5 w-5" />
          <span className="sr-only">Refresh Data</span>
        </Button>

        <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full text-foreground hover:bg-muted hover:text-foreground transition-colors"> {/* Changed text-primary to text-foreground */}
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
          <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
        </Button>
      </div>
    </header>
  );
};

export default AppHeader;