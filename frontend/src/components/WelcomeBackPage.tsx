import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowRight, History } from 'lucide-react';
import NewsFeed from './NewsFeed'; // Import the NewsFeed component

interface WelcomeBackPageProps {
  userName: string;
  lastActivity: string; // Placeholder for last activity
  userDomain: string; // User's email domain for news feed
  onContinue: () => void;
}

const WelcomeBackPage: React.FC<WelcomeBackPageProps> = ({ userName, lastActivity, userDomain, onContinue }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-5xl font-bold text-foreground mb-4">
        Welcome back, <span className="text-primary">{userName}</span>! {/* Changed text-blue-500 to text-primary */}
      </h1>
      <p className="text-xl text-muted-foreground mb-8 max-w-2xl flex items-center justify-center gap-2">
        <History className="h-6 w-6 text-muted-foreground" /> Your last activity: <span className="font-semibold">{lastActivity}</span>
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