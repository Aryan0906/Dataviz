import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DataHealthModal from "@/components/DataHealthModal";
import CodeExportModal from "@/components/CodeExportModal";
import ResidualPlot from "@/components/ResidualPlot";
import {
  Sparkles,
  Code2,
  TrendingUp,
  Database,
  FileCheck,
  Zap
} from "lucide-react";

const SmartAnalytics = () => {
  const [healthModalOpen, setHealthModalOpen] = useState(false);
  const [codeModalOpen, setCodeModalOpen] = useState(false);

  // Sample data for residual plot demonstration
  const sampleResiduals = {
    actual: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
    predicted: [12, 18, 33, 38, 52, 58, 72, 78, 88, 102],
    residuals: [-2, 2, -3, 2, -2, 2, -2, 2, 2, -2],
    residualStats: {
      mean: 0.1,
      std: 2.1,
      min: -3,
      max: 2
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-purple-500" />
              Smart Analytics Features
            </h1>
            <p className="text-muted-foreground mt-2">
              Professional-grade data analysis tools powered by AI
            </p>
          </div>
          <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">
            🆕 New Features
          </Badge>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Smart Data Cleaning */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-blue-500/20 hover:border-blue-500/40">
            <CardHeader>
              <div className="flex items-center justify-between">
                <FileCheck className="h-8 w-8 text-blue-500" />
                <Badge variant="outline" className="border-blue-500/30">Backend + Frontend</Badge>
              </div>
              <CardTitle className="mt-4">Smart Data Cleaning</CardTitle>
              <CardDescription>
                Automatically detect and fix data quality issues
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  Detects missing values per column
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  Identifies duplicate rows
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  Flags data type mismatches
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  6 cleaning methods (drop, mean, median, etc.)
                </li>
              </ul>
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => setHealthModalOpen(true)}
              >
                Try Demo
              </Button>
            </CardContent>
          </Card>

          {/* Correlation Heatmap */}
          <Card className="hover:shadow-lg transition-shadow border-green-500/20 hover:border-green-500/40">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Database className="h-8 w-8 text-green-500" />
                <Badge variant="outline" className="border-green-500/30">API Ready</Badge>
              </div>
              <CardTitle className="mt-4">Correlation Heatmap</CardTitle>
              <CardDescription>
                Interactive correlation matrix with click-to-select
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  Plotly.js interactive heatmap
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  Click cells to select variables
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  Auto-identifies strong correlations
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  Export as PNG
                </li>
              </ul>
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                variant="secondary"
                disabled
              >
                Coming to Dashboard
              </Button>
            </CardContent>
          </Card>

          {/* Code Export */}
          <Card className="hover:shadow-lg transition-shadow border-purple-500/20 hover:border-purple-500/40">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Code2 className="h-8 w-8 text-purple-500" />
                <Badge variant="outline" className="border-purple-500/30">Ready</Badge>
              </div>
              <CardTitle className="mt-4">Code Export</CardTitle>
              <CardDescription>
                Generate Python code for any model
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-0.5">•</span>
                  Regression, EDA, and Cleaning scripts
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-0.5">•</span>
                  Syntax highlighting (VS Code theme)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-0.5">•</span>
                  Copy to clipboard or download .py
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-0.5">•</span>
                  Complete with imports & usage guide
                </li>
              </ul>
              <Button
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={() => setCodeModalOpen(true)}
              >
                Try Demo
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* API Endpoints Section */}
        <Card className="border-orange-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-orange-500" />
              New API Endpoints
            </CardTitle>
            <CardDescription>
              4 production-ready backend endpoints
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
                <code className="text-sm text-orange-400">POST /api/data/check-health</code>
                <p className="text-xs text-muted-foreground mt-2">
                  Detects nulls, duplicates, and type issues
                </p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
                <code className="text-sm text-green-400">POST /api/data/clean</code>
                <p className="text-xs text-muted-foreground mt-2">
                  Applies cleaning operations to CSV
                </p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
                <code className="text-sm text-blue-400">POST /api/data/correlation</code>
                <p className="text-xs text-muted-foreground mt-2">
                  Calculates correlation matrix
                </p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
                <code className="text-sm text-purple-400">POST /api/data/generate-code</code>
                <p className="text-xs text-muted-foreground mt-2">
                  Generates Python code snippets
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Demo Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-pink-500" />
              Residual Plot (Live Demo)
            </CardTitle>
            <CardDescription>
              Scientific validation of regression model fit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResidualPlot {...sampleResiduals} />
          </CardContent>
        </Card>

        {/* File Locations */}
        <Card className="border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg">📁 Component Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm font-mono">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Frontend</Badge>
                <code className="text-blue-400">frontend/src/components/DataHealthModal.jsx</code>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Frontend</Badge>
                <code className="text-blue-400">frontend/src/components/CodeExportModal.jsx</code>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Frontend</Badge>
                <code className="text-blue-400">frontend/src/components/ResidualPlot.jsx</code>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Frontend</Badge>
                <code className="text-blue-400">frontend/src/components/DataOverview.jsx</code>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Backend</Badge>
                <code className="text-green-400">backend_django/api/utils/data_cleaning.py</code>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Backend</Badge>
                <code className="text-green-400">backend_django/api/utils/code_generator.py</code>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <DataHealthModal
        isOpen={healthModalOpen}
        onClose={() => setHealthModalOpen(false)}
        filePath="sample_categorical_data.csv"
        autoCheck={false}
      />

      <CodeExportModal
        isOpen={codeModalOpen}
        onClose={() => setCodeModalOpen(false)}
        modelType="random_forest"
        features={["feature1", "feature2", "feature3"]}
        target="target_variable"
        hyperparameters={{ n_estimators: 100 }}
      />
    </AppLayout>
  );
};

export default SmartAnalytics;
