import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Sparkles,
    TrendingUp,
    BarChart3,
    Brain,
    Database,
    Rocket,
    ArrowRight,
    CheckCircle2,
    LineChart,
    FileText,
    Cloud
} from "lucide-react";

const ModernLandingPage = () => {
    const features = [
        {
            icon: Brain,
            title: "AI-Powered Insights",
            description: "Leverage advanced machine learning algorithms for automatic pattern detection and predictive analytics.",
            gradient: "from-slate-600 to-slate-800"
        },
        {
            icon: TrendingUp,
            title: "Regression Analysis",
            description: "Perform sophisticated regression analysis with automatic model selection and validation.",
            gradient: "from-blue-600 to-blue-800"
        },
        {
            icon: BarChart3,
            title: "Interactive Visualizations",
            description: "Create stunning, interactive charts and dashboards with real-time data updates.",
            gradient: "from-slate-500 to-slate-700"
        },
        {
            icon: Database,
            title: "Data Management",
            description: "Import, clean, and manage your datasets with intelligent data validation.",
            gradient: "from-gray-600 to-gray-800"
        },
        {
            icon: FileText,
            title: "NLP Analytics",
            description: "Extract insights from text data using natural language processing techniques.",
            gradient: "from-slate-700 to-slate-900"
        },
        {
            icon: Cloud,
            title: "Cloud Storage",
            description: "Securely store and access your analyses from anywhere with cloud synchronization.",
            gradient: "from-blue-700 to-blue-900"
        }
    ];

    const benefits = [
        "Automatic model selection",
        "Real-time collaboration",
        "Export to multiple formats",
        "Advanced statistical analysis",
        "Custom visualization themes",
        "API integration support"
    ];

    const testimonials = [
        {
            quote: "DataViz Pro transformed how we analyze our business data. The AI insights are incredible!",
            author: "Sarah Chen",
            role: "Data Scientist",
            company: "TechCorp"
        },
        {
            quote: "The intuitive interface makes complex analysis accessible to everyone on our team.",
            author: "Michael Rodriguez",
            role: "Analytics Manager",
            company: "Growth Inc"
        },
        {
            quote: "Best data visualization platform I've used. The regression tools are particularly impressive.",
            author: "Dr. Emily Watson",
            role: "Research Lead",
            company: "Research Labs"
        }
    ];

    return (
        <div className="min-h-screen bg-background">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-slate-800 text-white shadow-lg">
                            <Sparkles className="size-4" />
                        </div>
                        <span className="text-xl font-bold text-slate-800 dark:text-slate-100">
                            DataViz Pro
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/login">
                            <Button variant="ghost">Sign In</Button>
                        </Link>
                        <Link to="/signup">
                            <Button className="bg-slate-800 hover:bg-slate-900">
                                Get Started
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-slate-950 dark:via-gray-950 dark:to-slate-900" />

                {/* Animated background elements */}
                <div className="absolute top-20 left-10 w-72 h-72 bg-slate-300/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse delay-1000" />

                <div className="container mx-auto px-4 py-24 md:py-32 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        <Badge className="mb-4 bg-slate-800 text-white border-0 px-4 py-1">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Professional Analytics Platform
                        </Badge>

                        <h1 className="text-5xl md:text-7xl font-bold mb-6 text-slate-900 dark:text-slate-100 leading-tight">
                            Transform Data Into
                            <br />
                            Actionable Insights
                        </h1>

                        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                            Powerful data analysis and visualization platform designed for researchers, analysts, and data scientists.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                            <Link to="/signup">
                                <Button size="lg" className="gap-2 bg-slate-800 hover:bg-slate-900 text-lg px-8 py-6">
                                    <Rocket className="h-5 w-5" />
                                    Start Free Trial
                                    <ArrowRight className="h-5 w-5" />
                                </Button>
                            </Link>
                            <Link to="/login">
                                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                                    Watch Demo
                                </Button>
                            </Link>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-8 border-t">
                            <div>
                                <div className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-200">
                                    10K+
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">Active Users</div>
                            </div>
                            <div>
                                <div className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-200">
                                    50K+
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">Analyses Run</div>
                            </div>
                            <div>
                                <div className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-200">
                                    99.9%
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">Uptime</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 bg-background">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <Badge className="mb-4">Features</Badge>
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">
                            Everything you need to analyze data
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Comprehensive suite of tools for modern data analysis and visualization
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <Card
                                key={index}
                                className="border-2 hover:border-slate-600 transition-all hover:shadow-xl group"
                            >
                                <CardHeader>
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                                        <feature.icon className="h-6 w-6" />
                                    </div>
                                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                                    <CardDescription className="text-base">
                                        {feature.description}
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-24 bg-muted/50">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <Badge className="mb-4">Why Choose Us</Badge>
                            <h2 className="text-4xl md:text-5xl font-bold mb-6">
                                Built for modern data teams
                            </h2>
                            <p className="text-xl text-muted-foreground mb-8">
                                Our platform combines powerful analytics with an intuitive interface, making complex data analysis accessible to everyone.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {benefits.map((benefit, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                                        <span className="text-sm">{benefit}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 bg-slate-700 rounded-2xl blur-3xl opacity-20" />
                            <Card className="border-2 relative">
                                <CardHeader className="bg-slate-700 text-white rounded-t-xl">
                                    <CardTitle className="flex items-center gap-2">
                                        <LineChart className="h-5 w-5" />
                                        Live Analytics Dashboard
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-8">
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">R² Score</span>
                                            <span className="text-2xl font-bold">0.9842</span>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-slate-700 rounded-full" style={{ width: '98%' }} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-muted/50 rounded-lg">
                                                <div className="text-xs text-muted-foreground mb-1">Data Points</div>
                                                <div className="text-xl font-bold">1,234</div>
                                            </div>
                                            <div className="p-4 bg-muted/50 rounded-lg">
                                                <div className="text-xs text-muted-foreground mb-1">RMSE</div>
                                                <div className="text-xl font-bold">0.0421</div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-24 bg-background">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <Badge className="mb-4">Testimonials</Badge>
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">
                            Loved by data professionals
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <Card key={index} className="border-2">
                                <CardContent className="pt-6">
                                    <div className="flex mb-4">
                                        {[...Array(5)].map((_, i) => (
                                            <Sparkles key={i} className="h-4 w-4 text-blue-600 fill-blue-600" />
                                        ))}
                                    </div>
                                    <p className="text-muted-foreground mb-4 italic">
                                        "{testimonial.quote}"
                                    </p>
                                    <div>
                                        <p className="font-semibold">{testimonial.author}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {testimonial.role}, {testimonial.company}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 text-white">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">
                        Ready to get started?
                    </h2>
                    <p className="text-xl mb-8 text-slate-200 max-w-2xl mx-auto">
                        Join thousands of data professionals using DataViz Pro to transform their data analysis workflow.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/signup">
                            <Button size="lg" variant="secondary" className="gap-2 text-lg px-8 py-6">
                                Start Free Trial
                                <ArrowRight className="h-5 w-5" />
                            </Button>
                        </Link>
                        <Button size="lg" variant="outline" className="gap-2 text-lg px-8 py-6 bg-white/10 border-white/30 hover:bg-white/20 text-white">
                            Schedule Demo
                        </Button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-slate-800 text-white">
                                <Sparkles className="size-4" />
                            </div>
                            <span className="font-bold">DataViz Pro</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            © 2026 DataViz Pro. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default ModernLandingPage;
