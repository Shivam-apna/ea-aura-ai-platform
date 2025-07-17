"use client";

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, LineChart, TrendingUp, MessageSquare, Mic, Lightbulb, Zap, AlertCircle, CheckCircle2, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import Sidebar from "@/components/Sidebar"; // Import the new Sidebar component
import DashboardSummaryCards from "@/components/DashboardSummaryCards"; // Import the new summary cards component
import DataAnalysis from "./DataAnalysis"; // Import existing agent pages
import Security from "./Security";
import Reports from "./Reports";
import BusinessVitality from "./BusinessVitality"; // Import new agent pages
import CustomerAnalyzer from "./CustomerAnalyzer";
import MissionAlignment from "./MissionAlignment";
import BrandIndex from "./BrandIndex";
import Settings from "./Settings"; // Import the enhanced Settings page
import Profile from "./Profile"; // Import the new Profile page
import Users from "./Users"; // Import the new Users page
import AIPromptDialog from "@/components/AIPromptDialog"; // Import the new AI Prompt Dialog
import DynamicChartDisplay from "@/components/DynamicChartDisplay"; // Import the new DynamicChartDisplay

// HolographicCard Component - Adjusted for light background
export const HolographicCard = ({ children, className, ...props }: React.ComponentProps<typeof Card>) => {
  return (
    <Card
      className={cn(
        "relative overflow-hidden bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-indigo-50/50 backdrop-blur-lg border border-blue-300/50 shadow-lg",
        "before:absolute before:inset-0 before:bg-gradient-to-br before:from-blue-200/10 before:via-purple-200/10 before:to-indigo-200/10 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300",
        "text-gray-900", // Changed text color for light background
        className
      )}
      {...props}
    >
      {children}
    </Card>
  );
};

// NeuralDecisionNetworkCard Component
const NeuralDecisionNetworkCard: React.FC = () => {
  const data = [
    { name: 'A', value: 40 },
    { name: 'B', value: 60 },
    { name: 'C', value: 30 },
    { name: 'D', value: 70 },
    { name: 'E', value: 50 },
    { name: 'F', value: 80 },
    { name: 'G', value: 20 },
    { name: 'H', value: 90 },
  ];

  return (
    <HolographicCard className="p-4 flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2"> {/* Adjusted text color */}
          <CircleDot className="h-3 w-3 text-blue-600 fill-blue-600" /> Neural Decision Network
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-between">
        <div className="text-sm text-gray-700 space-y-1 mb-4"> {/* Adjusted text color */}
          <p className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-green-600"></span> Neural Processing: Active</p>
          <p className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-600"></span> Learning Rate: 97.3%</p>
          <p className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-purple-600"></span> Prediction Accuracy: 94.8%</p>
        </div>
        <div className="h-[150px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsLineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" /> {/* Adjusted grid color */}
              <XAxis dataKey="name" hide />
              <YAxis hide />
              <Tooltip
                contentStyle={{ backgroundColor: "rgba(255,255,255,0.9)", border: "1px solid rgba(0,0,0,0.1)", borderRadius: "8px" }} // Adjusted tooltip
                itemStyle={{ color: "black" }} // Adjusted tooltip item color
                labelStyle={{ color: "gray" }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#6366F1" // Adjusted line color for light background
                strokeWidth={2}
                dot={{ stroke: '#6366F1', strokeWidth: 2, r: 5, fill: '#6366F1', className: 'drop-shadow-[0_0_8px_rgba(99,102,241,0.7)]' }}
                activeDot={{ r: 8, strokeWidth: 4, fill: '#6366F1', className: 'drop-shadow-[0_0_12px_rgba(99,102,241,1)]' }}
              />
            </RechartsLineChart>
          </ResponsiveContainer>
          <div className="absolute bottom-2 right-2 text-xs text-gray-600 text-right"> {/* Adjusted text color */}
            <p>Current Decision Path:</p>
            <p className="text-blue-500">Market Analysis → Risk Assessment → Recommendation</p>
          </div>
        </div>
      </CardContent>
    </HolographicCard>
  );
};

// RealTimeIntelligenceCard Component
const RealTimeIntelligenceCard: React.FC = () => {
  const [revenue, setRevenue] = useState(2846398);
  const [revenueChange, setRevenueChange] = useState(371);
  const [users, setUsers] = useState(124769);
  const [usersChange, setUsersChange] = useState(25);

  useEffect(() => {
    const interval = setInterval(() => {
      const newRevenueChange = Math.floor(Math.random() * 500) - 250; // +/- 250
      setRevenue(prev => prev + newRevenueChange);
      setRevenueChange(newRevenueChange);

      const newUsersChange = Math.floor(Math.random() * 50) - 25; // +/- 25
      setUsers(prev => prev + newUsersChange);
      setUsersChange(newUsersChange);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const formatChange = (value: number) => {
    return value >= 0 ? `+${value}` : `${value}`;
  };

  const getChangeColor = (value: number) => {
    return value >= 0 ? "text-green-600" : "text-red-600"; // Adjusted colors
  };

  return (
    <HolographicCard className="p-4 flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2"> {/* Adjusted text color */}
          <CircleDot className="h-3 w-3 text-blue-600 fill-blue-600" /> Real-Time Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-between">
        <div className="text-sm text-gray-700 mb-4 flex justify-between items-center"> {/* Adjusted text color */}
          Live Data Stream <Badge variant="outline" className="bg-green-100 text-green-600 border-green-300">LIVE</Badge> {/* Adjusted badge colors */}
        </div>
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <p className="text-gray-700">Revenue</p> {/* Adjusted text color */}
            <Zap className="h-4 w-4 text-yellow-600" /> {/* Adjusted icon color */}
          </div>
          <p className="text-3xl font-bold text-gray-900">${revenue.toLocaleString()}</p> {/* Adjusted text color */}
          <p className={cn("text-xs", getChangeColor(revenueChange))}>
            <TrendingUp className={cn("inline-block h-3 w-3 mr-1", revenueChange < 0 && "rotate-180")} />
            {formatChange(revenueChange)}
          </p>
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <p className="text-gray-700">Active Users</p> {/* Adjusted text color */}
            <Zap className="h-4 w-4 text-yellow-600" /> {/* Adjusted icon color */}
          </div>
          <p className="text-3xl font-bold text-gray-900">{users.toLocaleString()}</p> {/* Adjusted text color */}
          <p className={cn("text-xs", getChangeColor(usersChange))}>
            <TrendingUp className={cn("inline-block h-3 w-3 mr-1", usersChange < 0 && "rotate-180")} />
            {formatChange(usersChange)}
          </p>
        </div>
      </CardContent>
    </HolographicCard>
  );
};

// PredictiveInsightsCard Component
const PredictiveInsightsCard: React.FC = () => {
  const [riskLevel, setRiskLevel] = useState(23);
  const [confidence, setConfidence] = useState(78);

  useEffect(() => {
    const interval = setInterval(() => {
      setRiskLevel(Math.floor(Math.random() * 40) + 10); // 10-50%
      setConfidence(Math.floor(Math.random() * 30) + 60); // 60-90%
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <HolographicCard className="p-4 flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2"> {/* Adjusted text color */}
          <CircleDot className="h-3 w-3 text-blue-600 fill-blue-600" /> Predictive Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-between">
        <div className="text-sm text-gray-700 mb-4 flex justify-between items-center"> {/* Adjusted text color */}
          AI Predictions <Badge variant="outline" className="bg-purple-100 text-purple-600 border-purple-300">PROCESSING</Badge> {/* Adjusted badge colors */}
        </div>
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="h-4 w-4 text-orange-600" /> {/* Adjusted icon color */}
            <p className="text-orange-600 font-semibold">Risk Assessment</p> {/* Adjusted text color */}
          </div>
          <p className="text-xl font-bold text-gray-900">Server overload risk: {riskLevel}%</p> {/* Adjusted text color */}
          <div className="text-sm text-gray-700 flex justify-between items-center mb-1"> {/* Adjusted text color */}
            Confidence Level
            <span>{confidence}%</span>
          </div>
          <Progress value={confidence} className="w-full h-2 bg-gray-200 [&::-webkit-progress-bar]:bg-gray-200 [&::-webkit-progress-value]:bg-gradient-to-r from-orange-500 to-yellow-400" /> {/* Adjusted progress bar background */}
        </div>
        <div>
          <p className="text-sm text-gray-700 mb-2">Key Factors:</p> {/* Adjusted text color */}
          <ul className="text-xs text-gray-600 space-y-1"> {/* Adjusted text color */}
            <li className="flex items-center gap-2"><CircleDot className="h-3 w-3 text-gray-500 fill-gray-500" /> Traffic patterns</li>
            {/* Add more key factors if needed */}
          </ul>
        </div>
      </CardContent>
    </HolographicCard>
  );
};

// DataStreamsCard Component
const DataStreamsCard: React.FC = () => {
  const [revenueValue, setRevenueValue] = useState(45);
  const [userActivity, setUserActivity] = useState(892);
  const [apiCalls, setApiCalls] = useState(1.2);

  useEffect(() => {
    const interval = setInterval(() => {
      setRevenueValue(prev => prev + Math.floor(Math.random() * 10) - 5);
      setUserActivity(prev => prev + Math.floor(Math.random() * 20) - 10);
      setApiCalls(prev => parseFloat((prev + (Math.random() * 0.1 - 0.05)).toFixed(1)));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <HolographicCard className="p-4 flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2"> {/* Adjusted text color */}
          <CircleDot className="h-3 w-3 text-blue-600 fill-blue-600" /> Data Streams
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-between">
        <div className="text-sm text-gray-700 mb-4">Live Data Streams</div> {/* Adjusted text color */}
        <ul className="space-y-4 flex-grow">
          <li className="flex justify-between items-center">
            <span className="flex items-center gap-2 text-gray-800"> {/* Adjusted text color */}
              <span className="h-2 w-2 rounded-full bg-green-600"></span> Revenue Stream
            </span>
            <span className="text-gray-900 font-bold">+${revenueValue}K</span> {/* Adjusted text color */}
          </li>
          <li className="flex justify-between items-center">
            <span className="flex items-center gap-2 text-gray-800"> {/* Adjusted text color */}
              <span className="h-2 w-2 rounded-full bg-blue-600"></span> User Activity
            </span>
            <span className="text-gray-900 font-bold">{userActivity} active</span> {/* Adjusted text color */}
          </li>
          <li className="flex justify-between items-center">
            <span className="flex items-center gap-2 text-gray-800"> {/* Adjusted text color */}
              <span className="h-2 w-2 rounded-full bg-purple-600"></span> API Calls
            </span>
            <span className="text-gray-900 font-bold">{apiCalls}M/hr</span> {/* Adjusted text color */}
          </li>
        </ul>
        <p className="text-xs text-gray-500 text-center mt-4">... Processing real-time data</p>
      </CardContent>
    </HolographicCard>
  );
};

// AchievementSystemCard Component
const AchievementSystemCard: React.FC = () => {
  const [currentXp, setCurrentXp] = useState(3297);
  const totalXpForNextLevel = 3000;
  const currentLevel = 12;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentXp(prev => prev + Math.floor(Math.random() * 50) + 10); // Gain 10-60 XP
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const progressValue = (currentXp / totalXpForNextLevel) * 100;

  return (
    <HolographicCard className="p-4 flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2"> {/* Adjusted text color */}
          <CircleDot className="h-3 w-3 text-blue-600 fill-blue-600" /> Achievement System
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-between">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <p className="text-gray-700">Performance Level</p> {/* Adjusted text color */}
            <span className="text-yellow-600 flex items-center gap-1"> {/* Adjusted text color */}
              <Zap className="h-4 w-4" /> {currentXp} XP
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">Level {currentLevel}</p> {/* Adjusted text color */}
          <p className="text-sm text-gray-700 mt-2">Progress to Level {currentLevel + 1}</p> {/* Adjusted text color */}
          <Progress value={progressValue} className="w-full h-2 bg-gray-200 [&::-webkit-progress-bar]:bg-gray-200 [&::-webkit-progress-value]:bg-gradient-to-r from-purple-500 to-pink-400" /> {/* Adjusted progress bar background */}
          <p className="text-xs text-gray-600 mt-1">{currentXp}/{totalXpForNextLevel} XP</p> {/* Adjusted text color */}
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <p className="text-gray-700">Revenue Milestone</p> {/* Adjusted text color */}
            <CheckCircle2 className="h-4 w-4 text-green-600" /> {/* Adjusted icon color */}
          </div>
          <p className="text-xl font-bold text-gray-900">100%</p> {/* Adjusted text color */}
          <Progress value={100} className="w-full h-2 bg-gray-200 [&::-webkit-progress-bar]:bg-gray-200 [&::-webkit-progress-value]:bg-green-500" /> {/* Adjusted progress bar background */}
          <p className="text-xs text-gray-600 mt-1">Reward: Gold Badge</p> {/* Adjusted text color */}
        </div>
      </CardContent>
    </HolographicCard>
  );
};

// VoiceCommandInput Component - Reused
const VoiceCommandInput: React.FC = () => {
  const [command, setCommand] = useState("");
  const [response, setResponse] = useState("");

  const handleCommand = () => {
    if (command.toLowerCase().includes("revenue")) {
      setResponse("Displaying last quarter's revenue by region. Please see the 'Real-Time Intelligence' widget.");
    } else if (command.toLowerCase().includes("traffic")) {
      setResponse("Showing real-time website traffic. Check the 'Live Data Stream' widget.");
    } else {
      setResponse("Command not recognized. Please try again.");
    }
    setCommand("");
  };

  return (
    <HolographicCard className="p-4 flex flex-col gap-4 h-full">
      <CardTitle className="text-lg font-semibold text-gray-900">Voice Command</CardTitle> {/* Adjusted text color */}
      <div className="flex gap-2">
        <Input
          placeholder="Speak your command..."
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          className="flex-grow bg-white/50 border-blue-300/50 text-gray-900 placeholder:text-gray-500" // Adjusted input colors
        />
        <Button onClick={handleCommand} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Mic className="h-5 w-5 mr-2" /> Speak
        </Button>
      </div>
      {response && <p className="text-sm text-gray-700">{response}</p>} {/* Adjusted text color */}
    </HolographicCard>
  );
};

// AIChatAssistant Component - Reused
interface ChatMessage {
  id: number;
  sender: "user" | "ai";
  text: string;
}

const AIChatAssistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, sender: "ai", text: "Hello! How can I assist you with your data today?" },
  ]);
  const [input, setInput] = useState("");
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (input.trim()) {
      const newUserMessage: ChatMessage = { id: messages.length + 1, sender: "user", text: input.trim() };
      setMessages((prev) => [...prev, newUserMessage]);
      setInput("");

      // Simulate AI response
      setTimeout(() => {
        let aiResponse = "I'm sorry, I don't understand that request yet. Can you rephrase?";
        if (input.toLowerCase().includes("sales")) {
          aiResponse = "Sales performance is up by 12% this quarter, primarily driven by the APAC region.";
        } else if (input.toLowerCase().includes("anomaly")) {
          aiResponse = "Anomaly detected in server logs: unusual login attempts from an unknown IP. Recommended action: review security logs.";
        } else if (input.toLowerCase().includes("predict")) {
          aiResponse = "Predictive model suggests a 15% increase in user engagement next month if current marketing strategies continue.";
        }
        setMessages((prev) => [...prev, { id: prev.length + 1, sender: "ai", text: aiResponse }]);
      }, 1000);
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <HolographicCard className="p-4 flex flex-col h-full">
      <CardTitle className="text-lg font-semibold text-gray-900 mb-4">AI Chat Assistant</CardTitle> {/* Adjusted text color */}
      <ScrollArea className="flex-grow pr-4 mb-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex", msg.sender === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[70%] p-3 rounded-lg",
                  msg.sender === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-900" // Adjusted AI message background and text
                )}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="flex gap-2">
        <Input
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
          className="flex-grow bg-white/50 border-blue-300/50 text-gray-900 placeholder:text-gray-500" // Adjusted input colors
        />
        <Button onClick={handleSend} className="bg-blue-600 hover:bg-blue-700 text-white">
          <MessageSquare className="h-5 w-5" />
        </Button>
      </div>
    </HolographicCard>
  );
};

// OverviewContent Component (the original dashboard content)
const OverviewContent = ({ onOpenAIPrompt, dynamicPlotData, onClearPlot }: { onOpenAIPrompt: () => void; dynamicPlotData: any; onClearPlot: () => void }) => {
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' });
  const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const [elasticData, setElasticData] = useState<any[]>([]);

  useEffect(() => {
    fetch('http://localhost:3001/api/search')
      .then(res => res.json())
      .then(setElasticData)
      .catch(console.error);
  }, []);

  return (
    <div className="flex-grow p-4 md:p-8 font-sans relative overflow-hidden">
      {/* Background grid pattern */}
      <div className="absolute inset-0 z-0 opacity-20" style={{
        backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)', // Adjusted grid color
        backgroundSize: '20px 20px',
      }}></div>

      <div className="relative z-10">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-800 mb-2"> {/* Adjusted gradient for title */}
              AI Command Center 2025
            </h1>
            <p className="text-lg text-gray-700 mb-2"> {/* Adjusted text color */}
              Welcome to your AI Command Center. Revenue is up 12% this quarter with emerging opportunities in the healthcare sector.
            </p>
            <p className="text-sm text-gray-600"> {/* Adjusted text color */}
              {currentDate}, {currentTime} PM • Mode: executive
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenAIPrompt}
            className="text-blue-600 hover:text-blue-800 text-sm md:text-base flex items-center gap-2"
          >
            <div className="h-10 w-10 rounded-full border border-blue-500 flex items-center justify-center text-blue-600 hover:bg-blue-100/20 transition-colors">
              <Lightbulb className="h-5 w-5" />
            </div>
          </Button>
        </div>

        {/* Dynamic Chart Display */}
        {dynamicPlotData && (
          <DynamicChartDisplay plotData={dynamicPlotData} onClose={onClearPlot} />
        )}

        {/* Summary Cards at the top of the dashboard */}
        <DashboardSummaryCards />

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-350px)]"> {/* Adjusted height to accommodate summary cards */}
          {/* Neural Decision Network - Spans 2 columns */}
          <div className="lg:col-span-2">
            <NeuralDecisionNetworkCard />
          </div>

          {/* Real-Time Intelligence */}
          <div>
            <RealTimeIntelligenceCard />
          </div>

          {/* Predictive Insights */}
          <div>
            <PredictiveInsightsCard />
          </div>

          {/* Data Streams */}
          <div>
            <DataStreamsCard />
          </div>

          {/* Achievement System */}
          <div>
            <AchievementSystemCard />
          </div>

          {/* Voice Command Input */}
          <div className="lg:col-span-1">
            <VoiceCommandInput />
          </div>

          {/* AI Chat Assistant - Spans 2 columns */}
          <div className="lg:col-span-2">
            <AIChatAssistant />
          </div>

          {/* Elasticsearch Data Display */}
          <HolographicCard className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BarChart className="h-5 w-5 text-blue-600" /> Elasticsearch Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64 w-full rounded-md border p-4 bg-gray-50">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap break-words">{JSON.stringify(elasticData, null, 2)}</pre>
              </ScrollArea>
              {elasticData.length === 0 && (
                <p className="text-center text-gray-500 mt-4">
                  No data from Elasticsearch. Make sure your backend server is running and Elasticsearch has data in 'your-index-name'.
                </p>
              )}
            </CardContent>
          </HolographicCard>
        </div>
      </div>
    </div>
  );
};


const Dashboard = () => {
  const [activeAgent, setActiveAgent] = useState('overview'); // Default active agent
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // State for sidebar collapse
  const [isAIPromptDialogOpen, setIsAIPromptDialogOpen] = useState(false); // State for AI Prompt Dialog
  const [dynamicPlotData, setDynamicPlotData] = useState<any | null>(null); // State for dynamic plot data

  const handleToggleCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handlePlotGenerated = (plotData: any) => {
    setDynamicPlotData(plotData);
    setIsAIPromptDialogOpen(false); // Close dialog after plot is generated
    setActiveAgent('overview'); // Ensure we are on the overview page to see the plot
  };

  const handleClearPlot = () => {
    setDynamicPlotData(null);
  };

  const renderAgentContent = () => {
    switch (activeAgent) {
      case 'overview':
        return <OverviewContent onOpenAIPrompt={() => setIsAIPromptDialogOpen(true)} dynamicPlotData={dynamicPlotData} onClearPlot={handleClearPlot} />;
      case 'business-vitality':
        return <BusinessVitality />;
      case 'customer-analyzer':
        return <CustomerAnalyzer />;
      case 'mission-alignment':
        return <MissionAlignment />;
      case 'brand-index':
        return <BrandIndex />;
      case 'data-analysis':
        return <DataAnalysis />;
      case 'security':
        return <Security />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      case 'profile': // Render Profile component for 'profile' agent
        return <Profile />;
      case 'users': // Render Users component for 'users' agent
        return <Users />;
      default:
        return <OverviewContent onOpenAIPrompt={() => setIsAIPromptDialogOpen(true)} dynamicPlotData={dynamicPlotData} onClearPlot={handleClearPlot} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-white text-gray-900">
      <Sidebar
        activeAgent={activeAgent}
        onSelectAgent={setActiveAgent}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />
      <div className="flex-grow overflow-auto">
        {renderAgentContent()}
      </div>
      <AIPromptDialog
        isOpen={isAIPromptDialogOpen}
        onOpenChange={setIsAIPromptDialogOpen}
        onPlotGenerated={handlePlotGenerated}
      />
    </div>
  );
};

export default Dashboard;