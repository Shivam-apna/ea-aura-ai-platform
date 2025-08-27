import { toast } from "sonner";
import { getApiEndpoint } from "@/config/environment";

interface ChartData {
    title: string;
    plotType: string;
    x: any[];
    y: any;
    xLabel: string;
    yLabel: string;
    value?: number;
    delta?: number;
    marker?: {
        color: string;
    };
}

interface PredictiveAnalysisResponse {
    status: string;
    trend: string;
    confidence: string;
    predictions: number[];
    key_insight?: string;
    analysis_type: string;
    metric_key: string;
    chart_data?: ChartData;
}

interface PageContext {
    pageName: string;
    activeTab: string;
    pageType: string;
}

export class PredictiveAnalysis {
    /**
     * Detect current page context from URL and DOM
     */
    static detectPageContext(): PageContext {
        const currentPath = window.location.pathname;

        let pageName = 'unknown';
        let pageType = 'unknown';

        if (currentPath.includes('business-vitality')) {
            pageName = 'Business Vitality';
            pageType = 'business';
        } else if (currentPath.includes('customer-analysis')) {
            pageName = 'Customer Analysis';
            pageType = 'customer';
        } else if (currentPath.includes('mission-alignment')) {
            pageName = 'Mission Alignment';
            pageType = 'mission';
        } else if (currentPath.includes('brand-index')) {
            pageName = 'Brand Index';
            pageType = 'brand';
        }
        else if (currentPath.includes('brand-index')) {
            pageName = 'Brand Index';
            pageType = 'brand';
        }
        else if (currentPath.includes('dashboard')) {
            pageName = 'Overview';
            pageType = 'overview';
        }

        let activeTab = 'unknown';

        const activeTabElement = document.querySelector('.active[data-tab]') ||
            document.querySelector('[aria-selected="true"]') ||
            document.querySelector('.bg-blue-500');

        if (activeTabElement) {
            activeTab = activeTabElement.textContent?.trim() ||
                activeTabElement.getAttribute('data-tab') ||
                activeTabElement.getAttribute('aria-label') || 'unknown';
        } else {
            const tabButtons = document.querySelectorAll('button');
            for (const button of tabButtons) {
                const text = button.textContent?.trim().toLowerCase();
                if (text === 'sales' || text === 'marketing') {
                    const isActive = button.classList.contains('active') ||
                        button.classList.contains('bg-blue-500') ||
                        button.getAttribute('aria-selected') === 'true';

                    if (isActive) {
                        activeTab = text.charAt(0).toUpperCase() + text.slice(1);
                        break;
                    }
                }
            }

            if (activeTab === 'unknown' && pageName === 'Business Vitality') {
                activeTab = 'Sales';
            }
        }

        return { pageName, activeTab, pageType };
    }

    /**
     * Validate if cache key matches current page context
     */
    static validateCacheKeyForContext(cacheKey: string, pageContext: PageContext): boolean {
        const expectedKey = this.buildCacheKey(pageContext.pageType, pageContext.activeTab);
        const isExactMatch = cacheKey === expectedKey;

        if (isExactMatch) return true;

        const keyInfo = this.extractPageInfoFromCacheKey(cacheKey);
        return keyInfo.pageType === pageContext.pageType;
    }

    /**
     * Build cache key using template: ${pageType}_charts_cache_${activeTab}
     */
    static buildCacheKey(pageType: string, activeTab: string): string {
        return `${pageType}_charts_cache_${activeTab}`;
    }

    /**
     * Find cache keys using exact template ${pageType}_charts_cache_${activeTab}
     */
    static findChartCacheKeys(pageContext?: PageContext): string[] {
        const exactMatches: string[] = [];
        const samePageMatches: string[] = [];
        const otherMatches: string[] = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && this.isChartCacheKey(key)) {
                if (pageContext) {
                    const expectedKey = this.buildCacheKey(pageContext.pageType, pageContext.activeTab);

                    if (key === expectedKey) {
                        exactMatches.push(key);
                    } else {
                        const keyInfo = this.extractPageInfoFromCacheKey(key);
                        if (keyInfo.pageType === pageContext.pageType) {
                            samePageMatches.push(key);
                        } else {
                            otherMatches.push(key);
                        }
                    }
                } else {
                    otherMatches.push(key);
                }
            }
        }

        return [...exactMatches, ...samePageMatches, ...otherMatches];
    }

    /**
     * Check if a storage key matches pattern: ${pageType}_charts_cache_${activeTab}
     */
    private static isChartCacheKey(key: string): boolean {
        const exactPattern = /^(\w+)_charts_cache_(.+)$/i;
        if (exactPattern.test(key)) return true;

        const fallbackPatterns = [
            /_charts_cache_/i,
            /charts.*cache/i,
        ];

        return fallbackPatterns.some(pattern => pattern.test(key));
    }

    /**
     * Extract activeTab from cache key pattern: ${pageType}_charts_cache_${activeTab}
     */
    static extractTabFromCacheKey(cacheKey: string, pageContext?: PageContext): string {
        const exactPattern = /^(\w+)_charts_cache_(.+)$/i;
        const match = cacheKey.match(exactPattern);

        if (match) {
            return match[2]; // activeTab
        }

        if (pageContext && pageContext.activeTab !== 'unknown') {
            return pageContext.activeTab;
        }

        return 'unknown';
    }

    /**
     * Extract both pageType and activeTab from cache key
     */
    static extractPageInfoFromCacheKey(cacheKey: string): { pageType: string; activeTab: string } {
        const exactPattern = /^(\w+)_charts_cache_(.+)$/i;
        const match = cacheKey.match(exactPattern);

        if (match) {
            return {
                pageType: match[1],
                activeTab: match[2]
            };
        }

        return { pageType: 'unknown', activeTab: 'unknown' };
    }

    /**
     * Get chart data with perfect matching for business_charts_cache_Sales
     */
    static getStoredChartData(metricKey: string, activeTab?: string): ChartData | null {
        try {
            const pageContext = activeTab ?
                { pageName: 'unknown', activeTab, pageType: 'unknown' } :
                this.detectPageContext();

            // Try exact cache key first
            if (pageContext.pageType !== 'unknown' && pageContext.activeTab !== 'unknown') {
                const exactCacheKey = this.buildCacheKey(pageContext.pageType, pageContext.activeTab);
                const exactCacheData = localStorage.getItem(exactCacheKey);

                if (exactCacheData) {
                    try {
                        const parsedData = JSON.parse(exactCacheData);
                        const charts = parsedData.charts || parsedData;

                        if (charts && charts[metricKey]) {
                            return charts[metricKey];
                        }
                    } catch (parseError) {
                        // Continue to fallback search
                    }
                }
            }

            // Fallback: search all cache keys
            const cacheKeys = this.findChartCacheKeys(pageContext);

            if (cacheKeys.length === 0) return null;

            let targetCacheData = null;

            for (const cacheKey of cacheKeys) {
                const cachedDataStr = localStorage.getItem(cacheKey);
                if (!cachedDataStr) continue;

                try {
                    const cachedData = JSON.parse(cachedDataStr);
                    const extractedTab = this.extractTabFromCacheKey(cacheKey, pageContext);
                    const charts = cachedData.charts || cachedData;

                    if (charts && typeof charts === 'object' && charts[metricKey]) {
                        targetCacheData = charts[metricKey];

                        // Perfect match - use immediately
                        if (extractedTab.toLowerCase() === pageContext.activeTab.toLowerCase()) {
                            break;
                        }
                    }
                } catch (parseError) {
                    continue;
                }
            }

            return targetCacheData;

        } catch (error) {
            return null;
        }
    }

    /**
     * Generate predictive data with auto-detection
     */
    static async generatePredictiveData(
        chartKey: string,
        tenantId: string,
        chartType?: string,
        activeTab?: string
    ): Promise<PredictiveAnalysisResponse | null> {
        try {
            const pageContext = this.detectPageContext();
            const finalActiveTab = activeTab || pageContext.activeTab;

            const currentChartData = this.getStoredChartData(chartKey, finalActiveTab);

            if (!currentChartData) {
                toast.error(`No chart data available for ${chartKey} in ${pageContext.pageName} (${finalActiveTab})`);
                return null;
            }

            // Validate chart data
            const yData = Array.isArray(currentChartData.y) ? currentChartData.y : [currentChartData.y];
            if (yData.length < 3) {
                toast.warning("Need at least 3 data points for accurate predictions");
                return {
                    status: "insufficient_data",
                    trend: "unknown",
                    confidence: "low",
                    predictions: [],
                    key_insight: "Insufficient data points for prediction",
                    analysis_type: "quick",
                    metric_key: chartKey
                };
            }

            const payload = {
                chart_data: currentChartData,
                tenant_id: tenantId || "demo232",
                metric_key: chartKey,
                chart_type: chartType || currentChartData.plotType || "line",
                analysis_type: "quick",
                page_context: {
                    page_name: pageContext.pageName,
                    active_tab: finalActiveTab,
                    page_type: pageContext.pageType
                }
            };

            const response = await fetch(getApiEndpoint("/v1/predictive-analysis"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} - ${response.statusText}`);
            }

            const predictiveData = await response.json();

            if (predictiveData && predictiveData.status === "success" && predictiveData.chart_data) {
                toast.success(`✨ Predictive analysis generated for ${pageContext.pageName}`);

                const chartData = predictiveData.chart_data;
                chartData._prediction_metadata = chartData.prediction_metadata;
                delete chartData.prediction_metadata;

                return chartData;
            }

            return null;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            toast.error(`Failed to generate predictive analysis: ${errorMessage}`);
            return null;
        }
    }

    static getAllAvailableMetrics(): Record<string, string[]> {
        const allMetrics: Record<string, string[]> = {};
        const pageContext = this.detectPageContext();
        const cacheKeys = this.findChartCacheKeys(pageContext);

        cacheKeys.forEach(cacheKey => {
            const cachedDataStr = localStorage.getItem(cacheKey);
            if (!cachedDataStr) return;

            try {
                const cachedData = JSON.parse(cachedDataStr);
                const charts = cachedData.charts || cachedData;
                const tabName = this.extractTabFromCacheKey(cacheKey, pageContext);

                if (charts && typeof charts === 'object') {
                    allMetrics[tabName] = Object.keys(charts);
                }
            } catch (error) {
                // Continue processing other cache keys
            }
        });

        return allMetrics;
    }

    static cachePredictiveData(
        chartKey: string,
        activeTab: string,
        predictiveData: PredictiveAnalysisResponse
    ): void {
        try {
            const pageContext = this.detectPageContext();
            const cacheKey = `${pageContext.pageType}_charts_cache_${activeTab}`;
            const cacheData = {
                charts: { [chartKey]: predictiveData },
                timestamp: Date.now()
            };

            localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        } catch (error) {
            // Silent fail for caching errors
        }
    }

    static getCachedPredictiveData(
        chartKey: string,
        activeTab: string,
        maxAgeHours: number = 24
    ): PredictiveAnalysisResponse | null {
        try {
            const pageContext = this.detectPageContext();
            const cacheKey = `${pageContext.pageType}_charts_cache_${activeTab}`;
            const cachedData = localStorage.getItem(cacheKey);

            if (!cachedData) return null;

            const parsed = JSON.parse(cachedData);
            const age = Date.now() - parsed.timestamp;
            const maxAge = maxAgeHours * 60 * 60 * 1000;

            if (age > maxAge) {
                localStorage.removeItem(cacheKey);
                return null;
            }

            return parsed.data;
        } catch (error) {
            return null;
        }
    }

    /**
     * Main function to get predictive data
     */
    static async getPredictiveData(
        chartKey: string,
        activeTab: string,
        tenantId: string,
        chartType?: string,
        useCache: boolean = true
    ): Promise<PredictiveAnalysisResponse | null> {
        const pageContext = this.detectPageContext();

        if (useCache) {
            const cachedData = this.getCachedPredictiveData(chartKey, activeTab);
            if (cachedData) {
                toast.info(`Using cached data for ${pageContext.pageName}`);
                return cachedData;
            }
        }

        const predictiveData = await this.generatePredictiveData(chartKey, tenantId, chartType, activeTab);

        if (predictiveData && predictiveData.status === "success") {
            this.cachePredictiveData(chartKey, activeTab, predictiveData);
        }

        return predictiveData;
    }

    /**
     * Simplified method for button clicks
     */
    static async getPredictiveDataSimple(
        chartKey: string,
        tenantId: string,
        chartType?: string
    ): Promise<PredictiveAnalysisResponse | null> {
        const pageContext = this.detectPageContext();
        return this.getPredictiveData(chartKey, pageContext.activeTab, tenantId, chartType);
    }

    static displayPredictionResults(predictions: PredictiveAnalysisResponse): void {
        if (predictions.status === "success") {
            toast.success("🔮 Prediction Complete!");
        } else if (predictions.status === "insufficient_data") {
            toast.warning(`⚠️ ${predictions.key_insight || "Need more data for accurate predictions"}`);
        } else {
            toast.error(`❌ ${predictions.key_insight || "Prediction analysis failed"}`);
        }
    }

    /**
     * Debug storage - kept for compatibility
     */
    static debugStorage(): void {
        const pageContext = this.detectPageContext();
        const allKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) allKeys.push(key);
        }
    }
}