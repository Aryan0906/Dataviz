import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import LandingNav from "@/components/LandingNav";
import LandingFooter from "@/components/LandingFooter";
import {
    Brain,
    Database,
    Zap,
    ShieldCheck,
    LineChart,
    TrendingUp,
    Cloud,
    MessageSquare,
    Upload,
    Target,
    ChevronDown,
    ArrowRight,
    CheckCircle2,
    BarChart3,
    Sparkles,
    Play,
} from "lucide-react";

/* ─── Animation Variants ─── */
const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
    },
};

const stagger = {
    visible: { transition: { staggerChildren: 0.12 } },
};

const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.7 } },
};

/* ─── Reusable Components ─── */
function RevealSection({ children, className = "", delay = 0 }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-80px" });
    return (
        <motion.div
            ref={ref}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            variants={fadeUp}
            transition={{ delay }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

function LuxuryLabel({ children, light = false }) {
    return (
        <p className={`luxury-label mb-3 ${light ? "text-white/50" : "text-[#0F172A]"}`}>
            {children}
        </p>
    );
}

function LuxuryLink({ href, children, light = false }) {
    return (
        <Link
            to={href}
            className={`luxury-link text-sm font-medium ${light ? "text-white/90 hover:text-white" : "text-[#0F172A] hover:text-[#0B1120]"}`}
        >
            {children}
            <span className="ml-1 text-base leading-none">›</span>
        </Link>
    );
}

/* ─── Animated Counter ─── */
function AnimatedNumber({ target, suffix = "", decimals = 0 }) {
    const [value, setValue] = useState(0);
    const ref = useRef(null);
    const inView = useInView(ref, { once: true });

    useEffect(() => {
        if (!inView) return;
        const duration = 2000;
        const steps = 60;
        const interval = duration / steps;
        let current = 0;
        const timer = setInterval(() => {
            current += target / steps;
            if (current >= target) {
                setValue(target);
                clearInterval(timer);
            } else {
                setValue(current);
            }
        }, interval);
        return () => clearInterval(timer);
    }, [inView, target]);

    return (
        <span ref={ref}>
            {decimals > 0 ? value.toFixed(decimals) : Math.floor(value).toLocaleString()}
            {suffix}
        </span>
    );
}

/* ─── Feature Card (Carousel item) ─── */
function FeatureCard({ icon: Icon, title, description, color, index }) {
    return (
        <motion.div
            variants={fadeUp}
            className="flex-none w-72 lg:w-80 bg-white border border-[#E8E4DC] group cursor-default"
            style={{ scrollSnapAlign: "start" }}
        >
            <div className={`h-2 w-full ${color}`} />
            <div className="p-8">
                <div className={`inline-flex p-3 mb-5 ${color} bg-opacity-10`}>
                    <Icon className="w-6 h-6 text-[#0F172A]" />
                </div>
                <h3
                    className="text-xl mb-3 font-semibold text-[#0D1117] group-hover:text-[#0F172A] transition-colors duration-300"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                >
                    {title}
                </h3>
                <p className="text-sm text-[#6B6B6B] leading-relaxed font-body">
                    {description}
                </p>
            </div>
        </motion.div>
    );
}

/* ─── Alternating Content Section ─── */
function ContentSection({ label, title, description, bullets, ctaText, ctaHref, image, imageAlt, reverse = false, dark = false }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-60px" });

    return (
        <div ref={ref} className={`py-24 lg:py-36 ${dark ? "bg-[#0D1117]" : "bg-[#FAFAF7]"}`}>
            <div className="max-w-7xl mx-auto px-6 lg:px-12">
                <div className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center ${reverse ? "lg:grid-flow-col-dense" : ""}`}>
                    {/* Text */}
                    <motion.div
                        initial={{ opacity: 0, x: reverse ? 40 : -40 }}
                        animate={inView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className={`space-y-6 ${reverse ? "lg:col-start-2" : ""}`}
                    >
                        <LuxuryLabel light={dark}>{label}</LuxuryLabel>
                        <h2
                            className={`text-display-md ${dark ? "text-white" : "text-[#0D1117]"}`}
                            style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                            {title}
                        </h2>
                        <p className={`text-base leading-relaxed font-body ${dark ? "text-white/60" : "text-[#6B6B6B]"}`}>
                            {description}
                        </p>
                        {bullets && (
                            <ul className="space-y-3">
                                {bullets.map((b, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-[#0F172A] flex-shrink-0 mt-0.5" />
                                        <span className={`text-sm font-body ${dark ? "text-white/70" : "text-[#4A4A4A]"}`}>{b}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <LuxuryLink href={ctaHref} light={dark}>{ctaText}</LuxuryLink>
                    </motion.div>

                    {/* Image */}
                    <motion.div
                        initial={{ opacity: 0, x: reverse ? -40 : 40 }}
                        animate={inView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.1 }}
                        className={`relative ${reverse ? "lg:col-start-1" : ""}`}
                    >
                        <div className="relative overflow-hidden aspect-[4/3] shadow-luxury">
                            <img
                                src={image}
                                alt={imageAlt}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className={`absolute inset-0 ${dark ? "bg-gradient-to-tr from-[#0D1117]/40 to-transparent" : "bg-gradient-to-tr from-white/10 to-transparent"}`} />
                        </div>
                        {/* Gold accent line */}
                        <div className="absolute -bottom-3 -left-3 w-24 h-1 bg-[#D4AF37]" />
                        <div className="absolute -bottom-3 -left-3 w-1 h-24 bg-[#D4AF37]" />
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

/* ─── Main Page ─── */
const ProfessionalLanding = () => {
    const heroRef = useRef(null);
    const { scrollYProgress: heroProgress } = useScroll({
        target: heroRef,
        offset: ["start start", "end start"],
    });
    const heroY = useTransform(heroProgress, [0, 1], ["0%", "20%"]);
    const heroOpacity = useTransform(heroProgress, [0, 0.7], [1, 0]);

    const features = [
        { icon: Brain, title: "AI-Powered Analysis", description: "Leverage advanced machine learning to automatically detect patterns and anomalies in your data.", color: "bg-slate-100" },
        { icon: LineChart, title: "Real-time Dashboards", description: "Create interactive, live-updating dashboards that keep your team informed instantly.", color: "bg-slate-100" },
        { icon: ShieldCheck, title: "Secure Processing", description: "Enterprise-grade security with SOC 2 compliance and end-to-end encryption.", color: "bg-slate-100" },
        { icon: TrendingUp, title: "Advanced Regression", description: "Sophisticated statistical models with automatic selection and validation.", color: "bg-slate-100" },
        { icon: MessageSquare, title: "NLP Analytics", description: "Extract insights from unstructured text data using natural language processing.", color: "bg-slate-100" },
        { icon: Cloud, title: "Cloud Sync", description: "Access your analyses anywhere with automatic cloud synchronization and backup.", color: "bg-slate-100" },
    ];

    const processSteps = [
        { number: "01", icon: Upload, title: "Upload Your Data", description: "Import data from CSV, Excel, databases, or APIs with intelligent type detection." },
        { number: "02", icon: Brain, title: "AI Analysis", description: "Our AI engine automatically analyzes patterns, correlations, and outliers in seconds." },
        { number: "03", icon: Target, title: "Actionable Insights", description: "Get clear recommendations and visualizations to drive data-informed decisions." },
    ];

    const testimonials = [
        {
            quote: "DataViz Pro transformed how we approach analytics. The AI insights saved our team hundreds of hours.",
            author: "Sarah Chen",
            role: "VP of Data Science",
            company: "TechCorp Global",
            avatar: "https://i.pravatar.cc/80?u=sarah-chen-dv",
        },
        {
            quote: "The most intuitive data platform we've used. Our entire team was productive within a day.",
            author: "Michael Rodriguez",
            role: "Analytics Director",
            company: "Growth Ventures",
            avatar: "https://i.pravatar.cc/80?u=michael-rod-dv",
        },
        {
            quote: "Best-in-class regression tools and visualization capabilities. A must-have for any data team.",
            author: "Dr. Emily Watson",
            role: "Chief Data Officer",
            company: "Research Labs Inc",
            avatar: "https://i.pravatar.cc/80?u=emily-watson-dv",
        },
    ];

    const carouselRef = useRef(null);

    return (
        <div className="min-h-screen bg-[#FAFAF7]" style={{ fontFamily: "'Raleway', sans-serif" }}>
            <LandingNav variant="dark" />

            {/* ══════════════════════════════════════
                HERO — Full-screen cinematic
            ══════════════════════════════════════ */}
            <section
                ref={heroRef}
                className="relative h-screen min-h-[600px] overflow-hidden flex flex-col items-center justify-center"
            >
                {/* Parallax background */}
                <motion.div
                    className="absolute inset-0"
                    style={{ y: heroY }}
                >
                    <img
                        src="https://images.pexels.com/photos/577210/pexels-photo-577210.jpeg?auto=compress&cs=tinysrgb&w=1920"
                        alt="Data visualization background"
                        className="w-full h-full object-cover"
                    />
                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[#0D1117]/70 via-[#0D1117]/60 to-[#0D1117]/80" />
                    {/* Green tint overlay */}
                    <div className="absolute inset-0 bg-[#0F172A]/15 mix-blend-multiply" />
                </motion.div>

                {/* Vertical progress indicator (right side, like Rolex) */}
                <div className="absolute right-6 lg:right-10 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3 z-20">
                    <div className="w-px h-12 bg-white/20" />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                    <div className="w-px h-12 bg-white/20" />
                </div>

                {/* Hero Content */}
                <motion.div
                    className="relative z-10 text-center px-6 max-w-5xl mx-auto"
                    style={{ opacity: heroOpacity }}
                >
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="luxury-label text-white/60 mb-5 tracking-[0.3em]"
                    >
                        Data Analytics Platform
                    </motion.p>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="font-display text-display-xl text-white mb-6 leading-tight"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                        Transform Data Into{" "}
                        <em className="italic not-italic" style={{ fontStyle: "italic" }}>
                            Strategic
                        </em>
                        <br />
                        <em style={{ fontStyle: "italic" }}>Intelligence</em>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                        className="text-white/70 text-lg max-w-xl mx-auto mb-10 font-body font-light tracking-wide"
                    >
                        Enterprise analytics that turns raw data into actionable intelligence.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 1 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-6"
                    >
                        <Link
                            to="/signup"
                            className="luxury-link text-white/90 hover:text-white text-base"
                        >
                            Start Free Trial <span className="ml-1 text-lg">›</span>
                        </Link>
                        <span className="hidden sm:block w-px h-4 bg-white/30" />
                        <Link
                            to="/login"
                            className="luxury-link text-white/60 hover:text-white/90 text-base"
                        >
                            Sign In <span className="ml-1 text-lg">›</span>
                        </Link>
                    </motion.div>
                </motion.div>

                {/* Scroll indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5, duration: 0.8 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10"
                >
                    <span className="luxury-label text-white/40 text-[10px]">Scroll</span>
                    <ChevronDown className="w-5 h-5 text-white/40 animate-scroll-bounce" />
                </motion.div>
            </section>

            {/* ══════════════════════════════════════
                TRUST STRIP
            ══════════════════════════════════════ */}
            <section className="bg-white border-b border-[#E8E4DC] py-8">
                <div className="max-w-7xl mx-auto px-6 lg:px-12">
                    <RevealSection className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
                        <p className="luxury-label text-[#6B6B6B]">Trusted by data teams at</p>
                        {["TechCorp", "DataFlow", "CloudScale", "AnalyticsPro", "InsightHub", "MetricsLab"].map((c) => (
                            <span key={c} className="text-base font-semibold text-[#D4AF37]/60 font-body tracking-wider">{c}</span>
                        ))}
                    </RevealSection>
                </div>
            </section>

            {/* ══════════════════════════════════════
                FEATURE CAROUSEL (Rolex watch grid style)
            ══════════════════════════════════════ */}
            <section id="features" className="py-24 bg-[#FAFAF7]">
                <div className="max-w-7xl mx-auto px-6 lg:px-12">
                    <RevealSection className="mb-14">
                        <LuxuryLabel>Capabilities</LuxuryLabel>
                        <h2
                            className="text-display-md text-[#0D1117] max-w-2xl"
                            style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                            Everything you need to{" "}
                            <em style={{ fontStyle: "italic" }}>analyze data</em>
                        </h2>
                    </RevealSection>
                </div>

                {/* Horizontal scroll carousel */}
                <div className="relative">
                    <div
                        ref={carouselRef}
                        className="flex gap-5 overflow-x-auto pb-6 px-6 lg:px-12 carousel-snap"
                        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                    >
                        <style>{`div::-webkit-scrollbar { display: none; }`}</style>
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-100px" }}
                            variants={stagger}
                            className="flex gap-5"
                        >
                            {features.map((feature, idx) => (
                                <FeatureCard key={idx} {...feature} index={idx} />
                            ))}
                        </motion.div>
                    </div>
                    {/* Fade edges */}
                    <div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-[#FAFAF7] pointer-events-none" />
                </div>
            </section>

            {/* ══════════════════════════════════════
                CONTENT STACKER — Section 1
            ══════════════════════════════════════ */}
            <ContentSection
                label="Advanced Analytics"
                title="Intelligence built for precision"
                description="Leverage state-of-the-art statistical models and machine learning algorithms to uncover hidden patterns in your data. Our platform automates the complex, so you focus on insight."
                bullets={[
                    "Automatic model selection and validation",
                    "Real-time anomaly detection",
                    "Predictive forecasting with confidence intervals",
                    "Custom algorithm training and deployment",
                ]}
                ctaText="Explore Analytics"
                ctaHref="/signup"
                image="https://images.pexels.com/photos/10020092/pexels-photo-10020092.jpeg?auto=compress&cs=tinysrgb&w=1200"
                imageAlt="Advanced analytics dashboard"
                dark={false}
            />

            {/* ══════════════════════════════════════
                CONTENT STACKER — Section 2 (dark)
            ══════════════════════════════════════ */}
            <ContentSection
                label="Collaboration"
                title="Designed for teams that move fast"
                description="Enable your entire team to work together seamlessly with real-time collaboration, comments, and shared dashboards. Built for the modern data-driven organization."
                bullets={[
                    "Real-time collaborative editing",
                    "Role-based access control",
                    "Shared dashboards and reports",
                    "Activity tracking and audit logs",
                ]}
                ctaText="Discover Collaboration"
                ctaHref="/signup"
                image="https://images.pexels.com/photos/7413851/pexels-photo-7413851.jpeg?auto=compress&cs=tinysrgb&w=1200"
                imageAlt="Team collaboration workspace"
                reverse={true}
                dark={true}
            />

            {/* ══════════════════════════════════════
                HOW IT WORKS
            ══════════════════════════════════════ */}
            <section id="journey" className="py-24 lg:py-36 bg-white">
                <div className="max-w-7xl mx-auto px-6 lg:px-12">
                    <RevealSection className="mb-20 text-center">
                        <LuxuryLabel>Simple Process</LuxuryLabel>
                        <h2
                            className="text-display-md text-[#0D1117]"
                            style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                            From raw data to{" "}
                            <em style={{ fontStyle: "italic" }}>clear insight</em>
                        </h2>
                    </RevealSection>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-80px" }}
                        variants={stagger}
                        className="grid md:grid-cols-3 gap-12 lg:gap-20 relative"
                    >
                        {/* Connecting line */}
                        <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-px bg-[#E8E4DC]" />

                        {processSteps.map((step, idx) => (
                            <motion.div
                                key={idx}
                                variants={fadeUp}
                                className="text-center group"
                            >
                                <div className="relative inline-flex mb-8">
                                    <div className="w-16 h-16 border border-[#0F172A] bg-white flex items-center justify-center relative z-10 group-hover:bg-[#0F172A] transition-colors duration-500">
                                        <span
                                            className="text-2xl font-bold text-[#0F172A] group-hover:text-white transition-colors"
                                            style={{ fontFamily: "'Playfair Display', serif" }}
                                        >
                                            {step.number}
                                        </span>
                                    </div>
                                </div>
                                <div className="inline-flex p-2 mb-4">
                                    <step.icon className="w-5 h-5 text-[#D4AF37]" />
                                </div>
                                <h3
                                    className="text-xl font-semibold text-[#0D1117] mb-3"
                                    style={{ fontFamily: "'Playfair Display', serif" }}
                                >
                                    {step.title}
                                </h3>
                                <p className="text-sm text-[#6B6B6B] leading-relaxed font-body">
                                    {step.description}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ══════════════════════════════════════
                STATS — Dark section
            ══════════════════════════════════════ */}
            <section className="py-24 lg:py-32 bg-[#0F172A] relative overflow-hidden">
                {/* Decorative pattern */}
                <div className="absolute inset-0 opacity-5">
                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
                            backgroundSize: "40px 40px",
                        }}
                    />
                </div>

                <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
                    <RevealSection className="text-center mb-16">
                        <LuxuryLabel light>By the numbers</LuxuryLabel>
                        <h2
                            className="text-display-md text-white"
                            style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                            Platform built for{" "}
                            <em style={{ fontStyle: "italic", color: "#E8C86A" }}>scale</em>
                        </h2>
                    </RevealSection>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={stagger}
                        className="grid grid-cols-2 lg:grid-cols-4 gap-12"
                    >
                        {[
                            { value: 50000, suffix: "+", label: "Active Users", decimals: 0 },
                            { value: 10, suffix: "M+", label: "Data Points Analyzed", decimals: 0 },
                            { value: 2, suffix: "M+", label: "Insights Generated", decimals: 0 },
                            { value: 99.9, suffix: "%", label: "Uptime", decimals: 1 },
                        ].map((stat, idx) => (
                            <motion.div
                                key={idx}
                                variants={fadeUp}
                                className="text-center"
                            >
                                <div
                                    className="font-display text-5xl lg:text-6xl font-bold text-champagne-gradient mb-3"
                                    style={{
                                        fontFamily: "'Playfair Display', serif",
                                        background: "linear-gradient(135deg, #D4AF37, #E8C86A, #D4AF37)",
                                        WebkitBackgroundClip: "text",
                                        WebkitTextFillColor: "transparent",
                                        backgroundClip: "text",
                                    }}
                                >
                                    <AnimatedNumber
                                        target={stat.value}
                                        suffix={stat.suffix}
                                        decimals={stat.decimals}
                                    />
                                </div>
                                <p className="luxury-label text-white/50">{stat.label}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ══════════════════════════════════════
                TESTIMONIALS
            ══════════════════════════════════════ */}
            <section id="testimonials" className="py-24 lg:py-36 bg-[#FAFAF7]">
                <div className="max-w-7xl mx-auto px-6 lg:px-12">
                    <RevealSection className="mb-16">
                        <LuxuryLabel>Testimonials</LuxuryLabel>
                        <h2
                            className="text-display-md text-[#0D1117] max-w-xl"
                            style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                            What data teams{" "}
                            <em style={{ fontStyle: "italic" }}>are saying</em>
                        </h2>
                    </RevealSection>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-80px" }}
                        variants={stagger}
                        className="grid md:grid-cols-3 gap-6"
                    >
                        {testimonials.map((t, idx) => (
                            <motion.div
                                key={idx}
                                variants={fadeUp}
                                className={`p-8 border luxury-card-hover ${
                                    idx === 0
                                        ? "bg-[#0F172A] border-[#0F172A] md:col-span-1"
                                        : "bg-white border-[#E8E4DC]"
                                }`}
                            >
                                <p
                                    className={`text-3xl mb-4 ${idx === 0 ? "text-[#D4AF37]" : "text-[#D4AF37]"}`}
                                    style={{ fontFamily: "'Playfair Display', serif" }}
                                >
                                    "
                                </p>
                                <p className={`text-base leading-relaxed mb-6 font-body ${idx === 0 ? "text-white/90" : "text-[#4A4A4A]"}`}>
                                    {t.quote}
                                </p>
                                <div className={`flex items-center gap-3 pt-4 border-t ${idx === 0 ? "border-white/20" : "border-[#E8E4DC]"}`}>
                                    <img src={t.avatar} alt={t.author} className="w-10 h-10 rounded-full" />
                                    <div>
                                        <p className={`text-sm font-semibold ${idx === 0 ? "text-white" : "text-[#0D1117]"}`}>{t.author}</p>
                                        <p className={`text-xs font-body ${idx === 0 ? "text-white/60" : "text-[#6B6B6B]"}`}>{t.role}, {t.company}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ══════════════════════════════════════
                FINAL CTA — Editorial style
            ══════════════════════════════════════ */}
            <section className="py-24 lg:py-36 bg-white border-t border-[#E8E4DC]">
                <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
                    <RevealSection>
                        <LuxuryLabel>Get Started</LuxuryLabel>
                        <h2
                            className="text-display-md text-[#0D1117] mb-6"
                            style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                            Ready to transform{" "}
                            <em style={{ fontStyle: "italic" }}>your data?</em>
                        </h2>
                        <p className="text-base text-[#6B6B6B] mb-10 font-body max-w-xl mx-auto">
                            Join thousands of teams making better decisions with data. Start your free 14-day trial today.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                to="/signup"
                                className="bg-[#0F172A] text-white px-8 py-3.5 luxury-label font-semibold hover:bg-[#0B1120] transition-colors duration-300 min-w-[200px] text-center"
                            >
                                Start Free Trial
                            </Link>
                            <Link
                                to="/documentation"
                                className="border border-[#E8E4DC] text-[#6B6B6B] px-8 py-3.5 luxury-label hover:border-[#0F172A] hover:text-[#0F172A] transition-all duration-300 min-w-[200px] text-center"
                            >
                                View Documentation
                            </Link>
                        </div>

                        <div className="flex items-center justify-center gap-8 mt-10">
                            {["Free 14-day trial", "No credit card required", "Cancel anytime"].map((item, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-[#0F172A]" />
                                    <span className="text-xs text-[#6B6B6B] font-body">{item}</span>
                                </div>
                            ))}
                        </div>
                    </RevealSection>
                </div>
            </section>

            <LandingFooter variant="dark" />
        </div>
    );
};

export default ProfessionalLanding;
