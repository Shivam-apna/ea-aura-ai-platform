import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, Loader2, X, Sparkles, AlertCircle, History, Trash2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SavedQuery {
  id: string;
  query: string;
  timestamp: number;
}

interface PagePromptBarProps {
  placeholder?: string;
  buttonText?: string;
  onSubmit: (value: string) => void;
  onLoadingChange?: (loading: boolean) => void;
  className?: string;
  initialPrompt?: string;
  storageKeyForInput?: string;
  pageId?: string; // New prop to identify the current page for query history
}

const PagePromptBar: React.FC<PagePromptBarProps> = ({
  placeholder = "Ask-Aura",
  buttonText = "Generate",
  onSubmit,
  onLoadingChange,
  className,
  initialPrompt = "",
  storageKeyForInput,
  pageId = "default", // Default page ID
}) => {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recognition, setRecognition] = useState<any>(null);
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  // Generate storage key for queries based on page ID
  const getQueriesStorageKey = () => `saved_queries_${pageId}`;

  // Generate storage key for input based on page ID
  const getInputStorageKey = () => {
    if (storageKeyForInput) {
      return `${storageKeyForInput}_${pageId}`;
    }
    return null;
  };

  // Load saved queries from localStorage
  const loadSavedQueries = () => {
    try {
      const saved = localStorage.getItem(getQueriesStorageKey());
      if (saved) {
        const queries = JSON.parse(saved);
        setSavedQueries(queries);
      }
    } catch (error) {
      console.error('Error loading saved queries:', error);
    }
  };

  // Save queries to localStorage
  const saveQueriesToStorage = (queries: SavedQuery[]) => {
    try {
      localStorage.setItem(getQueriesStorageKey(), JSON.stringify(queries));
    } catch (error) {
      console.error('Error saving queries:', error);
    }
  };

  // Add a new query to saved queries (keep only latest 5)
  const addQueryToHistory = (query: string) => {
    if (!query.trim()) return;

    const newQuery: SavedQuery = {
      id: Date.now().toString(),
      query: query.trim(),
      timestamp: Date.now(),
    };

    setSavedQueries(prev => {
      // Remove duplicate if exists
      const filtered = prev.filter(q => q.query !== query.trim());
      // Add new query at the beginning and keep only 5 latest
      const updated = [newQuery, ...filtered].slice(0, 5);
      saveQueriesToStorage(updated);
      return updated;
    });
  };

  // Delete a saved query
  const deleteQuery = (queryId: string) => {
    setSavedQueries(prev => {
      const updated = prev.filter(q => q.id !== queryId);
      saveQueriesToStorage(updated);
      return updated;
    });
    toast.success("Query deleted");
  };

  // Select a saved query
  const selectQuery = (query: string) => {
    setInput(query);
    setShowHistory(false);
    inputRef.current?.focus();
    toast.success("Query selected");
  };

  // Clear all saved queries
  const clearAllQueries = () => {
    setSavedQueries([]);
    localStorage.removeItem(getQueriesStorageKey());
    toast.success("All queries cleared");
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  // Effect to load initial prompt and saved queries
  useEffect(() => {
    loadSavedQueries();
    
    const inputStorageKey = getInputStorageKey();
    if (inputStorageKey) {
      const savedInput = localStorage.getItem(inputStorageKey);
      if (savedInput !== null) {
        setInput(savedInput);
      } else {
        setInput(initialPrompt);
      }
    } else {
      setInput(initialPrompt);
    }
  }, [initialPrompt, storageKeyForInput, pageId]);

  // Effect to save input to localStorage with page-specific key
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const inputStorageKey = getInputStorageKey();
    if (inputStorageKey) {
      localStorage.setItem(inputStorageKey, input);
    }
  }, [input, storageKeyForInput, pageId]);
  console.log(pageId,"jjjjjjjj")
  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
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

  // Handle clicks outside history dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (historyRef.current && !historyRef.current.contains(event.target as Node)) {
        setShowHistory(false);
      }
    };

    if (showHistory) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showHistory]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
      if (event.key === 'Escape') {
        if (showHistory) {
          setShowHistory(false);
        } else if (inputRef.current) {
          inputRef.current.blur();
          setInput('');
        }
        if (isListening && recognition) {
          recognition.stop();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isListening, recognition, showHistory]);

  const handleSend = async () => {
    if (input.trim() === "") {
      setErrorMessage("Please enter a prompt.");
      return;
    }

    setErrorMessage("");
    setIsLoading(true);
    onLoadingChange?.(true);

    const promptText = input.trim();
    
    // Add query to history before clearing input
    addQueryToHistory(promptText);
    
    setInput("");
    setTranscript("");
    setShowHistory(false);
    
    try {
      await onSubmit(promptText);
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
  };

  return (
    <div className="w-full relative">
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
        "flex items-center h-10 rounded-full bg-card shadow-lg transition-all duration-200",
        "focus-within:border-primary focus-within:shadow-md",
        "hover:border-gray-300 hover:shadow-md",
        "w-full",
        "dark:shadow-prompt-glow",
        className
      )}>
        {/* History Button */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 rounded-full ml-1 flex-shrink-0 transition-all duration-300",
            showHistory 
              ? "text-primary bg-primary/10 hover:bg-primary/20" 
              : "text-muted-foreground hover:text-foreground hover:bg-gray-100"
          )}
          onClick={() => setShowHistory(!showHistory)}
          aria-label="Query History"
          disabled={isLoading}
        >
          <History className="h-4 w-4" />
        </Button>

        <div className="relative flex-grow">
          <Input
            ref={inputRef}
            placeholder={isListening ? "Listening..." : placeholder}
            value={input}
            onChange={(e) => e.target.value.length <= 200 && setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            className={cn(
              "flex-grow h-full border-none bg-transparent text-sm font-normal text-foreground placeholder:text-muted-foreground",
              "pl-4 pr-10 focus-visible:ring-0 focus-visible:ring-offset-0"
            )}
            disabled={isLoading}
          />
          
          {/* Voice Input Button */}
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
            <div className="flex items-center justify-center gap-2">
              <Volume2 className="h-4 w-4" />
            </div>
          ) : (
            <div className="flex items-center justify-center">
              {buttonText}
            </div>
          )}
        </Button>
      </div>

      {/* Query History Dropdown */}
      {showHistory && (
        <div 
          ref={historyRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
        >
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Recent Queries</span>
              <span className="text-xs text-muted-foreground">({pageId})</span>
            </div>
            {savedQueries.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllQueries}
                className="text-xs h-6 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Clear All
              </Button>
            )}
          </div>
          
          <div className="py-2">
            {savedQueries.length === 0 ? (
              <div className="px-4 py-6 text-center text-muted-foreground text-sm">
                No saved queries yet
              </div>
            ) : (
              savedQueries.map((savedQuery) => (
                <div
                  key={savedQuery.id}
                  className="group flex items-start gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                  onClick={() => selectQuery(savedQuery.query)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate group-hover:text-primary transition-colors">
                      {savedQuery.query}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTimestamp(savedQuery.timestamp)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteQuery(savedQuery.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PagePromptBar;