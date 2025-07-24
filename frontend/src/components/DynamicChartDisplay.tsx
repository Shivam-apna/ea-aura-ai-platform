import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from "recharts";
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/ThemeProvider'; // Import useTheme

interface DynamicChartProps {
  plotData: {
    plot_type: string;
    columns: string[];
    title: string;
    data: any[];
  };
  onClose: () => void;
}

// Moved chart rendering logic into a separate pure function
const renderChartContent = (plot_type: string, xAxisKey: string, dataKeys: string[], data: any[], chartColors: string[], theme: string) => {
  const commonProps = {
    data: data,
    margin: { top: 20, right: 30, left: 20, bottom: 5 },
  };

  const axisColor = theme === 'dark' ? 'hsl(var(--foreground))' : 'hsl(var(--foreground))'; // Foreground color for axes
  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'; // Lighter grid for light mode

  const commonAxisProps = {
    stroke: axisColor,
    tick: { fill: axisColor },
  };

  const commonTooltipProps = {
    contentStyle: { backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--popover-foreground))" },
    itemStyle: { color: "hsl(var(--popover-foreground))" },
    labelStyle: { color: "hsl(var(--muted-foreground))" },
  };

  if (plot_type === "bar") {
    return (
      <BarChart {...commonProps}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey={xAxisKey} {...commonAxisProps} />
        <YAxis {...commonAxisProps} />
        <Tooltip {...commonTooltipProps} />
        <Legend />
        {dataKeys.map((key, index) => (
          <Bar key={key} dataKey={key} fill={chartColors[index % chartColors.length]} />
        ))}
      </BarChart>
    );
  } else if (plot_type === "line") {
    return (
      <LineChart {...commonProps}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey={xAxisKey} {...commonAxisProps} />
        <YAxis {...commonAxisProps} />
        <Tooltip {...commonTooltipProps} />
        <Legend />
        {dataKeys.map((key, index) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={chartColors[index % chartColors.length]}
            strokeWidth={2}
            dot={true}
            activeDot={{ r: 8 }}
          />
        ))}
      </LineChart>
    );
  } else {
    return <p className="text-destructive">Unsupported plot type: {plot_type}</p>;
  }
};


const DynamicChartDisplay: React.FC<DynamicChartProps> = ({ plotData, onClose }) => {
  const { theme } = useTheme(); // Get current theme

  if (!plotData || !plotData.data || plotData.data.length === 0) {
    return null;
  }

  const { plot_type, columns, title, data } = plotData;

  const xAxisKey = columns[0];
  const dataKeys = columns.slice(1);

  const chartColors = ['#00BFFF', '#8A2BE2', '#00FF7F', '#FFD700', '#FF6347', '#4682B4', '#DA70D6']; // Neon colors

  return (
    <Card className="col-span-full mb-6 neumorphic-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          {title}
        </CardTitle>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm">
          Clear Chart
        </button>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {renderChartContent(plot_type, xAxisKey, dataKeys, data, chartColors, theme)}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default DynamicChartDisplay;