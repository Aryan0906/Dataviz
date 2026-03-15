import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LandingNav from "@/components/LandingNav";
import LandingFooter from "@/components/LandingFooter";
import {
    Sparkles,
    TrendingUp,
    BookOpen,
    Rocket,
    ArrowRight,
    CheckCircle2,
    Brain,
    Users,
    Zap,
    Search,
    PartyPopper,
    Globe,
    Target,
    Award,
    Lightbulb,
    BarChart3,
    Play,
    ChevronDown,
    Code2,
    Database,
    Activity
} from "lucide-react";

const EnhancedStorytellingLanding = () => {
    const [scrollY, setScrollY] = useState(0);
    const [_isVisible, _setIsVisible] = useState({});
    const statsRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Animated counter
    const [stats, setStats] = useState({ users: 0, insights: 0, companies: 0 });

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        animateStats();
                    }
                });
            },
            { threshold: 0.5 }
        );

        if (statsRef.current) {
            observer.observe(statsRef.current);
        }

        return () => observer.disconnect();
    }, []);

    const animateStats = () => {
        const targets = { users: 50000, insights: 2000000, companies: 500 };
        const duration = 2000;
        const steps = 60;
        const increment = duration / steps;

        let current = { users: 0, insights: 0, companies: 0 };

        const timer = setInterval(() => {
            current.users = Math.min(current.users + targets.users / steps, targets.users);
            current.insights = Math.min(current.insights + targets.insights / steps, targets.insights);
            current.companies = Math.min(current.companies + targets.companies / steps, targets.companies);

            setStats({
                users: Math.floor(current.users),
                insights: Math.floor(current.insights),
                companies: Math.floor(current.companies)
            });

            if (current.users >= targets.users) {
                clearInterval(timer);
            }
        }, increment);
    };

    const scrollToContent = () => {
        window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-black text-white overflow-hidden">
            {/* Navigation */}
            <LandingNav variant="dark" />

            {/* Immersive Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-[120px] animate-pulse"
                        style={{ animationDuration: '4s' }} />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-[120px] animate-pulse"
                        style={{ animationDuration: '5s', animationDelay: '1s' }} />
                    <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/20 rounded-full blur-[120px] animate-pulse"
                        style={{ animationDuration: '6s', animationDelay: '2s' }} />
                </div>

                {/* Floating particles */}
                <div className="absolute inset-0 overflow-hidden">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-2 h-2 bg-white/20 rounded-full"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animation: `float ${5 + Math.random() * 10}s linear infinite`,
                                animationDelay: `${Math.random() * 5}s`
                            }}
                        />
                    ))}
                </div>

                <div className="relative z-10 container mx-auto px-6 text-center"
                    style={{
                        transform: `translateY(${scrollY * 0.5}px)`,
                        opacity: 1 - scrollY / 500
                    }}>

                    <Badge className="mb-8 bg-white/10 text-white border-white/20 px-6 py-2 text-sm backdrop-blur-xl">
                        <Sparkles className="h-3 w-3 mr-2" />
                        Trusted by 50,000+ data professionals worldwide
                    </Badge>

                    <h1 className="text-6xl md:text-8xl font-bold mb-8 leading-tight">
                        <span className="block mb-4">Where Data</span>
                        <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Becomes Story
                        </span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                        Transform raw numbers into compelling narratives.
                        Discover insights that change everything.
                        Share stories that inspire action.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                        <Link to="/signup">
                            <Button size="lg" className="gap-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-7 rounded-full shadow-2xl shadow-purple-500/50 border-0">
                                <Rocket className="h-5 w-5" />
                                Begin Your Journey
                                <ArrowRight className="h-5 w-5" />
                            </Button>
                        </Link>
                        <Button size="lg" variant="outline" className="gap-3 text-lg px-8 py-7 rounded-full border-2 border-white/20 bg-white/5 hover:bg-white/10 backdrop-blur-xl">
                            <Play className="h-5 w-5" />
                            Watch Story
                        </Button>
                    </div>

                    {/* Scroll indicator */}
                    <button
                        onClick={scrollToContent}
                        className="animate-bounce cursor-pointer bg-white/10 hover:bg-white/20 rounded-full p-3 backdrop-blur-xl transition-all"
                    >
                        <ChevronDown className="h-6 w-6" />
                    </button>
                </div>
            </section>

            {/* Live Stats Section */}
            <section ref={statsRef} className="py-24 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-black via-blue-950/20 to-black" />
                <div className="container mx-auto px-6 relative z-10">
                    <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
                        <div className="text-center group">
                            <div className="relative inline-block mb-4">
                                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl group-hover:blur-2xl transition-all" />
                                <Globe className="h-16 w-16 text-blue-400 relative" />
                            </div>
                            <div className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                                {stats.users.toLocaleString()}+
                            </div>
                            <div className="text-muted-foreground text-lg">Data Storytellers</div>
                        </div>

                        <div className="text-center group">
                            <div className="relative inline-block mb-4">
                                <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl group-hover:blur-2xl transition-all" />
                                <Lightbulb className="h-16 w-16 text-purple-400 relative" />
                            </div>
                            <div className="text-5xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                {stats.insights.toLocaleString()}+
                            </div>
                            <div className="text-muted-foreground text-lg">Insights Discovered</div>
                        </div>

                        <div className="text-center group">
                            <div className="relative inline-block mb-4">
                                <div className="absolute inset-0 bg-pink-500/20 rounded-full blur-xl group-hover:blur-2xl transition-all" />
                                <Award className="h-16 w-16 text-pink-400 relative" />
                            </div>
                            <div className="text-5xl font-bold mb-2 bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent">
                                {stats.companies.toLocaleString()}+
                            </div>
                            <div className="text-muted-foreground text-lg">Companies Trust Us</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* The Journey - Scroll-triggered Story */}
            <section id="journey" className="py-32 relative scroll-mt-20">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-20">
                        <Badge className="mb-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border-blue-500/30 px-6 py-2 backdrop-blur-xl">
                            <BookOpen className="h-4 w-4 mr-2" />
                            Your Data Journey
                        </Badge>
                        <h2 className="text-5xl md:text-6xl font-bold mb-6">
                            Every Insight Tells
                            <br />
                            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                A Story
                            </span>
                        </h2>
                        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                            From confusion to clarity in four transformative steps
                        </p>
                    </div>

                    <div className="max-w-6xl mx-auto space-y-32">
                        {/* Step 1 */}
                        <div className="grid md:grid-cols-2 gap-16 items-center">
                            <div className="space-y-6">
                                <Badge className="bg-slate-500/20 text-slate-200 border-slate-500/30">
                                    Chapter 01
                                </Badge>
                                <h3 className="text-4xl font-bold">The Challenge</h3>
                                <p className="text-xl text-gray-300 leading-relaxed">
                                    You're drowning in spreadsheets. Numbers everywhere,
                                    but no clear story. The insights you need are buried
                                    under layers of complexity.
                                </p>
                                <div className="flex items-center gap-3 text-slate-300">
                                    <ArrowRight className="h-5 w-5" />
                                    <span>Before DataViz: Hours of manual analysis</span>
                                </div>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-slate-500/20 to-transparent rounded-3xl blur-3xl" />
                                <Card className="relative border-2 border-slate-700/50 bg-slate-900/50 backdrop-blur-xl overflow-hidden">
                                    <CardContent className="p-8">
                                        <div className="space-y-4">
                                            <div className="h-4 bg-slate-700/50 rounded w-full" />
                                            <div className="h-4 bg-slate-700/50 rounded w-4/5" />
                                            <div className="h-4 bg-slate-700/50 rounded w-full" />
                                            <div className="h-4 bg-slate-700/50 rounded w-3/4" />
                                            <div className="grid grid-cols-3 gap-4 pt-4">
                                                <div className="h-24 bg-slate-700/30 rounded" />
                                                <div className="h-24 bg-slate-700/30 rounded" />
                                                <div className="h-24 bg-slate-700/30 rounded" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="grid md:grid-cols-2 gap-16 items-center">
                            <div className="relative order-2 md:order-1">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-transparent rounded-3xl blur-3xl" />
                                <Card className="relative border-2 border-blue-700/50 bg-blue-950/30 backdrop-blur-xl overflow-hidden group hover:border-blue-500/50 transition-all">
                                    <CardContent className="p-8">
                                        <div className="flex items-center justify-center h-64 relative">
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-32 h-32 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                                            </div>
                                            <Search className="h-16 w-16 text-blue-400 animate-pulse" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                            <div className="space-y-6 order-1 md:order-2">
                                <Badge className="bg-blue-500/20 text-blue-200 border-blue-500/30">
                                    Chapter 02
                                </Badge>
                                <h3 className="text-4xl font-bold">The Discovery</h3>
                                <p className="text-xl text-gray-300 leading-relaxed">
                                    Our AI becomes your data detective. Upload your data
                                    and watch as patterns emerge, relationships reveal themselves,
                                    and insights crystallize.
                                </p>
                                <div className="flex items-center gap-3 text-blue-300">
                                    <Zap className="h-5 w-5" />
                                    <span>Analysis complete in seconds, not hours</span>
                                </div>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="grid md:grid-cols-2 gap-16 items-center">
                            <div className="space-y-6">
                                <Badge className="bg-purple-500/20 text-purple-200 border-purple-500/30">
                                    Chapter 03
                                </Badge>
                                <h3 className="text-4xl font-bold">The Revelation</h3>
                                <p className="text-xl text-gray-300 leading-relaxed">
                                    The moment of truth. Your data speaks in clear,
                                    beautiful visualizations. Complex correlations become
                                    simple truths. You don't just see numbers—you understand them.
                                </p>
                                <div className="flex items-center gap-3 text-purple-300">
                                    <Brain className="h-5 w-5" />
                                    <span>AI explains insights in plain English</span>
                                </div>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-3xl blur-3xl animate-pulse" />
                                <Card className="relative border-2 border-purple-700/50 bg-purple-950/30 backdrop-blur-xl overflow-hidden group hover:border-purple-500/50 transition-all">
                                    <CardContent className="p-8">
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3 mb-4">
                                                <Sparkles className="h-6 w-6 text-purple-400" />
                                                <span className="text-sm font-semibold text-purple-300">Insight Discovered</span>
                                            </div>
                                            <div className="h-48 relative">
                                                <div className="absolute inset-0 flex items-end justify-around">
                                                    <div className="w-12 bg-gradient-to-t from-purple-600 to-blue-600 rounded-t h-3/4" />
                                                    <div className="w-12 bg-gradient-to-t from-purple-600 to-blue-600 rounded-t h-full" />
                                                    <div className="w-12 bg-gradient-to-t from-purple-600 to-blue-600 rounded-t h-2/3" />
                                                    <div className="w-12 bg-gradient-to-t from-purple-600 to-blue-600 rounded-t h-5/6" />
                                                </div>
                                            </div>
                                            <div className="text-center text-sm text-muted-foreground pt-4 border-t border-purple-700/30">
                                                Strong positive correlation detected: R² = 0.94
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Step 4 */}
                        <div className="grid md:grid-cols-2 gap-16 items-center">
                            <div className="relative order-2 md:order-1">
                                <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-transparent rounded-3xl blur-3xl" />
                                <Card className="relative border-2 border-green-700/50 bg-green-950/30 backdrop-blur-xl overflow-hidden group hover:border-green-500/50 transition-all">
                                    <CardContent className="p-8">
                                        <div className="space-y-4 text-center">
                                            <PartyPopper className="h-16 w-16 text-green-400 mx-auto mb-4" />
                                            <h4 className="text-2xl font-bold text-green-300">Ready to Share!</h4>
                                            <div className="grid grid-cols-2 gap-3 pt-4">
                                                <div className="p-3 bg-green-900/30 rounded-lg border border-green-700/30">
                                                    <div className="text-xs text-green-400 mb-1">PNG</div>
                                                    <div className="h-12 bg-green-800/20 rounded" />
                                                </div>
                                                <div className="p-3 bg-green-900/30 rounded-lg border border-green-700/30">
                                                    <div className="text-xs text-green-400 mb-1">PDF</div>
                                                    <div className="h-12 bg-green-800/20 rounded" />
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                            <div className="space-y-6 order-1 md:order-2">
                                <Badge className="bg-green-500/20 text-green-200 border-green-500/30">
                                    Chapter 04
                                </Badge>
                                <h3 className="text-4xl font-bold">The Impact</h3>
                                <p className="text-xl text-gray-300 leading-relaxed">
                                    Your story is ready for the world. Export stunning visualizations,
                                    comprehensive reports, or production-ready code. Share insights
                                    that drive decisions and inspire action.
                                </p>
                                <div className="flex items-center gap-3 text-green-300">
                                    <Rocket className="h-5 w-5" />
                                    <span>From discovery to presentation in minutes</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Showcase */}
            <section id="features" className="py-32 relative scroll-mt-20">
                <div className="absolute inset-0 bg-gradient-to-b from-black via-blue-950/10 to-black" />
                <div className="container mx-auto px-6 relative z-10">
                    <div className="text-center mb-20">
                        <Badge className="mb-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border-blue-500/30 px-6 py-2 backdrop-blur-xl">
                            <Zap className="h-4 w-4 mr-2" />
                            Powerful Features
                        </Badge>
                        <h2 className="text-5xl md:text-6xl font-bold mb-6">
                            Everything You Need to
                            <br />
                            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                Tell Your Data Story
                            </span>
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                        {[
                            {
                                icon: Zap,
                                title: "Smart Analytics",
                                description: "Automatic data cleaning, health checks, and correlation analysis",
                                color: "from-purple-500 to-purple-700",
                                badge: "New"
                            },
                            {
                                icon: Sparkles,
                                title: "AI-Powered",
                                description: "Get intelligent insights and suggestions powered by AI",
                                color: "from-blue-500 to-blue-700",
                            },
                            {
                                icon: TrendingUp,
                                title: "Advanced Regression",
                                description: "15+ regression models with automatic best-fit selection",
                                color: "from-cyan-500 to-cyan-700",
                            },
                            {
                                icon: Activity,
                                title: "Mathematical Graphing",
                                description: "Interactive Desmos integration for curve plotting",
                                color: "from-emerald-500 to-emerald-700",
                            },
                            {
                                icon: BarChart3,
                                title: "Interactive Charts",
                                description: "Beautiful visualizations with Plotly and Recharts",
                                color: "from-green-500 to-green-700",
                            },
                            {
                                icon: Code2,
                                title: "Code Export",
                                description: "Generate Python code for any analysis instantly",
                                color: "from-orange-500 to-orange-700",
                            },
                            {
                                icon: Database,
                                title: "NLP Analysis",
                                description: "Process and visualize text data with natural language",
                                color: "from-pink-500 to-pink-700",
                            }
                        ].map((feature, index) => (
                            <Card key={index} className="border-2 border-white/10 bg-white/5 backdrop-blur-xl hover:border-white/20 hover:bg-white/10 transition-all group relative overflow-hidden">
                                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                                <CardContent className="p-8 relative">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.color} shadow-xl`}>
                                            <feature.icon className="h-6 w-6 text-white" />
                                        </div>
                                        {feature.badge && (
                                            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                                                {feature.badge}
                                            </Badge>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Social Proof - Real Stories */}
            <section id="testimonials" className="py-32 relative scroll-mt-20">
                <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-950/10 to-black" />
                <div className="container mx-auto px-6 relative z-10">
                    <div className="text-center mb-20">
                        <Badge className="mb-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border-purple-500/30 px-6 py-2 backdrop-blur-xl">
                            <Users className="h-4 w-4 mr-2" />
                            Stories From Our Community
                        </Badge>
                        <h2 className="text-5xl md:text-6xl font-bold mb-6">
                            Real People,
                            <br />
                            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                Real Discoveries
                            </span>
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                        {[
                            {
                                name: "Dr. Sarah Chen",
                                role: "Research Director",
                                company: "HealthTech Innovations",
                                story: "DataViz helped us identify a critical correlation in patient data that led to a breakthrough treatment protocol. What would have taken months took just hours.",
                                impact: "42% improvement in patient outcomes",
                                avatar: "S",
                                color: "from-blue-500 to-cyan-500"
                            },
                            {
                                name: "Marcus Rodriguez",
                                role: "VP of Analytics",
                                company: "RetailCo Global",
                                story: "We discovered seasonal patterns we never knew existed. The AI insights transformed our inventory strategy and saved millions.",
                                impact: "$4.2M in cost savings",
                                avatar: "M",
                                color: "from-purple-500 to-pink-500"
                            },
                            {
                                name: "Emily Watson",
                                role: "Data Scientist",
                                company: "FinanceHub",
                                story: "The storytelling approach makes it easy to share insights with non-technical stakeholders. Our board meetings have never been more productive.",
                                impact: "3x faster decision making",
                                avatar: "E",
                                color: "from-green-500 to-emerald-500"
                            }
                        ].map((testimonial, index) => (
                            <Card key={index} className="border-2 border-white/10 bg-white/5 backdrop-blur-xl hover:border-white/20 hover:bg-white/10 transition-all group">
                                <CardContent className="p-8">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center text-white text-2xl font-bold shadow-xl`}>
                                            {testimonial.avatar}
                                        </div>
                                        <div>
                                            <div className="font-bold text-lg">{testimonial.name}</div>
                                            <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                                            <div className="text-xs text-muted-foreground/80">{testimonial.company}</div>
                                        </div>
                                    </div>

                                    <p className="text-gray-300 mb-6 leading-relaxed italic">
                                        "{testimonial.story}"
                                    </p>

                                    <div className="pt-6 border-t border-white/10">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Target className="h-4 w-4 text-green-400" />
                                            <span className="text-green-400 font-semibold">
                                                {testimonial.impact}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-32 relative overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[150px] animate-pulse" />
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[150px] animate-pulse"
                        style={{ animationDelay: '1s' }} />
                </div>

                <div className="container mx-auto px-6 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-5xl md:text-7xl font-bold mb-8">
                            Your Data Story
                            <br />
                            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                Starts Today
                            </span>
                        </h2>

                        <p className="text-2xl text-gray-300 mb-12">
                            Join 50,000+ professionals who've transformed their data into insights
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                            <Link to="/signup">
                                <Button size="lg" className="gap-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-xl px-12 py-8 rounded-full shadow-2xl shadow-purple-500/50 border-0">
                                    <Rocket className="h-6 w-6" />
                                    Start Free - Forever
                                    <ArrowRight className="h-6 w-6" />
                                </Button>
                            </Link>
                        </div>

                        <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-400" />
                                <span>No credit card required</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-400" />
                                <span>Unlimited insights</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-400" />
                                <span>Cancel anytime</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <LandingFooter variant="dark" />

            {/* eslint-disable-next-line react/no-unknown-property */}
            <style jsx>{`
                @keyframes float {
                    0%, 100% {
                        transform: translateY(0) translateX(0);
                    }
                    25% {
                        transform: translateY(-20px) translateX(10px);
                    }
                    75% {
                        transform: translateY(20px) translateX(-10px);
                    }
                }
            `}</style>
        </div>
    );
};

export default EnhancedStorytellingLanding;
