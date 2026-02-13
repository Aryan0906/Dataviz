// Micro-interaction animations for storytelling UX
// These create delightful moments that enhance the narrative

export const microInteractions = {
    // Success bounce - for completing tasks
    successBounce: {
        animate: {
            scale: [1, 1.2, 0.9, 1.1, 1],
            rotate: [0, 5, -5, 0]
        },
        transition: {
            duration: 0.6,
            ease: "easeInOut"
        }
    },

    // Gentle float - for idle states
    gentleFloat: {
        animate: {
            y: [0, -10, 0]
        },
        transition: {
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
        }
    },

    // Pulse glow - for important elements
    pulseGlow: {
        animate: {
            boxShadow: [
                "0 0 0 0 rgba(59, 130, 246, 0)",
                "0 0 0 10px rgba(59, 130, 246, 0.3)",
                "0 0 0 0 rgba(59, 130, 246, 0)"
            ]
        },
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: "easeOut"
        }
    },

    // Slide in from side - for panel entrances
    slideInRight: {
        initial: { x: 100, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: 100, opacity: 0 },
        transition: { type: "spring", stiffness: 300, damping: 30 }
    },

    // Fade scale - for modals
    fadeScale: {
        initial: { scale: 0.9, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 0.9, opacity: 0 },
        transition: { duration: 0.2, ease: "easeOut" }
    },

    // Stagger children - for lists
    staggerChildren: {
        animate: {
            transition: {
                staggerChildren: 0.1
            }
        }
    },

    // Child variants for stagger
    childVariant: {
        initial: { y: 20, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        transition: { duration: 0.3 }
    }
};

export const narrativeCopy = {
    // Replace technical terms with story language
    loading: {
        technical: "Processing...",
        narrative: [
            "Searching for patterns...",
            "Discovering insights...",
            "Analyzing your story...",
            "Uncovering relationships...",
            "Building your narrative..."
        ]
    },

    errors: {
        technical: "Error processing data",
        narrative: {
            uploadError: "Hmm, this data needs a bit of attention. Let's try that again.",
            analysisError: "The plot thickens! We need a bit more information to continue.",
            networkError: "Lost connection to the story server. Check your internet?",
            validationError: "This data wants to tell a story, but needs proper formatting first."
        }
    },

    success: {
        technical: "Analysis complete",
        narrative: [
            "Eureka! Your insight is ready.",
            "Pattern discovered! Here's what we found.",
            "Your data spoke, and we listened.",
            "The story reveals itself...",
            "Mystery solved! Check out this pattern."
        ]
    },

    empty: {
        technical: "No data",
        narrative: {
            noAnalyses: "Your story begins here. Ready to write Chapter 1?",
            noResults: "Your data is playing hard to get. Try adding more points.",
            noDrafts: "No drafts yet. Start fresh with a new discovery!"
        }
    },

    encouragement: {
        firstTime: [
            "🌟 First time? Don't worry, we'll guide you every step.",
            "✨ Every expert was once a beginner. Your journey starts now.",
            "🚀 Ready to discover something amazing?"
        ],
        returning: [
            "Welcome back, data explorer! Ready for another discovery?",
            "Your insights are waiting. Let's find them together.",
            "Another chapter in your data story awaits!"
        ],
        progress: [
            "You're making great progress!",
            "Look at you go! Data detective at work.",
            "Each insight brings you closer to mastery.",
            "Your analytical skills are growing!"
        ]
    }
};

// Get random narrative text
export const getRandomNarrative = (category, subcategory = null) => {
    const text = subcategory
        ? narrativeCopy[category]?.[subcategory]
        : narrativeCopy[category];

    if (Array.isArray(text)) {
        return text[Math.floor(Math.random() * text.length)];
    }

    return text || "";
};

// Loading states with personality
export const LoadingStates = {
    analyzing: {
        messages: [
            { text: "Finding patterns...", icon: "🔍", duration: 1000 },
            { text: "Calculating relationships...", icon: "🧠", duration: 1000 },
            { text: "Building models...", icon: "🎯", duration: 1000 },
            { text: "Generating insights...", icon: "✨", duration: 1000 }
        ]
    },
    uploading: {
        messages: [
            { text: "Receiving your data...", icon: "📊", duration: 800 },
            { text: "Validating format...", icon: "✓", duration: 600 },
            { text: "Preparing analysis...", icon: "🎨", duration: 600 }
        ]
    },
    exporting: {
        messages: [
            { text: "Packaging your story...", icon: "📦", duration: 800 },
            { text: "Adding final touches...", icon: "✨", duration: 700 },
            { text: "Almost ready...", icon: "🎁", duration: 500 }
        ]
    }
};

// Celebration triggers
export const celebrationTriggers = {
    shouldCelebrate: (metric, value) => {
        const thresholds = {
            r_squared: 0.8,      // Strong correlation
            dataPoints: 50,       // Substantial dataset
            analyses: [1, 5, 10, 25, 50, 100], // Milestone counts
            accuracy: 0.9         // High accuracy
        };

        if (metric === 'analyses') {
            return thresholds.analyses.includes(value);
        }

        return value >= (thresholds[metric] || 0);
    },

    getCelebrationData: (metric, value) => {
        const celebrations = {
            r_squared: {
                type: "insight",
                data: {
                    message: "Exceptional correlation discovered!",
                    confidence: "Very High",
                    quality: "Excellent",
                    details: "Your data shows a remarkably strong relationship. This insight is highly reliable!"
                }
            },
            firstAnalysis: {
                type: "achievement",
                data: {
                    message: "You've completed your first analysis!",
                    achievement: "First Steps",
                    encouragement: "🎉 The beginning of your data journey. Many more discoveries await!"
                }
            },
            fiveAnalyses: {
                type: "achievement",
                data: {
                    message: "Data Explorer achievement unlocked!",
                    achievement: "Data Explorer",
                    encouragement: "🏆 You're building serious analytical skills!"
                }
            },
            tenAnalyses: {
                type: "achievement",
                data: {
                    message: "Master Analyst status achieved!",
                    achievement: "Master Analyst",
                    encouragement: "🌟 You're now in the top tier of data storytellers!"
                }
            }
        };

        return celebrations[metric] || celebrations.r_squared;
    }
};

// Progress indicators with narrative context
export const progressIndicators = {
    getProgressMessage: (current, total, context = "analyses") => {
        const percentage = (current / total) * 100;

        if (percentage < 25) return `Starting your ${context} journey...`;
        if (percentage < 50) return `Making progress on ${context}...`;
        if (percentage < 75) return `Over halfway through ${context}!`;
        if (percentage < 100) return `Almost there with ${context}...`;
        return `${context} complete! 🎉`;
    },

    getLevelData: (analysisCount) => {
        const level = Math.min(10, Math.floor(analysisCount / 3) + 1);
        const levels = {
            1: { title: "Novice Explorer", color: "slate" },
            2: { title: "Data Apprentice", color: "blue" },
            3: { title: "Insight Seeker", color: "indigo" },
            4: { title: "Pattern Detective", color: "purple" },
            5: { title: "Analytics Scholar", color: "violet" },
            6: { title: "Data Scientist", color: "fuchsia" },
            7: { title: "Insight Master", color: "pink" },
            8: { title: "Story Weaver", color: "rose" },
            9: { title: "Data Sage", color: "orange" },
            10: { title: "Analytics Legend", color: "amber" }
        };

        return levels[level] || levels[1];
    }
};

// Time-based greetings
export const getTimeBasedGreeting = (userName = "Explorer") => {
    const hour = new Date().getHours();

    if (hour < 6) return `Burning the midnight oil, ${userName}? Let's find insights! 🌙`;
    if (hour < 12) return `Good morning, ${userName}! Ready to discover? ☀️`;
    if (hour < 18) return `Good afternoon, ${userName}! What will you uncover today? 🌤️`;
    if (hour < 22) return `Good evening, ${userName}! Time for some data magic! 🌆`;
    return `Night owl alert, ${userName}! Let's explore data! 🦉`;
};

// Motivational insights
export const getMotivationalInsight = (userStats) => {
    const { analysisCount = 0, avgQuality = 0, streak = 0 } = userStats;

    if (streak > 7) return "🔥 7-day streak! You're on fire!";
    if (analysisCount === 0) return "Every journey begins with a single step. Ready?";
    if (analysisCount < 5) return "Building momentum! Each analysis makes you stronger.";
    if (avgQuality > 0.8) return "Your insights are consistently excellent!";
    if (analysisCount >= 10) return "You're becoming a data storytelling expert!";

    return "Your data has stories to tell. Let's discover them!";
};

export default {
    microInteractions,
    narrativeCopy,
    getRandomNarrative,
    LoadingStates,
    celebrationTriggers,
    progressIndicators,
    getTimeBasedGreeting,
    getMotivationalInsight
};
