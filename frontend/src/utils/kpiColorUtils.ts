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
    strokeColor: string
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
    // 1. ✅ Customer Effort Score
    'CES Score': {
        type: 'numeric',
        ranges: [
            { min: 0, max: 4, color: '#FFE8E8', strokeColor: '#FF0000', label: 'Customer Effort Score (CES), which reflects how easy it is for customers to interact with us, is in the poor range — showing customers face challenges in their journey.'},
            { min: 5, max: 7, color: '#FFF7EC', strokeColor: '#FDB458', label: 'Customer Effort Score (CES), measuring ease of interactions, is in the good range — indicating a generally smooth experience with room for improvement.'},
            { min: 8, max: 10, color: '#D4F0A4', strokeColor: '#7BB13D', label: 'Customer Effort Score (CES), reflecting ease of engagement, is in the excellent range — highlighting seamless and effortless customer experiences.' }
        ],
        defaultColor: '#FFF'
    },

    // 2. ✅ Net Promoter Score
    'NPS Score': {
        type: 'numeric',
        ranges: [
            { min: 0, max: 4, color: '#FFE8E8', strokeColor: '#FF0000', label: 'Net Promoter Score (NPS), which indicates customer loyalty and advocacy, is in the poor range — showing limited willingness to recommend.'},
            { min: 5, max: 7, color: '#FFF7EC', strokeColor: '#FDB458', label: 'Net Promoter Score (NPS), reflecting likelihood to recommend, is in the positive range — showing encouraging advocacy with potential to grow stronger.' },
            { min: 8, max: 10, color: '#D4F0A4', strokeColor: '#7BB13D', label: 'Net Promoter Score (NPS), measuring customer loyalty, is in the very positive range — highlighting strong advocacy and brand promoters.' }
        ],
        defaultColor: '#FFF'
    },

    // 3. ✅ Sentiment Score
    'Sentiment Score (%)': {
        type: 'numeric',
        ranges: [
            { min: 0, max: 40, color: '#FFE8E8', strokeColor: '#FF0000', label: 'Sentiment Score, which reflects customer emotions from feedback, is in the negative range — showing dissatisfaction and concerns in perception.' },
            { min: 41, max: 70, color: '#FFF7EC', strokeColor: '#FDB458', label: 'Sentiment Score is in the neutral range — reflecting a balanced perception with opportunities to strengthen positivity.' },
            { min: 71, max: 100, color: '#D4F0A4', strokeColor: '#7BB13D', label: 'Sentiment Score is in the positive range — showing favorable customer emotions and strong brand perception.'}
        ],
        defaultColor: '#FFF'
    },

    // 4. ✅ Customer Satisfaction
    'CSAT (%)': {
        type: 'numeric',
        ranges: [
            { min: 0, max: 40, color: '#FFE8E8', strokeColor: '#FF0000', label: 'Customer Satisfaction Score (CSAT), which measures satisfaction levels, is in the low range — indicating dissatisfaction with experiences.' },
            { min: 41, max: 70, color: '#FFF7EC', strokeColor: '#FDB458', label: 'Customer Satisfaction Score (CSAT) is in the moderate range — showing mixed satisfaction with scope to improve consistency.' },
            { min: 71, max: 100, color: '#D4F0A4', strokeColor: '#7BB13D', label: 'Customer Satisfaction Score (CSAT) is in the high range — reflecting strong satisfaction and positive experiences.' }
        ],
        defaultColor: '#FFF'
    },

    // 5. ✅ Gross Profit Margin
    'Gross Profit Margin (%)': {
        type: 'numeric',
        ranges: [
            { min: 0, max: 40, color: '#FFE8E8', strokeColor: '#FF0000', label: 'Gross Profit Margin, which measures profitability after production costs, is in the low range — signaling pressure on profitability.' },
            { min: 41, max: 70, color: '#FFF7EC', strokeColor: '#FDB458', label: 'Gross Profit Margin is in the moderate range — indicating reasonable profitability with room to improve efficiency.'},
            { min: 71, max: 100, color: '#D4F0A4', strokeColor: '#7BB13D', label: 'Gross Profit Margin is in the high range — reflecting strong profitability and efficient cost management.' }
        ],
        defaultColor: '#FFF'
    },

    // 6. ✅ COGS
    'COGS': {
        type: 'numeric',
        ranges: [
            { min: 0, max: 10, color: '#FFE8E8', strokeColor: '#FF0000', label: 'COGS, which reflects profitability after all expenses, is in the low range — indicating limited retained earnings.' },
            { min: 11, max: 20, color: '#FFF7EC', strokeColor: '#FDB458', label: 'COGS is in the moderate range — showing stable profitability with scope for improvement.' },
            { min: 21, max: 100, color: '#D4F0A4', strokeColor: '#7BB13D', label: 'COGS is in the high range — highlighting strong profitability and efficient financial management.' }
        ],
        defaultColor: '#FFF'
    },

    // 7. ✅ Conversion Rate (%)
    'Conversion Rate (%)': {
        type: 'numeric',
        ranges: [
            { min: 0, max: 10, color: '#FFE8E8', strokeColor: '#FF0000', label: 'Conversion Rate, which tracks the percentage of users who complete desired actions, is in the low range — showing limited effectiveness in turning visitors into customers.' },
            { min: 11, max: 20, color: '#FFF7EC', strokeColor: '#FDB458', label: 'Conversion Rate is in the moderate range — reflecting fair performance with opportunities to boost conversions.' },
            { min: 21, max: 100, color: '#D4F0A4', strokeColor: '#7BB13D', label: 'Conversion Rate is in the high range — highlighting effective conversion strategies and strong performance.' }
        ],
        defaultColor: '#FFF'
    },

    // 8. ✅ Conversion Rate (absolute measure)
    'Conversion Rate': {
        type: 'numeric',
        ranges: [
            { min: 0, max: 10, color: '#FFE8E8', strokeColor: '#FF0000', label: 'Conversion Rate, which measures the actual number of users converting, is in the low range — indicating limited outcomes.' },
            { min: 11, max: 20, color: '#FFF7EC', strokeColor: '#FDB458', label: 'Conversion Rate is in the moderate range — showing decent results with space to scale further.' },
            { min: 21, max: 100, color: '#D4F0A4', strokeColor: '#7BB13D', label: 'Conversion Rate is in the high range — reflecting strong performance in achieving conversions.' }
        ],
        defaultColor: '#FFF'
    },

    // 9. ✅ GMROI
    'GMROI': {
        type: 'numeric',
        ranges: [
            { min: 0, max: 1, color: '#FFE8E8', strokeColor: '#FF0000', label: 'Gross Profit Margin Return on Investment (GMROI) is in the poor range — showing low return on inventory investments.' },
            { min: 2, max: 5, color: '#FFF7EC', strokeColor: '#FDB458', label: 'Gross Profit Margin Return on Investment (GMROI) is in the fair range — indicating balanced returns with potential to optimize.' },
            { min: 6, max: 10, color: '#D4F0A4', strokeColor: '#7BB13D', label: 'Gross Profit Margin Return on Investment (GMROI) is in the strong range — reflecting efficient inventory management and profitability.' }
        ],
        defaultColor: '#FFF'
    },

    // 10. ✅ Engagement Rate + Reach
    'Engagement Rate + Reach': {
        type: 'numeric',
        ranges: [
            { min: 0, max: 40, color: '#FFE8E8', strokeColor: '#FF0000', label: 'Engagement Rate + Reach, which captures audience interaction and visibility, is in the low range — showing limited engagement impact.' },
            { min: 41, max: 70, color: '#FFF7EC', strokeColor: '#FDB458', label: 'Engagement Rate + Reach is in the moderate range — reflecting fair interaction with opportunities to increase reach.' },
            { min: 71, max: 100, color: '#D4F0A4', strokeColor: '#7BB13D', label: 'Engagement Rate + Reach is in the high range — highlighting strong audience interaction and wide visibility.' }
        ],
        defaultColor: '#FFF'
    },
    // 11. ✅ Avg Sentiment Score
    'Avg Sentiment Score': {
        type: 'numeric',
        ranges: [
            { min: 0, max: 40, color: '#FFE8E8', strokeColor: '#FF0000', label: 'Average Sentiment Score, which combines overall customer emotions, is in the negative range — showing dissatisfaction in perception.'},
            { min: 41, max: 70, color: '#FFF7EC', strokeColor: '#FDB458', label: 'Average Sentiment Score is in the neutral range — reflecting mixed emotions with opportunities to foster positivity.' },
            { min: 71, max: 100, color: '#D4F0A4', strokeColor: '#7BB13D', label: 'Average Sentiment Score is in the positive range — showing favorable emotions and healthy perception of the brand.' }
        ],
        defaultColor: '#FFF'
    },

    // 12. ✅ Alignment Score (%)
    'Alignment Score (%)': {
        type: 'numeric',
        ranges: [
            { min: 0, max: 40, color: '#FFE8E8', strokeColor: '#FF0000', label: 'Alignment Score, which reflects how closely efforts match goals, is in the low range — showing limited alignment with strategic objectives.' },
            { min: 41, max: 70, color: '#FFF7EC', strokeColor: '#FDB458', label: 'Alignment Score is in the moderate range — showing partial alignment with room to strengthen consistency.' },
            { min: 71, max: 100, color: '#D4F0A4', strokeColor: '#7BB13D', label: 'Alignment Score is in the high range — reflecting strong alignment between activities and goals.' }
        ],
        defaultColor: '#FFF'
    },

    // 13. ✅ Resource Allocation
    'Resource Allocation': {
        type: 'numeric',
        ranges: [
            { min: 0, max: 30000, color: '#FFE8E8', strokeColor: '#FF0000', label: 'Resource Allocation, which measures effective use of resources, is in the inefficient range — showing suboptimal utilization.' },
            { min: 30001, max: 70000, color: '#FFF7EC', strokeColor: '#FDB458', label: 'Resource Allocation is in the balanced range — reflecting reasonable use with potential to optimize further.' },
            { min: 70001, max: 100000000, color: '#D4F0A4', strokeColor: '#7BB13D', label: 'Resource Allocation is in the efficient range — highlighting strong utilization of resources aligned with needs.' }
        ],
        defaultColor: '#FFF'
    },

    // 14. ✅ Impact Metrics
    'Impact Metrics': {
        type: 'numeric',
        ranges: [
            { min: 0, max: 40, color: '#FFE8E8', strokeColor: '#FF0000', label: 'Impact Metrics, which reflect the overall business contribution of initiatives, are in the low range — showing limited measurable outcomes.' },
            { min: 41, max: 70, color: '#FFF7EC', strokeColor: '#FDB458', label: 'Impact Metrics are in the moderate range — indicating reasonable impact with opportunities to scale results.'},
            { min: 71, max: 100, color: '#D4F0A4', strokeColor: '#7BB13D', label: 'Impact Metrics are in the high range — highlighting strong outcomes and meaningful contributions to business objectives.' }
        ],
        defaultColor: '#FFF'
    },

    // 15. ✅ Risks Identified (string-based)
    'Risks Identified': {
        type: 'string',
        stringRules: [
            { value: 'No Risks Identified',
              color: '#D4F0A4', strokeColor: '#7BB13D', label: 'Risk assessment shows no risks identified — operations are stable and under control.' }
        ],
        defaultColor: '#FFE8E8',
        //Label: 'Risk assessment indicates risks are present — attention is required to manage potential challenges.'
    },

    // 16. ✅ Page Views
    'Page Views': {
        type: 'numeric',
        ranges: [
            { min: 0, max: 3000, color: '#FFE8E8', strokeColor: '#FF0000', label: 'Page Views, which track content visibility, are in the low range — showing limited reach and audience exposure.' },
            { min: 3001, max: 7000, color: '#FFF7EC', strokeColor: '#FDB458', label: 'Page Views are in the moderate range — reflecting steady visibility with opportunities to grow audience engagement.' },
            { min: 7001, max: 1000000000, color: '#D4F0A4', strokeColor: '#7BB13D', label: 'Page Views are in the high range — highlighting strong content visibility and audience reach.' }
        ],
        defaultColor: '#FFF'
    },

    // 17. ✅ Visitors
    'Visitors': {
        type: 'numeric',
        ranges: [
            { min: 0, max: 20, color: '#FFE8E8', strokeColor: '#FF0000', label: 'Visitors, which tracks expansion of followers or subscribers, is in the low range — showing limited growth momentum.' },
            { min: 21, max: 50, color: '#FFF7EC', strokeColor: '#FDB458', label: 'Visitors is in the moderate range — reflecting steady expansion with scope to accelerate further.' },
            { min: 51, max: 100, color: '#D4F0A4', strokeColor: '#7BB13D', label: 'Visitors is in the high range — showing strong momentum and expanding influence.' }
        ],
        defaultColor: '#FFF'
    },

    // 18. ✅ Engagement Rate (%)
    'Engagement Rate (%)': {
        type: 'numeric',
        ranges: [
            { min: 0, max: 40, color: '#FFE8E8', strokeColor: '#FF0000', label: 'Engagement Rate, which measures audience interaction, is in the low range — showing limited audience involvement.' },
            { min: 41, max: 70, color: '#FFF7EC', strokeColor: '#FDB458', label: 'Engagement Rate is in the moderate range — reflecting steady interaction with potential to strengthen engagement.' },
            { min: 71, max: 100, color: '#D4F0A4', strokeColor: '#7BB13D', label: 'Engagement Rate is in the high range — highlighting strong interaction and active audience participation.' }
        ],
        defaultColor: '#FFF'
    },

    // 19. ✅ Bounce Rate (%)
    'Bounce Rate (%)': {
        type: 'numeric',
        ranges: [
            { min: 0, max: 40, color: '#D4F0A4', strokeColor: '#FF0000', label: 'Bounce Rate, which measures visitors leaving without engagement, is in the low range — showing effective audience retention.'},
            { min: 41, max: 70, color: '#FFF7EC', strokeColor: '#FDB458', label: 'Bounce Rate is in the moderate range — indicating partial retention with scope to reduce exits.' },
            { min: 71, max: 100, color: '#FFE8E8', strokeColor: '#7BB13D', label: 'Bounce Rate is in the high range — showing frequent visitor drop-offs and need for stronger engagement strategies.' }
        ],
        defaultColor: '#FFF'
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
    fallbackColor: string = '#FFF'
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
                console.log(`Numeric KPI with ranges found for: ${kpiKey}`);
            } else if (config.type === 'string' && config.stringRules) {
                console.log(`String KPI with rules found for: ${kpiKey}`);
            }
        }
    });
}

export type { ColorRange, KpiColorConfig, StringColorRule };