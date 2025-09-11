"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InfoIcon, X, RefreshCw, TrendingUp, Lightbulb } from 'lucide-react'; // Added RefreshCw, TrendingUp, Lightbulb
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"; // Import Accordion components

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] h-[550px] flex flex-col neumorphic-card border border-border text-foreground bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <InfoIcon className="h-5 w-5 text-primary" /> About EA-AURA.AI
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Your AI-powered platform for comprehensive business insights.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow pr-4 mb-4">
          <Accordion type="single" collapsible defaultValue="item-1" className="w-full space-y-4">
            {/* About EA-AURA.AI Section */}
            <AccordionItem value="item-1" className="bg-card rounded-lg shadow-sm border border-border/50 data-[state=open]:shadow-md transition-shadow duration-200">
              <AccordionTrigger className="px-4 py-3 text-base font-semibold text-foreground hover:no-underline">
                What is EA-AURA.AI?
              </AccordionTrigger>
              <AccordionContent className="border-t border-border/50 p-4 text-sm text-muted-foreground leading-relaxed">
                <p className="mb-2">
                  EA-AURA.AI is an advanced AI-powered analytics platform designed to provide a holistic view of your business.
                  It integrates data across various domains to deliver actionable insights, helping you accelerate vision,
                  velocity, and value. Our intelligent agents analyze complex datasets to present clear, concise, and
                  predictive information, empowering data-driven decision-making.
                </p>
                <p>
                  The platform covers key areas such as Business Vitality (sales & marketing performance), Customer Analysis
                  (surveys, social media, support tickets), Mission Alignment (strategic goal tracking), and Brand Index
                  (social engagement & website analytics).
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* How to Use the Dashboard Section */}
            <AccordionItem value="item-2" className="bg-card rounded-lg shadow-sm border border-border/50 data-[state=open]:shadow-md transition-shadow duration-200">
              <AccordionTrigger className="px-4 py-3 text-base font-semibold text-foreground hover:no-underline">
                How to Use the Dashboard
              </AccordionTrigger>
              <AccordionContent className="border-t border-border/50 p-4 text-sm text-muted-foreground">
                <ul className="list-disc list-inside space-y-2">
                  <li>
                    <strong>Navigate Modules:</strong> Use the sidebar on the left to switch between different modules
                    like Overview, Business Vitality, Customer Analysis, Mission Alignment, and Brand Index. Each module
                    focuses on specific aspects of your business.
                  </li>
                  <li>
                    <strong>Generate Insights:</strong> Utilize the "Ask-Aura" prompt bar at the top of each dashboard.
                    Type your questions or requests (e.g., "Show me sales trends," "What is the current NPS score?")
                    and click "Generate" to get AI-powered charts and summaries.
                  </li>
                  <li>
                    <strong>Refresh Data:</strong> Click the refresh icon (<RefreshCw className="inline-block h-4 w-4 align-text-bottom" />) in the header to refresh the current dashboard's data.
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Understanding Graphs & KPIs Section */}
            <AccordionItem value="item-3" className="bg-card rounded-lg shadow-sm border border-border/50 data-[state=open]:shadow-md transition-shadow duration-200">
              <AccordionTrigger className="px-4 py-3 text-base font-semibold text-foreground hover:no-underline">
                Understanding Graphs & KPIs
              </AccordionTrigger>
              <AccordionContent className="border-t border-border/50 p-4 text-sm text-muted-foreground">
                <ul className="list-disc list-inside space-y-2">
                  <li>
                    <strong>KPI Cards:</strong> Key Performance Indicator (KPI) cards at the top provide quick snapshots of critical metrics. Their colors dynamically change based on performance thresholds, offering immediate visual cues.
                  </li>
                  <li>
                    <strong>Detailed Graphs:</strong> Interactive graphs below offer visual representations of data, often accompanied by AI-generated summaries for deeper understanding. You can change chart types and colors using the settings icon on each graph.
                  </li>
                  <li>
                    <strong>Predictive Analysis:</strong> Use the "Trending Up" icon (<TrendingUp className="inline-block h-4 w-4 align-text-bottom" />) on a graph to generate AI-powered predictions and future trends.
                  </li>
                  <li>
                    <strong>Next Step Analysis:</strong> Use the "Lightbulb" icon (<Lightbulb className="inline-block h-4 w-4 align-text-bottom" />) to get AI-driven recommendations and actionable next steps based on the data.
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Troubleshooting & No Data Cases Section */}
            <AccordionItem value="item-4" className="bg-card rounded-lg shadow-sm border border-border/50 data-[state=open]:shadow-md transition-shadow duration-200">
              <AccordionTrigger className="px-4 py-3 text-base font-semibold text-foreground hover:no-underline">
                Troubleshooting & No Data Cases
              </AccordionTrigger>
              <AccordionContent className="border-t border-border/50 p-4 text-sm text-muted-foreground">
                <ul className="list-disc list-inside space-y-2">
                  <li>
                    <strong>"No Data Available"</strong>: If a graph displays "No data available," it might mean
                    there's no relevant data for your current query or the data source is unavailable. Try rephrasing your
                    prompt or checking the data upload status in the "Upload Data" section (for admins).
                  </li>
                  <li>
                    <strong>API Errors</strong>: If you encounter API errors, ensure your internet connection is stable. For persistent issues, contact your administrator.
                  </li>
                  <li>
                    <strong>Stopping Processes</strong>: If a dashboard is taking too long to load, you can click the "Cancel" button on the loading overlay to stop the process.
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </ScrollArea>
        <div className="flex justify-end mt-auto">
          <Button onClick={onClose} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <X className="h-4 w-4 mr-2" /> Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AboutModal;