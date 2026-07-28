import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "ar";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    "nav.learner": "Learner",
    "nav.ministry": "Ministry Admin",
    "nav.fahr": "FAHR Admin",
    "nav.profile": "Capability Profile",
    "nav.mission": "Learning Pathway",
    "nav.agent": "AI Learning Coach",
    "nav.lab": "Agentic AI Lab",
    "nav.evaluation": "Evaluation",
    "nav.recognition": "Recognition",
    "nav.portfolio": "Project Portfolio",
    "nav.governance": "Governance & Audit",
    "btn.start": "Continue my pathway",
    "btn.twin": "Continue AI Digital Twin",
    "btn.lab": "Open Agentic AI Lab",
    "btn.submit": "Submit Workplace Project",
  },
  ar: {
    "nav.learner": "المتعلم",
    "nav.ministry": "مدير الوزارة",
    "nav.fahr": "مدير الهيئة",
    "nav.profile": "ملف القدرات",
    "nav.mission": "مسار التعلم",
    "nav.agent": "مدرب التعلم الذكي",
    "nav.lab": "مختبر الذكاء الاصطناعي",
    "nav.evaluation": "التقييم",
    "nav.recognition": "التقدير",
    "nav.portfolio": "محفظة المشاريع",
    "nav.governance": "الحوكمة والتدقيق",
    "btn.start": "تابع مسار التعلم",
    "btn.twin": "متابعة التوأم الرقمي الذكي",
    "btn.lab": "افتح مختبر الذكاء الاصطناعي",
    "btn.submit": "تسليم المشروع التطبيقي",
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string) => {
    return (translations as any)[language][key] || key;
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
