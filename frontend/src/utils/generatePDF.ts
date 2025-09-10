import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const generatePDF = async (
    kpiSectionRef: React.RefObject<HTMLDivElement>,
    chartsSectionRef: React.RefObject<HTMLDivElement>,
    pageTitle: string,
    summaryKey: string,
    activeTab?: string
): Promise<void> => {
    const tabSpecificSummaryKey = activeTab ? `${summaryKey}_${activeTab}` : summaryKey;
    const parsedSummary = localStorage.getItem(tabSpecificSummaryKey);
    const parsed = parsedSummary ? JSON.parse(parsedSummary) : null;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // ====== Centered Title Page ======
    const titleFontSize = 30;
    const subFontSize = 20;
    const lineSpacing = 5;

    const lines = [
        { text: activeTab ? `${pageTitle} Report - ${activeTab}` : `${pageTitle} Report`, fontSize: titleFontSize },
        { text: `Generated on: ${new Date().toLocaleDateString()}`, fontSize: subFontSize },
    ];

    if (activeTab) {
        lines.push({ text: `Tab: ${activeTab}`, fontSize: subFontSize });
    }

    const totalHeight =
        lines.reduce((sum, line) => sum + line.fontSize, 0) + (lines.length - 1) * lineSpacing;

    let currentY = (pageHeight - totalHeight) / 2;

    for (const line of lines) {
        pdf.setFontSize(line.fontSize);
        pdf.setTextColor(40, 40, 40);
        pdf.text(line.text, pageWidth / 2, currentY, { align: 'center' });
        currentY += line.fontSize + lineSpacing;
    }

    let chartsAdded = false;
    const tabElements = document.querySelectorAll('[role="tabpanel"]');

    for (const tabElement of Array.from(tabElements)) {
        if (tabElement.getAttribute('data-state') === 'active') {
            const chartCards = tabElement.querySelectorAll('.grid > div');

            for (const [index, card] of Array.from(chartCards).entries()) {
                if (card instanceof HTMLElement && !card.style.display?.includes('none')) {
                    try {
                        // Find the Plotly chart element directly
                        const plotlyElement = card.querySelector('.plotly.js-plotly-plot') as HTMLElement;

                        if (!plotlyElement) {
                            console.warn(`Chart ${index + 1}: Plotly element not found`);
                            continue;
                        }

                        // Find and temporarily hide the modebar
                        const modebar = plotlyElement.querySelector('.modebar') as HTMLElement;
                        let originalModebarDisplay = '';

                        if (modebar) {
                            originalModebarDisplay = modebar.style.display;
                            modebar.style.display = 'none';
                        }

                        const canvas = await html2canvas(plotlyElement, {
                            scale: 2,
                            useCORS: true,
                            allowTaint: true,
                            backgroundColor: '#ffffff',
                            width: plotlyElement.offsetWidth,
                            height: plotlyElement.offsetHeight,
                            // Ignore elements with specific classes or IDs
                            ignoreElements: (element) => {
                                return element.classList.contains('modebar') ||
                                    element.id?.includes('modebar') ||
                                    element.closest('.modebar') !== null;
                            }
                        });

                        // Restore the modebar visibility
                        if (modebar) {
                            modebar.style.display = originalModebarDisplay;
                        }

                        const imgData = canvas.toDataURL('image/png');
                        const imgWidth = pageWidth - 20;
                        const imgHeight = (canvas.height * imgWidth) / canvas.width;

                        // Add page before first chart
                        pdf.addPage();

                        pdf.setFontSize(14);
                        pdf.setTextColor(40, 40, 40);
                        pdf.text(`Chart ${index + 1}`, 10, 20);

                        const maxHeight = pageHeight - 40;
                        const adjustedHeight = Math.min(imgHeight, maxHeight);
                        const marginTop = 40;

                        pdf.addImage(imgData, 'PNG', 10, marginTop, imgWidth, adjustedHeight);
                        chartsAdded = true;
                    } catch (error) {
                        console.error(`Error generating chart ${index + 1}:`, error);

                        // Make sure to restore modebar visibility even if there's an error
                        const plotlyElement = card.querySelector('.plotly.js-plotly-plot') as HTMLElement;
                        const modebar = plotlyElement?.querySelector('.modebar') as HTMLElement;
                        if (modebar) {
                            modebar.style.display = '';
                        }
                    }
                }
            }
            break;
        }
    }

    if (parsed) {
        const summaryEntries = Object.entries(parsed)
            .filter(([_, value]) => typeof value === 'object' && value !== null && 'summary' in value)
            .map(([key, value]) => {
                const v = value as { summary: string };
                return `• ${key}: ${v.summary}`;
            });

        if (summaryEntries.length > 0) {
            pdf.addPage();
            let y = 20;

            pdf.setFontSize(14);
            pdf.setTextColor(40, 40, 40);
            const summaryTitle = activeTab ? `${activeTab} Summary` : "Summary";
            pdf.text(summaryTitle, 8, y);
            y += 13;

            pdf.setFontSize(12);
            pdf.setTextColor(60, 60, 60);

            for (const bullet of summaryEntries) {
                const wrapped = pdf.splitTextToSize(bullet, pageWidth - 25);
                if (y + wrapped.length * 7 > pageHeight - 20) {
                    pdf.addPage();
                    y = 20;
                }
                pdf.text(wrapped, 10, y);
                y += wrapped.length * 7 + 5;
            }
        }
    }

    const safeTitle = pageTitle.toLowerCase().replace(/\s+/g, '-');
    const tabSuffix = activeTab ? `-${activeTab.toLowerCase().replace(/\s+/g, '-')}` : '';
    const fileName = `${safeTitle}${tabSuffix}-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
};