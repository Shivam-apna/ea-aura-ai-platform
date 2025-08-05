import React, { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Palette, Type, RotateCcw, SunMoon, LayoutDashboard } from 'lucide-react'; // Added SunMoon and LayoutDashboard icons
import { HexColorPicker } from "react-colorful";
import { useTheme } from '@/components/ThemeProvider';
import { rgbStringToHex } from '@/utils/color';
import { Switch } from '@/components/ui/switch'; // Import Switch

const ThemeSettings: React.FC = () => {
  const { 
    theme, // Get current theme from context
    setTheme, // Setter for theme
    availableFonts,
    themeColors, 
    selectedPrimaryColor,
    setSelectedPrimaryColor,
    previewPrimaryColorHex,
    setPreviewPrimaryColorHex,
    selectedFontThemeKey,
    setSelectedFontThemeKey,
    previewFontThemeKey,
    setPreviewFontThemeKey,
  } = useTheme();

  const defaultFontThemeName = availableFonts[0].name;

  const [colorInput, setColorInput] = useState<string>('');
  const [dashboardDensity, setDashboardDensity] = useState('comfortable'); // New state for dashboard density

  // Initialize colorInput when selectedPrimaryColor changes or on mount
  React.useEffect(() => {
    setColorInput(selectedPrimaryColor || themeColors[0].hex);
  }, [selectedPrimaryColor, themeColors]);

  // Determine the currently displayed color for the swatch and input field
  const currentDisplayColorHex = previewPrimaryColorHex || 
                                 selectedPrimaryColor ||
                                 themeColors[0].hex;

  // Ensure HexColorPicker always gets a valid hex string
  const pickerColor = currentDisplayColorHex && currentDisplayColorHex.startsWith('#') ? currentDisplayColorHex : themeColors[0].hex;

  const handleColorPickerChange = (newHex: string) => {
    setPreviewPrimaryColorHex(newHex);
    setColorInput(newHex); // Keep input field in sync with picker
  };

  const handleColorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value; // Get the raw input value
    setColorInput(value); // Update the input field immediately

    let hexValue: string | null = null;
    const trimmedValue = value.trim();
    if (trimmedValue.match(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/i)) {
      hexValue = trimmedValue;
    } else if (trimmedValue.match(/^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/)) {
      hexValue = rgbStringToHex(trimmedValue);
    }

    setPreviewPrimaryColorHex(hexValue);
  };

  const handleConfirmColor = () => {
    setSelectedPrimaryColor(previewPrimaryColorHex);
    setPreviewPrimaryColorHex(null); // Clear preview after confirming
  };

  const handleResetColor = () => {
    setSelectedPrimaryColor(null); // Set to null to use CSS defaults
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
    <div className="space-y-6 p-4">
      {/* Dark Mode */}
      <div className="flex items-center justify-between space-x-2">
        <Label htmlFor="dark-mode" className="text-muted-foreground flex items-center gap-2">
          <SunMoon className="h-4 w-4" /> Dark Mode
        </Label>
        <Switch
          id="dark-mode"
          checked={theme === 'dark'}
          onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
        />
      </div>

      {/* Theme Color Customization */}
      <div className="space-y-2">
        <Label className="text-muted-foreground flex items-center gap-2">
          <Palette className="h-4 w-4" /> Primary Color
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
            <PopoverContent className="w-auto p-4 neumorphic-card text-popover-foreground border border-border bg-card">
              <HexColorPicker color={pickerColor} onChange={handleColorPickerChange} className="w-full h-48 mb-4" />
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
            disabled={!previewPrimaryColorHex || (previewPrimaryColorHex === selectedPrimaryColor)}
          >
            Confirm Color
          </Button>
          <Button
            variant="outline"
            onClick={handleResetColor}
            className="flex-grow bg-secondary text-secondary-foreground hover:bg-secondary/80"
            disabled={selectedPrimaryColor === null && previewPrimaryColorHex === null}
          >
            Reset to Default
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Select a color using the picker or enter a hex/RGB code. The application will update instantly. Click "Confirm Color" to save your choice.
        </p>
      </div>

      {/* Dashboard Density */}
      <div className="space-y-2">
        <Label htmlFor="dashboard-density" className="text-muted-foreground flex items-center gap-2">
          <LayoutDashboard className="h-4 w-4" /> Dashboard Density
        </Label>
        <Select onValueChange={setDashboardDensity} value={dashboardDensity}>
          <SelectTrigger className="w-full bg-input border-border text-foreground">
            <SelectValue placeholder="Select density" />
          </SelectTrigger>
          <SelectContent className="neumorphic-card text-popover-foreground border border-border bg-card">
            <SelectItem value="comfortable">Comfortable</SelectItem>
            <SelectItem value="compact">Compact</SelectItem>
          </SelectContent>
        </Select>
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
          <SelectContent className="neumorphic-card text-popover-foreground border border-border bg-card">
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
        <div className="p-4 border border-border rounded-lg bg-muted">
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
    </div>
  );
};

export default ThemeSettings;