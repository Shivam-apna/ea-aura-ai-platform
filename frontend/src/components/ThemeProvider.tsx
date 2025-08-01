import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { hexToHsl, hslToString, hexToRgb, rgbToHex } from '@/utils/color';

type Theme = 'dark' | 'light' | 'system';

// Predefined theme colors
const THEME_COLORS = [
  { name: 'Default', hex: '#222222' }, // A dark grey, close to original primary
  { name: 'Blue', hex: '#3B82F6' }, // Tailwind blue-500
  { name: 'Green', hex: '#22C55E' }, // Tailwind green-500
  { name: 'Purple', hex: '#8B5CF6' }, // Tailwind purple-500
  { name: 'Red', hex: '#EF4444' },   // Tailwind red-500
  { name: 'Orange', hex: '#F97316' }, // Tailwind orange-500
  { name: 'Teal', hex: '#14B8A6' },  // Tailwind teal-500
  { name: 'Indigo', hex: '#6366F1' }, // Tailwind indigo-500
  { name: 'Pink', hex: '#EC4899' },  // Tailwind pink-500
  { name: 'Cyan', hex: '#06B6D4' },  // Tailwind cyan-500
  { name: 'Yellow', hex: '#EAB308' }, // Tailwind yellow-500
];

// New FONT_THEMES definition
const FONT_THEMES = [
  {
    name: 'Professional',
    primary: 'Inter, sans-serif',
    secondary: 'Roboto, sans-serif',
    monospace: '"Fira Code", monospace',
  },
  {
    name: 'Creative',
    primary: 'Poppins, sans-serif',
    secondary: 'Nunito, sans-serif',
    monospace: '"JetBrains Mono", monospace',
  },
  {
    name: 'Traditional',
    primary: 'Merriweather, serif',
    secondary: 'Georgia, serif',
    monospace: '"Courier New", monospace',
  },
  {
    name: 'Modern',
    primary: 'Outfit, sans-serif',
    secondary: '"Plus Jakarta Sans", sans-serif',
    monospace: '"Space Mono", monospace',
  },
  {
    name: 'Readable',
    primary: '"Source Sans Pro", sans-serif',
    secondary: 'Lato, sans-serif',
    monospace: '"IBM Plex Mono", monospace',
  },
  {
    name: 'Minimalist',
    primary: '"Open Sans", sans-serif',
    secondary: 'Lato, sans-serif',
    monospace: '"Roboto Mono", monospace',
  },
  {
    name: 'Geometric',
    primary: 'Montserrat, sans-serif',
    secondary: 'Raleway, sans-serif',
    monospace: '"Source Code Pro", monospace',
  },
  {
    name: 'Elegant',
    primary: '"Playfair Display", serif',
    secondary: 'Lora, serif',
    monospace: 'Inconsolata, monospace',
  },
];

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  primaryColorStorageKey?: string;
  fontThemeStorageKey?: string; // New storage key
}

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  availableFonts: typeof FONT_THEMES; // Changed to FONT_THEMES
  themeColors: typeof THEME_COLORS;
  selectedPrimaryColor: string | null; // Stores the *actual hex* of the selected color
  setSelectedPrimaryColor: (hex: string | null) => void;
  previewPrimaryColorHex: string | null; // Temporary preview hex
  setPreviewPrimaryColorHex: (hex: string | null) => void;
  selectedFontThemeKey: string | null; // New
  setSelectedFontThemeKey: (key: string | null) => void; // New
  previewFontThemeKey: string | null; // New
  setPreviewFontThemeKey: (key: string | null) => void; // New
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'dark',
  storageKey = 'vite-ui-theme',
  primaryColorStorageKey = 'vite-ui-primary-color', // Changed storage key name for clarity
  fontThemeStorageKey = 'vite-ui-font-theme', // New default
}) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem(storageKey);
    if (storedTheme) return storedTheme as Theme;
    if (defaultTheme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return defaultTheme;
  });

  const [selectedPrimaryColor, setSelectedPrimaryColorState] = useState<string | null>(() => {
    return localStorage.getItem(primaryColorStorageKey); // Directly store/retrieve hex
  });

  const [previewPrimaryColorHex, setPreviewPrimaryColorHexState] = useState<string | null>(null); // New state for temporary preview

  const [selectedFontThemeKey, setSelectedFontThemeKeyState] = useState<string | null>(() => {
    return localStorage.getItem(fontThemeStorageKey);
  });

  const [previewFontThemeKey, setPreviewFontThemeKeyState] = useState<string | null>(null);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    let targetHex: string | null = null;

    // Priority: 1. Preview color (if set), 2. Selected persistent color (if set), 3. Default from THEME_COLORS
    if (previewPrimaryColorHex) {
      targetHex = previewPrimaryColorHex;
    } else if (selectedPrimaryColor) { // Use selectedPrimaryColor (which is already a hex)
      targetHex = selectedPrimaryColor;
    } else { // Fallback to default THEME_COLORS[0] if no custom or named color is selected
      targetHex = THEME_COLORS[0].hex; // Default 'Default' color hex
    }

    if (targetHex) {
      const hsl = hexToHsl(targetHex);
      if (hsl) {
        const [h, s, l] = hsl;
        // Set --primary directly as HSL string
        root.style.setProperty('--primary', `${h} ${s}% ${l}%`);

        // Dynamically set primary-foreground lightness based on primary's lightness
        const foregroundL = l < 50 ? '98%' : '11.2%'; // Light foreground for dark primary, dark foreground for light primary
        root.style.setProperty('--primary-foreground', `${h} ${s}% ${foregroundL}`);
      }
    } else {
      // This else block should ideally not be hit if a default is always provided
      // Reset to default primary colors defined in globals.css by removing inline styles
      root.style.removeProperty('--primary');
      root.style.removeProperty('--primary-foreground');
    }

    // Persist the selected color (only the confirmed one)
    if (selectedPrimaryColor) {
      localStorage.setItem(primaryColorStorageKey, selectedPrimaryColor);
    } else {
      localStorage.removeItem(primaryColorStorageKey);
    }
  }, [selectedPrimaryColor, previewPrimaryColorHex, primaryColorStorageKey, theme]); // Add previewPrimaryColorHex to dependencies

  // New useEffect for font themes
  useEffect(() => {
    const root = window.document.documentElement;
    let targetFontTheme = null;

    if (previewFontThemeKey) {
      targetFontTheme = FONT_THEMES.find(theme => theme.name === previewFontThemeKey);
    } else if (selectedFontThemeKey) {
      targetFontTheme = FONT_THEMES.find(theme => theme.name === selectedFontThemeKey);
    }

    if (targetFontTheme) {
      root.style.setProperty('--font-primary', targetFontTheme.primary);
      root.style.setProperty('--font-secondary', targetFontTheme.secondary);
      root.style.setProperty('--font-monospace', targetFontTheme.monospace);
    } else {
      // Reset to default fonts defined in globals.css
      root.style.removeProperty('--font-primary');
      root.style.removeProperty('--font-secondary');
      root.style.removeProperty('--font-monospace');
    }

    if (selectedFontThemeKey) {
      localStorage.setItem(fontThemeStorageKey, selectedFontThemeKey);
    } else {
      localStorage.removeItem(fontThemeStorageKey);
    }
  }, [selectedFontThemeKey, previewFontThemeKey, fontThemeStorageKey]);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem(storageKey, newTheme);
    setThemeState(newTheme);
  };

  const setSelectedPrimaryColor = (hex: string | null) => {
    setSelectedPrimaryColorState(hex);
  };

  const setPreviewPrimaryColorHex = (hex: string | null) => {
    setPreviewPrimaryColorHexState(hex);
  };

  const setSelectedFontTheme = (key: string | null) => {
    setSelectedFontThemeKeyState(key);
  };

  const setPreviewFontTheme = (key: string | null) => {
    setPreviewFontThemeKeyState(key);
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      setTheme, 
      availableFonts: FONT_THEMES, // Changed to FONT_THEMES
      themeColors: THEME_COLORS,
      selectedPrimaryColor, // Expose the new state
      setSelectedPrimaryColor, // Expose the new setter
      previewPrimaryColorHex, // Expose preview state
      setPreviewPrimaryColorHex, // Expose preview setter
      selectedFontThemeKey, // New
      setSelectedFontThemeKey: setSelectedFontTheme, // New
      previewFontThemeKey, // New
      setPreviewFontThemeKey: setPreviewFontTheme, // New
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};