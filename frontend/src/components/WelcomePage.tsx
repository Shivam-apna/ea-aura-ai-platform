import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowRight, History } from 'lucide-react'; // Added History icon for consistency
import NewsFeed from './NewsFeed'; // Import the NewsFeed component
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Import Avatar components
import { useTheme } from '@/components/ThemeProvider'; // Import useTheme

// Import both logo images with correct filenames
import logoLightImage from '../images/EA-AURA.AI.svg';
import logoDarkImage from '../images/EA-AURA.AI_Black.svg';

interface WelcomePageProps {
  userName: string;
  fullName: string;
  userDomain: string; // Added userDomain prop
  onGetStarted: () => void;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ userName, onGetStarted, fullName, userDomain }) => {
  const { theme } = useTheme(); // Get current theme

  return (
    <div className="relative z-20 w-full max-w-4xl bg-white rounded-3xl shadow-2xl p-4 md:p-6 flex flex-col items-center mt-0"> {/* Reduced padding, removed mt-8 */}
      {/* NEW HEADER SECTION */}
      <header className="absolute top-0 left-0 right-0 z-30 w-full px-6 py-3 flex items-center justify-between bg-background shadow-md rounded-t-3xl">
        {/* Right: Company Logo (now on the left) */}
        <img
          src={theme === 'dark' ? logoDarkImage : logoLightImage}
          alt="EA-AURA.AI Logo"
          className="h-16 w-auto object-contain transition-opacity duration-300"
          onError={(e) => {
            console.error('Logo failed to load');
            (e.target as HTMLImageElement).src = logoLightImage; // Fallback to light logo
          }}
        />
        {/* Left: User Avatar & Name (now on the right) */}
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border-2 border-primary">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${fullName}`} alt={fullName} />
            <AvatarFallback className="bg-primary text-primary-foreground text-base font-semibold">
              {fullName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-foreground font-medium text-lg">{fullName}</span>
        </div>
      </header>

      <div className="flex flex-col items-center justify-center p-4 text-center pt-20"> {/* Reduced p-8 to p-4 */}
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Welcome, <span className="text-primary">{fullName}</span>!
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl flex items-center justify-center gap-2">
           What would you like to explore?
        </p>

        <Button
          onClick={onGetStarted}
          className={cn(
            "px-8 py-3 text-lg font-semibold rounded-full",
            "bg-gradient-to-r from-primary to-primary/80 text-white",
            "shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          )}
        >
          Get Started <ArrowRight className="ml-2 h-5 w-5" />
        </Button>

        {/* Integrated NewsFeed component */}
        <div className="mt-8 w-full max-w-2xl"> {/* Reduced mt-12 to mt-8 */}
          <NewsFeed companyDomain={userDomain} />
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;