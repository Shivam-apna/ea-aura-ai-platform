import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { RefreshCw, Bell } from 'lucide-react';
import { useKeycloak } from '@/components/Auth/KeycloakProvider';
import { cn } from '@/lib/utils';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '@/components/ThemeProvider'; // Import useTheme

// Import both logo images with correct filenames
import logoLightImage from '../images/EA-AURA.AI-JPEG.jpg';
import logoDarkImage from '../images/EA-AURA.AI_Black_JPEG.jpg';

interface AppHeaderProps {
  companyName: string;
  onSelectAgent: (agent: string) => void; // This prop is still needed for sidebar navigation
}

const AppHeader: React.FC<AppHeaderProps> = ({ companyName, onSelectAgent }) => {
  const [mounted, setMounted] = useState(false);
  const { keycloak, authenticated } = useKeycloak(); // Keep keycloak for potential future use or if other parts need it
  const { theme } = useTheme(); // Removed resolvedTheme

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Show light theme by default until mounted
  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 w-full bg-background border-b border-border/50 px-6 py-3 flex items-center justify-between shadow-sm">
        <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
          <img
            src={logoLightImage}
            alt="EA-AURA.AI Logo"
            className="h-12 w-auto object-contain transition-opacity duration-300"
            onError={(e) => {
              console.error('Light logo failed to load');
            }}
          />
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <RefreshCw className="h-5 w-5" />
            <span className="sr-only">Refresh Data</span>
          </Button>
          <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          </Button>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-background border-b border-border/50 px-6 py-3 flex items-center justify-between shadow-sm">
      {/* Left: Logo with CSS fallback approach */}
      <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
        {/* Light mode logo - hidden in dark mode */}
        <img
          src={logoLightImage}
          alt="EA-AURA.AI Logo"
          className="h-12 w-auto object-contain block dark:hidden transition-opacity duration-300"
          onError={(e) => {
            console.error('Light logo failed to load');
          }}
        />
        {/* Dark mode logo - hidden in light mode */}
        <img
          src={logoDarkImage}
          alt="EA-AURA.AI Black Logo"
          className="h-12 w-auto object-contain hidden dark:block transition-opacity duration-300"
          onError={(e) => {
            console.error('Dark logo failed to load');
          }}
        />
      </Link>

      {/* Right: Header Actions (Theme Toggle, Refresh, Bell) */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <RefreshCw className="h-5 w-5" />
          <span className="sr-only">Refresh Data</span>
        </Button>

        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
        </Button>
      </div>
    </header>
  );
};

export default AppHeader;