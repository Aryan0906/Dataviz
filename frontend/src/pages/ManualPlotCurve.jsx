import DesmosPlot from "@/components/DesmosPlot";

const ManualPlotCurve = () => {
    return (
        <div className="space-y-5" style={{ fontFamily: "'Raleway', sans-serif" }}>
            {/* Section header */}
            <div className="pb-5 border-b border-[#E8E4DC]">
                <p
                    className="text-[#0F172A] mb-1"
                    style={{ fontSize: "0.65rem", letterSpacing: "0.25em", textTransform: "uppercase" }}
                >
                    Mathematical Visualization
                </p>
                <h2
                    className="text-2xl font-bold text-[#0D1117] mb-1"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                >
                    Curve Plotting
                </h2>
                <p className="text-sm text-[#6B6B6B]">
                    Interactive Desmos integration for mathematical graphing and curve visualization
                </p>
                <p className="text-xs text-[#D4AF37]/80 mt-1">
                    Enter LaTeX expressions like y=x² or choose from presets
                </p>
                <div className="mt-4 w-10 h-0.5 bg-[#D4AF37]" />
            </div>
            <DesmosPlot />
        </div>
    );
};

export default ManualPlotCurve;
