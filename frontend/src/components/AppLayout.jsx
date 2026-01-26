import { Link, NavLink, useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { LogOut, Edit2, Check, X } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

const navLinkClass = ({ isActive }) =>
    `px-3 py-2 rounded-md text-sm font-medium ${isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"
    }`;

export const AppLayout = ({ children }) => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || user?.email?.split('@')[0] || '');

    const handleSave = async () => {
        // Save display name to profile
        setIsEditing(false);
        // You can add an API call here to update the profile
    };

    const handleCancel = () => {
        setDisplayName(user?.user_metadata?.display_name || user?.email?.split('@')[0] || '');
        setIsEditing(false);
    };

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
                            <div className="text-sm text-muted-foreground hidden sm:flex items-center gap-2">
                                {isEditing ? (
                                    <>
                                        <Input
                                            type="text"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            className="h-8 w-24"
                                            placeholder="Display name"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleSave}
                                            className="h-8 w-8 p-0"
                                        >
                                            <Check className="h-4 w-4 text-green-600" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleCancel}
                                            className="h-8 w-8 p-0"
                                        >
                                            <X className="h-4 w-4 text-red-600" />
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <span className="font-medium text-foreground">
                                            {displayName}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setIsEditing(true)}
                                            className="h-8 w-8 p-0"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                    </>
                                )}
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
