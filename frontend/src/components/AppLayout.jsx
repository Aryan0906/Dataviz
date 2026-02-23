import React, { useState, createContext, useContext } from 'react';
import { useLocation, Link, Outlet } from 'react-router-dom';
import {
    LayoutDashboard,
    LineChart,
    Table2,
    PenTool,
    LogOut,
    HelpCircle,
    User,
    PanelLeft,
    Sparkles,
    BarChart3,
    Database,
    Settings,
    BookOpen,
    Zap,
    TrendingUp,
    ChevronRight,
    Home
} from 'lucide-react';
import { useStorytelling } from '@/context/StorytellingContext';
import NavigationGuide from './NavigationGuide';
import ProgressTracker from './ProgressTracker';
import AchievementModal from './AchievementModal';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarRail,
    SidebarTrigger,
    SidebarInset
} from '@/components/ui/sidebar';
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/context/AuthContext';
import InfoTooltip from '@/components/InfoTooltip';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Create HelpMode Context
const HelpModeContext = createContext({ helpMode: false, setHelpMode: () => { } });
export const useHelpMode = () => useContext(HelpModeContext);

const AppLayout = ({ children }) => {
    const location = useLocation();
    const { user, signOut } = useAuth();
    const [helpMode, setHelpMode] = useState(false);
    const { journeyProgress, userPreferences } = useStorytelling();

    const navItems = [
        {
            title: 'Dashboard',
            url: '/dashboard',
            icon: LayoutDashboard,
            description: 'View all your analyses',
            badge: null,
        },
        {
            title: 'Smart Analytics',
            url: '/smart-analytics',
            icon: Zap,
            description: 'Automated insights',
            badge: 'New',
        },
        {
            title: 'AI Features',
            url: '/ai',
            icon: Sparkles,
            description: 'AI-powered tools',
            badge: null,
        },
        {
            title: 'Data Analyzer',
            url: '/manual-plot',
            icon: TrendingUp,
            description: 'Plot & visualize data',
        },
        {
            title: 'Categorical Data',
            url: '/categorical',
            icon: BarChart3,
            description: 'Analyze categories',
        },
        {
            title: 'NLP Analysis',
            url: '/categorical-nlp',
            icon: Database,
            description: 'Natural language queries',
        },
    ];

    const secondaryItems = [
        {
            title: 'Profile',
            url: '/profile',
            icon: User,
            description: 'Manage your account',
        },
        {
            title: 'Documentation',
            url: '/documentation',
            icon: BookOpen,
            description: 'Help & guides',
        },
        {
            title: 'Settings',
            url: '#',
            icon: Settings,
            description: 'App preferences',
        },
    ];

    const isActive = (path) => {
        if (path === '/manual-plot') return location.pathname.startsWith('/manual-plot');
        return location.pathname === path;
    };

    const getPageInfo = () => {
        const pathSegments = location.pathname.split('/').filter(Boolean);
        const activeItem = navItems.find(item => isActive(item.url));
        let title = activeItem?.title || 'Dashboard';
        let breadcrumbs = [{ name: 'Home', url: '/dashboard' }];

        if (location.pathname.startsWith('/manual-plot')) {
            title = 'Data Analyzer';
            breadcrumbs.push({ name: 'Data Analyzer', url: '/manual-plot' });
            if (pathSegments[1]) {
                breadcrumbs.push({
                    name: pathSegments[1].charAt(0).toUpperCase() + pathSegments[1].slice(1),
                    url: location.pathname
                });
            }
        } else if (activeItem) {
            breadcrumbs.push({ name: activeItem.title, url: activeItem.url });
        } else {
            const secItem = secondaryItems.find(i => i.url === location.pathname);
            if (secItem) breadcrumbs.push({ name: secItem.title, url: secItem.url });
        }

        return { title, breadcrumbs, description: activeItem?.description };
    };

    const pageInfo = getPageInfo();
    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

    return (
        <HelpModeContext.Provider value={{ helpMode, setHelpMode }}>
            <SidebarProvider>
                {/* ── Luxury Sidebar ── */}
                <Sidebar collapsible="icon" className="border-r border-[#D4AF37]/10">
                    {/* Brand Header */}
                    <SidebarHeader className="border-b border-[#D4AF37]/10 pb-3">
                        <div className="flex items-center gap-3 px-3 py-2">
                            <div className="flex aspect-square size-9 items-center justify-center border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37] flex-shrink-0">
                                <BarChart3 className="size-4" />
                            </div>
                            <div className="grid flex-1 text-left leading-tight">
                                <span
                                    className="truncate font-bold text-base text-sidebar-foreground tracking-wide"
                                    style={{ fontFamily: "'Playfair Display', serif" }}
                                >
                                    DataViz
                                </span>
                                <span
                                    className="truncate text-[#D4AF37]/60"
                                    style={{ fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase" }}
                                >
                                    Analytics Platform
                                </span>
                            </div>
                        </div>
                    </SidebarHeader>

                    <SidebarContent className="px-1">
                        {/* Primary Navigation */}
                        <SidebarGroup>
                            <SidebarGroupLabel
                                className="text-sidebar-foreground/30"
                                style={{ fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase" }}
                            >
                                Navigation
                            </SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {navItems.map((item) => {
                                        const active = isActive(item.url);
                                        return (
                                            <SidebarMenuItem key={item.title}>
                                                <SidebarMenuButton
                                                    asChild
                                                    isActive={active}
                                                    tooltip={item.description || item.title}
                                                    className={`group relative rounded-none transition-all duration-200 ${
                                                        active
                                                            ? "bg-[#0F172A] text-white hover:bg-[#0F172A] hover:text-white border-l-2 border-[#D4AF37]"
                                                            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-[#0F172A]/10 border-l-2 border-transparent"
                                                    }`}
                                                >
                                                    <Link to={item.url} className="flex items-center justify-between w-full">
                                                        <div className="flex items-center gap-2.5">
                                                            <item.icon
                                                                className={`size-4 transition-transform group-hover:scale-105 ${
                                                                    active ? "text-[#D4AF37]" : "text-sidebar-foreground/50"
                                                                }`}
                                                            />
                                                            <div className="flex flex-col">
                                                                <span
                                                                    className={`text-sm ${active ? "font-semibold" : "font-medium"}`}
                                                                    style={{ fontFamily: active ? "'Playfair Display', serif" : "'Raleway', sans-serif" }}
                                                                >
                                                                    {item.title}
                                                                </span>
                                                                <span className="text-[10px] opacity-50 group-data-[collapsible=icon]:hidden leading-tight">
                                                                    {item.description}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {item.badge && (
                                                            <span
                                                                className="ml-auto text-[10px] px-1.5 py-0.5 bg-[#D4AF37] text-[#0D1117] font-semibold group-data-[collapsible=icon]:hidden"
                                                                style={{ letterSpacing: "0.05em" }}
                                                            >
                                                                {item.badge}
                                                            </span>
                                                        )}
                                                    </Link>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        );
                                    })}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>

                        {/* Gold divider */}
                        <div className="mx-3 my-2 h-px bg-[#D4AF37]/10" />

                        {/* Secondary Navigation */}
                        <SidebarGroup>
                            <SidebarGroupLabel
                                className="text-sidebar-foreground/30"
                                style={{ fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase" }}
                            >
                                Resources
                            </SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {secondaryItems.map((item) => {
                                        const active = location.pathname === item.url;
                                        return (
                                            <SidebarMenuItem key={item.title}>
                                                <SidebarMenuButton
                                                    asChild
                                                    tooltip={item.title}
                                                    className={`rounded-none transition-all duration-200 border-l-2 ${
                                                        active
                                                            ? "bg-[#0F172A] text-white hover:bg-[#0F172A] border-[#D4AF37]"
                                                            : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-[#0F172A]/10 border-transparent"
                                                    }`}
                                                >
                                                    <Link to={item.url} className="flex items-center gap-2.5">
                                                        <item.icon className={`size-4 ${active ? "text-[#D4AF37]" : "text-sidebar-foreground/40"}`} />
                                                        <span className="text-sm">{item.title}</span>
                                                    </Link>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        );
                                    })}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </SidebarContent>

                    {/* Footer: User Menu */}
                    <SidebarFooter className="border-t border-[#D4AF37]/10 pt-2">
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <SidebarMenuButton
                                            size="lg"
                                            className="rounded-none hover:bg-[#0F172A]/10 data-[state=open]:bg-[#0F172A]/10 transition-colors"
                                        >
                                            <Avatar className="h-8 w-8 rounded-none border border-[#D4AF37]/30">
                                                <AvatarImage src={user?.user_metadata?.avatar_url} alt={userName} />
                                                <AvatarFallback
                                                    className="rounded-none bg-[#0F172A] text-white font-bold text-sm"
                                                    style={{ fontFamily: "'Playfair Display', serif" }}
                                                >
                                                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="grid flex-1 text-left text-sm leading-tight">
                                                <span className="truncate font-semibold text-sidebar-foreground">
                                                    {userName}
                                                </span>
                                                <span className="truncate text-xs text-sidebar-foreground/40">
                                                    {user?.email}
                                                </span>
                                            </div>
                                        </SidebarMenuButton>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent side="top" align="end" className="w-56 rounded-none border-[#E8E4DC]">
                                        <DropdownMenuLabel
                                            className="font-semibold"
                                            style={{ fontFamily: "'Playfair Display', serif" }}
                                        >
                                            My Account
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild>
                                            <Link to="/profile" className="cursor-pointer">
                                                <User className="mr-2 h-4 w-4 text-[#0F172A]" />
                                                Profile
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <Settings className="mr-2 h-4 w-4 text-[#6B6B6B]" />
                                            Settings
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={signOut}
                                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                        >
                                            <LogOut className="mr-2 h-4 w-4" />
                                            Log out
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarFooter>
                    <SidebarRail />
                </Sidebar>

                {/* ── Main Content Area ── */}
                <SidebarInset>
                    {/* Top Header Bar */}
                    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 bg-white border-b border-[#E8E4DC] px-6 transition-all" style={{ boxShadow: '0 1px 0 0 rgba(201,168,76,0.15)' }}>
                        <div className="flex items-center gap-2">
                            <SidebarTrigger className="-ml-1 text-[#6B6B6B] hover:text-[#0F172A] transition-colors" />
                            <div className="w-px h-4 bg-[#E8E4DC] mx-1" />

                            {/* Breadcrumbs */}
                            <nav className="flex items-center space-x-1 text-xs" style={{ fontFamily: "'Raleway', sans-serif", letterSpacing: "0.05em" }}>
                                {pageInfo.breadcrumbs.map((crumb, index) => (
                                    <React.Fragment key={crumb.url}>
                                        {index > 0 && <ChevronRight className="h-3 w-3 text-[#D4AF37]" />}
                                        <Link
                                            to={crumb.url}
                                            className={`transition-colors uppercase tracking-wider ${
                                                index === pageInfo.breadcrumbs.length - 1
                                                    ? 'text-[#0F172A] font-semibold'
                                                    : 'text-[#6B6B6B] hover:text-[#0D1117]'
                                            }`}
                                            style={{ fontSize: "0.65rem" }}
                                        >
                                            {crumb.name}
                                        </Link>
                                    </React.Fragment>
                                ))}
                            </nav>
                        </div>

                        <div className="ml-auto flex items-center gap-2">
                            {userPreferences.showProgressBar && (
                                <ProgressTracker compact />
                            )}
                            <AchievementModal />
                            <Button
                                variant={helpMode ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setHelpMode(!helpMode)}
                                className={`gap-2 rounded-none text-xs ${
                                    helpMode
                                        ? "bg-[#0F172A] text-white hover:bg-[#0B1120]"
                                        : "text-[#6B6B6B] hover:text-[#0F172A] hover:bg-[#0F172A]/5"
                                }`}
                                style={{ letterSpacing: "0.05em" }}
                            >
                                <HelpCircle className="h-3.5 w-3.5" />
                                <span className="hidden md:inline uppercase" style={{ fontSize: "0.65rem" }}>Help</span>
                            </Button>
                            <ThemeToggle />
                        </div>
                    </header>

                    {/* Page Content */}
                    <main className="flex flex-1 flex-col gap-4 p-6 bg-[#FAFAF7] min-h-[calc(100vh-3.5rem)]">
                        <NavigationGuide />

                        {/* Luxury Page Header */}
                        <div className="pb-5 mb-2 border-b border-[#E8E4DC]">
                            <p
                                className="text-[#0F172A] mb-1"
                                style={{ fontSize: "0.65rem", letterSpacing: "0.25em", textTransform: "uppercase", fontFamily: "'Raleway', sans-serif" }}
                            >
                                DataViz Platform
                            </p>
                            <h1
                                className="text-2xl lg:text-3xl font-bold text-[#0D1117]"
                                style={{ fontFamily: "'Playfair Display', serif", lineHeight: 1.2 }}
                            >
                                {pageInfo.title}
                            </h1>
                            {pageInfo.description && (
                                <p
                                    className="text-[#6B6B6B] text-sm mt-1.5"
                                    style={{ fontFamily: "'Raleway', sans-serif" }}
                                >
                                    {pageInfo.description}
                                </p>
                            )}
                            {/* Gold accent line */}
                            <div className="mt-4 w-10 h-0.5 bg-[#D4AF37]" />
                        </div>

                        {/* Content */}
                        {React.Children.map(children, child => {
                            if (React.isValidElement(child)) {
                                return React.cloneElement(child, { helpMode });
                            }
                            return child;
                        }) || <Outlet context={{ helpMode }} />}
                    </main>
                </SidebarInset>
            </SidebarProvider>
        </HelpModeContext.Provider>
    );
};

export default AppLayout;
