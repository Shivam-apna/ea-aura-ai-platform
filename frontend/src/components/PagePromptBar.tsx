import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, Loader2, X, Sparkles, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import VoiceVisualizer from './VoiceVisualizer';
import VoiceLevelIndicator from './VoiceLevelIndicator';

interface PagePromptBarProps {
  placeholder?: string;
  buttonText?: string;
  onSubmit: (value: string) => void;
  onLoadingChange?: (loading: boolean) => void;
  className?: string;
}

const PagePromptBar: React.FC<PagePromptBarProps> = ({
  placeholder = "Ask-Aura",
  buttonText = "Generate",
  onSubmit,
  onLoadingChange,
  className,
}) => {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recognition, setRecognition] = useState<any>(null);
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
 const [lastQuery, setLastQuery] = useState(""); // Add this line

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check for browser support
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = 'en-US';

        recognitionInstance.onstart = () => {
          setIsListening(true);
          setVoiceLevel(0);
          toast.success("🎤 Voice input activated! Start speaking...");
        };

        recognitionInstance.onresult = (event: any) => {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          const fullTranscript = finalTranscript + interimTranscript;
          setTranscript(fullTranscript);
          setInput(fullTranscript);
          
          // Simulate voice level based on transcript length and confidence
          const level = Math.min(1, fullTranscript.length / 50);
          setVoiceLevel(level);
        };

        recognitionInstance.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          setVoiceLevel(0);
          
          switch (event.error) {
            case 'no-speech':
              toast.error("No speech detected. Please try again.");
              break;
            case 'audio-capture':
              toast.error("Audio capture failed. Please check your microphone.");
              break;
            case 'not-allowed':
              toast.error("Microphone access denied. Please allow microphone access.");
              break;
            default:
              toast.error("Voice input error. Please try again.");
          }
        };

        recognitionInstance.onend = () => {
          setIsListening(false);
          setVoiceLevel(0);
          if (transcript.trim()) {
            toast.success("🎤 Voice input completed!");
          }
        };

        setRecognition(recognitionInstance);
      } else {
        console.warn('Speech recognition not supported in this browser');
      }
    }
  }, []);

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
        if (isListening && recognition) {
          recognition.stop();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isListening, recognition]);

  const handleSend = async () => {
    if (input.trim() === "") {
      setErrorMessage("Please enter a prompt.");
      return;
    }

    // Clear any previous error message
    setErrorMessage("");

    setIsLoading(true);
    onLoadingChange?.(true);

    const promptText = input.trim();
    setInput("");
    setTranscript("");
    setLastQuery(promptText); // Save last query
    try {
      await onSubmit(promptText);
      // Remove success toast - let parent components handle success feedback
    } catch (error: any) {
      console.error("Error submitting prompt:", error);
      setErrorMessage(`Failed to submit prompt: ${error.message}`);
    } finally {
      setIsLoading(false);
      onLoadingChange?.(false);
    }
  };

  // Restore last query on input focus if input is empty
  const handleInputFocus = () => {
    if (!input && lastQuery) {
      setInput(lastQuery);
    }
  };


  
  const handleVoiceInput = () => {
    if (!recognition) {
      setErrorMessage("Voice input is not supported in your browser. Please use Chrome or Edge.");
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      toast.info("🎤 Voice input stopped");
    } else {
      setTranscript("");
      recognition.start();
    }
  };

  const clearInput = () => {
    setInput("");
    setTranscript("");
    setErrorMessage("");
    if (isListening && recognition) {
      recognition.stop();
    }
  };

  return (
    <div className="w-full">
      {/* Error Message Display */}
      {errorMessage && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm font-medium">{errorMessage}</span>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
            onClick={() => setErrorMessage("")}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
      
      {/* Prompt Bar */}
      <div className={cn(
        "flex items-center h-10 rounded-full bg-card shadow-lg transition-all duration-200", // Changed bg-white to bg-card
        "focus-within:border-primary focus-within:shadow-md", // Changed border-blue-500 to border-primary
        "hover:border-gray-300 hover:shadow-md",
        "w-full max-w-[1500px] mx-auto px-6", // Changed pr-1 to px-6
        "dark:shadow-prompt-glow", // Add this line
        className // Apply the passed className
      )}>
        <div className="relative flex-grow">
          <Input
            ref={inputRef}
            placeholder={isListening ? "Listening..." : placeholder}
            value={input}
            onChange={(e) => e.target.value.length <= 200 && setInput(e.target.value)} // Limit input length
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            onFocus={handleInputFocus} // Add this line
            className={cn(
              "flex-grow h-full border-none bg-transparent text-sm font-normal text-foreground placeholder:text-muted-foreground",
              "pl-4 pr-10 focus-visible:ring-0 focus-visible:ring-offset-0"
            )}
            disabled={isLoading}
          />
          
          {/* Voice Input Button with Heartbeat Animation */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full transition-all duration-300 flex-shrink-0",
              isListening 
                ? "text-red-500 bg-red-50 hover:bg-red-100" 
                : "text-muted-foreground hover:text-foreground hover:bg-gray-100"
            )}
            onClick={handleVoiceInput}
            aria-label="Voice Input"
            disabled={isLoading}
          >
            {isListening ? (
              <div className="relative">
                <MicOff className="h-4 w-4" />
                {/* Professional Heartbeat Animation */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3 h-3 bg-red-400 rounded-full animate-ping opacity-75"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-4 h-4 bg-red-300 rounded-full animate-ping opacity-50" style={{ animationDelay: '0.5s' }}></div>
                </div>
              </div>
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
        </div>
        <Button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          variant="default"
          className={cn(
            "h-8 px-4 py-1.5 rounded-full mr-1 flex-shrink-0 disabled:opacity-100 text-white shadow hover:shadow-md transition-all duration-200",
            isListening 
              ? "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600" 
              : "bg-[#3b82f6] hover:bg-[#3b82f6]/90"
          )}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isListening ? (
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              <Sparkles className="h-3 w-3 animate-pulse" />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {buttonText}
              <Sparkles className="h-3 w-3" />
            </div>
          )}
        </Button>
      </div>
    </div>
  );
};

export default PagePromptBar;