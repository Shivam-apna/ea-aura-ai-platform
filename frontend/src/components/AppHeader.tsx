import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { RefreshCw, Bell, InfoIcon } from 'lucide-react'; // Import InfoIcon
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '@/components/ThemeProvider';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import NotificationPopup from './NotificationPopup';
import { useDashboardRefresh } from '@/contexts/DashboardRefreshContext';

// Import both logo images with correct filenames
import logoLightImage from '../images/EA-AURA.AI.svg';
import logoDarkImage from '../images/EA-AURA.AI_Black.svg';
import AboutModal from './AboutModal'; // Import the new AboutModal

interface AppHeaderProps {
  companyName: string;
  onSelectAgent: (agent: string) => void;
}

interface Notification {
  id: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({ companyName, onSelectAgent }) => {
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();
  const { triggerRefresh } = useDashboardRefresh();

  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: '1', message: 'New sales report available for Q3.', timestamp: '2 hours ago', isRead: false },
    { id: '2', message: 'Your monthly performance review is due.', timestamp: 'Yesterday', isRead: false },
    { id: '3', message: 'System update completed successfully.', timestamp: '2 days ago', isRead: true },
    { id: '4', message: 'New feature: AI-powered insights are live!', timestamp: '3 days ago', isRead: false },
    { id: '5', message: 'Reminder: Data backup scheduled for tonight.', timestamp: '4 days ago', isRead: true },
  ]);
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false); // State for AboutModal

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formattedTime = format(currentDateTime, 'h:mm a').toLowerCase();
  const formattedDate = format(currentDateTime, 'EEEE dd MMM yyyy');
  const timezone = '(IST)';

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  if (location.pathname === '/login' || location.pathname === '/landing') {
    return null;
  }

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
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <RefreshCw className="h-5 w-5" />
            <span className="sr-only">Refresh Data</span>
          </Button>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-background px-6 py-3 flex items-center justify-between">
      <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
        <img
          src={logoLightImage}
          alt="EA-AURA.AI Logo"
          className="h-20 w-auto object-contain block dark:hidden transition-opacity duration-300"
          onError={(e) => {
            console.error('Light logo failed to load');
            (e.target as HTMLImageElement).src = logoLightImage;
            (e.target as HTMLImageElement).classList.remove('hidden', 'dark:block');
            (e.target as HTMLImageElement).classList.add('block');
          }}
        />
        <img
          src={logoDarkImage}
          alt="EA-AURA.AI Black Logo"
          className="h-20 w-auto object-contain hidden dark:block transition-opacity duration-300"
          onError={(e) => {
            console.error('Dark logo failed to load');
            (e.target as HTMLImageElement).src = logoLightImage;
            (e.target as HTMLImageElement).classList.remove('hidden', 'dark:block');
            (e.target as HTMLImageElement).classList.add('block');
          }}
        />
      </Link>

      <div className="flex items-center gap-3">
        <div className="text-sm text-primary font-normal mr-1 h-8 flex items-center">
          {formattedTime}, {formattedDate} {timezone}
        </div>

        <ThemeToggle />

        {/* Info Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full text-primary hover:bg-muted transition-colors"
          onClick={() => setIsAboutModalOpen(true)}
          aria-label="About EA-AURA.AI"
        >
          <InfoIcon className="h-5 w-5" />
          <span className="sr-only">About EA-AURA.AI</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full text-primary hover:bg-muted transition-colors"
          onClick={triggerRefresh}
        >
          <RefreshCw className="h-5 w-5" />
          <span className="sr-only">Refresh Data</span>
        </Button>

        {/* Notification Popover - commented out */}
        {/* <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full text-primary hover:bg-muted transition-colors">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-[340px] max-w-[90vw] z-[100]" align="end">
            <NotificationPopup
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
            />
          </PopoverContent>
        </Popover> */}
      </div>
      <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />
    </header>
  );
};

export default AppHeader;