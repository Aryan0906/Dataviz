import { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Upload, Plus, Download, TrendingUp, Calculator } from "lucide-react";
import { toast } from "sonner";
import Papa from "papaparse";
import regression from "regression";
import { DataPlot } from "./DataPlot";
import { DataTable } from "./DataTable";
import { ThemeToggle } from "./theme-toggle";

export interface DataPoint {
  x: number;
  y: number;
}

export interface RegressionResult {
  equation: string;
  r2: number;
  predict: (x: number) => number;
  type: string;
}

export const DataAnalyzer = () => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [manualX, setManualX] = useState("");
  const [manualY, setManualY] = useState("");
  const [predictX, setPredictX] = useState("");
  const [predictY, setPredictY] = useState("");
  const [predictionMode, setPredictionMode] = useState<"x-from-y" | "y-from-x">("y-from-x");

  // Calculate regression analysis
  const regressionAnalysis = useMemo((): RegressionResult | null => {
    if (data.length < 2) return null;

    const points: [number, number][] = data.map(d => [d.x, d.y]);
    
    // Try different regression types and pick the best one
    const models = [
      { type: 'linear', result: regression.linear(points) },
      { type: 'polynomial', result: regression.polynomial(points, { order: 2 }) },
      { type: 'exponential', result: regression.exponential(points) },
      { type: 'logarithmic', result: regression.logarithmic(points) },
      { type: 'power', result: regression.power(points) }
    ];

    // Find the best fit based on R²
    const bestModel = models.reduce((best, current) => 
      current.result.r2 > best.result.r2 ? current : best
    );

    return {
      equation: bestModel.result.string,
      r2: bestModel.result.r2,
      predict: (x: number) => bestModel.result.predict(x)[1],
      type: bestModel.type
    };
  }, [data]);

  const addManualPoint = useCallback(() => {
    const x = parseFloat(manualX);
    const y = parseFloat(manualY);
    
    if (isNaN(x) || isNaN(y)) {
      toast.error("Please enter valid numbers for both X and Y");
      return;
    }

    setData(prev => [...prev, { x, y }].sort((a, b) => a.x - b.x));
    setManualX("");
    setManualY("");
    toast.success("Data point added successfully");
  }, [manualX, manualY]);

  const handleCSVUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        try {
          const newData: DataPoint[] = [];
          
          results.data.forEach((row: any) => {
            const x = parseFloat(row.x || row.X || Object.values(row)[0] as string);
            const y = parseFloat(row.y || row.Y || Object.values(row)[1] as string);
            
            if (!isNaN(x) && !isNaN(y)) {
              newData.push({ x, y });
            }
          });

          if (newData.length === 0) {
            toast.error("No valid data points found in CSV");
            return;
          }

          setData(newData.sort((a, b) => a.x - b.x));
          toast.success(`Successfully loaded ${newData.length} data points`);
        } catch (error) {
          toast.error("Error parsing CSV file");
        }
      },
      error: () => {
        toast.error("Error reading CSV file");
      }
    });

    // Clear the input
    event.target.value = "";
  }, []);

  const clearData = useCallback(() => {
    setData([]);
    toast.success("Data cleared");
  }, []);

  // Inverse prediction function to find X for given Y
  const findXForY = useCallback((targetY: number): number => {
    if (!regressionAnalysis) return 0;
    
    // Binary search approach for inverse prediction
    let minX = Math.min(...data.map(d => d.x)) - 10;
    let maxX = Math.max(...data.map(d => d.x)) + 10;
    let iterations = 0;
    const maxIterations = 100;
    const tolerance = 0.0001;
    
    while (iterations < maxIterations && Math.abs(maxX - minX) > tolerance) {
      const midX = (minX + maxX) / 2;
      const predictedY = regressionAnalysis.predict(midX);
      
      if (Math.abs(predictedY - targetY) < tolerance) {
        return midX;
      }
      
      if (predictedY < targetY) {
        minX = midX;
      } else {
        maxX = midX;
      }
      
      iterations++;
    }
    
    return (minX + maxX) / 2;
  }, [data, regressionAnalysis]);

  const predictNextValue = useCallback(() => {
    if (!regressionAnalysis) {
      toast.error("Need at least 2 data points for prediction");
      return;
    }

    if (predictionMode === "y-from-x") {
      const x = parseFloat(predictX);
      if (isNaN(x)) {
        toast.error("Please enter a valid X value for prediction");
        return;
      }

      const predictedY = regressionAnalysis.predict(x);
      toast.success(`Predicted Y value for X=${x}: ${predictedY.toFixed(4)}`);
      
      // Add prediction point to data for visualization
      setData(prev => [...prev, { x, y: predictedY }].sort((a, b) => a.x - b.x));
      setPredictX("");
    } else {
      const y = parseFloat(predictY);
      if (isNaN(y)) {
        toast.error("Please enter a valid Y value for prediction");
        return;
      }

      const predictedX = findXForY(y);
      toast.success(`Predicted X value for Y=${y}: ${predictedX.toFixed(4)}`);
      
      // Add prediction point to data for visualization
      setData(prev => [...prev, { x: predictedX, y }].sort((a, b) => a.x - b.x));
      setPredictY("");
    }
  }, [predictX, predictY, predictionMode, regressionAnalysis, findXForY]);

  const exportData = useCallback(() => {
    if (data.length === 0) {
      toast.error("No data to export");
      return;
    }

    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data-analysis.csv';
    a.click();
    
    URL.revokeObjectURL(url);
    toast.success("Data exported successfully");
  }, [data]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="text-center flex-1 space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Data Analysis & Prediction Tool
            </h1>
            <p className="text-muted-foreground text-lg">
              Analyze data, fit curves, and predict future values with precision
            </p>
          </div>
          <div className="absolute top-6 right-6">
            <ThemeToggle />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Data Input Section */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-primary" />
                  Data Input
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="manual" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                    <TabsTrigger value="csv">CSV Upload</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="manual" className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="x-value">X Value</Label>
                        <Input
                          id="x-value"
                          type="number"
                          step="any"
                          placeholder="7.1"
                          value={manualX}
                          onChange={(e) => setManualX(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="y-value">Y Value</Label>
                        <Input
                          id="y-value"
                          type="number"
                          step="any"
                          placeholder="1"
                          value={manualY}
                          onChange={(e) => setManualY(e.target.value)}
                        />
                      </div>
                    </div>
                    <Button onClick={addManualPoint} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Point
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="csv" className="space-y-4">
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <Label htmlFor="csv-upload" className="cursor-pointer">
                        <span className="text-sm text-muted-foreground">
                          Click to upload CSV file
                        </span>
                        <Input
                          id="csv-upload"
                          type="file"
                          accept=".csv"
                          className="hidden"
                          onChange={handleCSVUpload}
                        />
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      CSV should have columns: x, y (or X, Y)
                    </p>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Regression Analysis */}
            {regressionAnalysis && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-accent" />
                    Curve Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Best Fit Model</Label>
                    <Badge variant="secondary" className="ml-2 capitalize">
                      {regressionAnalysis.type}
                    </Badge>
                  </div>
                  
                  <div>
                    <Label>Equation</Label>
                    <div className="mt-1 p-3 bg-muted rounded-md">
                      <code className="text-sm font-mono">
                        {regressionAnalysis.equation}
                      </code>
                    </div>
                  </div>
                  
                  <div>
                    <Label>R² (Goodness of Fit)</Label>
                    <div className="mt-1">
                      <Badge 
                        variant={regressionAnalysis.r2 > 0.8 ? "default" : "secondary"}
                        className="font-mono"
                      >
                        {regressionAnalysis.r2.toFixed(4)}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label>Predict Values</Label>
                    
                    <Tabs value={predictionMode} onValueChange={(value) => setPredictionMode(value as "x-from-y" | "y-from-x")}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="y-from-x">Y from X</TabsTrigger>
                        <TabsTrigger value="x-from-y">X from Y</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="y-from-x" className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            step="any"
                            placeholder="Enter X value"
                            value={predictX}
                            onChange={(e) => setPredictX(e.target.value)}
                          />
                          <Button onClick={predictNextValue} size="sm">
                            <Calculator className="h-4 w-4" />
                          </Button>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="x-from-y" className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            step="any"
                            placeholder="Enter Y value"
                            value={predictY}
                            onChange={(e) => setPredictY(e.target.value)}
                          />
                          <Button onClick={predictNextValue} size="sm">
                            <Calculator className="h-4 w-4" />
                          </Button>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Data Actions */}
            {data.length > 0 && (
              <Card className="shadow-card">
                <CardContent className="pt-6">
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={exportData} className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                    <Button variant="destructive" onClick={clearData} className="flex-1">
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Visualization Section */}
          <div className="lg:col-span-2 space-y-6">
            {data.length > 0 ? (
              <>
                <DataPlot data={data} regression={regressionAnalysis} />
                <DataTable data={data} onDataChange={setData} />
              </>
            ) : (
              <Card className="shadow-card h-96">
                <CardContent className="h-full flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground" />
                    <h3 className="text-lg font-semibold">No Data Yet</h3>
                    <p className="text-muted-foreground">
                      Add some data points to see the visualization and analysis
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};