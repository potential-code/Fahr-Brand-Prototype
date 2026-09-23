import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "ar";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  /**
   * Looks up `key` in the current language and, if `params` is given,
   * replaces each `{{name}}` placeholder in the translated string with the
   * matching value. Interpolating this way — rather than assembling a
   * sentence out of concatenated fragments — keeps the whole sentence, word
   * order included, inside one translatable string per language.
   */
  t: (key: string, params?: Record<string, string | number>) => string;
}

const translations = {
  en: {
    "nav.learner": "Learner",
    "nav.ministry": "Ministry Admin",
    "nav.fahr": "FAHR Admin",
    "nav.profile": "Capability Profile",
    "nav.mission": "Learning Pathway",
    "nav.lab": "Agentic AI Lab",
    "nav.evaluation": "Project Evaluation",
    "nav.recognition": "Recognition",
    "nav.community": "Community",
    "nav.events": "Workshops & Events",
    "nav.portfolio": "Project Portfolio",
    "nav.governance": "Governance & Audit",
    "btn.start": "Continue my pathway",
    "btn.twin": "Continue AI Digital Twin",
    "btn.lab": "Open Agentic AI Lab",
    "btn.submit": "Submit Workplace Project",

    // --- Landing page (Task 19: keys + English; Task 20: Arabic copy) ---
    // Header
    "landing.header.logoAlt": "Federal Authority for Government Human Resources",
    "landing.header.backToTop": "Back to top",
    "landing.header.nav.pathways": "Pathways",
    "landing.header.nav.journey": "Journey",
    "landing.header.nav.ecosystem": "Ecosystem",
    "landing.header.nav.lab": "AI Lab",
    "landing.header.signIn": "Sign In",
    "landing.header.register": "Register",
    "landing.header.menuOpen": "Open menu",
    "landing.header.menuClose": "Close menu",
    // Hero
    "landing.hero.badge": "UAE Government Executive Platform",
    "landing.hero.headline.line1": "Federal Agentic AI",
    "landing.hero.headline.accent": "Learning & Skilling",
    "landing.hero.headline.line2": "Platform",
    "landing.hero.sub":
      "Equipping {{count}} federal employees with the practical capability, confidence and responsible workflows required for an Agentic AI-enabled government.",
    "landing.hero.ctaPrimary": "Start Your Journey",
    "landing.hero.ctaLogin": "Platform Login",
    "landing.hero.stats.employees": "Federal employees in scope",
    "landing.hero.stats.entities": "Federal entities",
    "landing.hero.stats.agents": "Specialised AI agents",
    "landing.hero.stats.portals": "Role-based portals",
    "landing.hero.scrollAria": "Scroll to pathways",
    "landing.hero.explore": "Explore",
    // Pathways
    "landing.pathways.eyebrow": "Tailored Pathways",
    "landing.pathways.headline.line1": "Select your",
    "landing.pathways.headline.accent": "federal role",
    "landing.pathways.description":
      "Every stakeholder gets their own portal — personalised learning for employees, validation tools for managers, and national oversight for FAHR and federal leadership.",
    "landing.pathways.registerAria": "Register as {{title}}",
    "landing.pathways.accessPortal": "Access portal",
    "landing.pathways.learner.blurb":
      "Build practical AI capability inside your own role, with a coach that adapts every week.",
    "landing.pathways.learner.badge": "Learner",
    "landing.pathways.manager.blurb":
      "See your team's gaps, validate real workplace application and recognise progress.",
    "landing.pathways.manager.badge": "Department manager",
    "landing.pathways.entity.blurb":
      "Run adoption across departments — cohorts, content, approvals and governance.",
    "landing.pathways.entity.badge": "Entity admin",
    "landing.pathways.fahrTeam.blurb":
      "Operate the national programme: entities, credentials, escalations and integrations.",
    "landing.pathways.fahrTeam.badge": "Programme team",
    "landing.pathways.leadership.blurb":
      "Track national readiness, value created and where intervention is needed next.",
    "landing.pathways.leadership.badge": "Leadership",
    // Journey
    "landing.journey.eyebrow": "The Learner Journey",
    "landing.journey.headline.line1": "Six stages,",
    "landing.journey.headline.accent": "one continuous",
    "landing.journey.headline.line2": "experience",
    "landing.journey.description":
      "Every federal employee follows the same guided arc — from an AI-informed understanding of their role, through personalised learning and real workplace application, to validated capability and measurable impact.",
    "landing.journey.diagramAlt":
      "Diagram of the six-stage FAHR learner journey, running from onboarding and profiling through to recognition and measurable impact.",
    "landing.journey.outcomes.baseline.title": "An AI-informed baseline",
    "landing.journey.outcomes.baseline.body":
      "Every employee starts from an assessed position against the federal capability ladder — not a generic course list.",
    "landing.journey.outcomes.applied.title": "Applied to real work",
    "landing.journey.outcomes.applied.body":
      "Capability is practised in a sandbox, then applied to a workplace project their department manager can see.",
    "landing.journey.outcomes.validated.title": "Validated and recognised",
    "landing.journey.outcomes.validated.body":
      "Evidence is reviewed, credentials are issued, and the impact rolls up to entity and federal reporting.",
    "landing.journey.cta": "Walk through the journey",
    // Ecosystem
    "landing.ecosystem.eyebrow": "The Capability Ecosystem",
    "landing.ecosystem.headline.line1": "Powered by",
    "landing.ecosystem.headline.accent": "six AI agents",
    "landing.ecosystem.description":
      "Move beyond static courses. A suite of specialised agents provides continuous coaching, dynamic content, safe practice and real-time evaluation — embedded in the flow of work.",
    "landing.ecosystem.agentLabel": "Agent",
    "landing.ecosystem.presentIn": "Present in",
    "landing.ecosystem.sampleOutput": "Sample output",
    "landing.ecosystem.generatedNote": "Generated in the flow of work, in Arabic or English",
    "landing.ecosystem.footnote":
      "All six agents operate inside every portal, under UAE federal data and responsible-AI standards.",
    // Lab
    "landing.lab.points.simulate": "Safely simulate entity-specific scenarios",
    "landing.lab.points.collaborate": "Collaborate with the {{agent}}",
    "landing.lab.points.translate": "Translate capability into real efficiency gains",
    "landing.lab.points.governed": "Governed by UAE data privacy standards",
    "landing.lab.imageAlt": "Federal employees working in the Agentic AI Lab",
    "landing.lab.sandboxActive": "SECURE SANDBOX ACTIVE",
    "landing.lab.eyebrow": "Practical Application",
    "landing.lab.headline.line1": "The Agentic AI Lab",
    "landing.lab.headline.accent": "& Digital Twin",
    "landing.lab.description":
      "Learning becomes measurable outcomes. The Lab is a secure, sandboxed environment where federal employees build, test and refine real agentic workflows — without touching production data.",
    "landing.lab.stats.twins": "AI digital twins built",
    "landing.lab.stats.projects": "Workplace projects submitted",
    "landing.lab.stats.hours": "Hours saved each month",
    // CTA
    "landing.cta.headline.line1": "Ready to accelerate",
    "landing.cta.headline.accent": "your AI journey?",
    "landing.cta.description":
      "Join the UAE's unified platform for artificial intelligence capability building across the federal government.",
    "landing.cta.ctaPrimary": "Register for access",
    "landing.cta.ctaSecondary": "I already have an account",
    "landing.cta.assurances.governance": "Federal governance built in",
    "landing.cta.assurances.residency": "UAE data residency",
    "landing.cta.assurances.pdpl": "PDPL-aligned",
    "landing.cta.assurances.bilingual": "Arabic and English",
    // Footer
    "landing.footer.logoAlt": "Federal Authority for Government Human Resources",
    "landing.footer.blurb":
      "Empowering federal government employees with the capability required for an AI-enabled future — across {{entities}} entities and {{employees}} employees.",
    "landing.footer.platformHeading": "Platform",
    "landing.footer.links.pathways": "Pathways",
    "landing.footer.links.journey": "Learner journey",
    "landing.footer.links.ecosystem": "AI agents",
    "landing.footer.links.lab": "AI Lab",
    "landing.footer.portalsHeading": "Portals",
    "landing.footer.accessHeading": "Access",
    "landing.footer.signIn": "Sign in",
    "landing.footer.register": "Register",
    "landing.footer.responsibleAi": "Responsible AI",
    "landing.footer.copyright":
      "© {{year}} Federal Authority for Government Human Resources. All rights reserved.",
    "landing.footer.backToTop": "Back to top",
  },
  ar: {
    "nav.learner": "المتعلم",
    "nav.ministry": "مدير الوزارة",
    "nav.fahr": "مدير الهيئة",
    "nav.profile": "ملف القدرات",
    "nav.mission": "مسار التعلم",
    "nav.lab": "مختبر الذكاء الاصطناعي",
    "nav.evaluation": "تقييم المشروع",
    "nav.recognition": "التقدير",
    "nav.community": "المجتمع",
    "nav.events": "ورش العمل والفعاليات",
    "nav.portfolio": "محفظة المشاريع",
    "nav.governance": "الحوكمة والتدقيق",
    "btn.start": "تابع مسار التعلم",
    "btn.twin": "متابعة التوأم الرقمي الذكي",
    "btn.lab": "افتح مختبر الذكاء الاصطناعي",
    "btn.submit": "تسليم المشروع التطبيقي",

    // --- Landing page ---
    // Stubbed to the English strings for Task 19 (plumbing). Task 20 replaces
    // every value below with Modern Standard Arabic — do not ship these as-is.
    "landing.header.logoAlt": "Federal Authority for Government Human Resources",
    "landing.header.backToTop": "Back to top",
    "landing.header.nav.pathways": "Pathways",
    "landing.header.nav.journey": "Journey",
    "landing.header.nav.ecosystem": "Ecosystem",
    "landing.header.nav.lab": "AI Lab",
    "landing.header.signIn": "Sign In",
    "landing.header.register": "Register",
    "landing.header.menuOpen": "Open menu",
    "landing.header.menuClose": "Close menu",
    "landing.hero.badge": "UAE Government Executive Platform",
    "landing.hero.headline.line1": "Federal Agentic AI",
    "landing.hero.headline.accent": "Learning & Skilling",
    "landing.hero.headline.line2": "Platform",
    "landing.hero.sub":
      "Equipping {{count}} federal employees with the practical capability, confidence and responsible workflows required for an Agentic AI-enabled government.",
    "landing.hero.ctaPrimary": "Start Your Journey",
    "landing.hero.ctaLogin": "Platform Login",
    "landing.hero.stats.employees": "Federal employees in scope",
    "landing.hero.stats.entities": "Federal entities",
    "landing.hero.stats.agents": "Specialised AI agents",
    "landing.hero.stats.portals": "Role-based portals",
    "landing.hero.scrollAria": "Scroll to pathways",
    "landing.hero.explore": "Explore",
    "landing.pathways.eyebrow": "Tailored Pathways",
    "landing.pathways.headline.line1": "Select your",
    "landing.pathways.headline.accent": "federal role",
    "landing.pathways.description":
      "Every stakeholder gets their own portal — personalised learning for employees, validation tools for managers, and national oversight for FAHR and federal leadership.",
    "landing.pathways.registerAria": "Register as {{title}}",
    "landing.pathways.accessPortal": "Access portal",
    "landing.pathways.learner.blurb":
      "Build practical AI capability inside your own role, with a coach that adapts every week.",
    "landing.pathways.learner.badge": "Learner",
    "landing.pathways.manager.blurb":
      "See your team's gaps, validate real workplace application and recognise progress.",
    "landing.pathways.manager.badge": "Department manager",
    "landing.pathways.entity.blurb":
      "Run adoption across departments — cohorts, content, approvals and governance.",
    "landing.pathways.entity.badge": "Entity admin",
    "landing.pathways.fahrTeam.blurb":
      "Operate the national programme: entities, credentials, escalations and integrations.",
    "landing.pathways.fahrTeam.badge": "Programme team",
    "landing.pathways.leadership.blurb":
      "Track national readiness, value created and where intervention is needed next.",
    "landing.pathways.leadership.badge": "Leadership",
    "landing.journey.eyebrow": "The Learner Journey",
    "landing.journey.headline.line1": "Six stages,",
    "landing.journey.headline.accent": "one continuous",
    "landing.journey.headline.line2": "experience",
    "landing.journey.description":
      "Every federal employee follows the same guided arc — from an AI-informed understanding of their role, through personalised learning and real workplace application, to validated capability and measurable impact.",
    "landing.journey.diagramAlt":
      "Diagram of the six-stage FAHR learner journey, running from onboarding and profiling through to recognition and measurable impact.",
    "landing.journey.outcomes.baseline.title": "An AI-informed baseline",
    "landing.journey.outcomes.baseline.body":
      "Every employee starts from an assessed position against the federal capability ladder — not a generic course list.",
    "landing.journey.outcomes.applied.title": "Applied to real work",
    "landing.journey.outcomes.applied.body":
      "Capability is practised in a sandbox, then applied to a workplace project their department manager can see.",
    "landing.journey.outcomes.validated.title": "Validated and recognised",
    "landing.journey.outcomes.validated.body":
      "Evidence is reviewed, credentials are issued, and the impact rolls up to entity and federal reporting.",
    "landing.journey.cta": "Walk through the journey",
    "landing.ecosystem.eyebrow": "The Capability Ecosystem",
    "landing.ecosystem.headline.line1": "Powered by",
    "landing.ecosystem.headline.accent": "six AI agents",
    "landing.ecosystem.description":
      "Move beyond static courses. A suite of specialised agents provides continuous coaching, dynamic content, safe practice and real-time evaluation — embedded in the flow of work.",
    "landing.ecosystem.agentLabel": "Agent",
    "landing.ecosystem.presentIn": "Present in",
    "landing.ecosystem.sampleOutput": "Sample output",
    "landing.ecosystem.generatedNote": "Generated in the flow of work, in Arabic or English",
    "landing.ecosystem.footnote":
      "All six agents operate inside every portal, under UAE federal data and responsible-AI standards.",
    "landing.lab.points.simulate": "Safely simulate entity-specific scenarios",
    "landing.lab.points.collaborate": "Collaborate with the {{agent}}",
    "landing.lab.points.translate": "Translate capability into real efficiency gains",
    "landing.lab.points.governed": "Governed by UAE data privacy standards",
    "landing.lab.imageAlt": "Federal employees working in the Agentic AI Lab",
    "landing.lab.sandboxActive": "SECURE SANDBOX ACTIVE",
    "landing.lab.eyebrow": "Practical Application",
    "landing.lab.headline.line1": "The Agentic AI Lab",
    "landing.lab.headline.accent": "& Digital Twin",
    "landing.lab.description":
      "Learning becomes measurable outcomes. The Lab is a secure, sandboxed environment where federal employees build, test and refine real agentic workflows — without touching production data.",
    "landing.lab.stats.twins": "AI digital twins built",
    "landing.lab.stats.projects": "Workplace projects submitted",
    "landing.lab.stats.hours": "Hours saved each month",
    "landing.cta.headline.line1": "Ready to accelerate",
    "landing.cta.headline.accent": "your AI journey?",
    "landing.cta.description":
      "Join the UAE's unified platform for artificial intelligence capability building across the federal government.",
    "landing.cta.ctaPrimary": "Register for access",
    "landing.cta.ctaSecondary": "I already have an account",
    "landing.cta.assurances.governance": "Federal governance built in",
    "landing.cta.assurances.residency": "UAE data residency",
    "landing.cta.assurances.pdpl": "PDPL-aligned",
    "landing.cta.assurances.bilingual": "Arabic and English",
    "landing.footer.logoAlt": "Federal Authority for Government Human Resources",
    "landing.footer.blurb":
      "Empowering federal government employees with the capability required for an AI-enabled future — across {{entities}} entities and {{employees}} employees.",
    "landing.footer.platformHeading": "Platform",
    "landing.footer.links.pathways": "Pathways",
    "landing.footer.links.journey": "Learner journey",
    "landing.footer.links.ecosystem": "AI agents",
    "landing.footer.links.lab": "AI Lab",
    "landing.footer.portalsHeading": "Portals",
    "landing.footer.accessHeading": "Access",
    "landing.footer.signIn": "Sign in",
    "landing.footer.register": "Register",
    "landing.footer.responsibleAi": "Responsible AI",
    "landing.footer.copyright":
      "© {{year}} Federal Authority for Government Human Resources. All rights reserved.",
    "landing.footer.backToTop": "Back to top",
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string, params?: Record<string, string | number>) => {
    const value = (translations as any)[language][key] || key;
    if (!params) return value;
    return Object.entries(params).reduce(
      (acc, [name, replacement]) => acc.split(`{{${name}}}`).join(String(replacement)),
      value as string,
    );
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
