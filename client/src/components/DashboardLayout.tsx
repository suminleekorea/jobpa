import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { useI18n } from "@/contexts/i18nContext";
import { LanguageSelector } from "@/components/LanguageSelector";
import {
  Briefcase, FileText, Target, BarChart3, Bookmark, Settings,
  LogOut, PanelLeft, Bot, Users, Sparkles, Shield, Languages,
  TrendingUp, MessageCircle, Trophy, CheckSquare, BookOpen, Home, UserCircle,
  CalendarCheck, Mail, Radar,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation, Link } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
            <Bot className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-center">Sign in to continue</h1>
          <p className="text-sm text-muted-foreground text-center">Access to the dashboard requires authentication.</p>
          <Button onClick={() => { window.location.href = getLoginUrl(); }} size="lg" className="w-full">Sign in</Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
}

function DashboardLayoutContent({ children, setSidebarWidth }: { children: React.ReactNode; setSidebarWidth: (w: number) => void }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const { t, language } = useI18n();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const coreMenuItems = [
    { icon: Home, label: t.nav.home, path: "/dashboard" },
    { icon: Briefcase, label: t.nav.jobs, path: "/dashboard/jobs" },
    { icon: Radar, label: "Career Ops", path: "/dashboard/career-ops" },
    { icon: Bookmark, label: "Saved Jobs", path: "/dashboard/saved" },
    { icon: Bookmark, label: t.nav.applications, path: "/dashboard/applications" },
    { icon: FileText, label: t.nav.resume, path: "/dashboard/resume" },
    { icon: Target, label: t.nav.fit, path: "/dashboard/fit" },
    { icon: CalendarCheck, label: "Interview Prep", path: "/dashboard/interview" },
    { icon: Mail, label: "Email Center", path: "/dashboard/email" },
    { icon: MessageCircle, label: t.chatbot.title, path: "/dashboard/chat" },
    { icon: Sparkles, label: t.nav.consulting, path: "/dashboard/consulting" },
    { icon: UserCircle, label: t.nav.myProfile, path: "/dashboard/profile" },
  ];

  const moreMenuItems = [
    { icon: CheckSquare, label: t.checklist.title, path: "/dashboard/checklist" },
    { icon: BookOpen, label: t.journal.title, path: "/dashboard/journal" },
    { icon: Trophy, label: t.gamification.title, path: "/dashboard/level" },
    { icon: BarChart3, label: t.nav.reports, path: "/dashboard/reports" },
    { icon: TrendingUp, label: t.trends.title, path: "/dashboard/trends" },
  ];

  const adminItems = user?.role === "admin" ? [
    { icon: Shield, label: t.nav.admin, path: "/dashboard/admin" },
  ] : [];

  const allItems = [...coreMenuItems, ...moreMenuItems, ...adminItems];
  const [moreExpanded, setMoreExpanded] = useState(() =>
    moreMenuItems.some(item => location === item.path || (location.startsWith(item.path) && item.path !== "/dashboard"))
  );
  const activeMenuItem = allItems.find(item => item.path === location) || allItems.find(item => location.startsWith(item.path) && item.path !== "/dashboard") || allItems[0];

  useEffect(() => { if (isCollapsed) setIsResizing(false); }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r border-border/50" disableTransition={isResizing}>
          <SidebarHeader className="h-14 justify-center border-b border-border/50">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button onClick={toggleSidebar} className="h-8 w-8 flex items-center justify-center hover:bg-accent/50 rounded-md transition-colors shrink-0" aria-label="Toggle navigation">
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed && (
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center shrink-0">
                    <Bot className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                  <span className="text-sm font-semibold tracking-tight truncate">{t.brand.name}</span>
                </div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            <SidebarMenu className="px-2 py-2">
              {coreMenuItems.map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-8 text-[13px] transition-all font-medium ${
                        isActive
                          ? "bg-primary/8 text-primary border border-primary/15"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      }`}
                    >
                      <item.icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-primary" : ""}`} />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              {adminItems.map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-8 text-[13px] transition-all font-medium ${
                        isActive
                          ? "bg-primary/8 text-primary border border-primary/15"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      }`}
                    >
                      <item.icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-primary" : ""}`} />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              {/* More Features collapsible section */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setMoreExpanded(v => !v)}
                  tooltip={t.nav.moreFeatures}
                  className="h-8 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  <Settings className="h-3.5 w-3.5 shrink-0" />
                  <span className="flex-1">{t.nav.moreFeatures}</span>
                  <span className="text-[10px] opacity-60">{moreExpanded ? '▲' : '▼'}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {moreExpanded && moreMenuItems.map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-8 text-[13px] transition-all font-medium pl-6 ${
                        isActive
                          ? "bg-primary/8 text-primary border border-primary/15"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      }`}
                    >
                      <item.icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-primary" : ""}`} />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-2 space-y-1 border-t border-border/50">
            {!isCollapsed && (
              <div className="px-1 space-y-1">
                <LanguageSelector variant="ghost" className="w-full justify-start" />
                <Link href="/disclaimer" className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:text-primary hover:bg-accent/50 transition-colors w-full">
                  <Shield className="h-3.5 w-3.5 shrink-0" />
                  <span>{t.disclaimer.nav}</span>
                </Link>
              </div>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center">
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarFallback className="text-xs font-medium">{user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">{user?.name || "-"}</p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">{user?.email || "-"}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setLocation("/")} className="cursor-pointer">
                  <Bot className="mr-2 h-4 w-4" />
                  <span>{t.nav.home}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t.nav.signOut}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <span className="tracking-tight text-foreground">{activeMenuItem?.label ?? "Menu"}</span>
            </div>
          </div>
        )}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </>
  );
}
