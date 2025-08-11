import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowRight, History } from 'lucide-react';
import NewsFeed from './NewsFeed';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTheme } from '@/components/ThemeProvider';

// Import both logo images with correct filenames
import logoLightImage from '../images/EA-AURA.AI.svg';
// import logoDarkImage from '../images/EA-AURA.AI_Black.svg'; // Removed as it's no longer needed

interface WelcomeBackPageProps {
  userName: string;
  fullName: string;
  lastActivity: string;
  userDomain: string;
  onContinue: () => void;
}

const WelcomeBackPage: React.FC<WelcomeBackPageProps> = ({ userName, lastActivity, userDomain, onContinue, fullName }) => {
  const { theme } = useTheme();

  // Get initials from full name (first letter of first and last word)
  const getInitials = (name: string) => {
    if (!name) return "";
    const parts = name.trim().split(" ");
    if (parts.length === 1) {
      return parts[0][0]?.toUpperCase() || "";
    }
    const first = parts[0][0];
    const last = parts[parts.length - 1][0];
    return (first + last).toUpperCase();
  };
  const initials = getInitials(fullName);

  return (
    <div className="relative z-20 w-full max-w-4xl bg-white rounded-3xl shadow-2xl p-4 md:p-6 flex flex-col items-center mt-0">
      <header className="absolute top-0 left-0 right-0 z-30 w-full px-6 py-3 flex items-center justify-between bg-background shadow-md rounded-t-3xl">
        <img
          src={logoLightImage} // Always use light logo
          alt="EA-AURA.AI Logo"
          className="h-16 w-auto object-contain transition-opacity duration-300"
          onError={(e) => {
            console.error('Logo failed to load');
            (e.target as HTMLImageElement).src = logoLightImage;
          }}
        />
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9"> {/* Changed to h-9 w-9 */}
            {/* Replaced AvatarImage with AvatarFallback */}
            <AvatarFallback className="w-full h-full text-blue-800 bg-white text-base font-semibold flex items-center justify-center"> {/* Explicitly set text-blue-800 and bg-white */}
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-foreground font-medium text-lg">{fullName}</span>
        </div>
      </header>

      <div className="flex flex-col items-center justify-center p-4 text-center pt-20">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Welcome back, <span className="text-primary">{fullName}</span><span className="text-primary">!</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl flex items-center justify-center gap-2">
          <History className="h-6 w-6 text-gray-600" /> Your last activity: <span className="font-semibold">{lastActivity}</span>
        </p>

        <Button
          onClick={onContinue}
          className={cn(
            "px-8 py-3 text-lg font-semibold rounded-full",
            "bg-gradient-to-r from-primary to-primary/80 text-white",
            "shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          )}
        >
          Continue <ArrowRight className="ml-2 h-5 w-5" />
        </Button>

        <div className="mt-8 w-full max-w-2xl">
          <NewsFeed companyDomain={userDomain} />
        </div>
      </div>
    </div>
  );
};

export default WelcomeBackPage;