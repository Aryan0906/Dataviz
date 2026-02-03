import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Code2 } from 'lucide-react';
import ChartCodeExportModal from './ChartCodeExportModal';

/**
 * ExportCodeButton - Standardized reusable button for exporting charts as Python code
 * 
 * Usage examples:
 * 
 * // For categorical charts (bar, pie, histogram, scatter, heatmap)
 * <ExportCodeButton
 *   chartType="bar"
 *   categoricalData={[{ label: 'A', value: 10 }, { label: 'B', value: 20 }]}
 *   chartTitle="My Bar Chart"
 * />
 * 
 * // For regression charts
 * <ExportCodeButton
 *   chartType="regression"
 *   regressionData={{
 *     dataPoints: [{ x: 1, y: 2 }, { x: 2, y: 4 }],
 *     equation: 'y = 2x',
 *     modelType: 'linear'
 *   }}
 *   chartTitle="Linear Regression"
 * />
 * 
 * // For other chart types with Chart.js/Plotly data format
 * <ExportCodeButton
 *   chartType="treemap"
 *   chartData={{ labels: [...], datasets: [...] }}
 *   chartTitle="My Treemap"
 * />
 */
const ExportCodeButton = ({
  chartType = 'bar',
  chartData = null,
  categoricalData = null,
  regressionData = null,
  chartTitle = 'Chart',
  buttonText = 'Export Code',
  buttonSize = 'sm',
  buttonVariant = 'outline',
  buttonClassName = '',
  showIcon = true,
  disabled = false,
  onExport = null, // Optional callback when modal opens
}) => {
  const [showModal, setShowModal] = useState(false);

  const handleClick = () => {
    setShowModal(true);
    if (onExport) {
      onExport();
    }
  };

  return (
    <>
      <Button
        onClick={handleClick}
        size={buttonSize}
        variant={buttonVariant}
        className={`gap-2 ${buttonClassName}`}
        disabled={disabled}
      >
        {showIcon && <Code2 className="h-4 w-4" />}
        <span className="hidden sm:inline text-xs">{buttonText}</span>
      </Button>

      <ChartCodeExportModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        chartType={chartType}
        chartData={chartData}
        categoricalData={categoricalData}
        regressionData={regressionData}
        chartTitle={chartTitle}
      />
    </>
  );
};

export default ExportCodeButton;
