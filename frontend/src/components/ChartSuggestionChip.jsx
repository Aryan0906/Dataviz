import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/**
 * ChartSuggestionChip
 * Props:
 *  - recommendation: { recommendation: string, chart_type: string }
 *  - onApply: (chartType: string) => void
 */
export default function ChartSuggestionChip({ recommendation, onApply }) {
  if (!recommendation) return null;
  const { recommendation: text, chart_type } = recommendation;
  return (
    <div className="flex items-center space-x-2 my-2">
      <Badge variant="secondary">AI Suggestion</Badge>
      <span className="text-sm text-muted-foreground">{text}</span>
      <Button
        size="sm"
        onClick={() => onApply(chart_type)}
        className="ml-2"
      >
        Apply {chart_type}
      </Button>
    </div>
  );
}
