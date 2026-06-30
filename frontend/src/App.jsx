import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { StorytellingProvider } from "@/context/StorytellingContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { lazy, Suspense } from "react";
import { Loader } from "lucide-react";

// Lazy load route components for code splitting
const Login = lazy(() => import("./pages/Login"));
const ProfessionalLanding = lazy(() => import("./pages/ProfessionalLanding"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ModernDashboard = lazy(() => import("./pages/ModernDashboard"));
const JourneyDashboard = lazy(() => import("./pages/JourneyDashboard"));
const ManualPlot = lazy(() => import("./pages/ManualPlot"));
const ModernManualPlot = lazy(() => import("./pages/ModernManualPlot"));
const ManualPlotCurve = lazy(() => import("./pages/ManualPlotCurve"));
const ManualPlotRegression = lazy(() => import("./pages/ManualPlotRegression"));
const ManualPlotCategorical = lazy(() => import("./pages/ManualPlotCategorical"));
const CategoricalChat = lazy(() => import("./pages/CategoricalChat"));
const CategoricalChatNLP = lazy(() => import("./pages/CategoricalChatNLP"));
const AIFeatures = lazy(() => import("./pages/AIFeatures"));
const SmartAnalytics = lazy(() => import("./pages/SmartAnalytics"));
const Profile = lazy(() => import("./pages/Profile"));
const Documentation = lazy(() => import("./pages/Documentation"));
const SharedAnalysis = lazy(() => import("./pages/SharedAnalysis"));
const EmbedAnalysis = lazy(() => import("./pages/EmbedAnalysis"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Storytelling components (not lazy loaded for better UX)
import OnboardingWizard from "./components/OnboardingWizard";

// Loading fallback component
const LoadingFallback = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <Loader className="h-8 w-8 animate-spin text-primary" />
    </div>
);

const App = () => (
    <AuthProvider>
        <BrowserRouter>
            <ThemeProvider>
                <StorytellingProvider>
                    <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <Suspense fallback={<LoadingFallback />}>
                        <Routes>
                            {/* Landing Pages */}
                            <Route path="/" element={<ProfessionalLanding />} />

                            {/* Authentication */}
                            <Route path="/login" element={<Login />} />
                            <Route path="/signup" element={<Login />} />

                            {/* Onboarding for new users */}
                            <Route path="/onboarding" element={<OnboardingWizard />} />

                            {/* Public Share Links */}
                            <Route path="/share/:token" element={<SharedAnalysis />} />
                            <Route path="/embed/:token" element={<EmbedAnalysis />} />

                            {/* Dashboard Options */}
                            <Route
                                path="/dashboard"
                                element={
                                    <ProtectedRoute>
                                        <ModernDashboard />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/journey"
                                element={
                                    <ProtectedRoute>
                                        <JourneyDashboard />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/dashboard-classic"
                                element={
                                    <ProtectedRoute>
                                        <Dashboard />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/manual-plot"
                                element={
                                    <ProtectedRoute>
                                        <ModernManualPlot />
                                    </ProtectedRoute>
                                }
                            >
                                <Route index element={<Navigate to="regression" replace />} />
                                <Route path="curve" element={<ManualPlotCurve />} />
                                <Route path="regression" element={<ManualPlotRegression />} />
                                <Route path="categorical" element={<ManualPlotCategorical />} />
                            </Route>
                            <Route
                                path="/manual-plot-classic"
                                element={
                                    <ProtectedRoute>
                                        <ManualPlot />
                                    </ProtectedRoute>
                                }
                            >
                                <Route index element={<Navigate to="curve" replace />} />
                                <Route path="curve" element={<ManualPlotCurve />} />
                                <Route path="regression" element={<ManualPlotRegression />} />
                                <Route path="categorical" element={<ManualPlotCategorical />} />
                            </Route>
                            <Route
                                path="/categorical"
                                element={
                                    <ProtectedRoute>
                                        <CategoricalChat />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/categorical-nlp"
                                element={
                                    <ProtectedRoute>
                                        <CategoricalChatNLP />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/ai"
                                element={
                                    <ProtectedRoute>
                                        <AIFeatures />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/smart-analytics"
                                element={
                                    <ProtectedRoute>
                                        <SmartAnalytics />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/profile"
                                element={
                                    <ProtectedRoute>
                                        <Profile />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/documentation"
                                element={
                                    <ProtectedRoute>
                                        <Documentation />
                                    </ProtectedRoute>
                                }
                            />
                            <Route path="/analyzer" element={<Navigate to="/manual-plot" replace />} />
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </Suspense>
                </TooltipProvider>
            </StorytellingProvider>
        </BrowserRouter>
    </AuthProvider>
);

export default App;
