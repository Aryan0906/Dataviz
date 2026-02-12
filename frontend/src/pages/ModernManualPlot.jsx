import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { TrendingUp, Sigma, BarChart3 } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import EnhancedDataAnalyzer from '@/components/EnhancedDataAnalyzer';

const ModernManualPlot = () => {
    const [activeTab, setActiveTab] = useState('regression');

    return (
        <AppLayout>
            <div className="space-y-6">
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
                        <Card className="p-8 text-center text-muted-foreground">
                            <Sigma className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Curve fitting feature will be available here.</p>
                            <p className="text-sm mt-2">Navigate to the original route for existing functionality.</p>
                        </Card>
                    </TabsContent>

                    <TabsContent value="categorical" className="mt-6">
                        <Card className="p-8 text-center text-muted-foreground">
                            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Categorical plotting feature will be available here.</p>
                            <p className="text-sm mt-2">Navigate to the original route for existing functionality.</p>
                        </Card>
                    </TabsContent>
                </Tabs>

                <Outlet />
            </div>
        </AppLayout>
    );
};

export default ModernManualPlot;
