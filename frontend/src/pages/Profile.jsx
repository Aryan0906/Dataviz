import AppLayout from "@/components/AppLayout";
import PageTransition from "@/components/PageTransition";
import ProgressTracker from "@/components/ProgressTracker";
import { useAuth } from "@/context/AuthContext";
import { useStorytelling } from "@/context/StorytellingContext";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { dataAPI } from "@/lib/api";
import { User, Mail, Calendar, Database, Activity, Trophy, CheckCircle2 } from "lucide-react";
import { getUserSessions } from "@/lib/sessionManager";

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i = 0) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.1, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
    }),
};

/* ── Luxury Info Field ── */
function LuxuryField({ id, label, icon: Icon, value, type = "text" }) {
    return (
        <div className="space-y-2">
            <label
                htmlFor={id}
                className="flex items-center gap-2 text-[#6B6B6B]"
                style={{ fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "'Raleway', sans-serif" }}
            >
                <Icon className="h-3 w-3 text-[#0F172A]" />
                {label}
            </label>
            <input
                id={id}
                type={type}
                value={value}
                disabled
                className="w-full h-10 px-3 bg-[#FAFAF7] border border-[#E8E4DC] text-[#0D1117] text-sm rounded-none focus:outline-none disabled:opacity-70"
                style={{ fontFamily: "'Raleway', sans-serif" }}
            />
        </div>
    );
}

/* ── Luxury Stat Item ── */
function StatItem({ label, value, loading, badgeText, icon: Icon, highlight = false }) {
    return (
        <div className={`flex items-center justify-between p-5 border transition-all duration-300 ${
            highlight
                ? "border-[#D4AF37]/30 bg-[#D4AF37]/5"
                : "border-[#E8E4DC] bg-white hover:border-[#0F172A]/20"
        }`}>
            <div>
                <p
                    className="text-[#6B6B6B] mb-1"
                    style={{ fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "'Raleway', sans-serif" }}
                >
                    {label}
                </p>
                <p
                    className={`text-3xl font-bold ${highlight ? "text-[#D4AF37]" : "text-[#0D1117]"}`}
                    style={{ fontFamily: "'Playfair Display', serif" }}
                >
                    {loading ? "—" : value}
                </p>
            </div>
            {badgeText && (
                <div className={`flex items-center justify-center w-10 h-10 ${highlight ? "bg-[#D4AF37]/15" : "bg-[#0F172A]/5"}`}>
                    {Icon && <Icon className={`h-5 w-5 ${highlight ? "text-[#D4AF37]" : "text-[#0F172A]"}`} />}
                </div>
            )}
        </div>
    );
}

const Profile = () => {
    const { user } = useAuth();
    const { unlockAchievement, achievements, journeyProgress } = useStorytelling();
    const [analysisCount, setAnalysisCount] = useState(0);
    const [draft, setDraft] = useState(null);
    const [loading, setLoading] = useState(true);
    const [savedChartsCount, setSavedChartsCount] = useState(0);

    const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || "User";
    const userEmail = user?.email || "";
    const createdAt = user?.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A";

    useEffect(() => {
        const fetchUserStats = async () => {
            try {
                const analyses = await dataAPI.getAnalyses();
                setAnalysisCount(analyses.length);
                const { draft: draftData } = await dataAPI.getDraft();
                setDraft(draftData);
                const sessions = await getUserSessions();
                setSavedChartsCount(sessions.length);
            } catch {
                // ignore
            } finally {
                setLoading(false);
            }
        };
        fetchUserStats();
    }, []);

    return (
        <AppLayout>
            <PageTransition>
                <div className="space-y-8" style={{ fontFamily: "'Raleway', sans-serif" }}>

                    {/* ── Two-column Layout ── */}
                    <div className="grid gap-6 lg:grid-cols-3">

                        {/* ── User Information ── */}
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={fadeUp}
                            custom={0}
                            className="lg:col-span-2"
                        >
                            <div className="bg-white border border-[#E8E4DC]">
                                <div className="h-0.5 w-full bg-[#0F172A]" />
                                <div className="p-7">
                                    <div className="flex items-center gap-3 mb-6">
                                        {/* Avatar */}
                                        <div className="w-14 h-14 bg-[#0F172A] flex items-center justify-center flex-shrink-0">
                                            <span
                                                className="text-2xl font-bold text-white"
                                                style={{ fontFamily: "'Playfair Display', serif" }}
                                            >
                                                {userName.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <h3
                                                className="text-xl font-bold text-[#0D1117]"
                                                style={{ fontFamily: "'Playfair Display', serif" }}
                                            >
                                                {userName}
                                            </h3>
                                            <p
                                                className="text-[#6B6B6B]"
                                                style={{ fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase" }}
                                            >
                                                DataViz Member
                                            </p>
                                        </div>
                                        <div className="ml-auto flex items-center gap-1.5 border border-[#0F172A]/30 bg-[#0F172A]/5 px-3 py-1.5">
                                            <CheckCircle2 className="h-3.5 w-3.5 text-[#0F172A]" />
                                            <span
                                                className="text-[#0F172A]"
                                                style={{ fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase" }}
                                            >
                                                Verified
                                            </span>
                                        </div>
                                    </div>

                                    {/* Gold divider */}
                                    <div className="w-8 h-px bg-[#D4AF37] mb-6" />

                                    <div className="space-y-5">
                                        <LuxuryField id="name" label="Display Name" icon={User} value={userName} />
                                        <LuxuryField id="email" label="Email Address" icon={Mail} value={userEmail} type="email" />
                                        <LuxuryField id="created" label="Member Since" icon={Calendar} value={createdAt} />
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* ── Statistics ── */}
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={fadeUp}
                            custom={1}
                        >
                            <div className="bg-white border border-[#E8E4DC] h-full">
                                <div className="h-0.5 w-full bg-[#D4AF37]" />
                                <div className="p-7">
                                    <p
                                        className="text-[#0F172A] mb-4"
                                        style={{ fontSize: "0.6rem", letterSpacing: "0.25em", textTransform: "uppercase" }}
                                    >
                                        Activity
                                    </p>
                                    <h3
                                        className="text-xl font-bold text-[#0D1117] mb-5"
                                        style={{ fontFamily: "'Playfair Display', serif" }}
                                    >
                                        Your Statistics
                                    </h3>
                                    <div className="space-y-3">
                                        <StatItem label="Total Analyses" value={analysisCount} loading={loading} icon={Database} badgeText={analysisCount} />
                                        <StatItem label="Saved Charts" value={savedChartsCount} loading={loading} icon={Activity} badgeText={savedChartsCount} />
                                        <StatItem
                                            label="Draft Analysis"
                                            value={loading ? "—" : draft ? "In Progress" : "None"}
                                            loading={loading}
                                            highlight={!!draft}
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* ── Progress & Achievements ── */}
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeUp}
                        custom={2}
                        className="grid gap-6 lg:grid-cols-2"
                    >
                        {/* Progress Tracker */}
                        <div className="bg-white border border-[#E8E4DC]">
                            <div className="h-0.5 bg-[#0F172A]" />
                            <div className="p-7">
                                <p
                                    className="text-[#0F172A] mb-2"
                                    style={{ fontSize: "0.6rem", letterSpacing: "0.25em", textTransform: "uppercase" }}
                                >
                                    Your Journey
                                </p>
                                <ProgressTracker />
                            </div>
                        </div>

                        {/* Mastery Score */}
                        <div className="bg-[#0F172A] relative overflow-hidden">
                            {/* Dot pattern */}
                            <div
                                className="absolute inset-0 opacity-[0.04]"
                                style={{
                                    backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
                                    backgroundSize: "24px 24px",
                                }}
                            />
                            <div className="relative z-10 p-7 h-full flex flex-col">
                                <p
                                    className="text-white/40 mb-2"
                                    style={{ fontSize: "0.6rem", letterSpacing: "0.25em", textTransform: "uppercase" }}
                                >
                                    Platform Mastery
                                </p>
                                <div className="flex-1 flex flex-col items-center justify-center py-4">
                                    <div
                                        className="text-7xl font-bold mb-2"
                                        style={{
                                            fontFamily: "'Playfair Display', serif",
                                            background: "linear-gradient(135deg, #D4AF37, #E8C86A, #D4AF37)",
                                            WebkitBackgroundClip: "text",
                                            WebkitTextFillColor: "transparent",
                                            backgroundClip: "text",
                                        }}
                                    >
                                        {Math.round(journeyProgress)}%
                                    </div>
                                    <Trophy className="h-6 w-6 text-[#D4AF37]/60 mb-3" />
                                    <div className="w-full bg-white/10 h-1 mb-4">
                                        <div
                                            className="h-full bg-[#D4AF37] transition-all duration-1000"
                                            style={{ width: `${Math.round(journeyProgress)}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between border-t border-white/10 pt-4">
                                    <p
                                        className="text-white/40"
                                        style={{ fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase" }}
                                    >
                                        Achievements
                                    </p>
                                    <span
                                        className="border border-[#D4AF37]/40 text-[#D4AF37] px-2.5 py-0.5 text-xs"
                                        style={{ letterSpacing: "0.1em" }}
                                    >
                                        {achievements.length} Unlocked
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* ── Info Notice ── */}
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeUp}
                        custom={3}
                    >
                        <div className="bg-white border border-[#0F172A]/20 p-6">
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 bg-[#0F172A]/10 flex items-center justify-center flex-shrink-0">
                                    <Database className="h-4 w-4 text-[#0F172A]" />
                                </div>
                                <div>
                                    <p
                                        className="font-semibold text-[#0D1117] mb-1"
                                        style={{ fontFamily: "'Playfair Display', serif" }}
                                    >
                                        All your data is automatically saved
                                    </p>
                                    <p className="text-sm text-[#6B6B6B]">
                                        Every analysis you create is stored securely and will appear in your dashboard.
                                        Your profile information is automatically synced from your account.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </PageTransition>
        </AppLayout>
    );
};

export default Profile;
