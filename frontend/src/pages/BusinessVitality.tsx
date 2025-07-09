import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, BarChart, TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart } from 'lucide-react';
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
} from "recharts";
import { cn } from '@/lib/utils';

const BusinessVitality = () => {
  const [revenueData, setRevenueData] = useState([
    { name: 'Jan', revenue: 4000 }, { name: 'Feb', revenue: 3000 }, { name: 'Mar', revenue: 5000 },
    { name: 'Apr', revenue: 4500 }, { name: 'May', revenue: 6000 }, { name: 'Jun', revenue: 5500 },
  ]);

  const [marketingKpiData, setMarketingKpiData] = useState([
    { name: 'Leads', value: 1200 }, { name: 'Conversions', value: 800 }, { name: 'CTR', value: 4.5 },
    { name: 'ROI', value: 150 },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRevenueData(prev => {
        const newRevenue = Math.floor(Math.random() * 2000) + 4000;
        return [...prev.slice(1), { name: new Date().toLocaleDateString('en-US', { month: 'short' }), revenue: newRevenue }];
      });
      setMarketingKpiData(prev => prev.map(kpi => ({
        ...kpi,
        value: kpi.name === 'CTR' ? parseFloat((kpi.value + (Math.random() * 0.5 - 0.25)).toFixed(1)) : Math.floor(kpi.value + (Math.random() * 200 - 100)),
      })));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
      <HolographicCard className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-600" /> Sales & Marketing Trends Narrative
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 mb-4">
            "Our sales performance shows a robust upward trend in the last quarter, driven by successful digital marketing campaigns. Customer acquisition costs have remained stable, indicating efficient lead generation. We anticipate continued growth with the upcoming product launch."
          </p>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart data={revenueData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip contentStyle={{ backgroundColor: "rgba(255,255,255,0.9)", border: "1px solid rgba(0,0,0,0.1)", borderRadius: "8px" }} itemStyle={{ color: "black" }} labelStyle={{ color: "gray" }} />
                <Line type="monotone" dataKey="revenue" stroke="#8884d8" activeDot={{ r: 8 }} />
              </RechartsLineChart>
            </ResponsiveContainer>
            <p className="text-sm text-gray-600 text-center mt-2">Historical Revenue (Last 6 Months)</p>
          </div>
        </CardContent>
      </HolographicCard>

      <HolographicCard>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" /> Key Marketing KPIs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={marketingKpiData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip contentStyle={{ backgroundColor: "rgba(255,255,255,0.9)", border: "1px solid rgba(0,0,0,0.1)", borderRadius: "8px" }} itemStyle={{ color: "black" }} labelStyle={{ color: "gray" }} />
                <Bar dataKey="value" fill="#82ca9d" />
              </RechartsBarChart>
            </ResponsiveContainer>
            <p className="text-sm text-gray-600 text-center mt-2">Marketing Performance Metrics</p>
          </div>
        </CardContent>
      </HolographicCard>

      <HolographicCard>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-purple-600" /> Conversion Funnel Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-gray-700">
            <p>Leads Generated: <span className="font-bold">{marketingKpiData[0].value}</span></p>
            <p>Conversion Rate: <span className="font-bold">{marketingKpiData[2].value}%</span></p>
            <p>Marketing ROI: <span className="font-bold">{marketingKpiData[3].value}%</span></p>
            <p className="text-sm text-gray-600 mt-4">
              The conversion funnel shows strong performance from lead generation to customer acquisition. Continuous optimization of ad creatives is recommended.
            </p>
          </div>
        </CardContent>
      </HolographicCard>
    </div>
  );
};

export default BusinessVitality;