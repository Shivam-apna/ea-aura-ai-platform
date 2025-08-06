"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Plot from "react-plotly.js";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { BarChart2, LineChart, ScatterChart, Settings2, X, Eye, EyeOff, Filter, Grid3X3 } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useTheme } from '@/components/ThemeProvider';
import { cn } from '@/lib/utils';

// Type definitions
interface KpiItem {
  key: string;
  bgColor: string;
  originalKey?: string;
}

interface MetricItem {
  key: string;
  label: string;
  originalKey?: string;
}

interface MetricGroups {
  [groupName: string]: MetricItem[];
}

interface ChartData {
  title: string;
  plotType: string;
  x: any[];
  y: any[];
  xLabel: string;
  yLabel: string;
  value?: any;
  delta?: number;
  marker?: {
    color?: string;
  };
}

interface AdvancedDashboardLayoutProps {
  charts: Record<string, ChartData>;
  dynamicKpiKeys: KpiItem[];
  dynamicMetricGroups: MetricGroups;
  storagePrefix: string;
  onChartClose: (key: string) => void;
  onRestoreCharts: () => void;
  onChartTypeChange: (key: string, type: string) => void;
  onChartColorChange: (key: string, color: string) => void;
  chartTypes?: Record<string, string>;
  chartColors?: Record<string, string>;
  loading?: boolean;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  tabNames?: string[];
}

const AdvancedDashboardLayout: React.FC<AdvancedDashboardLayoutProps> = ({
  charts,
  dynamicKpiKeys,
  dynamicMetricGroups,
  storagePrefix,
  onChartClose,
  onRestoreCharts,
  onChartTypeChange,
  onChartColorChange,
  chartTypes = {},
  chartColors = {},
  loading = false,
  activeTab,
  onTabChange,
  tabNames
}) => {
  const { selectedPrimaryColor, previewPrimaryColorHex, themeColors, theme } = useTheme();

  // Detect if the current theme is dark
  const isDarkTheme = theme === 'dark' || 
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const getPrimaryColorHex = () => {
    if (previewPrimaryColorHex) return previewPrimaryColorHex;
    if (selectedPrimaryColor) return selectedPrimaryColor;
    return themeColors[0].hex;
  };

  const primaryColorForCharts = getPrimaryColorHex();
  const COLORS = [primaryColorForCharts, "#A0A0A0"];

  const CARD_ORDER_KEY = `${storagePrefix}_card_order`;
  const COLUMNS_KEY = `${storagePrefix}_columns`;
  const HIDDEN_CHARTS_KEY = `${storagePrefix}_hidden_charts`;

  const [cardOrder, setCardOrder] = useState<{ [tab: string]: string[] }>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(CARD_ORDER_KEY);
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  const [columns, setColumns] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(COLUMNS_KEY);
      return saved ? JSON.parse(saved) : 2;
    }
    return 2;
  });

  const [hiddenCharts, setHiddenCharts] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(HIDDEN_CHARTS_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    }
    return new Set();
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CARD_ORDER_KEY, JSON.stringify(cardOrder));
    }
  }, [cardOrder, CARD_ORDER_KEY]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(COLUMNS_KEY, JSON.stringify(columns));
    }
  }, [columns, COLUMNS_KEY]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(HIDDEN_CHARTS_KEY, JSON.stringify([...hiddenCharts]));
    }
  }, [hiddenCharts, HIDDEN_CHARTS_KEY]);

  useEffect(() => {
    Object.entries(dynamicMetricGroups).forEach(([tab, metrics]) => {
      const visibleKeys = metrics.filter(metric => !hiddenCharts.has(metric.key)).map(m => m.key);
      setCardOrder(prev => {
        const prevOrder = prev[tab] || [];
        const newOrder = prevOrder.filter(key => visibleKeys.includes(key));
        visibleKeys.forEach(key => {
          if (!newOrder.includes(key)) newOrder.push(key);
        });
        return { ...prev, [tab]: newOrder };
      });
    });
  }, [dynamicMetricGroups, hiddenCharts]);

  const handleDragEnd = (tab: string) => (result: any) => {
    if (!result.destination) return;
    setCardOrder(prev => {
      const prevOrder = prev[tab] || [];
      const newOrder = Array.from(prevOrder);
      const [removed] = newOrder.splice(result.source.index, 1);
      newOrder.splice(result.destination.index, 0, removed);
      return { ...prev, [tab]: newOrder };
    });
  };

  const handleTabChangeWithLog = (newTab: string) => {
    if (onTabChange) {
      onTabChange(newTab);
    }
  };

  const handleChartClose = (key: string) => {
    setHiddenCharts(prev => new Set(prev).add(key));
    onChartClose(key);
  };

  const handleRestoreCharts = () => {
    setHiddenCharts(new Set());
    onRestoreCharts();
  };

  const currentTab = activeTab || Object.keys(dynamicMetricGroups)[0];
  const metrics = dynamicMetricGroups[currentTab] || [];

  const buttonsToRemove = [
    'zoom2d', 'pan2d', 'select2d', 'lasso2d', 'zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d',
    'hoverClosestCartesian', 'hoverCompareCartesian', 'toggleSpikelines', 'sendDataToCloud', 'editInChartStudio',
    'drawline', 'drawopenpath', 'drawclosedpath', 'drawcircle', 'drawrect', 'eraseshape',
    'orbitRotation', 'tableRotation', 'resetCameraDefault3d', 'resetCameraLastSave3d', 'hoverClosest3d',
    'zoomInGeo', 'zoomOutGeo', 'resetGeo', 'hoverClosestGeo'
  ];

  // Get Plotly layout and config based on theme
  const getPlotlyLayoutAndConfig = (chart: ChartData) => {
    const baseLayout = {
      width: undefined,
      height: 280,
      autosize: true,
      title: '',
      font: {
        family: 'Inter, sans-serif',
        size: 16,
      },
      margin: { l: 50, r: 30, t: 60, b: 50 },
      xaxis: {
        title: chart.xLabel,
        zeroline: false,
        tickfont: { size: 15 },
        titlefont: { size: 17, family: 'Inter, sans-serif' },
      },
      yaxis: {
        title: chart.yLabel,
        zeroline: false,
        tickfont: { size: 15 },
        titlefont: { size: 17, family: 'Inter, sans-serif' },
      },
      legend: {
        orientation: "h",
        y: -0.2,
        font: { size: 15 }
      },
      transition: { duration: 500, easing: 'cubic-in-out' },
    };

    if (isDarkTheme) {
      // Apply dark theme colors
      return {
        layout: {
          ...baseLayout,
          plot_bgcolor: "hsl(0 0% 16.5%)", // Dark background
          paper_bgcolor: "hsl(0 0% 16.5%)", // Dark paper background
          font: {
            ...baseLayout.font,
            color: '#e5e7eb' // Light text color
          },
          xaxis: {
            ...baseLayout.xaxis,
            gridcolor: '#375139ff', // Dark grid
            linecolor: '#0a0c0bff', // Dark axis line
            tickfont: { size: 15, color: '#9ca3af' }, // Light tick color
            titlefont: { size: 17, color: '#e5e7eb', family: 'Inter, sans-serif' },
          },
          yaxis: {
            ...baseLayout.yaxis,
            gridcolor: '#343a40', // Dark grid
            linecolor: '#6b7280', // Dark axis line
            tickfont: { size: 15, color: '#9ca3af' }, // Light tick color
            titlefont: { size: 17, color: '#e5e7eb', family: 'Inter, sans-serif' },
          },
          legend: {
            ...baseLayout.legend,
            font: { size: 15, color: '#e5e7eb' }
          },
          hoverlabel: {
            bgcolor: "#374151",
            bordercolor: "#6b7280",
            font: { color: "#e5e7eb", size: 15 }
          },
        },
        config: {
          displayModeBar: true,
          displaylogo: false,
          modeBarButtonsToRemove: buttonsToRemove,
          responsive: true,
          toImageButtonOptions: {
            format: 'png',
            filename: 'chart',
            height: 500,
            width: 700,
            scale: 1
          }
        }
      };
    } else {
      // Apply light theme colors
      return {
        layout: {
          ...baseLayout,
          plot_bgcolor: "#ffffff", // Light background
          paper_bgcolor: "#ffffff", // Light paper background
          font: {
            ...baseLayout.font,
            color: '#1f2937' // Dark text color
          },
          xaxis: {
            ...baseLayout.xaxis,
            gridcolor: '#e5e7eb', // Light grid
            linecolor: '#d1d5db', // Light axis line
            tickfont: { size: 15, color: '#6b7280' }, // Dark tick color
            titlefont: { size: 17, color: '#1f2937', family: 'Inter, sans-serif' },
          },
          yaxis: {
            ...baseLayout.yaxis,
            gridcolor: '#e5e7eb', // Light grid
            linecolor: '#d1d5db', // Light axis line
            tickfont: { size: 15, color: '#6b7280' }, // Dark tick color
            titlefont: { size: 17, color: '#1f2937', family: 'Inter, sans-serif' },
          },
          legend: {
            ...baseLayout.legend,
            font: { size: 15, color: '#1f2937' }
          },
          hoverlabel: {
            bgcolor: "#ffffff",
            bordercolor: "#d1d5db",
            font: { color: "#1f2937", size: 15 }
          },
        },
        config: {
          displayModeBar: true,
          displaylogo: false,
          modeBarButtonsToRemove: buttonsToRemove,
          responsive: true,
          toImageButtonOptions: {
            format: 'png',
            filename: 'chart',
            height: 500,
            width: 700,
            scale: 1
          }
        }
      };
    }
  };

  return (
    <div className="relative min-h-screen w-full max-w-[1500px] mx-auto px-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-2 w-full">
        {dynamicKpiKeys.map((kpi, idx) => {
          const chart = charts[kpi.key];
          const icons = [BarChart2, LineChart];
          const Icon = icons[idx % icons.length];
          return (
            <Card
              key={idx}
              style={{ backgroundColor: kpi.bgColor || '#fff' }}
              className={"rounded-xl shadow-md transition-transform hover:scale-105 hover:shadow-lg p-0 overflow-hidden group min-h-[90px]"}
            >
              <CardContent className="flex flex-col items-center justify-center py-3 px-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn("text-xs font-medium", theme === 'dark' && "text-black") } style={{ fontSize: "0.90rem" }}>{kpi.originalKey || kpi.key}</span>
                  {idx % 2 === 0 ? <BarChart2 className={cn("w-4 h-4 text-primary", theme === 'dark' && "text-black")} /> : <LineChart className={cn("w-4 h-4 text-primary", theme === 'dark' && "text-black")} />}
                </div>
                <span className="flex flex-col items-center justify-center min-h-[1.5rem]">
                  {chart?.y?.at(-1) !== undefined ? (
                    <span className={cn("text-lg font-bold text-foreground group-hover:text-primary transition-colors", theme === 'dark' && "text-black")}>{chart.y.at(-1).toLocaleString()}</span>
                  ) : (
                    <span className="flex flex-col items-center justify-center">
                      <Icon className={cn("w-7 h-7 mb-0.5", theme === 'dark' ? "text-black" : "text-muted-foreground")} />
                      <span className={cn("text-[10px] mt-0.5 font-medium", theme === 'dark' ? "text-black" : "text-muted-foreground")}>No data</span>
                    </span>
                  )}
                </span>
                <span
                  className={`text-[11px] mt-0.5 font-semibold ${chart?.delta > 0 ? "text-green-600" : chart?.delta < 0 ? "text-red-500" : "text-muted-foreground"}`}
                >
                  {chart?.delta === undefined || chart?.delta === null
                    ? "--"
                    : chart.delta === 0
                      ? "0%"
                      : `${chart.delta > 0 ? "+" : ""}${chart.delta}%`}
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChangeWithLog} className="space-y-4 w-full mt-4">
        <TabsList className="flex gap-2 bg-transparent p-0 mb-2 overflow-x-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-50 whitespace-nowrap">
          {(tabNames || Object.keys(dynamicMetricGroups)).map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className={cn(
                "rounded-full px-4 py-2 text-sm transition-all duration-300 active:scale-95",
                "bg-muted/50 border border-border text-muted-foreground font-medium",
                "hover:bg-muted/70",
                "data-[state=active]:bg-[rgb(59,130,246)] data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-lg data-[state=active]:border-transparent",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              )}
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent key={currentTab} value={currentTab}>
          <div className="flex justify-end mb-2 gap-4 items-center">
            <Button
              variant="outline"
              onClick={handleRestoreCharts}
              disabled={metrics.every((metric) => !hiddenCharts.has(metric.key))}
            >
              Restore Graphs
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" title="Select graphs to show">
                  <Filter className="w-5 h-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm text-gray-700">Select Graphs to Show</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setHiddenCharts(prev => {
                          const newSet = new Set(prev);
                          metrics.forEach(metric => newSet.delete(metric.key));
                          return newSet;
                        });
                      }}
                      disabled={metrics.every(metric => !hiddenCharts.has(metric.key))}
                      className="text-xs"
                    >
                      Show All
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {metrics.map((metric) => {
                      const isHidden = hiddenCharts.has(metric.key);
                      const visibleCount = metrics.filter(m => !hiddenCharts.has(m.key)).length;
                      const canHide = visibleCount > 1;

                      return (
                        <div key={metric.key} className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-gray-50">
                          <div className="flex items-center gap-2">
                            {isHidden ? (
                              <EyeOff className="w-4 h-4 text-gray-400" />
                            ) : (
                              <Eye className="w-4 h-4 text-primary" />
                            )}
                            <span className="text-sm font-medium text-gray-700">{metric.label}</span>
                          </div>
                          <Button
                            variant={isHidden ? "outline" : "secondary"}
                            size="sm"
                            onClick={() => {
                              if (isHidden) {
                                setHiddenCharts(prev => {
                                  const newSet = new Set(prev);
                                  newSet.delete(metric.key);
                                  return newSet;
                                });
                              } else if (canHide) {
                                setHiddenCharts(prev => new Set(prev).add(metric.key));
                              }
                            }}
                            disabled={!isHidden && !canHide}
                            className="text-xs"
                          >
                            {isHidden ? "Show" : canHide ? "Hide" : "Last Graph"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-xs text-gray-500 pt-2 border-t">
                    {metrics.filter(m => !hiddenCharts.has(m.key)).length} of {metrics.length} graphs visible
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" title="Change layout">
                  <Grid3X3 className="w-5 h-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto flex gap-2 items-center">
                <Button variant={columns === 1 ? "secondary" : "outline"} size="icon" onClick={() => setColumns(1)} title="1 card per row">1</Button>
                <Button variant={columns === 2 ? "secondary" : "outline"} size="icon" onClick={() => setColumns(2)} title="2 cards per row">2</Button>
              </PopoverContent>
            </Popover>
          </div>

          {(() => {
            const gridColsClass = columns === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2";
            const visibleMetrics = (cardOrder[currentTab] || metrics.filter(metric => !hiddenCharts.has(metric.key)).map(m => m.key))
              .map(key => metrics.find(m => m.key === key)).filter((m): m is MetricItem => Boolean(m));

            return (
              <DragDropContext onDragEnd={handleDragEnd(currentTab)}>
                <Droppable droppableId={`cards-${currentTab}`} direction="horizontal">
                  {(provided) => (
                    <div
                      className={`grid ${gridColsClass} gap-6 mt-2 w-full`}
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                    >
                      {visibleMetrics.map((metric, idx, arr) => {
                        const chart = charts[metric.key];
                        const isLast = idx === arr.length - 1;
                        const isOdd = arr.length % 2 === 1;
                        const stretchClass = columns === 2 && isLast && isOdd ? 'sm:col-span-2' : '';

                        return (
                          <Draggable key={metric.key} draggableId={metric.key} index={idx}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={stretchClass}
                              >
                                <Card className="rounded-2xl shadow-lg p-2 sm:p-3 relative bg-card transition-shadow hover:shadow-2xl overflow-hidden animate-fade-in">
                                  <CardContent className="flex flex-col h-full p-0">
                                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-100 px-2 pt-2">
                                      <h3 className="text-base font-semibold text-foreground">{metric.label}</h3>
                                      <div className="flex items-center gap-2">
                                        {chart && (
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
                                                  onClick={() => onChartTypeChange(metric.key, 'bar')}
                                                  title="Bar Chart"
                                                >
                                                  <BarChart2 className="w-5 h-5" />
                                                </Button>
                                                <Button
                                                  variant={((chartTypes[metric.key] || chart.plotType) === 'line') ? 'secondary' : 'ghost'}
                                                  size="icon"
                                                  onClick={() => onChartTypeChange(metric.key, 'line')}
                                                  title="Line Chart"
                                                >
                                                  <LineChart className="w-5 h-5" />
                                                </Button>
                                                <Button
                                                  variant={((chartTypes[metric.key] || chart.plotType) === 'scatter') ? 'secondary' : 'ghost'}
                                                  size="icon"
                                                  onClick={() => onChartTypeChange(metric.key, 'scatter')}
                                                  title="Scatter Plot"
                                                >
                                                  <ScatterChart className="w-5 h-5" />
                                                </Button>
                                                <input
                                                  type="color"
                                                  className="w-8 h-8 p-0 border-none bg-transparent cursor-pointer ml-2"
                                                  value={chartColors[metric.key] || chart.marker?.color || primaryColorForCharts}
                                                  onChange={e => onChartColorChange(metric.key, e.target.value)}
                                                  title="Pick graph color"
                                                />
                                              </div>
                                            </PopoverContent>
                                          </Popover>
                                        )}
                                        <button
                                          className="rounded-full p-1 bg-muted/50 hover:bg-destructive/20 text-gray-400 hover:text-red-500 z-10 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                          onClick={() => handleChartClose(metric.key)}
                                          aria-label={`Hide ${metric.label} graph`}
                                          type="button"
                                          title="Hide this chart"
                                          disabled={visibleMetrics.length === 1}
                                        >
                                          <X className="w-5 h-5" />
                                        </button>
                                      </div>
                                    </div>
                                    <div className="flex-1 w-full h-full" style={{ minHeight: 340, overflow: 'hidden' }}>
                                      {chart ? (
                                        (() => {
                                          const { layout, config } = getPlotlyLayoutAndConfig(chart);
                                          return (
                                            <Plot
                                              data={(() => {
                                                const isBar = (chartTypes[metric.key] || chart.plotType) === 'bar';
                                                if (isBar && Array.isArray(chart.y[0])) {
                                                  return chart.y.map((series, i) => ({
                                                    x: chart.x,
                                                    y: series,
                                                    type: 'bar',
                                                    marker: chartColors[metric.key]
                                                      ? { color: Array(series.length).fill(chartColors[metric.key]) }
                                                      : { color: Array(series.length).fill(COLORS[i % COLORS.length]) },
                                                  }));
                                                } else if (isBar) {
                                                  return [{
                                                    x: chart.x,
                                                    y: chart.y,
                                                    type: 'bar',
                                                    marker: chartColors[metric.key]
                                                      ? { color: Array(chart.x.length).fill(chartColors[metric.key]) }
                                                      : { color: chart.x.map((_, i) => COLORS[i % COLORS.length]) }
                                                  }];
                                                } else {
                                                  const type = chartTypes[metric.key] || chart.plotType;
                                                  return [{
                                                    x: chart.x,
                                                    y: chart.y,
                                                    type,
                                                    ...(type === 'scatter' ? { mode: 'markers' } : {}),
                                                    marker: { 
                                                      color: chartColors[metric.key] || chart.marker?.color || COLORS[0], 
                                                      size: 10, 
                                                      line: { width: 2, color: isDarkTheme ? '#1f2937' : '#fff' } 
                                                    },
                                                  }];
                                                }
                                              })()}
                                              layout={layout}
                                              style={{ width: '100%', height: '100%' }}
                                              config={config}
                                            />
                                          );
                                        })()
                                      ) : (
                                        <div className={cn("flex flex-col items-center justify-center pt-20 pb-8", "text-muted-foreground")}>
                                          <BarChart2 className={cn("w-12 h-12 mb-2 animate-bounce", "text-primary")} />
                                          <span className={cn("text-base font-semibold")}>No data available</span>
                                          <span className={cn("text-xs mt-1", "text-muted-foreground")}>Try a different prompt or check your data source.</span>
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            );
          })()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedDashboardLayout;