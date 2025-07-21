import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import Plot from "react-plotly.js";
import { Info } from "lucide-react";
import { useKeycloak } from '@/components/Auth/KeycloakProvider';

const supportedTypes = ["line", "bar", "area", "scatter"];

interface PlotData {
  plot_type: string;
  columns: string[];
  data: Record<string, any>[];
  title: string;
}

const LOCAL_STORAGE_KEY = "business_vitality_cache";
  
  const BusinessVitality = () => {
  const [query, setQuery] = useState("");
  const [plotData, setPlotData] = useState<PlotData | null>(null);
  const [plotTypeOverride, setPlotTypeOverride] = useState<string | null>(null);
  const [finalResponse, setFinalResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { keycloak } = useKeycloak();
  const userToken = keycloak?.tokenParsed.organization.myorg.Tenant_id[0];
  console.log(userToken, "tst")
  // Load from localStorage on mount
  useEffect(() => {
    const cache = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cache) {
      const parsed = JSON.parse(cache);
      setPlotData(parsed.plotData);
      setFinalResponse(parsed.finalResponse);
    }
  }, []);

  const handleAsk = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:8081/api/v1/run-autogen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: query,
          tenant_id: userToken,
        }),
      });

      const result = await res.json();
      if (result?.sub_agent_response) {
        setPlotData(result.sub_agent_response);
        setFinalResponse(result.final_response || "No summary provided.");

        // Save to localStorage
        localStorage.setItem(
          LOCAL_STORAGE_KEY,
          JSON.stringify({
            plotData: result.sub_agent_response,
            finalResponse: result.final_response || "No summary provided.",
          })
        );
      } else {
        console.error("Unexpected response format:", result);
      }
    } catch (err) {
      console.error("Failed to fetch plot data:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderPlotFromData = (data: PlotData) => {
    const columns = data.columns;
    const x = data.data.map((d) => d[columns[0]]);
    const plotType = plotTypeOverride || data.plot_type;
    const baseType = plotType.toLowerCase();

    if (!supportedTypes.includes(baseType)) {
      console.warn(`Unsupported plot type: ${baseType}. Falling back to bar chart.`);
    }

    const COLORS = ["#636EFA", "#EF553B", "#00CC96", "#AB63FA", "#FFA15A"];

    const traces = columns.slice(1).map((col, idx) => {
      const y = data.data.map((d) => d[col]);
      const color = COLORS[idx % COLORS.length];

      if (baseType === "area") {
        return {
          x,
          y,
          name: col,
          type: "scatter",
          mode: "lines",
          fill: "tozeroy",
          line: { color },
        };
      }

      return {
        x,
        y,
        name: col,
        type: ["line", "scatter"].includes(baseType) ? "scatter" : baseType,
        mode:
          baseType === "line"
            ? "lines+markers"
            : baseType === "scatter"
            ? "markers"
            : undefined,
        marker: { color },
      };
    });

    return (
      <Plot
        data={traces}
        layout={{
          title: data.title || "Business Vitality Plot",
          xaxis: { title: columns[0] },
          yaxis: { title: "Values" },
          autosize: true,
          margin: { t: 40, l: 50, r: 30, b: 50 },
          plot_bgcolor: "#fff",
          paper_bgcolor: "#fff",
        }}
        style={{ width: "100%", height: "100%" }}
        useResizeHandler={true}
        config={{ responsive: true }}
      />
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Business Vitality Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask your business question..."
          />
          <div className="flex items-center gap-4">
            <Button onClick={handleAsk} disabled={loading}>
              {loading ? "Processing..." : "Ask"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setQuery("");
                setPlotData(null);
                setFinalResponse(null);
                setPlotTypeOverride(null);
                localStorage.removeItem(LOCAL_STORAGE_KEY);
              }}
            >
              Clear
            </Button>
            {plotData && (
              <Select
                onValueChange={(value) => setPlotTypeOverride(value)}
                value={plotTypeOverride || plotData.plot_type}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Switch Plot Type" />
                </SelectTrigger>
                <SelectContent>
                  {supportedTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {plotData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Visualization</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <button className="p-2 rounded-full hover:bg-muted" title="View Summary">
                    <Info className="w-5 h-5 text-muted-foreground" />
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Business Insights</DialogTitle>
                    <DialogDescription className="mt-2">
                      {finalResponse}
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>

          <CardContent className="pt-6 min-h-[400px]">
            {loading ? (
              <Skeleton className="w-full h-[400px] rounded-lg" />
            ) : (
              renderPlotFromData(plotData)
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BusinessVitality;
