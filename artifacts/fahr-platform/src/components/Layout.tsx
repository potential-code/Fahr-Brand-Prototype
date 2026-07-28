import React from "react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/lib/LanguageContext";
import { LayoutDashboard, User, Target, Bot, FlaskConical, Award, ShieldCheck, Globe, Briefcase, Menu, LogOut, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AIConcierge } from "@/components/AIConcierge";
import { Users } from "lucide-react";

type Role = 'learner' | 'manager' | 'ministry' | 'fahr' | 'leadership';

const ROLE_LABELS: Record<Role, string> = {
  learner: "Federal Employee",
  manager: "Line Manager",
  ministry: "Entity Admin",
  fahr: "FAHR Programme Team",
  leadership: "Federal Leadership",
};

export function Layout({ children, role }: { children: React.ReactNode, role: Role }) {
  const { language, t } = useLanguage();
  const [location, setLocation] = useLocation();

  const getNavLinks = () => {
    switch (role) {
      case 'learner':
        return [
          { href: "/learner", label: "Dashboard", icon: LayoutDashboard },
          { href: "/learner/profile", label: t("nav.profile"), icon: User },
          { href: "/learner/mission", label: t("nav.mission"), icon: Target },
          { href: "/learner/agent", label: t("nav.agent"), icon: Bot },
          { href: "/learner/lab/twin", label: t("nav.lab"), icon: FlaskConical },
          { href: "/learner/recognition", label: t("nav.recognition"), icon: Award },
          { href: "/learner/community", label: "Community", icon: Users },
        ];
      case 'manager':
        return [
          { href: "/manager", label: "Team Dashboard", icon: LayoutDashboard },
        ];
      case 'ministry':
        return [
          { href: "/ministry", label: "Dashboard", icon: LayoutDashboard },
          { href: "/ministry/cohorts", label: "Cohorts & Programmes", icon: Users },
          { href: "/ministry/portfolio", label: t("nav.portfolio"), icon: Briefcase },
        ];
      case 'fahr':
        return [
          { href: "/fahr", label: "Dashboard", icon: LayoutDashboard },
          { href: "/fahr/governance", label: t("nav.governance"), icon: ShieldCheck },
        ];
      case 'leadership':
        return [
          { href: "/leadership", label: "National Overview", icon: Landmark },
        ];
    }
  };

  const navLinks = getNavLinks();

  const renderNavItems = (onNavigate?: () => void) => (
    <nav className="flex flex-col gap-1">
      {navLinks.map((link) => {
        const Icon = link.icon;
        const isActive = location === link.href;
        return (
          <button
            key={link.href}
            onClick={() => { setLocation(link.href); onNavigate?.(); }}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-sidebar-foreground hover:bg-sidebar-accent"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{link.label}</span>
          </button>
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
            <img src={`${import.meta.env.BASE_URL}brand/fahr-logo.png`} alt="FAHR Logo" className="h-11 cursor-pointer object-contain" />
          </Link>
        </div>
        <div className="px-5 pt-5 pb-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Current Role</p>
          <p className="text-sm font-bold text-primary mt-0.5">{ROLE_LABELS[role]}</p>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pt-2">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Menu</p>
          {renderNavItems()}
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
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] p-0 bg-sidebar flex flex-col">
                  <div className="px-5 pt-6 pb-4 border-b border-sidebar-border">
                    <img src={`${import.meta.env.BASE_URL}brand/fahr-logo.png`} alt="FAHR Logo" className="h-10 object-contain" />
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mt-4">Current Role</p>
                    <p className="text-sm font-bold text-primary mt-0.5">{ROLE_LABELS[role]}</p>
                  </div>
                  <div className="flex-1 overflow-y-auto px-3 pt-4">
                    {renderNavItems()}
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

            {/* Demo role switcher */}
            <div className="flex items-center overflow-x-auto bg-muted rounded-full p-1 border border-border">
              <Button variant="ghost" size="sm" className={`rounded-full px-3 md:px-4 h-8 whitespace-nowrap ${role === 'learner' ? 'bg-white shadow-sm' : ''}`} onClick={() => setLocation('/learner')}>{t('nav.learner')}</Button>
              <Button variant="ghost" size="sm" className={`rounded-full px-3 md:px-4 h-8 whitespace-nowrap ${role === 'manager' ? 'bg-white shadow-sm' : ''}`} onClick={() => setLocation('/manager')}>Manager</Button>
              <Button variant="ghost" size="sm" className={`rounded-full px-3 md:px-4 h-8 whitespace-nowrap ${role === 'ministry' ? 'bg-white shadow-sm' : ''}`} onClick={() => setLocation('/ministry')}>{t('nav.ministry')}</Button>
              <Button variant="ghost" size="sm" className={`rounded-full px-3 md:px-4 h-8 whitespace-nowrap ${role === 'fahr' ? 'bg-white shadow-sm' : ''}`} onClick={() => setLocation('/fahr')}>{t('nav.fahr')}</Button>
              <Button variant="ghost" size="sm" className={`rounded-full px-3 md:px-4 h-8 whitespace-nowrap ${role === 'leadership' ? 'bg-white shadow-sm' : ''}`} onClick={() => setLocation('/leadership')}>Leadership</Button>
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
