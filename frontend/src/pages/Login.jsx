import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
    LogIn,
    UserPlus,
    Loader,
    Eye,
    EyeOff,
    BarChart3,
    ChevronRight,
    TrendingUp,
    Brain,
    Zap,
} from "lucide-react";

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (delay = 0) => ({
        opacity: 1,
        y: 0,
        transition: { delay, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
    }),
};

const Login = () => {
    const navigate = useNavigate();
    const { loading: authLoading } = useAuth();

    const [activeTab, setActiveTab] = useState("login");
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [signupName, setSignupName] = useState("");
    const [signupEmail, setSignupEmail] = useState("");
    const [signupPassword, setSignupPassword] = useState("");
    const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
    const [showSignupPassword, setShowSignupPassword] = useState(false);
    const [showSignupConfirm, setShowSignupConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!loginEmail || !loginPassword) { toast.error("Please fill in all fields"); return; }
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
            if (error) {
                if (error.message.includes("Invalid login credentials"))
                    toast.error("Invalid email or password. Don't have an account? Try the Sign Up tab.");
                else if (error.message.includes("Email not confirmed"))
                    toast.error("Please check your email and confirm your account before logging in.");
                else toast.error(error.message);
            } else {
                toast.success("Welcome back!");
                navigate("/dashboard");
            }
        } catch (err) {
            toast.error(err.message || "Login failed. Please try again.");
        } finally { setIsLoading(false); }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        if (!signupName || !signupEmail || !signupPassword || !signupConfirmPassword) { toast.error("Please fill in all fields"); return; }
        if (signupPassword !== signupConfirmPassword) { toast.error("Passwords do not match"); return; }
        if (signupPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
        setIsLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email: signupEmail,
                password: signupPassword,
                options: { data: { name: signupName } },
            });
            if (error) {
                toast.error(error.message.includes("already registered")
                    ? "This email is already registered. Try logging in instead."
                    : error.message);
            } else if (data?.user && !data.session) {
                toast.success("Account created! Please check your email to confirm.", { duration: 6000 });
            } else {
                toast.success("Account created successfully!");
                navigate("/dashboard");
            }
        } catch (err) {
            toast.error(err.message || "Signup failed.");
        } finally { setIsLoading(false); }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FAFAF7]">
                <Loader className="h-8 w-8 animate-spin text-[#0F172A]" />
            </div>
        );
    }

    const highlights = [
        { icon: Brain, text: "AI-Powered Analysis" },
        { icon: TrendingUp, text: "Advanced Regression" },
        { icon: Zap, text: "Real-time Dashboards" },
    ];

    return (
        <div className="min-h-screen flex" style={{ fontFamily: "'Raleway', sans-serif" }}>
            {/* ── LEFT PANEL: Brand / cinematic ── */}
            <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative flex-col justify-between bg-[#0F172A] overflow-hidden">
                {/* Background texture */}
                <div
                    className="absolute inset-0 opacity-5"
                    style={{
                        backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
                        backgroundSize: "32px 32px",
                    }}
                />

                {/* Large background number (decorative) */}
                <div
                    className="absolute -right-8 top-1/2 -translate-y-1/2 text-[20rem] font-bold text-white/[0.03] leading-none select-none"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                >
                    DV
                </div>

                {/* Top: Logo */}
                <div className="relative z-10 p-10">
                    <Link to="/" className="flex items-center gap-2.5 group">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/30 bg-white/10">
                            <BarChart3 className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-semibold text-xl text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                            DataViz
                        </span>
                    </Link>
                </div>

                {/* Center: Brand statement */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="relative z-10 px-10 xl:px-16"
                >
                    <div className="w-12 h-px bg-[#D4AF37] mb-8" />
                    <h1
                        className="text-5xl xl:text-6xl font-bold text-white leading-[1.1] mb-6"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                        Data becomes{" "}
                        <em className="text-[#E8C86A]" style={{ fontStyle: "italic" }}>
                            clarity
                        </em>
                    </h1>
                    <p className="text-white/60 text-base font-light mb-10 max-w-sm leading-relaxed">
                        Transform raw numbers into strategic intelligence with our enterprise analytics platform.
                    </p>

                    {/* Feature highlights */}
                    <div className="space-y-4">
                        {highlights.map(({ icon: Icon, text }, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }}
                                className="flex items-center gap-3"
                            >
                                <div className="w-8 h-8 border border-white/20 flex items-center justify-center">
                                    <Icon className="w-4 h-4 text-[#D4AF37]" />
                                </div>
                                <span className="text-sm text-white/70 font-body">{text}</span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Bottom: Decorative quote */}
                <div className="relative z-10 p-10 xl:px-16">
                    <p className="luxury-label text-white/30">© 2026 DataViz Analytics Platform</p>
                </div>

                {/* Gold accent border right */}
                <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#D4AF37]/40 to-transparent" />
            </div>

            {/* ── RIGHT PANEL: Form ── */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-10 py-16 bg-[#FAFAF7]">
                {/* Mobile logo */}
                <div className="lg:hidden mb-8">
                    <Link to="/" className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[#0F172A]">
                            <BarChart3 className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold text-xl text-[#0D1117]" style={{ fontFamily: "'Playfair Display', serif" }}>
                            DataViz
                        </span>
                    </Link>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    className="w-full max-w-md"
                >
                    {/* Tab switcher */}
                    <div className="flex mb-8 border-b border-[#E8E4DC]">
                        {[
                            { id: "login", label: "Sign In", icon: LogIn },
                            { id: "signup", label: "Create Account", icon: UserPlus },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 pb-3 pr-6 transition-all duration-300 luxury-label ${
                                    activeTab === tab.id
                                        ? "border-b-2 border-[#0F172A] text-[#0F172A] -mb-px"
                                        : "text-[#6B6B6B] hover:text-[#0D1117]"
                                }`}
                            >
                                <tab.icon className="w-3.5 h-3.5" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Heading */}
                    <div className="mb-8">
                        <h2
                            className="text-3xl font-bold text-[#0D1117] mb-2"
                            style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                            {activeTab === "login" ? "Welcome back" : "Create your account"}
                        </h2>
                        <p className="text-sm text-[#6B6B6B] font-body">
                            {activeTab === "login"
                                ? "Sign in to continue to your dashboard"
                                : "Start your 14-day free trial, no card required"}
                        </p>
                    </div>

                    {/* Login Form */}
                    {activeTab === "login" && (
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="space-y-1.5">
                                <Label htmlFor="login-email" className="luxury-label text-[#4A4A4A]">Email Address</Label>
                                <Input
                                    id="login-email"
                                    type="email"
                                    placeholder="your@email.com"
                                    value={loginEmail}
                                    onChange={(e) => setLoginEmail(e.target.value)}
                                    disabled={isLoading}
                                    className="h-11 bg-white border-[#E8E4DC] focus:border-[#0F172A] focus:ring-[#0F172A]/20 rounded-none text-[#0D1117]"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="login-password" className="luxury-label text-[#4A4A4A]">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="login-password"
                                        type={showLoginPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={loginPassword}
                                        onChange={(e) => setLoginPassword(e.target.value)}
                                        disabled={isLoading}
                                        className="h-11 bg-white border-[#E8E4DC] focus:border-[#0F172A] focus:ring-[#0F172A]/20 rounded-none pr-10 text-[#0D1117]"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B6B] hover:text-[#0D1117] transition-colors"
                                    >
                                        {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-11 bg-[#0F172A] text-white luxury-label font-semibold hover:bg-[#0B1120] transition-colors duration-300 flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                                {isLoading ? (
                                    <Loader className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>Sign In <ChevronRight className="w-4 h-4" /></>
                                )}
                            </button>
                        </form>
                    )}

                    {/* Signup Form */}
                    {activeTab === "signup" && (
                        <form onSubmit={handleSignup} className="space-y-5">
                            <div className="space-y-1.5">
                                <Label htmlFor="signup-name" className="luxury-label text-[#4A4A4A]">Full Name</Label>
                                <Input
                                    id="signup-name"
                                    type="text"
                                    placeholder="Your name"
                                    value={signupName}
                                    onChange={(e) => setSignupName(e.target.value)}
                                    disabled={isLoading}
                                    className="h-11 bg-white border-[#E8E4DC] focus:border-[#0F172A] focus:ring-[#0F172A]/20 rounded-none"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="signup-email" className="luxury-label text-[#4A4A4A]">Email Address</Label>
                                <Input
                                    id="signup-email"
                                    type="email"
                                    placeholder="your@email.com"
                                    value={signupEmail}
                                    onChange={(e) => setSignupEmail(e.target.value)}
                                    disabled={isLoading}
                                    className="h-11 bg-white border-[#E8E4DC] focus:border-[#0F172A] focus:ring-[#0F172A]/20 rounded-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="signup-password" className="luxury-label text-[#4A4A4A]">Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="signup-password"
                                            type={showSignupPassword ? "text" : "password"}
                                            placeholder="••••••"
                                            value={signupPassword}
                                            onChange={(e) => setSignupPassword(e.target.value)}
                                            disabled={isLoading}
                                            className="h-11 bg-white border-[#E8E4DC] focus:border-[#0F172A] focus:ring-[#0F172A]/20 rounded-none pr-9"
                                        />
                                        <button type="button" onClick={() => setShowSignupPassword(!showSignupPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B6B]">
                                            {showSignupPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="signup-confirm" className="luxury-label text-[#4A4A4A]">Confirm</Label>
                                    <div className="relative">
                                        <Input
                                            id="signup-confirm"
                                            type={showSignupConfirm ? "text" : "password"}
                                            placeholder="••••••"
                                            value={signupConfirmPassword}
                                            onChange={(e) => setSignupConfirmPassword(e.target.value)}
                                            disabled={isLoading}
                                            className="h-11 bg-white border-[#E8E4DC] focus:border-[#0F172A] focus:ring-[#0F172A]/20 rounded-none pr-9"
                                        />
                                        <button type="button" onClick={() => setShowSignupConfirm(!showSignupConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B6B]">
                                            {showSignupConfirm ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-11 bg-[#0F172A] text-white luxury-label font-semibold hover:bg-[#0B1120] transition-colors duration-300 flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                                {isLoading ? (
                                    <Loader className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>Create Account <ChevronRight className="w-4 h-4" /></>
                                )}
                            </button>
                        </form>
                    )}

                    {/* Footer note */}
                    <p className="mt-8 text-center text-xs text-[#6B6B6B] font-body">
                        By continuing, you agree to our{" "}
                        <a href="#" className="text-[#0F172A] hover:underline">Terms</a>{" "}
                        and{" "}
                        <a href="#" className="text-[#0F172A] hover:underline">Privacy Policy</a>.
                    </p>

                    <div className="mt-6 text-center">
                        <Link to="/" className="luxury-link text-xs text-[#6B6B6B] hover:text-[#0F172A]">
                            ← Back to home
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
