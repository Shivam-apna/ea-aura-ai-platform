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

import Sidebar from "@/components/Sidebar";
import DashboardSummaryCards from "@/components/DashboardSummaryCards";
import DataAnalysis from "./DataAnalysis";
import Security from "./Security";
import Reports from "./Reports";
import BusinessVitality from "./BusinessVitality";
import CustomerAnalyzer from "./CustomerAnalyzer";
import MissionAlignment from "./MissionAlignment";
import BrandIndex from "./BrandIndex";
import Settings from "./Settings";
import Profile from "./Profile";
import Users from "./Users";
import AIPromptDialog from "@/components/AIPromptDialog";
import DynamicChartDisplay from "@/components/DynamicChartDisplay";

// New components for Dashboard Overview
import SalesOverviewChart from "@/components/SalesOverviewChart";
import TrafficByWebsite from "@/components/TrafficByWebsite";
import TrafficByDevice from "@/components/TrafficByDevice";
import TrafficByLocation from "@/components/TrafficByLocation";
import MarketingSEO from "@/components/MarketingSEO";
import SalesPromptBar from "@/components/SalesPromptBar"; // Import SalesPromptBar

// HolographicCard Component - Adjusted for light background and subtle glassmorphism
export const HolographicCard = ({ children, className, ...props }: React.ComponentProps<typeof Card>) => {
  return (
    <Card
      className={cn(
        "relative overflow-hidden bg-neumorphic-background border border-border/50 shadow-neumorphic-light rounded-2xl", // Softer background, subtle border, neumorphic shadow
        "text-foreground", // Ensure text color is foreground
        className
      )}
      {...props}
    >
      {children}
    </Card>
  );
};

interface DashboardProps {
  activeAgent: string;
  onSelectAgent: (agent: string) => void;
}

// OverviewContent Component (the main dashboard content)
const OverviewContent = ({ onOpenAIPrompt, dynamicPlotData, onClearPlot }: { onOpenAIPrompt: () => void; dynamicPlotData: any; onClearPlot: () => void }) => {
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' });
  const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex-grow p-6 font-sans relative overflow-hidden bg-background"> {/* Changed padding and background */}
      {/* Background grid pattern - Adjusted for light theme */}
      <div className="absolute inset-0 z-0 opacity-20" style={{
        backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.02) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}></div>

      <div className="relative z-10">
        {/* Sales Prompt Bar */}
        <div className="mb-6"> {/* Added margin-bottom for spacing */}
          <SalesPromptBar />
        </div>

        {/* Header Section */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Overview
            </h1>
          </div>
        </div>

        {/* Dynamic Chart Display (kept for AI prompt functionality) */}
        {dynamicPlotData && (
          <DynamicChartDisplay plotData={dynamicPlotData} onClose={onClearPlot} />
        )}

        {/* Summary Cards at the top of the dashboard */}
        <DashboardSummaryCards />

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6"> {/* Adjusted gap and margin-top */}
          {/* Sales Overview Chart - Spans 2 columns */}
          <div className="lg:col-span-2">
            <SalesOverviewChart />
          </div>

          {/* Traffic by Website */}
          <div>
            <TrafficByWebsite />
          </div>

          {/* Traffic by Device */}
          <div>
            <TrafficByDevice />
          </div>

          {/* Traffic by Location */}
          <div>
            <TrafficByLocation />
          </div>

          {/* Marketing & SEO */}
          <MarketingSEO />
        </div>
      </div>
    </div>
  );
};


const Dashboard: React.FC<DashboardProps> = ({ activeAgent, onSelectAgent }) => {
  const [isAIPromptDialogOpen, setIsAIPromptDialogOpen] = useState(false);
  const [dynamicPlotData, setDynamicPlotData] = useState<any | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(window.innerWidth < 768);

  // Auto-collapse sidebar on small screens
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarCollapsed(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    // Initial check
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePlotGenerated = (plotData: any) => {
    setDynamicPlotData(plotData);
    setIsAIPromptDialogOpen(false);
    onSelectAgent('overview'); // Ensure we are on the overview page to show the plot
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
      case 'profile':
        return <Profile />;
      case 'users':
        return <Users />;
      default:
        return <OverviewContent onOpenAIPrompt={() => setIsAIPromptDialogOpen(true)} dynamicPlotData={dynamicPlotData} onClearPlot={handleClearPlot} />;
    }
  };

  return (
    <div className="flex-grow overflow-auto">
      {renderAgentContent()}
      <AIPromptDialog
        isOpen={isAIPromptDialogOpen}
        onOpenChange={setIsAIPromptDialogOpen}
        onPlotGenerated={handlePlotGenerated}
      />
    </div>
  );
};

export default Dashboard;