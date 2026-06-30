import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

/**
 * ExportButton – provides two export modes for a visualization.
 * Props:
 *   visualizationId: ID of the visualization to export.
 *   mode: optional default mode ('chartOnly' | 'full').
 */
export const ExportButton = ({ visualizationId }) => {
  const exportNotebook = async (mode) => {
    try {
      const resp = await fetch('/api/export/notebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visualization_id: visualizationId, mode }),
      });
      if (!resp.ok) throw new Error('Export failed');
      const { notebook_content } = await resp.json();
      const blob = new Blob([notebook_content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `visualization-${visualizationId}-${mode}.ipynb`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      // In a real app you would show a toast
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => exportNotebook('chartOnly')}
        className="gap-1.5 text-xs"
        title="Export chart only (no data)"
      >
        <Download className="h-3.5 w-3.5" />
        Chart only
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => exportNotebook('full')}
        className="gap-1.5 text-xs"
        title="Export chart with data and AI insights"
      >
        <Download className="h-3.5 w-3.5" />
        Full insight
      </Button>
    </div>
  );
};
