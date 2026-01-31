import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { dataAPI } from "@/lib/api";
import { User, Mail, Calendar, Database, Activity } from "lucide-react";
import { getUserSessions } from "@/lib/sessionManager";

const Profile = () => {
    const { user } = useAuth();
    const [analysisCount, setAnalysisCount] = useState(0);
    const [draft, setDraft] = useState(null);
    const [loading, setLoading] = useState(true);
    const [savedChartsCount, setSavedChartsCount] = useState(0);

    // Get user data from Supabase
    const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || "User";
    const userEmail = user?.email || "";
    const createdAt = user?.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A";

    useEffect(() => {
        const fetchUserStats = async () => {
            try {
                const analyses = await dataAPI.getAnalyses();
                setAnalysisCount(analyses.length);

                // Fetch draft
                const { draft: draftData } = await dataAPI.getDraft();
                setDraft(draftData);

                // Fetch saved sessions
                const sessions = await getUserSessions();
                setSavedChartsCount(sessions.length);
            } catch {
                // Ignore errors
            } finally {
                setLoading(false);
            }
        };
        fetchUserStats();
    }, []);

    return (
        <AppLayout>
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Profile</h2>
                    <p className="text-muted-foreground">Your account information and statistics</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* User Information Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                User Information
                            </CardTitle>
                            <CardDescription>Your account details from Supabase</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Display Name
                                </Label>
                                <Input
                                    id="name"
                                    value={userName}
                                    disabled
                                    className="bg-muted"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={userEmail}
                                    disabled
                                    className="bg-muted"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="created" className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Member Since
                                </Label>
                                <Input
                                    id="created"
                                    value={createdAt}
                                    disabled
                                    className="bg-muted"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* User Statistics Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Database className="h-5 w-5" />
                                Your Statistics
                            </CardTitle>
                            <CardDescription>Your activity on DataViz</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Analyses</p>
                                        <p className="text-2xl font-bold">{loading ? "..." : analysisCount}</p>
                                    </div>
                                    <Badge variant="secondary" className="text-lg px-3 py-1">
                                        {analysisCount}
                                    </Badge>
                                </div>

                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Saved Charts</p>
                                        <p className="text-2xl font-bold">{loading ? "..." : savedChartsCount}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Across all chart types
                                        </p>
                                    </div>
                                    <Badge variant="secondary" className="text-lg px-3 py-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/50">
                                        <Activity className="h-4 w-4 mr-1" />
                                        {savedChartsCount}
                                    </Badge>
                                </div>

                                {/* Draft Analysis Stats */}
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Draft Analysis</p>
                                        <p className="text-lg font-semibold">
                                            {loading ? "..." : draft ? "In Progress" : "None"}
                                        </p>
                                        {draft && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Last updated: {new Date(draft.updated_at).toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                    {draft && (
                                        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/50">
                                            📝 Active
                                        </Badge>
                                    )}
                                </div>

                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Account Status</p>
                                        <p className="text-lg font-semibold text-green-600">Active</p>
                                    </div>
                                    <Badge variant="default">✓ Verified</Badge>
                                </div>
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <p className="text-sm text-muted-foreground">User ID</p>
                                        <p className="text-xs font-mono text-muted-foreground truncate max-w-[200px]">
                                            {user?.id || "N/A"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Info Card */}
                <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <Database className="h-5 w-5 text-primary mt-0.5" />
                            <div>
                                <p className="font-medium">All your data is automatically saved</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Every analysis you create is stored in the database and will appear in your dashboard.
                                    Your profile information is automatically synced from your Supabase account.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
};

export default Profile;
