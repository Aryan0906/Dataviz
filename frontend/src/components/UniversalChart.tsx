import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import type { DataPoint, RegressionResult } from "./DataAnalyzer";
import type { CategoryPoint } from "./DataAnalyzer";
import { useMemo, forwardRef } from "react";
import { DataPlot } from "./DataPlot";

interface UniversalChartProps {
  type: 'bar' | 'pie' | 'regression';
  data?: DataPoint[];
  regression?: RegressionResult | null;
  categories?: CategoryPoint[];
}

export const UniversalChart = forwardRef<HTMLDivElement, UniversalChartProps>(
  ({ type, data = [], regression = null, categories = [] }, ref) => {
    if (type === 'regression') {
      return <DataPlot ref={ref} data={data} regression={regression} />;
    }

    const barData = useMemo(() => {
      return categories;
    }, [categories]);

    const pieData = useMemo(() => {
      return categories.map(c => ({ name: c.label, value: c.value }));
    }, [categories]);

    const COLORS = [
      '#8884d8', '#82ca9d', '#ffc658', '#ff7f50', '#a4de6c',
      '#d0ed57', '#8dd1e1', '#83a6ed', '#8e44ad', '#f39c12'
    ];

    if (type === 'bar') {
      return (
        <div ref={ref}>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
              <Bar dataKey="value" fill="hsl(var(--chart-primary))" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (type === 'pie') {
      return (
        <div ref={ref}>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      );
    }

    return null;
  }
);

UniversalChart.displayName = 'UniversalChart';
