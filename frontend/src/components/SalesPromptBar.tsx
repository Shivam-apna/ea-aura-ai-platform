import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send } from 'lucide-react';
import { HolographicCard } from '@/pages/Dashboard'; // Reusing HolographicCard
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

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to send prompt to backend.');
      }

      const result = await res.json();
      console.log('Prompt successfully indexed:', result);
      setResponse("Prompt sent successfully! Analyzing your sales query...");
      toast.success("Prompt sent to Elasticsearch!");

    } catch (error: any) {
      console.error("Error sending prompt:", error);
      setResponse(`Error: ${error.message}`);
      toast.error(`Failed to send prompt: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <HolographicCard className="p-4 flex flex-col gap-4 h-full">
      <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-blue-600" /> Sales AI Assistant
      </CardTitle>
      <div className="flex gap-2">
        <Input
          placeholder="Ask about sales data..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
          className="flex-grow bg-white/50 border-blue-300/50 text-gray-900 placeholder:text-gray-500"
          // The 'disabled' prop is intentionally NOT present here to ensure editability.
        />
        <Button onClick={handleSend} className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
          <Send className="h-5 w-5" />
        </Button>
      </div>
      {response && <p className="text-sm text-gray-700 mt-2">{response}</p>}
    </HolographicCard>
  );
};

export default SalesPromptBar;