import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Ticket, Smile, Meh, Frown } from 'lucide-react';
import { HolographicCard } from './Dashboard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/ThemeProvider';
import PagePromptBar from '@/components/PagePromptBar'; // Import the new prompt bar
import { toast } from 'sonner'; // Import toast for notifications

const CustomerAnalyzer = () => {
  const [sentimentData, setSentimentData] = useState([
    { name: 'Positive', value: 60 },
    { name: 'Neutral', value: 25 },
    { name: 'Negative', value: 15 },
  ]);
  const COLORS = ['#00FF7F', '#FFD700', '#FF6347']; // Neon Green, Gold, Tomato

  const [highPriorityTickets, setHighPriorityTickets] = useState(7);
  const { theme } = useTheme();

  useEffect(() => {
    const interval = setInterval(() => {
      const newPositive = Math.floor(Math.random() * 20) + 50; // 50-70
      const newNeutral = Math.floor(Math.random() * 15) + 15; // 15-30
      const newNegative = 100 - newPositive - newNeutral;
      setSentimentData([
        { name: 'Positive', value: newPositive },
        { name: 'Neutral', value: newNeutral },
        { name: 'Negative', value: newNegative },
      ]);
      setHighPriorityTickets(Math.floor(Math.random() * 5) + 5); // 5-9 tickets
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  const aiSentimentSummary = `
    "Overall customer sentiment remains strongly positive, with 60% positive feedback. There's a slight increase in neutral responses, indicating areas for potential improvement in product clarity. Negative feedback is minimal but highlights specific issues related to recent service updates. Focus on addressing high-priority support tickets to maintain satisfaction."
  `;

  const tooltipContentStyle = {
    backgroundColor: theme === 'dark' ? "hsl(var(--neumorphic-bg))" : "hsl(var(--neumorphic-bg))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    color: theme === 'dark' ? "hsl(var(--foreground))" : "hsl(var(--foreground))"
  };
  const tooltipItemStyle = { color: theme === 'dark' ? "hsl(var(--foreground))" : "hsl(var(--foreground))" };
  const tooltipLabelStyle = { color: theme === 'dark' ? "hsl(var(--muted-foreground))" : "hsl(var(--muted-foreground))" };

  const handlePromptSubmit = (prompt: string) => {
    toast.info(`Customer Analyzer: Processing prompt "${prompt}"`);
    // Here you would add logic to process the prompt, e.g., filter data, trigger AI analysis
  };

  return (
    <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 h-full bg-background"> {/* Apply background to the page */}
      {/* Prompt Bar */}
      <div className="lg:col-span-2 mb-4 flex justify-center">
        <PagePromptBar
          placeholder="Ask about customer sentiment, churn, or support tickets..."
          buttonText="Analyze"
          onSubmit={handlePromptSubmit}
        />
      </div>

      <HolographicCard className="lg:col-span-2 neumorphic-card"> {/* Apply neumorphic styling */}
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-400" /> AI-Generated Sentiment Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground whitespace-pre-line">{aiSentimentSummary.trim()}</p>
        </CardContent>
      </HolographicCard>

      <HolographicCard className="neumorphic-card"> {/* Apply neumorphic styling */}
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Smile className="h-5 w-5 text-green-400" /> Customer Feedback Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center">
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipContentStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-4 text-sm text-muted-foreground">
            {sentimentData.map((entry, index) => (
              <div key={entry.name} className="flex items-center">
                <span className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index] }}></span>
                {entry.name}: {entry.value}%
              </div>
            ))}
          </div>
        </CardContent>
      </HolographicCard>

      <HolographicCard className="neumorphic-card"> {/* Apply neumorphic styling */}
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Ticket className="h-5 w-5 text-orange-400" /> High-Priority Support Tickets
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-full">
          <div className={cn("text-6xl font-bold", highPriorityTickets > 5 ? "text-red-400" : "text-orange-400")}>
            {highPriorityTickets}
          </div>
          <p className="text-lg text-muted-foreground mt-2">Tickets requiring immediate attention</p>
          <p className="text-sm text-muted-foreground mt-4">
            These tickets are flagged by AI for critical impact on customer satisfaction. Prioritize resolution.
          </p>
        </CardContent>
      </HolographicCard>
    </div>
  );
};

export default CustomerAnalyzer;