import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { dataAPI, type SavedAnalysis } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Trash2, RefreshCcw } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [draft, setDraft] = useState<any | null>(null);
  const [query, setQuery] = useState("");

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

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const filtered = analyses.filter(a =>
    a.title.toLowerCase().includes(query.toLowerCase())
  );

  const handleDelete = async (id: number) => {
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

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <div className="flex items-center gap-2">
            <Link to="/manual-plot">
              <Button className="gap-2"><Plus className="h-4 w-4" /> New Analysis</Button>
            </Link>
            <Button variant="outline" onClick={fetchHistory} className="gap-2">
              <RefreshCcw className="h-4 w-4" /> Refresh
            </Button>
          </div>
        </div>

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
