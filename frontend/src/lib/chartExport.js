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
 * Wrap raw SVG markup with XML declaration and Dublin Core metadata.
 * This demonstrates proper XML structure with processing instructions,
 * namespaces, and metadata elements.
 *
 * @param {string} svgString - The raw SVG markup string
 * @param {Object} metadata - Metadata fields to embed
 * @param {string} [metadata.title] - Chart title
 * @param {string} [metadata.creator] - Author/creator
 * @param {string} [metadata.date] - ISO date string
 * @param {string} [metadata.description] - Description of the chart
 * @param {string} [metadata.chartType] - Type of chart (bar, pie, etc.)
 * @returns {string} Complete XML document string
 */
export function wrapSvgWithXmlMetadata(svgString, metadata = {}) {
    const {
        title = 'DataViz Chart Export',
        creator = 'DataViz Application',
        date = new Date().toISOString(),
        description = '',
        chartType = 'chart',
    } = metadata;

    // Add xmlns if not present and inject metadata block
    let svg = svgString.trim();

    // Ensure the SVG has the proper XML namespace
    if (!svg.includes('xmlns="http://www.w3.org/2000/svg"')) {
        svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    // Add Dublin Core namespace for metadata
    if (!svg.includes('xmlns:dc')) {
        svg = svg.replace(
            'xmlns="http://www.w3.org/2000/svg"',
            'xmlns="http://www.w3.org/2000/svg" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"'
        );
    }

    // Build the metadata XML block
    const metadataBlock = `
  <metadata>
    <rdf:RDF>
      <rdf:Description>
        <dc:title>${escapeXml(title)}</dc:title>
        <dc:creator>${escapeXml(creator)}</dc:creator>
        <dc:date>${escapeXml(date)}</dc:date>
        <dc:description>${escapeXml(description)}</dc:description>
        <dc:format>image/svg+xml</dc:format>
        <dc:type>${escapeXml(chartType)}</dc:type>
        <dc:source>DataViz - Data Visualization Platform</dc:source>
      </rdf:Description>
    </rdf:RDF>
  </metadata>`;

    // Insert metadata right after the opening <svg ...> tag
    const svgTagEnd = svg.indexOf('>');
    if (svgTagEnd !== -1) {
        svg = svg.slice(0, svgTagEnd + 1) + metadataBlock + svg.slice(svgTagEnd + 1);
    }

    // Add XML declaration
    const xmlDoc = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n<!-- Generated by DataViz Application on ${date} -->\n<!-- Chart Type: ${escapeXml(chartType)} | Title: ${escapeXml(title)} -->\n${svg}`;

    return xmlDoc;
}

/**
 * Escape special XML characters in a string.
 * @param {string} str - The string to escape
 * @returns {string} XML-safe string
 */
function escapeXml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Export a chart element as SVG/XML file with theme support.
 * Extracts the SVG from the DOM, applies theme styling, wraps with XML
 * metadata, and triggers a download.
 *
 * @param {HTMLElement} element - The DOM element containing the chart (must contain an <svg>)
 * @param {string} filename - The filename for the downloaded SVG (without extension)
 * @param {string} [theme='light'] - Export theme ('light' or 'dark')
 * @param {Object} [metadata={}] - Additional metadata to embed in the SVG XML
 */
export async function exportChartAsSVG(element, filename, theme = 'light', metadata = {}) {
    try {
        const themeConfig = THEME_CONFIG[theme];

        // Find the SVG element within the container
        const svgElement = element.querySelector('svg');
        if (!svgElement) {
            throw new Error('No SVG element found in the chart container');
        }

        // Clone the SVG to avoid mutating the live DOM
        const clonedSvg = svgElement.cloneNode(true);

        // Apply theme background
        clonedSvg.style.backgroundColor = themeConfig.backgroundColor;

        // Set explicit width/height attributes for standalone SVG
        const rect = svgElement.getBoundingClientRect();
        if (!clonedSvg.getAttribute('width')) {
            clonedSvg.setAttribute('width', rect.width);
        }
        if (!clonedSvg.getAttribute('height')) {
            clonedSvg.setAttribute('height', rect.height);
        }

        // Add a background rect as the first child for proper theme rendering
        const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bgRect.setAttribute('width', '100%');
        bgRect.setAttribute('height', '100%');
        bgRect.setAttribute('fill', themeConfig.backgroundColor);
        clonedSvg.insertBefore(bgRect, clonedSvg.firstChild);

        // Apply theme to text elements within the SVG
        const textElements = clonedSvg.querySelectorAll('text');
        textElements.forEach(el => {
            if (theme === 'dark') {
                el.setAttribute('fill', themeConfig.textColor);
            }
        });

        // Serialize the SVG to string
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(clonedSvg);

        // Wrap with XML metadata
        const xmlDocument = wrapSvgWithXmlMetadata(svgString, {
            title: metadata.title || filename,
            description: metadata.description || `Exported ${theme} theme chart`,
            chartType: metadata.chartType || 'chart',
            ...metadata,
        });

        // Create and trigger download
        const blob = new Blob([xmlDocument], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(`Chart exported as SVG/XML (${theme} mode)`);
    } catch (error) {
        console.error('SVG export failed:', error);
        toast.error('Failed to export chart as SVG: ' + error.message);
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
