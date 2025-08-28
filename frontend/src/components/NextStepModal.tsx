import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Lightbulb, X } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { Button } from '@/components/ui/button';

interface NextStepModalProps {
    isOpen: boolean;
    onClose: () => void;
    nextStepData: {
        [key: string]: any;
        status: string;
        tenant_id?: string;
        metric_key?: string;
        chart_title?: string;
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

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-md border border-gray-200/50 shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-gray-900">
                        Next Steps to Boost {displayTitle}
                    </DialogTitle>
                    <DialogDescription className="text-gray-600 text-sm mt-2">
                        {mainDescription}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-6">
                    {steps.map((step, index) => (
                        <Card
                            key={step.number}
                            className="border border-gray-200/80 hover:border-gray-300/80 transition-all duration-200 hover:shadow-md bg-white/80"
                        >
                            <CardContent className="p-4">
                                <div className="flex gap-4">
                                    {/* Step Number Circle */}
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                                            {step.number}
                                        </div>
                                    </div>

                                    {/* Step Content */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base font-semibold text-gray-900 mb-2 leading-tight">
                                            {step.title}
                                        </h3>
                                        <p className="text-gray-700 text-sm leading-relaxed">
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
                    <div className="mt-6 pt-4 border-t border-gray-200/50 text-xs text-gray-500 text-center">
                        Analysis generated for {nextStepData.chart_title || metricKey}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};