import AppLayout from "@/components/AppLayout";
import { NavLink, Outlet } from "react-router-dom";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-md text-sm font-medium ${isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"}`;

const ManualPlot = () => {
  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <NavLink to="/manual-plot/regression" className={linkClass} end>
            Regression Model
          </NavLink>
          <NavLink to="/manual-plot/categorical" className={linkClass}>
            Categorical (Chat)
          </NavLink>
        </div>
        <Outlet />
      </div>
    </AppLayout>
  );
};

export default ManualPlot;
