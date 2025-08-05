import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Play, Pause, RefreshCw, Clock, CheckCircle2, XCircle } from 'lucide-react'; // Added new icons
import { cn } from '@/lib/utils';

const QueueExecutionSettings: React.FC = () => {
  const [isQueuePaused, setIsQueuePaused] = useState(false);

  // Mock data for Last 10 Agent Runs
  const agentRuns = [
    { time: '2024-07-30 11:05:15', status: 'Success' },
    { time: '2024-07-30 11:05:10', status: 'Failed' },
    { time: '2024-07-30 11:04:55', status: 'Success' },
    { time: '2024-07-30 11:04:40', status: 'Success' },
    // Add more mock data if needed to fill out the table
  ];

  const handleRestartOrchestrator = () => {
    console.log("Restarting Orchestrator...");
    // Simulate API call or action
  };

  return (
    <div className="space-y-6 p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Queue Status & Controls */}
        <Card className="bg-muted/50 border border-border shadow-sm rounded-lg p-4">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-lg font-semibold text-foreground">Queue Status</CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            <div className="flex flex-col items-start gap-1">
              <span className={cn(
                "text-sm font-semibold",
                isQueuePaused ? "text-red-500" : "text-green-600"
              )}>
                Queue Status: {isQueuePaused ? "PAUSED" : "RUNNING"}
              </span>
              <span className="text-xs text-muted-foreground">
                3 Active, 12 Pending
              </span>
            </div>

            {/* Pause/Resume Agent Queue */}
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="pause-resume-queue" className="text-muted-foreground flex items-center gap-2">
                {isQueuePaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />} Pause/Resume Agent Queue
              </Label>
              <Switch
                id="pause-resume-queue"
                checked={!isQueuePaused} // Checked means Running, unchecked means Paused
                onCheckedChange={(checked) => setIsQueuePaused(!checked)}
              />
            </div>

            {/* Restart Orchestrator Button */}
            <Button
              variant="outline"
              onClick={handleRestartOrchestrator}
              className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" /> Restart Orchestrator
            </Button>
          </CardContent>
        </Card>

        {/* Last 10 Agent Runs */}
        <Card className="bg-muted/50 border border-border shadow-sm rounded-lg p-4">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-lg font-semibold text-foreground">Last 10 Agent Runs</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">Time</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agentRuns.map((run, index) => (
                  <TableRow key={index} className="border-border">
                    <TableCell className="text-sm text-foreground">{run.time}</TableCell>
                    <TableCell className="text-sm flex items-center gap-1">
                      {run.status === 'Success' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className={cn(
                        run.status === 'Success' ? "text-green-500" : "text-red-500"
                      )}>
                        {run.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QueueExecutionSettings;