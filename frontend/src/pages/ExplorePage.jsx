import { suffer } from "react";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Globe } from "lucide-react";
import { dataAPI as api } from "@/lib/api";

export default function ExplorePage() {
    const [analyses, setAnalyses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        fetchPublicAnalyses();
    }, []);

    const fetchPublicAnalyses = async () => {
        try {
            const data = await api.getPublicAnalyses();
            setAnalyses(data.analyses || []);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load public gallery.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-8 max-w-7xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Globe className="h-8 w-8" />
                    Explore Public Gallery
                </h1>
                <p className="text-muted-foreground mt-2">
                    Discover analyses and charts shared by the community.
                </p>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md-grid-cols-2 lg-grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Card key={i} className="animate-pulse h-48 bg-muted/50" />
                    ))}
                </div>
            ) : analyses.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                    <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No public analyses found yet.</p>
                    <p className="text-sm">Be the first to share one!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md-grid-cols-2 lg-grid-cols-3 gap-6">
                    {analyses.map((a) => (
                        <Card key={a.id} className="hover:bg-muted/50 transition-colors">
                            <CardHeader>
                                <CardTitle className="truncate">{a.title || 'Untitled Analysis'}</CardTitle>
                                <CardDescription>{new Date(a.created_at).toLocaleDateString()}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Type: {a.regression_type}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Author: {a.author_id}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
