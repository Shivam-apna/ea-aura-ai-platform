import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrafficSource {
  name: string;
  percentage: number;
}

const trafficSources: TrafficSource[] = [
  { name: 'Google', percentage: 45 },
  { name: 'YouTube', percentage: 25 },
  { name: 'Instagram', percentage: 15 },
  { name: 'Pinterest', percentage: 8 },
  { name: 'Facebook', percentage: 5 },
  { name: 'Twitter', percentage: 2 },
];

const TrafficByWebsite: React.FC = () => {
  return (
    <Card className="neumorphic-card rounded-2xl shadow-neumorphic-light border-none">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Globe className="h-5 w-5 text-blue-600" /> Traffic by Website
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {trafficSources.map((source, index) => (
          <div key={source.name} className="flex flex-col">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-foreground">{source.name}</span>
              <span className="text-sm text-muted-foreground">{source.percentage}%</span>
            </div>
            <Progress
              value={source.percentage}
              className={cn(
                "h-2 bg-muted", // Ensure background is muted
                "[&::-webkit-progress-value]:bg-foreground" // Progress bar fill color
              )}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default TrafficByWebsite;