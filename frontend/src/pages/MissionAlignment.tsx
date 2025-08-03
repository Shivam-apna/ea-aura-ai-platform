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

import config from "@/config/mission_dashboard.json";
// Configurable metric layout
const KPI_KEYS = config.kpi_keys;
const METRIC_GROUPS = config.metric_groups;;
import { BarChart2, LineChart, ScatterChart, Settings2, X, Eye, EyeOff, Filter } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Input } from "@/components/ui/input";
import ClipLoader from "react-spinners/ClipLoader";
import { toast } from "sonner";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
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

const LOCAL_STORAGE_KEY = "mission_alignment_charts_cache";
const KPI_KEYS_STORAGE_KEY = "mission_alignment_kpi_keys_cache";
const METRIC_GROUPS_STORAGE_KEY = "mission_alignment_metric_groups_cache";

const MissionAlignment = () => {
  const [modebarOptions, setModebarOptions] = useState<Record<string, typeof DEFAULT_MODEBAR>>({});
  const [input, setInput] = useState(""); // Keep input state for caching purposes
  const [charts, setCharts] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [chartTypes, setChartTypes] = useState<Record<string, string>>({});
  const [chartColors, setChartColors] = useState<Record<string, string>>({});
  const [dynamicMetricGroups, setDynamicMetricGroups] = useState<MetricGroups>(METRIC_GROUPS);
  const [dynamicKpiKeys, setDynamicKpiKeys] = useState<KpiItem[]>(KPI_KEYS);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Refs for PDF generation
  const kpiSectionRef = useRef<HTMLDivElement>(null);
  const chartsSectionRef = useRef<HTMLDivElement>(null);

  // Restore input, charts, and dynamic keys from cache on mount
  useEffect(() => {
    // Restore charts and input
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      const { input: cachedInput, charts: cachedCharts } = JSON.parse(cached);
      if (cachedInput) setInput(cachedInput);
      if (cachedCharts) setCharts(cachedCharts);
    }

    // Restore KPI keys
    const cachedKpiKeys = localStorage.getItem(KPI_KEYS_STORAGE_KEY);
    if (cachedKpiKeys) {
      try {
        const parsedKpiKeys = JSON.parse(cachedKpiKeys);
        setDynamicKpiKeys(parsedKpiKeys);
      } catch (error) {
        console.error("Error parsing cached KPI keys:", error);
      }
    }

    // Restore metric groups
    const cachedMetricGroups = localStorage.getItem(METRIC_GROUPS_STORAGE_KEY);
    if (cachedMetricGroups) {
      try {
        const parsedMetricGroups = JSON.parse(cachedMetricGroups);
        setDynamicMetricGroups(parsedMetricGroups);
      } catch (error) {
        console.error("Error parsing cached metric groups:", error);
      }
    }
  }, []);

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
    console.log("API Response Keys:", apiResponseKeys);
    console.log("Original KPI Keys:", KPI_KEYS.map(k => k.key));
    console.log("Original Metric Keys:", Object.values(METRIC_GROUPS).flat().map(m => m.key));

    // Create mapping for KPI keys
    const kpiKeyMapping = createKeyMapping(apiResponseKeys, KPI_KEYS);
    console.log("KPI Key Mapping:", kpiKeyMapping);

    // Create mapping for metric keys (collect all metrics from all groups)
    const allMetrics = Object.values(METRIC_GROUPS).flat();
    const metricKeyMapping = createKeyMapping(apiResponseKeys, allMetrics);
    console.log("Metric Key Mapping:", metricKeyMapping);

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

    console.log("Updated KPI Keys:", updatedKpiKeys);
    console.log("Updated Metric Groups:", updatedMetricGroups);

    // Save updated keys to localStorage
    localStorage.setItem(KPI_KEYS_STORAGE_KEY, JSON.stringify(updatedKpiKeys));
    localStorage.setItem(METRIC_GROUPS_STORAGE_KEY, JSON.stringify(updatedMetricGroups));

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

  const handleDownloadPDF = async () => {
    if (!kpiSectionRef.current && !chartsSectionRef.current) {
      toast.error("No data available to generate PDF");
      return;
    }

    try {
      setDownloadingPdf(true);
      toast.info("Generating PDF... This may take a moment");

      await generatePDF(kpiSectionRef, chartsSectionRef, "Mission Alignment", "mission_parsed_summary");


      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const fetchData = async (prompt: string) => { // Modified to accept prompt as argument
    setLoading(true);
    try {
      const res = await fetch(getApiEndpoint("/v1/run-autogen"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: prompt, tenant_id: "demo232" }), // Use the prompt from the argument
      });

      const data = await res.json();
      if (data.parent_agent !== "mission_alignment_agent") {
        toast.error("Invalid Query: Ask query related to mission alignment.");
        setLoading(false);
        return;
      }
      const parsed = data.sub_agent_response;
      console.log("parsed response:", parsed);

      localStorage.setItem("mission_parsed_summary", JSON.stringify(parsed));

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
      // Save charts and input to localStorage (keeping existing functionality)
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ input: prompt, charts: chartMap })); // Save the submitted prompt
      toast.success("Mission alignment dashboard generated successfully!");
    } catch (err) {
      console.error("Error fetching charts:", err);
    } finally {
      setLoading(false);
    }
  };

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
        placeholder="Ask about mission alignment, goals, or any metric..."
        onSubmit={fetchData}
        onLoadingChange={setLoading}
        className="mb-2"
      />

      {/* Page Header Actions Row - Updated with PDF props */}
      <PageHeaderActions
        title="Mission Alignment"
        className="mb-2"
        onDownloadPDF={handleDownloadPDF}
        downloadingPdf={downloadingPdf}
        hasChartsData={Object.keys(charts).length > 0}
      />

      {/* Advanced Dashboard Layout Component with Refs */}
      <div ref={kpiSectionRef}>
        <AdvancedDashboardLayout
          charts={charts}
          dynamicKpiKeys={dynamicKpiKeys}
          dynamicMetricGroups={dynamicMetricGroups}
          storagePrefix="mission_alignment"
          onChartClose={handleCloseChart}
          onRestoreCharts={handleRestoreCharts}
          onChartTypeChange={handleChartTypeChange}
          onChartColorChange={handleChartColorChange}
          chartTypes={chartTypes}
          chartColors={chartColors}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default MissionAlignment;