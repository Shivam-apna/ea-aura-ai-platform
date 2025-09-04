"use client";

import React from 'react';
import Plot from 'react-plotly.js';
import { BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils'; // Fixed: Added 'from' keyword
import { useTheme } from '@/components/ThemeProvider'; // Import useTheme

// Type definitions (copied from AdvancedDashboardLayout for self-containment)
interface ChartData {
  title: string;
  plotType: string;
  x: any[];
  y: any; // Can be any[] or any[][] depending on chart type
  xLabel: string;
  yLabel: string;
  value?: number;
  delta?: number;
  marker?: {
    color: string;
  };
}

interface GraphCardContentProps {
  chart: ChartData | undefined;
  isLoading: boolean; // Overall dashboard loading state
  isDarkTheme: boolean;
  chartType: string; // Specific chart type for this graph
  chartColor: string; // Specific chart color for this graph
  primaryColorForCharts: string;
  colors: string[]; // General colors array
  getPlotlyLayoutAndConfig: (chart: ChartData) => { layout: any; config: any };
}

// Custom animated SVG graph loader (moved here)
const GraphLoader = () => (
  <svg width="80" height="40" viewBox="0 0 90 40" fill="none">
    <rect x="10" y="20" width="10" height="20" rx="2" fill="#4CB2FF">
      <animate attributeName="height" values="20;35;20" dur="1s" repeatCount="indefinite" />
      <animate attributeName="y" values="20;5;20" dur="1s" repeatCount="indefinite" />
    </rect>
    <rect x="30" y="10" width="10" height="30" rx="2" fill="#A8C574">
      <animate attributeName="height" values="30;15;30" dur="1s" repeatCount="indefinite" />
      <animate attributeName="y" values="10;25;10" dur="1s" repeatCount="indefinite" />
    </rect>
    <rect x="50" y="25" width="10" height="15" rx="2" fill="#4CB2FF">
      <animate attributeName="height" values="15;30;15" dur="1s" repeatCount="indefinite" />
      <animate attributeName="y" values="25;10;25" dur="1s" repeatCount="indefinite" />
    </rect>
    <rect x="70" y="15" width="10" height="25" rx="2" fill="#A8C574">
      <animate attributeName="height" values="25;10;25" dur="1s" repeatCount="indefinite" />
      <animate attributeName="y" values="15;30;15" dur="1s" repeatCount="indefinite" />
    </rect>
  </svg>
);

const GraphCardContent: React.FC<GraphCardContentProps> = ({
  chart,
  isLoading,
  isDarkTheme,
  chartType,
  chartColor,
  primaryColorForCharts,
  colors,
  getPlotlyLayoutAndConfig,
}) => {
  // Common classes for centering placeholder content
  const placeholderClasses = "absolute inset-0 flex flex-col items-center justify-center text-muted-foreground";

  if (isLoading && !chart) { // If overall dashboard is loading and this specific chart has no data yet
    return (
      <div className={cn(placeholderClasses)}>
        <GraphLoader /> {/* Use the animated SVG loader */}
        <span className={cn("text-base font-semibold mt-4")}>Loading data...</span>
        <span className={cn("text-xs mt-1", "text-muted-foreground")}>Please wait while we generate your insights.</span>
      </div>
    );
  }

  if (!chart) { // If not loading, but still no chart data
    return (
      <div className={cn(placeholderClasses)}>
        <BarChart2 className={cn("w-12 h-12 mb-2", "text-primary")} />
        <span className={cn("text-base font-semibold")}>No data available</span>
        <span className={cn("text-xs mt-1", "text-muted-foreground")}>Try a different prompt or check your data source.</span>
      </div>
    );
  }

  // Data is available, render the Plotly graph
  const { layout, config } = getPlotlyLayoutAndConfig(chart);
  const isBar = chartType === 'bar';

  return (
    <Plot
      data={(() => {
        if (isBar && Array.isArray(chart.y[0])) {
          return chart.y.map((series: any[], i: number) => ({
            x: chart.x,
            y: series,
            type: 'bar',
            marker: chartColor
              ? { color: Array(series.length).fill(chartColor) }
              : { color: Array(series.length).fill(colors[i % colors.length]) },
          }));
        } else if (isBar) {
          return [{
            x: chart.x,
            y: chart.y,
            type: 'bar',
            marker: chartColor
              ? { color: Array(chart.x.length).fill(chartColor) }
              : { color: chart.x.map((_: any, i: number) => colors[i % colors.length]) }
          }];
        } else {
          const type = chartType;
          return [{
            x: chart.x,
            y: chart.y,
            type,
            ...(type === 'scatter' ? { mode: 'markers' } : {}),
            marker: {
              color: chartColor || chart.marker?.color || colors[0],
              size: 10,
              line: { width: 2, color: isDarkTheme ? '#1f2937' : '#fff' }
            },
          }];
        }
      })()}
      layout={layout}
      style={{ width: '100%', height: '100%' }}
      config={config}
      className="plotly"
    />
  );
};

export default GraphCardContent;