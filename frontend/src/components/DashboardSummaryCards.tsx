import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, DollarSign, Users2, Target, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SummaryCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  colorClass: string; // This will now be for the icon/text color
  bgColorClass: string; // New prop for background color
  description: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, change, icon: Icon, colorClass, bgColorClass, description }) => {
  const isPositive = change !== undefined && change >= 0;
  const changeColor = change === undefined ? "text-muted-foreground" : isPositive ? "text-green-600" : "text-red-600"; // Stronger green/red

  return (
    <Card className={cn(
      "relative overflow-hidden rounded-lg shadow-kpi-shadow border-none", // Use rounded-lg and custom shadow
      bgColorClass // Apply the specific background color
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={cn("h-4 w-4", colorClass)} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {change !== undefined && (
          <p className={cn("text-xs flex items-center", changeColor)}>
            {isPositive ? `+${change}` : change}%
            <span className="ml-1 text-muted-foreground">{description}</span>
            {isPositive ? <TrendingUp className="h-3 w-3 ml-1" /> : <TrendingDown className="h-3 w-3 ml-1" />}
          </p>
        )}
        {change === undefined && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

const DashboardSummaryCards: React.FC = () => {
  // Adjusted values to match the reference image
  const revenueForecast = 7265;
  const churnRisk = 3671;
  const missionConflict = 156;
  const brandGravity = 2318;

  // Static changes as per reference image
  const revenueChange = 11.01;
  const churnChange = -0.03;
  const missionChange = 15.03;
  const brandChange = 6.08;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <SummaryCard
        title="Revenue Forecast"
        value={`$${revenueForecast.toLocaleString()}`}
        change={revenueChange}
        icon={DollarSign}
        colorClass="text-green-600" // Icon color
        bgColorClass="bg-kpi-green" // Background color
        description="vs. last month" // Added description as per reference
      />
      <SummaryCard
        title="Customer Churn Risk"
        value={`${churnRisk.toLocaleString()}`}
        change={churnChange}
        icon={Users2}
        colorClass="text-red-600" // Icon color
        bgColorClass="bg-kpi-light-blue" // Changed to new light blue color
        description="vs. last month" // Added description as per reference
      />
      <SummaryCard
        title="Mission Conflict"
        value={missionConflict}
        change={missionChange}
        icon={AlertTriangle}
        colorClass="text-orange-600" // Icon color
        bgColorClass="bg-kpi-green"
        description="vs. last month" // Added description as per reference
      />
      <SummaryCard
        title="Brand Gravity"
        value={`${brandGravity.toLocaleString()}`}
        change={brandChange}
        icon={Award}
        colorClass="text-blue-600" // Icon color
        bgColorClass="bg-kpi-light-blue" // Changed to new light blue color
        description="vs. last month" // Added description as per reference
      />
    </div>
  );
};

export default DashboardSummaryCards;