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
import { HolographicCard } from "@/pages/Dashboard";
import { cn } from '@/lib/utils';

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
const renderChartContent = (plot_type: string, xAxisKey: string, dataKeys: string[], data: any[], chartColors: string[]) => {
  const commonProps = {
    data: data,
    margin: { top: 20, right: 30, left: 20, bottom: 5 },
  };

  const commonAxisProps = {
    stroke: "hsl(var(--foreground))",
    tick: { fill: 'hsl(var(--foreground))' },
  };

  const commonTooltipProps = {
    contentStyle: { backgroundColor: "rgba(255,255,255,0.9)", border: "1px solid rgba(0,0,0,0.1)", borderRadius: "8px" },
    itemStyle: { color: "black" },
    labelStyle: { color: "gray" },
  };

  if (plot_type === "bar") {
    return (
      <BarChart {...commonProps}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
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
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
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
    return <p className="text-red-500">Unsupported plot type: {plot_type}</p>;
  }
};


const DynamicChartDisplay: React.FC<DynamicChartProps> = ({ plotData, onClose }) => {
  if (!plotData || !plotData.data || plotData.data.length === 0) {
    return null;
  }

  const { plot_type, columns, title, data } = plotData;

  const xAxisKey = columns[0];
  const dataKeys = columns.slice(1);

  const chartColors = ['#8884d8', '#82ca9d', '#ffc658', '#a4de6c', '#d0ed57', '#83a6ed', '#8dd1e1'];

  return (
    <HolographicCard className="col-span-full mb-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          {title}
        </CardTitle>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-sm">
          Clear Chart
        </button>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {renderChartContent(plot_type, xAxisKey, dataKeys, data, chartColors)}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </HolographicCard>
  );
};

export default DynamicChartDisplay;