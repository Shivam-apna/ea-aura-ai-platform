import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Lightbulb, X, BarChart3 } from 'lucide-react'; // Added BarChart3 icon
import { useTheme } from '@/components/ThemeProvider';
import { Button } from '@/components/ui/button';
import Plot from 'react-plotly.js'; // Import Plotly

interface NextStepModalProps {
    isOpen: boolean;
    onClose: () => void;
    nextStepData: {
        [key: string]: any;
        status: string;
        tenant_id?: string;
        metric_key?: string;
        chart_title?: string;
        chart_data?: { // Added chart_data definition
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
        };
    };
    metricKey: string;
}

export const NextStepModal: React.FC<NextStepModalProps> = ({
    isOpen,
    onClose,
    nextStepData,
    metricKey
}) => {
    if (!isOpen || !nextStepData) return null;

    const { theme } = useTheme();
    const isDarkTheme = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    // Extract the main title and description from the response
    const mainTitleKey = Object.keys(nextStepData).find(key => key.startsWith('Next Steps to Boost'));
    const mainDescription = nextStepData[mainTitleKey] || "Based on AI analysis and key performance drivers, here are recommended actions you can take to improve performance.";

    // Extract just the metric name from the title and clean it
    let displayTitle = nextStepData.chart_title || metricKey;
    if (mainTitleKey) {
        // Extract the part after "Next Steps to Boost "
        displayTitle = mainTitleKey.replace('Next Steps to Boost ', '');
    }

    // Clean the title - remove special characters and keep only letters, numbers, and spaces
    displayTitle = displayTitle.replace(/[^a-zA-Z0-9\s]/g, '').trim();

    // Extract all step data
    const steps = Object.keys(nextStepData)
        .filter(key => key.startsWith('step_'))
        .sort((a, b) => {
            const aNum = parseInt(a.replace('step_', ''));
            const bNum = parseInt(b.replace('step_', ''));
            return aNum - bNum;
        })
        .map(key => ({
            number: key.replace('step_', ''),
            ...nextStepData[key]
        }));

    // Plotly configuration for the chart_data
    const chartData = nextStepData.chart_data;

    const plotLayout = chartData ? {
        template: isDarkTheme ? 'plotly_dark' : 'plotly_white', // Apply dark template
        width: undefined,
        height: 300,
        autosize: true,
        title: {
            text: `Historical Data for ${chartData.title}`,
            font: { size: 16, family: 'Inter, sans-serif', color: isDarkTheme ? '#e5e7eb' : '#1f2937' }
        },
        font: { family: 'Inter, sans-serif', size: 12, color: isDarkTheme ? '#e5e7eb' : '#1f2937' },
        margin: { l: 60, r: 40, t: 60, b: 80 },
        plot_bgcolor: isDarkTheme ? '#1e1e1e' : "white", // Dark charcoal for dark mode
        paper_bgcolor: isDarkTheme ? '#1e1e1e' : "white", // Dark charcoal for dark mode
        xaxis: {
            title: chartData.xLabel,
            zeroline: false,
            tickfont: { size: 11, color: isDarkTheme ? '#9ca3af' : '#6b7280' },
            titlefont: { size: 13, family: 'Inter, sans-serif', color: isDarkTheme ? '#e5e7eb' : '#1f2937' },
            gridcolor: isDarkTheme ? 'rgba(255,255,255,0.1)' : '#e5e7eb', // Semi-transparent white for dark grid
            linecolor: isDarkTheme ? '#0a0c0bff' : '#d1d5db',
        },
        yaxis: {
            title: chartData.yLabel,
            zeroline: false,
            tickfont: { size: 11, color: isDarkTheme ? '#9ca3af' : '#6b7280' },
            titlefont: { size: 13, family: 'Inter, sans-serif', color: isDarkTheme ? '#e5e7eb' : '#1f2937' },
            gridcolor: isDarkTheme ? 'rgba(255,255,255,0.1)' : '#e5e7eb', // Semi-transparent white for dark grid
            linecolor: isDarkTheme ? '#6b7280' : '#d1d5db',
        },
        legend: {
            orientation: "h",
            x: 0.5,
            xanchor: "center",
            y: -0.2,
            font: { size: 11, color: isDarkTheme ? '#e5e7eb' : '#1f2937' },
        },
        transition: { duration: 300, easing: 'ease-out' },
        hoverlabel: {
            bgcolor: isDarkTheme ? '#374151' : '#ffffff',
            bordercolor: isDarkTheme ? '#6b7280' : '#d1d5db',
            font: { color: isDarkTheme ? '#e5e7eb' : '#1f2937', size: 13 },
        },
    } : {};

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
            filename: `${metricKey}_historical_data`,
            height: 500,
            width: 800,
            scale: 1
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card text-foreground border border-border shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-foreground">
                        Next Steps to Boost {displayTitle}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground text-sm mt-2">
                        {mainDescription}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-6">
                    {/* Conditional Chart Display */}
                    {chartData && (
                        <Card className="bg-card text-foreground">
                            <CardContent className="p-4">
                                <div style={{ width: '100%', height: '300px' }}>
                                    <Plot
                                        data={[{
                                            x: chartData.x,
                                            y: chartData.y,
                                            type: chartData.plotType || 'line',
                                            mode: 'lines+markers',
                                            name: 'Historical Data',
                                            line: { color: isDarkTheme ? '#4A90E2' : '#3B82F6', width: 2 }, // Blue for historical data
                                            marker: { size: 6, color: isDarkTheme ? '#4A90E2' : '#3B82F6' },
                                        }]}
                                        layout={plotLayout}
                                        config={plotConfig}
                                        style={{ width: '100%', height: '100%' }}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {steps.map((step, index) => (
                        <Card
                            key={step.number}
                            className="border border-border hover:border-primary/50 transition-all duration-200 hover:shadow-md bg-card text-foreground"
                        >
                            <CardContent className="p-4">
                                <div className="flex gap-4">
                                    {/* Step Number Circle */}
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                                            {step.number}
                                        </div>
                                    </div>

                                    {/* Step Content */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base font-semibold text-foreground mb-2 leading-tight">
                                            {step.title}
                                        </h3>
                                        <p className="text-muted-foreground text-sm leading-relaxed">
                                            {step.description}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Footer with metadata if available */}
                {nextStepData.tenant_id && (
                    <div className="mt-6 pt-4 border-t border-border text-xs text-muted-foreground text-center">
                        Analysis generated for {nextStepData.chart_title || metricKey}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};