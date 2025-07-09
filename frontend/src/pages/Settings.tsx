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
    <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
      <HolographicCard className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-blue-600" /> General Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="dark-mode" className="text-gray-700 flex items-center gap-2">
              <Palette className="h-4 w-4" /> Enable Dark Mode
            </Label>
            <Switch id="dark-mode" />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="notifications" className="text-gray-700 flex items-center gap-2">
              <Bell className="h-4 w-4" /> Email Notifications
            </Label>
            <Switch id="notifications" defaultChecked />
          </div>
          <div>
            <Label htmlFor="api-key" className="text-gray-700 flex items-center gap-2 mb-2">
              <Key className="h-4 w-4" /> API Key
            </Label>
            <Input id="api-key" type="password" defaultValue="****************" className="bg-white/50 border-blue-300/50 text-gray-900" />
            <Button variant="outline" className="mt-2 bg-gray-100 text-gray-700 hover:bg-gray-200">Generate New Key</Button>
          </div>
        </CardContent>
      </HolographicCard>

      <HolographicCard>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Bell className="h-5 w-5 text-green-600" /> Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="critical-alerts" className="text-gray-700">Critical Alerts</Label>
            <Switch id="critical-alerts" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="daily-summary" className="text-gray-700">Daily Summary</Label>
            <Switch id="daily-summary" />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="marketing-updates" className="text-gray-700">Marketing Updates</Label>
            <Switch id="marketing-updates" />
          </div>
        </CardContent>
      </HolographicCard>

      <HolographicCard>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Key className="h-5 w-5 text-purple-600" /> Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="2fa" className="text-gray-700">Two-Factor Authentication</Label>
            <Switch id="2fa" />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="session-timeout" className="text-gray-700">Auto Logout (30 min)</Label>
            <Switch id="session-timeout" defaultChecked />
          </div>
          <Button className="w-full bg-red-600 hover:bg-red-700 text-white">Reset All Settings</Button>
        </CardContent>
      </HolographicCard>
    </div>
  );
};

export default Settings;