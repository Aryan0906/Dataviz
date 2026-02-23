import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

const StorytellingContext = createContext({
    currentStep: 0,
    totalSteps: 0,
    journeyProgress: 0,
    achievements: [],
    visitedPages: [],
    userPreferences: {},
    markPageVisited: () => {},
    unlockAchievement: () => {},
    getNextSuggestedPage: () => null,
    getContextualHint: () => null,
    updatePreference: () => {},
    resetJourney: () => {},
});

// Define the ideal user journey flow
const JOURNEY_FLOW = [
    { id: 'landing', path: '/', title: 'Welcome', category: 'intro' },
    { id: 'login', path: '/login', title: 'Sign In', category: 'auth' },
    { id: 'onboarding', path: '/onboarding', title: 'Getting Started', category: 'intro' },
    { id: 'dashboard', path: '/dashboard', title: 'Dashboard', category: 'main' },
    { id: 'first-analysis', path: '/manual-plot', title: 'First Analysis', category: 'analysis' },
    { id: 'explore-ai', path: '/ai', title: 'AI Features', category: 'advanced' },
    { id: 'categorical', path: '/categorical', title: 'Categorical Data', category: 'analysis' },
    { id: 'smart-analytics', path: '/smart-analytics', title: 'Smart Analytics', category: 'advanced' },
    { id: 'profile', path: '/profile', title: 'Profile', category: 'settings' },
    { id: 'documentation', path: '/documentation', title: 'Documentation', category: 'help' },
];

// Define achievements
const ACHIEVEMENTS = [
    { id: 'first-login', title: 'Welcome Aboard!', description: 'Logged in for the first time', icon: '🎉', points: 10 },
    { id: 'completed-onboarding', title: 'Quick Learner', description: 'Completed the onboarding tutorial', icon: '🎓', points: 25 },
    { id: 'first-analysis', title: 'Data Explorer', description: 'Created your first analysis', icon: '📊', points: 30 },
    { id: 'first-save', title: 'Saver', description: 'Saved your first chart', icon: '💾', points: 20 },
    { id: 'used-ai', title: 'AI Pioneer', description: 'Used AI-powered features', icon: '🤖', points: 40 },
    { id: 'five-analyses', title: 'Analyst', description: 'Created 5 analyses', icon: '🔬', points: 50 },
    { id: 'explorer', title: 'Explorer', description: 'Visited all main pages', icon: '🗺️', points: 60 },
    { id: 'customizer', title: 'Customizer', description: 'Customized your profile', icon: '⚙️', points: 15 },
    { id: 'export-master', title: 'Export Master', description: 'Exported 3 charts', icon: '📤', points: 35 },
    { id: 'week-streak', title: 'Dedicated User', description: 'Used the app 7 days in a row', icon: '🔥', points: 100 },
];

// Contextual hints based on current page and user state
const getPageHints = (pathname, visitedPages, achievements) => {
    const hints = {
        '/dashboard': {
            firstVisit: "Welcome! Start by creating your first analysis using the Quick Actions below.",
            hasData: "Great! You have some data. Try exploring the AI features for automated insights.",
            general: "Your command center for all data analysis activities."
        },
        '/manual-plot': {
            firstVisit: "This is where the magic happens! Upload your data or use sample data to start.",
            noData: "Start by adding data points manually or upload a CSV file.",
            hasData: "Excellent! Now analyze your data to see patterns and trends.",
            general: "Create beautiful visualizations from your data."
        },
        '/ai': {
            firstVisit: "Unlock the power of AI! Let our algorithms find insights automatically.",
            general: "AI-powered analysis for deeper insights."
        },
        '/categorical': {
            firstVisit: "Categorical data analysis made easy. Upload or enter category-value pairs.",
            general: "Visualize your categorical data with stunning charts."
        },
        '/profile': {
            firstVisit: "This is your profile. Track your progress and achievements here.",
            general: "Manage your account and view your statistics."
        },
        '/documentation': {
            firstVisit: "Everything you need to know about using the platform effectively.",
            general: "Quick reference guide for all features."
        },
    };

    const pageHints = hints[pathname] || { general: "Explore and discover new insights!" };
    
    // Determine which hint to show
    const isFirstVisit = !visitedPages.includes(pathname);
    if (isFirstVisit && pageHints.firstVisit) return pageHints.firstVisit;
    
    // Context-specific hints based on achievements
    if (pageHints.noData && achievements.length === 0) return pageHints.noData;
    if (pageHints.hasData && achievements.some(a => a.id === 'first-analysis')) return pageHints.hasData;
    
    return pageHints.general;
};

export const StorytellingProvider = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Load state from localStorage
    const [visitedPages, setVisitedPages] = useState(() => {
        const saved = localStorage.getItem('storytelling_visited_pages');
        return saved ? JSON.parse(saved) : [];
    });
    
    const [achievements, setAchievements] = useState(() => {
        const saved = localStorage.getItem('storytelling_achievements');
        return saved ? JSON.parse(saved) : [];
    });
    
    const [userPreferences, setUserPreferences] = useState(() => {
        const saved = localStorage.getItem('storytelling_preferences');
        return saved ? JSON.parse(saved) : {
            showHints: true,
            showProgressBar: true,
            celebrateAchievements: true,
        };
    });

    const [firstVisit, setFirstVisit] = useState(true);

    // Calculate journey progress
    const journeyProgress = (visitedPages.length / JOURNEY_FLOW.length) * 100;
    
    // Find current step in journey
    const currentStepIndex = JOURNEY_FLOW.findIndex(step => 
        location.pathname.startsWith(step.path)
    );
    
    // Mark page as visited
    const markPageVisited = useCallback((path) => {
        setVisitedPages(prev => {
            if (prev.includes(path)) return prev;
            const updated = [...prev, path];
            localStorage.setItem('storytelling_visited_pages', JSON.stringify(updated));
            
            // Check for explorer achievement
            if (updated.length >= JOURNEY_FLOW.length - 2) {
                unlockAchievement('explorer');
            }
            
            return updated;
        });
    }, []);

    // Unlock achievement
    const unlockAchievement = useCallback((achievementId) => {
        setAchievements(prev => {
            if (prev.some(a => a.id === achievementId)) return prev;
            
            const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
            if (!achievement) return prev;
            
            const updated = [...prev, { ...achievement, unlockedAt: new Date().toISOString() }];
            localStorage.setItem('storytelling_achievements', JSON.stringify(updated));
            
            // Celebrate achievement
            if (userPreferences.celebrateAchievements) {
                toast.success(
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{achievement.icon}</span>
                        <div>
                            <div className="font-bold">Achievement Unlocked!</div>
                            <div className="text-sm">{achievement.title}</div>
                            <div className="text-xs text-muted-foreground">+{achievement.points} points</div>
                        </div>
                    </div>,
                    { duration: 4000 }
                );
                
                // Confetti for major achievements
                if (achievement.points >= 40) {
                    confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 }
                    });
                }
            }
            
            return updated;
        });
    }, [userPreferences.celebrateAchievements]);

    // Get next suggested page based on user journey
    const getNextSuggestedPage = useCallback(() => {
        const unvisitedPages = JOURNEY_FLOW.filter(step => !visitedPages.includes(step.path));
        
        if (unvisitedPages.length === 0) {
            // All pages visited, suggest most relevant
            return JOURNEY_FLOW.find(step => step.category === 'analysis');
        }
        
        // Suggest next in the flow
        const currentIndex = JOURNEY_FLOW.findIndex(step => location.pathname.startsWith(step.path));
        if (currentIndex !== -1 && currentIndex < JOURNEY_FLOW.length - 1) {
            const nextStep = JOURNEY_FLOW[currentIndex + 1];
            if (!visitedPages.includes(nextStep.path)) {
                return nextStep;
            }
        }
        
        // Return first unvisited
        return unvisitedPages[0];
    }, [visitedPages, location.pathname]);

    // Get contextual hint for current page
    const getContextualHint = useCallback(() => {
        if (!userPreferences.showHints) return null;
        return getPageHints(location.pathname, visitedPages, achievements);
    }, [location.pathname, visitedPages, achievements, userPreferences.showHints]);

    // Update user preference
    const updatePreference = useCallback((key, value) => {
        setUserPreferences(prev => {
            const updated = { ...prev, [key]: value };
            localStorage.setItem('storytelling_preferences', JSON.stringify(updated));
            return updated;
        });
    }, []);

    // Reset journey (for testing or user request)
    const resetJourney = useCallback(() => {
        localStorage.removeItem('storytelling_visited_pages');
        localStorage.removeItem('storytelling_achievements');
        setVisitedPages([]);
        setAchievements([]);
        toast.info('Journey progress reset');
    }, []);

    // Track page visits
    useEffect(() => {
        const currentPath = location.pathname;
        markPageVisited(currentPath);
        
        // First visit to dashboard after auth
        if (currentPath === '/dashboard' && firstVisit) {
            setFirstVisit(false);
            unlockAchievement('first-login');
        }
    }, [location.pathname, markPageVisited, unlockAchievement, firstVisit]);

    const value = {
        currentStep: currentStepIndex,
        totalSteps: JOURNEY_FLOW.length,
        journeyProgress,
        achievements,
        visitedPages,
        userPreferences,
        markPageVisited,
        unlockAchievement,
        getNextSuggestedPage,
        getContextualHint,
        updatePreference,
        resetJourney,
    };

    return (
        <StorytellingContext.Provider value={value}>
            {children}
        </StorytellingContext.Provider>
    );
};

export const useStorytelling = () => {
    const context = useContext(StorytellingContext);
    if (context === undefined) {
        throw new Error('useStorytelling must be used within a StorytellingProvider');
    }
    return context;
};
