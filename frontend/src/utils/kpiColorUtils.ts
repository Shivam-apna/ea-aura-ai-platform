// utils/kpiColorUtils.ts

interface ColorRange {
    min: number;
    max: number;
    color: string;
    label: string;
    strokeColor: string;
}

interface StringColorRule {
    value: string;
    color: string;
    label: string;
    strokeColor: string;
}

interface KpiColorConfig {
    ranges?: ColorRange[];
    stringRules?: StringColorRule[];
    defaultColor: string;
    type: 'numeric' | 'string';
}

// Define color ranges for each KPI type using exact names
const KPI_COLOR_CONFIGS: Record<string, KpiColorConfig> = {
    // CES Score (Customer Effort Score) - Scale 1-10, lower is better
    'CES Score': {
        type: 'numeric',
        ranges: [
            { min: 0, max: 4, color: '#FFE8E8', strokeColor: '#FF0000', label: 'Poor' },
            { min: 4, max: 8, color: '#FFF7EC', strokeColor: '#FDB458', label: 'Good' },
            { min: 8, max: 10, color: '#D4F0A4', strokeColor: '#7BB13D', label: 'Excellent' }
        ],
        defaultColor: '#E5E7EB'
    },

    // NPS Score (Net Promoter Score) - Scale -100 to +100
    'NPS Score': {
        type: 'numeric',
        ranges: [
            { min: 0, max: 4, color: '#FFE8E8', strokeColor: '#FF0000', label: 'Poor' },
            { min: 4, max: 7, color: '#FFF7EC', strokeColor: '#FDB458', label: 'Positive' },
            { min: 7, max: 10, color: '#D4F0A4', strokeColor: '#7BB13D', label: 'Very Positive' }
        ],
        defaultColor: '#E5E7EB'
    },

    // Sentiment Score - Percentage 0-100%
    'Sentiment Score (%)': {
        type: 'numeric',
        ranges: [
            { min: 0, max: 40, color: '#FFE8E8', strokeColor: '#FF0000', label: 'Poor' },
            { min: 40, max: 70, color: '#FFF7EC', strokeColor: '#FDB458', label: 'Positive' },
            { min: 70, max: 100, color: '#D4F0A4', strokeColor: '#7BB13D', label: 'Very Positive' }
        ],
        defaultColor: '#E5E7EB'
    },

    // CSAT Score (Customer Satisfaction) - Percentage 0-100%
    'CSAT (%)': {
        type: 'numeric',
        ranges: [
            { min: 0, max: 40, color: '#FFE8E8', strokeColor: '#FF0000', label: 'Poor' },
            { min: 40, max: 70, color: '#FFF7EC', strokeColor: '#FDB458', label: 'Good' },
            { min: 70, max: 100, color: '#D4F0A4', strokeColor: '#7BB13D', label: 'Excellent' }
        ],
        defaultColor: '#E5E7EB'
    },
    'Gross Margin (%)': {
        type: 'numeric',
        ranges: [
            { min: 0, max: 40, color: '#FFE8E8', strokeColor: '#FF0000', label: 'Poor' },
            { min: 40, max: 70, color: '#FFF7EC', strokeColor: '#FDB458', label: 'Good' },
            { min: 70, max: 100, color: '#D4F0A4', strokeColor: '#7BB13D', label: 'Excellent' }
        ],
        defaultColor: '#E5E7EB'
    },
    'Net Profit Margin (%)': {
        type: 'numeric',
        ranges: [
            { min: 0, max: 10, color: '#FFE8E8', strokeColor: '#FF0000', label: 'Poor' },
            { min: 10, max: 20, color: '#FFF7EC', strokeColor: '#FDB458', label: 'Good' },
            { min: 20, max: 100, color: '#D4F0A4', strokeColor: '#7BB13D', label: 'Excellent' }
        ],
        defaultColor: '#E5E7EB'
    },
    // Add both variations of Conversion Rate to handle data inconsistencies
    'Conversion Rate (%)': {
        type: 'numeric',
        ranges: [
            { min: 0, max: 10, color: '#FFE8E8', strokeColor: '#FF0000', label: 'Poor' },
            { min: 10, max: 20, color: '#FFF7EC', strokeColor: '#FDB458', label: 'Good' },
            { min: 20, max: 100, color: '#D4F0A4', strokeColor: '#7BB13D', label: 'Excellent' }
        ],
        defaultColor: '#E5E7EB'
    },
    'Conversion Rate': {
        type: 'numeric',
        ranges: [
            { min: 0, max: 10, color: '#FFE8E8', strokeColor: '#FF0000', label: 'Poor' },
            { min: 10, max: 20, color: '#FFF7EC', strokeColor: '#FDB458', label: 'Good' },
            { min: 20, max: 100, color: '#D4F0A4', strokeColor: '#7BB13D', label: 'Excellent' }
        ],
        defaultColor: '#E5E7EB'
    },
    'GMROI': {
        type: 'numeric',
        ranges: [
            { min: 0, max: 1, color: '#FFE8E8', strokeColor: '#FF0000', label: 'Poor' },
            { min: 1, max: 2, color: '#FFF7EC', strokeColor: '#FDB458', label: 'Good' },
            { min: 2, max: 10, color: '#D4F0A4', strokeColor: '#7BB13D', label: 'Excellent' }
        ],
        defaultColor: '#E5E7EB'
    },
    'Engagement Rate + Reach': {
        type: 'numeric',
        ranges: [
            { min: 0, max: 40, color: '#FFE8E8', strokeColor: '#FF0000', label: 'Poor' },
            { min: 40, max: 70, color: '#FFF7EC', strokeColor: '#FDB458', label: 'Good' },
            { min: 70, max: 100, color: '#D4F0A4', strokeColor: '#7BB13D', label: 'Excellent' }
        ],
        defaultColor: '#E5E7EB'
    },
    'Avg Sentiment Score': {
        type: 'numeric',
        ranges: [
            { min: 0, max: 40, color: '#FFE8E8', strokeColor: '#FF0000', label: 'Poor' },
            { min: 40, max: 70, color: '#FFF7EC', strokeColor: '#FDB458', label: 'Positive' },
            { min: 70, max: 100, color: '#D4F0A4', strokeColor: '#7BB13D', label: 'Very Positive' }
        ],
        defaultColor: '#E5E7EB'
    },
    'Alignment Score (%)': {
        type: 'numeric',
        ranges: [
            { min: 0, max: 40, color: '#FFE8E8', strokeColor: '#FF0000', label: 'Poor' },
            { min: 40, max: 70, color: '#FFF7EC', strokeColor: '#FDB458', label: 'Positive' },
            { min: 70, max: 100, color: '#D4F0A4', strokeColor: '#7BB13D', label: 'Very Positive' }
        ],
        defaultColor: '#E5E7EB'
    },
    'Resource Allocation': {
        type: 'numeric',
        ranges: [
            { min: 0, max: 30000, color: '#FFE8E8', strokeColor: '#FF0000', label: 'Poor' },
            { min: 30000, max: 70000, color: '#FFF7EC', strokeColor: '#FDB458', label: 'Good' },
            { min: 70000, max: 100000000, color: '#D4F0A4', strokeColor: '#7BB13D', label: 'Excellent' }
        ],
        defaultColor: '#E5E7EB'
    },
    'Impact Metrics': {
        type: 'numeric',
        ranges: [
            { min: 0, max: 40, color: '#FFE8E8', strokeColor: '#FF0000', label: 'Poor' },
            { min: 40, max: 70, color: '#FFF7EC', strokeColor: '#FDB458', label: 'Good' },
            { min: 70, max: 100, color: '#D4F0A4', strokeColor: '#7BB13D', label: 'Excellent' }
        ],
        defaultColor: '#E5E7EB'
    },
    'Risks Identified': {
        type: 'string',
        stringRules: [
            { value: 'No Risks Identified', color: '#D4F0A4', strokeColor: '#7BB13D', label: 'No Risks' },
            // For any other string value, it will fall back to defaultColor (red)
        ],
        defaultColor: '#FFE8E8' // Red for any risks identified
    },
    'Page Views': {
        type: 'numeric',
        ranges: [
            { min: 0, max: 3000, color: '#FFE8E8', strokeColor: '#FF0000', label: 'Poor' },
            { min: 3000, max: 7000, color: '#FFF7EC', strokeColor: '#FDB458', label: 'Good' },
            { min: 7000, max: 1000000000, color: '#D4F0A4', strokeColor: '#7BB13D', label: 'Excellent' }
        ],
        defaultColor: '#E5E7EB'
    },
    'Audience Growth': {
        type: 'numeric',
        ranges: [
            { min: 0, max: 20, color: '#FFE8E8', strokeColor: '#FF0000', label: 'Poor' },
            { min: 20, max: 50, color: '#FFF7EC', strokeColor: '#FDB458', label: 'Good' },
            { min: 50, max: 100, color: '#D4F0A4', strokeColor: '#7BB13D', label: 'Excellent' }
        ],
        defaultColor: '#E5E7EB'
    },
    'Engagement Rate (%)': {
        type: 'numeric',
        ranges: [
            { min: 0, max: 40, color: '#FFE8E8', strokeColor: '#FF0000', label: 'Poor' },
            { min: 40, max: 70, color: '#FFF7EC', strokeColor: '#FDB458', label: 'Good' },
            { min: 70, max: 100, color: '#D4F0A4', strokeColor: '#7BB13D', label: 'Excellent' }
        ],
        defaultColor: '#E5E7EB'
    },
    'Bounce Rate (%)': {
        type: 'numeric',
        ranges: [
            { min: 0, max: 40, color: '#FFE8E8', strokeColor: '#FF0000', label: 'Poor' },
            { min: 40, max: 70, color: '#FFF7EC', strokeColor: '#FDB458', label: 'Good' },
            { min: 70, max: 100, color: '#D4F0A4', strokeColor: '#7BB13D', label: 'Excellent' }
        ],
        defaultColor: '#E5E7EB'
    }
};

/**
 * Normalizes a KPI name by extracting only letters for matching
 */
function normalizeKpiName(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z]/g, ''); // Keep only letters, remove everything else
}

/**
 * Gets the exact KPI name as it appears in the data with normalization fallback
 */
function getKpiKey(kpiName: string): string {
    // First try exact match
    if (KPI_COLOR_CONFIGS[kpiName]) {
        return kpiName;
    }

    // If no exact match, try normalized matching
    const normalizedInput = normalizeKpiName(kpiName);

    for (const configKey of Object.keys(KPI_COLOR_CONFIGS)) {
        const normalizedConfigKey = normalizeKpiName(configKey);
        if (normalizedInput === normalizedConfigKey) {
            return configKey;
        }
    }

    console.warn("❌ No match found for:", kpiName);
    // No match found
    return kpiName;
}

/**
 * Helper function to extract numeric value from string or number
 */
function extractNumericValue(value: number | string): number | undefined {
    if (typeof value === 'number') {
        return value;
    }
    if (typeof value === 'string') {
        const match = value.match(/-?\d+(\.\d+)?/); // find first number, including decimals and negative
        if (match) {
            return parseFloat(match[0]);
        }
    }
    return undefined;
}

/**
 * Gets the background color for a KPI based on its name and value (supports both string and numeric values)
 */
export function getKpiBgColor(
    kpiName: string,
    value: number | string | undefined,
    fallbackColor: string = '#E5E7EB'
): string {
    // Return fallback if value is invalid
    if (value === undefined || value === null) {
        return fallbackColor;
    }

    const kpiKey = getKpiKey(kpiName);
    const config = KPI_COLOR_CONFIGS[kpiKey];

    if (!config) {
        console.warn(`No color configuration found for KPI: "${kpiName}"`);
        return fallbackColor;
    }

    // Handle string-based KPIs
    if (config.type === 'string' && typeof value === 'string') {
        if (config.stringRules) {
            for (const rule of config.stringRules) {
                if (value.trim() === rule.value) {
                    return rule.color;
                }
            }
        }
        // Return default color for any other string value
        return config.defaultColor || fallbackColor;
    }

    // Handle numeric KPIs
    if (config.type === 'numeric') {
        const numericValue = extractNumericValue(value);

        if (numericValue !== undefined && config.ranges) {
            for (const range of config.ranges) {
                if (numericValue >= range.min && numericValue <= range.max) {
                    return range.color;
                }
            }
        }

        return config.defaultColor || fallbackColor;
    }

    // Type mismatch or invalid value
    return config.defaultColor || fallbackColor;
}

/**
 * Gets the color range information for a KPI (supports both string and numeric values)
 */
export function getKpiColorInfo(
    kpiName: string,
    value: number | string | undefined
): { color: string; label: string; range?: string; value?: string; strokeColor?: string } | null {
    if (value === undefined || value === null) {
        return null;
    }

    const kpiKey = getKpiKey(kpiName);
    const config = KPI_COLOR_CONFIGS[kpiKey];

    if (!config) {
        console.warn(`No color configuration found for KPI: "${kpiName}"`);
        return null;
    }

    // Handle string-based KPIs
    if (config.type === 'string' && typeof value === 'string') {
        if (config.stringRules) {
            for (const rule of config.stringRules) {
                if (value.trim() === rule.value) {
                    return {
                        color: rule.color,
                        label: rule.label,
                        value: rule.value,
                        strokeColor: rule.strokeColor
                    };
                }
            }
        }
        // Return info for default color
        return {
            color: config.defaultColor,
            label: 'Risk Identified',
            value: value.trim(),
            strokeColor: '#FF0000'
        };
    }

    // Handle numeric KPIs - updated to use extractNumericValue helper
    if (config.type === 'numeric') {
        const numericValue = extractNumericValue(value);

        if (numericValue !== undefined && !isNaN(numericValue) && config.ranges) {
            for (const range of config.ranges) {
                if (numericValue >= range.min && numericValue <= range.max) {
                    return {
                        color: range.color,
                        label: range.label,
                        range: `${range.min}-${range.max}`,
                        strokeColor: range.strokeColor
                    };
                }
            }
        }
    }

    return null;
}

/**
 * Gets all available KPI configurations
 */
export function getAllKpiConfigs(): Record<string, KpiColorConfig> {
    return KPI_COLOR_CONFIGS;
}

/**
 * Adds or updates a KPI color configuration
 */
export function setKpiColorConfig(kpiKey: string, config: KpiColorConfig): void {
    KPI_COLOR_CONFIGS[kpiKey] = config;
}

/**
 * Gets the text color that contrasts well with the background color
 */
export function getContrastTextColor(backgroundColor: string): string {
    // Convert hex to RGB
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return black for light backgrounds, white for dark backgrounds
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

/**
 * Debug function to test KPI color mapping
 */
export function debugKpiColors(kpiKeys: string[]): void {
    kpiKeys.forEach(key => {
        const kpiKey = getKpiKey(key);
        const config = KPI_COLOR_CONFIGS[kpiKey];
        if (config) {
            if (config.type === 'numeric' && config.ranges) {
            } else if (config.type === 'string' && config.stringRules) {
            }
        }
    });
}

export type { ColorRange, KpiColorConfig, StringColorRule };