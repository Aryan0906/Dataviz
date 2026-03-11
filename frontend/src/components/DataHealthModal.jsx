import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Droplet,
  TrendingUp,
  FileWarning,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { dataAPI } from '@/lib/api';

const DataHealthModal = ({
  isOpen,
  onClose,
  filePath,
  onCleaned,
  autoCheck = true
}) => {
  const [healthReport, setHealthReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  useEffect(() => {
    if (isOpen && filePath && autoCheck) {
      checkHealth();
    }
  }, [isOpen, filePath, autoCheck]);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const data = await dataAPI.checkDataHealth(filePath);
      setHealthReport(data);
    } catch (error) {
      console.error('Health check error:', error);
      toast.error('Failed to check data health');
    } finally {
      setLoading(false);
    }
  };

  const handleClean = async (method) => {
    setCleaning(true);
    try {
      const data = await dataAPI.cleanData(filePath, {
        method: method,
        save_as_new: false, // Overwrite original
      });

      toast.success(`Data cleaned successfully! Removed ${data.summary.rows_removed} rows`);

      // Notify parent component
      if (onCleaned) {
        onCleaned(data);
      }

      // Re-check health
      await checkHealth();
    } catch (error) {
      console.error('Cleaning error:', error);
      toast.error('Failed to clean data');
    } finally {
      setCleaning(false);
    }
  };

  const handleIgnore = () => {
    toast.info('Proceeding with existing data');
    onClose();
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <FileWarning className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = () => {
    if (!healthReport) return null;

    if (!healthReport.has_errors) {
      return (
        <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Healthy
        </Badge>
      );
    }

    return (
      <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Action Needed
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto backdrop-blur-xl bg-slate-950/90 border border-slate-800">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Droplet className="h-6 w-6 text-blue-500" />
              Data Health Report
            </DialogTitle>
            {getStatusBadge()}
          </div>
          <DialogDescription className="text-muted-foreground">
            Smart scan detected potential issues in your dataset
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : healthReport ? (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                  <div className="text-sm text-muted-foreground">Total Rows</div>
                  <div className="text-2xl font-bold text-white">
                    {healthReport.total_rows.toLocaleString()}
                  </div>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                  <div className="text-sm text-muted-foreground">Total Columns</div>
                  <div className="text-2xl font-bold text-white">
                    {healthReport.total_columns}
                  </div>
                </div>
              </div>

              {/* Issues */}
              {healthReport.has_errors ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Detected Issues
                  </h3>
                  {healthReport.issues.map((issue, index) => (
                    <Alert
                      key={index}
                      className="bg-slate-900/50 border-slate-700"
                    >
                      <div className="flex items-start gap-3">
                        {getSeverityIcon(issue.severity)}
                        <div className="flex-1">
                          <AlertDescription className="text-slate-300">
                            {issue.message}
                          </AlertDescription>
                          {issue.affected_columns && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {issue.affected_columns.slice(0, 5).map((col) => (
                                <Badge
                                  key={col}
                                  variant="outline"
                                  className="text-xs border-slate-700"
                                >
                                  {col}
                                </Badge>
                              ))}
                              {issue.affected_columns.length > 5 && (
                                <Badge
                                  variant="outline"
                                  className="text-xs border-slate-700"
                                >
                                  +{issue.affected_columns.length - 5} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </Alert>
                  ))}
                </div>
              ) : (
                <Alert className="bg-green-500/10 border-green-500/20">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <AlertDescription className="text-green-400">
                    No issues detected! Your data is clean and ready for analysis.
                  </AlertDescription>
                </Alert>
              )}

              {/* Missing Values Details */}
              {healthReport.missing_rows > 0 && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-slate-300 mb-2">
                    Missing Values Breakdown
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(healthReport.missing_by_column).slice(0, 5).map(([col, count]) => (
                      <div key={col} className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">{col}</span>
                        <Badge variant="outline" className="border-orange-500/30 text-orange-400">
                          {count} missing
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-slate-400 py-8">
              No health report available
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {healthReport?.has_errors ? (
            <>
              <Button
                variant="outline"
                onClick={handleIgnore}
                disabled={cleaning}
                className="border-slate-700 hover:bg-slate-800"
              >
                Ignore
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleClean('drop')}
                disabled={cleaning}
                className="bg-red-600 hover:bg-red-700"
              >
                {cleaning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cleaning...
                  </>
                ) : (
                  'Drop Empty Rows'
                )}
              </Button>
              <Button
                onClick={() => handleClean('mean')}
                disabled={cleaning}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {cleaning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cleaning...
                  </>
                ) : (
                  <>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Fill with Average
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button
              onClick={onClose}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Continue
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DataHealthModal;
