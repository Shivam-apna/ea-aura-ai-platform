"use client";

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, LineChart, TrendingUp, MessageSquare, Mic, Lightbulb, Zap, AlertCircle, CheckCircle2, CircleDot, Video, Presentation, FileSpreadsheet, FileText } from "lucide-react"; // Added new icons
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"; // For video modal
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // For date range filter
import {
  Tooltip as ShadcnTooltip, // Renamed to avoid conflict with Recharts Tooltip
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // For tooltips
import { toast } from "sonner"; // For download notifications


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
import EnhancedPromptBar from "@/components/EnhancedPromptBar"; // Import EnhancedPromptBar
import PageHeaderActions from "@/components/PageHeaderActions"; // Import PageHeaderActions

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

  // Removed local state for isVideoModalOpen and selectedDateRange as they are now in PageHeaderActions
  // Removed handleDownload as it's now in PageHeaderActions

  return (
    <div className="flex-grow p-6 font-sans relative overflow-hidden bg-background"> {/* Changed padding and background */}
      {/* Background grid pattern - Adjusted for light theme */}
      <div className="absolute inset-0 z-0 opacity-20" style={{
        backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.02) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}></div>

      <div className="relative z-10">
        {/* Enhanced Prompt Bar */}
        <div className="mb-4 flex justify-center"> {/* Added flex justify-center to center the bar */}
          <EnhancedPromptBar />
        </div>

        {/* Header Section - Now using PageHeaderActions */}
        <PageHeaderActions title="Overview" />

        {/* Dynamic Chart Display (kept for AI prompt functionality) */}
        {dynamicPlotData && (
          <DynamicChartDisplay plotData={dynamicPlotData} onClose={onClearPlot} />
        )}

        {/* Summary Cards at the top of the dashboard */}
        <DashboardSummaryCards />

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
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

      {/* Video Tutorial Modal - Now handled within PageHeaderActions */}
      {/* <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
        <DialogContent className="sm:max-w-[800px] h-[500px] flex flex-col neumorphic-card border border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-primary">Dashboard Tutorial</DialogTitle>
          </DialogHeader>
          <div className="flex-grow w-full">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ" // Example YouTube video
              title="Dashboard Tutorial Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="rounded-lg"
            ></iframe>
          </div>
        </DialogContent>
      </Dialog> */}
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