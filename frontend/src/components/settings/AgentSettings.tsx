import React, { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from '@/components/ui/switch';
import { Bot, Cpu, HardDrive, ToggleRight, Repeat } from 'lucide-react'; // Added new icons

const AgentSettings: React.FC = () => {
  const [agentSelector, setAgentSelector] = useState("Orchestrator Agent"); // Set a default from the new list
  const [llmModel, setLlmModel] = useState("gpt-4");
  const [maxTokenLimit, setMaxTokenLimit] = useState(4096);
  const [agentStatus, setAgentStatus] = useState(true); // Enable/Disable
  const [autoRetryOnFail, setAutoRetryOnFail] = useState(true);

  return (
    <div className="space-y-6 p-4">
      {/* Agent Selector */}
      <div className="space-y-2">
        <Label htmlFor="agent-selector" className="text-muted-foreground flex items-center gap-2">
          <Bot className="h-4 w-4" /> Agent Selector
        </Label>
        <Select onValueChange={setAgentSelector} value={agentSelector}>
          <SelectTrigger className="w-full bg-input border-border text-foreground">
            <SelectValue placeholder="Select agent" />
          </SelectTrigger>
          <SelectContent className="neumorphic-card text-popover-foreground border border-border bg-card">
            <SelectItem value="Orchestrator Agent">Orchestrator Agent</SelectItem>
            <SelectItem value="Ad-Hoc Query Agent">Ad-Hoc Query Agent</SelectItem>
            <SelectItem value="Graphical Changes Agent">Graphical Changes Agent</SelectItem>
            <SelectItem value="Business Vitality Agent">Business Vitality Agent</SelectItem>
            <SelectItem value="Customer Analyzer Agent">Customer Analyzer Agent</SelectItem>
            <SelectItem value="Mission Alignment Agent">Mission Alignment Agent</SelectItem>
            <SelectItem value="Brand Index Agent">Brand Index Agent</SelectItem>
            <SelectItem value="Sales Agent">Sales Agent</SelectItem>
            <SelectItem value="New Users Monitoring Agent">New Users Monitoring Agent</SelectItem>
            <SelectItem value="Marketing Agent">Marketing Agent</SelectItem>
            <SelectItem value="Customer Survey Agent">Customer Survey Agent</SelectItem>
            <SelectItem value="Support Ticket Analyzer Agent">Support Ticket Analyzer Agent</SelectItem>
            <SelectItem value="Social Media Response Analyzer Agent">Social Media Response Analyzer Agent</SelectItem>
            <SelectItem value="Product Review Analyzer Agent">Product Review Analyzer Agent</SelectItem>
            <SelectItem value="Social Engagement Analyzer Agent">Social Engagement Analyzer Agent</SelectItem>
            <SelectItem value="Website Analyzer Agent">Website Analyzer Agent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* LLM Model */}
      <div className="space-y-2">
        <Label htmlFor="llm-model" className="text-muted-foreground flex items-center gap-2">
          <Cpu className="h-4 w-4" /> LLM Model
        </Label>
        <Select onValueChange={setLlmModel} value={llmModel}>
          <SelectTrigger className="w-full bg-input border-border text-foreground">
            <SelectValue placeholder="Select LLM model" />
          </SelectTrigger>
          <SelectContent className="neumorphic-card text-popover-foreground border border-border bg-card">
            <SelectItem value="gpt-4">GPT-4</SelectItem>
            <SelectItem value="gpt-3.5">GPT-3.5</SelectItem>
            <SelectItem value="claude-3">Claude 3</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Max Token Limit */}
      <div className="space-y-2">
        <Label htmlFor="max-token-limit" className="text-muted-foreground flex items-center gap-2">
          <HardDrive className="h-4 w-4" /> Max Token Limit
        </Label>
        <Input
          id="max-token-limit"
          type="number"
          value={maxTokenLimit}
          onChange={(e) => setMaxTokenLimit(parseInt(e.target.value) || 0)}
          className="bg-input border-border text-foreground"
        />
      </div>

      {/* Agent Status (Enable/Disable) */}
      <div className="flex items-center justify-between space-x-2">
        <Label htmlFor="agent-status" className="text-muted-foreground flex items-center gap-2">
          <ToggleRight className="h-4 w-4" /> Agent Status (Enable/Disable)
        </Label>
        <Switch
          id="agent-status"
          checked={agentStatus}
          onCheckedChange={setAgentStatus}
        />
      </div>

      {/* Auto Retry on Fail */}
      <div className="flex items-center justify-between space-x-2">
        <Label htmlFor="auto-retry" className="text-muted-foreground flex items-center gap-2">
          <Repeat className="h-4 w-4" /> Auto Retry on Fail
        </Label>
        <Switch
          id="auto-retry"
          checked={autoRetryOnFail}
          onCheckedChange={setAutoRetryOnFail}
        />
      </div>
    </div>
  );
};

export default AgentSettings;