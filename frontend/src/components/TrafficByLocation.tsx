import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/ThemeProvider';
import { MapPin } from 'lucide-react';

interface LocationTraffic {
  name: string;
  value: number;
  percentage: string;
}

const locationData: LocationTraffic[] = [
  { name: 'United States', value: 521, percentage: '52.1%' },
  { name: 'Canada', value: 228, percentage: '22.8%' },
  { name: 'Mexico', value: 139, percentage: '13.9%' },
  { name: 'Other', value: 112, percentage: '11.2%' },
];

const COLORS = ['#6366F1', '#84CC16', '#00BFFF', '#A0A0A0']; // Blue, Green, Light Blue, Gray

const TrafficByLocation: React.FC = () => {
  const { theme } = useTheme();

  const commonTooltipProps = {
    contentStyle: { backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--popover-foreground))" },
    itemStyle: { color: "hsl(var(--popover-foreground))" },
    labelStyle: { color: "hsl(var(--muted-foreground))" },
  };

  return (
    <Card className="neumorphic-card rounded-2xl shadow-neumorphic-light border-none">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          <MapPin className="h-5 w-5 text-orange-600" /> Traffic by Location
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[250px] flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={locationData}
              cx="35%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              stroke="none"
            >
              {locationData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip {...commonTooltipProps} formatter={(value, name, props) => [`${props.payload.percentage}`, name]} />
            <Legend
              layout="vertical"
              verticalAlign="middle"
              align="right"
              wrapperStyle={{ right: 0, top: '50%', transform: 'translateY(-50%)', fontSize: '14px' }}
              formatter={(value, entry) => {
                const payload = entry.payload as unknown as LocationTraffic; // Explicitly cast payload via unknown
                return (
                  <span className="text-foreground">{payload.name} <span className="text-muted-foreground">{payload.percentage}</span></span>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default TrafficByLocation;