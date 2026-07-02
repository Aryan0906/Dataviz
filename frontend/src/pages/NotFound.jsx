import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BarChart3, ChevronRight, Home } from "lucide-react";

export default function NotFound() {
    return (
        <div
            className="min-h-screen relative flex flex-col overflow-hidden bg-luxury-midnight"
            style={{ fontFamily: "'Raleway', sans-serif" }}
        >
            {/* ── Dot pattern overlay ── */}
            <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                    backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
                    backgroundSize: "32px 32px",
                }}
            />

            {/* ── Gold vertical accent lines ── */}
            <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#D4AF37]/20 to-transparent" />
            <div className="absolute right-8 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#D4AF37]/20 to-transparent" />

            {/* ── Top Nav Bar ── */}
            <nav className="relative z-10 flex items-center justify-between px-8 lg:px-16 h-[68px] border-b border-white/8">
                <Link
                    to="/"
                    className="flex items-center gap-2.5 group"
                >
                    <div className="flex items-center justify-center w-8 h-8 border border-white/30 bg-white/10 group-hover:bg-white/20 transition-all duration-300">
                        <BarChart3 className="w-4 h-4 text-white" />
                    </div>
                    <span
                        className="font-bold text-lg text-white tracking-wide"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                        DataViz
                    </span>
                </Link>
                <p
                    className="text-white/30"
                    style={{ fontSize: "0.6rem", letterSpacing: "0.25em", textTransform: "uppercase" }}
                >
                    Analytics Platform
                </p>
            </nav>

            {/* ── Main Content ── */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
                {/* Label */}
                <motion.p
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="text-[#D4AF37]/70 mb-4"
                    style={{ fontSize: "0.65rem", letterSpacing: "0.35em", textTransform: "uppercase" }}
                >
                    Error
                </motion.p>

                {/* Large 404 */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                    <span
                        className="block font-bold leading-none mb-4 select-none"
                        style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: "clamp(8rem, 25vw, 18rem)",
                            lineHeight: 0.9,
                            background: "linear-gradient(135deg, #D4AF37 0%, #E8C86A 40%, #D4AF37 70%, #A8893A 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                        }}
                    >
                        404
                    </span>
                </motion.div>

                {/* Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="text-white text-2xl lg:text-4xl font-bold mb-3 max-w-lg"
                    style={{ fontFamily: "'Playfair Display', serif", lineHeight: 1.2 }}
                >
                    Page not found
                </motion.h1>

                {/* Sub text */}
                <motion.p
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.7 }}
                    className="text-white/50 text-base mb-10 max-w-sm"
                    style={{ fontFamily: "'Raleway', sans-serif" }}
                >
                    The page you're looking for doesn't exist or has been moved.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.85 }}
                    className="flex flex-col sm:flex-row items-center gap-4"
                >
                    <Link
                        to="/"
                        className="flex items-center gap-2 border border-white/50 text-white px-8 py-3 text-xs uppercase tracking-widest hover:bg-white hover:text-luxury-midnight transition-all duration-300"
                    >
                        <Home className="h-3.5 w-3.5" />
                        Go Home
                    </Link>
                    <Link
                        to="/dashboard"
                        className="flex items-center gap-2 bg-[#D4AF37] text-luxury-dark px-8 py-3 text-xs uppercase tracking-widest font-semibold hover:bg-[#E8C86A] transition-all duration-300"
                    >
                        Dashboard
                        <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                </motion.div>
            </div>

            {/* ── Bottom Bar ── */}
            <div className="relative z-10 border-t border-white/8 py-5 px-8 lg:px-16">
                <p
                    className="text-white/20 text-center"
                    style={{ fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase" }}
                >
                    © 2026 DataViz Analytics Platform
                </p>
            </div>
        </div>
    );
}
