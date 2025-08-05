import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowRight, CheckCircle } from 'lucide-react';

interface WelcomePageProps {
  userName: string;
  fullName: string;
  onGetStarted: () => void;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ userName, onGetStarted, fullName }) => {
  const quickStartItems = [
    "Explore your personalized dashboard",
    "Connect your data sources",
    "Generate your first report with AI",
    "Customize your settings and preferences",
    "Invite team members to collaborate",
  ];

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-5xl font-bold text-foreground mb-4">
        Welcome, <span className="text-primary">{fullName}</span>! {/* Changed text-blue-500 to text-primary */}
      </h1>
      <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
        What would you like to explore?
      </p>

      <Button
        onClick={onGetStarted}
        className={cn(
          "px-8 py-3 text-lg font-semibold rounded-full",
          "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground",
          "shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        )}
      >
        Get Started <ArrowRight className="ml-2 h-5 w-5" />
      </Button>

      <Card className="mt-12 w-full max-w-xl bg-card text-foreground shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-center text-primary">Quick Start Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {quickStartItems.map((item, index) => (
            <div key={index} className="flex items-center bg-muted/50 p-4 rounded-lg shadow-sm">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
              <p className="text-base text-foreground text-left">{item}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default WelcomePage;