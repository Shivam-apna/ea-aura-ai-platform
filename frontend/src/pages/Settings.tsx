import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Settings as SettingsIcon, Type, Palette, RotateCcw, Bell, SlidersHorizontal, Database, Key, Zap, Globe, HardDrive, Trash2 } from 'lucide-react';
import { HolographicCard } from './Dashboard';
import { useTheme } from '@/components/ThemeProvider';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { rgbStringToHex } from '@/utils/color'; // Import the new utility
import { HexColorPicker } from "react-colorful"; // Import HexColorPicker

const Settings = () => {
  const { 
    availableFonts, // Now FONT_THEMES
    themeColors, 
    selectedPrimaryColorKey, 
    setSelectedPrimaryColorKey,
    previewPrimaryColorHex,
    setPreviewPrimaryColorHex,
    selectedFontThemeKey, // New
    setSelectedFontThemeKey, // New
    previewFontThemeKey, // New
    setPreviewFontThemeKey, // New
  } = useTheme();

  const defaultFontThemeName = availableFonts[0].name; // 'Professional'

  // Local state for the hex/RGB input field
  const [colorInput, setColorInput] = useState<string>('');

  // Dummy states for other settings
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState([1]); // Slider value
  const [dataRefreshInterval, setDataRefreshInterval] = useState('30s');
  const [enableBetaFeatures, setEnableBetaFeatures] = useState(false);
  const [apiEndpoint, setApiEndpoint] = useState('https://api.example.com/v1');
  const [defaultDataView, setDefaultDataView] = useState('table');
  const [notificationSound, setNotificationSound] = useState('default');

  // Determine the currently displayed color for the swatch and input field
  const currentDisplayColorHex = previewPrimaryColorHex || 
                                 (selectedPrimaryColorKey ? themeColors.find(c => c.name === selectedPrimaryColorKey)?.hex : null) ||
                                 themeColors[0].hex; // Fallback to default theme color hex

  // Update color input field when previewPrimaryColorHex or selectedPrimaryColorKey changes
  useEffect(() => {
    setColorInput(currentDisplayColorHex || '');
  }, [currentDisplayColorHex]);

  const handleColorPickerChange = (newHex: string) => {
    setPreviewPrimaryColorHex(newHex);
    setColorInput(newHex); // Keep input field in sync with picker
  };

  const handleColorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    setColorInput(value);

    let hexValue: string | null = null;
    if (value.match(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)) {
      hexValue = value; // It's a valid hex
    } else if (value.match(/^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/)) {
      hexValue = rgbStringToHex(value); // Convert RGB string to hex
    }

    setPreviewPrimaryColorHex(hexValue);
  };

  const handleConfirmColor = () => {
    // Find the name of the color that matches the current preview hex
    // If the hex doesn't match a predefined name, we'll store it as null for the key
    const confirmedColorName = themeColors.find(color => color.hex.toLowerCase() === (previewPrimaryColorHex || '').toLowerCase())?.name || null;
    setSelectedPrimaryColorKey(confirmedColorName);
    setPreviewPrimaryColorHex(null); // Clear preview after confirming
  };

  const handleResetColor = () => {
    setSelectedPrimaryColorKey(null); // Set to null to use CSS defaults
    setPreviewPrimaryColorHex(null); // Also reset preview
  };

  // Font Theme Handlers
  const currentDisplayFontThemeName = previewFontThemeKey || selectedFontThemeKey || defaultFontThemeName;
  const previewTheme = availableFonts.find(theme => theme.name === currentDisplayFontThemeName) || availableFonts[0];

  const handleConfirmFontTheme = () => {
    setSelectedFontThemeKey(previewFontThemeKey);
    setPreviewFontThemeKey(null); // Clear preview after confirming
  };

  const handleResetFontTheme = () => {
    setSelectedFontThemeKey(null); // Set to null to use CSS defaults
    setPreviewFontThemeKey(null); // Also reset preview
  };

  return (
    <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 h-full bg-background">
      {/* General Settings Card */}
      <HolographicCard className="neumorphic-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-blue-400" /> General Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme Color Customization */}
          <div className="space-y-2">
            <Label className="text-muted-foreground flex items-center gap-2">
              <Palette className="h-4 w-4" /> Choose Primary Color
            </Label>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80">
                    <div
                      className="w-5 h-5 rounded-full border border-border"
                      style={{ backgroundColor: currentDisplayColorHex }}
                    ></div>
                    Choose Color
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4 neumorphic-card text-popover-foreground border border-border">
                  <HexColorPicker color={colorInput} onChange={handleColorPickerChange} className="w-full h-48 mb-4" />
                  <div className="space-y-2">
                    <Label htmlFor="color-input" className="text-muted-foreground">Enter Hex or RGB:</Label>
                    <Input
                      id="color-input"
                      value={colorInput}
                      onChange={handleColorInputChange}
                      placeholder="#RRGGBB or rgb(R,G,B)"
                      className="bg-input border-border text-foreground"
                    />
                  </div>
                </PopoverContent>
              </Popover>
              <Button
                variant="default"
                onClick={handleConfirmColor}
                className="flex-grow"
                disabled={!previewPrimaryColorHex || (previewPrimaryColorHex === (selectedPrimaryColorKey ? themeColors.find(c => c.name === selectedPrimaryColorKey)?.hex : null))}
              >
                Confirm Color
              </Button>
              <Button
                variant="outline"
                onClick={handleResetColor}
                className="flex-grow bg-secondary text-secondary-foreground hover:bg-secondary/80"
                disabled={selectedPrimaryColorKey === null && previewPrimaryColorHex === null}
              >
                Reset to Default
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Select a color using the picker or enter a hex/RGB code. The application will update instantly. Click "Confirm Color" to save your choice.
            </p>
          </div>

          {/* Application Font Theme */}
          <div className="space-y-2">
            <Label htmlFor="font-theme-picker" className="text-muted-foreground flex items-center gap-2">
              <Type className="h-4 w-4" /> Choose Font Theme
            </Label>
            <Select
              value={previewFontThemeKey || selectedFontThemeKey || defaultFontThemeName}
              onValueChange={(value) => setPreviewFontThemeKey(value)}
            >
              <SelectTrigger className="w-full bg-input border-border text-foreground">
                <SelectValue placeholder="Select font theme" />
              </SelectTrigger>
              <SelectContent className="neumorphic-card text-popover-foreground border border-border">
                {availableFonts.map((fontTheme) => (
                  <SelectItem
                    key={fontTheme.name}
                    value={fontTheme.name}
                    className="focus:bg-accent focus:text-accent-foreground"
                  >
                    {fontTheme.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="default"
              onClick={handleConfirmFontTheme}
              className="w-full"
              disabled={!previewFontThemeKey || (previewFontThemeKey === selectedFontThemeKey)}
            >
              Confirm Font Theme
            </Button>
            <Button
              variant="outline"
              onClick={handleResetFontTheme}
              className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 flex items-center gap-2"
              disabled={selectedFontThemeKey === null && previewFontThemeKey === null}
            >
              <RotateCcw className="h-4 w-4" /> Reset to Default Fonts
            </Button>
            <div className="p-4 border border-border rounded-lg">
              <p className="text-muted-foreground mb-2">Preview:</p>
              <h3 className="text-xl font-bold mb-2" style={{ fontFamily: previewTheme.primary }}>
                Heading Example: The quick brown fox
              </h3>
              <p className="text-base mb-2" style={{ fontFamily: previewTheme.secondary }}>
                Body Example: Jumps over the lazy dog. 1234567890.
              </p>
              <code className="block p-2 bg-muted rounded-md text-sm" style={{ fontFamily: previewTheme.monospace }}>
                console.log("Hello, World!");
              </code>
            </div>
            <p className="text-xs text-muted-foreground">
              Select a font theme to preview changes. Click "Confirm Font Theme" to apply it across the app. Reset to default if necessary.
            </p>
          </div>

          {/* Dummy: Enable Notifications */}
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="enable-notifications" className="text-muted-foreground flex items-center gap-2">
              <Bell className="h-4 w-4" /> Enable Notifications
            </Label>
            <Switch
              id="enable-notifications"
              checked={enableNotifications}
              onCheckedChange={setEnableNotifications}
            />
          </div>

          {/* Dummy: Interface Responsiveness */}
          <div className="space-y-2">
            <Label htmlFor="animation-speed" className="text-muted-foreground flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" /> Interface Responsiveness
            </Label>
            <Slider
              id="animation-speed"
              defaultValue={[1]}
              max={2}
              step={0.5}
              value={animationSpeed}
              onValueChange={setAnimationSpeed}
              className="w-[60%]"
            />
            <p className="text-sm text-muted-foreground">Current: {animationSpeed[0]}x</p>
          </div>
        </CardContent>
      </HolographicCard>

      {/* Advanced Settings Card */}
      <HolographicCard className="neumorphic-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-400" /> Advanced Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dummy: API Endpoint URL */}
          <div className="space-y-2">
            <Label htmlFor="api-endpoint" className="text-muted-foreground flex items-center gap-2">
              <Globe className="h-4 w-4" /> API Endpoint URL
            </Label>
            <Input
              id="api-endpoint"
              type="url"
              value={apiEndpoint}
              onChange={(e) => setApiEndpoint(e.target.value)}
              className="bg-input border-border text-foreground"
            />
          </div>

          {/* Dummy: Default Data View */}
          <div className="space-y-2">
            <Label htmlFor="default-data-view" className="text-muted-foreground flex items-center gap-2">
              <Database className="h-4 w-4" /> Default Data View
            </Label>
            <Select onValueChange={setDefaultDataView} value={defaultDataView}>
              <SelectTrigger className="w-full bg-input border-border text-foreground">
                <SelectValue placeholder="Select default view" />
              </SelectTrigger>
              <SelectContent className="neumorphic-card text-popover-foreground border border-border">
                <SelectItem value="table">Table View</SelectItem>
                <SelectItem value="chart">Chart View</SelectItem>
                <SelectItem value="summary">Summary View</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dummy: Data Refresh Interval */}
          <div className="space-y-2">
            <Label htmlFor="data-refresh-interval" className="text-muted-foreground flex items-center gap-2">
              <HardDrive className="h-4 w-4" /> Data Refresh Interval
            </Label>
            <Select onValueChange={setDataRefreshInterval} value={dataRefreshInterval}>
              <SelectTrigger className="w-full bg-input border-border text-foreground">
                <SelectValue placeholder="Select interval" />
              </SelectTrigger>
              <SelectContent className="neumorphic-card text-popover-foreground border border-border">
                <SelectItem value="5s">5 Seconds</SelectItem>
                <SelectItem value="15s">15 Seconds</SelectItem>
                <SelectItem value="30s">30 Seconds</SelectItem>
                <SelectItem value="1min">1 Minute</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dummy: Notification Sound */}
          <div className="space-y-2">
            <Label className="text-muted-foreground flex items-center gap-2">
              <Bell className="h-4 w-4" /> Notification Sound
            </Label>
            <RadioGroup onValueChange={setNotificationSound} value={notificationSound} className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="default" id="r1" />
                <Label htmlFor="r1">Default</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="alert" id="r2" />
                <Label htmlFor="r2">Alert</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="silent" id="r3" />
                <Label htmlFor="r3">Silent</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Dummy: Enable Beta Features */}
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="enable-beta" className="text-muted-foreground flex items-center gap-2">
              <Zap className="h-4 w-4" /> Enable Beta Features
            </Label>
            <Switch
              id="enable-beta"
              checked={enableBetaFeatures}
              onCheckedChange={setEnableBetaFeatures}
            />
          </div>

          {/* Dummy: Clear Cache Button */}
          <Button variant="destructive" className="w-full flex items-center gap-2">
            <Trash2 className="h-4 w-4" /> Clear Application Cache
          </Button>
        </CardContent>
      </HolographicCard>
    </div>
  );
};

export default Settings;