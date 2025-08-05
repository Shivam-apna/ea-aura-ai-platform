import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';

interface AIPromptDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onPlotGenerated: (plotData: any) => void; // New prop to pass plot data
}

interface ChatMessage {
  id: number;
  sender: "user" | "ai";
  text: string;
}

const AIPromptDialog: React.FC<AIPromptDialogProps> = ({ isOpen, onOpenChange, onPlotGenerated }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, sender: "ai", text: "Hello! What can I help you analyze or generate today?" },
  ]);
  const [input, setInput] = useState("");
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  const handleSend = async () => { // Made handleSend async
    if (input.trim()) {
      const newUserMessage: ChatMessage = { id: messages.length + 1, sender: "user", text: input.trim() };
      setMessages((prev) => [...prev, newUserMessage]);
      setInput("");

      let aiResponseText = "";
      let plotData = null;

      if (newUserMessage.text.toLowerCase().includes("plot sales data")) {
        aiResponseText = "Generating sales data plot...";
        setMessages((prev) => [...prev, { id: prev.length + 1, sender: "ai", text: aiResponseText }]);

        try {
          const response = await fetch('http://localhost:3002/api/ai-plot-data'); // Fetch plot data from API
          
          // Handle different HTTP status codes with user-friendly messages
          if (!response.ok) {
            let errorMessage = 'Failed to generate plot data.';
            
            switch (response.status) {
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
                errorMessage = `Request failed with status ${response.status}. Please try again.`;
            }

            try {
              const errorData = await response.json();
              if (errorData.error || errorData.message) {
                errorMessage = errorData.error || errorData.message;
              }
            } catch (parseError) {
              console.warn('Could not parse error response:', parseError);
            }

            toast.error(errorMessage);
            aiResponseText = errorMessage;
            setMessages((prev) => [...prev.slice(0, -1), { id: prev.length, sender: "ai", text: aiResponseText }]);
            return;
          }
          
          const data = await response.json();
          plotData = data;
          aiResponseText = data.response || "Plot data generated successfully.";
          onPlotGenerated(plotData); // Pass the plot data to the parent
        } catch (error: any) {
          console.error("Failed to fetch plot data:", error);
          
          let errorMessage = 'Failed to generate plot data. Please try again later.';
          
          if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage = 'Network error. Please check your internet connection and try again.';
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          toast.error(errorMessage);
          aiResponseText = errorMessage;
          setMessages((prev) => [...prev.slice(0, -1), { id: prev.length, sender: "ai", text: aiResponseText }]);
        }
      } else if (newUserMessage.text.toLowerCase().includes("revenue")) {
        aiResponseText = "Based on current trends, next quarter's revenue forecast is projected to increase by 8%. Key drivers include new market penetration and increased customer retention.";
      } else if (newUserMessage.text.toLowerCase().includes("churn")) {
        aiResponseText = "Customer churn risk is currently at 7.5%. Our analysis suggests focusing on personalized engagement campaigns for at-risk segments to reduce this by 2% over the next month.";
      } else if (newUserMessage.text.toLowerCase().includes("brand")) {
        aiResponseText = "The overall brand gravity score is strong at 88%. Social media engagement shows a positive trend, but there's an opportunity to boost brand mentions in traditional media.";
      } else if (newUserMessage.text.toLowerCase().includes("mission")) {
        aiResponseText = "Mission alignment for the Q3 initiatives is at 92%. One critical recommendation failed due to resource allocation, which could impact our sustainability goals. Immediate review is advised.";
      } else if (newUserMessage.text.includes("?")) {
        aiResponseText = "That's a great question! I'm still learning to answer complex queries directly. Can you try a more specific command or keyword?";
      } else {
        aiResponseText = "I'm sorry, I don't have specific data or a direct action for that request yet. Could you try asking about revenue, churn, brand, mission alignment, or 'plot sales data'?";
      }

      // Only add AI response if it hasn't been added by plot generation
      if (!plotData) {
        setMessages((prev) => [...prev, { id: prev.length + 1, sender: "ai", text: aiResponseText }]);
      }
    }
  };

  React.useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[500px] flex flex-col neumorphic-card border border-border text-foreground bg-card"> {/* Added bg-card */}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <MessageSquare className="h-5 w-5 text-primary" /> AI Prompt Assistant
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Ask me anything about your dashboard data or generate insights. Try "plot sales data".
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow pr-4 mb-4">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex", msg.sender === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[70%] p-3 rounded-lg",
                    msg.sender === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="flex gap-2 mt-auto">
          <Input
            placeholder="Type your prompt here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            className="flex-grow bg-input border-border text-foreground placeholder:text-muted-foreground"
          />
          <Button onClick={handleSend} className="bg-primary hover:bg-primary/90 text-primary-foreground"> {/* Changed bg-blue-600 to bg-primary and text-white to text-primary-foreground */}
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIPromptDialog;