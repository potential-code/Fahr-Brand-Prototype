import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, useAnimationControls, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { useFederalData } from "@/lib/FederalDataContext";
import {
  AlertTriangle,
  Award,
  BadgeCheck,
  BarChart3,
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  CalendarDays,
  ClipboardCheck,
  FileText,
  FlaskConical,
  Globe,
  Landmark,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Plug,
  Rocket,
  ShieldCheck,
  Target,
  TrendingUp,
  User,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AIConcierge } from "@/components/AIConcierge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MOTION } from "@/components/motion";

type Role = "learner" | "manager" | "ministry" | "fahr" | "leadership";

type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  /**
   * Index routes match the exact path only. Without this a role's dashboard
   * stays highlighted on every screen beneath it.
   */
  exact?: boolean;
};

const ROLE_LABELS: Record<Role, string> = {
  learner: "Federal Employee",
  manager: "Line Manager",
  ministry: "Entity Admin",
  fahr: "FAHR Programme Team",
  leadership: "Federal Leadership",
};

export function Layout({ children, role }: { children: React.ReactNode; role: Role }) {
  const { language, t } = useLanguage();
  const [location, setLocation] = useLocation();
  const reduceMotion = useReducedMotion();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { notificationsFor, isNotificationRead, unreadCountFor, markNotificationRead, markAllNotificationsRead } =
    useFederalData();

  const navLinks = useMemo<NavLink[]>(() => {
    switch (role) {
      case "learner":
        return [
          // The baseline assessment is a one-time diagnostic reached from the
          // dashboard card, not a permanent destination — so it has no nav entry.
          { href: "/learner", label: "Dashboard", icon: LayoutDashboard, exact: true },
          { href: "/learner/profile", label: t("nav.profile"), icon: User },
          { href: "/learner/mission", label: t("nav.mission"), icon: Target },
          { href: "/learner/lab/twin", label: t("nav.lab"), icon: FlaskConical },
          { href: "/learner/lab/project", label: "Workplace Project", icon: Rocket },
          { href: "/learner/evaluation", label: t("nav.evaluation"), icon: BadgeCheck },
          { href: "/learner/recognition", label: t("nav.recognition"), icon: Award },
          { href: "/learner/events", label: t("nav.events"), icon: CalendarDays },
          { href: "/learner/community", label: t("nav.community"), icon: Users },
        ];
      case "manager":
        return [
          { href: "/manager", label: "Team Dashboard", icon: LayoutDashboard, exact: true },
          { href: "/manager/team", label: "Team Members", icon: Users },
          { href: "/manager/validations", label: "Validations", icon: ClipboardCheck },
          { href: "/manager/reports", label: "Team Reports", icon: BarChart3 },
        ];
      case "ministry":
        return [
          { href: "/ministry", label: "Dashboard", icon: LayoutDashboard, exact: true },
          { href: "/ministry/users", label: "Users & Access", icon: UserCog },
          { href: "/ministry/cohorts", label: "Cohorts & Programmes", icon: Users },
          { href: "/ministry/approvals", label: "Approvals", icon: ClipboardCheck },
          { href: "/ministry/portfolio", label: t("nav.portfolio"), icon: Briefcase },
          { href: "/ministry/content", label: "Content", icon: BookOpen },
          { href: "/ministry/events", label: "Events", icon: CalendarDays },
          { href: "/ministry/communications", label: "Communications", icon: Megaphone },
          { href: "/ministry/reports", label: "Reports", icon: BarChart3 },
        ];
      case "fahr":
        return [
          { href: "/fahr", label: "Dashboard", icon: LayoutDashboard, exact: true },
          { href: "/fahr/entities", label: "Entities", icon: Landmark },
          { href: "/fahr/users", label: "Users", icon: UserCog },
          { href: "/fahr/framework", label: "Framework & Catalogue", icon: BookOpen },
          { href: "/fahr/governance", label: t("nav.governance"), icon: ShieldCheck },
          { href: "/fahr/escalations", label: "Escalations", icon: AlertTriangle },
          { href: "/fahr/credentials", label: "Credential Registry", icon: BadgeCheck },
          { href: "/fahr/integrations", label: "Integrations", icon: Plug },
          { href: "/fahr/communications", label: "Communications", icon: Megaphone },
          { href: "/fahr/reports", label: "Reports", icon: BarChart3 },
        ];
      case "leadership":
        return [
          { href: "/leadership", label: "National Overview", icon: Landmark, exact: true },
          { href: "/leadership/ministries", label: "Ministries", icon: Building2 },
          { href: "/leadership/outcomes", label: "Outcomes", icon: TrendingUp },
          { href: "/leadership/briefings", label: "Briefings", icon: FileText },
        ];
    }
  }, [role, t]);

  /**
   * Only the deepest matching entry lights up. A nested route such as
   * `/manager/team/p-aisha` highlights "Team Members" and nothing else, and an
   * index route only ever matches its own path.
   */
  const activeHref = useMemo(() => {
    let best: string | null = null;
    for (const link of navLinks) {
      const matches = link.exact
        ? location === link.href
        : location === link.href || location.startsWith(`${link.href}/`);
      if (matches && (best === null || link.href.length > best.length)) best = link.href;
    }
    return best;
  }, [navLinks, location]);

  const notifications = notificationsFor(role);
  const unreadCount = unreadCountFor(role);
  const bellControls = useAnimationControls();
  const previousUnread = React.useRef(unreadCount);

  // The bell reacts when something new arrives — a sign-off landing in the
  // queue while the demo is on another screen should be noticed.
  useEffect(() => {
    if (unreadCount > previousUnread.current && !reduceMotion) {
      void bellControls.start({
        rotate: [0, -12, 10, -6, 0],
        transition: { duration: 0.5, ease: "easeInOut" },
      });
    }
    previousUnread.current = unreadCount;
  }, [unreadCount, reduceMotion, bellControls]);

  const openNotification = (id: string, href: string) => {
    markNotificationRead(id);
    setLocation(href);
  };

  const renderNavItems = (pillId: string, onNavigate?: () => void) => (
    <nav className="flex flex-col gap-1" data-testid={`nav-${pillId}`}>
      {navLinks.map((link, index) => {
        const Icon = link.icon;
        const isActive = link.href === activeHref;
        return (
          <motion.button
            key={link.href}
            type="button"
            onClick={() => {
              setLocation(link.href);
              onNavigate?.();
            }}
            data-testid={`nav-link-${link.href}`}
            data-active={isActive}
            aria-current={isActive ? "page" : undefined}
            initial={reduceMotion || pillId === "desktop" ? false : { opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: MOTION.duration.base,
              ease: MOTION.ease.out,
              delay: pillId === "desktop" ? 0 : index * MOTION.stagger.rows,
            }}
            whileHover={reduceMotion ? undefined : "hover"}
            whileTap={reduceMotion ? undefined : { scale: 0.985 }}
            className={`relative flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar ${
              isActive ? "text-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"
            }`}
          >
            {isActive &&
              (reduceMotion ? (
                <span className="absolute inset-0 rounded-lg bg-primary shadow-sm" />
              ) : (
                <motion.span
                  layoutId={`sidebar-pill-${pillId}`}
                  className="absolute inset-0 rounded-lg bg-primary shadow-sm"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              ))}
            <span className="relative z-10 flex items-center gap-3">
              <motion.span
                className="flex shrink-0 items-center"
                variants={{ hover: { scale: 1.12, rotate: -3 } }}
                transition={{ duration: MOTION.duration.fast, ease: MOTION.ease.out }}
              >
                <Icon className="h-4 w-4" />
              </motion.span>
              <span>{link.label}</span>
            </span>
          </motion.button>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-[100dvh] bg-background flex">
      {/* Desktop full-height sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col fixed inset-y-0 left-0 z-40 bg-sidebar border-r border-sidebar-border">
        <div className="px-5 pt-6 pb-4 border-b border-sidebar-border">
          <Link href="/">
            <img
              src={`${import.meta.env.BASE_URL}brand/fahr-logo.png`}
              alt="FAHR Logo"
              className="h-11 cursor-pointer object-contain"
            />
          </Link>
        </div>
        <div className="px-5 pt-5 pb-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Current Role</p>
          <p className="text-sm font-bold text-primary mt-0.5">{ROLE_LABELS[role]}</p>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pt-2">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Menu</p>
          {renderNavItems("desktop")}
        </div>
        <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
          {/* Language toggle — visual placeholder (platform is English-only for now) */}
          <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors text-left" title="Arabic coming soon">
            <Globe className="h-4 w-4 shrink-0" />
            <span>{language === 'en' ? 'العربية' : 'English'}</span>
          </button>
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors text-left"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col md:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 w-full border-b border-border bg-white/80 backdrop-blur-md">
          <div className="px-4 md:px-8 h-14 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 md:hidden">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] p-0 bg-sidebar flex flex-col">
                  {/* Named for screen readers; the visible header is the logo and role below. */}
                  <SheetHeader className="sr-only">
                    <SheetTitle>Navigation</SheetTitle>
                    <SheetDescription>Move between the screens available to your role.</SheetDescription>
                  </SheetHeader>
                  <div className="px-5 pt-6 pb-4 border-b border-sidebar-border">
                    <img src={`${import.meta.env.BASE_URL}brand/fahr-logo.png`} alt="FAHR Logo" className="h-10 object-contain" />
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mt-4">Current Role</p>
                    <p className="text-sm font-bold text-primary mt-0.5">{ROLE_LABELS[role]}</p>
                  </div>
                  <div className="flex-1 overflow-y-auto px-3 pt-4">
                    {renderNavItems("mobile", () => setMobileOpen(false))}
                  </div>
                  <div className="px-3 py-4 border-t border-sidebar-border">
                    <button
                      onClick={() => setLocation("/")}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors text-left"
                    >
                      <LogOut className="h-4 w-4 shrink-0" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </SheetContent>
              </Sheet>
              <Link href="/">
                <img src={`${import.meta.env.BASE_URL}brand/fahr-logo.png`} alt="FAHR Logo" className="h-8 cursor-pointer object-contain" />
              </Link>
            </div>

            <div className="hidden md:block text-sm text-muted-foreground font-medium">
              Federal Agentic AI Learning & Skilling Platform
            </div>

            <div className="flex items-center gap-2 min-w-0 ms-auto">
            {/* Role-aware notifications */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative shrink-0"
                  data-testid="button-notifications"
                  aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
                >
                  <motion.span animate={bellControls} className="flex items-center justify-center">
                    <Bell className="h-5 w-5" />
                  </motion.span>
                  {unreadCount > 0 && (
                    <motion.span
                      key={unreadCount}
                      initial={reduceMotion ? false : { scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 22 }}
                      className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground ring-2 ring-white"
                      data-testid="badge-unread-count"
                    >
                      {unreadCount}
                    </motion.span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">Notifications</p>
                    <p className="text-[11px] text-muted-foreground">{ROLE_LABELS[role]}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => markAllNotificationsRead(role)}
                    disabled={unreadCount === 0}
                    className="text-xs font-medium text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
                    data-testid="button-mark-all-read"
                  >
                    Mark all read
                  </button>
                </div>
                <div className="divide-y divide-border max-h-80 overflow-y-auto">
                  {notifications.length === 0 && (
                    <p className="px-4 py-6 text-sm text-muted-foreground">Nothing needs your attention.</p>
                  )}
                  {notifications.map((n) => {
                    const read = isNotificationRead(n.id);
                    return (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => openNotification(n.id, n.href)}
                        className="w-full text-left px-4 py-3 hover:bg-muted transition-colors flex gap-3"
                        data-testid={`notification-${n.id}`}
                        data-read={read}
                      >
                        <span
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${read ? "bg-transparent ring-1 ring-border" : "bg-primary"}`}
                        />
                        <span className="min-w-0">
                          <span
                            className={`block text-sm leading-snug ${read ? "font-normal text-muted-foreground" : "font-medium text-foreground"}`}
                          >
                            {n.title}
                          </span>
                          <span className="block text-xs text-muted-foreground mt-0.5">{n.body}</span>
                          <span className="block text-[11px] text-muted-foreground mt-1">{n.time}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>

            {/* Demo role switcher */}
            <div className="flex items-center overflow-x-auto bg-muted rounded-full p-1 border border-border">
              <Button variant="ghost" size="sm" className={`rounded-full px-3 md:px-4 h-8 whitespace-nowrap ${role === 'learner' ? 'bg-white shadow-sm' : ''}`} onClick={() => setLocation('/learner')}>{t('nav.learner')}</Button>
              <Button variant="ghost" size="sm" className={`rounded-full px-3 md:px-4 h-8 whitespace-nowrap ${role === 'manager' ? 'bg-white shadow-sm' : ''}`} onClick={() => setLocation('/manager')}>Manager</Button>
              <Button variant="ghost" size="sm" className={`rounded-full px-3 md:px-4 h-8 whitespace-nowrap ${role === 'ministry' ? 'bg-white shadow-sm' : ''}`} onClick={() => setLocation('/ministry')}>{t('nav.ministry')}</Button>
              <Button variant="ghost" size="sm" className={`rounded-full px-3 md:px-4 h-8 whitespace-nowrap ${role === 'fahr' ? 'bg-white shadow-sm' : ''}`} onClick={() => setLocation('/fahr')}>{t('nav.fahr')}</Button>
              <Button variant="ghost" size="sm" className={`rounded-full px-3 md:px-4 h-8 whitespace-nowrap ${role === 'leadership' ? 'bg-white shadow-sm' : ''}`} onClick={() => setLocation('/leadership')}>Leadership</Button>
            </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 min-w-0 flex flex-col px-4 md:px-8 py-8">
          {children}
        </main>
      </div>

      <AIConcierge />
    </div>
  );
}
