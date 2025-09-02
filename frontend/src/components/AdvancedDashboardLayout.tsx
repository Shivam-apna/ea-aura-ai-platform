"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Plot from "react-plotly.js";
import { toast } from 'sonner';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { BarChart2, LineChart, ScatterChart, Settings2, CircleStop, X, Eye, EyeOff, Filter, Grid3X3, TrendingUp, Lightbulb, Icon, InfoIcon } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useTheme } from '@/components/ThemeProvider';
import { cn } from '@/lib/utils';
import { Tooltip as ShadcnTooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Speech } from "lucide-react";
import { stopCurrentTTS, createIndividualMetricTTS } from "@/utils/avatars";
import { CompactVoiceVisualizer } from "@/components/AvatarVisualizer";
import ClipLoader from "react-spinners/ClipLoader";
import { getKpiBgColor, getContrastTextColor, getKpiColorInfo, debugKpiColors } from '@/utils/kpiColorUtils';
import AISummaryPopup from './AISummaryPopup'; // Import the new component
import GraphCardContent from './GraphCardContent'; // Import the new GraphCardContent component

import { PredictiveAnalysis } from "@/utils/predictiveJson";
import { PredictiveModal } from '@/components/PredectiveModal';
import { NextStepModal } from '@/components/NextStepModal';
// Type definitions
interface KpiItem {
  key: string;
  bgColor: string;
  originalKey?: string;
  displayName?: string;
}

interface MetricItem {
  key: string;
  label: string;
  originalKey?: string;
  displayName?: string;
}

interface MetricGroups {
  [groupName: string]: MetricItem[];
}

// Define the ChartData interface based on its usage in the component
interface ChartData {
  summary: string;
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
  hideTabsList?: boolean; // New prop
  tenantId?: string;
  onRefreshCharts?: () => void;
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
  chartTypes: initialChartTypes = {}, // Use initialChartTypes for prop
  chartColors: initialChartColors = {}, // Use initialChartColors for prop
  loading = false,
  activeTab,
  onTabChange,
  tenantId,
  tabNames,
  hideTabsList = false,// Default to false
  onRefreshCharts
}) => {
  const { selectedPrimaryColor, previewPrimaryColorHex, themeColors, theme } = useTheme();

  const iconColorClass = theme === 'dark' ? 'text-white' : 'text-primary'; // Conditional class

  useEffect(() => {
    // Debug the KPI color mapping
    const kpiNames = dynamicKpiKeys.map(kpi => kpi.key);
    debugKpiColors(kpiNames);
  }, [dynamicKpiKeys]);


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

  // Correctly declare state variables and their setters
  const [chartTypes, setChartTypes] = useState<Record<string, string>>(initialChartTypes);
  const [chartColors, setChartColors] = useState<Record<string, string>>(initialChartColors);
  const [ttsLoadingMap, setTtsLoadingMap] = useState<Record<string, boolean>>({});
  const [isSpeakingMap, setIsSpeakingMap] = useState<Record<string, boolean>>({});
  const [showSummaryMap, setShowSummaryMap] = useState<Record<string, boolean>>({}); // State for summary popup visibility
  const [individualSummaries, setIndividualSummaries] = useState<Record<string, string>>({});
  const [predictiveLoading, setPredictiveLoading] = useState<Record<string, boolean>>({});
  const [predictiveModalOpen, setPredictiveModalOpen] = useState(false);
  const [predictiveModalData, setPredictiveModalData] = useState<any>(null);
  const [predictiveModalMetricKey, setPredictiveModalMetricKey] = useState<string>('');
  const [nextStepLoading, setNextStepLoading] = useState<Record<string, boolean>>({});
  const [nextStepModalOpen, setNextStepModalOpen] = useState(false);
  const [nextStepModalData, setNextStepModalData] = useState<any>(null);
  const [nextStepModalMetricKey, setNextStepModalMetricKey] = useState<string>('');




  const handleTTSClick = (chartKey: string, chartLabel: string) => {
    // Set loading to true for this specific chart
    setTtsLoadingMap((prev: Record<string, boolean>) => ({
      ...prev,
      [chartKey]: true,
    }));

    createIndividualMetricTTS(
      chartKey,            // metricKey
      currentTab, // activeTab or page title
      storagePrefix, // Pass storagePrefix for correct summary key lookup
      (loading: boolean) =>
        setTtsLoadingMap((prev: Record<string, boolean>) => ({
          ...prev,
          [chartKey]: loading,
        })),
      (speaking: boolean) =>
        setIsSpeakingMap((prev: Record<string, boolean>) => ({
          ...prev,
          [chartKey]: speaking,
        }))
    );
  };

  const handleStopTTS = (chartKey: string) => {
    stopCurrentTTS((speaking: boolean) =>
      setIsSpeakingMap((prev: Record<string, boolean>) => ({
        ...prev,
        [chartKey]: speaking,
      }))
    );
  };


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

  // These functions now correctly use the state setters
  const handleChartTypeChangeInternal = (key: string, type: string) => {
    setChartTypes(prev => ({ ...prev, [key]: type }));
    onChartTypeChange(key, type); // Also call the prop function
  };

  const handleChartColorChangeInternal = (key: string, color: string) => {
    setChartColors(prev => ({ ...prev, [key]: color }));
    onChartColorChange(key, color); // Also call the prop function
  };

  const handleNextStepAnalysis = async (chartKey: string, chartLabel: string) => {
    setNextStepLoading(prev => ({ ...prev, [chartKey]: true }));

    try {
      const chartType = chartTypes[chartKey] || charts[chartKey]?.plotType || "line";

      // Use the new next step analysis method
      const result = await PredictiveAnalysis.getNextStepAnalysisSimple(
        chartKey,
        tenantId,
        chartType
      ) as any;

      if (result && result.status === "success") {
        // Open modal with next step data - pass the entire result
        setNextStepModalData(result);
        setNextStepModalMetricKey(chartKey);
        setNextStepModalOpen(true);

        toast.success(`Next step analysis completed for ${chartLabel}`);
      } else {
        // Handle error cases
        const errorMessage = result?.message || result?.error || 'Failed to generate next step analysis';
        toast.error(errorMessage);
        console.error('Next step analysis failed:', result);
      }

    } catch (error) {
      console.error('Next step analysis failed:', error);
      toast.error(`Next step analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setNextStepLoading(prev => ({ ...prev, [chartKey]: false }));
    }
  };

  // 4. Add close modal function (add this after handleClosePredictiveModal)
  const handleCloseNextStepModal = () => {
    setNextStepModalOpen(false);
    setNextStepModalData(null);
    setNextStepModalMetricKey('');
  };

  // Update the handlePredictiveAnalysis function - replace the existing function with this:
  const handlePredictiveAnalysis = async (chartKey: string, chartLabel: string) => {

    setPredictiveLoading(prev => ({ ...prev, [chartKey]: true }));

    try {
      // Debug storage to see what's available
      PredictiveAnalysis.debugStorage();

      const chartType = chartTypes[chartKey] || charts[chartKey]?.plotType || "line";


      // Use the updated getPredictiveData method
      const result = await PredictiveAnalysis.getPredictiveData(
        chartKey,
        currentTab,
        tenantId,
        chartType,
        true // use cache
      ) as any;

      if (result) {
        // Handle the new data structure: {prediction_result: {...}, popup: {...}}
        const chartData = result.prediction_result || result.chart_data || result;
        const popupData = result.popup;

        // Check if this is successful prediction data
        if (chartData && (chartData.status === "success" || chartData.x && chartData.y)) {

          // Merge popup data into chart data for the modal
          const modalData = {
            ...chartData,
            popup: popupData
          };

          // Open modal with prediction data
          setPredictiveModalData(modalData);
          setPredictiveModalMetricKey(chartKey);
          setPredictiveModalOpen(true);

          // Display success message
          const predictionMetadata = chartData._prediction_metadata || chartData.prediction_metadata || result.predictionmetadata;
          if (predictionMetadata) {
            PredictiveAnalysis.displayPredictionResults({
              status: "success",
              trend: predictionMetadata.trend,
              confidence: predictionMetadata.confidence,
              predictions: predictionMetadata.predictions || [],
              key_insight: predictionMetadata.key_insight,
              analysis_type: predictionMetadata.analysis_type,
              metric_key: chartKey
            });
          } else {
            toast.success(`Predictive analysis completed for ${chartLabel}`);
          }

        } else if (result.status) {
          console.warn(`Prediction status: ${result.status}`, result.key_insight);
          PredictiveAnalysis.displayPredictionResults(result);
        } else {
          console.error('Invalid prediction result structure:', result);
          toast.error('Invalid prediction data received');
        }
      } else {
        console.error('No prediction result returned');
        toast.error('Failed to generate predictions. Check console for details.');
      }

    } catch (error) {
      console.error('Prediction failed:', error);
      toast.error(`Prediction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setPredictiveLoading(prev => ({ ...prev, [chartKey]: false }));
    }
  };

  // Add this helper function to close the modal
  const handleClosePredictiveModal = () => {
    setPredictiveModalOpen(false);
    setPredictiveModalData(null);
    setPredictiveModalMetricKey('');
  };

  const currentTab = activeTab || Object.keys(dynamicMetricGroups)[0];
  const metrics = dynamicMetricGroups[currentTab] || [];

  // Define the modebar buttons explicitly to control grouping
  const customModeBarButtons = [
    ['toImage'], // Download button in its own group
    ['zoom2d'],  // Zoom button in its own group
    ['pan2d'],   // Pan button in its own group
    ['resetScale2d'] // Reset axes button in its own group
  ];

  const wrapText = (text: string, maxLineLength: number = 60): string => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      if ((currentLine + ' ' + word).length <= maxLineLength) {
        currentLine = currentLine ? currentLine + ' ' + word : word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });

    if (currentLine) lines.push(currentLine);
    return lines.join('<br>');
  };

  // Get Plotly layout and config based on theme

  const getPlotlyLayoutAndConfig = (chart: ChartData) => {
    const baseLayout = {
      width: undefined,
      height: 240, // Reduced height from 280 to 240
      autosize: true,
      title: '',
      font: {
        family: 'Inter, sans-serif',
        size: 16,
      },
      margin: chart.summary ?
        { l: 50, r: 30, t: 60, b: 75 } : // Reduced from 100 to 80
        { l: 50, r: 30, t: 60, b: 50 },
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
      annotations: chart.summary ? [{
        text: `💡 ${wrapText(chart.summary, 100)}`,
        showarrow: false,
        x: 0.5,
        y: -0.40, // Changed from -0.35 to -0.25 to bring it closer
        xref: 'paper',
        yref: 'paper',
        xanchor: 'center',
        yanchor: 'top',
        font: {
          size: 13, // Reduced from 14 to 12
          color: isDarkTheme ? '#e5e7eb' : '#1f2937',
          family: 'Inter, sans-serif'
        },
        width: 800, // Add width constraint for wrapping
        bgcolor: isDarkTheme ? 'rgba(55, 65, 81, 0.8)' : 'rgba(255, 255, 255, 0.8)',

      }] : [],
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
          modeBarButtons: customModeBarButtons, // Use the custom defined buttons
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
          modeBarButtons: customModeBarButtons, // Use the custom defined buttons
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
    <div className="relative min-h-screen w-full"> {/* Removed max-w-[1500px] mx-auto px-6 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-2 w-full">
        {dynamicKpiKeys.map((kpi, idx) => {
          const chart = charts[kpi.key];
          const kpiValue = chart?.y?.at(-1);

          // Get dynamic background color based on KPI name and value
          const dynamicBgColor = kpiValue !== undefined
            ? getKpiBgColor(kpi.key, kpiValue, kpi.bgColor || '#FFFFFF')
            : '#FFFFFF';

          // Get additional color info for stroke color
          const colorInfo = getKpiColorInfo(kpi.key, kpiValue);
          const strokeColor = colorInfo?.strokeColor;
          const shouldShowStroke = strokeColor && strokeColor !== '';

          // Check if we're using dynamic colors or default colors
          const isUsingDynamicColor = dynamicBgColor !== (kpi.bgColor || '#FFFFF');

          let textColor: string | undefined;

          if (dynamicBgColor.toLowerCase() === '#fff' || dynamicBgColor.toLowerCase() === 'white') {
            textColor = '#000000'; // force black
          } else if (isUsingDynamicColor) {
            textColor = getContrastTextColor(dynamicBgColor);
          }

          const icons = [BarChart2, LineChart];
          const Icon = icons[idx % icons.length];

          return (
            <ShadcnTooltip key={idx}>
              <TooltipTrigger asChild>
                <Card
                  style={{
                    backgroundColor: dynamicBgColor,
                    border: shouldShowStroke ? `2px solid ${strokeColor}` : 'none'
                  }}
                  className={"rounded-xl shadow-md transition-transform hover:scale-105 hover:shadow-lg p-0 overflow-hidden group min-h-[90px]"}
                >
                  <CardContent className="flex flex-col items-center justify-center py-3 px-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={cn("text-xs font-medium",
                          // Use original Tailwind classes when not using dynamic colors
                          !isUsingDynamicColor && theme === 'dark' && "text-black"
                        )}
                        style={{
                          fontSize: "0.90rem",
                          // Only use inline color when we have dynamic colors
                          ...(isUsingDynamicColor && { color: textColor })
                        }}
                      >
                        {kpi.key}
                      </span>
                      {idx % 2 === 0 ? (
                        <BarChart2
                          className={cn("w-4 h-4 text-primary", theme === 'dark' ? "text-black" : "text-primary")}
                        />
                      ) : (
                        <LineChart
                          className={cn("w-4 h-4 text-primary", theme === 'dark' ? "text-black" : "text-primary")}
                        />
                      )}
                    </div>
                    <span className="flex flex-col items-center justify-center min-h-[1.5rem]">
                      {kpiValue !== undefined && kpiValue !== null ? (
                        <span
                          className={cn("text-lg font-bold text-foreground transition-colors",
                            theme === 'dark' && "text-black"
                          )}
                          style={{
                            ...(isUsingDynamicColor && { color: textColor })
                          }}
                        >
                          {(typeof kpiValue === 'number' || typeof kpiValue === 'string') ? kpiValue.toLocaleString() : String(kpiValue)}
                        </span>
                      ) : (
                        <span className="flex flex-col items-center justify-center">
                          <Icon
                            className={cn("w-7 h-7 mb-0.5",
                              theme === 'dark' ? "text-black" : "text-muted-foreground"
                            )}
                            style={{
                              ...(isUsingDynamicColor && { color: textColor })
                            }}
                          />
                          <span
                            className={cn("text-[10px] mt-0.5 font-medium",
                              theme === 'dark' ? "text-black" : "text-muted-foreground"
                            )}
                            style={{
                              ...(isUsingDynamicColor && { color: textColor })
                            }}
                          >
                            No data
                          </span>
                        </span>
                      )}
                    </span>
                    <span
                      className={`text-[11px] mt-0.5 font-semibold ${chart?.delta > 0 ? "text-green-600" :
                        chart?.delta < 0 ? "text-red-500" :
                          "text-muted-foreground"
                        }`}
                      style={{
                        // Only override for neutral delta when using dynamic colors
                        ...((chart?.delta === undefined || chart?.delta === null || chart?.delta === 0) && isUsingDynamicColor && { color: textColor })
                      }}
                    >
                      {chart?.delta === undefined || chart?.delta === null
                        ? ""
                        : chart.delta === 0
                          ? "0%"
                          : `${chart.delta > 0 ? "+" : ""}${chart.delta}%`}
                    </span>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                {colorInfo ? (
                  <>
                    <p className="font-semibold">{colorInfo.label}</p>
                    {colorInfo.range && <p className="text-xs text-muted-foreground">Range: {colorInfo.range}</p>}
                    {colorInfo.value && <p className="text-xs text-muted-foreground">Value: {colorInfo.value}</p>}
                  </>
                ) : (
                  <p>No KPI information available</p>
                )}
              </TooltipContent>
            </ShadcnTooltip>
          );
        })}
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChangeWithLog} className="space-y-4 w-full mt-4">
        {/* Conditionally render TabsList */}
        {hideTabsList ? null : (
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
                {tab.replace(/_/g, ' ')}
              </TabsTrigger>
            ))}
          </TabsList>
        )}

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

            return (<>
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

                        // Retrieve summary text for the current metric
                        const summaryStorageKey = `${storagePrefix}_parsed_summary_${currentTab}`;
                        const cachedSummary = typeof window !== 'undefined' ? localStorage.getItem(summaryStorageKey) : null;
                        const parsedSummary = cachedSummary ? JSON.parse(cachedSummary) : {};
                        const graphSummaryText = parsedSummary[metric.key]?.summary || "No summary present.";

                        return (
                          <Draggable key={metric.key} draggableId={metric.key} index={idx}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={stretchClass}
                              >
                                <Card className="rounded-2xl shadow-lg p-2 sm:p-3 relative bg-card transition-shadow hover:shadow-2xl overflow-hidden animate-fade-in">
                                  <CardContent className="flex flex-col h-full p-0">
                                    <div
                                      className="flex justify-between items-center mb-0 pb-1 border-b border-gray-100 px-2 pt-2 cursor-move"
                                      {...provided.dragHandleProps} // <-- Only header is the drag handle now!
                                    >
                                      <h3 className="text-base font-semibold text-foreground">{metric.label}</h3>
                                      <div className="flex items-center gap-2">

                                        {chart && (
                                          <>
                                            {/* TTS/Avatar Button with Loading Spinner */}
                                            <ShadcnTooltip>
                                              <TooltipTrigger asChild>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className={cn("h-8 w-8 rounded-full hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed", iconColorClass)}
                                                  onClick={() => isSpeakingMap[metric.key] ? handleStopTTS(metric.key) : handleTTSClick(metric.key, metric.label)}
                                                  disabled={ttsLoadingMap[metric.key]}
                                                >
                                                  {ttsLoadingMap[metric.key] ? (
                                                    <ClipLoader size={16} color="currentColor" />
                                                  ) : isSpeakingMap[metric.key] ? (
                                                    <CircleStop className={cn("h-4 w-4", theme === 'dark' ? 'text-red-400' : 'text-red-500')} />
                                                  ) : (
                                                    <Speech className={cn("h-4 w-4", theme === 'dark' ? 'text-white' : 'text-primary')} />
                                                  )}
                                                  <span className="sr-only">
                                                    {isSpeakingMap[metric.key] ? 'Stop Voice' : 'Voice Summary'}
                                                  </span>
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>
                                                  {ttsLoadingMap[metric.key]
                                                    ? 'Generating voice...'
                                                    : isSpeakingMap[metric.key]
                                                      ? 'Stop voice'
                                                      : 'Voice Summary'
                                                  }
                                                </p>
                                              </TooltipContent>
                                            </ShadcnTooltip>
                                            <ShadcnTooltip>
                                              <TooltipTrigger asChild>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className={cn(
                                                    "h-8 w-8 rounded-full hover:bg-muted transition-colors",
                                                    iconColorClass
                                                  )}
                                                  onClick={() => handlePredictiveAnalysis(metric.key, metric.label)}
                                                  disabled={predictiveLoading[metric.key]}
                                                >
                                                  {predictiveLoading[metric.key] ? (
                                                    <ClipLoader size={16} color="currentColor" />
                                                  ) : (
                                                    <TrendingUp className={cn(
                                                      "h-4 w-4",
                                                      theme === 'dark' ? 'text-white' : 'text-primary'
                                                    )} />
                                                  )}
                                                  <span className="sr-only">Predictive Analysis</span>
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>
                                                  {predictiveLoading[metric.key]
                                                    ? 'Generating predictions...'
                                                    : 'Predictive Analysis'
                                                  }
                                                </p>
                                              </TooltipContent>
                                            </ShadcnTooltip>
                                            <ShadcnTooltip>
                                              <TooltipTrigger asChild>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className={cn(
                                                    "h-8 w-8 rounded-full hover:bg-muted transition-colors",
                                                    iconColorClass
                                                  )}
                                                  onClick={() => handleNextStepAnalysis(metric.key, metric.label)}
                                                  disabled={nextStepLoading[metric.key]}
                                                >
                                                  {nextStepLoading[metric.key] ? (
                                                    <ClipLoader size={16} color="currentColor" />
                                                  ) : (
                                                    <Lightbulb className={cn(
                                                      "h-4 w-4",
                                                      theme === 'dark' ? 'text-white' : 'text-primary'
                                                    )} />
                                                  )}
                                                  <span className="sr-only">Next Step</span>
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>
                                                  {nextStepLoading[metric.key]
                                                    ? 'Generating next steps...'
                                                    : 'Next Step Analysis'
                                                  }
                                                </p>
                                              </TooltipContent>
                                            </ShadcnTooltip>

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
                                                    onClick={() => handleChartTypeChangeInternal(metric.key, 'bar')}
                                                    title="Bar Chart"
                                                  >
                                                    <BarChart2 className="w-5 h-5" />
                                                  </Button>
                                                  <Button
                                                    variant={((chartTypes[metric.key] || chart.plotType) === 'line') ? 'secondary' : 'ghost'}
                                                    size="icon"
                                                    onClick={() => handleChartTypeChangeInternal(metric.key, 'line')}
                                                    title="Line Chart"
                                                  >
                                                    <LineChart className="w-5 h-5" />
                                                  </Button>
                                                  <Button
                                                    variant={((chartTypes[metric.key] || chart.plotType) === 'scatter') ? 'secondary' : 'ghost'}
                                                    size="icon"
                                                    onClick={() => handleChartTypeChangeInternal(metric.key, 'scatter')}
                                                    title="Scatter Plot"
                                                  >
                                                    <ScatterChart className="w-5 h-5" />
                                                  </Button>
                                                  <input
                                                    type="color"
                                                    className="w-8 h-8 p-0 border-none bg-transparent cursor-pointer ml-2"
                                                    value={chartColors[metric.key] || chart.marker?.color || primaryColorForCharts}
                                                    onChange={e => handleChartColorChangeInternal(metric.key, e.target.value)}
                                                    title="Pick graph color"
                                                  />
                                                </div>
                                              </PopoverContent>
                                            </Popover>
                                          </>
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
                                    <div className="flex-1 w-full h-full" style={{ minHeight: 280, overflow: 'hidden' }}>
                                      <GraphCardContent
                                        chart={chart}
                                        isLoading={loading}
                                        isDarkTheme={isDarkTheme}
                                        chartType={chartTypes[metric.key] || chart?.plotType || 'bar'}
                                        chartColor={chartColors[metric.key] || chart?.marker?.color || primaryColorForCharts}
                                        primaryColorForCharts={primaryColorForCharts}
                                        colors={COLORS}
                                        getPlotlyLayoutAndConfig={getPlotlyLayoutAndConfig}
                                      />

                                      {/* Voice Visualizer - Now shows for any chart when speaking */}
                                      {isSpeakingMap[metric.key] && (
                                        <div className="fixed bottom-4 left-4 z-[9999] bg-[rgb(229_242_253)] rounded-full shadow-xl p-2">
                                          <CompactVoiceVisualizer isSpeaking={isSpeakingMap[metric.key]} />
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
              <PredictiveModal
                isOpen={predictiveModalOpen}
                onClose={handleClosePredictiveModal}
                chartData={predictiveModalData}
                metricKey={predictiveModalMetricKey}
                chartType={predictiveModalData ? (chartTypes[predictiveModalMetricKey] || predictiveModalData.plotType) : undefined}
                chartColor={predictiveModalData ? (chartColors[predictiveModalMetricKey] || predictiveModalData.marker?.color) : undefined}
              />

              <NextStepModal
                isOpen={nextStepModalOpen}
                onClose={handleCloseNextStepModal}
                nextStepData={nextStepModalData}
                metricKey={nextStepModalMetricKey}
              />
            </>
            );
          })()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedDashboardLayout;