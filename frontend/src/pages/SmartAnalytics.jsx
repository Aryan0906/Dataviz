import { useState } from "react";
import { motion } from "framer-motion";
import AppLayout from "@/components/AppLayout";
import DataHealthModal from "@/components/DataHealthModal";
import CodeExportModal from "@/components/CodeExportModal";
import ResidualPlot from "@/components/ResidualPlot";
import { FileCheck, Code2, TrendingUp, Database, ArrowRight } from "lucide-react";

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i = 0) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.09, duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] },
    }),
};

/* ── Luxury Feature Card ── */
function FeatureCard({ step, icon: Icon, title, subtitle, items, accentColor = "#0F172A", cta, onCta, disabled, badge, index }) {
    return (
        <motion.div variants={fadeUp} custom={index} className="bg-white border border-[#E8E4DC] luxury-card-hover group flex flex-col">
            <div className="h-0.5 w-full" style={{ backgroundColor: accentColor }} />
            <div className="p-7 flex flex-col flex-1">
                {/* Icon + Step Number */}
                <div className="flex items-start justify-between mb-5">
                    <div
                        className="w-11 h-11 flex items-center justify-center border"
                        style={{ borderColor: `${accentColor}30`, backgroundColor: `${accentColor}08` }}
                    >
                        <Icon className="h-5 w-5" style={{ color: accentColor }} />
                    </div>
                    <div className="flex items-center gap-2">
                        {badge && (
                            <span
                                className="bg-[#D4AF37] text-[#0D1117] px-2 py-0.5 text-[10px] font-semibold"
                                style={{ letterSpacing: "0.1em", textTransform: "uppercase" }}
                            >
                                {badge}
                            </span>
                        )}
                        <span
                            className="font-bold opacity-10 group-hover:opacity-20 transition-opacity"
                            style={{ fontFamily: "'Playfair Display', serif", fontSize: "3rem", lineHeight: 1, color: accentColor }}
                        >
                            {step}
                        </span>
                    </div>
                </div>

                {/* Heading */}
                <h3
                    className="text-lg font-bold text-[#0D1117] mb-1 group-hover:text-[#0F172A] transition-colors duration-300"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                >
                    {title}
                </h3>
                <p className="text-xs text-[#6B6B6B] mb-5" style={{ fontFamily: "'Raleway', sans-serif", letterSpacing: "0.05em" }}>
                    {subtitle}
                </p>

                {/* Bullet list */}
                <ul className="space-y-2.5 flex-1 mb-6">
                    {items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                            <div className="w-1 h-1 rounded-full mt-[7px] flex-shrink-0" style={{ backgroundColor: accentColor }} />
                            <span className="text-sm text-[#4A4A4A]" style={{ fontFamily: "'Raleway', sans-serif" }}>
                                {item}
                            </span>
                        </li>
                    ))}
                </ul>

                {/* CTA */}
                <button
                    onClick={!disabled ? onCta : undefined}
                    disabled={disabled}
                    className={`flex items-center justify-center gap-2 w-full py-2.5 transition-colors duration-300 text-xs font-semibold ${
                        disabled
                            ? "bg-[#E8E4DC] text-[#6B6B6B] cursor-not-allowed"
                            : "text-white hover:opacity-90"
                    }`}
                    style={
                        !disabled
                            ? { backgroundColor: accentColor, letterSpacing: "0.12em", textTransform: "uppercase" }
                            : { letterSpacing: "0.12em", textTransform: "uppercase" }
                    }
                >
                    {cta}
                    {!disabled && <ArrowRight className="h-3.5 w-3.5" />}
                </button>
            </div>
        </motion.div>
    );
}

/* ── Main Page ── */
const SmartAnalytics = () => {
    const [healthModalOpen, setHealthModalOpen] = useState(false);
    const [codeModalOpen, setCodeModalOpen] = useState(false);

    const sampleResiduals = {
        actual: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
        predicted: [12, 18, 33, 38, 52, 58, 72, 78, 88, 102],
        residuals: [-2, 2, -3, 2, -2, 2, -2, 2, 2, -2],
        residualStats: { mean: 0.1, std: 2.1, min: -3, max: 2 },
    };

    const features = [
        {
            step: "01",
            icon: FileCheck,
            title: "Smart Data Cleaning",
            subtitle: "Automated quality detection and correction",
            accentColor: "#0F172A",
            badge: "New",
            items: [
                "Detects missing values per column",
                "Identifies duplicate rows",
                "Flags data type mismatches",
                "6 cleaning methods — drop, mean, median & more",
            ],
            cta: "Try Demo",
            onCta: () => setHealthModalOpen(true),
        },
        {
            step: "02",
            icon: Database,
            title: "Correlation Heatmap",
            subtitle: "Interactive correlation matrix with drill-down",
            accentColor: "#D4AF37",
            badge: "API Ready",
            items: [
                "Plotly.js interactive heatmap",
                "Click cells to select variable pairs",
                "Auto-identifies strong correlations",
                "One-click PNG export",
            ],
            cta: "Coming Soon",
            disabled: true,
        },
        {
            step: "03",
            icon: Code2,
            title: "Code Export",
            subtitle: "Generate production-ready Python scripts",
            accentColor: "#0D1117",
            items: [
                "Regression, EDA, and Cleaning scripts",
                "Syntax highlighting with VS Code theme",
                "Copy to clipboard or download as .py",
                "Complete with imports and usage guide",
            ],
            cta: "Try Demo",
            onCta: () => setCodeModalOpen(true),
        },
    ];

    return (
        <AppLayout>
            <div className="space-y-10" style={{ fontFamily: "'Raleway', sans-serif" }}>

                {/* ── Feature Cards ── */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{ visible: { transition: { staggerChildren: 0.09 } } }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-5"
                >
                    {features.map((feature, index) => (
                        <FeatureCard key={index} {...feature} index={index} />
                    ))}
                </motion.div>

                {/* ── Residual Plot Demo ── */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeUp}
                    custom={3}
                >
                    <div className="flex items-center gap-3 mb-5">
                        <p
                            className="text-[#0F172A]"
                            style={{ fontSize: "0.6rem", letterSpacing: "0.25em", textTransform: "uppercase" }}
                        >
                            Live Demo
                        </p>
                        <div className="flex-1 h-px bg-[#E8E4DC]" />
                    </div>

                    <div className="bg-white border border-[#E8E4DC] luxury-card-hover">
                        <div className="h-0.5 w-full bg-[#0F172A]" />
                        <div className="p-7">
                            <div className="flex items-start justify-between mb-5">
                                <div className="w-11 h-11 flex items-center justify-center border border-[#0F172A]/30 bg-[#0F172A]/5">
                                    <TrendingUp className="h-5 w-5 text-[#0F172A]" />
                                </div>
                                <span
                                    className="font-bold opacity-10"
                                    style={{ fontFamily: "'Playfair Display', serif", fontSize: "3rem", lineHeight: 1, color: "#0F172A" }}
                                >
                                    04
                                </span>
                            </div>
                            <h3
                                className="text-lg font-bold text-[#0D1117] mb-1"
                                style={{ fontFamily: "'Playfair Display', serif" }}
                            >
                                Residual Plot
                            </h3>
                            <p className="text-xs text-[#6B6B6B] mb-6" style={{ letterSpacing: "0.05em" }}>
                                Scientific validation of regression model fit
                            </p>
                            <ResidualPlot {...sampleResiduals} />
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Modals */}
            <DataHealthModal
                isOpen={healthModalOpen}
                onClose={() => setHealthModalOpen(false)}
                filePath="sample_categorical_data.csv"
                autoCheck={false}
            />
            <CodeExportModal
                isOpen={codeModalOpen}
                onClose={() => setCodeModalOpen(false)}
                modelType="random_forest"
                features={["feature1", "feature2", "feature3"]}
                target="target_variable"
                hyperparameters={{ n_estimators: 100 }}
            />
        </AppLayout>
    );
};

export default SmartAnalytics;
