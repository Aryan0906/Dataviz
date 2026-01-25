import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

/**
 * Export a chart element as PNG image
 * @param element - The DOM element containing the chart
 * @param filename - The filename for the downloaded image (without extension)
 */
export async function exportChartAsPNG(element: HTMLElement, filename: string): Promise<void> {
    try {
        const canvas = await html2canvas(element, {
            backgroundColor: '#ffffff',
            scale: 2, // Higher quality
            logging: false,
            useCORS: true,
        });

        // Convert canvas to blob and download
        canvas.toBlob((blob) => {
            if (!blob) {
                throw new Error('Failed to create image blob');
            }

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${filename}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success('Chart exported as PNG');
        }, 'image/png');
    } catch (error) {
        console.error('PNG export failed:', error);
        toast.error('Failed to export chart as PNG');
        throw error;
    }
}

/**
 * Export a chart element as PDF document
 * @param element - The DOM element containing the chart
 * @param filename - The filename for the downloaded PDF (without extension)
 */
export async function exportChartAsPDF(element: HTMLElement, filename: string): Promise<void> {
    try {
        const canvas = await html2canvas(element, {
            backgroundColor: '#ffffff',
            scale: 2,
            logging: false,
            useCORS: true,
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;

        // Calculate PDF dimensions (A4 landscape)
        const pdfWidth = 297; // A4 landscape width in mm
        const pdfHeight = 210; // A4 landscape height in mm

        // Calculate scaling to fit image in PDF
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const scaledWidth = imgWidth * ratio;
        const scaledHeight = imgHeight * ratio;

        // Center the image
        const x = (pdfWidth - scaledWidth) / 2;
        const y = (pdfHeight - scaledHeight) / 2;

        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4',
        });

        pdf.addImage(imgData, 'PNG', x, y, scaledWidth, scaledHeight);
        pdf.save(`${filename}.pdf`);

        toast.success('Chart exported as PDF');
    } catch (error) {
        console.error('PDF export failed:', error);
        toast.error('Failed to export chart as PDF');
        throw error;
    }
}

/**
 * Generate a filename with timestamp
 * @param prefix - Prefix for the filename
 * @returns Filename with timestamp
 */
export function generateFilename(prefix: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    return `${prefix}_${timestamp}`;
}
