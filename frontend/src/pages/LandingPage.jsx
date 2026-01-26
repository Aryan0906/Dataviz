import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowRight, BarChart2, Brain, FileOutput, Shield, Upload, Zap } from "lucide-react";

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background">
            {/* Navigation */}
            <nav className="border-b bg-background/80 backdrop-blur sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <BarChart2 className="h-6 w-6 text-primary" />
                            <span className="text-xl font-bold tracking-tight">dataViz</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <ThemeToggle />
                            <Button onClick={() => navigate('/login')}>Sign In</Button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative overflow-hidden pt-16 pb-24 lg:pt-32 lg:pb-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground mb-6">
                        Data Visualization <br className="hidden sm:block" />
                        <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
                            Reimagined with AI
                        </span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-xl text-muted-foreground mb-10">
                        Turn your CSV data into actionable insights instantly. Use natural language to generate charts, detect anomalies, and export reports in seconds.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Button size="lg" className="gap-2 text-lg px-8" onClick={() => navigate('/signup')}>
                            Get Started Free <ArrowRight className="h-5 w-5" />
                        </Button>
                        <Button size="lg" variant="outline" className="text-lg px-8" onClick={() => navigate('/login')}>
                            Live Demo
                        </Button>
                    </div>
                </div>

                {/* Background Gradients */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30 pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
                    <div className="absolute top-20 right-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
                    <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 bg-muted/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold tracking-tight mb-4">Everything you need to analyze data</h2>
                        <p className="text-muted-foreground text-lg">Powerful features wrapped in a simple, intuitive interface.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Brain className="h-8 w-8 text-purple-500" />}
                            title="AI-Powered Analysis"
                            description="Automatically detect data quality issues, outliers, and get suggested cleaning actions."
                        />
                        <FeatureCard
                            icon={<Zap className="h-8 w-8 text-yellow-500" />}
                            title="Natural Language Query"
                            description="Simply ask 'Show sales by region' and watch the perfect chart appear instantly."
                        />
                        <FeatureCard
                            icon={<Upload className="h-8 w-8 text-blue-500" />}
                            title="Easy Import"
                            description="Drag and drop CSV files. We handle parsing, type detection, and validation."
                        />
                        <FeatureCard
                            icon={<BarChart2 className="h-8 w-8 text-green-500" />}
                            title="Interactive Visualizations"
                            description="Zoom, pan, and hover over data points. Switch between bar, line, pie, and scatter plots."
                        />
                        <FeatureCard
                            icon={<FileOutput className="h-8 w-8 text-orange-500" />}
                            title="Export & Share"
                            description="Download your insights as high-quality PNG images or PDF reports ready for presentation."
                        />
                        <FeatureCard
                            icon={<Shield className="h-8 w-8 text-red-500" />}
                            title="Secure & Private"
                            description="Your data is processed securely. We use industry-standard encryption for all operations."
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold tracking-tight mb-6">Ready to visualize your data?</h2>
                    <p className="text-xl text-muted-foreground mb-10">
                        Join thousands of users who are making better decisions with dataViz. No credit card required.
                    </p>
                    <Button size="lg" onClick={() => navigate('/signup')} className="gap-2">
                        Start Analyzing Now <ArrowRight className="h-5 w-5" />
                    </Button>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t py-12 bg-muted/20">
                <div className="max-w-7xl mx-auto px-4 text-center text-muted-foreground">
                    <p>© 2024 dataViz. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon, title, description }) => (
    <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
        <div className="mb-4">{icon}</div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
    </div>
);

export default LandingPage;
