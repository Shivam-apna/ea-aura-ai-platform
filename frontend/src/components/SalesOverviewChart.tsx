import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/ThemeProvider';

interface SalesOverviewChartProps {
  className?: string;
}

const SalesOverviewChart: React.FC<SalesOverviewChartProps> = ({ className }) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('total-sales');

  const salesData = [
    { name: 'Jan', 'This year': 3500, 'Last year': 2800 },
    { name: 'Feb', 'This year': 3000, 'Last year': 2500 },
    { name: 'Mar', 'This year': 4500, 'Last year': 3800 },
    { name: 'Apr', 'This year': 4000, 'Last year': 3200 },
    { name: 'May', 'This year': 5500, 'Last year': 4500 },
    { name: 'Jun', 'This year': 4200, 'Last year': 3500 },
    { name: 'Jul', 'This year': 5000, 'Last year': 4000 },
  ];

  const projectsData = [
    { name: 'Jan', 'Completed': 5, 'In Progress': 3 },
    { name: 'Feb', 'Completed': 7, 'In Progress': 4 },
    { name: 'Mar', 'Completed': 10, 'In Progress': 2 },
    { name: 'Feb', 'Completed': 8, 'In Progress': 5 },
    { name: 'May', 'Completed': 12, 'In Progress': 3 },
    { name: 'Jun', 'Completed': 15, 'In Progress': 4 },
    { name: 'Jul', 'Completed': 13, 'In Progress': 6 },
  ];

  const operatingStatusData = [
    { name: 'Q1', 'Efficiency': 85, 'Downtime': 5 },
    { name: 'Q2', 'Efficiency': 90, 'Downtime': 3 },
    { name: 'Q3', 'Efficiency': 88, 'Downtime': 4 },
    { name: 'Q4', 'Efficiency': 92, 'Downtime': 2 },
  ];

  const getChartData = () => {
    switch (activeTab) {
      case 'total-sales':
        return salesData;
      case 'total-projects':
        return projectsData;
      case 'operating-status':
        return operatingStatusData;
      default:
        return salesData;
    }
  };

  const getLineKeys = () => {
    switch (activeTab) {
      case 'total-sales':
        return [{ key: 'This year', color: '#6366F1' }, { key: 'Last year', color: '#A0A0A0', dash: '3 3' }];
      case 'total-projects':
        return [{ key: 'Completed', color: '#00BFFF' }, { key: 'In Progress', color: '#FFD700' }];
      case 'operating-status':
        return [{ key: 'Efficiency', color: '#00FF7F' }, { key: 'Downtime', color: '#FF6347' }];
      default:
        return [{ key: 'This year', color: '#6366F1' }, { key: 'Last year', color: '#A0A0A0', dash: '3 3' }];
    }
  };

  const axisColor = 'hsl(var(--foreground))'; // Use foreground for axis text
  const gridColor = 'hsl(var(--border))'; // Use border for grid lines

  const commonAxisProps = {
    stroke: axisColor,
    tick: { fill: axisColor, fontSize: 12 },
  };

  const commonTooltipProps = {
    contentStyle: { backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--popover-foreground))" },
    itemStyle: { color: "hsl(var(--popover-foreground))" },
    labelStyle: { color: "hsl(var(--muted-foreground))" },
  };

  return (
    <Card className={cn("neumorphic-card rounded-2xl shadow-neumorphic-light border-none", className)}>
      <CardHeader className="pb-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 h-10 bg-muted/50 rounded-lg p-1">
            <TabsTrigger value="total-sales" className="data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground rounded-md text-sm font-medium">Total Sales</TabsTrigger>
            <TabsTrigger value="total-projects" className="data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground rounded-md text-sm font-medium">Total Projects</TabsTrigger>
            <TabsTrigger value="operating-status" className="data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground rounded-md text-sm font-medium">Operating Status</TabsTrigger>
          </TabsList>
          <div className="flex justify-end items-center mt-4 text-sm text-muted-foreground">
            {getLineKeys().map((item, index) => (
              <div key={item.key} className="flex items-center ml-4">
                <span className="h-2 w-2 rounded-full mr-1" style={{ backgroundColor: item.color }}></span>
                {item.key}
              </div>
            ))}
          </div>
        </Tabs>
      </CardHeader>
      <CardContent className="h-[300px] pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={getChartData()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="name" {...commonAxisProps} />
            <YAxis {...commonAxisProps} tickFormatter={(value) => `$${value / 1000}K`} /> {/* Format Y-axis as $K */}
            <Tooltip {...commonTooltipProps} />
            {getLineKeys().map((item, index) => (
              <Line
                key={item.key}
                type="monotone"
                dataKey={item.key}
                stroke={item.color}
                strokeDasharray={item.dash || "0 0"}
                strokeWidth={2}
                dot={false} // No dots as per reference
                activeDot={{ r: 6, strokeWidth: 2, fill: item.color, stroke: item.color }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default SalesOverviewChart;