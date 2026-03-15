import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStorytelling } from "@/context/StorytellingContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
    Upload,
    Brain,
    PartyPopper,
    ArrowRight,
    ArrowLeft,
    Check,
    TrendingUp,
    BookOpen,
    Rocket
} from "lucide-react";
import confetti from "canvas-confetti";

const OnboardingWizard = ({ onComplete }) => {
    const navigate = useNavigate();
    const { unlockAchievement } = useStorytelling();
    const [currentStep, setCurrentStep] = useState(0);
    const [sampleDataUploaded, setSampleDataUploaded] = useState(false);

    const steps = [
        {
            id: "welcome",
            title: "✨ Welcome to Your Data Journey",
            subtitle: "Every expert was once a beginner",
            icon: BookOpen,
            gradient: "from-slate-600 to-slate-800"
        },
        {
            id: "upload",
            title: "📊 Share Your First Data",
            subtitle: "Don't worry, we'll guide you through it",
            icon: Upload,
            gradient: "from-blue-600 to-blue-800"
        },
        {
            id: "magic",
            title: "🧠 Watch the Magic Happen",
            subtitle: "Our AI is searching for patterns",
            icon: Brain,
            gradient: "from-purple-600 to-purple-800"
        },
        {
            id: "celebrate",
            title: "🎉 Your First Insight!",
            subtitle: "You're officially a data storyteller",
            icon: PartyPopper,
            gradient: "from-green-600 to-green-800"
        }
    ];

    const progress = ((currentStep + 1) / steps.length) * 100;

    const handleNext = () => {
        if (currentStep === 0) {
            // Welcome step
            setCurrentStep(1);
        } else if (currentStep === 1 && sampleDataUploaded) {
            // Upload step - proceed to analysis
            setCurrentStep(2);
            // Simulate analysis
            setTimeout(() => {
                setCurrentStep(3);
                triggerConfetti();
            }, 2500);
        } else if (currentStep === 3) {
            // Final step - complete onboarding
            unlockAchievement('completed-onboarding');
            if (onComplete) onComplete();
            navigate("/dashboard");
        }
    };

    const handleBack = () => {
        if (currentStep > 0) setCurrentStep(currentStep - 1);
    };

    const handleUseSampleData = () => {
        setSampleDataUploaded(true);
    };

    const triggerConfetti = () => {
        const count = 200;
        const defaults = {
            origin: { y: 0.7 }
        };

        function fire(particleRatio, opts) {
            confetti({
                ...defaults,
                ...opts,
                particleCount: Math.floor(count * particleRatio),
                spread: 100
            });
        }

        fire(0.25, {
            spread: 26,
            startVelocity: 55,
        });
        fire(0.2, {
            spread: 60,
        });
        fire(0.35, {
            spread: 100,
            decay: 0.91,
            scalar: 0.8
        });
        fire(0.1, {
            spread: 120,
            startVelocity: 25,
            decay: 0.92,
            scalar: 1.2
        });
        fire(0.1, {
            spread: 120,
            startVelocity: 45,
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-slate-950 dark:via-gray-950 dark:to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-3xl">
                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-medium text-muted-foreground">
                            Your First Journey
                        </h3>
                        <Badge variant="outline" className="gap-1">
                            <Rocket className="h-3 w-3" />
                            Step {currentStep + 1} of {steps.length}
                        </Badge>
                    </div>
                    <Progress value={progress} className="h-2" />

                    <div className="flex justify-between mt-2">
                        {steps.map((step, index) => (
                            <div key={step.id} className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${index <= currentStep
                                    ? `bg-gradient-to-br ${step.gradient} text-white shadow-lg`
                                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                                    }`}>
                                    {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Card */}
                <Card className="border-2 shadow-2xl">
                    <CardHeader className={`bg-gradient-to-r ${steps[currentStep].gradient} text-white pb-16`}>
                        <div className="flex items-center justify-center mb-6">
                            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                {currentStep === 3 ? (
                                    <PartyPopper className="h-10 w-10 animate-bounce" />
                                ) : (
                                    (() => {
                                        const StepIcon = steps[currentStep].icon;
                                        return StepIcon ? <StepIcon className="h-10 w-10" /> : null;
                                    })()
                                )}
                            </div>
                        </div>
                        <CardTitle className="text-3xl md:text-4xl font-bold text-center mb-2">
                            {steps[currentStep].title}
                        </CardTitle>
                        <CardDescription className="text-white/90 text-center text-lg">
                            {steps[currentStep].subtitle}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-6">
                        {/* Step 0: Welcome */}
                        {currentStep === 0 && (
                            <div className="space-y-6 py-6">
                                <div className="text-center space-y-4">
                                    <p className="text-lg text-muted-foreground leading-relaxed">
                                        Hi there! 👋 I'm your data analysis guide. Together, we're going to:
                                    </p>

                                    <div className="grid gap-4 mt-8">
                                        {[
                                            { icon: Upload, text: "Upload your first dataset (we'll use a sample)", color: "text-blue-600" },
                                            { icon: Brain, text: "Watch AI find patterns automatically", color: "text-purple-600" },
                                            { icon: TrendingUp, text: "Discover your first insight", color: "text-green-600" }
                                        ].map((item, index) => (
                                            <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                                <div className={`w-10 h-10 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center flex-shrink-0 ${item.color}`}>
                                                    <item.icon className="h-5 w-5" />
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <p className="font-medium text-slate-900 dark:text-slate-100">
                                                        {item.text}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                                        <p className="text-sm text-blue-900 dark:text-blue-100">
                                            💡 <strong>Don't worry!</strong> You can't break anything. This is a safe space to learn.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 1: Upload Data */}
                        {currentStep === 1 && (
                            <div className="space-y-6 py-6">
                                {!sampleDataUploaded ? (
                                    <>
                                        <div className="text-center space-y-4">
                                            <p className="text-lg text-muted-foreground">
                                                Let's start with sample data so you can see how it works
                                            </p>
                                        </div>

                                        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-12 text-center hover:border-blue-500 dark:hover:border-blue-500 transition-colors cursor-pointer group"
                                            onClick={handleUseSampleData}>
                                            <Upload className="h-16 w-16 mx-auto mb-4 text-slate-400 group-hover:text-blue-600 group-hover:scale-110 transition-all" />
                                            <h4 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">
                                                Use Sample Sales Data
                                            </h4>
                                            <p className="text-muted-foreground mb-4">
                                                Click here to load example data
                                            </p>
                                            <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                                                Recommended for first-timers
                                            </Badge>
                                        </div>

                                        <div className="relative">
                                            <div className="absolute inset-0 flex items-center">
                                                <div className="w-full border-t border-slate-300 dark:border-slate-700"></div>
                                            </div>
                                            <div className="relative flex justify-center text-xs uppercase">
                                                <span className="bg-background px-2 text-muted-foreground">
                                                    or upload your own
                                                </span>
                                            </div>
                                        </div>

                                        <Button variant="outline" className="w-full gap-2" size="lg">
                                            <Upload className="h-5 w-5" />
                                            Upload Your CSV File
                                        </Button>
                                    </>
                                ) : (
                                    <div className="text-center space-y-4 py-6">
                                        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto">
                                            <Check className="h-10 w-10 text-green-600 dark:text-green-400" />
                                        </div>
                                        <h4 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                            Perfect! Data Loaded
                                        </h4>
                                        <p className="text-muted-foreground">
                                            You've loaded <strong>25 data points</strong> of sales data
                                        </p>
                                        <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-4 mt-4">
                                            <code className="text-sm text-slate-700 dark:text-slate-300">
                                                Months vs Revenue • Ready for analysis
                                            </code>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 2: Analysis in Progress */}
                        {currentStep === 2 && (
                            <div className="space-y-6 py-12 text-center">
                                <div className="relative">
                                    <div className="w-24 h-24 mx-auto">
                                        <div className="absolute inset-0 rounded-full bg-purple-200 dark:bg-purple-900 animate-ping opacity-75"></div>
                                        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                                            <Brain className="h-12 w-12 text-white animate-pulse" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                        Analyzing Your Data...
                                    </h4>
                                    <div className="space-y-2 max-w-md mx-auto">
                                        {[
                                            { text: "Finding patterns...", done: true },
                                            { text: "Calculating relationships...", done: true },
                                            { text: "Building models...", done: false },
                                            { text: "Generating insights...", done: false }
                                        ].map((task, index) => (
                                            <div key={index} className="flex items-center gap-3 text-left">
                                                {task.done ? (
                                                    <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                                                ) : (
                                                    <div className="w-5 h-5 border-2 border-slate-300 dark:border-slate-700 border-t-blue-600 rounded-full animate-spin flex-shrink-0" />
                                                )}
                                                <span className={task.done ? "text-green-600" : "text-muted-foreground"}>
                                                    {task.text}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <p className="text-sm text-muted-foreground italic">
                                    This usually takes just a few seconds...
                                </p>
                            </div>
                        )}

                        {/* Step 3: Success! */}
                        {currentStep === 3 && (
                            <div className="space-y-6 py-6">
                                <div className="text-center space-y-4">
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mx-auto shadow-2xl">
                                        <PartyPopper className="h-12 w-12 text-white" />
                                    </div>

                                    <h4 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                                        You Did It! 🎉
                                    </h4>

                                    <p className="text-xl text-muted-foreground">
                                        You've discovered your first data insight
                                    </p>
                                </div>

                                <Card className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border-2 border-green-200 dark:border-green-800">
                                    <CardContent className="p-6">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center flex-shrink-0">
                                                <TrendingUp className="h-6 w-6 text-green-600" />
                                            </div>
                                            <div className="text-left">
                                                <h5 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                                                    Strong Positive Correlation Detected
                                                </h5>
                                                <p className="text-sm text-slate-700 dark:text-slate-300">
                                                    Your revenue shows a <strong>clear upward trend</strong> over time
                                                    with a correlation of <Badge className="bg-green-600">R² = 0.92</Badge>.
                                                    This means your growth is consistent and predictable!
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="grid md:grid-cols-3 gap-4 mt-6">
                                    {[
                                        { label: "Insight Quality", value: "Excellent", color: "text-green-600" },
                                        { label: "Model Type", value: "Linear", color: "text-blue-600" },
                                        { label: "Data Points", value: "25", color: "text-purple-600" }
                                    ].map((stat, index) => (
                                        <div key={index} className="text-center p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                                            <p className="text-xs text-muted-foreground uppercase mb-1">
                                                {stat.label}
                                            </p>
                                            <p className={`text-xl font-bold ${stat.color}`}>
                                                {stat.value}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                                    <p className="text-sm text-blue-900 dark:text-blue-100 text-center">
                                        🏆 <strong>Achievement Unlocked:</strong> First Analysis Complete!
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex justify-between mt-8 pt-6 border-t">
                            <Button
                                variant="outline"
                                onClick={handleBack}
                                disabled={currentStep === 0 || currentStep === 2}
                                className="gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </Button>

                            <Button
                                onClick={handleNext}
                                disabled={currentStep === 1 && !sampleDataUploaded || currentStep === 2}
                                className={`gap-2 bg-gradient-to-r ${steps[currentStep].gradient} hover:opacity-90`}
                            >
                                {currentStep === steps.length - 1 ? (
                                    <>
                                        Go to Dashboard
                                        <Rocket className="h-4 w-4" />
                                    </>
                                ) : (
                                    <>
                                        Continue
                                        <ArrowRight className="h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </div>

                        {currentStep === 3 && (
                            <div className="mt-4 text-center">
                                <Button variant="link" className="text-sm text-muted-foreground">
                                    Skip to dashboard →
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Helper Text */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-muted-foreground">
                        Need help? Press <Badge variant="outline" className="mx-1">?</Badge> anytime for guidance
                    </p>
                </div>
            </div>
        </div>
    );
};

export default OnboardingWizard;
