import AppLayout from "@/components/AppLayout";
import PageTransition from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useStorytelling } from "@/context/StorytellingContext";
import { motion } from "framer-motion";
import {
    CheckCircle2,
    Download,
    Upload,
    ArrowRight,
    BookOpen,
    Brain,
    TrendingUp,
    ExternalLink,
    Lightbulb,
    Code2,
    BarChart3,
} from "lucide-react";

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i = 0) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.09, duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] },
    }),
};

/* ── Numbered Doc Card ── */
function DocCard({ step, icon: Icon, title, subtitle, items, accentColor = "#0F172A", index }) {
    return (
        <motion.div variants={fadeUp} custom={index} className="bg-white border border-[#E8E4DC] luxury-card-hover group">
            {/* Colored top bar */}
            <div className="h-0.5 w-full" style={{ backgroundColor: accentColor }} />
            <div className="p-7">
                {/* Step number + icon */}
                <div className="flex items-start justify-between mb-5">
                    <div
                        className="w-11 h-11 flex items-center justify-center border"
                        style={{ borderColor: `${accentColor}30`, backgroundColor: `${accentColor}08` }}
                    >
                        <Icon className="h-5 w-5" style={{ color: accentColor }} />
                    </div>
                    <span
                        className="font-bold opacity-10 group-hover:opacity-20 transition-opacity"
                        style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: "3rem",
                            lineHeight: 1,
                            color: accentColor,
                        }}
                    >
                        {step}
                    </span>
                </div>
                {/* Heading */}
                <h3
                    className="text-lg font-bold text-[#0D1117] mb-1"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                >
                    {title}
                </h3>
                <p
                    className="text-xs text-[#6B6B6B] mb-4"
                    style={{ fontFamily: "'Raleway', sans-serif", letterSpacing: "0.05em" }}
                >
                    {subtitle}
                </p>
                {/* Items */}
                <ul className="space-y-2.5">
                    {items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                            <div className="w-1 h-1 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: accentColor }} />
                            <span className="text-sm text-[#4A4A4A]" style={{ fontFamily: "'Raleway', sans-serif" }}>
                                {item}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </motion.div>
    );
}

/* ── Quick Link ── */
function QuickLink({ href, icon: Icon, label, isExternal = false }) {
    return (
        <Link
            to={href}
            className="flex items-center gap-3 bg-white border border-[#E8E4DC] px-5 py-3.5 group luxury-card-hover"
        >
            <Icon className="h-4 w-4 text-[#0F172A] group-hover:scale-105 transition-transform" />
            <span
                className="text-sm font-medium text-[#0D1117] flex-1"
                style={{ fontFamily: "'Raleway', sans-serif" }}
            >
                {label}
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-[#D4AF37] -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300" />
        </Link>
    );
}

const Documentation = () => {
    const { getNextSuggestedPage } = useStorytelling();
    const nextPage = getNextSuggestedPage();

    const docCards = [
        {
            step: "01",
            icon: Upload,
            title: "Getting Started",
            subtitle: "Three steps to your first insight",
            accentColor: "#0F172A",
            items: [
                "Upload a CSV or enter data manually in the Data Analyzer",
                "Choose a feature — AI Analysis, Regression, or Categorical",
                "Export charts or generated code when ready",
            ],
        },
        {
            step: "02",
            icon: BookOpen,
            title: "CSV Format",
            subtitle: "Keep your files clean and simple",
            accentColor: "#D4AF37",
            items: [
                "Headers required — first row defines column names",
                "Regression analysis: columns named X and Y",
                "Categorical data: label column + value column",
                "Files auto-detect encoding and separators",
            ],
        },
        {
            step: "03",
            icon: Download,
            title: "Export & Save",
            subtitle: "Share or continue working later",
            accentColor: "#0D1117",
            items: [
                "Export charts to PNG or PDF with one click",
                "Generate Python / R code for your models",
                "Cleaning pipelines exported as reusable scripts",
                "Sessions auto-save to your profile dashboard",
            ],
        },
    ];

    const quickLinks = [
        { href: "/dashboard", icon: BarChart3, label: "Go to Dashboard" },
        { href: "/manual-plot", icon: TrendingUp, label: "Open Data Analyzer" },
        { href: "/ai", icon: Brain, label: "Try AI Features" },
        { href: "/smart-analytics", icon: Code2, label: "Smart Analytics" },
    ];

    return (
        <AppLayout>
            <PageTransition>
                <div className="space-y-10" style={{ fontFamily: "'Raleway', sans-serif" }}>

                    {/* ── Doc Cards ── */}
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{ visible: { transition: { staggerChildren: 0.09 } } }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-5"
                    >
                        {docCards.map((card, index) => (
                            <DocCard key={index} {...card} index={index} />
                        ))}
                    </motion.div>

                    {/* ── Tip Banner ── */}
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeUp}
                        custom={3}
                        className="bg-[#0F172A] relative overflow-hidden"
                    >
                        <div
                            className="absolute inset-0 opacity-[0.04]"
                            style={{
                                backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
                                backgroundSize: "24px 24px",
                            }}
                        />
                        <div className="relative z-10 flex items-center gap-5 p-6">
                            <div className="w-10 h-10 border border-[#D4AF37]/40 flex items-center justify-center flex-shrink-0">
                                <Lightbulb className="h-5 w-5 text-[#D4AF37]" />
                            </div>
                            <div>
                                <p
                                    className="text-[#D4AF37]/80 mb-0.5"
                                    style={{ fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase" }}
                                >
                                    Pro Tip
                                </p>
                                <p className="text-white/80 text-sm">
                                    Use natural language like{" "}
                                    <em className="text-white font-medium">"show count by category"</em>{" "}
                                    in NLP Analysis for instant chart generation without any manual configuration.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* ── Quick Links ── */}
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <p
                                className="text-[#0F172A]"
                                style={{ fontSize: "0.6rem", letterSpacing: "0.25em", textTransform: "uppercase" }}
                            >
                                Quick Access
                            </p>
                            <div className="flex-1 h-px bg-[#E8E4DC]" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                            {quickLinks.map((link, index) => (
                                <motion.div key={index} variants={fadeUp} custom={index}>
                                    <QuickLink {...link} />
                                </motion.div>
                            ))}
                        </div>
                        {nextPage && (
                            <motion.div variants={fadeUp} custom={4} className="mt-3">
                                <Link
                                    to={nextPage.path}
                                    className="flex items-center gap-3 bg-[#D4AF37]/8 border border-[#D4AF37]/30 px-5 py-3.5 group luxury-card-hover"
                                >
                                    <ExternalLink className="h-4 w-4 text-[#D4AF37]" />
                                    <span className="text-sm font-medium text-[#0D1117]">
                                        Suggested Next:{" "}
                                        <em className="text-[#A8893A]" style={{ fontFamily: "'Playfair Display', serif" }}>
                                            {nextPage.title}
                                        </em>
                                    </span>
                                    <ArrowRight className="h-3.5 w-3.5 text-[#D4AF37] ml-auto -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300" />
                                </Link>
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            </PageTransition>
        </AppLayout>
    );
};

export default Documentation;
