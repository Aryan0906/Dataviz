import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BarChart3, Github, Twitter, Linkedin, Mail } from "lucide-react";

const LandingFooter = ({ variant = "dark" }) => {
    const footerSections = [
        {
            title: "Product",
            links: [
                { name: "Features", href: "#features" },
                { name: "How It Works", href: "#journey" },
                { name: "Pricing", href: "#pricing" },
                { name: "Documentation", href: "/documentation" },
            ],
        },
        {
            title: "Platform",
            links: [
                { name: "Dashboard", href: "/dashboard" },
                { name: "AI Features", href: "/ai" },
                { name: "Data Analyzer", href: "/manual-plot" },
                { name: "Smart Analytics", href: "/smart-analytics" },
            ],
        },
        {
            title: "Company",
            links: [
                { name: "About Us", href: "#about" },
                { name: "Blog", href: "#blog" },
                { name: "Careers", href: "#careers" },
                { name: "Contact", href: "#contact" },
            ],
        },
        {
            title: "Legal",
            links: [
                { name: "Privacy Policy", href: "#privacy" },
                { name: "Terms of Service", href: "#terms" },
                { name: "Cookie Policy", href: "#cookies" },
                { name: "Security", href: "#security" },
            ],
        },
    ];

    const socialLinks = [
        { name: "GitHub", icon: Github, href: "#" },
        { name: "Twitter", icon: Twitter, href: "#" },
        { name: "LinkedIn", icon: Linkedin, href: "#" },
        { name: "Email", icon: Mail, href: "mailto:hello@dataviz.com" },
    ];

    const stagger = {
        visible: { transition: { staggerChildren: 0.08 } },
    };
    const fadeUp = {
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    };

    return (
        <footer className="bg-[#0D1117] border-t border-white/5">
            {/* CTA stripe */}
            <div className="border-b border-white/5 py-16 px-6 lg:px-12">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
                    <div>
                        <p className="luxury-label text-white/30 mb-2">Ready to begin</p>
                        <h3
                            className="text-3xl lg:text-4xl font-semibold text-white"
                            style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                            Start analyzing your data{" "}
                            <em style={{ fontStyle: "italic", color: "#E8C86A" }}>today</em>
                        </h3>
                    </div>
                    <div className="flex-shrink-0">
                        <Link
                            to="/signup"
                            className="inline-flex items-center gap-2 bg-[#0F172A] text-white px-8 py-3.5 luxury-label font-semibold hover:bg-[#008A52] transition-colors duration-300"
                        >
                            Get Started Free
                        </Link>
                    </div>
                </div>
            </div>

            {/* Main footer grid */}
            <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={stagger}
                    className="grid grid-cols-2 md:grid-cols-6 gap-10"
                >
                    {/* Brand col */}
                    <motion.div variants={fadeUp} className="col-span-2">
                        <Link to="/" className="flex items-center gap-2.5 mb-5 group">
                            <div className="flex items-center justify-center w-9 h-9 rounded-full border border-white/20 bg-white/5 group-hover:bg-white/10 transition-colors">
                                <BarChart3 className="w-4 h-4 text-white" />
                            </div>
                            <span
                                className="font-semibold text-lg text-white"
                                style={{ fontFamily: "'Playfair Display', serif" }}
                            >
                                DataViz
                            </span>
                        </Link>
                        <p className="text-sm text-white/40 font-body leading-relaxed mb-6 max-w-xs">
                            Where data becomes story. Transform raw numbers into compelling narratives and actionable insights.
                        </p>
                        <div className="flex gap-3">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.name}
                                    href={social.href}
                                    className="w-8 h-8 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all duration-300"
                                    aria-label={social.name}
                                >
                                    <social.icon className="h-3.5 w-3.5" />
                                </a>
                            ))}
                        </div>
                    </motion.div>

                    {/* Link columns */}
                    {footerSections.map((section) => (
                        <motion.div key={section.title} variants={fadeUp}>
                            <h3 className="luxury-label text-white/50 mb-5">{section.title}</h3>
                            <ul className="space-y-3">
                                {section.links.map((link) => (
                                    <li key={link.name}>
                                        <a
                                            href={link.href}
                                            className="text-sm text-white/40 hover:text-white font-body transition-colors duration-200"
                                        >
                                            {link.name}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Divider + bottom bar */}
                <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-white/25 font-body">
                        © 2026 DataViz Analytics Platform. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6">
                        {["Privacy", "Terms", "Cookies"].map((item) => (
                            <a
                                key={item}
                                href={`#${item.toLowerCase()}`}
                                className="text-xs text-white/25 hover:text-white/60 font-body transition-colors"
                            >
                                {item}
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default LandingFooter;
