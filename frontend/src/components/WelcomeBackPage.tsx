import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, History } from 'lucide-react';
import NewsFeed from './NewsFeed';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useTheme } from '@/components/ThemeProvider';
import { CompactVoiceVisualizer } from "@/components/AvatarVisualizer";
import { cn } from '@/lib/utils';
import logoLightImage from '../images/EA-AURA.AI.svg';

interface WelcomeBackPageProps {
  userName: string;
  fullName: string;
  lastActivity: string;
  userDomain: string;
  onContinue: () => void;
}

const WelcomeBackPage: React.FC<WelcomeBackPageProps> = ({
  fullName,
  lastActivity,
  userDomain,
  onContinue
}) => {
  const { theme } = useTheme();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [femaleVoice, setFemaleVoice] = useState<SpeechSynthesisVoice | null>(null);

  // Get initials from full name
  const getInitials = (name: string) => {
    if (!name) return "";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || "";
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };
  const initials = getInitials(fullName);

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      const female = voices.find(
        (v) =>
          v.name.toLowerCase().includes('female') ||
          v.name.toLowerCase().includes('google us english')
      );
      if (female) setFemaleVoice(female);
    };

    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // Speak messages
  useEffect(() => {
    const messages = [
      `Welcome back ${fullName}`,
      `Your last activity: ${lastActivity}`,
      `Here are a few trending news of Artificial Intelligence throughout the globe. If you want to know about it, please click on any news. And if you want to use our app, please click on the continue button to move ahead.`
    ];

    let index = 0;
    const speakNext = () => {
      if (index >= messages.length) {
        setIsSpeaking(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(messages[index]);
      utterance.lang = 'en-US';
      utterance.rate = 1;
      utterance.pitch = 1;
      if (femaleVoice) utterance.voice = femaleVoice;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        index++;
        setTimeout(speakNext, 500); // short pause
      };

      speechSynthesis.speak(utterance);
    };

    speakNext();

    return () => {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    };
  }, [fullName, lastActivity, femaleVoice]);

  return (
    <div className="relative z-20 w-full max-w-4xl bg-white rounded-3xl shadow-2xl p-4 md:p-6 flex flex-col items-center mt-0">
      {/* Voice Assistant Orb in bottom-left of card */}
      {isSpeaking && (
        <div className="absolute bottom-4 left-4 bg-[rgb(229 242 253)] rounded-full shadow-xl p-2">
          <CompactVoiceVisualizer isSpeaking={isSpeaking} />
        </div>
      )}

      <header className="absolute top-0 left-0 right-0 z-30 w-full px-6 py-3 flex items-center justify-between bg-background shadow-md rounded-t-3xl">
        <img
          src={logoLightImage}
          alt="EA-AURA.AI Logo"
          className="h-16 w-auto object-contain transition-opacity duration-300"
          onError={(e) => {
            console.error('Logo failed to load');
            (e.target as HTMLImageElement).src = logoLightImage;
          }}
        />
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="w-full h-full text-blue-800 bg-white text-base font-semibold flex items-center justify-center">
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
