import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

const THEME_CONFIG = {
    light: {
        backgroundColor: '#ffffff',
        textColor: '#000000',
        gridColor: '#e5e7eb',
    },
    dark: {
        backgroundColor: '#09090b',
        textColor: '#fafafa',
        gridColor: '#27272a',
    },
};

/**
 * Export a chart element as PNG image with theme support
 * @param element - The DOM element containing the chart
 * @param filename - The filename for the downloaded image (without extension)
 * @param theme - Export theme ('light' or 'dark')
 */
export async function exportChartAsPNG(element, filename, theme = 'light') {
    try {
        const themeConfig = THEME_CONFIG[theme];
        const clonedElement = element.cloneNode(true);
        clonedElement.style.backgroundColor = themeConfig.backgroundColor;
        clonedElement.style.color = themeConfig.textColor;
        clonedElement.style.position = 'absolute';
        clonedElement.style.left = '-9999px';
        clonedElement.style.top = '-9999px';
        document.body.appendChild(clonedElement);

        // Apply theme colors to SVG elements
        const svgs = clonedElement.querySelectorAll('svg');
        svgs.forEach(svg => {
            svg.style.backgroundColor = themeConfig.backgroundColor;
        });

        // Update text elements
        const textElements = clonedElement.querySelectorAll('text, span, div, p');
        textElements.forEach(el => {
            if (theme === 'dark') {
                el.style.color = themeConfig.textColor;
            }
        });

        const canvas = await html2canvas(clonedElement, {
            backgroundColor: themeConfig.backgroundColor,
            scale: 2,
            logging: false,
            useCORS: true,
        });

        document.body.removeChild(clonedElement);

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

            toast.success(`Chart exported as PNG (${theme} mode)`);
        }, 'image/png');
    } catch (error) {
        console.error('PNG export failed:', error);
        toast.error('Failed to export chart as PNG');
        throw error;
    }
}

/**
 * Export a chart element as PDF document with theme support
 * @param element - The DOM element containing the chart
 * @param filename - The filename for the downloaded PDF (without extension)
 * @param theme - Export theme ('light' or 'dark')
 */
export async function exportChartAsPDF(element, filename, theme = 'light') {
    try {
        const themeConfig = THEME_CONFIG[theme];
        const clonedElement = element.cloneNode(true);
        clonedElement.style.backgroundColor = themeConfig.backgroundColor;
        clonedElement.style.color = themeConfig.textColor;
        clonedElement.style.position = 'absolute';
        clonedElement.style.left = '-9999px';
        clonedElement.style.top = '-9999px';
        document.body.appendChild(clonedElement);

        // Apply theme colors to SVG elements
        const svgs = clonedElement.querySelectorAll('svg');
        svgs.forEach(svg => {
            svg.style.backgroundColor = themeConfig.backgroundColor;
        });

        // Update text elements
        const textElements = clonedElement.querySelectorAll('text, span, div, p');
        textElements.forEach(el => {
            if (theme === 'dark') {
                el.style.color = themeConfig.textColor;
            }
        });

        const canvas = await html2canvas(clonedElement, {
            backgroundColor: themeConfig.backgroundColor,
            scale: 2,
            logging: false,
            useCORS: true,
        });

        document.body.removeChild(clonedElement);

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

        toast.success(`Chart exported as PDF (${theme} mode)`);
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
export function generateFilename(prefix) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    return `${prefix}_${timestamp}`;
}
