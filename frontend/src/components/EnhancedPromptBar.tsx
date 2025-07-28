import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const EnhancedPromptBar: React.FC = () => {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
      // Escape to clear and blur
      if (event.key === 'Escape') {
        if (inputRef.current) {
          inputRef.current.blur();
        }
        setInput('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSend = async () => {
    if (input.trim() === "") {
      toast.error("Please enter a prompt.");
      return;
    }

    setIsLoading(true);
    const promptText = input.trim();
    setInput(""); // Clear input immediately

    try {
      const res = await fetch('http://localhost:3002/api/index', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          index: 'user_prompts', // Elasticsearch index name
          data: {
            prompt: promptText,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to send prompt to backend.');
      }

      const result = await res.json();
      console.log('Prompt successfully indexed:', result);
      toast.success("Prompt sent to Elasticsearch!");

    } catch (error: any) {
      console.error("Error sending prompt:", error);
      toast.error(`Failed to send prompt: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = () => {
    toast.info("Voice input functionality is under development.");
    console.log("Voice input activated!");
    // In a real application, you would integrate Web Speech API here
  };

  return (
    <div className={cn(
      "flex items-center h-10 rounded-prompt-bar bg-white border border-gray-200 shadow-sm transition-all duration-200", // Changed rounded-full to rounded-prompt-bar
      "focus-within:border-blue-500 focus-within:shadow-md", // Apply focus styles to container
      "hover:border-gray-300 hover:shadow-md", // Apply hover styles to container
      "w-full max-w-[1500px] mx-auto" // Full width, centered, max-width
    )}>
      <Input
        ref={inputRef}
        placeholder="Ask-Aura"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && handleSend()}
        className={cn(
          "flex-grow h-full border-none bg-transparent text-sm font-normal text-gray-800 placeholder:text-gray-500",
          "px-4 focus-visible:ring-0 focus-visible:ring-offset-0" // Remove default input focus ring
        )}
        disabled={isLoading}
      />
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full text-gray-600 hover:text-gray-800 transition-colors flex-shrink-0"
        onClick={handleVoiceInput}
        aria-label="Voice Input"
        disabled={isLoading}
      >
        <Mic className="h-4 w-4" />
      </Button>
      <Button
        onClick={handleSend}
        disabled={isLoading || !input.trim()}
        variant="default"
        className="h-8 px-4 rounded-prompt-bar mr-1 flex-shrink-0 disabled:opacity-100 text-white" // Changed rounded-full to rounded-prompt-bar
      >
        Generate
      </Button>
    </div>
  );
};

export default EnhancedPromptBar;