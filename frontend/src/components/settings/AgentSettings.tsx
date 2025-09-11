import React, { useState, useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Cpu, HardDrive, ToggleRight, Clock, Target, Shield, CheckCircle, XCircle, Thermometer, Zap } from 'lucide-react';
import { getApiEndpoint } from "@/config/environment";

interface AgentSettingsProps {
  onLoadingChange: (isLoading: boolean) => void; // New prop to report loading state
}

const AgentSettings: React.FC<AgentSettingsProps> = ({ onLoadingChange }) => {
  const [selectedAgent, setSelectedAgent] = useState("");
  const [agentData, setAgentData] = useState<any[]>([]); // Initialize as array
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAgentData();
  }, []);

  const fetchAgentData = async () => {
    onLoadingChange(true); // Report loading started
    try {
      const response = await fetch(getApiEndpoint("/v1/agents/summary"));
      if (!response.ok) {
        throw new Error('Failed to fetch agent data');
      }
      const data = await response.json();
      setAgentData(data.agents || []);
      if (data.agents && data.agents.length > 0) {
        setSelectedAgent(data.agents[0].agent_id);
      }
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      onLoadingChange(false); // Report loading finished
    }
  };

  const currentAgent = Array.isArray(agentData) 
    ? agentData.find(agent => agent.agent_id === selectedAgent)
    : null;

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!currentAgent && agentData.length === 0) { // Only show 'No data' if no agents were fetched at all
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">No agent data available</div>
      </div>
    );
  }

  const ReadOnlyField = ({ icon: Icon, label, value, className = "" }) => (
    <div className="space-y-2">
      <Label className="text-muted-foreground flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {label}
      </Label>
      <div className={`p-3 bg-muted/50 rounded-md border border-border text-foreground ${className}`}>
        {value}
      </div>
    </div>
  );

  const StatusBadge = ({ enabled, critical }) => (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        {enabled ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-red-500" />
        )}
        <span className={enabled ? "text-green-600" : "text-red-600"}>
          {enabled ? "Enabled" : "Disabled"}
        </span>
      </div>
      {critical && (
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-orange-500" />
          <span className="text-orange-600">Critical</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 p-4 max-w-2xl">
      {/* Agent Selector */}
      <div className="space-y-2">
        <Label className="text-muted-foreground flex items-center gap-2">
          <Bot className="h-4 w-4" />
          Select Agent
        </Label>
        <Select onValueChange={setSelectedAgent} value={selectedAgent}>
          <SelectTrigger className="w-full bg-input border-border text-foreground">
            <SelectValue placeholder="Select an agent" />
          </SelectTrigger>
          <SelectContent className="bg-card border border-border">
            {Array.isArray(agentData) && agentData.map((agent) => (
              <SelectItem key={agent.agent_id} value={agent.agent_id}>
                {agent.agent_id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Agent Details */}
      {currentAgent && (
        <div className="grid gap-6">
          {/* Agent ID & Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ReadOnlyField 
              icon={Bot} 
              label="Agent ID" 
              value={currentAgent.agent_id}
            />
            <ReadOnlyField 
              icon={Target} 
              label="Type" 
              value={currentAgent.type?.toUpperCase() || 'N/A'}
              className={currentAgent.type === 'main' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}
            />
          </div>

          {/* Parent Agent */}
          {currentAgent.parent_agent && (
            <ReadOnlyField 
              icon={Bot} 
              label="Parent Agent" 
              value={currentAgent.parent_agent}
            />
          )}

          {/* Model & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ReadOnlyField 
              icon={Cpu} 
              label="LLM Model" 
              value={currentAgent.model || 'N/A'}
            />
            <div className="space-y-2">
              <Label className="text-muted-foreground flex items-center gap-2">
                <ToggleRight className="h-4 w-4" />
                Status
              </Label>
              <div className="p-3 bg-muted/50 rounded-md border border-border">
                <StatusBadge enabled={currentAgent.enabled} critical={currentAgent.critical} />
              </div>
            </div>
          </div>

          {/* Temperature & Max Tokens */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ReadOnlyField 
              icon={Thermometer} 
              label="Temperature" 
              value={currentAgent.temperature !== null ? currentAgent.temperature : 'Auto'}
            />
            <ReadOnlyField 
              icon={HardDrive} 
              label="Max Tokens" 
              value={currentAgent.max_tokens || 'Auto'}
            />
          </div>

          {/* Input/Output Types */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ReadOnlyField 
              icon={Target} 
              label="Input Type" 
              value={currentAgent.input_type || 'N/A'}
            />
            <ReadOnlyField 
              icon={Target} 
              label="Output Type" 
              value={currentAgent.output_type || 'N/A'}
              className={currentAgent.output_type === 'json' ? 'bg-green-50 border-green-200' : ''}
            />
          </div>

          {/* Token Budget */}
          <ReadOnlyField 
            icon={Zap} 
            label="Token Budget" 
            value={currentAgent.token_budget ? currentAgent.token_budget.toLocaleString() : 'N/A'}
          />

          {/* Goal */}
          <ReadOnlyField 
            icon={Target} 
            label="Goal" 
            value={currentAgent.goal || 'No goal specified'}
            className="min-h-[60px]"
          />

          {/* Success Criteria */}
          {currentAgent.success_criteria && currentAgent.success_criteria.length > 0 && (
            <div className="space-y-2">
              <Label className="text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Success Criteria
              </Label>
              <div className="p-3 bg-muted/50 rounded-md border border-border">
                <ul className="list-disc list-inside space-y-1">
                  {currentAgent.success_criteria.map((criteria, index) => (
                    <li key={index} className="text-foreground">{criteria}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Retry Policy */}
          {currentAgent.retry_policy && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ReadOnlyField 
                icon={Clock} 
                label="Max Retry Attempts" 
                value={currentAgent.retry_policy.max_attempts}
              />
              <ReadOnlyField 
                icon={Clock} 
                label="Retry Delay (seconds)" 
                value={currentAgent.retry_policy.delay_seconds}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AgentSettings;