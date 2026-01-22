import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Plus, Zap, Save, BarChart3, AlertCircle, LogOut } from "lucide-react";
import { toast } from "sonner";
import { DataPlot } from "./DataPlot";
import { DataTable } from "./DataTable";
import { ThemeToggle } from "./theme-toggle";
import { dataAPI } from "@/lib/api";
import Papa from "papaparse";
import regression from "regression";

export interface DataPoint {
  x: number;
  y: number;
}

export interface RegressionResult {
  r2: number;
  predict: (x: number) => number;
}

export const DataAnalyzer = () => {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  
  const [data, setData] = useState<DataPoint[]>([]);
  const [regressionResult, setRegressionResult] = useState<RegressionResult | null>(null);
  const [xValue, setXValue] = useState("");
  const [yValue, setYValue] = useState("");
  const [csvText, setCsvText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addPoint = () => {
    setError("");
    const x = parseFloat(xValue);
    const y = parseFloat(yValue);

    if (isNaN(x) || isNaN(y)) {
      setError("Please enter valid numbers for X and Y");
      return;
    }

    const newData = [...data, { x, y }];
    newData.sort((a, b) => a.x - b.x);
    setData(newData);
    setXValue("");
    setYValue("");
    toast.success("Data point added");
  };

  const analyzeData = () => {
    setError("");
    if (data.length < 2) {
      setError("Need at least 2 data points to analyze");
      return;
    }

    try {
      const result = regression.linear(data.map(d => [d.x, d.y]));
      setRegressionResult({
        r2: result.r2,
        predict: (x: number) => result.predict(x)[1],
      });
      toast.success("Analysis complete!");
    } catch (err) {
      setError("Failed to analyze data");
    }
  };

  const importCSV = () => {
    setError("");
    if (!csvText.trim()) {
      setError("Please paste CSV data");
      return;
    }

    Papa.parse(csvText, {
      header: false,
      skipEmptyLines: true,
      complete: (results: any) => {
        try {
          const newData = results.data
            .map((row: any[]) => ({
              x: parseFloat(row[0]),
              y: parseFloat(row[1]),
            }))
            .filter((d: DataPoint) => !isNaN(d.x) && !isNaN(d.y));

          if (newData.length === 0) {
            setError("No valid data found in CSV");
            return;
          }

          newData.sort((a: DataPoint, b: DataPoint) => a.x - b.x);
          setData(newData);
          setCsvText("");
          toast.success(`Imported ${newData.length} data points`);
        } catch (err) {
          setError("Failed to parse CSV data");
        }
      },
      error: () => {
        setError("Failed to parse CSV");
      },
    });
  };

  const saveAnalysis = async () => {
    if (!regressionResult || data.length === 0) {
      setError("No analysis to save");
      return;
    }

    setLoading(true);
    try {
      if (!token) throw new Error("Not authenticated");
      
      await dataAPI.save(
        token,
        "Linear Regression Analysis",
        data,
        "linear",
        `y = mx + b (R² = ${regressionResult.r2.toFixed(4)})`,
        regressionResult.r2
      );
      toast.success("Analysis saved successfully");
    } catch (err) {
      toast.error("Failed to save analysis");
    } finally {
      setLoading(false);
    }
  };

  const clearData = () => {
    if (window.confirm("Clear all data?")) {
      setData([]);
      setRegressionResult(null);
      setCsvText("");
      setError("");
      toast.success("Data cleared");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              Data Analyzer
            </h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, <span className="font-semibold">{user?.name || "Guest"}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <Card className="px-4 py-2 bg-primary/5 border-primary/20">
                <div className="text-sm">
                  <p className="text-muted-foreground">Logged in as</p>
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </Card>
            )}
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Add Data Points</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Input
                type="number"
                placeholder="X value"
                value={xValue}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setXValue(e.target.value)}
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="Y value"
                value={yValue}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setYValue(e.target.value)}
                className="flex-1"
              />
              <Button onClick={addPoint} className="gap-2">
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Upload className="h-4 w-4" />
                <span className="font-medium">Import CSV</span>
              </div>
              <Textarea
                placeholder="Paste CSV data here (X,Y format, one pair per line)"
                value={csvText}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCsvText(e.target.value)}
                className="h-20 font-mono text-xs"
              />
              <Button onClick={importCSV} variant="outline" className="w-full mt-2 gap-2">
                <Upload className="h-4 w-4" />
                Import
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Summary */}
        {data.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold">{data.length}</div>
                  <div className="text-sm text-muted-foreground">Data Points</div>
                </div>
              </CardContent>
            </Card>
            {regressionResult && (
              <>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold">{(regressionResult.r2 * 100).toFixed(1)}%</div>
                      <div className="text-sm text-muted-foreground">R² Value</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Badge variant="secondary" className="text-base">
                        Analyzed
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}

        {/* Analysis Button */}
        {data.length >= 2 && !regressionResult && (
          <Button onClick={analyzeData} size="lg" className="w-full gap-2">
            <Zap className="h-4 w-4" />
            Analyze Data
          </Button>
        )}

        {/* Save Button */}
        {regressionResult && (
          <Button
            onClick={saveAnalysis}
            size="lg"
            className="w-full gap-2"
            disabled={loading}
          >
            <Save className="h-4 w-4" />
            {loading ? "Saving..." : "Save Analysis"}
          </Button>
        )}

        {/* Chart */}
        {data.length > 0 && <DataPlot data={data} regression={regressionResult} />}

        {/* Data Table */}
        {data.length > 0 && (
          <>
            <DataTable data={data} onDataChange={setData} />
            <Button onClick={clearData} variant="outline" className="w-full">
              Clear All Data
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
