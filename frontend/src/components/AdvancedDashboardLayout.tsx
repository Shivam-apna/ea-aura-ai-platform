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
  // Data props
  charts: Record<string, ChartData>;
  dynamicKpiKeys: KpiItem[];
  dynamicMetricGroups: MetricGroups;
  
  // Layout state props
  storagePrefix: string; // e.g., "mission_alignment", "customer_analyzer"
  
  // Event handlers
  onChartClose: (key: string) => void;
  onRestoreCharts: () => void;
  onChartTypeChange: (key: string, type: string) => void;
  onChartColorChange: (key: string, color: string) => void;
  
  // Optional props
  chartTypes?: Record<string, string>;
  chartColors?: Record<string, string>;
  loading?: boolean;
}

const COLORS = ["#A8C574", "#4CB2FF"];

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
  loading = false
}) => {
  // Layout state management
  const CARD_ORDER_KEY = `${storagePrefix}_card_order`;
  const COLUMNS_KEY = `${storagePrefix}_columns`;
  const HIDDEN_CHARTS_KEY = `${storagePrefix}_hidden_charts`;

  const [cardOrder, setCardOrder] = useState<{ [tab: string]: string[] }>(() => {
    const saved = localStorage.getItem(CARD_ORDER_KEY);
    return saved ? JSON.parse(saved) : {};
  });
  
  const [columns, setColumns] = useState(() => {
    const saved = localStorage.getItem(COLUMNS_KEY);
    return saved ? JSON.parse(saved) : 2;
  });
  
  const [hiddenCharts, setHiddenCharts] = useState<Set<string>>(() => {
    const saved = localStorage.getItem(HIDDEN_CHARTS_KEY);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Persist cardOrder
  useEffect(() => {
    localStorage.setItem(CARD_ORDER_KEY, JSON.stringify(cardOrder));
  }, [cardOrder, CARD_ORDER_KEY]);
  
  // Persist columns
  useEffect(() => {
    localStorage.setItem(COLUMNS_KEY, JSON.stringify(columns));
  }, [columns, COLUMNS_KEY]);
  
  // Persist hiddenCharts
  useEffect(() => {
    localStorage.setItem(HIDDEN_CHARTS_KEY, JSON.stringify([...hiddenCharts]));
  }, [hiddenCharts, HIDDEN_CHARTS_KEY]);

  // Update card order when metric groups or hidden charts change
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

  const handleChartClose = (key: string) => {
    setHiddenCharts(prev => new Set(prev).add(key));
    onChartClose(key);
  };

  const handleRestoreCharts = () => {
    setHiddenCharts(new Set());
    onRestoreCharts();
  };

  return (
    <div className="p-6 relative min-h-screen">
      {/* KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-2 w-full">
        {dynamicKpiKeys.map((kpi, idx) => {
          const chart = charts[kpi.key];
          const icons = [BarChart2, LineChart];
          const Icon = icons[idx % icons.length];
          return (
            <Card
              key={idx}
              style={{ backgroundColor: kpi.bgColor || '#fff' }}
              className={"rounded-xl shadow-md transition-transform hover:scale-105 hover:shadow-lg border border-gray-200 p-0 overflow-hidden group min-h-[90px]"}
            >
              <CardContent className="flex flex-col items-center justify-center py-3 px-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-500 font-medium">{kpi.originalKey || kpi.key}</span>
                  {idx % 2 === 0 ? <BarChart2 className="w-4 h-4 text-blue-400" /> : <LineChart className="w-4 h-4 text-green-400" />}
                </div>
                <span className="flex flex-col items-center justify-center min-h-[1.5rem]">
                  {chart?.y?.at(-1) !== undefined ? (
                    <span className="text-lg font-bold text-blue-900 group-hover:text-green-700 transition-colors">{chart.y.at(-1).toLocaleString()}</span>
                  ) : (
                    <span className="flex flex-col items-center justify-center">
                      <Icon className="w-7 h-7 text-blue-300 mb-0.5" />
                      <span className="text-[10px] text-gray-400 mt-0.5 font-medium">No data</span>
                    </span>
                  )}
                </span>
                <span
                  className={`text-[11px] mt-0.5 font-semibold ${chart?.delta > 0 ? "text-green-600" : chart?.delta < 0 ? "text-red-500" : "text-gray-400"}`}
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

      {/* Tabs */}
      <Tabs defaultValue={Object.keys(dynamicMetricGroups)[0]} className="space-y-4 w-full mt-4">
        <TabsList className="flex gap-2 bg-transparent p-0 mb-2 overflow-x-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-50 whitespace-nowrap">
          {Object.keys(dynamicMetricGroups).map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="rounded-full px-4 py-2 text-sm transition-all
                         bg-white border border-gray-300 text-foreground font-medium
                         data-[state=active]:bg-[#2E9CFF] data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-sm
                         focus-visible:ring-2 focus-visible:ring-blue-200"
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {Object.entries(dynamicMetricGroups).map(([tab, metrics]) => (
          <TabsContent key={tab} value={tab}>
            <div className="flex justify-end mb-2 gap-4 items-center">
              <Button
                variant="outline"
                onClick={handleRestoreCharts}
                disabled={metrics.every((metric) => !hiddenCharts.has(metric.key))}
              >
                Restore Graphs
              </Button>
              
              {/* Graph selector popover */}
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
                                <Eye className="w-4 h-4 text-blue-500" />
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
              
              {/* Layout selector popover */}
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
            
            {/* Graph cards with drag & drop */}
            {(() => {
              const gridColsClass = columns === 1
                ? "grid-cols-1"
                : "grid-cols-1 sm:grid-cols-2";
              
              const visibleMetrics = (cardOrder[tab] || metrics.filter(metric => !hiddenCharts.has(metric.key)).map(m => m.key))
                .map(key => metrics.find(m => m.key === key)).filter(Boolean);
              
              return (
                <DragDropContext onDragEnd={handleDragEnd(tab)}>
                  <Droppable droppableId={`cards-${tab}`} direction="horizontal">
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
                          
                          // Stretching logic for 2-column layout
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
                                  <Card className="rounded-2xl shadow-lg p-2 sm:p-3 relative bg-card transition-shadow hover:shadow-2xl border border-gray-200 overflow-hidden animate-fade-in">
                                    <CardContent className="flex flex-col h-full p-0">
                                      <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-100 px-2 pt-2">
                                        <h3 className="text-base font-semibold text-foreground">{metric.label}</h3>
                                        <div className="flex items-center gap-2">
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
                                                    value={chartColors[metric.key] || chart.marker?.color || "#3b82f6"}
                                                    onChange={e => onChartColorChange(metric.key, e.target.value)}
                                                    title="Pick graph color"
                                                  />
                                                </div>
                                              </PopoverContent>
                                            </Popover>
                                          ) : null}
                                          <button
                                            className="rounded-full p-1 bg-white/80 hover:bg-red-100 text-gray-400 hover:text-red-500 z-10 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                                                    : { color: chart.x.map((_, i) => COLORS[i % COLORS.length]) },
                                                }];
                                              } else {
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
                                              height: 280,
                                              autosize: true,
                                              title: '',
                                              plot_bgcolor: "hsl(var(--card))",
                                              paper_bgcolor: "hsl(var(--card))",
                                              font: {
                                                family: 'Inter, sans-serif',
                                                size: 16,
                                                color: 'hsl(var(--foreground))'
                                              },
                                              margin: { l: 50, r: 30, t: 60, b: 50 },
                                              xaxis: {
                                                title: chart.xLabel,
                                                gridcolor: 'hsl(var(--border))',
                                                zeroline: false,
                                                linecolor: 'hsl(var(--border))',
                                                tickfont: { size: 15, color: 'hsl(var(--muted-foreground))' },
                                                titlefont: { size: 17, color: 'hsl(var(--foreground))', family: 'Inter, sans-serif' },
                                              },
                                              yaxis: {
                                                title: chart.yLabel,
                                                gridcolor: 'hsl(var(--border))',
                                                zeroline: false,
                                                linecolor: 'hsl(var(--border))',
                                                tickfont: { size: 15, color: 'hsl(var(--muted-foreground))' },
                                                titlefont: { size: 17, color: 'hsl(var(--foreground))', family: 'Inter, sans-serif' },
                                              },
                                              legend: {
                                                orientation: "h",
                                                y: -0.2,
                                                font: { size: 15, color: 'hsl(var(--foreground))' }
                                              },
                                              hoverlabel: {
                                                bgcolor: "hsl(var(--popover))",
                                                bordercolor: "hsl(var(--border))",
                                                font: { color: "hsl(var(--popover-foreground))", size: 15 }
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
                                                'zoomInGeo', 'zoomOutGeo', 'resetGeo', 'hoverClosestGeo',
                                                'toImage'
                                              ].filter(btn => btn !== 'toImage' && btn !== 'fullscreen'),
                                              responsive: true,
                                            }}
                                          />
                                        ) : (
                                          <div className="flex flex-col items-center justify-center text-gray-500 pt-8 pb-8">
                                            <BarChart2 className="w-12 h-12 mb-2 text-blue-300 animate-bounce" />
                                            <span className="text-base font-semibold">No data available</span>
                                            <span className="text-xs text-gray-400 mt-1">Try a different prompt or check your data source.</span>
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
        ))}
      </Tabs>
    </div>
  );
};

export default AdvancedDashboardLayout; 