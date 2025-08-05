"use client";

import React, { useState, useEffect, useRef } from "react";
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
import { cn } from "@/lib/utils";

import config from "@/config/overview_dashboard.json";
// Configurable metric layout
const KPI_KEYS = config.kpi_keys;
const METRIC_GROUPS = config.metric_groups;;
import { BarChart2, LineChart, ScatterChart, Settings2, X } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Input } from "@/components/ui/input";
import ClipLoader from "react-spinners/ClipLoader";
import { toast } from "sonner";
import PagePromptBar from "@/components/PagePromptBar"; // Import PagePromptBar
import PageHeaderActions from "@/components/PageHeaderActions"; // Import PageHeaderActions
import { getApiEndpoint } from "@/config/environment";
import AdvancedDashboardLayout from "@/components/AdvancedDashboardLayout";
import { generatePDF } from "@/utils/generatePDF";

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

// Add props interface for Dashboard
interface DashboardProps {
  activeAgent: string;
  onSelectAgent: (agent: string) => void;
}

// HolographicCard Component - Adjusted for light background and subtle glassmorphism
export const HolographicCard = ({ children, className, ...props }: React.ComponentProps<typeof Card>) => {
  return (
    <Card
      className={cn(
        "relative overflow-hidden bg-card border border-border/50 shadow-neumorphic-light rounded-2xl", // Changed bg-neumorphic-background to bg-card
        "text-foreground", // Ensure text color is foreground
        className
      )}
      {...props}
    >
      {children}
    </Card>
  );
};

const NoDataGhost = () => (
  <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
    <ellipse cx="24" cy="30" rx="16" ry="10" fill="#e0e7ef" />
    <path d="M12 36V18a12 12 0 1 1 24 0v18c0 2-2 2-3 0s-3-2-4 0-3 2-4 0-3-2-4 0-3 2-3 0z" fill="#fff" />
    <circle cx="18" cy="24" r="2" fill="#a0aec0" />
    <circle cx="30" cy="24" r="2" fill="#a0aec0" />
    <ellipse cx="24" cy="28" rx="3" ry="1.5" fill="#cbd5e1" />
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

const getTabSpecificStorageKey = (baseKey, tab) => `${baseKey}_${tab}`;

// Update storage key functions
const LOCAL_STORAGE_KEY = (tab) => getTabSpecificStorageKey("dashboard_alignment_charts_cache", tab);
const KPI_KEYS_STORAGE_KEY = (tab) => getTabSpecificStorageKey("dashboard_alignment_kpi_keys_cache", tab);
const METRIC_GROUPS_STORAGE_KEY = (tab) => getTabSpecificStorageKey("dashboard_alignment_metric_groups_cache", tab);

const Dashboard: React.FC<DashboardProps> = ({ activeAgent, onSelectAgent }) => {
  const [modebarOptions, setModebarOptions] = useState<Record<string, typeof DEFAULT_MODEBAR>>({});
  const [input, setInput] = useState(""); // Keep input state for fetchData logic
  const [charts, setCharts] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [chartTypes, setChartTypes] = useState<Record<string, string>>({});
  const [chartColors, setChartColors] = useState<Record<string, string>>({});
  const [dynamicMetricGroups, setDynamicMetricGroups] = useState<MetricGroups>(METRIC_GROUPS);
  const [dynamicKpiKeys, setDynamicKpiKeys] = useState<KpiItem[]>(KPI_KEYS);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  // Add this near the top with other imports/constants
  const TAB_NAMES = Object.keys(METRIC_GROUPS); // ["Sales", "Marketing"]
  const [activeTab, setActiveTab] = useState(TAB_NAMES[0]); // Default to first tab ("Sales")

  // Refs for PDF generation
  const kpiSectionRef = useRef<HTMLDivElement>(null);
  const chartsSectionRef = useRef<HTMLDivElement>(null);

  // Restore input, charts, and dynamic keys from cache on mount
  useEffect(() => {
    // Restore charts and input for active tab
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY(activeTab));
    if (cached) {
      const { input: cachedInput, charts: cachedCharts } = JSON.parse(cached);
      if (cachedInput) setInput(cachedInput);
      if (cachedCharts) setCharts(cachedCharts);
    } else {
      // Clear charts if no cache for this tab
      setCharts({});
    }

    // Restore KPI keys for active tab
    const cachedKpiKeys = localStorage.getItem(KPI_KEYS_STORAGE_KEY(activeTab));
    if (cachedKpiKeys) {
      try {
        const parsedKpiKeys = JSON.parse(cachedKpiKeys);
        setDynamicKpiKeys(parsedKpiKeys);
      } catch (error) {
        console.error("Error parsing cached KPI keys:", error);
        setDynamicKpiKeys(KPI_KEYS); // Reset to default
      }
    } else {
      setDynamicKpiKeys(KPI_KEYS); // Reset to default
    }

    // Restore metric groups for active tab
    const cachedMetricGroups = localStorage.getItem(METRIC_GROUPS_STORAGE_KEY(activeTab));
    if (cachedMetricGroups) {
      try {
        const parsedMetricGroups = JSON.parse(cachedMetricGroups);
        setDynamicMetricGroups(parsedMetricGroups);
      } catch (error) {
        console.error("Error parsing cached metric groups:", error);
        setDynamicMetricGroups(METRIC_GROUPS); // Reset to default
      }
    } else {
      setDynamicMetricGroups(METRIC_GROUPS); // Reset to default
    }
  }, [activeTab]); // Add activeTab dependency


  // Function to create a mapping between config keys and actual API response keys
  const createKeyMapping = (apiResponseKeys: string[], configKeys: any[]) => {
    const mapping: { [key: string]: string } = {};

    configKeys.forEach(configItem => {
      const configKey = configItem.key;

      // Try exact match first
      if (apiResponseKeys.includes(configKey)) {
        mapping[configKey] = configKey;
        return;
      }

      // Try case-insensitive match
      const exactMatch = apiResponseKeys.find(apiKey =>
        apiKey.toLowerCase() === configKey.toLowerCase()
      );
      if (exactMatch) {
        mapping[configKey] = exactMatch;
        return;
      }

      // Try partial match (remove special characters and spaces)
      const normalizeKey = (key: string) => key.toLowerCase().replace(/[^a-z0-9]/g, '');
      const normalizedConfigKey = normalizeKey(configKey);

      const partialMatch = apiResponseKeys.find(apiKey =>
        normalizeKey(apiKey) === normalizedConfigKey ||
        normalizeKey(apiKey).includes(normalizedConfigKey) ||
        normalizedConfigKey.includes(normalizeKey(apiKey))
      );

      if (partialMatch) {
        mapping[configKey] = partialMatch;
        return;
      }

      // If no match found, keep the original key (will show no data)
      mapping[configKey] = configKey;
    });

    return mapping;
  };

  // Function to update metric groups and KPI keys based on API response
  const updateDynamicKeys = (apiResponseKeys: string[]) => {

    // Create mapping for KPI keys
    const kpiKeyMapping = createKeyMapping(apiResponseKeys, KPI_KEYS);

    // Create mapping for metric keys (collect all metrics from all groups)
    const allMetrics = Object.values(METRIC_GROUPS).flat();
    const metricKeyMapping = createKeyMapping(apiResponseKeys, allMetrics);

    // Update KPI keys with mapped values
    const updatedKpiKeys: KpiItem[] = KPI_KEYS.map(kpi => ({
      ...kpi,
      originalKey: kpi.key,
      key: kpiKeyMapping[kpi.key] || kpi.key
    }));

    // Update metric groups with mapped values
    const updatedMetricGroups: MetricGroups = {};
    Object.entries(METRIC_GROUPS).forEach(([groupName, metrics]) => {
      updatedMetricGroups[groupName] = metrics.map(metric => ({
        ...metric,
        originalKey: metric.key,
        key: metricKeyMapping[metric.key] || metric.key
      }));
    });


    // Save updated keys to localStorage
    localStorage.setItem(KPI_KEYS_STORAGE_KEY(activeTab), JSON.stringify(updatedKpiKeys));
    localStorage.setItem(METRIC_GROUPS_STORAGE_KEY(activeTab), JSON.stringify(updatedMetricGroups));

    setDynamicKpiKeys(updatedKpiKeys);
    setDynamicMetricGroups(updatedMetricGroups);
  };

  const handleCloseChart = (key: string) => {
    // This will be handled by the AdvancedDashboardLayout component
  };

  const handleRestoreCharts = () => {
    // This will be handled by the AdvancedDashboardLayout component
  };

  const handleChartTypeChange = (key: string, type: string) => {
    setChartTypes(prev => ({ ...prev, [key]: type }));
  };

  const handleChartColorChange = (key: string, color: string) => {
    setChartColors(prev => ({ ...prev, [key]: color }));
  };

  // Updated handleDownloadPDF to include activeTab
  const handleDownloadPDF = async () => {
    if (!kpiSectionRef.current && !chartsSectionRef.current) {
      toast.error("No data available to generate PDF");
      return;
    }

    try {
      setDownloadingPdf(true);
      toast.info(`Generating PDF for ${activeTab} tab... This may take a moment`);

      // Pass activeTab to generatePDF function
      await generatePDF(
        kpiSectionRef,
        chartsSectionRef,
        "Overview",
        "overview_parsed_summary",
        activeTab // Pass the active tab
      );

      toast.success(`PDF for ${activeTab} tab downloaded successfully!`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setDownloadingPdf(false);
    }
  };


  // Modified fetchData to accept prompt from PagePromptBar
  const handlePromptSubmit = async (prompt: string) => {
    setLoading(true);
    try {
      const res = await fetch(getApiEndpoint("/v1/run-autogen"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, tenant_id: "demo232" }),
      });

      const data = await res.json();
      // if (data.parent_agent !== "strategic_alignment_agent") {
      //   toast("Invalid Query: Ask query related to mission alignment.");
      //   setLoading(false);
      //   return;
      // }
      const parsed = data.sub_agent_response;
      console.log("parsed response:", parsed);



      const summaryKey = `overview_parsed_summary${activeTab}`;
      const existingSummary = localStorage.getItem(summaryKey);
      let mergedSummary = { ...(existingSummary ? JSON.parse(existingSummary) : {}) };

      // Merge new parsed response
      for (const key in parsed) {
        // Avoid overwriting response/task/columns/filters if needed
        if (!["response", "task", "columns", "filters"].includes(key)) {
          mergedSummary[key] = parsed[key];
        }
      }

      // Keep latest response/task/columns/filters if needed
      ["response", "task", "columns", "filters"].forEach((metaKey) => {
        if (parsed[metaKey]) {
          mergedSummary[metaKey] = parsed[metaKey];
        }
      });

      // Save merged summary
      localStorage.setItem(summaryKey, JSON.stringify(mergedSummary));


      // Get all available keys from API response
      const apiResponseKeys = Object.keys(parsed).filter(key =>
        !["response", "task", "columns", "filters"].includes(key)
      );

      // Update dynamic keys based on API response
      updateDynamicKeys(apiResponseKeys);

      const chartMap: Record<string, any> = {};

      for (const key of apiResponseKeys) {
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
            if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
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

      // Merge with previous charts
      setCharts(prevCharts => {
        const mergedCharts = { ...prevCharts, ...chartMap };

        // 🔑 Get all keys from the merged charts for updateDynamicKeys
        const mergedKeys = Object.keys(mergedCharts).filter(key =>
          !["response", "task", "columns", "filters"].includes(key)
        );

        // ✅ Update dynamic keys using all current keys
        updateDynamicKeys(mergedKeys);

        // Save to localStorage
        localStorage.setItem(
          LOCAL_STORAGE_KEY(activeTab),
          JSON.stringify({ input: prompt, charts: mergedCharts })
        );

        return mergedCharts;
      });
    } catch (err) {
      console.error("Error fetching charts:", err);
    } finally {
      setLoading(false);
    }
  };

  // Flatten all metrics from all groups for direct display
  const allMetrics = Object.values(dynamicMetricGroups).flat();

  return (
    <div className="p-6 relative min-h-screen">
      {/* Loader Overlay */}
      {loading && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/30 backdrop-blur">
          <div className="flex flex-col items-center gap-4">
            <GraphLoader />
            <span className="text-lg font-semibold text-blue-600 animate-pulse">Generating your dashboard...</span>
          </div>
        </div>
      )}
      {/* Prompt Section - using PagePromptBar */}
      <PagePromptBar
        placeholder="Ask about brand, index, or any metric..."
        onSubmit={handlePromptSubmit}
        onLoadingChange={setLoading}
        className="mb-2"
      />
      {/* Page Header Actions Row */}
      <PageHeaderActions title="Overview" className="mb-2"
        onDownloadPDF={handleDownloadPDF}
        downloadingPdf={downloadingPdf}
        hasChartsData={Object.keys(charts).length > 0} />

      {/* Advanced Dashboard Layout Component */}
      <div ref={kpiSectionRef}>
        <AdvancedDashboardLayout
          charts={charts}
          dynamicKpiKeys={dynamicKpiKeys}
          dynamicMetricGroups={dynamicMetricGroups}
          storagePrefix="dashboard"
          onChartClose={handleCloseChart}
          onRestoreCharts={handleRestoreCharts}
          onChartTypeChange={handleChartTypeChange}
          onChartColorChange={handleChartColorChange}
          chartTypes={chartTypes}
          chartColors={chartColors}
          loading={loading}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabNames={TAB_NAMES}
        />
      </div>
    </div>
  );
};

export default Dashboard;