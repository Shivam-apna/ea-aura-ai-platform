import React, { useState, useEffect, useRef } from 'react';
import { Mic, Volume2, VolumeX, Loader2 } from 'lucide-react';

// Main Voice Assistant Component
const VoiceAssistant = ({
    isLoading = false,
    isSpeaking = false,
    onToggleListening,
    onCreateTTS,
    className = ""
}) => {
    const [isListening, setIsListening] = useState(false);
    const canvasRef = useRef(null);
    const animationRef = useRef(null);

    // Animated gradient orb visualization
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set proper canvas dimensions
        canvas.width = 200;
        canvas.height = 200;

        let time = 0;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Create gradient orb
            const baseRadius = isSpeaking || isListening ? 60 + Math.sin(time * 4) * 8 : 50 + Math.sin(time * 0.5) * 3;

            // Create animated gradient
            const gradient = ctx.createRadialGradient(
                centerX - 10 + Math.sin(time * 2) * 5,
                centerY - 10 + Math.cos(time * 1.7) * 5,
                0,
                centerX,
                centerY,
                baseRadius + 20
            );

            if (isSpeaking) {
                // Speaking animation - more vibrant colors
                const hue1 = (time * 50) % 360;
                const hue2 = (time * 30 + 120) % 360;
                const hue3 = (time * 40 + 240) % 360;

                gradient.addColorStop(0, `hsl(${hue1}, 100%, 70%)`);
                gradient.addColorStop(0.3, `hsl(${hue2}, 90%, 65%)`);
                gradient.addColorStop(0.7, `hsl(${hue3}, 85%, 60%)`);
                gradient.addColorStop(1, `hsl(${hue1}, 80%, 45%)`);
            } else if (isListening) {
                // Listening animation - green-blue spectrum
                const hue1 = 120 + Math.sin(time * 3) * 30; // Green variations
                const hue2 = 180 + Math.sin(time * 2) * 40; // Blue variations

                gradient.addColorStop(0, `hsl(${hue1}, 80%, 70%)`);
                gradient.addColorStop(0.5, `hsl(${hue2}, 85%, 65%)`);
                gradient.addColorStop(1, `hsl(${hue1 + 60}, 75%, 50%)`);
            } else if (isLoading) {
                // Loading animation - warm colors
                const hue = (time * 60) % 360;
                gradient.addColorStop(0, `hsl(${hue}, 70%, 75%)`);
                gradient.addColorStop(0.5, `hsl(${hue + 60}, 80%, 65%)`);
                gradient.addColorStop(1, `hsl(${hue + 120}, 75%, 55%)`);
            } else {
                // Idle state - soft rainbow
                gradient.addColorStop(0, '#ff6b6b');
                gradient.addColorStop(0.2, '#4ecdc4');
                gradient.addColorStop(0.4, '#45b7d1');
                gradient.addColorStop(0.6, '#96ceb4');
                gradient.addColorStop(0.8, '#ffeaa7');
                gradient.addColorStop(1, '#fd79a8');
            }

            // Draw main orb
            ctx.beginPath();
            ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();

            // Add outer glow effect
            if (isSpeaking || isListening) {
                const glowGradient = ctx.createRadialGradient(centerX, centerY, baseRadius, centerX, centerY, baseRadius + 30);
                glowGradient.addColorStop(0, isSpeaking ? 'rgba(255, 107, 107, 0.4)' : 'rgba(168, 197, 116, 0.4)');
                glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

                ctx.beginPath();
                ctx.arc(centerX, centerY, baseRadius + 30, 0, Math.PI * 2);
                ctx.fillStyle = glowGradient;
                ctx.fill();
            }

            // Add subtle highlight
            const highlightGradient = ctx.createRadialGradient(
                centerX - 15, centerY - 15, 0,
                centerX - 15, centerY - 15, 25
            );
            highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
            highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

            ctx.beginPath();
            ctx.arc(centerX - 15, centerY - 15, 25, 0, Math.PI * 2);
            ctx.fillStyle = highlightGradient;
            ctx.fill();

            time += 0.03;
            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isSpeaking, isListening, isLoading]);

    const handleMicClick = () => {
        setIsListening(!isListening);
        onToggleListening?.(!isListening);
    };

    return (
        <div className={`flex flex-col items-center space-y-4 p-4 ${className}`}>
            {/* Gradient Orb Visualization */}
            <div className="relative w-48 h-48 flex items-center justify-center">
                <canvas
                    ref={canvasRef}
                    className="w-full h-full"
                    style={{
                        filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.3))',
                        background: 'transparent'
                    }}
                />

                {/* Status indicator */}
                <div className="absolute -top-2 -right-2">
                    {isLoading && (
                        <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center animate-spin border border-white/30">
                            <Loader2 className="w-5 h-5 text-white" />
                        </div>
                    )}
                    {isSpeaking && !isLoading && (
                        <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center animate-pulse border border-white/30">
                            <Volume2 className="w-5 h-5 text-white" />
                        </div>
                    )}
                    {isListening && !isLoading && (
                        <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center animate-pulse border border-white/30">
                            <Mic className="w-5 h-5 text-white" />
                        </div>
                    )}
                </div>
            </div>

            {/* Status Text */}
            <div className="text-center">
                <p className="text-lg font-semibold text-gray-800">
                    {isLoading && "Processing..."}
                    {isSpeaking && !isLoading && "Speaking..."}
                    {isListening && !isLoading && "Listening"}
                    {!isLoading && !isSpeaking && !isListening && "Ready"}
                </p>
            </div>
        </div>
    );
};

// Compact Voice Visualizer using GIF
export const CompactVoiceVisualizer = ({ isSpeaking = false, className = "" }) => {
    return (
        <div className={`flex items-center justify-center ${className}`}>
            {isSpeaking ? (
                <img
                    src="/avatar.gif"
                    alt="Voice visualization"
                    className="w-20 h-20 object-contain"
                    style={{
                        filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0))',
                    }}
                />
            ) : (
                <div
                    className="w-20 h-20 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 opacity-50"
                    style={{
                        filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0))',
                    }}
                />
            )}
        </div>
    );
};

export default VoiceAssistant;