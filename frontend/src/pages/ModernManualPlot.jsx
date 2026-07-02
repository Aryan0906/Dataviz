import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Sigma, BarChart3 } from 'lucide-react';
import AppLayout from '@/components/AppLayout';

const ModernManualPlot = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Determine active tab from the last segment of the path
    const pathSegments = location.pathname.split('/');
    const activeTab = pathSegments[pathSegments.length - 1] || 'regression';

    const handleTabChange = (value) => {
        navigate(`/manual-plot/${value}`);
    };

    return (
        <AppLayout>
            <div className="space-y-6" style={{ fontFamily: "'Raleway', sans-serif" }}>

                {/* ── Luxury Tab Navigation ── */}
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                    <TabsList className="rounded-none bg-card border border-luxury-silk p-0 h-auto w-full">
                        {[
                            { value: 'regression', label: 'Regression Analysis', icon: TrendingUp },
                            { value: 'curve', label: 'Curve Plotter', icon: Sigma },
                            { value: 'categorical', label: 'Categorical Plot', icon: BarChart3 },
                        ].map((tab, idx, arr) => (
                            <TabsTrigger
                                key={tab.value}
                                value={tab.value}
                                className={`rounded-none flex-1 flex items-center justify-center gap-2 px-6 py-3 text-xs font-medium data-[state=active]:bg-luxury-midnight data-[state=active]:text-white data-[state=active]:shadow-none ${
                                    idx < arr.length - 1 ? 'border-r border-luxury-silk' : ''
                                }`}
                                style={{ fontFamily: "'Raleway', sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" }}
                            >
                                <tab.icon className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">{tab.label}</span>
                                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>

                <div className="mt-6">
                    <Outlet />
                </div>
            </div>
        </AppLayout>
    );
};

export default ModernManualPlot;
