import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const generatePDF = async (
    kpiSectionRef: React.RefObject<HTMLDivElement>,
    chartsSectionRef: React.RefObject<HTMLDivElement>,
    pageTitle: string,
    summaryKey: string
): Promise<void> => {
    const parsedSummary = localStorage.getItem(summaryKey);
    const parsed = parsedSummary ? JSON.parse(parsedSummary) : null;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;

    // Title Page
    pdf.setFontSize(20);
    pdf.setTextColor(40, 40, 40);
    pdf.text(`${pageTitle} Report`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100);
    const currentDate = new Date().toLocaleDateString();
    pdf.text(`Generated on: ${currentDate}`, pageWidth / 2, yPosition, { align: 'center' });
    // pdf.addPage();

    // KPI section (optional)
    // if (kpiSectionRef.current) {
    //     const kpiChildren = Array.from(kpiSectionRef.current.children);
    //     for (const [index, child] of kpiChildren.entries()) {
    //         const canvas = await html2canvas(child as HTMLElement, {
    //             scale: 2,
    //             useCORS: true,
    //             allowTaint: true,
    //             backgroundColor: '#ffffff',
    //         });

    //         const imgData = canvas.toDataURL('image/png');
    //         const imgWidth = pageWidth - 20;
    //         const imgHeight = (canvas.height * imgWidth) / canvas.width;

    //         pdf.setFontSize(14);
    //         pdf.setTextColor(40, 40, 40);
    //         pdf.text(`KPI ${index + 1}`, 10, 20);
    //         pdf.addImage(imgData, 'PNG', 10, 30, imgWidth, imgHeight);
    //         pdf.addPage();
    //     }
    // }

    // Charts section from active tab
    const tabElements = document.querySelectorAll('[role="tabpanel"]');
    for (const tabElement of Array.from(tabElements)) {
        if (tabElement.getAttribute('data-state') === 'active') {
            const chartCards = tabElement.querySelectorAll('.grid > div');

            for (const [index, card] of Array.from(chartCards).entries()) {
                if (card instanceof HTMLElement && !card.style.display?.includes('none')) {
                    const canvas = await html2canvas(card, {
                        scale: 2,
                        useCORS: true,
                        allowTaint: true,
                        backgroundColor: '#ffffff',
                        width: card.offsetWidth,
                        height: card.offsetHeight,
                    });

                    const imgData = canvas.toDataURL('image/png');
                    const imgWidth = pageWidth - 20;
                    const imgHeight = (canvas.height * imgWidth) / canvas.width;

                    pdf.setFontSize(14);
                    pdf.setTextColor(40, 40, 40);
                    pdf.text(`Chart ${index + 1}`, 10, 20);
                    pdf.addImage(imgData, 'PNG', 10, 30, imgWidth, imgHeight);
                    pdf.addPage();
                }
            }
        }
    }

    // Summary page at the end
    if (parsed) {
        const summaryEntries = Object.entries(parsed)
            .filter(([_, value]) => typeof value === 'object' && value !== null && 'summary' in value)
            .map(([key, value]) => {
                const v = value as { summary: string };
                return `• ${key}: ${v.summary}`;
            });

        if (summaryEntries.length > 0) {
            let y = 20;
            pdf.setFontSize(16);
            pdf.setTextColor(40, 40, 40);
            pdf.text("Summary", 10, y);
            y += 10;

            pdf.setFontSize(12);
            pdf.setTextColor(60, 60, 60);

            for (const bullet of summaryEntries) {
                const wrapped = pdf.splitTextToSize(bullet, pageWidth - 20);
                if (y + wrapped.length * 7 > pageHeight - 20) {
                    pdf.addPage();
                    y = 20;
                }
                pdf.text(wrapped, 10, y);
                y += wrapped.length * 7 + 3;
            }
        }
    }

    // Save the PDF
    const safeTitle = pageTitle.toLowerCase().replace(/\s+/g, '-');
    const fileName = `${safeTitle}-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
};
