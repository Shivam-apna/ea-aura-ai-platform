import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// Import the new settings components
import ThemeSettings from '@/components/settings/ThemeSettings.tsx';
import CacheResetSettings from '@/components/settings/CacheResetSettings.tsx';
import QueueExecutionSettings from '@/components/settings/QueueExecutionSettings.tsx';
// import AdvancedSettings from '@/components/settings/AdvancedSettings.tsx';
import AgentSettings from '@/components/settings/AgentSettings.tsx';

const Settings = () => {
  return (
    <div className="p-6 bg-background min-h-screen"> {/* Main container for the page */}
      <h1 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
        <SettingsIcon className="h-6 w-6 text-blue-500" /> Settings
      </h1>

      <div className="w-full"> {/* Changed from max-w-3xl mx-auto to w-full */}
        <Accordion type="multiple" className="w-full space-y-4"> {/* Use type="multiple" for all openable */}
          {/* Theme Settings */}
          <AccordionItem value="item-1" className="bg-card rounded-lg shadow-sm border border-border/50 data-[state=open]:shadow-md transition-shadow duration-200">
            <AccordionTrigger className="px-6 py-4 text-lg font-semibold text-foreground hover:no-underline">
              Theme Settings
            </AccordionTrigger>
            <AccordionContent className="border-t border-border/50">
              <ThemeSettings />
            </AccordionContent>
          </AccordionItem>

          {/* Cache & Reset */}
          <AccordionItem value="item-2" className="bg-card rounded-lg shadow-sm border border-border/50 data-[state=open]:shadow-md transition-shadow duration-200">
            <AccordionTrigger className="px-6 py-4 text-lg font-semibold text-foreground hover:no-underline">
              Cache & Reset
            </AccordionTrigger>
            <AccordionContent className="border-t border-border/50">
              <CacheResetSettings />
            </AccordionContent>
          </AccordionItem>

          {/* Queue & Execution
          <AccordionItem value="item-3" className="bg-card rounded-lg shadow-sm border border-border/50 data-[state=open]:shadow-md transition-shadow duration-200">
            <AccordionTrigger className="px-6 py-4 text-lg font-semibold text-foreground hover:no-underline">
              Queue & Execution
            </AccordionTrigger>
            <AccordionContent className="border-t border-border/50">
              <QueueExecutionSettings />
            </AccordionContent>
          </AccordionItem> */}

          {/* Advanced Settings
          <AccordionItem value="item-4" className="bg-card rounded-lg shadow-sm border border-border/50 data-[state=open]:shadow-md transition-shadow duration-200">
            <AccordionTrigger className="px-6 py-4 text-lg font-semibold text-foreground hover:no-underline">
              Advanced Settings
            </AccordionTrigger>
            <AccordionContent className="border-t border-border/50">
              <AdvancedSettings />
            </AccordionContent>
          </AccordionItem> */}

          {/* Agent Settings */}
          <AccordionItem value="item-5" className="bg-card rounded-lg shadow-sm border border-border/50 data-[state=open]:shadow-md transition-shadow duration-200">
            <AccordionTrigger className="px-6 py-4 text-lg font-semibold text-foreground hover:no-underline">
              Agent Settings
            </AccordionTrigger>
            <AccordionContent className="border-t border-border/50">
              <AgentSettings />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};

export default Settings;