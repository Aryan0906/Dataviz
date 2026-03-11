import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Sigma, BarChart3 } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import EnhancedDataAnalyzer from '@/components/EnhancedDataAnalyzer';
import DesmosPlot from '@/components/DesmosPlot';
import ManualPlotCategorical from './ManualPlotCategorical';

const ModernManualPlot = () => {
    const [activeTab, setActiveTab] = useState('regression');

    return (
        <AppLayout>
            <div className="space-y-6" style={{ fontFamily: "'Raleway', sans-serif" }}>

                {/* ── Luxury Tab Navigation ── */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="rounded-none bg-white border border-[#E8E4DC] p-0 h-auto w-full">
                        {[
                            { value: 'regression', label: 'Regression Analysis', icon: TrendingUp },
                            { value: 'curve', label: 'Curve Fitting', icon: Sigma },
                            { value: 'categorical', label: 'Categorical Plot', icon: BarChart3 },
                        ].map((tab, idx, arr) => (
                            <TabsTrigger
                                key={tab.value}
                                value={tab.value}
                                className={`rounded-none flex-1 flex items-center justify-center gap-2 px-6 py-3 text-xs font-medium data-[state=active]:bg-[#0F172A] data-[state=active]:text-white data-[state=active]:shadow-none ${
                                    idx < arr.length - 1 ? 'border-r border-[#E8E4DC]' : ''
                                }`}
                                style={{ fontFamily: "'Raleway', sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" }}
                            >
                                <tab.icon className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">{tab.label}</span>
                                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {/* ── Regression Tab ── */}
                    <TabsContent value="regression" className="mt-6">
                        <EnhancedDataAnalyzer />
                    </TabsContent>

                    {/* ── Curve Tab ── */}
                    <TabsContent value="curve" className="mt-6">
                        <div className="space-y-5">
                            {/* Section header */}
                            <div className="pb-5 border-b border-[#E8E4DC]">
                                <p
                                    className="text-[#0F172A] mb-1"
                                    style={{ fontSize: "0.65rem", letterSpacing: "0.25em", textTransform: "uppercase" }}
                                >
                                    Mathematical Visualization
                                </p>
                                <h2
                                    className="text-2xl font-bold text-[#0D1117] mb-1"
                                    style={{ fontFamily: "'Playfair Display', serif" }}
                                >
                                    Curve Plotting
                                </h2>
                                <p className="text-sm text-[#6B6B6B]">
                                    Interactive Desmos integration for mathematical graphing and curve visualization
                                </p>
                                <p className="text-xs text-[#D4AF37]/80 mt-1">
                                    Enter LaTeX expressions like y=x² or choose from presets
                                </p>
                                <div className="mt-4 w-10 h-0.5 bg-[#D4AF37]" />
                            </div>
                            <DesmosPlot />
                        </div>
                    </TabsContent>

                    {/* ── Categorical Tab ── */}
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
