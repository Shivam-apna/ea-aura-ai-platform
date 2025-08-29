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

import config from "@/config/business_dashboard.json";
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
import { useDashboardRefresh } from "@/contexts/DashboardRefreshContext"; // Import useDashboardRefresh
import { useAuth } from "@/contexts/AuthContext";
import { createTTS } from "@/utils/avatars";

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

const getTabSpecificStorageKey = (baseKey: string, tab: string) => `${baseKey}_${tab}`;

// Update storage key functions
const LOCAL_STORAGE_KEY = (tab: string) => getTabSpecificStorageKey("business_charts_cache", tab);
const KPI_KEYS_STORAGE_KEY = (tab: string) => getTabSpecificStorageKey("business_kpi_keys_cache", tab);
const METRIC_GROUPS_STORAGE_KEY = (tab: string) => getTabSpecificStorageKey("business_metric_groups_cache", tab);
const LAST_PROMPT_STORAGE_KEY = (tab: string) => getTabSpecificStorageKey("business_last_prompt", tab);

// Define the specific prompt for Business Vitality
const BUSINESS_PROMPT = "What are the GMROI, Net Profit Margin, COGS, Gross Profit Margin, Net Sales and Conversion Rate of AIM Elevate?";


const BusinessDashboard = () => {
  const { registerRefreshHandler } = useDashboardRefresh(); // Use the hook
  const [modebarOptions, setModebarOptions] = useState<Record<string, typeof DEFAULT_MODEBAR>>({});
  const [input, setInput] = useState(""); // Keep input state for caching purposes
  const [lastSubmittedPrompt, setLastSubmittedPrompt] = useState<string>(""); // New state for last submitted prompt
  const [charts, setCharts] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [chartTypes, setChartTypes] = useState<Record<string, string>>({});
  const [chartColors, setChartColors] = useState<Record<string, string>>({});
  const [dynamicMetricGroups, setDynamicMetricGroups] = useState<MetricGroups>(METRIC_GROUPS);
  const [dynamicKpiKeys, setDynamicKpiKeys] = useState<KpiItem[]>(KPI_KEYS);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const TAB_NAMES = Object.keys(METRIC_GROUPS);
  const [activeTab, setActiveTab] = useState(TAB_NAMES[0]);
  const { user } = useAuth();
  // Refs for PDF generation
  const kpiSectionRef = useRef<HTMLDivElement>(null);
  const chartsSectionRef = useRef<HTMLDivElement>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsLoading, setTtsLoading] = useState(false);

  // Add AbortController ref for canceling requests
  const abortControllerRef = useRef<AbortController | null>(null);

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

    // Restore last submitted prompt
    const cachedLastPrompt = localStorage.getItem(LAST_PROMPT_STORAGE_KEY(activeTab));
    if (cachedLastPrompt) {
      setLastSubmittedPrompt(cachedLastPrompt);
    } else {
      setLastSubmittedPrompt("");
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

  // Function to stop the current process
  const handleStopProcess = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setLoading(false);
      toast.info("Process stopped successfully");
    }
  };

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
        "Business Vitality",
        "business_parsed_summary",
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

  const fetchData = async (prompt: string) => { // Modified to accept prompt as argument
    setLoading(true);

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    try {

      // Extract organization id from user object
      let tenantId = "demo232";
      if (user && user.organization && typeof user.organization === "object") {
        // Get the first org id if present
        const orgKeys = Object.keys(user.organization);
        if (orgKeys.length > 0 && user.organization[orgKeys[0]]?.id) {
          tenantId = user.organization[orgKeys[0]].id;
        }
      }
      const res = await fetch(getApiEndpoint("/v1/run-autogen"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: prompt, tenant_id: "demo123" }), // Use the prompt from the argument
        signal: abortControllerRef.current.signal, // Add abort signal
      });

      // Handle different HTTP status codes with user-friendly messages
      if (!res.ok) {
        let errorMessage = 'An error occurred while processing your request.';

        switch (res.status) {
          case 400:
            errorMessage = 'Invalid request. Please check your input and try again.';
            break;
          case 401:
            errorMessage = 'Authentication required. Please log in again.';
            break;
          case 403:
            errorMessage = 'Access denied. You do not have permission to perform this action.';
            break;
          case 404:
            errorMessage = 'The requested service is not available. Please try again later.';
            break;
          case 429:
            errorMessage = 'Too many requests. Please wait a moment and try again.';
            break;
          case 500:
            errorMessage = 'Server error. Our team has been notified. Please try again later.';
            break;
          case 502:
            errorMessage = 'Service temporarily unavailable. Please try again in a few minutes.';
            break;
          case 503:
            errorMessage = 'Service is currently under maintenance. Please try again later.';
            break;
          case 429:
            errorMessage = 'Token limit exceeded.';
            break;
          default:
            errorMessage = `Request failed with status ${res.status}. Please try again.`;
        }

        // Try to get more specific error message from response
        try {
          const errorData = await res.json();
          if (errorData.error || errorData.message) {
            errorMessage = errorData.error || errorData.message;
          }
        } catch (parseError) {
          // If we can't parse the error response, use the default message
          console.warn('Could not parse error response:', parseError);
        }

        toast.error(errorMessage);
        console.error(`API Error ${res.status}:`, errorMessage);
        return;
      }

      const data = await res.json();

      // Check for GeneralAgent response first
      if (data.selected_agent === "GeneralAgent") {
        // Show toast with GeneralAgent response for 10 seconds with close button
        toast(
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="font-semibold text-blue-600 mb-2">EA-AURA Assistant</div>
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {data.response}
              </div>
            </div>
            <button
              onClick={() => toast.dismiss()}
              className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>,
          {
            duration: 9000,
            style: {
              maxWidth: '600px',
              padding: '16px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            },
            className: 'custom-toast',
          }
        );
        setLoading(false);
        return;
      }


      if (data.parent_agent !== "business_vitality_agent") {
        toast("Invalid Query: Ask a query related to business.");
        setLoading(false);
        return;
      }
      const parsed = data.sub_agent_response;
      // console.log("parsed response:", parsed);

      // Save tab-specific summary
      const summaryKey = `business_parsed_summary_${activeTab}`;
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
        const { plot_type, data: values, value, delta, summary } = parsed[key] || {};
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
          summary: summary || "",
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
      setLastSubmittedPrompt(prompt); // Store the prompt that was successfully submitted
      localStorage.setItem(LAST_PROMPT_STORAGE_KEY(activeTab), prompt); // Persist last prompt
    } catch (err: any) {
      // Handle abort error gracefully
      if (err.name === 'AbortError') {
        console.log('Request was aborted');
        return; // Don't show error toast for user-initiated abort
      }

      console.error("Error fetching charts:", err);

      // Handle network errors and other exceptions
      let errorMessage = 'An unexpected error occurred. Please try again.';

      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
      abortControllerRef.current = null; // Clean up
    }
  };

  // Register the refresh handler when the component mounts or activeTab/lastSubmittedPrompt changes
  useEffect(() => {
    registerRefreshHandler(fetchData, lastSubmittedPrompt);
  }, [fetchData, lastSubmittedPrompt, activeTab, registerRefreshHandler]);

  const handleCreateTTS = () => createTTS(activeTab, "Business Vitality", "business_parsed_summary", setTtsLoading, setIsSpeaking);

  return (
    <div className="relative min-h-screen">
      {/* Loader Overlay */}
      {loading && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-white/30 backdrop-blur">
          <div className="flex flex-col items-center gap-4">
            <GraphLoader />
            <span className="text-lg font-semibold text-blue-600 animate-pulse">Generating your dashboard...</span>
            <Button
              onClick={handleStopProcess}
              variant="ghost"
              size="sm"
              className="mt-2 flex items-center gap-2 bg-[rgb(59,130,246)] hover:bg-[rgb(233,73,73)] text-white hover:text-white"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Common wrapper for prompt bar */}
      <div className="w-full max-w-[1500px] mx-auto px-6">
        {/* Prompt Section - using PagePromptBar */}
        <PagePromptBar
          placeholder="Ask about business, sales, or any metric..."
          onSubmit={fetchData}
          onLoadingChange={setLoading}
          className="mt-4 mb-2"
          initialPrompt={BUSINESS_PROMPT} // Pass the specific prompt
          storageKeyForInput="business_vitality_prompt_input" // Unique storage key
          pageId="business_vitality_page" // Unique page ID for caching
        />
      </div>

      {/* Page Header Actions Row - Updated with PDF props */}
      <PageHeaderActions
        title="Business Vitality"
        className="mb-2"
        onDownloadPDF={handleDownloadPDF}
        downloadingPdf={downloadingPdf}
        hasChartsData={Object.keys(charts).length > 0}
        onCreateTTS={handleCreateTTS}
        ttsLoading={ttsLoading}
        isSpeaking={isSpeaking}
        setIsSpeaking={setIsSpeaking}
      />

      {/* Common wrapper for dashboard layout */}
      <div className="w-full max-w-[1500px] mx-auto px-6">
        {/* Advanced Dashboard Layout Component with Refs */}
        <div ref={kpiSectionRef}>
          <AdvancedDashboardLayout
            charts={charts}
            dynamicKpiKeys={dynamicKpiKeys}
            dynamicMetricGroups={dynamicMetricGroups}
            storagePrefix="business_vitality"
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
    </div>
  );
};

export default BusinessDashboard;