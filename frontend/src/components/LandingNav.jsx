import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Menu, BarChart3, ChevronRight } from "lucide-react";

const LandingNav = ({ variant: _variant = "dark" }) => {
    const [scrollY, setScrollY] = useState(0);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const isScrolled = scrollY > 60;

    const navLinks = [
        { name: "Features", href: "#features" },
        { name: "How It Works", href: "#journey" },
        { name: "Testimonials", href: "#testimonials" },
        { name: "Documentation", href: "/documentation" },
    ];

    return (
        <>
            {/* ── Main Navbar ── */}
            <nav
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${isScrolled
                        ? "bg-luxury-midnight/95 backdrop-blur-xl shadow-lg shadow-black/20"
                        : "bg-luxury-midnight"
                    }`}
                style={{ height: "72px" }}
            >
                <div className="relative h-full flex items-center px-6 lg:px-12">
                    {/* LEFT: Hamburger */}
                    <button
                        className="flex items-center gap-2 text-white/90 hover:text-white transition-colors group"
                        onClick={() => setMobileMenuOpen(true)}
                        aria-label="Open menu"
                    >
                        <Menu className="h-5 w-5" />
                        <span className="hidden md:inline luxury-label text-white/80 group-hover:text-white">
                            Menu
                        </span>
                    </button>

                    {/* CENTER: Logo */}
                    <Link
                        to="/"
                        className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2.5 group"
                    >
                        <div className="flex items-center justify-center w-9 h-9 rounded-full border border-white/30 bg-white/10 transition-all duration-500 group-hover:bg-white/20 group-hover:border-white/50">
                            <BarChart3 className="w-4 h-4 text-white" />
                        </div>
                        <span
                            className="font-display font-semibold text-xl text-white tracking-wide"
                            style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                            DataViz
                        </span>
                    </Link>

                    {/* RIGHT: Utilities */}
                    <div className="ml-auto flex items-center gap-6">
                        <Link
                            to="/login"
                            className="hidden md:block luxury-label text-white/80 hover:text-white transition-colors"
                        >
                            Sign In
                        </Link>
                        <Link
                            to="/signup"
                            className="hidden md:flex items-center gap-1.5 border border-white/40 text-white px-4 py-1.5 luxury-label hover:bg-white hover:text-luxury-midnight transition-all duration-300"
                        >
                            Get Started
                            <ChevronRight className="w-3 h-3" />
                        </Link>

                        {/* Mobile sign in */}
                        <Link
                            to="/login"
                            className="md:hidden luxury-label text-white/80 hover:text-white transition-colors"
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ── Fullscreen Overlay Menu ── */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="fixed inset-0 z-[100] bg-luxury-midnight"
                    >
                        {/* Close button */}
                        <div className="flex items-center justify-between px-6 lg:px-12 h-[72px]">
                            <button
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center gap-2 text-white/90 hover:text-white transition-colors"
                            >
                                <X className="h-5 w-5" />
                                <span className="luxury-label text-white/80">Close</span>
                            </button>
                            <Link
                                to="/"
                                className="flex items-center gap-2.5"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <div className="flex items-center justify-center w-9 h-9 rounded-full border border-white/30 bg-white/10">
                                    <BarChart3 className="w-4 h-4 text-white" />
                                </div>
                                <span
                                    className="font-semibold text-xl text-white"
                                    style={{ fontFamily: "'Playfair Display', serif" }}
                                >
                                    DataViz
                                </span>
                            </Link>
                            <div className="w-20" />
                        </div>

                        {/* Menu Content */}
                        <div className="flex flex-col justify-center h-[calc(100vh-72px)] px-10 lg:px-24">
                            <div className="space-y-2">
                                {navLinks.map((link, idx) => (
                                    <motion.div
                                        key={link.name}
                                        initial={{ opacity: 0, x: -30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{
                                            delay: idx * 0.08 + 0.1,
                                            duration: 0.5,
                                            ease: [0.25, 0.46, 0.45, 0.94],
                                        }}
                                    >
                                        <a
                                            href={link.href}
                                            className="block py-4 border-b border-white/10 group"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            <span
                                                className="text-4xl md:text-6xl font-display font-semibold text-white/90 group-hover:text-white transition-colors"
                                                style={{ fontFamily: "'Playfair Display', serif" }}
                                            >
                                                {link.name}
                                            </span>
                                        </a>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Bottom actions */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5, duration: 0.5 }}
                                className="mt-12 flex flex-col sm:flex-row gap-4"
                            >
                                <Link
                                    to="/login"
                                    className="border border-white/40 text-white text-center px-8 py-3 luxury-label hover:bg-white/10 transition-all duration-300"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/signup"
                                    className="bg-white text-luxury-midnight text-center px-8 py-3 luxury-label font-semibold hover:bg-white/90 transition-all duration-300"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Get Started Free
                                </Link>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default LandingNav;
