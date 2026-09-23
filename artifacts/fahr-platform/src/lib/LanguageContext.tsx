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

    // --- Landing: ecosystem journey-stage labels (agents.ts, EcosystemSection) ---
    "landing.ecosystem.stages.onboarding": "Onboarding",
    "landing.ecosystem.stages.personalisedPathway": "Personalised pathway",
    "landing.ecosystem.stages.experientialLearning": "Experiential learning",
    "landing.ecosystem.stages.buildTrain": "Build & train",
    "landing.ecosystem.stages.assessValidate": "Assess & validate",
    "landing.ecosystem.stages.recognitionImpact": "Recognition & impact",

    // --- Landing: the six (plus one supporting) specialised agents (agents.ts) ---
    // `name` is always a passthrough — resolved as
    // `t(nameKey, { name: AGENTS[key] })` — so the landing page's agent names
    // can never drift from `AGENTS` in `@/lib/constants`. Task 20 may replace
    // it with a literal Arabic name (the interpolation param is then simply
    // unused) rather than translate the passthrough itself.
    "landing.agents.capability.name": "{{name}}",
    "landing.agents.capability.tagline": "Maps role to capability",
    "landing.agents.capability.description":
      "Recommends the pathway that matches the federal role, the entity's priorities and the capability ladder.",
    "landing.agents.capability.sample":
      "For a Marketing Specialist in a federal communications team, the fastest route to Practitioner is Prompting for Campaign Copy, then Data Summarisation, then Responsible AI Review.",
    "landing.agents.capability.capabilities.0": "Role-aware pathways",
    "landing.agents.capability.capabilities.1": "Aligned to the ladder",
    "landing.agents.learning.name": "{{name}}",
    "landing.agents.learning.tagline": "Guides the individual",
    "landing.agents.learning.description":
      "Interprets assessment outcomes and turns them into a weekly plan the employee can actually follow.",
    "landing.agents.learning.sample":
      "Your baseline puts you at Emerging Practitioner. Prompt design is your strength; oversight of AI output is the gap. I have put a 20-minute human-in-the-loop module at the top of this week.",
    "landing.agents.learning.capabilities.0": "Reads every assessment",
    "landing.agents.learning.capabilities.1": "Replans as you progress",
    "landing.agents.assessment.name": "{{name}}",
    "landing.agents.assessment.tagline": "Sets and marks the test",
    "landing.agents.assessment.description":
      "Prepares the pre- and post-assessment for each pathway, then evaluates capability progression and the quality of the work delivered.",
    "landing.agents.assessment.sample":
      "Your pre-assessment put prompt design ahead of oversight, so the post-assessment weights oversight twice. Implementation quality 4/5: the workflow has a named approver and a fallback, but nothing measuring what it saved.",
    "landing.agents.assessment.capabilities.0": "Pre- and post-assessment",
    "landing.agents.assessment.capabilities.1": "Rubric with a reasoning trace",
    "landing.agents.content.name": "{{name}}",
    "landing.agents.content.tagline": "Builds the material",
    "landing.agents.content.description":
      "Builds the learning-path content from the courses entity admins create, and generates extra scenarios, cases and knowledge checks on demand, in Arabic and English.",
    "landing.agents.content.sample":
      "Your entity admin published three courses this month. I have sequenced two of them into your pathway and generated a six-step case study on your public-awareness campaign, with an Arabic version and a knowledge check.",
    "landing.agents.content.capabilities.0": "Builds from admin courses",
    "landing.agents.content.capabilities.1": "Bilingual by default",
    "landing.agents.coaching.name": "{{name}}",
    "landing.agents.coaching.tagline": "Always on hand",
    "landing.agents.coaching.description":
      "Navigates the platform, chases what is outstanding and answers questions in the flow of work.",
    "landing.agents.coaching.sample":
      "You have two workplace submissions waiting on your department manager and one credential ready to claim. Shall I open the validations, or your certificate on Recognition?",
    "landing.agents.coaching.capabilities.0": "Context-aware answers",
    "landing.agents.coaching.capabilities.1": "Follows up for you",
    "landing.agents.analytics.name": "{{name}}",
    "landing.agents.analytics.tagline": "Answers to leadership",
    "landing.agents.analytics.description":
      "Rolls individual capability up to department, entity and federal level for managers, entity admins and leadership.",
    // Two sentences, not one: `sample` is always shown; `sampleGap` is an
    // optional second sentence appended only when a national capability gap
    // exists (see `agents.ts`'s `sample` resolver). Keeping them separate
    // lets Task 20 translate each as a whole sentence in its own right.
    "landing.agents.analytics.sample":
      "National readiness is at {{readiness}}, with {{onTrack}} of {{total}} entities on track.",
    "landing.agents.analytics.sampleGap":
      " {{ministries}} entities name {{competency}} as their biggest capability gap.",
    "landing.agents.analytics.capabilities.0": "Individual to federal roll-up",
    "landing.agents.analytics.capabilities.1": "Briefing-ready outputs",
    // Not currently rendered anywhere (see agents.ts) — kept keyed for type
    // consistency and so it is translation-ready if it becomes rendered.
    "landing.agents.practice.name": "{{name}}",
    "landing.agents.practice.tagline": "Safe place to try",
    "landing.agents.practice.description":
      "Runs simulated workplace scenarios and digital twins so capability is practised before it is used on real work.",
    "landing.agents.practice.sample":
      "Scenario: a resident disputes an AI-drafted reply from your department. Draft your response and I will score it against the federal responsible-AI checklist, line by line.",
    "landing.agents.practice.capabilities.0": "Sandboxed scenarios",
    "landing.agents.practice.capabilities.1": "Scored against policy",

    // --- Landing: role titles (roles.ts) ---
    // `STAKEHOLDERS` in `@/lib/constants` stays English (shared with the
    // app); these are the landing page's own copy of the same five titles,
    // used by PathwaysSection, LandingFooter and RegistrationDialog.
    "landing.pathways.learner.title": "Federal Employee / Learner",
    "landing.pathways.manager.title": "Department Manager",
    "landing.pathways.entity.title": "Entity Admin",
    "landing.pathways.fahrTeam.title": "FAHR Programme Team",
    "landing.pathways.leadership.title": "Federal Leadership",

    // --- Landing: registration dialog (RegistrationDialog.tsx) ---
    "landing.registration.nameLabel": "Full Name",
    "landing.registration.namePlaceholder": "E.g. Aisha Al Mansoori",
    "landing.registration.emailLabel": "Government Email",
    "landing.registration.emailPlaceholder": "aisha@mohap.gov.ae",
    "landing.registration.entityLabel": "Federal Entity",
    "landing.registration.entityPlaceholder": "Select your entity",
    "landing.registration.entities.mohap": "Ministry of Health and Prevention",
    "landing.registration.entities.moe": "Ministry of Education",
    "landing.registration.entities.mof": "Ministry of Finance",
    "landing.registration.entities.moei": "Ministry of Economy",
    "landing.registration.entities.fahr": "FAHR",
    "landing.registration.jobTitleLabel": "Job Title",
    "landing.registration.learner.jobTitlePlaceholder": "E.g. Marketing Specialist",
    "landing.registration.manager.jobTitlePlaceholder": "E.g. Head of Digital Communications",
    "landing.registration.manager.teamSizeLabel": "Team Size",
    "landing.registration.manager.teamSizePlaceholder": "E.g. 5",
    "landing.registration.entity.adminCodeLabel": "Admin Access Code",
    "landing.registration.entity.adminCodePlaceholder": "••••••••",
    "landing.registration.fahrTeam.programmeIdLabel": "FAHR Programme ID",
    "landing.registration.fahrTeam.programmeIdPlaceholder": "E.g. FAHR-2026-X",
    "landing.registration.leadership.execTitleLabel": "Executive Title",
    "landing.registration.leadership.execTitlePlaceholder": "E.g. Undersecretary",
    "landing.registration.doneTitle": "Registration complete",
    "landing.registration.doneDescription": "Your profile has been provisioned. Opening your workspace…",
    "landing.registration.createProfileTitle": "Create profile",
    "landing.registration.registeringAs": "Registering as {{title}}",
    "landing.registration.fallbackRole": "a federal user",
    "landing.registration.cancel": "Cancel",
    "landing.registration.submit": "Access platform",
    "landing.registration.submitting": "Provisioning…",
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

    // --- Landing page (Arabic, Task 20) ---
    // Modern Standard Arabic, UAE federal government register.
    // Machine-written — not yet reviewed by a native speaker.
    // Header
    "landing.header.logoAlt": "الهيئة الاتحادية للموارد البشرية الحكومية",
    "landing.header.backToTop": "العودة إلى الأعلى",
    "landing.header.nav.pathways": "المسارات",
    "landing.header.nav.journey": "الرحلة",
    "landing.header.nav.ecosystem": "المنظومة",
    "landing.header.nav.lab": "المختبر الذكي",
    "landing.header.signIn": "تسجيل الدخول",
    "landing.header.register": "التسجيل",
    "landing.header.menuOpen": "فتح القائمة",
    "landing.header.menuClose": "إغلاق القائمة",
    // Hero
    "landing.hero.badge": "منصة تنفيذية لحكومة دولة الإمارات",
    "landing.hero.headline.line1": "المنصة الاتحادية",
    "landing.hero.headline.accent": "للتعلم والتأهيل",
    "landing.hero.headline.line2": "في الذكاء الاصطناعي",
    "landing.hero.sub":
      "تزويد {{count}} موظف اتحادي بالقدرات العملية والثقة وأساليب العمل المسؤولة التي تتطلبها حكومة ممكّنة بالذكاء الاصطناعي.",
    "landing.hero.ctaPrimary": "ابدأ رحلتك",
    "landing.hero.ctaLogin": "الدخول إلى المنصة",
    "landing.hero.stats.employees": "الموظفون الاتحاديون المشمولون",
    "landing.hero.stats.entities": "الجهات الاتحادية",
    "landing.hero.stats.agents": "وكلاء ذكاء اصطناعي متخصصون",
    "landing.hero.stats.portals": "بوابات حسب الدور",
    "landing.hero.scrollAria": "انتقل إلى المسارات",
    "landing.hero.explore": "استكشف",
    // Pathways
    "landing.pathways.eyebrow": "مسارات مخصصة",
    "landing.pathways.headline.line1": "اختر",
    "landing.pathways.headline.accent": "دورك الاتحادي",
    "landing.pathways.description":
      "لكل فئة بوابتها الخاصة: تعلّم مخصص للموظفين، وأدوات تحقق للمديرين، وإشراف وطني للهيئة والقيادات الاتحادية.",
    "landing.pathways.registerAria": "التسجيل بصفة {{title}}",
    "landing.pathways.accessPortal": "الدخول إلى البوابة",
    "landing.pathways.learner.blurb":
      "ابنِ قدرات عملية في الذكاء الاصطناعي داخل دورك نفسه، مع مدرّب يتكيّف معك كل أسبوع.",
    "landing.pathways.learner.badge": "متعلم",
    "landing.pathways.manager.blurb":
      "اطّلع على فجوات فريقك، وتحقّق من التطبيق الفعلي في العمل، وقدّر التقدّم المحرز.",
    "landing.pathways.manager.badge": "مدير إدارة",
    "landing.pathways.entity.blurb":
      "أدِر التبنّي عبر الإدارات: الدفعات والمحتوى والموافقات والحوكمة.",
    "landing.pathways.entity.badge": "مدير الجهة",
    "landing.pathways.fahrTeam.blurb":
      "شغّل البرنامج الوطني: الجهات والاعتمادات والتصعيدات والتكاملات.",
    "landing.pathways.fahrTeam.badge": "فريق البرنامج",
    "landing.pathways.leadership.blurb":
      "تابع الجاهزية الوطنية والقيمة المتحققة والمواضع التي تحتاج إلى تدخّل.",
    "landing.pathways.leadership.badge": "القيادة",
    // Journey
    "landing.journey.eyebrow": "رحلة المتعلم",
    "landing.journey.headline.line1": "ست مراحل،",
    "landing.journey.headline.accent": "تجربة واحدة",
    "landing.journey.headline.line2": "متصلة",
    "landing.journey.description":
      "يسير كل موظف اتحادي في المسار الموجّه نفسه: من فهم دوره بدعم الذكاء الاصطناعي، مرورًا بالتعلم المخصص والتطبيق الفعلي في العمل، وصولًا إلى قدرات موثّقة وأثر قابل للقياس.",
    "landing.journey.diagramAlt":
      "رسم توضيحي لرحلة المتعلم في الهيئة بمراحلها الست، من التهيئة وبناء الملف وصولًا إلى التقدير والأثر القابل للقياس.",
    "landing.journey.outcomes.baseline.title": "خط أساس مبني على الذكاء الاصطناعي",
    "landing.journey.outcomes.baseline.body":
      "يبدأ كل موظف من موقع مُقيَّم على سلّم القدرات الاتحادي، لا من قائمة دورات عامة.",
    "landing.journey.outcomes.applied.title": "تطبيق على العمل الحقيقي",
    "landing.journey.outcomes.applied.body":
      "تُمارَس القدرات في بيئة اختبار آمنة، ثم تُطبَّق في مشروع تطبيقي يطّلع عليه مدير الإدارة.",
    "landing.journey.outcomes.validated.title": "تحقّق وتقدير",
    "landing.journey.outcomes.validated.body":
      "تُراجَع الأدلة، وتُصدَر الاعتمادات، ويُجمَّع الأثر في تقارير الجهة والتقارير الاتحادية.",
    "landing.journey.cta": "استعرض مراحل الرحلة",
    // Ecosystem
    "landing.ecosystem.eyebrow": "منظومة القدرات",
    "landing.ecosystem.headline.line1": "تشغّلها",
    "landing.ecosystem.headline.accent": "ستة وكلاء أذكياء",
    "landing.ecosystem.description":
      "تجاوُز الدورات الجامدة: مجموعة من الوكلاء المتخصصين توفّر إرشادًا مستمرًا ومحتوى متجددًا وتطبيقًا آمنًا وتقييمًا فوريًا، ضمن سياق العمل اليومي.",
    "landing.ecosystem.agentLabel": "وكيل ذكي",
    "landing.ecosystem.presentIn": "حاضر في",
    "landing.ecosystem.sampleOutput": "نموذج من المخرجات",
    "landing.ecosystem.generatedNote": "يُنتَج ضمن سياق العمل، بالعربية أو الإنجليزية",
    "landing.ecosystem.footnote":
      "يعمل الوكلاء الستة داخل كل بوابة، وفق معايير البيانات الاتحادية والذكاء الاصطناعي المسؤول في دولة الإمارات.",
    // Lab
    "landing.lab.points.simulate": "محاكاة آمنة لسيناريوهات خاصة بجهتك",
    "landing.lab.points.collaborate": "التعاون مع {{agent}}",
    "landing.lab.points.translate": "تحويل القدرات إلى مكاسب كفاءة حقيقية",
    "landing.lab.points.governed": "محكوم بمعايير خصوصية البيانات في دولة الإمارات",
    "landing.lab.imageAlt": "موظفون اتحاديون يعملون في مختبر الذكاء الاصطناعي",
    "landing.lab.sandboxActive": "بيئة الاختبار الآمنة نشطة",
    "landing.lab.eyebrow": "التطبيق العملي",
    "landing.lab.headline.line1": "مختبر الذكاء الاصطناعي",
    "landing.lab.headline.accent": "والتوأم الرقمي الذكي",
    "landing.lab.description":
      "يتحول التعلم إلى نتائج قابلة للقياس. المختبر بيئة اختبار آمنة ومعزولة يبني فيها الموظفون الاتحاديون سير عمل حقيقيًا بالذكاء الاصطناعي ويختبرونه ويحسّنونه، دون المساس ببيانات التشغيل الفعلية.",
    "landing.lab.stats.twins": "توائم رقمية ذكية تم بناؤها",
    "landing.lab.stats.projects": "مشاريع تطبيقية تم تسليمها",
    "landing.lab.stats.hours": "ساعات موفَّرة كل شهر",
    // CTA
    "landing.cta.headline.line1": "هل أنت مستعد لتسريع",
    "landing.cta.headline.accent": "رحلتك في الذكاء الاصطناعي؟",
    "landing.cta.description":
      "انضم إلى منصة دولة الإمارات الموحدة لبناء قدرات الذكاء الاصطناعي في الحكومة الاتحادية.",
    "landing.cta.ctaPrimary": "سجّل للحصول على صلاحية الدخول",
    "landing.cta.ctaSecondary": "لدي حساب بالفعل",
    "landing.cta.assurances.governance": "حوكمة اتحادية مدمجة",
    "landing.cta.assurances.residency": "استضافة البيانات داخل دولة الإمارات",
    "landing.cta.assurances.pdpl": "متوافق مع قانون حماية البيانات الشخصية",
    "landing.cta.assurances.bilingual": "بالعربية والإنجليزية",
    // Footer
    "landing.footer.logoAlt": "الهيئة الاتحادية للموارد البشرية الحكومية",
    "landing.footer.blurb":
      "تمكين موظفي الحكومة الاتحادية بالقدرات اللازمة لمستقبل ممكّن بالذكاء الاصطناعي، عبر {{entities}} جهة و{{employees}} موظف.",
    "landing.footer.platformHeading": "المنصة",
    "landing.footer.links.pathways": "المسارات",
    "landing.footer.links.journey": "رحلة المتعلم",
    "landing.footer.links.ecosystem": "وكلاء الذكاء الاصطناعي",
    "landing.footer.links.lab": "المختبر الذكي",
    "landing.footer.portalsHeading": "البوابات",
    "landing.footer.accessHeading": "الدخول",
    "landing.footer.signIn": "تسجيل الدخول",
    "landing.footer.register": "التسجيل",
    "landing.footer.responsibleAi": "الذكاء الاصطناعي المسؤول",
    "landing.footer.copyright":
      "© {{year}} الهيئة الاتحادية للموارد البشرية الحكومية. جميع الحقوق محفوظة.",
    "landing.footer.backToTop": "العودة إلى الأعلى",

    // --- Landing: ecosystem journey-stage labels ---
    "landing.ecosystem.stages.onboarding": "التهيئة",
    "landing.ecosystem.stages.personalisedPathway": "المسار الشخصي",
    "landing.ecosystem.stages.experientialLearning": "التعلم التطبيقي",
    "landing.ecosystem.stages.buildTrain": "البناء والتدريب",
    "landing.ecosystem.stages.assessValidate": "التقييم والتحقق",
    "landing.ecosystem.stages.recognitionImpact": "التقدير والأثر",

    // --- Landing: the six (plus one supporting) specialised agents ---
    // `name` stays the `{{name}}` passthrough in Arabic too: the agent
    // names come from `AGENTS` in `@/lib/constants`, which is shared with
    // the app and is English there. Translating the passthrough would
    // break the interpolation, so the names render in Latin script.
    "landing.agents.capability.name": "{{name}}",
    "landing.agents.capability.tagline": "يربط الدور بالقدرات",
    "landing.agents.capability.description":
      "يوصي بمسار التعلم الذي يناسب الدور الاتحادي وأولويات الجهة وسلّم القدرات.",
    "landing.agents.capability.sample":
      "بالنسبة لأخصائي تسويق في فريق اتصال اتحادي، أسرع طريق إلى مستوى الممارس هو صياغة الأوامر لمحتوى الحملات، ثم تلخيص البيانات، ثم مراجعة الذكاء الاصطناعي المسؤول.",
    "landing.agents.capability.capabilities.0": "مسارات مراعية للدور",
    "landing.agents.capability.capabilities.1": "متوافقة مع سلّم القدرات",
    "landing.agents.learning.name": "{{name}}",
    "landing.agents.learning.tagline": "يوجّه الموظف",
    "landing.agents.learning.description":
      "يفسّر نتائج التقييم ويحوّلها إلى خطة أسبوعية يستطيع الموظف الالتزام بها فعلًا.",
    "landing.agents.learning.sample":
      "يضعك تقييم خط الأساس عند مستوى ممارس ناشئ. تصميم الأوامر نقطة قوتك، والإشراف على مخرجات الذكاء الاصطناعي هو الفجوة. وضعت على رأس أسبوعك وحدة مدتها 20 دقيقة عن إبقاء الإنسان في الحلقة.",
    "landing.agents.learning.capabilities.0": "يقرأ كل تقييم",
    "landing.agents.learning.capabilities.1": "يعيد التخطيط مع تقدّمك",
    "landing.agents.assessment.name": "{{name}}",
    "landing.agents.assessment.tagline": "يضع الاختبار ويصحّحه",
    "landing.agents.assessment.description":
      "يعدّ التقييم القبلي والبعدي لكل مسار، ثم يقيس تطور القدرات وجودة العمل المسلَّم.",
    "landing.agents.assessment.sample":
      "أظهر تقييمك القبلي تقدّم تصميم الأوامر على الإشراف، لذا يضاعف التقييم البعدي وزن الإشراف. جودة التنفيذ 4/5: لسير العمل معتمِد محدد وخطة بديلة، لكن لا يوجد ما يقيس ما وفّره.",
    "landing.agents.assessment.capabilities.0": "تقييم قبلي وبعدي",
    "landing.agents.assessment.capabilities.1": "معايير تصحيح مع تتبّع للاستدلال",
    "landing.agents.content.name": "{{name}}",
    "landing.agents.content.tagline": "يبني المواد التعليمية",
    "landing.agents.content.description":
      "يبني محتوى مسار التعلم من الدورات التي ينشئها مديرو الجهات، ويولّد سيناريوهات وحالات دراسية واختبارات معرفية إضافية عند الطلب، بالعربية والإنجليزية.",
    "landing.agents.content.sample":
      "نشر مدير جهتك ثلاث دورات هذا الشهر. أدرجت اثنتين منها في مسارك بالترتيب المناسب، وأعددت دراسة حالة من ست خطوات عن حملة التوعية المجتمعية لديك، مع نسخة عربية واختبار معرفي.",
    "landing.agents.content.capabilities.0": "يبني من دورات مديري الجهات",
    "landing.agents.content.capabilities.1": "ثنائي اللغة بشكل افتراضي",
    "landing.agents.coaching.name": "{{name}}",
    "landing.agents.coaching.tagline": "متاح دائمًا",
    "landing.agents.coaching.description":
      "يرشدك في المنصة، ويتابع ما هو معلّق، ويجيب عن أسئلتك ضمن سياق العمل.",
    "landing.agents.coaching.sample":
      "لديك مشروعان تطبيقيان بانتظار اعتماد مدير إدارتك، واعتماد واحد جاهز للاستلام. هل أفتح لك عمليات التحقق، أم شهادتك في صفحة التقدير؟",
    "landing.agents.coaching.capabilities.0": "إجابات مدركة للسياق",
    "landing.agents.coaching.capabilities.1": "يتابع نيابة عنك",
    "landing.agents.analytics.name": "{{name}}",
    "landing.agents.analytics.tagline": "يرفع التقارير للقيادة",
    "landing.agents.analytics.description":
      "يجمّع قدرات الأفراد على مستوى الإدارة والجهة والمستوى الاتحادي، لخدمة المديرين ومديري الجهات والقيادة.",
    "landing.agents.analytics.sample":
      "بلغت الجاهزية الوطنية {{readiness}}، مع {{onTrack}} جهة من أصل {{total}} ضمن المسار المخطط.",
    "landing.agents.analytics.sampleGap":
      " وتذكر {{ministries}} جهة أن {{competency}} أكبر فجوة في قدراتها.",
    "landing.agents.analytics.capabilities.0": "تجميع من الفرد إلى المستوى الاتحادي",
    "landing.agents.analytics.capabilities.1": "مخرجات جاهزة للعرض على القيادة",
    "landing.agents.practice.name": "{{name}}",
    "landing.agents.practice.tagline": "مكان آمن للتجربة",
    "landing.agents.practice.description":
      "يشغّل سيناريوهات عمل محاكاة وتوائم رقمية لتُمارَس القدرات قبل استخدامها في العمل الحقيقي.",
    "landing.agents.practice.sample":
      "سيناريو: يعترض أحد المتعاملين على رد صاغه الذكاء الاصطناعي من إدارتك. اكتب ردك وسأقيّمه وفق قائمة الذكاء الاصطناعي المسؤول الاتحادية، بندًا بندًا.",
    "landing.agents.practice.capabilities.0": "سيناريوهات في بيئة آمنة",
    "landing.agents.practice.capabilities.1": "تقييم وفق السياسات",

    // --- Landing: role titles (roles.ts) ---
    "landing.pathways.learner.title": "موظف اتحادي / متعلم",
    "landing.pathways.manager.title": "مدير إدارة",
    "landing.pathways.entity.title": "مدير الجهة",
    "landing.pathways.fahrTeam.title": "فريق برنامج الهيئة",
    "landing.pathways.leadership.title": "القيادة الاتحادية",

    // --- Landing: registration dialog ---
    "landing.registration.nameLabel": "الاسم الكامل",
    "landing.registration.namePlaceholder": "مثال: عائشة المنصوري",
    "landing.registration.emailLabel": "البريد الإلكتروني الحكومي",
    "landing.registration.emailPlaceholder": "aisha@mohap.gov.ae",
    "landing.registration.entityLabel": "الجهة الاتحادية",
    "landing.registration.entityPlaceholder": "اختر جهتك",
    "landing.registration.entities.mohap": "وزارة الصحة ووقاية المجتمع",
    "landing.registration.entities.moe": "وزارة التربية والتعليم",
    "landing.registration.entities.mof": "وزارة المالية",
    "landing.registration.entities.moei": "وزارة الاقتصاد",
    "landing.registration.entities.fahr": "الهيئة الاتحادية للموارد البشرية الحكومية",
    "landing.registration.jobTitleLabel": "المسمى الوظيفي",
    "landing.registration.learner.jobTitlePlaceholder": "مثال: أخصائي تسويق",
    "landing.registration.manager.jobTitlePlaceholder": "مثال: رئيس قسم الاتصال الرقمي",
    "landing.registration.manager.teamSizeLabel": "حجم الفريق",
    "landing.registration.manager.teamSizePlaceholder": "مثال: 5",
    "landing.registration.entity.adminCodeLabel": "رمز دخول المسؤول",
    "landing.registration.entity.adminCodePlaceholder": "••••••••",
    "landing.registration.fahrTeam.programmeIdLabel": "معرّف برنامج الهيئة",
    "landing.registration.fahrTeam.programmeIdPlaceholder": "مثال: FAHR-2026-X",
    "landing.registration.leadership.execTitleLabel": "المسمى التنفيذي",
    "landing.registration.leadership.execTitlePlaceholder": "مثال: وكيل وزارة",
    "landing.registration.doneTitle": "اكتمل التسجيل",
    "landing.registration.doneDescription": "تم تجهيز ملفك. جارٍ فتح مساحة عملك…",
    "landing.registration.createProfileTitle": "إنشاء الملف",
    "landing.registration.registeringAs": "التسجيل بصفة {{title}}",
    "landing.registration.fallbackRole": "مستخدم اتحادي",
    "landing.registration.cancel": "إلغاء",
    "landing.registration.submit": "الدخول إلى المنصة",
    "landing.registration.submitting": "جارٍ التجهيز…",
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
