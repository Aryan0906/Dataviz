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

    // Define navigation items with enhanced structure
    const navItems = [
        {
            title: 'Dashboard',
            url: '/dashboard',
            icon: LayoutDashboard,
            description: 'Overview & insights',
            badge: null,
        },
        {
            title: 'Smart Analytics',
            url: '/smart-analytics',
            icon: Zap,
            description: 'Advanced features',
            badge: 'New',
        },
        {
            title: 'AI Features',
            url: '/ai',
            icon: Sparkles,
            description: 'AI-powered analysis',
            badge: null,
        },
        {
            title: 'Data Analyzer',
            url: '/manual-plot',
            icon: TrendingUp,
            description: 'Interactive plotting',
        },
        {
            title: 'Categorical Analysis',
            url: '/categorical',
            icon: BarChart3,
            description: 'Category insights',
        },
        {
            title: 'NLP Analysis',
            url: '/categorical-nlp',
            icon: Database,
            description: 'Text analytics',
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

    // Helper function to check if the link is active
    const isActive = (path) => {
        if (path === '/manual-plot') {
            return location.pathname.startsWith('/manual-plot');
        }
        return location.pathname === path;
    };

    // Get current page title and breadcrumbs
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
        }

        return { title, breadcrumbs, description: activeItem?.description };
    };

    const pageInfo = getPageInfo();

    return (
        <HelpModeContext.Provider value={{ helpMode, setHelpMode }}>
            <SidebarProvider>
                <Sidebar collapsible="icon" className="border-r">
                    <SidebarHeader>
                        <div className="flex items-center gap-2 px-2 py-1">
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 text-white shadow-lg">
                                <Sparkles className="size-4" />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-bold text-foreground">
                                    DataViz Pro
                                </span>
                                <span className="truncate text-xs text-muted-foreground">Professional Analytics</span>
                            </div>
                        </div>
                    </SidebarHeader>

                    <SidebarContent>
                        <SidebarGroup>
                            <SidebarGroupLabel className="text-xs font-semibold">Main Navigation</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {navItems.map((item) => (
                                        <SidebarMenuItem key={item.title}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={isActive(item.url)}
                                                tooltip={item.description || item.title}
                                                className="group relative"
                                            >
                                                <Link to={item.url} className="flex items-center justify-between w-full">
                                                    <div className="flex items-center gap-2">
                                                        <item.icon className="transition-transform group-hover:scale-110" />
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{item.title}</span>
                                                            <span className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
                                                                {item.description}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {item.badge && (
                                                        <Badge variant="secondary" className="ml-auto text-xs group-data-[collapsible=icon]:hidden">
                                                            {item.badge}
                                                        </Badge>
                                                    )}
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>

                        <SidebarGroup>
                            <SidebarGroupLabel className="text-xs font-semibold">Resources</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {secondaryItems.map((item) => (
                                        <SidebarMenuItem key={item.title}>
                                            <SidebarMenuButton asChild tooltip={item.title}>
                                                <Link to={item.url}>
                                                    <item.icon />
                                                    <span>{item.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </SidebarContent>

                    <SidebarFooter>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <SidebarMenuButton
                                            size="lg"
                                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-sidebar-accent/50 transition-colors"
                                        >
                                            <Avatar className="h-8 w-8 rounded-lg border-2 border-primary/20">
                                                <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email} />
                                                <AvatarFallback className="rounded-lg bg-slate-700 text-white">
                                                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="grid flex-1 text-left text-sm leading-tight">
                                                <span className="truncate font-semibold">{user?.user_metadata?.full_name || 'User'}</span>
                                                <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                                            </div>
                                        </SidebarMenuButton>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent side="top" align="end" className="w-56">
                                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild>
                                            <Link to="/profile" className="cursor-pointer">
                                                <User className="mr-2 h-4 w-4" />
                                                Profile
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <Settings className="mr-2 h-4 w-4" />
                                            Settings
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={signOut} className="text-red-600 focus:text-red-600">
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

                <SidebarInset>
                    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 transition-all">
                        <div className="flex items-center gap-2">
                            <SidebarTrigger className="-ml-1" />
                            <Separator orientation="vertical" className="mr-2 h-4" />

                            {/* Breadcrumbs */}
                            <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
                                {pageInfo.breadcrumbs.map((crumb, index) => (
                                    <React.Fragment key={crumb.url}>
                                        {index > 0 && <ChevronRight className="h-4 w-4" />}
                                        <Link
                                            to={crumb.url}
                                            className={`hover:text-foreground transition-colors ${index === pageInfo.breadcrumbs.length - 1
                                                ? 'text-foreground font-semibold'
                                                : 'hover:underline'
                                                }`}
                                        >
                                            {crumb.name}
                                        </Link>
                                    </React.Fragment>
                                ))}
                            </nav>
                        </div>

                        <div className="ml-auto flex items-center gap-2">
                            <Button
                                variant={helpMode ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setHelpMode(!helpMode)}
                                className="gap-2"
                            >
                                <HelpCircle className="h-4 w-4" />
                                <span className="hidden md:inline">Help Mode</span>
                            </Button>
                            <ThemeToggle />
                        </div>
                    </header>

                    <main className="flex flex-1 flex-col gap-4 p-6">
                        {/* Page Header */}
                        <div className="flex flex-col gap-2 pb-4">
                            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                                {pageInfo.title}
                            </h1>
                            {pageInfo.description && (
                                <p className="text-muted-foreground">{pageInfo.description}</p>
                            )}
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
