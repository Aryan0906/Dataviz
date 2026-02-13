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
  FileCheck
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
              <Sparkles className="h-8 w-8 text-primary" />
              Smart Analytics Features
            </h1>
            <p className="text-muted-foreground mt-2">
              Automated data cleaning, quality checks, code generation & advanced visualizations
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              💡 Click cards below to explore interactive demos of each feature
            </p>
          </div>
          <Badge variant="secondary">🆕 New Features</Badge>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Smart Data Cleaning */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-border hover:border-primary/40">
            <CardHeader>
              <div className="flex items-center justify-between">
                <FileCheck className="h-8 w-8 text-primary" />
                <Badge variant="outline">Backend + Frontend</Badge>
              </div>
              <CardTitle className="mt-4">Smart Data Cleaning</CardTitle>
              <CardDescription>
                Automatically detect and fix data quality issues
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  Detects missing values per column
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  Identifies duplicate rows
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  Flags data type mismatches
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  6 cleaning methods (drop, mean, median, etc.)
                </li>
              </ul>
              <Button
                className="w-full"
                onClick={() => setHealthModalOpen(true)}
              >
                Try Demo
              </Button>
            </CardContent>
          </Card>

          {/* Correlation Heatmap */}
          <Card className="hover:shadow-lg transition-shadow border-border hover:border-primary/40">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Database className="h-8 w-8 text-primary" />
                <Badge variant="outline">API Ready</Badge>
              </div>
              <CardTitle className="mt-4">Correlation Heatmap</CardTitle>
              <CardDescription>
                Interactive correlation matrix with click-to-select
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  Plotly.js interactive heatmap
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  Click cells to select variables
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  Auto-identifies strong correlations
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  Export as PNG
                </li>
              </ul>
              <Button
                className="w-full"
                variant="outline"
                disabled
              >
                Coming to Dashboard
              </Button>
            </CardContent>
          </Card>

          {/* Code Export */}
          <Card className="hover:shadow-lg transition-shadow border-border hover:border-primary/40">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Code2 className="h-8 w-8 text-primary" />
                <Badge variant="outline">Ready</Badge>
              </div>
              <CardTitle className="mt-4">Code Export</CardTitle>
              <CardDescription>
                Generate Python code for any model
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  Regression, EDA, and Cleaning scripts
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  Syntax highlighting (VS Code theme)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  Copy to clipboard or download .py
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  Complete with imports & usage guide
                </li>
              </ul>
              <Button
                className="w-full"
                onClick={() => setCodeModalOpen(true)}
              >
                Try Demo
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Live Demo Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
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
