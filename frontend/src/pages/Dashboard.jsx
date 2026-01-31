import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { dataAPI } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Trash2, RefreshCcw, Edit, LineChart, Activity, Sparkles, ChevronDown } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getUserSessions, deletePageSession } from "@/lib/sessionManager";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Dashboard = () => {
    const { session } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [analyses, setAnalyses] = useState([]);
    const [draft, setDraft] = useState(null);
    const [query, setQuery] = useState("");
    const [savedSessions, setSavedSessions] = useState([]);
    const [sessionsLoading, setSessionsLoading] = useState(true);

    const fetchHistory = async () => {
        if (!session) return;
        setLoading(true);
        try {
            const items = await dataAPI.getAnalyses();
            setAnalyses(items);

            // Also fetch draft
            const { draft: draftData } = await dataAPI.getDraft();
            setDraft(draftData);
        } catch {
            toast.error("Failed to load history");
        } finally {
            setLoading(false);
        }
    };

    const fetchSessions = async () => {
        setSessionsLoading(true);
        try {
            const sessions = await getUserSessions();
            // Sort by updated_at descending
            const sorted = sessions.sort((a, b) => 
                new Date(b.updated_at) - new Date(a.updated_at)
            );
            setSavedSessions(sorted);
        } catch (error) {
            console.error('Failed to fetch sessions:', error);
            toast.error("Failed to load saved charts");
        } finally {
            setSessionsLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
        fetchSessions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session]);

    const filtered = analyses.filter(a =>
        a.title.toLowerCase().includes(query.toLowerCase())
    );

    const handleDelete = async (id) => {
        if (!session) return;
        if (!confirm("Delete this analysis?")) return;
        try {
            await dataAPI.deleteAnalysis(id);
            toast.success("Deleted");
            setAnalyses(prev => prev.filter(a => a.id !== id));
        } catch {
            toast.error("Delete failed");
        }
    };

    const handleDeleteSession = async (sessionId) => {
        if (!confirm("Delete this saved chart?")) return;
        try {
            await deletePageSession(sessionId);
            toast.success("Chart deleted");
            setSavedSessions(prev => prev.filter(s => s.session_id !== sessionId));
        } catch {
            toast.error("Delete failed");
        }
    };

    const handleEditSession = (sessionData) => {
        console.log('[Dashboard] Editing session:', sessionData);
        
        // Navigate to the appropriate page and load the session
        const pageTypeMap = {
            'categorical': '/categorical',
            'regression': '/manual-plot/regression',
            'curve': '/manual-plot/curve',
        };
        
        const path = pageTypeMap[sessionData.page_type];
        if (path) {
            // Store session ID in sessionStorage so the page can restore it
            const storageKey = `session_id_${sessionData.page_type}`;
            console.log('[Dashboard] Setting sessionStorage:', storageKey, '=', sessionData.session_id);
            sessionStorage.setItem(storageKey, sessionData.session_id);
            
            // Verify it was stored
            const storedValue = sessionStorage.getItem(storageKey);
            console.log('[Dashboard] Verified sessionStorage:', storageKey, '=', storedValue);
            
            // Navigate to the page
            console.log('[Dashboard] Navigating to:', path);
            navigate(path);
            toast.success('Loading saved chart...');
        } else {
            console.error('[Dashboard] Unknown page type:', sessionData.page_type);
            toast.error('Unknown chart type');
        }
    };

    const handleCreateNew = (type) => {
        const routeMap = {
            'curve': '/manual-plot/curve',
            'regression': '/manual-plot/regression',
            'categorical': '/categorical',
        };
        navigate(routeMap[type]);
    };

    const getChartIcon = (pageType) => {
        switch (pageType) {
            case 'categorical':
                return <Sparkles className="h-5 w-5 text-purple-500" />;
            case 'regression':
                return <LineChart className="h-5 w-5 text-blue-500" />;
            case 'curve':
                return <Activity className="h-5 w-5 text-green-500" />;
            default:
                return <Activity className="h-5 w-5" />;
        }
    };

    const getChartTypeLabel = (pageType) => {
        switch (pageType) {
            case 'categorical':
                return 'Categorical Plot';
            case 'regression':
                return 'Regression Model';
            case 'curve':
                return 'Curve Plot';
            default:
                return 'Chart';
        }
    };

    return (
        <AppLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button className="gap-2">
                                    <Plus className="h-4 w-4" /> Create New <ChevronDown className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem onClick={() => handleCreateNew('curve')} className="gap-2 cursor-pointer">
                                    <Activity className="h-4 w-4 text-green-500" />
                                    <div>
                                        <div className="font-medium">Curve Plot</div>
                                        <div className="text-xs text-muted-foreground">Interactive mathematical graphs</div>
                                    </div>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleCreateNew('regression')} className="gap-2 cursor-pointer">
                                    <LineChart className="h-4 w-4 text-blue-500" />
                                    <div>
                                        <div className="font-medium">Regression Model</div>
                                        <div className="text-xs text-muted-foreground">Fit data to regression models</div>
                                    </div>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleCreateNew('categorical')} className="gap-2 cursor-pointer">
                                    <Sparkles className="h-4 w-4 text-purple-500" />
                                    <div>
                                        <div className="font-medium">Categorical Plot</div>
                                        <div className="text-xs text-muted-foreground">AI-powered data visualization</div>
                                    </div>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button variant="outline" onClick={() => { fetchHistory(); fetchSessions(); }} className="gap-2">
                            <RefreshCcw className="h-4 w-4" /> Refresh
                        </Button>
                    </div>
                </div>

                {/* Saved Charts Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Saved Charts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {sessionsLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[...Array(6)].map((_, i) => (
                                    <Skeleton key={i} className="h-32" />
                                ))}
                            </div>
                        ) : savedSessions.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>No saved charts yet.</p>
                                <p className="text-sm">Create a new chart to get started!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {savedSessions.map(sessionData => (
                                    <Card key={sessionData.session_id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-3 mb-3">
                                                {getChartIcon(sessionData.page_type)}
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium truncate">{getChartTypeLabel(sessionData.page_type)}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {new Date(sessionData.updated_at).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                                {sessionData.page_type === 'categorical' && sessionData.state_data?.chartTitle ? (
                                                    sessionData.state_data.chartTitle
                                                ) : sessionData.page_type === 'regression' && sessionData.state_data?.data ? (
                                                    `${sessionData.state_data.data.length} data points · ${sessionData.state_data.regressionType || 'regression'}`
                                                ) : sessionData.page_type === 'curve' && sessionData.state_data?.expressions ? (
                                                    `${sessionData.state_data.expressions.length} expressions`
                                                ) : (
                                                    'Saved session'
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={() => handleEditSession(sessionData)}
                                                    className="flex-1 gap-1"
                                                >
                                                    <Edit className="h-3 w-3" /> Edit
                                                </Button>
                                                <Button 
                                                    variant="destructive" 
                                                    size="sm" 
                                                    onClick={() => handleDeleteSession(sessionData.session_id)}
                                                    className="gap-1"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Draft Analysis Section */}
                {draft && (
                    <Card className="border-blue-500/50 bg-blue-500/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span>📝 Draft Analysis</span>
                                <span className="text-sm font-normal text-muted-foreground">
                                    (In Progress)
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-medium">{draft.title || "Untitled Analysis"}</div>
                                    <div className="text-sm text-muted-foreground">
                                        {draft.dataPoints?.length || 0} data points ·
                                        {draft.categories?.length || 0} categories ·
                                        Last updated: {new Date(draft.updated_at).toLocaleString()}
                                    </div>
                                </div>
                                <Link to="/manual-plot">
                                    <Button>Continue Editing</Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>User History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-3 mb-4">
                            <Input
                                placeholder="Search by title"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                className="max-w-sm"
                            />
                        </div>
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[...Array(4)].map((_, i) => (
                                    <Skeleton key={i} className="h-24" />
                                ))}
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="text-muted-foreground">No saved analyses yet.</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filtered.map(item => (
                                    <Card key={item.id} className="overflow-hidden">
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-sm text-muted-foreground">{new Date(item.created_at).toLocaleString()}</div>
                                                    <div className="font-medium">{item.title}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {item.regression_type}
                                                        {item.r_squared != null && ` · R² ${item.r_squared.toFixed(4)}`}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Link to={`/manual-plot?analysis=${item.id}`}>
                                                        <Button variant="outline">View</Button>
                                                    </Link>
                                                    <Button variant="destructive" onClick={() => handleDelete(item.id)} className="gap-2">
                                                        <Trash2 className="h-4 w-4" /> Delete
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
};

export default Dashboard;
