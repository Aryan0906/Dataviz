import { Link, NavLink, useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { LogOut } from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-md text-sm font-medium ${isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"
  }`;

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight">dataViz</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              <NavLink to="/dashboard" className={navLinkClass}>Dashboard</NavLink>
              <NavLink to="/manual-plot/regression" className={navLinkClass}>Manual Plot</NavLink>
              <NavLink to="/ai" className={navLinkClass}>AI Features</NavLink>
              <NavLink to="/profile" className={navLinkClass}>Profile</NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <div className="text-sm text-muted-foreground hidden sm:block">
                <span className="font-medium text-foreground">
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </span>
                <span className="mx-2">·</span>
                <span>{user.email}</span>
              </div>
            )}
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
        <div className="md:hidden border-t">
          <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-2 overflow-x-auto">
            <NavLink to="/dashboard" className={navLinkClass}>Dashboard</NavLink>
            <NavLink to="/manual-plot/regression" className={navLinkClass}>Manual Plot</NavLink>
            <NavLink to="/ai" className={navLinkClass}>AI Features</NavLink>
            <NavLink to="/profile" className={navLinkClass}>Profile</NavLink>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-4 md:p-6">{children}</main>
    </div>
  );
};

export default AppLayout;
