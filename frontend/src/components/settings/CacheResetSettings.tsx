import React, { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Bell, SlidersHorizontal, Trash2, RefreshCcw, Database } from 'lucide-react'; // Added new icons
import { toast } from 'sonner';

const CacheResetSettings: React.FC = () => {
  // Removed old states that are no longer in the design
  // const [enableNotifications, setEnableNotifications] = useState(true);
  // const [animationSpeed, setAnimationSpeed] = useState([1]);

  const handleClearUICache = () => {
    // Simulate clearing UI cache
    toast.success("UI Cache cleared!");
  };

  const handleResetAllAgentCache = () => {
    // Simulate resetting all agent cache
    toast.success("All Agent Cache reset!");
  };

  const handleReIndexAgentData = () => {
    // Simulate re-indexing agent data
    toast.success("Agent Data re-indexed!");
  };

  return (
    <div className="space-y-6 p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Clear UI Cache Button */}
        {/* <Button variant="outline" onClick={handleClearUICache} className="w-full flex items-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80">
          <Trash2 className="h-4 w-4" /> Clear UI Cache
        </Button> */}

        {/* Reset All Agent Cache Button */}
        <Button variant="outline" onClick={handleResetAllAgentCache} className="w-full flex items-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80">
          <RefreshCcw className="h-4 w-4" /> Reset All Agent Cache
        </Button>

        {/* Re-Index Agent Data Button */}
        {/* <Button variant="outline" onClick={handleReIndexAgentData} className="w-full flex items-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80">
          <Database className="h-4 w-4" /> Re-Index Agent Data
        </Button> */}
      </div>
    </div>
  );
};

export default CacheResetSettings;