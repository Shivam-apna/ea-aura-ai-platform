import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface VoiceVisualizerProps {
  isListening: boolean;
  className?: string;
}

const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ isListening, className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const barsRef = useRef<number[]>([]);

  useEffect(() => {
    if (!isListening) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bars = 5;
    const barWidth = canvas.width / bars;
    
    // Initialize bars with random heights
    if (barsRef.current.length === 0) {
      barsRef.current = Array.from({ length: bars }, () => Math.random() * 0.3);
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      barsRef.current.forEach((height, index) => {
        // Add some randomness to the animation
        const newHeight = height + (Math.random() - 0.5) * 0.1;
        barsRef.current[index] = Math.max(0.1, Math.min(1, newHeight));
        
        const x = index * barWidth + barWidth * 0.1;
        const y = canvas.height - (canvas.height * barsRef.current[index]);
        const w = barWidth * 0.8;
        const h = canvas.height * barsRef.current[index];

        // Create gradient
        const gradient = ctx.createLinearGradient(x, y, x, y + h);
        gradient.addColorStop(0, '#ef4444');
        gradient.addColorStop(0.5, '#f97316');
        gradient.addColorStop(1, '#eab308');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, w, h);

        // Add rounded corners effect
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 10;
        ctx.fillRect(x, y, w, h);
        ctx.shadowBlur = 0;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isListening]);

  if (!isListening) return null;

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <canvas
        ref={canvasRef}
        width={60}
        height={30}
        className="rounded-lg"
      />
    </div>
  );
};

export default VoiceVisualizer; 