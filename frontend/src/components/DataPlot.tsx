import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";
import type { DataPoint, RegressionResult } from "./DataAnalyzer";

interface DataPlotProps {
  data: DataPoint[];
  regression: RegressionResult | null;
}

export const DataPlot = ({ data, regression }: DataPlotProps) => {
  const plotData = useMemo(() => {
    if (data.length === 0) return [];
    
    const sortedData = [...data].sort((a, b) => a.x - b.x);
    const minX = Math.min(...sortedData.map(d => d.x));
    const maxX = Math.max(...sortedData.map(d => d.x));
    
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
    
    const combined: Array<{
      x: number;
      y?: number;
      regressionY?: number;
    }> = [];
    sortedData.forEach(point => {
      combined.push({
        x: point.x,
        y: point.y,
        regressionY: regression ? regression.predict(point.x) : undefined
      });
    });
    
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

  const formatTooltip = (value: number | string, name: string): [string, string] => {
    if (typeof value === 'number') {
      return [value.toFixed(4), name === 'y' ? 'Actual' : 'Fitted'];
    }
    return [String(value), name];
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Chart
            </CardTitle>
            <div className="flex flex-col gap-2 items-end">
              <div className="flex gap-2">
                <Badge variant="outline">{data.length} points</Badge>
                {regression && (
                  <Badge variant="secondary">
                    R² = {regression.r2.toFixed(3)}
                  </Badge>
                )}
              </div>
              {regression?.equation && (
                <div className="text-xs text-muted-foreground max-w-md text-right">
                  {regression.equation}
                </div>
              )}
            </div>
          </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={plotData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
              <XAxis 
                dataKey="x" 
                type="number"
                scale="linear"
                domain={['dataMin', 'dataMax']}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                type="number"
                domain={['dataMin', 'dataMax']}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={formatTooltip}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              
              <Line
                type="monotone"
                dataKey="y"
                stroke="hsl(var(--chart-primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--chart-primary))', r: 4 }}
                name="Data"
                connectNulls={false}
              />
              
              {regression && (
                <Line
                  type="monotone"
                  dataKey="regressionY"
                  stroke="hsl(var(--chart-secondary))"
                  strokeWidth={2}
                  dot={false}
                  name="Fit"
                  connectNulls={true}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
