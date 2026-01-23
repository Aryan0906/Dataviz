import { useState, useRef, useMemo, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Plus, Zap, Save, BarChart3, AlertCircle, LogOut, FileUp } from "lucide-react";
import { toast } from "sonner";
import { DataPlot } from "./DataPlot";
import { DataTable } from "./DataTable";
import { ThemeToggle } from "./theme-toggle";
import { dataAPI } from "@/lib/api";
import Papa from "papaparse";
import regression from "regression";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UniversalChart } from "./UniversalChart";

export interface DataPoint {
  x: number;
  y: number;
}

export interface CategoryPoint {
  label: string;
  value: number;
}

export interface RegressionResult {
  r2: number;
  predict: (x: number) => number;
  type: string;
  equation?: string;
  meanY: number;
  varianceY: number;
  stdDevY: number;
  rmse: number;
  mae: number;
  adjustedR2?: number;
}

export const DataAnalyzer = () => {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [data, setData] = useState<DataPoint[]>([]);
  const [categories, setCategories] = useState<CategoryPoint[]>([]);
  const [regressionResult, setRegressionResult] = useState<RegressionResult | null>(null);
  const [tab, setTab] = useState<"regression" | "categorical">("regression");
  const [xValue, setXValue] = useState("");
  const [yValue, setYValue] = useState("");
  const [catLabel, setCatLabel] = useState("");
  const [catValue, setCatValue] = useState("");
  const [csvText, setCsvText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [regressionType, setRegressionType] = useState<"linear" | "polynomial">("linear");
  const [polynomialDegree, setPolynomialDegree] = useState(2);

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

  const addCategory = () => {
    setError("");
    const label = catLabel.trim();
    const value = parseFloat(catValue);
    if (!label) {
      setError("Please enter a category name");
      return;
    }
    if (isNaN(value)) {
      setError("Please enter a valid numeric value");
      return;
    }
    const next = [...categories, { label, value }];
    setCategories(next);
    setCatLabel("");
    setCatValue("");
    toast.success("Category added");
  };

  const analyzeData = () => {
    setError("");
    if (data.length < 2) {
      setError("Need at least 2 data points to analyze");
      return;
    }

    try {
      const dataPoints = data.map(d => [d.x, d.y]);
      let result: any;
      let type = regressionType;
      let equation = "";

      if (regressionType === "polynomial") {
        result = regression.polynomial(dataPoints, polynomialDegree);
        
        // Generate equation string
        const coefficients = result.equation;
        const terms: string[] = [];
        for (let i = coefficients.length - 1; i >= 0; i--) {
          const coef = coefficients[i];
          if (i === 0) {
            terms.push(`${coef.toFixed(4)}`);
          } else if (i === 1) {
            terms.push(`${coef.toFixed(4)}x`);
          } else {
            terms.push(`${coef.toFixed(4)}x^${i}`);
          }
        }
        equation = terms.join(" + ").replace(/\+ -/g, "- ");
        type = `polynomial-${polynomialDegree}`;
      } else {
        result = regression.linear(dataPoints);
        const slope = result.equation[1].toFixed(4);
        const intercept = result.equation[0].toFixed(4);
        equation = `y = ${slope}x + ${intercept}`;
      }

      // Compute descriptive stats and error metrics
      const n = data.length;
      const ys = data.map(d => d.y);
      const meanY = ys.reduce((acc, y) => acc + y, 0) / n;
      const varianceY = n > 1
        ? ys.reduce((acc, y) => acc + Math.pow(y - meanY, 2), 0) / (n - 1)
        : 0;
      const stdDevY = Math.sqrt(varianceY);
      const residuals = data.map(d => {
        try {
          return d.y - (result.predict(d.x)[1] as number);
        } catch {
          return 0;
        }
      });
      const mse = residuals.reduce((acc, r) => acc + r * r, 0) / n;
      const rmse = Math.sqrt(mse);
      const mae = residuals.reduce((acc, r) => acc + Math.abs(r), 0) / n;
      const p = regressionType === "polynomial" ? polynomialDegree : 1;
      const adjustedR2 = n > (p + 1)
        ? 1 - (1 - result.r2) * ((n - 1) / (n - p - 1))
        : undefined;

      setRegressionResult({
        r2: result.r2,
        predict: (x: number) => result.predict(x)[1],
        type: type,
        equation: equation,
        meanY,
        varianceY,
        stdDevY,
        rmse,
        mae,
        adjustedR2,
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

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    setError("");
    const file = event.target.files?.[0];
    
    if (!file) {
      return;
    }

    if (!file.name.endsWith('.csv')) {
      setError("Please select a CSV file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      Papa.parse(csv, {
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
              setError("No valid data found in CSV file");
              return;
            }

            newData.sort((a: DataPoint, b: DataPoint) => a.x - b.x);
            setData(newData);
            setCsvText("");
            toast.success(`Imported ${newData.length} data points from file`);
            
            // Reset file input
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          } catch (err) {
            setError("Failed to parse CSV file");
          }
        },
        error: () => {
          setError("Failed to read CSV file");
        },
      });
    };
    reader.onerror = () => {
      setError("Failed to read file");
    };
    reader.readAsText(file);
  };

  const saveAnalysis = async () => {
    if (!regressionResult || data.length === 0) {
      setError("No analysis to save");
      return;
    }

    setLoading(true);
    try {
      if (!token) throw new Error("Not authenticated");
      
      const typeLabel = regressionResult.type.includes("polynomial") 
        ? `Polynomial Regression (Degree ${polynomialDegree})`
        : "Linear Regression";
      
      await dataAPI.save(
        token,
        typeLabel,
        data,
        regressionResult.type,
        regressionResult.equation || `R² = ${regressionResult.r2.toFixed(4)}`,
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
      setCategories([]);
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

        {/* Input Section with Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Add Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
              <TabsList>
                <TabsTrigger value="regression">Regression Analysis</TabsTrigger>
                <TabsTrigger value="categorical">Categorical Plotting</TabsTrigger>
              </TabsList>

              <TabsContent value="regression" className="space-y-4">
                <div className="flex gap-3">
                  <Input
                    type="number"
                    placeholder="X value"
                    value={xValue}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setXValue(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Y value"
                    value={yValue}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setYValue(e.target.value)}
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
                  
                  <div className="space-y-3">
                    {/* File Upload Option */}
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Button 
                        onClick={() => fileInputRef.current?.click()} 
                        variant="outline" 
                        className="w-full gap-2"
                      >
                        <FileUp className="h-4 w-4" />
                        Upload CSV File
                      </Button>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-border"></div>
                      <span className="text-xs text-muted-foreground">or</span>
                      <div className="flex-1 h-px bg-border"></div>
                    </div>

                    {/* Text Paste Option */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-2 block">Paste CSV Data</label>
                      <Textarea
                        placeholder="Paste CSV data here (X,Y format, one pair per line)"
                        value={csvText}
                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setCsvText(e.target.value)}
                        className="h-20 font-mono text-xs"
                      />
                      <Button onClick={importCSV} variant="outline" className="w-full mt-2 gap-2">
                        <Upload className="h-4 w-4" />
                        Import from Text
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="categorical" className="space-y-4">
                <div className="flex gap-3">
                  <Input
                    type="text"
                    placeholder="Category Name"
                    value={catLabel}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setCatLabel(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Value"
                    value={catValue}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setCatValue(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={addCategory} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>

                {categories.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {categories.map((c, idx) => (
                      <Card key={idx} className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{c.label}</div>
                          <div className="text-muted-foreground">{c.value}</div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
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
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Analysis Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground">R²</div>
                      <div className="text-xl font-semibold">{regressionResult.r2.toFixed(4)}</div>
                    </div>
                    {typeof regressionResult.adjustedR2 === 'number' && (
                      <div>
                        <div className="text-xs text-muted-foreground">Adjusted R²</div>
                        <div className="text-xl font-semibold">{(regressionResult.adjustedR2 || 0).toFixed(4)}</div>
                      </div>
                    )}
                    <div>
                      <div className="text-xs text-muted-foreground">Mean (Y)</div>
                      <div className="text-xl font-semibold">{regressionResult.meanY.toFixed(4)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Variance (Y)</div>
                      <div className="text-xl font-semibold">{regressionResult.varianceY.toFixed(4)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Std Dev (Y)</div>
                      <div className="text-xl font-semibold">{regressionResult.stdDevY.toFixed(4)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">RMSE</div>
                      <div className="text-xl font-semibold">{regressionResult.rmse.toFixed(4)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">MAE</div>
                      <div className="text-xl font-semibold">{regressionResult.mae.toFixed(4)}</div>
                    </div>
                  </div>
                  {regressionResult.equation && (
                    <div className="mt-4">
                      <div className="text-xs text-muted-foreground">Model Equation</div>
                      <div className="font-mono text-sm break-words">{regressionResult.equation}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Analysis / Plot Actions */}
        {tab === "regression" && data.length >= 2 && !regressionResult && (
          <div className="space-y-4">
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-base">Regression Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Regression Type</label>
                    <select
                      value={regressionType}
                      onChange={(e) => setRegressionType(e.target.value as "linear" | "polynomial")}
                      className="w-full px-3 py-2 border rounded-lg bg-background"
                    >
                      <option value="linear">Linear (y = mx + b)</option>
                      <option value="polynomial">Polynomial</option>
                    </select>
                  </div>
                  {regressionType === "polynomial" && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Polynomial Degree</label>
                      <select
                        value={polynomialDegree}
                        onChange={(e) => setPolynomialDegree(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border rounded-lg bg-background"
                      >
                        <option value={2}>Quadratic (Degree 2)</option>
                        <option value={3}>Cubic (Degree 3)</option>
                        <option value={4}>Quartic (Degree 4)</option>
                        <option value={5}>Quintic (Degree 5)</option>
                        <option value={6}>Degree 6</option>
                      </select>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            <Button onClick={analyzeData} size="lg" className="w-full gap-2">
              <Zap className="h-4 w-4" />
              Analyze Data
            </Button>
          </div>
        )}

        {tab === "categorical" && categories.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Bar Chart</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <UniversalChart type="bar" categories={categories} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pie Chart</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <UniversalChart type="pie" categories={categories} />
                </div>
              </CardContent>
            </Card>
          </div>
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
        {tab === "regression" && data.length > 0 && (
          <UniversalChart type="regression" data={data} regression={regressionResult} />
        )}

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
