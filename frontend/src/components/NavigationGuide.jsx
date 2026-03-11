import { useEffect, useState } from "react";
import { useStorytelling } from "@/context/StorytellingContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { X, Lightbulb, ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const NavigationGuide = () => {
    const { getContextualHint, userPreferences, updatePreference, getNextSuggestedPage } = useStorytelling();
    const [showHint, setShowHint] = useState(true);
    const [hint, setHint] = useState(null);
    const navigate = useNavigate();

    const nextPage = getNextSuggestedPage();

    useEffect(() => {
        const contextualHint = getContextualHint();
        if (contextualHint) {
            setHint(contextualHint);
            setShowHint(true);
        }
    }, [getContextualHint]);

    const handleDismiss = () => {
        setShowHint(false);
    };

    const handleDismissForever = () => {
        updatePreference('showHints', false);
        setShowHint(false);
    };

    if (!userPreferences.showHints || !hint || !showHint) {
        return null;
    }

    return (
        <AnimatePresence>
            {showHint && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    <Alert className="relative bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-blue-200 dark:border-blue-800 shadow-lg">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                                <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1 space-y-2">
                                <AlertDescription className="text-sm text-foreground">
                                    {hint}
                                </AlertDescription>
                                {nextPage && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => navigate(nextPage.path)}
                                        className="gap-2 bg-white dark:bg-slate-900"
                                    >
                                        <Sparkles className="h-3 w-3" />
                                        Try {nextPage.title}
                                        <ArrowRight className="h-3 w-3" />
                                    </Button>
                                )}
                            </div>
                            <div className="flex flex-col gap-1">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={handleDismiss}
                                    className="h-6 w-6"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleDismissForever}
                                    className="text-xs h-auto p-1"
                                >
                                    Don't show hints
                                </Button>
                            </div>
                        </div>
                    </Alert>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default NavigationGuide;
