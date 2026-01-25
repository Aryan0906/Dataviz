import { useState, useCallback, useRef, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { dataAPI, AITimeoutError } from "@/lib/api";
import { toast } from "sonner";
import { Upload, FileText, Sparkles, TrendingUp, AlertCircle, RefreshCcw, Download, FileImage, Save } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from "recharts";
import { exportChartAsPNG, exportChartAsPDF, generateFilename } from "@/lib/chartExport";

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

const EXAMPLE_QUERIES = [
  "Show sales by month as a line chart",
  "Compare revenue and expenses as a bar chart",
  "Display product distribution as a pie chart",
  "Plot price vs quantity as a scatter chart"
];

const AIFeatures = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [visualizationId, setVisualizationId] = useState<number | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [cleaningAnalysis, setCleaningAnalysis] = useState<any>(null);
  const [query, setQuery] = useState("");
  const [querying, setQuerying] = useState(false);
  const [chartConfig, setChartConfig] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [saving, setSaving] = useState(false);

  // Auto-resume functionality
  useEffect(() => {
    const loadDraft = async () => {
      try {
        const { visualization } = await dataAPI.getLatestVisualization();
        if (visualization) {
          setVisualizationId(visualization.id);
          setMetadata(visualization.data_schema);
          setCleaningAnalysis(visualization.cleaning_analysis);
          setChartConfig(visualization.chart_config);
          setChartData(visualization.data);

          if (visualization.chart_config?.title) {
            toast.info("Resumed previous analysis session");
          }
        }
      } catch (error) {
        console.error("Failed to auto-resume:", error);
      }
    };
    loadDraft();
  }, []);

  const handleSaveToHistory = async () => {
    if (!visualizationId) return;

    setSaving(true);
    try {
      await dataAPI.saveVisualizationToHistory(
        visualizationId,
        chartConfig?.title || "AI Generated Analysis"
      );
      toast.success("Analysis saved to Dashboard History");
    } catch (error) {
      toast.error("Failed to save to history");
    } finally {
      setSaving(false);
    }
  };

  const handleExportPNG = async () => {
    if (!chartRef.current) return;
    setExporting(true);
    try {
      const filename = chartConfig?.title
        ? generateFilename(chartConfig.title.toLowerCase().replace(/\s+/g, '-'))
        : generateFilename('ai-chart');
      await exportChartAsPNG(chartRef.current, filename);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!chartRef.current) return;
    setExporting(true);
    try {
      const filename = chartConfig?.title
        ? generateFilename(chartConfig.title.toLowerCase().replace(/\s+/g, '-'))
        : generateFilename('ai-chart');
      await exportChartAsPDF(chartRef.current, filename);
    } finally {
      setExporting(false);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
      } else {
        toast.error("Please upload a CSV file");
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      const result = await dataAPI.uploadCSV(file);
      setVisualizationId(result.visualization_id);
      setMetadata(result.metadata);
      setCleaningAnalysis(result.cleaning_analysis);
      toast.success("CSV uploaded and analyzed successfully!");
    } catch (error) {
      if (error instanceof AITimeoutError) {
        toast.error("AI analysis timed out. Please try again.");
      } else {
        toast.error(error instanceof Error ? error.message : "Upload failed");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleQuery = async () => {
    if (!visualizationId || !query.trim()) return;

    setQuerying(true);
    try {
      const result = await dataAPI.queryAI(visualizationId, query);
      setChartConfig(result.chart_config);
      setChartData(result.chart_data);
      toast.success("Chart generated successfully!");
    } catch (error) {
      if (error instanceof AITimeoutError) {
        toast.error("AI query timed out. Please try again.");
      } else {
        toast.error(error instanceof Error ? error.message : "Query failed");
      }
    } finally {
      setQuerying(false);
    }
  };

  const renderChart = () => {
    if (!chartConfig || !chartData.length) return null;

    const { chartType, xAxisKey, dataKeys } = chartConfig;

    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 20 }
    };

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxisKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              {dataKeys.map((key: string, idx: number) => (
                <Bar key={key} dataKey={key} fill={COLORS[idx % COLORS.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxisKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              {dataKeys.map((key: string, idx: number) => (
                <Line key={key} type="monotone" dataKey={key} stroke={COLORS[idx % COLORS.length]} strokeWidth={2} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxisKey} />
              <YAxis dataKey={dataKeys[0]} />
              <Tooltip />
              <Legend />
              <Scatter name={dataKeys[0]} data={chartData} fill={COLORS[0]} />
            </ScatterChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey={dataKeys[0]}
                nameKey={xAxisKey}
                cx="50%"
                cy="50%"
                outerRadius={120}
                label
              >
                {chartData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-500" />
            AI-Powered Data Analysis
          </h2>
          <p className="text-muted-foreground mt-1">
            Upload CSV files and generate insights using natural language
          </p>
        </div>

        {/* CSV Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload CSV File
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? "border-purple-500 bg-purple-50 dark:bg-purple-950/20" : "border-gray-300"
                }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-2">
                Drag and drop your CSV file here, or click to browse
              </p>
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="max-w-xs mx-auto"
              />
              {file && (
                <p className="text-sm font-medium mt-2">Selected: {file.name}</p>
              )}
            </div>

            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full gap-2"
            >
              {uploading ? (
                <>
                  <RefreshCcw className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Upload & Analyze with AI
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Data Quality Insights */}
        {cleaningAnalysis && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Data Quality Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{cleaningAnalysis.summary}</AlertDescription>
              </Alert>

              {metadata && (
                <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Rows</p>
                    <p className="text-2xl font-bold">{metadata.row_count}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Columns</p>
                    <p className="text-2xl font-bold">{metadata.columns.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data Types</p>
                    <p className="text-2xl font-bold">{Object.keys(metadata.dtypes).length}</p>
                  </div>
                </div>
              )}

              {cleaningAnalysis.issues.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Issues Detected:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {cleaningAnalysis.issues.map((issue: string, idx: number) => (
                      <li key={idx} className="text-sm text-muted-foreground">{issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {cleaningAnalysis.suggested_actions.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Suggested Actions:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {cleaningAnalysis.suggested_actions.map((action: string, idx: number) => (
                      <li key={idx} className="text-sm text-muted-foreground">{action}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Natural Language Query */}
        {visualizationId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Generate Chart with AI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Describe the chart you want to create..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
                />
                <Button onClick={handleQuery} disabled={!query.trim() || querying}>
                  {querying ? "Generating..." : "Generate"}
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <p className="text-sm text-muted-foreground w-full">Try these examples:</p>
                {EXAMPLE_QUERIES.map((example, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => setQuery(example)}
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chart Display */}
        {chartConfig && (
          <Card ref={chartRef}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{chartConfig.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{chartConfig.summary}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveToHistory}
                    disabled={saving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Saving..." : "Save to History"}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" disabled={exporting}>
                        <Download className="h-4 w-4 mr-2" />
                        {exporting ? 'Exporting...' : 'Export'}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleExportPNG}>
                        <FileImage className="h-4 w-4 mr-2" />
                        Download as PNG
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleExportPDF}>
                        <FileText className="h-4 w-4 mr-2" />
                        Download as PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {querying ? (
                <Skeleton className="h-[400px] w-full" />
              ) : (
                renderChart()
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default AIFeatures;
