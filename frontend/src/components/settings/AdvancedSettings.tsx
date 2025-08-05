import React, { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Globe, Database, HardDrive, Bell, Zap, SlidersHorizontal, Bug, Languages } from 'lucide-react'; // Added new icons

const AdvancedSettings: React.FC = () => {
  const [enableBetaFeatures, setEnableBetaFeatures] = useState(false);
  const [autoScaleAgents, setAutoScaleAgents] = useState(true); // New state
  const [enableDebugLogs, setEnableDebugLogs] = useState(true); // New state
  const [languagePreference, setLanguagePreference] = useState("english"); // New state

  // Removed old states that are no longer in the design
  // const [apiEndpoint, setApiEndpoint] = useState("http://localhost:8081/api");
  // const [defaultDataView, setDefaultDataView] = useState("table");
  // const [dataRefreshInterval, setDataRefreshInterval] = useState("15s");
  // const [notificationSound, setNotificationSound] = useState("default");

  return (
    <div className="space-y-6 p-4">
      {/* Enable Beta Features */}
      <div className="flex items-center justify-between space-x-2">
        <Label htmlFor="enable-beta-features" className="text-muted-foreground flex items-center gap-2">
          <Zap className="h-4 w-4" /> Enable Beta Features
        </Label>
        <Switch
          id="enable-beta-features"
          checked={enableBetaFeatures}
          onCheckedChange={setEnableBetaFeatures}
        />
      </div>

      {/* Auto-scale Agents */}
      <div className="flex items-center justify-between space-x-2">
        <Label htmlFor="auto-scale-agents" className="text-muted-foreground flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" /> Auto-scale Agents
        </Label>
        <Switch
          id="auto-scale-agents"
          checked={autoScaleAgents}
          onCheckedChange={setAutoScaleAgents}
        />
      </div>

      {/* Enable Debug Logs */}
      <div className="flex items-center justify-between space-x-2">
        <Label htmlFor="enable-debug-logs" className="text-muted-foreground flex items-center gap-2">
          <Bug className="h-4 w-4" /> Enable Debug Logs
        </Label>
        <Switch
          id="enable-debug-logs"
          checked={enableDebugLogs}
          onCheckedChange={setEnableDebugLogs}
        />
      </div>

      {/* Language Preference */}
      <div className="space-y-2">
        <Label htmlFor="language-preference" className="text-muted-foreground flex items-center gap-2">
          <Languages className="h-4 w-4" /> Language Preference
        </Label>
        <Select onValueChange={setLanguagePreference} value={languagePreference}>
          <SelectTrigger className="w-full bg-input border-border text-foreground">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent className="neumorphic-card text-popover-foreground border border-border bg-card">
            <SelectItem value="english">English</SelectItem>
            <SelectItem value="spanish">Spanish</SelectItem>
            <SelectItem value="french">French</SelectItem>
            <SelectItem value="german">German</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default AdvancedSettings;