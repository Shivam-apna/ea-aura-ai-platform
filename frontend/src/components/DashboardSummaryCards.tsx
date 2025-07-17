import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, DollarSign, Users2, Target, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SummaryCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  colorClass: string;
  description: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, change, icon: Icon, colorClass, description }) => {
  const isPositive = change !== undefined && change >= 0;
  const changeColor = change === undefined ? "text-gray-600" : isPositive ? "text-green-600" : "text-red-600";
  const ChangeIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <Card className="relative overflow-hidden bg-white/70 backdrop-blur-sm border border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-700">{title}</CardTitle>
        <Icon className={cn("h-4 w-4", colorClass)} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {change !== undefined && (
          <p className={cn("text-xs flex items-center", changeColor)}>
            <ChangeIcon className="h-3 w-3 mr-1" />
            {change >= 0 ? `+${change}` : change}%
            <span className="ml-1 text-gray-500">{description}</span>
          </p>
        )}
        {change === undefined && (
          <p className="text-xs text-gray-500">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

const DashboardSummaryCards: React.FC = () => {
  const [revenueForecast, setRevenueForecast] = useState(12.5); // in millions
  const [churnRisk, setChurnRisk] = useState(8.2); // in percentage
  const [missionAlerts, setMissionAlerts] = useState(0); // count
  const [brandGravity, setBrandGravity] = useState(78); // score out of 100

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time updates
      setRevenueForecast(prev => parseFloat((prev + (Math.random() * 0.5 - 0.25)).toFixed(1)));
      setChurnRisk(prev => parseFloat((prev + (Math.random() * 0.2 - 0.1)).toFixed(1)));
      setMissionAlerts(Math.floor(Math.random() * 3)); // 0-2 alerts
      setBrandGravity(prev => Math.min(100, Math.max(60, prev + Math.floor(Math.random() * 5) - 2))); // 60-100
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const getChurnRiskColor = (risk: number) => {
    if (risk > 10) return "text-red-600";
    if (risk > 5) return "text-orange-600";
    return "text-green-600";
  };

  const getMissionAlertsColor = (alerts: number) => {
    if (alerts > 0) return "text-red-600";
    return "text-green-600";
  };

  const getBrandGravityColor = (score: number) => {
    if (score < 70) return "text-orange-600";
    if (score < 60) return "text-red-600";
    return "text-green-600";
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <SummaryCard
        title="Next-Month Revenue Forecast"
        value={`$${revenueForecast.toFixed(1)}M`}
        change={parseFloat(((revenueForecast / 12.0 - 1) * 100).toFixed(1))} // Example change calculation
        icon={DollarSign}
        colorClass="text-blue-600"
        description="vs. last month"
      />
      <SummaryCard
        title="Customer Churn Risk"
        value={`${churnRisk.toFixed(1)}%`}
        icon={Users2}
        colorClass={getChurnRiskColor(churnRisk)}
        description="of active users"
      />
      <SummaryCard
        title="Mission-Conflict Alerts"
        value={missionAlerts}
        icon={AlertTriangle}
        colorClass={getMissionAlertsColor(missionAlerts)}
        description="critical issues"
      />
      <SummaryCard
        title="Overall Brand Gravity"
        value={`${brandGravity}%`}
        icon={Award}
        colorClass={getBrandGravityColor(brandGravity)}
        description="health score"
      />
    </div>
  );
};

export default DashboardSummaryCards;