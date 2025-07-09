import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, BarChart, PieChart } from 'lucide-react';
import { HolographicCard } from './Dashboard'; // Reusing HolographicCard from Dashboard

const DataAnalysis = () => {
  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
      <HolographicCard>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-300 flex items-center gap-2">
            <LineChart className="h-5 w-5 text-blue-400" /> Trend Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-200">Detailed insights into historical data trends.</p>
          <p className="text-sm text-gray-400 mt-2">Visualize key performance indicators over time.</p>
        </CardContent>
      </HolographicCard>

      <HolographicCard>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-300 flex items-center gap-2">
            <BarChart className="h-5 w-5 text-green-400" /> Comparative Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-200">Compare different data sets side-by-side.</p>
          <p className="text-sm text-gray-400 mt-2">Identify strengths and weaknesses across categories.</p>
        </CardContent>
      </HolographicCard>

      <HolographicCard className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-300 flex items-center gap-2">
            <PieChart className="h-5 w-5 text-purple-400" /> Distribution Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-200">Understand the composition and distribution of your data.</p>
          <p className="text-sm text-gray-400 mt-2">Break down complex data into digestible segments.</p>
        </CardContent>
      </HolographicCard>
    </div>
  );
};

export default DataAnalysis;