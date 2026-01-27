import DesmosPlot from "@/components/DesmosPlot";

const ManualPlotCurve = () => {
    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold">Curve Plotting</h1>
                <p className="text-muted-foreground">
                    Use Desmos to create interactive mathematical graphs and visualizations
                </p>
            </div>
            <DesmosPlot />
        </div>
    );
};

export default ManualPlotCurve;
