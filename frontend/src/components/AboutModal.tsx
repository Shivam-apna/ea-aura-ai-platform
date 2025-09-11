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
            Welcome to EA-AURA.AI – your AI-powered analytics assistant. This Help panel gives you quick guidance on how to use prompts, understand your scores, navigate the app, and troubleshooting common issues.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow pr-4 mb-4">
          <Accordion type="single" collapsible defaultValue="item-1" className="w-full space-y-4">
            {/* Using Prompts Section */}
            <AccordionItem value="item-1" className="bg-card rounded-lg shadow-sm border border-border/50 data-[state=open]:shadow-md transition-shadow duration-200">
              <AccordionTrigger className="px-4 py-3 text-base font-semibold text-foreground hover:no-underline">
                1. Using Prompts
              </AccordionTrigger>
              <AccordionContent className="border-t border-border/50 p-4 text-sm text-muted-foreground leading-relaxed">
                <p className="mb-2">
                  The search bar at the top is your conversation window with EA-AURA. You can type natural questions or metric-based queries.
                </p>
                <p className="font-semibold mb-2">Examples of What You Can Ask</p>
                <ul className="list-disc list-inside space-y-1 pl-4">
                  <li>“What is CES score?”</li>
                  <li>“Show the NPS score.”</li>
                  <li>“Provide CSAT %?”</li>
                  <li>“Provide me CXHS only from Jan 2025 to Jun 2024=5”</li>
                  <li>“What are the NPS Score, Engagement Rate, Average Sentiment Score, CSAT, CES Score and CXHS?”</li>
                  <li>“Give me the Alignment Score.”</li>
                </ul>
                <p className="mt-3 font-semibold">Tip: Use clear keywords like CES, NPS, CSAT, Sentiment, Conversion, Brand Index.</p>
              </AccordionContent>
            </AccordionItem>

            {/* Understanding Scores Section */}
            <AccordionItem value="item-2" className="bg-card rounded-lg shadow-sm border border-border/50 data-[state=open]:shadow-md transition-shadow duration-200">
              <AccordionTrigger className="px-4 py-3 text-base font-semibold text-foreground hover:no-underline">
                2. Understanding Scores
              </AccordionTrigger>
              <AccordionContent className="border-t border-border/50 p-4 text-sm text-muted-foreground">
                <p className="mb-2">EA-AURA shows key customer and business health indicators. Here’s what they mean:</p>
                <ul className="list-disc list-inside space-y-2 pl-4">
                  <li>
                    <strong>CES (Customer Effort Score):</strong> Measures how easy it is for customers to get their issues resolved or complete a task.
                    <ul className="list-circle list-inside ml-4 mt-1">
                      <li>Example: A CES of 8.4 means customers find it relatively easy to engage with your support or services.</li>
                    </ul>
                  </li>
                  <li>
                    <strong>NPS (Net Promoter Score):</strong> Tracks customer loyalty by asking if they would recommend your brand.
                    <ul className="list-circle list-inside ml-4 mt-1">
                      <li>Scale: 1 to 10.</li>
                      <li>Example: An NPS of 7 means more promoters than detractors, but still room for improvement.</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Sentiment Score:</strong> AI-driven metric based on analyzing customer reviews, comments, and feedback for positivity or negativity.
                    <ul className="list-circle list-inside ml-4 mt-1">
                      <li>Example: A score of 98 means feedback is overwhelmingly positive.</li>
                    </ul>
                  </li>
                  <li>
                    <strong>CSAT (Customer Satisfaction %):</strong> Percentage of customers who say they are satisfied with your product/service.
                    <ul className="list-circle list-inside ml-4 mt-1">
                      <li>Example: 96% CSAT indicates high satisfaction levels.</li>
                    </ul>
                  </li>
                  <li>
                    <strong>CXHS (Customer Health Score):</strong> Combines engagement, satisfaction, and retention data into a single measure of overall customer health.
                    <ul className="list-circle list-inside ml-4 mt-1">
                      <li>Helps identify at-risk vs loyal customers.</li>
                    </ul>
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Navigation Help Section */}
            <AccordionItem value="item-3" className="bg-card rounded-lg shadow-sm border border-border/50 data-[state=open]:shadow-md transition-shadow duration-200">
              <AccordionTrigger className="px-4 py-3 text-base font-semibold text-foreground hover:no-underline">
                3. Navigation Help
              </AccordionTrigger>
              <AccordionContent className="border-t border-border/50 p-4 text-sm text-muted-foreground">
                <p className="mb-2">The left-hand menu organizes your dashboards and insights.</p>
                <ul className="list-disc list-inside space-y-2 pl-4">
                  <li>
                    <strong>Overview:</strong> Snapshot of key metrics (CES, NPS, Sentiment, CSAT) at a glance.
                  </li>
                  <li>
                    <strong>Business Vitality:</strong> Tracks revenue, growth, and operational health.
                  </li>
                  <li>
                    <strong>Customer Analysis:</strong> Deep dive into customer engagement, sentiments and satisfaction.
                  </li>
                  <li>
                    <strong>Mission Alignment:</strong> Measures how well your outcomes align with strategic goals.
                  </li>
                  <li>
                    <strong>Brand Index:</strong> Understand your brand’s reputation, and website positioning.
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Troubleshooting & FAQs Section */}
            <AccordionItem value="item-4" className="bg-card rounded-lg shadow-sm border border-border/50 data-[state=open]:shadow-md transition-shadow duration-200">
              <AccordionTrigger className="px-4 py-3 text-base font-semibold text-foreground hover:no-underline">
                4. Troubleshooting & FAQs
              </AccordionTrigger>
              <AccordionContent className="border-t border-border/50 p-4 text-sm text-muted-foreground">
                <ul className="list-disc list-inside space-y-2 pl-4">
                  <li>
                    <strong>Why do I see “No data available”?</strong> Your data source may not be connected, or there’s no data for that metric. Try refreshing or asking a different prompt.
                  </li>
                  <li>
                    <strong>How do I refresh my data?</strong> Use the refresh button (<RefreshCw className="inline-block h-4 w-4 align-text-bottom" />) at the top-right corner of the screen.
                  </li>
                  <li>
                    <strong>What if my prompt isn’t understood?</strong> Rephrase with simpler terms. Example: Instead of “Show me customer happiness trends,” try “CSAT.”
                  </li>
                  <li>
                    <strong>Can I export data or reports?</strong> Yes, look for the export/download PDF option in dashboards where available.
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* More Help Section */}
            <AccordionItem value="item-5" className="bg-card rounded-lg shadow-sm border border-border/50 data-[state=open]:shadow-md transition-shadow duration-200">
              <AccordionTrigger className="px-4 py-3 text-base font-semibold text-foreground hover:no-underline">
                5. More Help
              </AccordionTrigger>
              <AccordionContent className="border-t border-border/50 p-4 text-sm text-muted-foreground">
                <p className="mb-2">Need more details?</p>
                <ul className="list-disc list-inside space-y-2 pl-4">
                  <li>Contact your system admin for data source issues.</li>
                  <li>Reach out to the support team for technical help.</li>
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