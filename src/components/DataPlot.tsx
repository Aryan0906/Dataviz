import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from "recharts";
import { TrendingUp } from "lucide-react";
import type { DataPoint, RegressionResult } from "./DataAnalyzer";

interface DataPlotProps {
  data: DataPoint[];
  regression: RegressionResult | null;
}

export const DataPlot = ({ data, regression }: DataPlotProps) => {
  // Create data for the regression line
  const plotData = useMemo(() => {
    if (data.length === 0) return [];
    
    const sortedData = [...data].sort((a, b) => a.x - b.x);
    const minX = Math.min(...sortedData.map(d => d.x));
    const maxX = Math.max(...sortedData.map(d => d.x));
    
    // Create regression line points
    const regressionPoints = [];
    if (regression) {
      const step = (maxX - minX) / 100;
      for (let x = minX; x <= maxX; x += step) {
        try {
          const y = regression.predict(x);
          if (isFinite(y)) {
            regressionPoints.push({ x, regressionY: y });
          }
        } catch (error) {
          // Skip invalid points
        }
      }
    }
    
    // Combine original data with regression line
    const combined = [];
    const regressionMap = new Map(regressionPoints.map(p => [p.x.toFixed(3), p.regressionY]));
    
    // Add all original points
    sortedData.forEach(point => {
      combined.push({
        x: point.x,
        y: point.y,
        regressionY: regression ? regression.predict(point.x) : undefined
      });
    });
    
    // Add regression line points that don't have original data
    regressionPoints.forEach(point => {
      const existingPoint = combined.find(p => Math.abs(p.x - point.x) < 0.001);
      if (!existingPoint) {
        combined.push({
          x: point.x,
          y: undefined,
          regressionY: point.regressionY
        });
      }
    });
    
    return combined.sort((a, b) => a.x - b.x);
  }, [data, regression]);

  // Find the latest prediction (point with highest x value)
  const latestPrediction = useMemo(() => {
    if (data.length < 2) return null;
    const sortedData = [...data].sort((a, b) => a.x - b.x);
    const latest = sortedData[sortedData.length - 1];
    const secondLatest = sortedData[sortedData.length - 2];
    
    // Check if the latest point is likely a prediction (y value matches regression)
    if (regression) {
      const predictedY = regression.predict(latest.x);
      const tolerance = Math.abs(predictedY * 0.01); // 1% tolerance
      if (Math.abs(latest.y - predictedY) < tolerance) {
        return latest;
      }
    }
    
    return null;
  }, [data, regression]);

  const formatTooltip = (value: any, name: string) => {
    if (typeof value === 'number') {
      return [value.toFixed(4), name === 'y' ? 'Actual' : 'Fitted'];
    }
    return [value, name];
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Data Visualization
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline">{data.length} points</Badge>
            {regression && (
              <Badge variant="secondary">
                R² = {regression.r2.toFixed(3)}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={plotData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
              <XAxis 
                dataKey="x" 
                type="number"
                scale="linear"
                domain={['dataMin', 'dataMax']}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => value.toFixed(2)}
              />
              <YAxis 
                type="number"
                domain={['dataMin', 'dataMax']}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => value.toFixed(2)}
              />
              <Tooltip 
                formatter={formatTooltip}
                labelFormatter={(value) => `X: ${parseFloat(value as string).toFixed(4)}`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              
              {/* Original data points */}
              <Line
                type="monotone"
                dataKey="y"
                stroke="hsl(var(--chart-primary))"
                strokeWidth={0}
                dot={{ fill: 'hsl(var(--chart-primary))', strokeWidth: 2, r: 4 }}
                name="Data Points"
                connectNulls={false}
              />
              
              {/* Regression line */}
              {regression && (
                <Line
                  type="monotone"
                  dataKey="regressionY"
                  stroke="hsl(var(--chart-secondary))"
                  strokeWidth={2}
                  dot={false}
                  name={`${regression.type.charAt(0).toUpperCase() + regression.type.slice(1)} Fit`}
                  connectNulls={true}
                />
              )}
              
              {/* Highlight prediction point */}
              {latestPrediction && (
                <ReferenceLine 
                  x={latestPrediction.x} 
                  stroke="hsl(var(--chart-tertiary))" 
                  strokeDasharray="5 5"
                  label={{ value: "Prediction", position: "top" }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {regression && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <div className="text-sm font-medium mb-1">Current Model:</div>
            <code className="text-xs font-mono text-muted-foreground">
              {regression.equation}
            </code>
          </div>
        )}
      </CardContent>
    </Card>
  );
};