"use client";
 
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import Plot from "react-plotly.js";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
 
import config from "@/config/business_dashboard.json";
// Configurable metric layout
const KPI_KEYS = config.kpi_keys;
const METRIC_GROUPS = config.metric_groups;;
import { BarChart2, LineChart, ScatterChart, Settings2 } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Input } from "@/components/ui/input";
import { cn } from '@/lib/utils'; // Import cn for class merging
 
const DEFAULT_MODEBAR = {
  toImage: true,
  zoom2d: true,
  pan2d: true,
  resetScale2d: true,
  autoscale: true,
  fullscreen: true,
};
 
const COLORS = ["#A8C574", "#4CB2FF"];
 
const BusinessDashboard = () => {
  const [modebarOptions, setModebarOptions] = useState<Record<string, typeof DEFAULT_MODEBAR>>({});
  const [input, setInput] = useState("");
  const [charts, setCharts] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
const [hiddenCharts, setHiddenCharts] = useState<Set<string>>(new Set());
const [chartTypes, setChartTypes] = useState<Record<string, string>>({});
const [chartColors, setChartColors] = useState<Record<string, string>>({});
 
  const handleCloseChart = (key: string) => {
    setHiddenCharts((prev) => new Set(prev).add(key));
  };
 
  const handleRestoreCharts = () => {
    setHiddenCharts(new Set());
  };
 
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8081/api/v1/run-autogen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, tenant_id: "tenant_123ffff" }),
      });
 
      const data = await res.json();
      const parsed = data.sub_agent_response;
      console.log(parsed);
 
      const chartMap: Record<string, any> = {};
 
      for (const key of Object.keys(parsed)) {
        if (["response", "task", "columns", "filters"].includes(key)) continue;
 
        const { plot_type, data: values, value, delta } = parsed[key] || {};
        if (!values || values.length === 0) continue;
 
        const xKey = Object.keys(values[0])[0];
        const yKey = Object.keys(values[0]).find((k) => k !== xKey);
        if (!yKey) continue;
 
        chartMap[key] = {
          title: key,
          plotType: plot_type || "bar",
          x: values.map((d) => {
            const val = d[xKey];
            // If value looks like a date string, format to YYYY-MM-DD
            if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}([ T]([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?(\.\d+)?(Z|[+-][01]\d:?[0-5]\d)?)?$/.test(val)) {
              return val.slice(0, 10);
            }
            return val;
          }),
          y: values.map((d) => d[yKey]),
          xLabel: xKey,
          yLabel: yKey,
          value,
          delta,
        };
      }
 
      setCharts(chartMap);
    } catch (err) {
      console.error("Error fetching charts:", err);
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <div className="p-6 space-y-6 bg-background min-h-screen"> {/* Apply background to the page */}
      {/* Prompt Section */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Input
          type="text"
          placeholder="Ask Aura anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full neumorphic-card" // Apply neumorphic styling
        />
        <Button onClick={fetchData} disabled={loading} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
          {loading ? "Generating..." : "Generate"}
        </Button>
      </div>
 
      {/* KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_KEYS.map((kpi, idx) => {
          const chart = charts[kpi.key];
          return (
            <Card
              key={idx}
              style={{ backgroundColor: kpi.bgColor }}
              className={cn("p-4 rounded-2xl shadow transition-all border neumorphic-card", kpi.bgColor)} // Apply neumorphic styling
            >
              <CardContent className="flex flex-col">
                <span className="text-sm text-gray-500">{kpi.key}</span>
                <span className="text-2xl font-bold">
                  {chart?.y?.at(-1)?.toLocaleString() ?? "No data"}
                </span>
                <span
                  className={`text-sm mt-1 ${
                    chart?.delta > 0
                      ? "text-green-600"
                      : chart?.delta < 0
                      ? "text-red-500"
                      : "text-gray-400"
                  }`}
                >
                  {chart?.delta ? `${chart.delta > 0 ? "+" : ""}${chart.delta}%` : "--"}
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>
 
 {/* Tabbed Graph Section */}
      <Tabs defaultValue={Object.keys(METRIC_GROUPS)[0]} className="space-y-4">
        <TabsList className="flex gap-2 neumorphic-card"> {/* Apply neumorphic styling */}
          {Object.keys(METRIC_GROUPS).map((tab) => (
            <TabsTrigger key={tab} value={tab}>
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>
 
        {Object.entries(METRIC_GROUPS).map(([tab, metrics]) => (
          <TabsContent key={tab} value={tab}>
            <div className="flex justify-end mb-2">
              <Button
                variant="outline"
                onClick={() => {
                  setHiddenCharts((prev) => {
                    const newSet = new Set(prev);
                    metrics.forEach((metric) => newSet.delete(metric.key));
                    return newSet;
                  });
                }}
                disabled={metrics.every((metric) => !hiddenCharts.has(metric.key))}
                className="neumorphic-card" // Apply neumorphic styling
              >
                Restore Graphs
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
              {metrics.map((metric, idx) => {
                if (hiddenCharts.has(metric.key)) return null;
                const chart = charts[metric.key];
                return (
                  <Card key={idx} className="rounded-2xl shadow-lg p-6 relative neumorphic-card"> {/* Apply neumorphic styling */}
                    <button
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xl font-bold z-10"
                      onClick={() => handleCloseChart(metric.key)}
                      aria-label={`Close ${metric.label} graph`}
                      type="button"
                    >
                      ×
                    </button>
                    <CardContent>
                      <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-800">{metric.label}</h3>
                        {chart ? (
                          <div className="flex items-center gap-2">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="border border-gray-200 neumorphic-card" title="Change chart type"> {/* Apply neumorphic styling */}
                                  <Settings2 className="w-5 h-5" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-2 flex flex-col gap-2 justify-center items-center neumorphic-card"> {/* Apply neumorphic styling */}
                                <div className="flex gap-2 mb-2">
                                  <Button
                                    variant={((chartTypes[metric.key] || chart.plotType) === 'bar') ? 'secondary' : 'ghost'}
                                    size="icon"
                                    onClick={() => setChartTypes(types => ({ ...types, [metric.key]: 'bar' }))}
                                    title="Bar Chart"
                                  >
                                    <BarChart2 className="w-5 h-5" />
                                  </Button>
                                  <Button
                                    variant={((chartTypes[metric.key] || chart.plotType) === 'line') ? 'secondary' : 'ghost'}
                                    size="icon"
                                    onClick={() => setChartTypes(types => ({ ...types, [metric.key]: 'line' }))}
                                    title="Line Chart"
                                  >
                                    <LineChart className="w-5 h-5" />
                                  </Button>
                                  <Button
                                    variant={((chartTypes[metric.key] || chart.plotType) === 'scatter') ? 'secondary' : 'ghost'}
                                    size="icon"
                                    onClick={() => setChartTypes(types => ({ ...types, [metric.key]: 'scatter' }))}
                                    title="Scatter Plot"
                                  >
                                    <ScatterChart className="w-5 h-5" />
                                  </Button>
                                  <input
                                    type="color"
                                    className="w-8 h-8 p-0 border-none bg-transparent cursor-pointer ml-2"
                                    value={chartColors[metric.key] || chart.marker?.color || "#3b82f6"}
                                    onChange={e => setChartColors(colors => ({ ...colors, [metric.key]: e.target.value }))}
                                    title="Pick graph color"
                                  />
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        ) : null}
                      </div>
                      {chart ? (
                        <Plot
                          data={(() => {
                            const isBar = (chartTypes[metric.key] || chart.plotType) === 'bar';
                            // Multi-series: chart.y is array of arrays
                            if (isBar && Array.isArray(chart.y[0])) {
                              // Multi-series bar chart
                              return chart.y.map((series, i) => ({
                                x: chart.x,
                                y: series,
                                type: 'bar',
                                marker: chartColors[metric.key]
                                  ? { color: Array(series.length).fill(chartColors[metric.key]) }
                                  : { color: Array(series.length).fill(COLORS[i % COLORS.length]) },
                              }));
                            } else if (isBar) {
                              // Single-series bar chart
                              return [{
                                x: chart.x,
                                y: chart.y,
                                type: 'bar',
                                marker: chartColors[metric.key]
                                  ? { color: Array(chart.x.length).fill(chartColors[metric.key]) }
                                  : { color: chart.x.map((_, i) => COLORS[i % COLORS.length]) },
                              }];
                            } else {
                              // Not a bar chart
                              const type = chartTypes[metric.key] || chart.plotType;
                              return [{
                                x: chart.x,
                                y: chart.y,
                                type,
                                ...(type === 'scatter' ? { mode: 'markers' } : {}),
                                marker: { color: chartColors[metric.key] || chart.marker?.color || COLORS[0] },
                              }];
                            }
                          })()}
                          layout={{
                            width: undefined,
                            height: undefined,
                            autosize: true,
                            title: chart.title,
                            plot_bgcolor: "hsl(var(--neumorphic-bg))", // Use neumorphic background
                            paper_bgcolor: "hsl(var(--neumorphic-bg))", // Use neumorphic background
                            font: {
                              family: 'Inter, sans-serif',
                              size: 16,
                              color: 'hsl(var(--foreground))' // Use foreground color
                            },
                            margin: { l: 60, r: 30, t: 50, b: 60 },
                            xaxis: {
                              title: chart.xLabel,
                              gridcolor: 'hsl(var(--border))', // Use border color for grid
                              zeroline: false,
                              linecolor: 'hsl(var(--border))', // Use border color for line
                              tickfont: { size: 14, color: 'hsl(var(--muted-foreground))' }, // Use muted-foreground
                              titlefont: { size: 16, color: 'hsl(var(--foreground))', family: 'Inter, sans-serif' }, // Use foreground
                            },
                            yaxis: {
                              title: chart.yLabel,
                              gridcolor: 'hsl(var(--border))', // Use border color for grid
                              zeroline: false,
                              linecolor: 'hsl(var(--border))', // Use border color for line
                              tickfont: { size: 14, color: 'hsl(var(--muted-foreground))' }, // Use muted-foreground
                              titlefont: { size: 16, color: 'hsl(var(--foreground))', family: 'Inter, sans-serif' }, // Use foreground
                            },
                          }}
                          style={{ width: '100%', height: '100%', minHeight: 300 }}
                          config={{
                            displayModeBar: true,
                            displaylogo: false,
                            modeBarButtonsToRemove: [
                              'zoom2d', 'pan2d', 'select2d', 'lasso2d', 'zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d',
                              'hoverClosestCartesian', 'hoverCompareCartesian', 'toggleSpikelines', 'sendDataToCloud', 'editInChartStudio',
                              'drawline', 'drawopenpath', 'drawclosedpath', 'drawcircle', 'drawrect', 'eraseshape',
                              'orbitRotation', 'tableRotation', 'resetCameraDefault3d', 'resetCameraLastSave3d', 'hoverClosest3d',
                              'hoverClosestGl2d', 'hoverClosestPie', 'toggleHover', 'resetViews', 'toggleHover', 'resetViews',
                              'zoom3d', 'pan3d', 'resetCameraDefault3d', 'resetCameraLastSave3d', 'hoverClosest3d',
                              'zoomInGeo', 'zoomOutGeo', 'resetGeo', 'hoverClosestGeo',
                              'toImage' // keep this at the end so we can remove all except toImage and fullscreen
                            ].filter(btn => btn !== 'toImage' && btn !== 'fullscreen'),
                            responsive: true,
                          }}
                        />
                      ) : (
                        <div className="text-center text-gray-500 pt-12 pb-12">
                          No data available
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
 
export default BusinessDashboard;