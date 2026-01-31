import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Download, Code2 } from 'lucide-react';
import { toast } from 'sonner';

const CodeExportModal = ({ 
  isOpen, 
  onClose, 
  modelType = 'linear',
  features = [],
  target = 'target',
  hyperparameters = {},
  includeEDA = true,
  includeCleaning = true
}) => {
  const [copied, setCopied] = useState(false);
  const [codeSnippets, setCodeSnippets] = useState({});
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen && features.length > 0) {
      fetchCodeSnippets();
    }
  }, [isOpen, modelType, features, target]);

  const fetchCodeSnippets = async () => {
    setLoading(true);
    try {
      // Fetch regression code
      const regressionRes = await fetch('http://localhost:8000/api/data/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'regression',
          model_type: modelType,
          features: features,
          target: target,
          hyperparameters: hyperparameters,
        }),
      });
      const regressionData = await regressionRes.json();

      // Fetch EDA code
      const edaRes = await fetch('http://localhost:8000/api/data/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'eda',
          columns: [...features, target],
        }),
      });
      const edaData = await edaRes.json();

      // Fetch cleaning code
      const cleaningRes = await fetch('http://localhost:8000/api/data/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'cleaning',
          method: 'drop',
        }),
      });
      const cleaningData = await cleaningRes.json();

      setCodeSnippets({
        regression: regressionData.code,
        eda: edaData.code,
        cleaning: cleaningData.code,
      });
    } catch (error) {
      console.error('Failed to fetch code snippets:', error);
      toast.error('Failed to generate code');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      toast.success('Code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast.error('Failed to copy code');
    });
  };

  const downloadCode = (code, filename) => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  };

  const getModelName = () => {
    const names = {
      linear: 'Linear Regression',
      ridge: 'Ridge Regression',
      lasso: 'Lasso Regression',
      random_forest: 'Random Forest',
      svr: 'Support Vector Regression',
      polynomial: 'Polynomial Regression',
    };
    return names[modelType] || 'Regression Model';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden backdrop-blur-xl bg-slate-950/95 border border-slate-800">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Code2 className="h-6 w-6 text-purple-500" />
              Export to Code
            </DialogTitle>
            <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">
              Python 3.11+
            </Badge>
          </div>
          <DialogDescription className="text-slate-400">
            Copy-pasteable Python code for {getModelName()}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="regression" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-900/50">
            <TabsTrigger value="regression">Regression Model</TabsTrigger>
            <TabsTrigger value="eda">EDA & Visualization</TabsTrigger>
            <TabsTrigger value="cleaning">Data Cleaning</TabsTrigger>
          </TabsList>

          <TabsContent value="regression" className="space-y-4">
            <div className="relative">
              <div className="absolute top-2 right-2 flex gap-2 z-10">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadCode(codeSnippets.regression || '', 'regression_model.py')}
                  className="bg-slate-900/80 border-slate-700 hover:bg-slate-800"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(codeSnippets.regression || '')}
                  className="bg-slate-900/80 border-slate-700 hover:bg-slate-800"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              
              <div className="max-h-[55vh] overflow-y-auto rounded-lg border border-slate-800">
                <SyntaxHighlighter
                  language="python"
                  style={vscDarkPlus}
                  customStyle={{
                    margin: 0,
                    padding: '1.5rem',
                    background: '#0f172a',
                    fontSize: '0.875rem',
                  }}
                  showLineNumbers
                >
                  {codeSnippets.regression || '# Loading...'}
                </SyntaxHighlighter>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-400 mb-2">💡 How to Use</h4>
              <ol className="text-sm text-slate-300 space-y-1 list-decimal list-inside">
                <li>Save this code as <code className="bg-slate-800 px-1 rounded">regression_model.py</code></li>
                <li>Replace <code className="bg-slate-800 px-1 rounded">'your_data.csv'</code> with your file path</li>
                <li>Run: <code className="bg-slate-800 px-1 rounded">python regression_model.py</code></li>
                <li>The model will train and display performance metrics</li>
              </ol>
            </div>
          </TabsContent>

          <TabsContent value="eda" className="space-y-4">
            <div className="relative">
              <div className="absolute top-2 right-2 flex gap-2 z-10">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadCode(codeSnippets.eda || '', 'exploratory_analysis.py')}
                  className="bg-slate-900/80 border-slate-700 hover:bg-slate-800"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(codeSnippets.eda || '')}
                  className="bg-slate-900/80 border-slate-700 hover:bg-slate-800"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              
              <div className="max-h-[55vh] overflow-y-auto rounded-lg border border-slate-800">
                <SyntaxHighlighter
                  language="python"
                  style={vscDarkPlus}
                  customStyle={{
                    margin: 0,
                    padding: '1.5rem',
                    background: '#0f172a',
                    fontSize: '0.875rem',
                  }}
                  showLineNumbers
                >
                  {codeSnippets.eda || '# Loading...'}
                </SyntaxHighlighter>
              </div>
            </div>

            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-green-400 mb-2">📊 Generates</h4>
              <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
                <li>Correlation heatmap (correlation_heatmap.png)</li>
                <li>Distribution plots for all numeric columns</li>
                <li>Basic statistics and data info</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="cleaning" className="space-y-4">
            <div className="relative">
              <div className="absolute top-2 right-2 flex gap-2 z-10">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadCode(codeSnippets.cleaning || '', 'data_cleaning.py')}
                  className="bg-slate-900/80 border-slate-700 hover:bg-slate-800"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(codeSnippets.cleaning || '')}
                  className="bg-slate-900/80 border-slate-700 hover:bg-slate-800"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              
              <div className="max-h-[55vh] overflow-y-auto rounded-lg border border-slate-800">
                <SyntaxHighlighter
                  language="python"
                  style={vscDarkPlus}
                  customStyle={{
                    margin: 0,
                    padding: '1.5rem',
                    background: '#0f172a',
                    fontSize: '0.875rem',
                  }}
                  showLineNumbers
                >
                  {codeSnippets.cleaning || '# Loading...'}
                </SyntaxHighlighter>
              </div>
            </div>

            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-orange-400 mb-2">🧹 Cleans</h4>
              <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
                <li>Removes rows with missing values</li>
                <li>Drops duplicate rows</li>
                <li>Saves cleaned data to cleaned_data.csv</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-slate-700 hover:bg-slate-800"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CodeExportModal;
