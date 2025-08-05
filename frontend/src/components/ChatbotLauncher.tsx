import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, X, Send } from 'lucide-react'; // Removed Minimize2, Maximize2
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTheme } from '@/components/ThemeProvider';
import { hexToRgb } from '@/utils/color';

interface ChatbotLauncherProps {
  initialOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  onMessageSend?: (message: string) => void;
}

interface ChatMessage {
  id: number;
  sender: 'user' | 'chatbot';
  text: string;
}

const ChatbotLauncher: React.FC<ChatbotLauncherProps> = ({
  initialOpen = false,
  onOpen,
  onClose,
  onMessageSend,
}) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, sender: 'chatbot', text: 'Hello! How can I assist you today?' },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const launcherButtonRef = useRef<HTMLButtonElement>(null);

  const { selectedPrimaryColor, previewPrimaryColorHex, themeColors } = useTheme();

  // Determine the current primary color in hex format
  const getPrimaryColorHex = () => {
    if (previewPrimaryColorHex) return previewPrimaryColorHex;
    if (selectedPrimaryColor) return selectedPrimaryColor; // Use selectedPrimaryColor directly
    return themeColors[0].hex; // Fallback to default 'Default' color hex
  };

  const primaryColorHex = getPrimaryColorHex();
  const primaryRgb = hexToRgb(primaryColorHex);
  
  // Generate dynamic shadow colors
  const primaryRgbaShadow = primaryRgb ? `rgba(${primaryRgb[0]}, ${primaryRgb[1]}, ${primaryRgb[2]}, 0.3)` : 'rgba(139, 92, 246, 0.3)'; // Default purple shadow
  const primaryRgbaShadowProminent = primaryRgb ? `rgba(${primaryRgb[0]}, ${primaryRgb[1]}, ${primaryRgb[2]}, 0.12)` : 'rgba(0, 0, 0, 0.12)'; // Default black shadow

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleOpenChat = () => {
    setIsOpen(true);
    onOpen?.();
  };

  const handleCloseChat = () => {
    setIsOpen(false);
    onClose?.();
    // Return focus to the launcher button after closing
    launcherButtonRef.current?.focus();
  };

  const handleSendMessage = () => {
    if (input.trim()) {
      const newUserMessage: ChatMessage = { id: messages.length + 1, sender: 'user', text: input.trim() };
      setMessages((prev) => [...prev, newUserMessage]);
      onMessageSend?.(input.trim()); // Call the prop function

      // Simulate a chatbot response
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { id: prev.length + 1, sender: 'chatbot', text: `You said: "${newUserMessage.text}". I'm still learning to respond!` },
        ]);
      }, 1000);

      setInput('');
    }
  };

  return (
    <>
      {/* Chatbot Launcher Button */}
      <Button
        ref={launcherButtonRef}
        className={cn(
          "fixed z-[100] w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ease-in-out",
          "bottom-6 right-6", // 24px from edges
          "hover:scale-105 active:scale-95"
        )}
        style={{
          backgroundColor: primaryColorHex,
          boxShadow: `0 4px 12px ${primaryRgbaShadow}`,
        }}
        onClick={handleOpenChat}
        aria-label="Open Chatbot"
      >
        <MessageSquare className="h-7 w-7 text-white" />
      </Button>

      {/* Chatbot Popup Panel */}
      {isOpen && (
        <div
          className="fixed z-[101] w-[360px] h-[500px] flex flex-col rounded-2xl bg-card" // Changed bg-white to bg-card
          style={{
            bottom: '96px', // 24px (bottom edge) + 56px (launcher height) + 16px (gap) = 96px
            right: '24px',
            boxShadow: `0 8px 32px ${primaryRgbaShadowProminent}`,
          }}
        >
          {/* Header */}
          <div
            className="h-20 flex items-center p-4 rounded-t-2xl"
            style={{ backgroundColor: primaryColorHex }}
          >
            <Avatar className="h-8 w-8 mr-2">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=MRA`} alt="MRA" />
              <AvatarFallback className="bg-white text-primary">MR</AvatarFallback>
            </Avatar>
            <h3 className="text-white text-base font-medium flex-grow">EA-AURA Reporting Assistant</h3> {/* Updated title */}
            <div className="flex gap-2">
              {/* Single close button */}
              <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20" onClick={handleCloseChat} aria-label="Close Chatbot">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="flex justify-around p-4 border-b border-gray-100">
            <Button
              variant="outline"
              className="rounded-full px-3 py-1 text-sm"
              style={{ borderColor: primaryColorHex, color: primaryColorHex }}
            >
              Speak to our Expert
            </Button>
            <Button
              variant="default"
              className="rounded-full px-3 py-1 text-sm"
              style={{ backgroundColor: primaryColorHex, color: '#FFFFFF' }}
            >
              Book a Demo
            </Button>
          </div>

          {/* Chat Messages */}
          <ScrollArea className="flex-grow p-4">
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
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                className="flex-grow bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
              <Button onClick={handleSendMessage} disabled={!input.trim()} style={{ backgroundColor: primaryColorHex }}>
                <Send className="h-5 w-5 text-white" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotLauncher;