import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    LineChart,
    PartyPopper,
    Star
} from "lucide-react";

const StorytellingLandingPage = () => {
    const storySteps = [
        {
            chapter: "01",
            icon: BookOpen,
            title: "The Challenge",
            description: "You have data, but it's overwhelming. Numbers scattered across spreadsheets, patterns hiding in plain sight.",
            color: "from-slate-600 to-slate-800"
        },
        {
            chapter: "02",
            icon: Search,
            title: "The Discovery",
            description: "Upload your data and watch as our AI begins the investigation, searching for hidden patterns and relationships.",
            color: "from-blue-600 to-blue-800"
        },
        {
            chapter: "03",
            icon: Sparkles,
            title: "The Revelation",
            description: "Your insights emerge! Clear visualizations and plain-English explanations reveal what your data has been trying to tell you.",
            color: "from-purple-600 to-purple-800"
        },
        {
            chapter: "04",
            icon: PartyPopper,
            title: "The Impact",
            description: "Share your discovery with beautiful charts, reports, and code. Your data story is ready for the world.",
            color: "from-green-600 to-green-800"
        }
    ];

    const beforeAfter = [
        {
            before: "Drowning in spreadsheets",
            after: "Clear visual insights",
            icon: LineChart
        },
        {
            before: "Hours of manual analysis",
            after: "Instant AI-powered results",
            icon: Zap
        },
        {
            before: "Technical complexity",
            after: "Plain English explanations",
            icon: Brain
        },
        {
            before: "Isolated findings",
            after: "Shareable stories",
            icon: Users
        }
    ];

    const userJourneys = [
        {
            name: "Sarah",
            role: "Marketing Analyst",
            chapter: "Email Campaign Success Story",
            insight: "Discovered optimal send times that increased open rates by 34%",
            avatar: "S"
        },
        {
            name: "Michael",
            role: "Research Scientist",
            chapter: "Climate Pattern Analysis",
            insight: "Found correlation between variables that led to published research",
            avatar: "M"
        },
        {
            name: "Dr. Emily",
            role: "Healthcare Data Scientist",
            chapter: "Patient Outcome Study",
            insight: "Identified key factors improving treatment success by 28%",
            avatar: "E"
        }
    ];

    return (
        <div className="min-h-screen bg-background">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 text-white shadow-lg">
                            <BookOpen className="size-4" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                            DataViz Pro
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/login">
                            <Button variant="ghost">Sign In</Button>
                        </Link>
                        <Link to="/signup">
                            <Button className="bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-slate-950 gap-2">
                                Start Your Journey
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section - The Problem */}
            <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-slate-950 dark:via-gray-950 dark:to-slate-900">
                {/* Animated background */}
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-slate-400/20 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
                </div>

                <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
                    <div className="max-w-5xl mx-auto text-center">
                        <Badge className="mb-6 bg-gradient-to-r from-slate-700 to-slate-900 text-white border-0 px-6 py-2 text-sm">
                            <BookOpen className="h-3 w-3 mr-2" />
                            Your Data Has a Story
                        </Badge>

                        <h1 className="text-5xl md:text-7xl font-bold mb-6 text-slate-900 dark:text-slate-100 leading-tight">
                            Turn Numbers Into
                            <br />
                            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Narratives
                            </span>
                        </h1>

                        <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
                            Every dataset holds a story waiting to be told. We help you discover it,
                            understand it, and share it with the world.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                            <Link to="/signup">
                                <Button size="lg" className="gap-2 bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-slate-950 text-lg px-8 py-6">
                                    <Rocket className="h-5 w-5" />
                                    Begin Your Story
                                    <ArrowRight className="h-5 w-5" />
                                </Button>
                            </Link>
                            <Button size="lg" variant="outline" className="text-lg px-8 py-6 gap-2">
                                <BookOpen className="h-5 w-5" />
                                See Example Stories
                            </Button>
                        </div>

                        {/* Before/After Transformation */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {beforeAfter.map((item, index) => (
                                <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-slate-300 dark:hover:border-slate-700">
                                    <CardContent className="p-6 text-center">
                                        <item.icon className="h-8 w-8 mx-auto mb-3 text-slate-600 dark:text-slate-400 group-hover:scale-110 transition-transform" />
                                        <div className="space-y-2">
                                            <p className="text-sm text-muted-foreground line-through">
                                                {item.before}
                                            </p>
                                            <div className="flex items-center justify-center gap-2">
                                                <ArrowRight className="h-4 w-4 text-green-600" />
                                            </div>
                                            <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                                                {item.after}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* The Journey - 4 Chapter Story Arc */}
            <section className="py-20 bg-background">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-slate-100">
                            Your Data Analysis Journey
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Every great insight follows a story. Here's yours.
                        </p>
                    </div>

                    <div className="max-w-5xl mx-auto space-y-8">
                        {storySteps.map((step, index) => (
                            <div key={index} className="relative">
                                {/* Connection line */}
                                {index < storySteps.length - 1 && (
                                    <div className="absolute left-8 top-24 w-0.5 h-full bg-gradient-to-b from-slate-300 to-transparent dark:from-slate-700 z-0" />
                                )}

                                <Card className={`relative overflow-hidden group hover:shadow-xl transition-all duration-500 border-2 ${index % 2 === 0 ? 'md:mr-12' : 'md:ml-12'}`}>
                                    <div className={`absolute inset-0 bg-gradient-to-r ${step.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

                                    <CardContent className="p-8">
                                        <div className="flex items-start gap-6">
                                            <div className={`flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                                <step.icon className="h-8 w-8" />
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <Badge variant="outline" className="text-xs font-mono">
                                                        Chapter {step.chapter}
                                                    </Badge>
                                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                                        {step.title}
                                                    </h3>
                                                </div>
                                                <p className="text-lg text-muted-foreground leading-relaxed">
                                                    {step.description}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Real User Stories */}
            <section className="py-20 bg-gradient-to-br from-slate-100 to-gray-100 dark:from-slate-900 dark:to-gray-900">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <Badge className="mb-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
                            <Star className="h-3 w-3 mr-1" />
                            Real Data Stories
                        </Badge>
                        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-slate-100">
                            Stories From Our Community
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            See how others discovered insights that changed everything
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {userJourneys.map((journey, index) => (
                            <Card key={index} className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-blue-300 dark:hover:border-blue-700">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white text-lg font-bold">
                                            {journey.avatar}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                                                {journey.name}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {journey.role}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <BookOpen className="h-4 w-4 text-blue-600" />
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                {journey.chapter}
                                            </p>
                                        </div>
                                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                                            <p className="text-sm text-slate-700 dark:text-slate-300 italic">
                                                "{journey.insight}"
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        <span>Verified Insight</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Call to Action */}
            <section className="py-20 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 text-white relative overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">
                            Ready to Write Your Data Story?
                        </h2>
                        <p className="text-xl mb-8 text-slate-300">
                            Join thousands of analysts, researchers, and data scientists
                            who are discovering insights every day.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                            <Link to="/signup">
                                <Button size="lg" className="gap-2 bg-white text-slate-900 hover:bg-slate-100 text-lg px-8 py-6">
                                    <Rocket className="h-5 w-5" />
                                    Start Free - No Credit Card
                                    <ArrowRight className="h-5 w-5" />
                                </Button>
                            </Link>
                        </div>

                        <div className="flex flex-wrap justify-center gap-8 text-sm text-slate-400">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-400" />
                                <span>Free forever plan</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-400" />
                                <span>No credit card needed</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-400" />
                                <span>Start in 60 seconds</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-background border-t py-12">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-slate-600" />
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                                DataViz Pro
                            </span>
                            <span className="text-muted-foreground">
                                · Making data tell stories
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            © 2026 DataViz Pro. Every dataset has a story.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default StorytellingLandingPage;
