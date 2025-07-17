import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SummaryCard } from '@/components/DashboardSummaryCards'; // Corrected import to named export

const SalesKPICards: React.FC = () => {
  const [totalSales, setTotalSales] = useState(1250000); // in USD
  const [salesGrowth, setSalesGrowth] = useState(7.5); // in percentage
  const [avgOrderValue, setAvgOrderValue] = useState(250); // in USD
  const [conversionRate, setConversionRate] = useState(2.8); // in percentage

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time updates for sales KPIs
      setTotalSales(prev => Math.floor(prev + (Math.random() * 10000 - 5000))); // +/- 5000
      setSalesGrowth(prev => parseFloat((prev + (Math.random() * 0.5 - 0.25)).toFixed(1))); // +/- 0.25%
      setAvgOrderValue(prev => parseFloat((prev + (Math.random() * 5 - 2.5)).toFixed(1))); // +/- 2.5 USD
      setConversionRate(prev => parseFloat((prev + (Math.random() * 0.1 - 0.05)).toFixed(1))); // +/- 0.05%
    }, 7000); // Update every 7 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <SummaryCard
        title="Total Sales (YTD)"
        value={`$${totalSales.toLocaleString()}`}
        change={salesGrowth}
        icon={DollarSign}
        colorClass="text-green-600"
        description="vs. previous year"
      />
      <SummaryCard
        title="Sales Growth"
        value={`${salesGrowth.toFixed(1)}%`}
        change={salesGrowth > 0 ? 0.1 : -0.1} // Small arbitrary change for icon
        icon={TrendingUp}
        colorClass="text-blue-600"
        description="this quarter"
      />
      <SummaryCard
        title="Average Order Value"
        value={`$${avgOrderValue.toFixed(2)}`}
        icon={ShoppingCart}
        colorClass="text-purple-600"
        description="across all channels"
      />
      <SummaryCard
        title="Conversion Rate"
        value={`${conversionRate.toFixed(1)}%`}
        icon={Percent}
        colorClass="text-orange-600"
        description="from visitors to buyers"
      />
    </div>
  );
};

export default SalesKPICards;