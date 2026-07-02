import { useLocation, NavLink, Outlet } from "react-router-dom";

const ManualPlotCurve = () => {
    const location = useLocation();
    const isClassic = location.pathname.includes("-classic");
    const basePath = isClassic ? "/manual-plot-classic/curve" : "/manual-plot/curve";

    return (
        <div className="space-y-6" style={{ fontFamily: "'Raleway', sans-serif" }}>
            {/* Section header */}
            <div className="pb-5 border-b border-luxury-silk flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <p
                        className="text-luxury-midnight mb-1"
                        style={{ fontSize: "0.65rem", letterSpacing: "0.25em", textTransform: "uppercase" }}
                    >
                        Mathematical Visualization
                    </p>
                    <h2
                        className="text-2xl font-bold text-luxury-dark mb-1"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                        Curve Plotter
                    </h2>
                    <p className="text-sm text-luxury-stone">
                        Interactive Desmos integration for mathematical graphing and curve visualization
                    </p>
                </div>
                
                {/* 2D / 3D Subpages Tab Navigation */}
                <div className="flex bg-muted/30 border border-luxury-silk p-0.5 rounded-sm self-start md:self-auto">
                    <NavLink
                        to={`${basePath}/2d`}
                        className={({ isActive }) =>
                            `px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                                isActive
                                    ? "bg-luxury-midnight text-white shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            }`
                        }
                    >
                        2D Plotter
                    </NavLink>
                    <NavLink
                        to={`${basePath}/3d`}
                        className={({ isActive }) =>
                            `px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                                isActive
                                    ? "bg-luxury-midnight text-white shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            }`
                        }
                    >
                        3D Plotter
                    </NavLink>
                </div>
            </div>

            {/* Nested Subpage Content */}
            <div className="mt-4">
                <Outlet />
            </div>
        </div>
    );
};

export default ManualPlotCurve;

