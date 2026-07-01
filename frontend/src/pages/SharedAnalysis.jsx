import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, BarChart3 } from 'lucide-react';
import { UniversalChart } from '@/components/UniversalChart';
import { Alert, AlertDescription } from '@/components/ui/alert';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function SharedAnalysis() {
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

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary">
                        <BarChart3 className="h-6 w-6" />
                        <span className="text-xl font-bold tracking-tight">Dataviz</span>
                    </div>
                    <Link to="/">
                        <Button variant="outline">Create Your Own</Button>
                    </Link>
                </div>
                
                <Card>
                    <CardHeader>
                        <CardTitle>{analysis.title || "Shared Analysis"}</CardTitle>
                        <p className="text-sm text-slate-500">
                            Shared on {new Date(analysis.created_at).toLocaleDateString()}
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[400px]">
                            <UniversalChart 
                                data={analysis.data_points}
                                type="scatter"
                                regressionLine={analysis.predictions}
                            />
                        </div>
                        {analysis.equation && (
                            <div className="mt-6 p-4 bg-slate-100 rounded-md">
                                <h4 className="font-semibold mb-2">Analysis Results</h4>
                                <p className="font-mono text-sm">{analysis.equation}</p>
                                {analysis.r_squared !== null && (
                                    <p className="text-sm text-slate-600 mt-1">
                                        R² Score: {analysis.r_squared.toFixed(4)}
                                    </p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
