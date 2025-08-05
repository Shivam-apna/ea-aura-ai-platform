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
      "flex items-center h-10 rounded-full bg-white shadow-lg transition-all duration-200", // Changed shadow-sm to shadow-lg
      "focus-within:border-blue-500 focus-within:shadow-md", // Apply focus styles to container
      "hover:border-gray-300 hover:shadow-md", // Apply hover styles to container
      "w-full max-w-[1500px] mx-auto pr-1",
      "dark:shadow-prompt-glow" // Add this line
    )}>
      <div className="relative flex-grow"> {/* Container for input and mic icon */}
        <Input
          ref={inputRef}
          placeholder="Ask-Aura"
          value={input}
          onChange={(e) => e.target.value.length <= 200 && setInput(e.target.value)} // Limit input length
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
          className={cn(
            "flex-grow h-full border-none bg-transparent text-sm font-normal text-foreground placeholder:text-muted-foreground",
            "pl-4 pr-10 focus-visible:ring-0 focus-visible:ring-offset-0" // Padding for text and mic icon
          )}
          disabled={isLoading}
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          onClick={handleVoiceInput}
          aria-label="Voice Input"
          disabled={isLoading}
        >
          <Mic className="h-4 w-4" />
        </Button>
      </div>
      <Button
        onClick={handleSend}
        disabled={isLoading || !input.trim()}
        variant="default"
        className="h-8 px-4 py-1.5 rounded-full flex-shrink-0 disabled:opacity-100 bg-primary text-primary-foreground hover:bg-primary/90 shadow hover:shadow-md" // Generate button styling
      >
        Generate
      </Button>
    </div>
  );
};

export default EnhancedPromptBar;