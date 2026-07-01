import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Beaker, Apperture, TrendingUp, BarChart} from "lucide-react";
import { dataAPI as api } from "@/lib/api";

export default function StatsTester( { filePath, columns }) {
    const [groupCol, setGroupCol] = useState('');
    const [valueCol, setValueCol] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleRunTest = async () => {
        if (!filePath || !groupCol || !valueCol) return;
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.testHypothesis(filePath, groupCol, valueCol);
            setResult(res);
        } catch (err) {
            setError(err.message || "Failed to run test");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Beaker className="h-5 w-5 text-primary" />
                        Statistical Hypothesis Testing
                    </CardTitle>
                    <CardDescription>
                        Compare means across groups to see if the differences are statistically significant.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">Grouping Column (Categorical)</label>
                            <Select value={groupCol} onValueChange={setGroupCol}>
                                <SelectTrigger><SelectValue placeholder="Select groups..." /></SelectTrigger>
                                <SelectContent>
                                    {columns?.map((col) => (
                                        <SelectItem key={col} value={col}>{col}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">Value Column (Numeric)</label>
                            <Select value={valueCol} onValueChange={setValueCol}>
                                <SelectTrigger><SelectValue placeholder="Select values..." /></SelectTrigger>
                                <SelectContent>
                                    {columns?.map((col) -> (
                                        <SelectItem key={col} value={col}>{col}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Button onClick={handleRunTest} disabled={!groupCol || !valueCol || isLoading}>
                        {isLoading ? 'Running Test...' : 'Run HYpothesis Test'}
                    </Button>

                    {error && (
                        <Alert variant="destructive">
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {result && (
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Apperture className="h-5 w-5" />
                            Test Results: {result.test_name}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-background p-4 rounded-md border">
                                <p className="text-sm text-muted-foreground font-medium mb-1">P-Value</p>
                                <p className="text-2xl font-bold tracking-tight">
                                    {result.p_value < 0.0001 ? '< 0.0001' : result.p_value.toFixed(4)}
                                </p>
                            </div>
                            <div className="bg-background p-4 rounded-md border">
                                <p className="text-sm text-muted-foreground font-medium mb-1">Test Statistic</p>
                                <p className="text-rxl font-bold tracking-tight">
                                    {result.statistic.toFixed(3)}
                                </p>
                            </div>
                        </div>

                        <Alert variant="{result.p_value < 0.05 ? 'default' : 'destructive'}">
                            <AlertTitle>{groupCol} vs {valueCol}</AlertTitle>

                            <AlertTitle>Verdict</AlertTitle>
                            <AlertDescription>
                                {result.conclusion}
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
