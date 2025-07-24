"use client";

import React, { useState, useEffect } from "react";
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
import { BarChart2, LineChart, ScatterChart, Settings2, X } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Input } from "@/components/ui/input";
import ClipLoader from "react-spinners/ClipLoader";

const NoDataGhost = () => (
  <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
    <ellipse cx="24" cy="30" rx="16" ry="10" fill="#e0e7ef"/>
    <path d="M12 36V18a12 12 0 1 1 24 0v18c0 2-2 2-3 0s-3-2-4 0-3 2-4 0-3-2-4 0-3 2-3 0z" fill="#fff"/>
    <circle cx="18" cy="24" r="2" fill="#a0aec0"/>
    <circle cx="30" cy="24" r="2" fill="#a0aec0"/>
    <ellipse cx="24" cy="28" rx="3" ry="1.5" fill="#cbd5e1"/>
  </svg>
); 

// Custom animated SVG graph loader
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

const DEFAULT_MODEBAR = {
  toImage: true,
  zoom2d: true,
  pan2d: true,
  resetScale2d: true,
  autoscale: true,
  fullscreen: true,
};

const COLORS = ["#A8C574", "#4CB2FF"];

const LOCAL_STORAGE_KEY = "business_charts_cache";

const BusinessDashboard = () => {
  const [modebarOptions, setModebarOptions] = useState<Record<string, typeof DEFAULT_MODEBAR>>({});
  const [input, setInput] = useState("");
  const [charts, setCharts] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
const [hiddenCharts, setHiddenCharts] = useState<Set<string>>(new Set());
const [chartTypes, setChartTypes] = useState<Record<string, string>>({});
const [chartColors, setChartColors] = useState<Record<string, string>>({});

  // Restore input and charts from cache on mount
  useEffect(() => {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      const { input: cachedInput, charts: cachedCharts } = JSON.parse(cached);
      if (cachedInput) setInput(cachedInput);
      if (cachedCharts) setCharts(cachedCharts);
    }
  }, []);

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

      setCharts(prevCharts => ({
        ...prevCharts,
        ...chartMap
      }));
      // Save to localStorage
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ input, charts: chartMap }));
    } catch (err) {
      console.error("Error fetching charts:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 relative min-h-screen">
      {/* Loader Overlay */}
      {loading && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/30 backdrop-blur">
          <div className="flex flex-col items-center gap-4">
            <GraphLoader />
            <span className="text-lg font-semibold text-blue-600 animate-pulse">Generating your dashboard...</span>
          </div>
        </div>
      )}
      {/* Prompt Section */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Input
          type="text"
          placeholder="Ask Aura anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full"
        />
        <Button onClick={fetchData} disabled={loading} className="w-full sm:w-auto">
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
              className={"p-4 rounded-2xl shadow transition-all border"}
            >
              <CardContent className="flex flex-col">
                <span className="text-sm text-gray-500">{kpi.key}</span>
                <span className="flex flex-col items-center justify-center min-h-[2.5rem]">
                  {chart?.y?.at(-1) !== undefined ? (
                    <span className="text-2xl font-bold">{chart.y.at(-1).toLocaleString()}</span>
                  ) : (
                    <span className="flex flex-col items-center justify-center">
                      <NoDataGhost />
                      <span className="text-xs text-gray-400 mt-1 font-medium">No data</span>
                    </span>
                  )}
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
        <TabsList className="flex gap-2">
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
              >
                Restore Graphs
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
              {metrics.map((metric, idx) => {
                if (hiddenCharts.has(metric.key)) return null;
                const chart = charts[metric.key];
                return (
                  <Card key={idx} className="rounded-2xl shadow-lg p-2 sm:p-4 relative bg-white transition-shadow hover:shadow-2xl border border-gray-200">
                    <CardContent className="flex flex-col h-full p-0">
                      <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-100 px-2 pt-2">
                        <h3 className="text-lg font-semibold text-gray-800">{metric.label}</h3>
                        <div className="flex items-center gap-2">
                          {/* Settings popover */}
                          {chart ? (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="border border-gray-200" title="Change chart type">
                                  <Settings2 className="w-5 h-5" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-2 flex flex-col gap-2 justify-center items-center">
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
                          ) : null}
                          {/* Cross button */}
                          <button
                            className="rounded-full p-1 bg-white/80 hover:bg-red-100 text-gray-400 hover:text-red-500 z-10 transition"
                            onClick={() => handleCloseChart(metric.key)}
                            aria-label={`Hide ${metric.label} graph`}
                            type="button"
                            title="Hide this chart"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex-1 w-full h-full" style={{ minHeight: 350, overflow: 'hidden' }}>
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
                                  marker: { color: chartColors[metric.key] || chart.marker?.color || COLORS[0], size: 10, line: { width: 2, color: '#fff' } },
                                }];
                              }
                            })()}
                            layout={{
                              width: undefined,
                              height: undefined,
                              autosize: true,
                              // Remove the title from inside the graph
                              title: '',
                              plot_bgcolor: "#f9fafb",
                              paper_bgcolor: "#fff",
                              font: {
                                family: 'Inter, sans-serif',
                                size: 16,
                                color: '#222'
                              },
                              margin: { l: 50, r: 30, t: 60, b: 50 },
                              xaxis: {
                                title: chart.xLabel,
                                gridcolor: '#e5e7eb',
                                zeroline: false,
                                linecolor: '#d1d5db',
                                tickfont: { size: 15, color: '#555' },
                                titlefont: { size: 17, color: '#333', family: 'Inter, sans-serif' },
                              },
                              yaxis: {
                                title: chart.yLabel,
                                gridcolor: '#e5e7eb',
                                zeroline: false,
                                linecolor: '#d1d5db',
                                tickfont: { size: 15, color: '#555' },
                                titlefont: { size: 17, color: '#333', family: 'Inter, sans-serif' },
                              },
                              legend: {
                                orientation: "h",
                                y: -0.2,
                                font: { size: 15 }
                              },
                              hoverlabel: {
                                bgcolor: "#fff",
                                bordercolor: "#d1d5db",
                                font: { color: "#222", size: 15 }
                              },
                              transition: { duration: 500, easing: 'cubic-in-out' },
                            }}
                            style={{ width: '100%', height: '100%' }}
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
                          <div className="flex flex-col items-center justify-center text-gray-500 pt-12 pb-12">
                          <BarChart2 className="w-16 h-16 mb-2 text-blue-300" />
                          <span className="text-lg font-semibold">No data available</span>
                        </div>
                        )}
                      </div>
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
