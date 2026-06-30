import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, BarChart3 } from 'lucide-react';
import { UniversalChart } from '@/components/UniversalChart';
import { Alert, AlertDescription } from '@/components/ui/alert';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const SharedAnalysis = () => {
    const { token } = useParams();
    const [analysis, setAnalysis] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalysis = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/share/${token}`);
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || 'Failed to load analysis');
                }
                const data = await res.json();
                setAnalysis(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalysis();
    }, [token]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-slate-50 dark:bg-slate-900">
                <div className="animate-pulse text-slate-500">Loading shared analysis...</div>
            </div>
        );
    }

    if (error || !analysis) {
        return (
            <div className="flex flex-col items-center justify-center h-screen p-4 bg-slate-50 dark:bg-slate-900">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error || 'Analysis not found'}</AlertDescription>
                        </Alert>
                        <div className="mt-4 flex justify-center">
                            <Link to="/">
                                <Button>Go to Dataviz</Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    let chartConfig = null;
    let chartData = null;

    if (analysis.equation) {
        const sortedData = [...analysis.data_points].sort((a, b) => a.x - b.x);
        chartData = sortedData;
        chartConfig = {
            chartType: 'scatter',
            title: analysis.title,
            xAxisKey: 'x',
            dataKeys: ['y'],
            yAxisDomain: ['auto', 'auto'],
        };
    } else {
        chartData = analysis.data_points || [];
        chartConfig = {
            chartType: 'bar',
