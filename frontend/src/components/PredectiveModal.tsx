import React from 'react';
import Plot from 'react-plotly.js';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, Lightbulb } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

interface PredictiveModalProps {
    isOpen: boolean;
    onClose: () => void;
    chartData: {
        title: string;
        plotType: string;
        description: string;
        x: any[];
        y: any;
        xLabel: string;
        yLabel: string;
        marker?: { color: string };
        prediction_metadata?: {
            trend: string;
            confidence: string;
            predictions: number[];
            key_insight?: string;
            analysis_type: string;
            trend_analysis?: string;
            predicted_values?: string[];
        };
        popup?: {
            title: string;
            subtitle: string;
            intro: string;
            bullets: string[];
            howToUse: string;
        };
    };
    metricKey: string;
    chartType?: string;
    chartColor?: string;
    transparent?: boolean;
}

export const PredictiveModal: React.FC<PredictiveModalProps> = ({
    isOpen,
    onClose,
    chartData,
    metricKey,
    chartType,
    chartColor,
    transparent = false
}) => {

    if (!isOpen || !chartData) return null;
    const { theme } = useTheme();

    const isDarkTheme = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    // Define theme-aware colors for traces
    const traceColors = {
        actual: isDarkTheme ? '#4A90E2' : '#3B82F6', // Blue for actual data
        predicted: isDarkTheme ? '#9B59B6' : '#A0A0A0', // Purple for predicted in dark, Gray in light
    };

    // Plot configuration
    const plotLayout = {
        template: isDarkTheme ? 'plotly_dark' : 'plotly_white', // Apply dark template
        width: undefined,
        height: 400,
        autosize: true,
        title: {
            text: `${chartData.title} - Predictive Analysis`,
            font: { size: 18, family: 'Inter, sans-serif', color: isDarkTheme ? '#e5e7eb' : '#1f2937' }
        },
        font: { family: 'Inter, sans-serif', size: 14, color: isDarkTheme ? '#e5e7eb' : '#1f2937' },
        margin: { l: 60, r: 40, t: 80, b: 100 },
        plot_bgcolor: isDarkTheme ? '#1e1e1e' : "white", // Dark charcoal for dark mode
        paper_bgcolor: isDarkTheme ? '#1e1e1e' : "white", // Dark charcoal for dark mode
        xaxis: {
            title: chartData.xLabel,
            zeroline: false,
            tickfont: { size: 13, color: isDarkTheme ? '#9ca3af' : '#6b7280' },
            titlefont: { size: 15, family: 'Inter, sans-serif', color: isDarkTheme ? '#e5e7eb' : '#1f2937' },
            gridcolor: isDarkTheme ? 'rgba(255,255,255,0.1)' : '#e5e7eb', // Semi-transparent white for dark grid
            linecolor: isDarkTheme ? '#0a0c0bff' : '#d1d5db',
        },
        yaxis: {
            title: chartData.yLabel,
            zeroline: false,
            tickfont: { size: 13, color: isDarkTheme ? '#9ca3af' : '#6b7280' },
            titlefont: { size: 15, family: 'Inter, sans-serif', color: isDarkTheme ? '#e5e7eb' : '#1f2937' },
            gridcolor: isDarkTheme ? 'rgba(255,255,255,0.1)' : '#e5e7eb', // Semi-transparent white for dark grid
            linecolor: isDarkTheme ? '#6b7280' : '#d1d5db',
        },
        legend: {
            orientation: "h",
            x: 0.5,
            xanchor: "center",
            y: -0.2,
            font: { size: 13, color: isDarkTheme ? '#e5e7eb' : '#1f2937' },
        },
        transition: { duration: 300, easing: 'ease-out' },
        annotations: [{
            text: chartData.description,
            showarrow: false,
            x: 0.5,
            y: -0.35,
            xref: 'paper',
            yref: 'paper',
            xanchor: 'center',
            yanchor: 'top',
            font: { size: 14, color: isDarkTheme ? '#e5e7eb' : '#1f2937' }
        }],
        hoverlabel: {
            bgcolor: isDarkTheme ? '#374151' : '#ffffff',
            bordercolor: isDarkTheme ? '#6b7280' : '#d1d5db',
            font: { color: isDarkTheme ? '#e5e7eb' : '#1f2937', size: 15 },
        },
    };

    const plotConfig = {
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: [
            'zoom2d', 'pan2d', 'select2d', 'lasso2d', 'zoomIn2d', 'zoomOut2d',
            'autoScale2d', 'resetScale2d', 'sendDataToCloud', 'editInChartStudio'
        ],
        responsive: true,
        toImageButtonOptions: {
            format: 'png',
            filename: `${metricKey}_prediction`,
            height: 600,
            width: 900,
            scale: 1
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className={`max-w-5xl max-h-[80vh] overflow-y-auto bg-card text-foreground border border-border shadow-2xl`}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl text-foreground">
                        <BarChart3 className="w-6 h-6 text-primary" />
                        {chartData.popup?.title || `Predictive Analysis - ${metricKey}`}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        {chartData.popup?.subtitle || 'AI-generated predictions based on historical data trends and patterns'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Popup Message Section */}
                    {chartData.popup && (
                        <Card className={`border-l-4 border-l-blue-500 bg-card text-foreground`}>
                            <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                    <Lightbulb className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                                    <div className="space-y-3">
                                        <div>
                                            <p className={`leading-relaxed text-foreground`}>
                                                {chartData.popup.intro}
                                            </p>
                                        </div>

                                        {chartData.popup.bullets && chartData.popup.bullets.length > 0 && (
                                            <div>
                                                <ul className={`space-y-1 text-sm text-muted-foreground`}>
                                                    {chartData.popup.bullets.map((bullet, index) => (
                                                        <li key={index} className="flex items-start gap-2">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></span>
                                                            <span>{bullet}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {chartData.popup.howToUse && (
                                            <div className={`pt-2 border-t border-border`}>
                                                <p className={`text-sm italic text-muted-foreground`}>
                                                    <span className="font-medium">How to use:</span> {chartData.popup.howToUse}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Chart Display */}
                    <Card className="bg-card text-foreground">
                        <CardContent className="p-4">
                            <div style={{ width: '100%', height: '400px' }}>
                                <Plot
                                    data={(() => {
                                        const finalChartType = 'line';
                                        const predictedLength = chartData.prediction_metadata?.predicted_values?.length || 0;
                                        const actualLength = chartData.y.length - predictedLength;
                                        const actualY = chartData.y.slice(0, actualLength);
                                        const predictedY = chartData.y.slice(actualLength);

                                        const series = [
                                            {
                                                x: chartData.x.slice(0, actualLength),
                                                y: actualY,
                                                type: finalChartType,
                                                name: 'Actual',
                                                mode: 'lines+markers',
                                                line: { color: traceColors.actual, width: 3, dash: 'solid' },
                                                marker: { size: 8, color: traceColors.actual },
                                            },
                                            predictedY.length > 0 && {
                                                x: chartData.x.slice(actualLength - 1),
                                                y: [actualY[actualY.length - 1], ...predictedY],
                                                type: finalChartType,
                                                name: 'Predicted',
                                                mode: 'lines+markers',
                                                line: { color: traceColors.predicted, width: 3, dash: 'dot' },
                                                marker: { size: 8, color: traceColors.predicted },
                                            }
                                        ];

                                        return series.filter(Boolean);
                                    })()}
                                    layout={plotLayout}
                                    config={plotConfig}
                                    style={{ width: '100%', height: '100%' }}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Trend Analysis Section */}
                    {chartData.prediction_metadata?.trend_analysis && (
                        <Card className="bg-card text-foreground">
                            <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                    <Lightbulb className="w-5 h-5 text-amber-500 mt-1 flex-shrink-0" />
                                    <div>
                                        <h3 className={`font-semibold text-sm mb-2 text-foreground`}>Trend Analysis</h3>
                                        <p className={`leading-relaxed text-muted-foreground`}>
                                            {chartData.prediction_metadata.trend_analysis}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};