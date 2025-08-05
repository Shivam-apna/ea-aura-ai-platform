import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, Share2 } from 'lucide-react';
import { HolographicCard } from './Dashboard'; // Reusing HolographicCard from Dashboard

const Reports = () => {
  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 h-full bg-background"> {/* Apply background to the page */}
      <HolographicCard className="neumorphic-card"> {/* Apply neumorphic styling */}
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-400" /> Performance Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground">Generate comprehensive performance reports.</p>
          <p className="text-sm text-muted-foreground mt-2">Analyze system and agent efficiency.</p>
        </CardContent>
      </HolographicCard>

      <HolographicCard className="neumorphic-card"> {/* Apply neumorphic styling */}
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Download className="h-5 w-5 text-green-400" /> Export Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground">Export various data sets in multiple formats.</p>
          <p className="text-sm text-muted-foreground mt-2">Download raw or processed data for external analysis.</p>
        </CardContent>
      </HolographicCard>

      <HolographicCard className="md:col-span-2 neumorphic-card"> {/* Apply neumorphic styling */}
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Share2 className="h-5 w-5 text-purple-400" /> Share Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground">Share generated reports and insights with your team.</p>
          <p className="text-sm text-muted-foreground mt-2">Collaborate on data-driven decisions.</p>
        </CardContent>
      </HolographicCard>
    </div>
  );
};

export default Reports;