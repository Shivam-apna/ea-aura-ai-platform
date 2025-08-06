import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowRight, History } from 'lucide-react';
import NewsFeed from './NewsFeed'; // Import the NewsFeed component

interface WelcomeBackPageProps {
  userName: string;
  fullName: string; // Full name of the user
  lastActivity: string; // Placeholder for last activity
  userDomain: string; // User's email domain for news feed
  onContinue: () => void;
}

const WelcomeBackPage: React.FC<WelcomeBackPageProps> = ({ userName, lastActivity, userDomain, onContinue, fullName }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-5xl font-bold text-gray-900 mb-4"> {/* Changed text-foreground to text-gray-900 */}
        Welcome back, <span className="text-primary">{fullName}</span>!
      </h1>
      <p className="text-xl text-gray-600 mb-8 max-w-2xl flex items-center justify-center gap-2"> {/* Changed text-muted-foreground to text-gray-600 */}
        <History className="h-6 w-6 text-gray-600" /> Your last activity: <span className="font-semibold">{lastActivity}</span> {/* Changed text-muted-foreground to text-gray-600 */}
      </p>

      <Button
        onClick={onContinue}
        className={cn(
          "px-8 py-3 text-lg font-semibold rounded-full",
          "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground",
          "shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        )}
      >
        Continue <ArrowRight className="ml-2 h-5 w-5" />
      </Button>

      <div className="mt-12 w-full max-w-2xl">
        <NewsFeed companyDomain={userDomain} />
      </div>
    </div>
  );
};

export default WelcomeBackPage;