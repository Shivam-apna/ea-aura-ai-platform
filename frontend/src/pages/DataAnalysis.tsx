import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, BarChart, PieChart } from 'lucide-react';
import { HolographicCard } from './Dashboard'; // Reusing HolographicCard from Dashboard

const DataAnalysis = () => {
  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 h-full bg-background"> {/* Apply background to the page */}
      <HolographicCard className="neumorphic-card"> {/* Apply neumorphic styling */}
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <LineChart className="h-5 w-5 text-primary" /> Trend Analysis {/* Changed text-blue-400 to text-primary */}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground">Detailed insights into historical data trends.</p>
          <p className="text-sm text-muted-foreground mt-2">Visualize key performance indicators over time.</p>
        </CardContent>
      </HolographicCard>

      <HolographicCard className="neumorphic-card"> {/* Apply neumorphic styling */}
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <BarChart className="h-5 w-5 text-primary" /> Comparative Metrics {/* Changed text-green-400 to text-primary */}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground">Compare different data sets side-by-side.</p>
          <p className="text-sm text-muted-foreground mt-2">Identify strengths and weaknesses across categories.</p>
        </CardContent>
      </HolographicCard>

      <HolographicCard className="md:col-span-2 neumorphic-card"> {/* Apply neumorphic styling */}
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <PieChart className="h-5 w-5 text-primary" /> Distribution Overview {/* Changed text-purple-400 to text-primary */}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground">Understand the composition and distribution of your data.</p>
          <p className="text-sm text-muted-foreground mt-2">Break down complex data into digestible segments.</p>
        </CardContent>
      </HolographicCard>
    </div>
  );
};

export default DataAnalysis;