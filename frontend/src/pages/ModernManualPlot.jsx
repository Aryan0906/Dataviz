import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { TrendingUp, Sigma, BarChart3 } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import EnhancedDataAnalyzer from '@/components/EnhancedDataAnalyzer';
import DesmosPlot from '@/components/DesmosPlot';
import ManualPlotCategorical from './ManualPlotCategorical';

const ModernManualPlot = () => {
    const [activeTab, setActiveTab] = useState('regression');

    return (
        <AppLayout>
            <div className="space-y-6">
                {/* Page Header */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Data Analyzer</h1>
                    <p className="text-muted-foreground">Advanced analysis tools for regression, mathematical graphing, and categorical data</p>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="regression" className="gap-2">
                            <TrendingUp className="h-4 w-4" />
                            <span className="hidden sm:inline">Regression Analysis</span>
                            <span className="sm:hidden">Regression</span>
                        </TabsTrigger>
                        <TabsTrigger value="curve" className="gap-2">
                            <Sigma className="h-4 w-4" />
                            <span className="hidden sm:inline">Curve Fitting</span>
                            <span className="sm:hidden">Curve</span>
                        </TabsTrigger>
                        <TabsTrigger value="categorical" className="gap-2">
                            <BarChart3 className="h-4 w-4" />
                            <span className="hidden sm:inline">Categorical Plot</span>
                            <span className="sm:hidden">Categorical</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="regression" className="mt-6">
                        <EnhancedDataAnalyzer />
                    </TabsContent>

                    <TabsContent value="curve" className="mt-6">
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-2xl font-bold">Mathematical Curve Plotting</h2>
                                <p className="text-muted-foreground">
                                    Use Desmos to create interactive mathematical graphs and visualizations
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Enter LaTeX expressions like y=x^2 or choose from presets
                                </p>
                            </div>
                            <DesmosPlot />
                        </div>
                    </TabsContent>

                    <TabsContent value="categorical" className="mt-6">
                        <ManualPlotCategorical />
                    </TabsContent>
                </Tabs>

                <Outlet />
            </div>
        </AppLayout>
    );
};

export default ModernManualPlot;
