import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner'; // Import toast for notifications

interface SalesPromptBarProps {
  // onPromptSubmit: (prompt: string) => void; // Removed as API call is handled internally
}

const SalesPromptBar: React.FC<SalesPromptBarProps> = () => {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
            // You can add more fields here, e.g., userId if available from Keycloak
          },
        }),
      });

      // Handle different HTTP status codes with user-friendly messages
      if (!res.ok) {
        let errorMessage = 'Failed to send prompt to backend.';
        
        switch (res.status) {
          case 400:
            errorMessage = 'Invalid request. Please check your input and try again.';
            break;
          case 401:
            errorMessage = 'Authentication required. Please log in again.';
            break;
          case 403:
            errorMessage = 'Access denied. You do not have permission to perform this action.';
            break;
          case 404:
            errorMessage = 'The requested service is not available. Please try again later.';
            break;
          case 429:
            errorMessage = 'Too many requests. Please wait a moment and try again.';
            break;
          case 500:
            errorMessage = 'Server error. Our team has been notified. Please try again later.';
            break;
          case 502:
            errorMessage = 'Service temporarily unavailable. Please try again in a few minutes.';
            break;
          case 503:
            errorMessage = 'Service is currently under maintenance. Please try again later.';
            break;
          default:
            errorMessage = `Request failed with status ${res.status}. Please try again.`;
        }

        // Try to get more specific error message from response
        try {
          const errorData = await res.json();
          if (errorData.error || errorData.message) {
            errorMessage = errorData.error || errorData.message;
          }
        } catch (parseError) {
          // If we can't parse the error response, use the default message
          console.warn('Could not parse error response:', parseError);
        }

        throw new Error(errorMessage);
      }

      const result = await res.json();
      setResponse("Prompt sent successfully! Analyzing your sales query...");
      toast.success("Prompt sent to Elasticsearch!");

    } catch (error: any) {
      console.error("Error sending prompt:", error);
      
      // Handle network errors and other exceptions
      let errorMessage = 'Failed to send prompt.';
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setResponse(`Error: ${errorMessage}`);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-4 flex flex-col gap-4 h-full neumorphic-card bg-card"> {/* Added bg-card */}
      <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-primary" /> Sales AI Assistant
      </CardTitle>
      <div className="flex gap-2">
        <Input
          placeholder="Type your prompt here..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
          className="flex-grow bg-input border-border text-foreground placeholder:text-muted-foreground"
          // The 'disabled' prop is intentionally NOT present here to ensure editability.
        />
        <Button onClick={handleSend} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Send className="h-5 w-5" />
        </Button>
      </div>
      {response && <p className="text-sm text-muted-foreground mt-2">{response}</p>}
    </Card>
  );
};

export default SalesPromptBar;