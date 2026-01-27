import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { lazy, Suspense } from "react";
import { Loader } from "lucide-react";

// Lazy load route components for code splitting
const Login = lazy(() => import("./pages/Login"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ManualPlot = lazy(() => import("./pages/ManualPlot"));
const ManualPlotCurve = lazy(() => import("./pages/ManualPlotCurve"));
const ManualPlotRegression = lazy(() => import("./pages/ManualPlotRegression"));
const ManualPlotCategorical = lazy(() => import("./pages/ManualPlotCategorical"));
const CategoricalChat = lazy(() => import("./pages/CategoricalChat"));
const AIFeatures = lazy(() => import("./pages/AIFeatures"));
const Profile = lazy(() => import("./pages/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading fallback component
const LoadingFallback = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <Loader className="h-8 w-8 animate-spin text-primary" />
    </div>
);

const App = () => (
    <AuthProvider>
        <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
                <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Login />} />
                        <Route
                            path="/dashboard"
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
                            path="/ai"
                            element={
                                <ProtectedRoute>
                                    <AIFeatures />
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
                        <Route path="/analyzer" element={<Navigate to="/manual-plot" replace />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </Suspense>
            </BrowserRouter>
        </TooltipProvider>
    </AuthProvider>
);

export default App;
