import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, CheckCircle2, Download, Upload } from "lucide-react";
import { Link } from "react-router-dom";

const Documentation = () => {
    return (
        <AppLayout>
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Documentation
                    </h2>
                    <p className="text-muted-foreground">
                        Quick guidance for uploading data, running analyses, and exporting results.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                Getting Started
                            </CardTitle>
                            <CardDescription>3 steps to your first insight</CardDescription>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground space-y-2">
                            <p>1) Upload a CSV or enter data manually</p>
                            <p>2) Choose a feature (AI, Analyzer, Categorical)</p>
                            <p>3) Export charts or code when ready</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Upload className="h-4 w-4 text-primary" />
                                CSV Format
                            </CardTitle>
                            <CardDescription>Keep files clean and simple</CardDescription>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground space-y-2">
                            <p>Headers required (first row as column names)</p>
                            <p>Regression: columns named X and Y</p>
                            <p>Categorical: label + value columns</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Download className="h-4 w-4 text-primary" />
                                Export & Save
                            </CardTitle>
                            <CardDescription>Share or continue later</CardDescription>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground space-y-2">
                            <p>Export charts to PNG or PDF</p>
                            <p>Generate code for models and cleaning</p>
                            <p>Sessions auto-save to your profile</p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-sm">
                            <Badge variant="secondary">Tip</Badge>
                            <span className="text-muted-foreground">
                                Use natural language like "show count by category" in NLP Analysis.
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex flex-wrap gap-2">
                    <Button asChild>
                        <Link to="/dashboard">Go to Dashboard</Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link to="/ai">Try AI Features</Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link to="/manual-plot">Open Data Analyzer</Link>
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
};

export default Documentation;
