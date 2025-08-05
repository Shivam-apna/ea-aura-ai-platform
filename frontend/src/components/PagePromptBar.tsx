import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner'; // Import toast for notifications

interface PagePromptBarProps {
  placeholder?: string;
  buttonText?: string;
  onSubmit: (value: string) => void;
  onLoadingChange?: (loading: boolean) => void;
  className?: string; // Added className prop
}

const PagePromptBar: React.FC<PagePromptBarProps> = ({
  placeholder = "Ask-Aura",
  buttonText = "Generate",
  onSubmit,
  onLoadingChange,
  className, // Destructure className
}) => {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
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
    onLoadingChange?.(true);

    const promptText = input.trim();
    setInput("");

    try {
      await onSubmit(promptText);
      toast.success("Prompt submitted!");
    } catch (error: any) {
      console.error("Error submitting prompt:", error);
      toast.error(`Failed to submit prompt: ${error.message}`);
    } finally {
      setIsLoading(false);
      onLoadingChange?.(false);
    }
  };

  const handleVoiceInput = () => {
    toast.info("Voice input functionality is under development.");
    console.log("Voice input activated!");
  };

  return (
    <div className={cn(
      "flex items-center h-10 rounded-full bg-white shadow-lg transition-all duration-200", // Changed shadow-sm to shadow-lg
      "focus-within:border-primary focus-within:shadow-md", // Changed border-blue-500 to border-primary
      "hover:border-gray-300 hover:shadow-md",
      "w-full max-w-[1500px] mx-auto px-6", // Changed pr-1 to px-6
      "dark:shadow-prompt-glow", // Add this line
      className // Apply the passed className
    )}>
      <div className="relative flex-grow">
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={input}
          onChange={(e) => e.target.value.length <= 200 && setInput(e.target.value)} // Limit input length
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
          className={cn(
            "flex-grow h-full border-none bg-transparent text-sm font-normal text-foreground placeholder:text-muted-foreground",
            "pl-4 pr-10 focus-visible:ring-0 focus-visible:ring-offset-0"
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
        className="h-8 px-4 py-1.5 rounded-full mr-1 flex-shrink-0 disabled:opacity-100 text-primary-foreground bg-primary hover:bg-primary/90 shadow hover:shadow-md" // Changed bg-[#3b82f6] to bg-primary
      >
        {buttonText}
      </Button>
    </div>
  );
};

export default PagePromptBar;