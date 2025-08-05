import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface VoiceLevelIndicatorProps {
  level: number;
  isListening: boolean;
  className?: string;
}

const VoiceLevelIndicator: React.FC<VoiceLevelIndicatorProps> = ({ level, isListening, className }) => {
  const barsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isListening || !barsRef.current) return;

    const bars = barsRef.current.children;
    const numBars = bars.length;

    for (let i = 0; i < numBars; i++) {
      const bar = bars[i] as HTMLElement;
      const threshold = (i + 1) / numBars;
      
      if (level >= threshold) {
        bar.style.height = `${Math.random() * 60 + 20}%`;
        bar.style.opacity = '1';
      } else {
        bar.style.height = '10%';
        bar.style.opacity = '0.3';
      }
    }
  }, [level, isListening]);

  if (!isListening) return null;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "w-1 bg-gradient-to-t from-red-500 to-orange-400 rounded-full transition-all duration-150 ease-out",
            "shadow-sm"
          )}
          style={{
            height: '10%',
            opacity: 0.3,
          }}
        />
      ))}
    </div>
  );
};

export default VoiceLevelIndicator; 