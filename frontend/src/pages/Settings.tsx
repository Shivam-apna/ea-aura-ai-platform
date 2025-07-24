import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon, Bell, Palette, Key } from 'lucide-react';
import { HolographicCard } from './Dashboard';

const Settings = () => {
  return (
    <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 h-full bg-background"> {/* Apply background to the page */}
      <HolographicCard className="lg:col-span-2 neumorphic-card"> {/* Apply neumorphic styling */}
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-blue-400" /> General Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="dark-mode" className="text-muted-foreground flex items-center gap-2">
              <Palette className="h-4 w-4" /> Enable Dark Mode
            </Label>
            <Switch id="dark-mode" className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted" />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="notifications" className="text-muted-foreground flex items-center gap-2">
              <Bell className="h-4 w-4" /> Email Notifications
            </Label>
            <Switch id="notifications" defaultChecked className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted" />
          </div>
          <div>
            <Label htmlFor="api-key" className="text-muted-foreground flex items-center gap-2 mb-2">
              <Key className="h-4 w-4" /> API Key
            </Label>
            <Input id="api-key" type="password" defaultValue="****************" className="bg-input border-border text-foreground placeholder:text-muted-foreground" />
            <Button variant="outline" className="mt-2 bg-secondary text-secondary-foreground hover:bg-secondary/80">Generate New Key</Button>
          </div>
        </CardContent>
      </HolographicCard>

      <HolographicCard className="neumorphic-card"> {/* Apply neumorphic styling */}
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Bell className="h-5 w-5 text-green-400" /> Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="critical-alerts" className="text-muted-foreground">Critical Alerts</Label>
            <Switch id="critical-alerts" defaultChecked className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted" />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="daily-summary" className="text-muted-foreground">Daily Summary</Label>
            <Switch id="daily-summary" className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted" />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="marketing-updates" className="text-muted-foreground">Marketing Updates</Label>
            <Switch id="marketing-updates" className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted" />
          </div>
        </CardContent>
      </HolographicCard>

      <HolographicCard className="neumorphic-card"> {/* Apply neumorphic styling */}
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Key className="h-5 w-5 text-purple-400" /> Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="2fa" className="text-muted-foreground">Two-Factor Authentication</Label>
            <Switch id="2fa" className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted" />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="session-timeout" className="text-muted-foreground">Auto Logout (30 min)</Label>
            <Switch id="session-timeout" defaultChecked className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted" />
          </div>
          <Button className="w-full bg-destructive hover:bg-destructive/80 text-destructive-foreground">Reset All Settings</Button>
        </CardContent>
      </HolographicCard>
    </div>
  );
};

export default Settings;