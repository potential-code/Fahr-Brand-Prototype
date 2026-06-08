import React from "react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/lib/LanguageContext";
import { LayoutDashboard, User, Target, Bot, FlaskConical, Award, ShieldCheck, Globe, Briefcase, FileText, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Layout({ children, role }: { children: React.ReactNode, role: 'learner' | 'ministry' | 'fahr' }) {
  const { language, setLanguage, t } = useLanguage();
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
        ];
      case 'ministry':
        return [
          { href: "/ministry", label: "Dashboard", icon: LayoutDashboard },
          { href: "/ministry/portfolio", label: t("nav.portfolio"), icon: Briefcase },
        ];
      case 'fahr':
        return [
          { href: "/fahr", label: "Dashboard", icon: LayoutDashboard },
          { href: "/fahr/governance", label: t("nav.governance"), icon: ShieldCheck },
        ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      {/* Global Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side={language === 'ar' ? 'right' : 'left'} className="w-[250px]">
                <div className="flex flex-col gap-6 mt-8">
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link key={link.href} href={link.href}>
                        <a className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${location === link.href ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`} onClick={() => {}}>
                          <Icon className="h-5 w-5" />
                          <span>{link.label}</span>
                        </a>
                      </Link>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
            
            <Link href="/">
              <img src={`${import.meta.env.BASE_URL}brand/fahr-logo.png`} alt="FAHR Logo" className="h-10 cursor-pointer object-contain" />
            </Link>
            <div className="hidden md:block">
              <h1 className="text-sm font-semibold text-primary leading-tight">
                Federal Agentic AI<br />Learning & Skilling Platform
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden md:flex items-center bg-muted rounded-full p-1 border border-border">
              <Button variant="ghost" size="sm" className={`rounded-full px-4 h-8 ${role === 'learner' ? 'bg-white shadow-sm' : ''}`} onClick={() => setLocation('/learner')}>{t('nav.learner')}</Button>
              <Button variant="ghost" size="sm" className={`rounded-full px-4 h-8 ${role === 'ministry' ? 'bg-white shadow-sm' : ''}`} onClick={() => setLocation('/ministry')}>{t('nav.ministry')}</Button>
              <Button variant="ghost" size="sm" className={`rounded-full px-4 h-8 ${role === 'fahr' ? 'bg-white shadow-sm' : ''}`} onClick={() => setLocation('/fahr')}>{t('nav.fahr')}</Button>
            </div>
            
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}>
              <Globe className="h-4 w-4" />
              <span>{language === 'en' ? 'العربية' : 'English'}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex flex-col md:flex-row container mx-auto px-4 py-8 gap-8">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden md:flex w-64 flex-col gap-2 flex-shrink-0">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location === link.href;
            return (
              <Button
                key={link.href}
                variant={isActive ? "default" : "ghost"}
                className={`justify-start gap-3 w-full ${language === 'ar' ? 'flex-row-reverse' : ''}`}
                onClick={() => setLocation(link.href)}
              >
                <Icon className="h-4 w-4" />
                <span>{link.label}</span>
              </Button>
            );
          })}
        </aside>

        {/* Page Content */}
        <main className="flex-1 min-w-0 flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}
