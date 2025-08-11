import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, Loader2, X, Sparkles, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import VoiceVisualizer from './VoiceVisualizer';
import VoiceLevelIndicator from './VoiceLevelIndicator';
// Removed Popover imports: import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
// Removed ScrollArea import: import { ScrollArea } from '@/components/ui/scroll-area';

interface PagePromptBarProps {
  placeholder?: string;
  buttonText?: string;
  onSubmit: (value: string) => void;
  onLoadingChange?: (loading: boolean) => void;
  className?: string;
  initialPrompt?: string; // New prop for initial prompt
  storageKeyForInput?: string; // New prop for localStorage key
}

// Static suggestions (no longer used in this version)
const staticSuggestions = [
  "What are the current sales trends?",
  "Show me customer churn risk analysis.",
  "Analyze brand gravity metrics.",
  "What is our mission alignment score?",
  "Generate a report on Q3 revenue.",
  "Compare sales performance this year vs. last year.",
  "Show me traffic by device.",
  "What are the top performing products?",
  "Summarize customer feedback.",
  "Identify key growth opportunities."
];

const PagePromptBar: React.FC<PagePromptBarProps> = ({
  placeholder = "Ask-Aura",
  buttonText = "Generate",
  onSubmit,
  onLoadingChange,
  className,
  initialPrompt = "", // Default to empty string
  storageKeyForInput, // No default, it's optional
}) => {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recognition, setRecognition] = useState<any>(null);
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const isInitialMount = useRef(true); // New ref to track initial mount

  // Function to load recent prompts (no longer used in this version)
  const loadRecentPrompts = (): string[] => {
    if (storageKeyForInput) {
      const stored = localStorage.getItem(`${storageKeyForInput}_recent_prompts`);
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  };

  // Function to save a new prompt to recent prompts (no longer used in this version)
  const saveRecentPrompt = (prompt: string) => {
    if (storageKeyForInput) {
      const currentRecents = loadRecentPrompts();
      const newRecents = [prompt, ...currentRecents.filter(p => p !== prompt)].slice(0, 10); // Keep last 10 unique prompts
      localStorage.setItem(`${storageKeyForInput}_recent_prompts`, JSON.stringify(newRecents));
    }
  };

  // Effect to load initial prompt from localStorage or prop
  useEffect(() => {
    if (storageKeyForInput) {
      const savedInput = localStorage.getItem(storageKeyForInput);
      if (savedInput !== null) {
        // If there's a saved value (from a previous edit/submit or initial pre-population), use it
        setInput(savedInput);
      } else if (initialPrompt) {
        // If no saved value AND an initialPrompt is provided, use it and save it
        setInput(initialPrompt);
        localStorage.setItem(storageKeyForInput, initialPrompt); // Mark as pre-populated for this specific bar
      } else {
        // If no saved value and no initialPrompt, ensure it's empty
        setInput("");
      }
    } else {
      // If no storageKeyForInput is provided, just use initialPrompt (or empty)
      setInput(initialPrompt);
    }
  }, [initialPrompt, storageKeyForInput]); // This effect should only run when these props change

  // Effect to save input to localStorage whenever it changes, but skip initial mount
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return; // Skip saving on the very first render after mount
    }

    if (storageKeyForInput) {
      localStorage.setItem(storageKeyForInput, input);
    }
  }, [input, storageKeyForInput]); // Depend on 'input' to trigger saving on change

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

  // Debounced suggestion filtering (removed for this diagnostic step)
  // const filterSuggestions = (query: string) => {
  //   if (query.length < 2) {
  //     setSuggestions([]);
  //     setIsSuggestionsOpen(false);
  //     return;
  //   }

  //   const allAvailableSuggestions = Array.from(new Set([...staticSuggestions, ...loadRecentPrompts()]));
  //   const filtered = allAvailableSuggestions.filter(s =>
  //     s.toLowerCase().includes(query.toLowerCase())
  //   );
  //   setSuggestions(filtered);
  //   setIsSuggestionsOpen(filtered.length > 0);
  //   setHighlightedIndex(-1);
  // };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    setErrorMessage(""); // Clear error on input change

    // Removed debounce for suggestions
    // if (debounceTimeoutRef.current) {
    //   clearTimeout(debounceTimeoutRef.current);
    // }
    // debounceTimeoutRef.current = setTimeout(() => {
    //   filterSuggestions(value);
    // }, 200);
  };

  // Removed handleSelectSuggestion
  // const handleSelectSuggestion = (suggestion: string) => {
  //   setInput(suggestion);
  //   setIsSuggestionsOpen(false);
  //   setHighlightedIndex(-1);
  // };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // Removed suggestion navigation logic
    // if (isSuggestionsOpen && suggestions.length > 0) {
    //   if (event.key === 'ArrowDown') {
    //     event.preventDefault();
    //     setHighlightedIndex(prev => (prev + 1) % suggestions.length);
    //   } else if (event.key === 'ArrowUp') {
    //     event.preventDefault();
    //     setHighlightedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
    //   } else if (event.key === 'Enter' && highlightedIndex !== -1) {
    //     event.preventDefault();
    //     handleSelectSuggestion(suggestions[highlightedIndex]);
    //   } else if (event.key === 'Escape') {
    //     event.preventDefault();
    //     setIsSuggestionsOpen(false);
    //     setHighlightedIndex(-1);
    //     inputRef.current?.blur();
    //   }
    // } else 
    if (event.key === 'Enter') {
      // If suggestions are not open or no suggestions, proceed with normal submit
      handleSend();
    }
    // Ctrl/Cmd + K to focus is already handled in the existing useEffect
  };

  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
      if (event.key === 'Escape') {
        if (inputRef.current) {
          input.trim() === "" && inputRef.current.blur(); // Only blur if input is empty
        }
        if (isListening && recognition) {
          recognition.stop();
        }
        // Removed setIsSuggestionsOpen(false);
        // Removed setHighlightedIndex(-1);
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [isListening, recognition, input]); // Added input to dependencies to check its value

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
    saveRecentPrompt(promptText); // Save the submitted prompt (still calls loadRecentPrompts/saveRecentPrompt)
    setInput(""); // Clear input immediately
    setTranscript("");
    // Removed setIsSuggestionsOpen(false);
    // Removed setHighlightedIndex(-1);
    
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
    // Removed setIsSuggestionsOpen(false);
    // Removed setHighlightedIndex(-1);
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
        "flex items-center h-10 rounded-xl bg-card shadow-lg transition-all duration-200", // Changed rounded-full to rounded-xl
        "focus-within:border-primary focus-within:shadow-md",
        "hover:border-gray-300 hover:shadow-md",
        "w-full", // Removed max-w-[1500px] mx-auto px-6
        "dark:shadow-prompt-glow",
        "relative z-50", // Added z-50 to ensure it's above the loading overlay
        className
      )}>
        <div className="relative flex-grow">
          {/* Popover and PopoverTrigger removed */}
          <Input
            ref={inputRef}
            placeholder={isListening ? "Listening..." : placeholder}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown} // Use onKeyDown for arrow navigation and Enter
            className={cn(
              "flex-grow h-full border-none bg-transparent text-sm font-normal text-foreground placeholder:text-muted-foreground",
              "pl-4 pr-10 focus-visible:ring-0 focus-visible:ring-offset-0"
            )}
            autoComplete="off" // Disable browser's autocomplete
            // Removed aria-autocomplete, aria-controls, aria-expanded, role
          />
          {/* PopoverContent removed */}
          
          {isLoading && ( // Add a loading spinner inside the input area
            <div className="absolute right-10 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}

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
            "h-8 px-4 py-1.5 rounded-xl mr-1 flex-shrink-0 disabled:opacity-100 text-white shadow hover:shadow-md transition-all duration-200", // Changed rounded-full to rounded-xl
            isListening 
              ? "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600" 
              : "bg-[#3b82f6] hover:bg-[#3b82f6]/90"
          )}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isListening ? (
            <div className="flex items-center justify-center gap-2"> {/* Centered content */}
              <Volume2 className="h-4 w-4" />
            </div>
          ) : (
            <div className="flex items-center justify-center"> {/* Centered content */}
              {buttonText}
            </div>
          )}
        </Button>
      </div>
    </div>
  );
};

export default PagePromptBar;