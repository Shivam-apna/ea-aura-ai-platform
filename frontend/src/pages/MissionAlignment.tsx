import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, XCircle, Flag, Info } from 'lucide-react';
import { HolographicCard } from './Dashboard';
import { cn } from '@/lib/utils';

interface Recommendation {
  id: string;
  description: string;
  status: 'Pass' | 'Fail';
  blockable: boolean;
  details: string;
}

const MissionAlignment = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([
    { id: 'rec-001', description: 'Ensure all new features align with sustainability goals.', status: 'Pass', blockable: false, details: 'Feature X passed sustainability review.' },
    { id: 'rec-002', description: 'Prioritize user data privacy in all development cycles.', status: 'Pass', blockable: false, details: 'Privacy audit completed for Q3.' },
    { id: 'rec-003', description: 'Allocate 15% of R&D to open-source contributions.', status: 'Fail', blockable: true, details: 'Only 10% allocated due to resource constraints.' },
    { id: 'rec-004', description: 'Maintain 99.9% uptime for critical services.', status: 'Pass', blockable: false, details: 'Uptime maintained at 99.98%.' },
    { id: 'rec-005', description: 'Implement inclusive design principles for all new UI.', status: 'Fail', blockable: true, details: 'Accessibility review identified critical gaps in new dashboard.' },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.3) { // 30% chance to flip status
        setRecommendations(prev => prev.map(rec => {
          if (Math.random() < 0.5) { // 50% chance to flip this specific one
            return {
              ...rec,
              status: rec.status === 'Pass' ? 'Fail' : 'Pass',
              details: rec.status === 'Pass' ? 'Status flipped for demonstration.' : 'Status flipped back for demonstration.',
              blockable: Math.random() < 0.5, // Randomly set blockable
            };
          }
          return rec;
        }));
      }
    }, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const passCount = recommendations.filter(rec => rec.status === 'Pass').length;
  const failCount = recommendations.filter(rec => rec.status === 'Fail').length;
  const blockableCount = recommendations.filter(rec => rec.blockable && rec.status === 'Fail').length;

  return (
    <div className="p-4 grid grid-cols-1 gap-4 h-full bg-background"> {/* Apply background to the page */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <HolographicCard className="neumorphic-card"> {/* Apply neumorphic styling */}
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-400" /> Recommendations Passed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-foreground">{passCount}</div>
            <p className="text-sm text-muted-foreground">out of {recommendations.length} reviewed</p>
          </CardContent>
        </HolographicCard>

        <HolographicCard className="neumorphic-card"> {/* Apply neumorphic styling */}
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-400" /> Recommendations Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-foreground">{failCount}</div>
            <p className="text-sm text-muted-foreground">requiring attention</p>
          </CardContent>
        </HolographicCard>

        <HolographicCard className="neumorphic-card"> {/* Apply neumorphic styling */}
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Flag className="h-5 w-5 text-orange-400" /> Blockable Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-foreground">{blockableCount}</div>
            <p className="text-sm text-muted-foreground">critical mission conflicts</p>
          </CardContent>
        </HolographicCard>
      </div>

      <HolographicCard className="col-span-full neumorphic-card"> {/* Apply neumorphic styling */}
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Info className="h-5 w-5 text-purple-400" /> Detailed Recommendation Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="w-[100px] text-muted-foreground">ID</TableHead>
                <TableHead className="text-muted-foreground">Description</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Blockable</TableHead>
                <TableHead className="text-muted-foreground">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recommendations.map((rec) => (
                <TableRow key={rec.id} className="border-border">
                  <TableCell className="font-medium text-foreground">{rec.id}</TableCell>
                  <TableCell className="text-foreground">{rec.description}</TableCell>
                  <TableCell>
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-semibold",
                      rec.status === 'Pass' ? "bg-green-600/20 text-green-400" : "bg-red-600/20 text-red-400"
                    )}>
                      {rec.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {rec.blockable ? <Flag className="h-4 w-4 text-orange-400" /> : <CheckCircle2 className="h-4 w-4 text-muted-foreground" />}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{rec.details}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </HolographicCard>
    </div>
  );
};

export default MissionAlignment;