import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/ThemeProvider';
import { Smartphone } from 'lucide-react';

interface DeviceTraffic {
  name: string;
  users: number;
}

const deviceData: DeviceTraffic[] = [
  { name: 'Linux', users: 18000 },
  { name: 'Mac', users: 30000 },
  { name: 'iOS', users: 22000 },
  { name: 'Windows', users: 31000 },
  { name: 'Android', users: 13000 },
  { name: 'Other', users: 25000 },
];

const TrafficByDevice: React.FC = () => {
  const { theme } = useTheme();

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
    <Card className="neumorphic-card rounded-2xl shadow-neumorphic-light border-none">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-purple-600" /> Traffic by Device
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={deviceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="name" {...commonAxisProps} />
            <YAxis {...commonAxisProps} tickFormatter={(value) => `${value / 1000}K`} />
            <Tooltip {...commonTooltipProps} />
            <Bar dataKey="users" fill="#6366F1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default TrafficByDevice;