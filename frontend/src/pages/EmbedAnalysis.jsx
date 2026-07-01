import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { UniversalChart } from '@/components/UniversalChart';
import { Alert, AlertDescription } from '@/components/ui/alert';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function EmbedAnalysis() {
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
            <div className="flex justify-center items-center h-screen bg-transparent">
                <div className="animate-pulse text-slate-500">Loading chart...</div>
            </div>
        );
    }

    if (error || !analysis) {
        return (
            <div className="flex justify-center items-center h-screen bg-transparent p-4">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error || 'Chart not found'}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="w-full h-screen bg-white flex flex-col">
            <div className="flex-1 min-h-0">
                <UniversalChart 
                    data={analysis.data_points}
                    type="scatter"
                    regressionLine={analysis.predictions}
                />
            </div>
            {analysis.equation && (
                <div className="p-2 bg-slate-50 border-t flex justify-between items-center text-xs text-slate-600">
                    <span className="font-mono">{analysis.equation}</span>
                    {analysis.r_squared !== null && (
                        <span>R²: {analysis.r_squared.toFixed(4)}</span>
                    )}
                </div>
            )}
        </div>
    );
}
