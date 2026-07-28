import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/lib/LanguageContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Brain, Target, Shield, Users, BarChart, GraduationCap, Microscope, CheckCircle2, ChevronRight } from "lucide-react";
import { AGENTS, STAKEHOLDERS } from "@/lib/constants";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";

gsap.registerPlugin(ScrollTrigger);

const AGENT_DESCRIPTIONS: Record<string, string> = {
  coach: 'Guides personal development and interprets assessment outcomes.',
  advisor: 'Recommends capability pathways based on federal role.',
  practice: 'Provides safe, simulated environments for skill application.',
  content: 'Dynamically generates tailored learning scenarios.',
  analytics: 'Delivers workforce intelligence to leadership.',
  concierge: 'Navigates the platform and assists with inquiries.',
};

const ECOSYSTEM_IMAGES = [
  'brand/landing/ecosystem-agents.jpg',
  'brand/landing/ecosystem-2.jpg',
  'brand/landing/ecosystem-3.jpg',
];

const AGENT_ICONS: Record<string, React.ElementType> = {
  coach: GraduationCap,
  advisor: Target,
  practice: Brain,
  content: Microscope,
  analytics: BarChart,
  concierge: Users,
};

export default function Welcome() {
  const [, setLocation] = useLocation();
  const [activeAgent, setActiveAgent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveAgent((prev) => (prev + 1) % Object.keys(AGENTS).length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);
  const heroRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const agentsRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  const [selectedRole, setSelectedRole] = useState<typeof STAKEHOLDERS[number] | null>(null);
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // GSAP animations for hero
    const ctx = gsap.context(() => {
      gsap.fromTo(
        textRef.current,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 1.2, ease: "power3.out", delay: 0.2 }
      );

      gsap.utils.toArray('.stagger-fade').forEach((el: any, i) => {
        gsap.fromTo(el, 
          { opacity: 0, y: 30 },
          { 
            opacity: 1, 
            y: 0, 
            duration: 0.8, 
            ease: "power2.out",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              toggleActions: "play none none reverse"
            }
          }
        );
      });
    });
    return () => ctx.revert();
  }, []);

  const handleOpenRegistration = (role: typeof STAKEHOLDERS[number]) => {
    setSelectedRole(role);
    setShowSuccess(false);
    setIsRegModalOpen(true);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Mock API call
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccess(true);
      setTimeout(() => {
        setIsRegModalOpen(false);
        if (selectedRole) {
          setLocation(selectedRole.route);
        }
      }, 1500);
    }, 1200);
  };

  const renderRegistrationFields = () => {
    if (!selectedRole) return null;

    const common = (
      <>
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" placeholder="E.g. Aisha Al Mansoori" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Government Email</Label>
          <Input id="email" type="email" placeholder="aisha@mohap.gov.ae" required />
        </div>
      </>
    );

    const entitySelect = (
      <div className="space-y-2">
        <Label htmlFor="entity">Federal Entity</Label>
        <Select required>
          <SelectTrigger>
            <SelectValue placeholder="Select your entity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mohap">Ministry of Health and Prevention</SelectItem>
            <SelectItem value="moe">Ministry of Education</SelectItem>
            <SelectItem value="mof">Ministry of Finance</SelectItem>
            <SelectItem value="moei">Ministry of Economy</SelectItem>
            <SelectItem value="fahr">FAHR</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );

    switch (selectedRole.id) {
      case "learner":
        return (
          <>
            {common}
            {entitySelect}
            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input id="title" placeholder="E.g. Marketing Specialist" required />
            </div>
          </>
        );
      case "manager":
        return (
          <>
            {common}
            {entitySelect}
            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input id="title" placeholder="E.g. Head of Digital Communications" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team">Team Size</Label>
              <Input id="team" type="number" min="1" placeholder="E.g. 5" required />
            </div>
          </>
        );
      case "entity":
        return (
          <>
            {common}
            {entitySelect}
            <div className="space-y-2">
              <Label htmlFor="adminCode">Admin Access Code</Label>
              <Input id="adminCode" type="password" placeholder="••••••••" required />
            </div>
          </>
        );
      case "fahr-team":
        return (
          <>
            {common}
            <div className="space-y-2">
              <Label htmlFor="fahrId">FAHR Programme ID</Label>
              <Input id="fahrId" placeholder="E.g. FAHR-2026-X" required />
            </div>
          </>
        );
      case "leadership":
        return (
          <>
            {common}
            {entitySelect}
            <div className="space-y-2">
              <Label htmlFor="execTitle">Executive Title</Label>
              <Input id="execTitle" placeholder="E.g. Undersecretary" required />
            </div>
          </>
        );
      default:
        return common;
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col font-sans overflow-x-clip">
      {/* Header */}
      <header className="sticky top-0 w-full px-6 py-4 grid grid-cols-[1fr_auto_1fr] items-center z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border shadow-sm transition-all duration-300">
        <div className="flex items-center justify-start">
          <img
            src={`${import.meta.env.BASE_URL}brand/fahr-logo.png`}
            alt="FAHR Logo"
            className="h-8 md:h-10 object-contain cursor-pointer"
            onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if(e.key==='Enter') window.scrollTo({top: 0, behavior: 'smooth'}); }}
          />
        </div>
        <nav className="hidden lg:flex items-center justify-center gap-8">
          {[
            { id: 'pathways', label: 'Pathways' },
            { id: 'ecosystem', label: 'Ecosystem' },
            { id: 'lab', label: 'AI Lab' },
          ].map((link) => (
            <button
              key={link.id}
              onClick={() => document.getElementById(link.id)?.scrollIntoView({ behavior: 'smooth' })}
              className="relative text-sm font-medium text-foreground hover:text-primary transition-colors after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-full after:rounded-full after:bg-primary after:scale-x-0 after:origin-left after:transition-transform after:duration-300 hover:after:scale-x-100"
            >
              {link.label}
            </button>
          ))}
        </nav>
        <div className="flex items-center justify-end gap-4">
          <Button variant="ghost" className="hidden md:inline-flex font-medium text-foreground hover:text-primary hover:bg-primary/5" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
          <Button className="rounded-full px-6 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm" onClick={() => document.getElementById('pathways')?.scrollIntoView({ behavior: 'smooth' })}>
            Register
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section ref={heroRef} className="relative h-[90vh] md:h-[calc(100vh-73px)] w-full flex items-center justify-center overflow-hidden">
        <motion.div 
          className="absolute inset-0 w-full h-full"
          style={{ y: heroY }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/20 z-10"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 z-20"></div>
          <img 
            src={`${import.meta.env.BASE_URL}brand/landing/hero-bg.jpg`} 
            alt="AI Hero" 
            className="w-full h-full object-cover"
          />
        </motion.div>
        
        <div className="relative z-30 w-full max-w-7xl mx-auto px-6">
          <div ref={textRef} className="flex flex-col items-start text-left max-w-3xl">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-primary/20 text-white font-medium text-sm mb-6 border border-primary/40 backdrop-blur-sm shadow-sm"
            >
              <Shield className="w-4 h-4 mr-2 text-primary" /> UAE Government Executive Platform
            </motion.div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-5 leading-[1.1]">
              Federal Agentic AI <br />
              <span className="text-primary">Learning & Skilling</span> Platform
            </h1>
            <p className="text-base md:text-lg text-white/80 leading-relaxed max-w-xl mb-8">
              Equipping 80,000 federal employees with the practical capability, confidence, and responsible workflows required for an Agentic AI-enabled government.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-base px-8 py-5 h-auto shadow-lg shadow-primary/25 hover-elevate" onClick={() => document.getElementById('pathways')?.scrollIntoView({ behavior: 'smooth' })}>
                Start Your Journey <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="rounded-full text-white border-white/40 hover:bg-white/10 text-base px-8 py-5 h-auto bg-white/5 backdrop-blur-sm shadow-sm hover-elevate" asChild>
                <Link href="/login">Platform Login</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stakeholders Section */}
      <section id="pathways" className="py-24 bg-background relative z-30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 stagger-fade">
            <h2 className="text-sm font-bold text-primary tracking-wider uppercase mb-2">Tailored Pathways</h2>
            <h3 className="text-3xl md:text-5xl font-bold text-foreground">Select Your Federal Role</h3>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience personalised AI learning pathways, dashboards, and capabilities customized for your specific mandate within the UAE Government.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {STAKEHOLDERS.map((stakeholder) => {
              const imageMap: Record<string, string> = {
                "learner": "stakeholder-learner.jpg",
                "manager": "stakeholder-manager.jpg",
                "entity": "stakeholder-entity.jpg",
                "fahr-team": "stakeholder-fahr.jpg",
                "leadership": "stakeholder-leadership.jpg",
              };
              const roleDescriptions: Record<string, string> = {
                "learner": "Master AI tools for daily productivity.",
                "manager": "Lead AI-driven team transformation.",
                "entity": "Administer department-wide adoption.",
                "fahr-team": "Manage national AI program operations.",
                "leadership": "Drive strategic AI vision and ROI."
              };
              const bgImage = `${import.meta.env.BASE_URL}brand/landing/${imageMap[stakeholder.id]}`;
              
              return (
                <motion.div 
                  key={stakeholder.id}
                  whileHover={{ y: -10 }}
                  className="stagger-fade group cursor-pointer relative overflow-hidden rounded-2xl aspect-[3/4] shadow-lg border border-border/50 bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  onClick={() => handleOpenRegistration(stakeholder)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleOpenRegistration(stakeholder);
                    }
                  }}
                >
                  <div className="absolute inset-0 bg-black/20 group-hover:scale-105 transition-transform duration-700">
                    <img src={bgImage} alt={stakeholder.title} className="w-full h-full object-cover opacity-100" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 p-6 w-full flex flex-col items-start text-left z-10">
                    <h4 className="text-white font-bold text-xl mb-1 leading-snug">{stakeholder.title}</h4>
                    <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] group-focus-within:grid-rows-[1fr] focus-visible:grid-rows-[1fr] transition-all duration-300 ease-out w-full opacity-0 group-hover:opacity-100 group-focus-within:opacity-100">
                      <div className="overflow-hidden">
                        <p className="text-white/80 text-sm pt-1 pb-1">
                          {roleDescriptions[stakeholder.id as keyof typeof roleDescriptions]}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center text-primary text-sm font-semibold transition-colors mt-2">
                      Access Portal <ChevronRight className="w-4 h-4 ml-1" />
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Learner Journey Section */}
      <section id="journey" className="py-24 bg-gradient-to-b from-background to-white border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14 stagger-fade">
            <h2 className="text-sm font-bold text-primary tracking-wider uppercase mb-2">The Learner Journey</h2>
            <h3 className="text-3xl md:text-5xl font-bold text-foreground">Six Stages, One Continuous Experience</h3>
            <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
              Every federal employee follows the same guided arc — from an AI-informed understanding of their role, through personalised learning and real workplace application, to validated capability and measurable impact.
            </p>
          </div>

          <motion.figure
            className="max-w-6xl mx-auto"
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <div className="rounded-3xl overflow-hidden shadow-xl border border-border/60 bg-white">
              <img
                src={`${import.meta.env.BASE_URL}brand/learner-journey.png`}
                alt="Diagram of the six-stage FAHR learner journey, running from onboarding and profiling through to recognition and measurable impact."
                className="w-full h-auto block"
                loading="lazy"
                data-testid="img-learner-journey"
              />
            </div>
          </motion.figure>

          <div className="mt-12 text-center stagger-fade">
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 h-auto text-lg shadow-md hover-elevate"
              onClick={() => setLocation('/learner')}
              data-testid="button-explore-journey"
            >
              Walk through the journey <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Agents Ecosystem Section */}
      <section id="ecosystem" className="py-24 bg-white border-y border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 stagger-fade">
            <h2 className="text-sm font-bold text-primary tracking-wider uppercase mb-2">The Capability Ecosystem</h2>
            <h3 className="text-3xl md:text-5xl font-bold text-foreground">Powered by Six AI Agents</h3>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Move beyond static courses. Our integrated suite of specialised AI agents provides continuous coaching, dynamic content generation, and real-time evaluation embedded in the flow of work.
            </p>
          </div>

          <div ref={agentsRef} className="stagger-fade grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Rotating image showcase */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/3]">
              <AnimatePresence mode="sync">
                <motion.img
                  key={activeAgent % ECOSYSTEM_IMAGES.length}
                  src={`${import.meta.env.BASE_URL}${ECOSYSTEM_IMAGES[activeAgent % ECOSYSTEM_IMAGES.length]}`}
                  alt="AI agents in action"
                  className="absolute inset-0 w-full h-full object-cover"
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                />
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent"></div>
              {/* Active agent chip */}
              <div className="absolute bottom-6 left-6 right-6">
                <AnimatePresence mode="wait">
                  {Object.entries(AGENTS).map(([key, name], i) => {
                    if (i !== activeAgent) return null;
                    const Icon = AGENT_ICONS[key] || Brain;
                    return (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.35 }}
                        className="inline-flex items-center gap-3 bg-white/15 backdrop-blur-md border border-white/25 rounded-full pl-2 pr-5 py-2"
                      >
                        <span className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                          <Icon className="w-4.5 h-4.5" />
                        </span>
                        <span className="text-white font-semibold text-sm">{name}</span>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>

            {/* Interactive agent list */}
            <div className="flex flex-col gap-2">
              {Object.entries(AGENTS).map(([key, name], i) => {
                const Icon = AGENT_ICONS[key] || Brain;
                const isActive = i === activeAgent;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveAgent(i)}
                    aria-pressed={isActive}
                    className={`relative text-left rounded-2xl px-6 py-4 transition-all duration-300 border ${
                      isActive
                        ? 'bg-background border-primary/40 shadow-md'
                        : 'bg-transparent border-transparent hover:bg-background/70 hover:border-border'
                    }`}
                  >
                    <span className={`absolute left-0 top-4 bottom-4 w-1 rounded-full transition-all duration-300 ${isActive ? 'bg-primary' : 'bg-transparent'}`}></span>
                    <span className="flex items-center gap-4">
                      <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300 ${isActive ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                        <Icon className="w-5 h-5" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className={`block text-base font-bold transition-colors duration-300 ${isActive ? 'text-foreground' : 'text-foreground/70'}`}>{name}</span>
                        <span
                          className={`grid transition-all duration-300 ${isActive ? 'grid-rows-[1fr] opacity-100 mt-0.5' : 'grid-rows-[0fr] opacity-0'}`}
                        >
                          <span className="overflow-hidden block text-sm text-muted-foreground leading-relaxed">
                            {AGENT_DESCRIPTIONS[key]}
                          </span>
                        </span>
                      </span>
                      <ChevronRight className={`w-4 h-4 shrink-0 transition-all duration-300 ${isActive ? 'text-primary translate-x-0.5' : 'text-muted-foreground/40'}`} />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Lab / Digital Twin Section */}
      <section id="lab" className="py-24 bg-background text-foreground relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 opacity-40">
           <img src={`${import.meta.env.BASE_URL}brand/landing/section-lab.jpg`} alt="Lab Background" className="w-full h-full object-cover mix-blend-overlay" />
           <div className="absolute inset-0 bg-gradient-to-br from-background via-background/90 to-background/50"></div>
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="stagger-fade order-2 lg:order-1">
              <div className="relative rounded-2xl overflow-hidden border border-border shadow-xl hover-elevate">
                <img src={`${import.meta.env.BASE_URL}brand/landing/section-lab.jpg`} alt="Agentic AI Lab" className="w-full h-auto opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                  <div className="flex items-center gap-3 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                    </span>
                    <span className="text-white font-mono text-xs font-semibold tracking-wider">SECURE SANDBOX ACTIVE</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="stagger-fade order-1 lg:order-2">
              <h2 className="text-primary font-bold tracking-wider uppercase mb-2 text-sm">Practical Application</h2>
              <h3 className="text-3xl md:text-5xl font-bold mb-6 text-foreground">The Agentic AI Lab & Digital Twin</h3>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Transform learning into measurable outcomes. The AI Lab provides a secure, sandboxed environment where federal employees can build, test, and deploy actual Agentic workflows without risking production data.
              </p>
              <ul className="space-y-4 mb-8">
                {['Safely simulate entity-specific scenarios', 'Collaborate with the Practice Partner AI', 'Translate capabilities into real-world efficiency gains', 'Governed by UAE data privacy standards'].map((item, i) => (
                  <li key={i} className="flex items-start">
                    <CheckCircle2 className="w-6 h-6 text-primary shrink-0 mr-3" />
                    <span className="text-foreground/90 font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pre-footer CTA */}
      <section className="relative py-24 overflow-hidden border-b border-border">
        <div className="absolute inset-0">
          <img src={`${import.meta.env.BASE_URL}brand/landing/cta-band.jpg`} alt="Register Now" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/30"></div>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Ready to accelerate your AI journey?</h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Join the UAE's unified platform for artificial intelligence capability building.
          </p>
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6 h-auto shadow-md hover-elevate" onClick={() => document.getElementById('pathways')?.scrollIntoView({ behavior: 'smooth' })}>
            Register for Access
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#2a2825] text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-1">
               <div className="bg-white rounded-md px-2.5 py-1.5 inline-block mb-6">
                 <img src={`${import.meta.env.BASE_URL}brand/fahr-logo.png`} alt="FAHR Logo" className="h-10 object-contain" />
               </div>
               <p className="text-sm text-white/70 max-w-xs leading-relaxed">
                 Empowering government employees with the capabilities required for an AI-enabled future.
               </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Platform</h4>
              <ul className="space-y-3 text-sm text-white/70">
                <li><button onClick={() => document.getElementById('pathways')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">Pathways</button></li>
                <li><button onClick={() => document.getElementById('ecosystem')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">AI Agents</button></li>
                <li><button onClick={() => document.getElementById('lab')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">AI Lab</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Stakeholders</h4>
              <ul className="space-y-3 text-sm text-white/70">
                <li><button className="hover:text-white transition-colors" onClick={() => document.getElementById('pathways')?.scrollIntoView({ behavior: 'smooth' })}>Federal Learners</button></li>
                <li><button className="hover:text-white transition-colors" onClick={() => document.getElementById('pathways')?.scrollIntoView({ behavior: 'smooth' })}>Department Managers</button></li>
                <li><button className="hover:text-white transition-colors" onClick={() => document.getElementById('pathways')?.scrollIntoView({ behavior: 'smooth' })}>Executive Leadership</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Resources</h4>
              <ul className="space-y-3 text-sm text-white/70">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Support</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-white/50">
              &copy; {new Date().getFullYear()} UAE Government. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      {/* Registration Modal */}
      <Dialog open={isRegModalOpen} onOpenChange={setIsRegModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border border-border shadow-xl">
          {showSuccess ? (
            <div className="p-12 flex flex-col items-center text-center bg-white text-foreground">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-6"
              >
                <CheckCircle2 className="w-10 h-10" />
              </motion.div>
              <DialogTitle className="text-2xl font-bold mb-2 text-foreground">Registration Complete</DialogTitle>
              <DialogDescription className="text-muted-foreground mb-6 text-base">
                Your profile has been provisioned. Redirecting to your personalized workspace...
              </DialogDescription>
              <div className="flex gap-2">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                    className="w-3 h-3 rounded-full bg-primary"
                  />
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="bg-background p-6 text-foreground flex items-center gap-4 border-b border-border">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-xl text-foreground font-bold">Create Profile</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Registering as {selectedRole?.title}
                  </DialogDescription>
                </div>
              </div>
              <form onSubmit={handleRegisterSubmit} className="p-6 space-y-6 bg-white">
                <div className="space-y-4">
                  {renderRegistrationFields()}
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <Button type="button" variant="outline" onClick={() => setIsRegModalOpen(false)} className="hover:bg-black/5 border-border text-foreground">Cancel</Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground hover:bg-primary/90 min-w-[120px] shadow-sm">
                    {isSubmitting ? "Provisioning..." : "Access Platform"}
                  </Button>
                </div>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
