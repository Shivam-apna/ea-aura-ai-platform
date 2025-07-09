import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Award, Globe, Facebook, Twitter, Instagram } from 'lucide-react';
import { HolographicCard } from './Dashboard';
import { cn } from '@/lib/utils';

interface ChannelScore {
  name: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  icon: React.ElementType;
}

const BrandIndex = () => {
  const [overallBrandHealth, setOverallBrandHealth] = useState(85); // out of 100
  const [channelScores, setChannelScores] = useState<ChannelScore[]>([
    { name: 'Website', score: 92, trend: 'up', icon: Globe },
    { name: 'Social Media', score: 78, trend: 'stable', icon: Facebook }, // Using Facebook as a generic social icon
    { name: 'PR & Media', score: 88, trend: 'up', icon: Twitter }, // Using Twitter as a generic media icon
    { name: 'Customer Reviews', score: 80, trend: 'down', icon: Instagram }, // Using Instagram as a generic review icon
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setOverallBrandHealth(prev => Math.min(100, Math.max(70, prev + Math.floor(Math.random() * 5) - 2))); // 70-100
      setChannelScores(prev => prev.map(channel => {
        const newScore = Math.min(100, Math.max(60, channel.score + Math.floor(Math.random() * 7) - 3));
        let newTrend: 'up' | 'down' | 'stable' = 'stable';
        if (newScore > channel.score) newTrend = 'up';
        else if (newScore < channel.score) newTrend = 'down';
        return { ...channel, score: newScore, trend: newTrend };
      }));
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const getHealthColor = (score: number) => {
    if (score < 75) return "bg-orange-500";
    if (score < 65) return "bg-red-500";
    return "bg-green-500";
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return "text-green-600";
    if (trend === 'down') return "text-red-600";
    return "text-gray-600";
  };

  const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4" />;
    return null;
  };

  return (
    <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
      <HolographicCard className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Award className="h-5 w-5 text-blue-600" /> Overall Brand Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xl font-bold text-gray-900">Brand Health Score: {overallBrandHealth}%</p>
            <span className={cn("text-sm font-semibold px-3 py-1 rounded-full", getHealthColor(overallBrandHealth))}>
              {overallBrandHealth >= 80 ? "Excellent" : overallBrandHealth >= 70 ? "Good" : "Needs Attention"}
            </span>
          </div>
          <Progress value={overallBrandHealth} className={cn("w-full h-3", getHealthColor(overallBrandHealth))} />
          <p className="text-sm text-gray-600 mt-2">
            This score reflects public perception, market share, and customer loyalty.
          </p>
        </CardContent>
      </HolographicCard>

      {channelScores.map((channel) => (
        <HolographicCard key={channel.name}>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <channel.icon className="h-5 w-5 text-purple-600" /> {channel.name} Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <p className="text-3xl font-bold text-gray-900">{channel.score}</p>
              <div className={cn("flex items-center gap-1 text-sm", getTrendColor(channel.trend))}>
                <TrendIcon trend={channel.trend} />
                {channel.trend === 'up' && 'Improving'}
                {channel.trend === 'down' && 'Declining'}
                {channel.trend === 'stable' && 'Stable'}
              </div>
            </div>
            <Progress value={channel.score} className={cn("w-full h-2", getHealthColor(channel.score))} />
            <p className="text-sm text-gray-600 mt-2">
              Performance on this channel.
            </p>
          </CardContent>
        </HolographicCard>
      ))}
    </div>
  );
};

export default BrandIndex;