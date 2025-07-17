import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, BarChart, TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart, Percent, Scale, TrendingUp as TrendingUpIcon } from 'lucide-react';
import { HolographicCard } from './Dashboard';
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LabelList,
  Cell,
  ReferenceLine,
  ScatterChart,
  Scatter,
} from "recharts";
import { cn } from '@/lib/utils';
import SalesKPICards from '@/components/SalesKPICards'; // Re-import SalesKPICards
import SalesPromptBar from '@/components/SalesPromptBar';

const BusinessVitality = () => {
  const [competitorMarginData, setCompetitorMarginData] = useState([]);
  const [netProfitMarginData, setNetProfitMarginData] = useState([]);
  const [quickRatioData, setQuickRatioData] = useState([]);
  const [gmroiData, setGmroiData] = useState([]);

  useEffect(() => {
    const fetchBusinessVitalityData = async () => {
      try {
        const response = await fetch('http://localhost:3002/api/business-vitality');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setCompetitorMarginData(data.grossProfitMargin.sort((a: any, b: any) => b.margin - a.margin));
        setNetProfitMarginData(data.netProfitMargin.sort((a: any, b: any) => b.margin - a.margin));
        setQuickRatioData(data.quickRatio.sort((a: any, b: any) => b.ratio - a.ratio));
        setGmroiData(data.gmroi.sort((a: any, b: any) => b.gmroi - a.gmroi));
      } catch (error) {
        console.error("Failed to fetch business vitality data:", error);
      }
    };

    fetchBusinessVitalityData();
  }, []);

  // Calculate linear regression for the trendline
  const N = competitorMarginData.length;
  const sumX = competitorMarginData.reduce((acc, _, i) => acc + i, 0);
  const sumY = competitorMarginData.reduce((acc, d: any) => acc + d.margin, 0);
  const sumXY = competitorMarginData.reduce((acc, d: any, i) => acc + i * d.margin, 0);
  const sumX2 = competitorMarginData.reduce((acc, _, i) => acc + i * i, 0);

  let slope = 0;
  let intercept = 0;

  if (N > 1 && (N * sumX2 - sumX * sumX) !== 0) {
    slope = (N * sumXY - sumX * sumY) / (N * sumX2 - sumX * sumX);
    intercept = (sumY - slope * sumX) / N;
  }

  const trendlineData = competitorMarginData.map((d: any, i) => ({
    name: d.name,
    trend: slope * i + intercept,
  }));

  const BAR_COLORS = ['#4F46E5', '#10B981', '#F59E0B']; // More vibrant colors for bars

  const NET_PROFIT_COLORS = ['#22C55E', '#FACC15', '#EF4444']; // Green, Yellow, Red for highest to lowest

  const QUICK_RATIO_COLORS = ['#3B82F6', '#A855F7', '#EC4899']; // Blue, Purple, Pink

  const GMROI_COLORS = ['#10B981', '#3B82F6', '#F59E0B']; // Green, Blue, Amber

  const highestMarginCompany = netProfitMarginData.length > 0 ? netProfitMarginData[0] : null;
  const lowestMarginCompany = netProfitMarginData.length > 0 ? netProfitMarginData[netProfitMarginData.length - 1] : null;

  return (
    <div className="p-4 h-full">
      <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-800 mb-6 text-center">
        EA-AURA
      </h1>
      {/* Sales KPI Cards */}
      <div className="mb-6">
        <SalesKPICards />
      </div>
      {/* Sales Prompt Bar */}
      <div className="mb-6">
        <SalesPromptBar />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Card for Gross Profit Margin of Competitors */}
        <HolographicCard>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Percent className="h-5 w-5 text-orange-600" /> Gross Profit Margin of Competitors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  data={competitorMarginData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                  <XAxis dataKey="name" stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--foreground))' }} />
                  <YAxis stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--foreground))' }} label={{ value: 'Margin (%)', angle: -90, position: 'insideLeft', fill: 'hsl(var(--foreground))' }} />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, 'Gross Profit Margin']}
                    contentStyle={{ backgroundColor: "rgba(255,255,255,0.9)", border: "1px solid rgba(0,0,0,0.1)", borderRadius: "8px" }}
                    itemStyle={{ color: "black" }}
                    labelStyle={{ color: "gray" }}
                  />
                  <Bar dataKey="margin" barSize={60}>
                    {competitorMarginData.map((entry: any, index) => (
                      <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                    <LabelList dataKey="margin" position="top" formatter={(value: number) => `${value}%`} fill="hsl(var(--foreground))" />
                  </Bar>
                  {/* Trendline */}
                  <Line
                    type="linear"
                    dataKey="trend"
                    stroke="#EF4444" // Red color for trendline
                    strokeWidth={2}
                    dot={false}
                    data={trendlineData} // Use the separate trendline data
                  />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-gray-700 text-center mt-2">Competitor Gross Profit Margins with Linear Trend</p>
          </CardContent>
        </HolographicCard>

        {/* New Card for Net Profit Margin Comparison */}
        <HolographicCard>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Percent className="h-5 w-5 text-blue-600" /> Net Profit Margin Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  data={netProfitMarginData}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" horizontal={false} />
                  <XAxis type="number" stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--foreground))' }} label={{ value: 'Net Profit Margin (%)', position: 'insideBottom', offset: -5, fill: 'hsl(var(--foreground))' }} />
                  <YAxis type="category" dataKey="name" stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--foreground))' }} />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, 'Net Profit Margin']}
                    contentStyle={{ backgroundColor: "rgba(255,255,255,0.9)", border: "1px solid rgba(0,0,0,0.1)", borderRadius: "8px" }}
                    itemStyle={{ color: "black" }}
                    labelStyle={{ color: "gray" }}
                  />
                  <Bar dataKey="margin" barSize={40}>
                    {netProfitMarginData.map((entry: any, index) => (
                      <Cell key={`cell-${index}`} fill={NET_PROFIT_COLORS[index]} />
                    ))}
                    <LabelList dataKey="margin" position="right" formatter={(value: number) => `${value}%`} fill="hsl(var(--foreground))" />
                  </Bar>
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-gray-700 text-center mt-2">
              Highest Margin: <span className="font-semibold text-green-600">{highestMarginCompany?.name} ({highestMarginCompany?.margin}%)</span> |
              Lowest Margin: <span className="font-semibold text-red-600">{lowestMarginCompany?.name} ({lowestMarginCompany?.margin}%)</span>
            </p>
          </CardContent>
        </HolographicCard>

        {/* New Card for Quick Ratio Comparison (Bullet Chart / Dot Plot) */}
        <HolographicCard>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Scale className="h-5 w-5 text-green-600" /> Quick Ratio Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  data={quickRatioData}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, 3]} // Set fixed domain for comparison
                    stroke="hsl(var(--foreground))"
                    tick={{ fill: 'hsl(var(--foreground))' }}
                    label={{ value: 'Quick Ratio Value', position: 'insideBottom', offset: -5, fill: 'hsl(var(--foreground))' }}
                  />
                  <YAxis type="category" dataKey="name" stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--foreground))' }} />
                  <Tooltip
                    formatter={(value: number) => [value.toFixed(1), 'Quick Ratio']}
                    contentStyle={{ backgroundColor: "rgba(255,255,255,0.9)", border: "1px solid rgba(0,0,0,0.1)", borderRadius: "8px" }}
                    itemStyle={{ color: "black" }}
                    labelStyle={{ color: "gray" }}
                  />
                  {/* Benchmark Line at 1.0 */}
                  <ReferenceLine x={1.0} stroke="#EF4444" strokeDasharray="3 3" label={{ value: 'Benchmark (1.0)', position: 'top', fill: '#EF4444', fontSize: 12 }} />
                  <Bar dataKey="ratio" barSize={10}> {/* Small barSize to make it look like a dot */}
                    {quickRatioData.map((entry: any, index) => (
                      <Cell key={`cell-${index}`} fill={QUICK_RATIO_COLORS[index]} />
                    ))}
                    <LabelList dataKey="ratio" position="right" formatter={(value: number) => value.toFixed(1)} fill="hsl(var(--foreground))" />
                  </Bar>
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-gray-700 text-center mt-2">
              Visualize liquidity comparison across competitors.
            </p>
          </CardContent>
        </HolographicCard>

        {/* New Card for GMROI Comparison (Lollipop Chart) */}
        <HolographicCard>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUpIcon className="h-5 w-5 text-purple-600" /> GMROI Comparison with Competitors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  data={gmroiData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" vertical={false} />
                  <XAxis dataKey="name" stroke="hsl(var(--foreground))" tick={{ fill: 'hsl(var(--foreground))' }} />
                  <YAxis
                    stroke="hsl(var(--foreground))"
                    tick={{ fill: 'hsl(var(--foreground))' }}
                    domain={[0, 3]} // Consistent scale 0-3
                    label={{ value: 'GMROI Values', angle: -90, position: 'insideLeft', fill: 'hsl(var(--foreground))' }}
                  />
                  <Tooltip
                    formatter={(value: number) => [value.toFixed(1), 'GMROI']}
                    contentStyle={{ backgroundColor: "rgba(255,255,255,0.9)", border: "1px solid rgba(0,0,0,0.1)", borderRadius: "8px" }}
                    itemStyle={{ color: "black" }}
                    labelStyle={{ color: "gray" }}
                  />
                  <Bar dataKey="gmroi" barSize={2}> {/* Thin bar for the stick */}
                    {gmroiData.map((entry: any, index) => (
                      <Cell key={`bar-cell-${index}`} fill={GMROI_COLORS[index % GMROI_COLORS.length]} />
                    ))}
                  </Bar>
                  <Scatter dataKey="gmroi" data={gmroiData}> {/* Scatter for the lollipop head */}
                    {gmroiData.map((entry: any, index) => (
                      <Cell key={`scatter-cell-${index}`} fill={GMROI_COLORS[index % GMROI_COLORS.length]} />
                    ))}
                    <LabelList dataKey="gmroi" position="top" formatter={(value: number) => value.toFixed(1)} fill="hsl(var(--foreground))" />
                  </Scatter>
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-gray-700 text-center mt-2">
              Compare return on inventory investment across competitors.
            </p>
          </CardContent>
        </HolographicCard>
      </div>
    </div>
  );
};

export default BusinessVitality;