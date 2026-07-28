import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/lib/LanguageContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, ArrowRight, Brain, Target, Shield, Users, BarChart, GraduationCap, Microscope, CheckCircle2, ChevronRight } from "lucide-react";
import { AIConcierge } from "@/components/AIConcierge";
import { AGENTS, STAKEHOLDERS } from "@/lib/constants";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion, useScroll, useTransform } from "framer-motion";

gsap.registerPlugin(ScrollTrigger);

const AGENT_ICONS: Record<string, React.ElementType> = {
  coach: GraduationCap,
  advisor: Target,
  practice: Brain,
  content: Microscope,
  analytics: BarChart,
  concierge: Users,
};

export default function Welcome() {
  const { language, setLanguage } = useLanguage();
  const [, setLocation] = useLocation();
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
    <div className="min-h-[100dvh] bg-background flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="absolute top-0 w-full p-6 flex justify-between items-center z-50 transition-all duration-300">
        <div className="bg-white rounded-md px-2.5 py-1.5 drop-shadow-sm">
          <img src={`${import.meta.env.BASE_URL}brand/fahr-logo.png`} alt="FAHR Logo" className="h-8 md:h-10 object-contain" />
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-white hover:bg-white/10 hidden md:inline-flex font-medium" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm" asChild>
            <Link href="/signup">Register</Link>
          </Button>
          <Button variant="outline" size="sm" className="bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white/20 shadow-sm" onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}>
            <Globe className="h-4 w-4 mr-2" />
            {language === 'en' ? 'العربية' : 'English'}
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section ref={heroRef} className="relative h-[90vh] md:h-screen w-full flex items-center justify-center overflow-hidden">
        <motion.div 
          className="absolute inset-0 w-full h-full"
          style={{ y: heroY }}
        >
          <div className="absolute inset-0 bg-black/45 z-10"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-background z-20"></div>
          <img 
            src={`${import.meta.env.BASE_URL}brand/landing/hero-bg.jpg`} 
            alt="AI Hero" 
            className="w-full h-full object-cover"
          />
        </motion.div>
        
        <div ref={textRef} className="relative z-30 flex flex-col items-center text-center px-6 max-w-5xl mt-16">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-white/10 text-white font-medium text-sm mb-6 border border-white/25 backdrop-blur-sm shadow-sm"
          >
            <Shield className="w-4 h-4 mr-2" /> UAE Government Executive Platform
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-tight">
            Federal Agentic AI <br />
            <span className="text-primary">Learning & Skilling Platform</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/80 leading-relaxed max-w-3xl mb-10">
            Equipping 80,000 federal employees with the practical capability, confidence, and responsible workflows required for an Agentic AI-enabled government.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6 h-auto shadow-md hover-elevate" onClick={() => document.getElementById('stakeholders')?.scrollIntoView({ behavior: 'smooth' })}>
              Start Your Journey <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-white border-white/40 hover:bg-white/10 text-lg px-8 py-6 h-auto bg-white/5 backdrop-blur-sm shadow-sm hover-elevate" asChild>
              <Link href="/login">Platform Login</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stakeholders Section */}
      <section id="stakeholders" className="py-24 bg-background relative z-30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 stagger-fade">
            <h2 className="text-sm font-bold text-primary tracking-wider uppercase mb-2">Tailored Pathways</h2>
            <h3 className="text-3xl md:text-5xl font-bold text-foreground">Select Your Federal Role</h3>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience personalized AI development missions, dashboards, and capabilities customized for your specific mandate within the UAE Government.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {STAKEHOLDERS.map((stakeholder, index) => {
              const imageMap: Record<string, string> = {
                "learner": "stakeholder-learner.jpg",
                "manager": "stakeholder-manager.jpg",
                "entity": "stakeholder-entity.jpg",
                "fahr-team": "stakeholder-fahr.jpg",
                "leadership": "stakeholder-leadership.jpg",
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 p-6 w-full flex flex-col items-start text-left z-10">
                    <h4 className="text-white font-bold text-xl mb-2 leading-snug">{stakeholder.title}</h4>
                    <span className="inline-flex items-center text-primary text-sm font-semibold opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                      Access Portal <ChevronRight className="w-4 h-4 ml-1" />
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Agents Ecosystem Section */}
      <section className="py-24 bg-white border-y border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="lg:w-1/3 stagger-fade">
              <h2 className="text-sm font-bold text-primary tracking-wider uppercase mb-2">The Capability Ecosystem</h2>
              <h3 className="text-3xl md:text-5xl font-bold text-foreground mb-6">Powered by Six AI Agents</h3>
              <p className="text-lg text-muted-foreground mb-8">
                Move beyond static courses. Our integrated suite of specialised AI agents provides continuous coaching, dynamic content generation, and real-time evaluation embedded in the flow of work.
              </p>
              <Button variant="outline" className="group">
                Discover the Agents
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
            
            <div ref={agentsRef} className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(AGENTS).map(([key, name], i) => {
                const Icon = AGENT_ICONS[key] || Brain;
                return (
                  <motion.div 
                    key={key}
                    whileHover={{ scale: 1.02 }}
                    className="stagger-fade bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col h-full"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h4 className="text-lg font-bold text-card-foreground mb-2">{name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {key === 'coach' && 'Guides personal development and interprets assessment outcomes.'}
                      {key === 'advisor' && 'Recommends capability pathways based on federal role.'}
                      {key === 'practice' && 'Provides safe, simulated environments for skill application.'}
                      {key === 'content' && 'Dynamically generates tailored learning scenarios.'}
                      {key === 'analytics' && 'Delivers workforce intelligence to leadership.'}
                      {key === 'concierge' && 'Navigates the platform and assists with inquiries.'}
                    </p>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Lab / Digital Twin Section */}
      <section className="py-24 bg-background text-foreground relative overflow-hidden border-b border-border">
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

      {/* Footer */}
      <footer className="bg-[#2a2825] text-white py-14">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
             <div className="bg-white rounded-md px-2.5 py-1.5">
               <img src={`${import.meta.env.BASE_URL}brand/fahr-logo.png`} alt="FAHR Logo" className="h-9 object-contain" />
             </div>
             <div className="h-8 w-px bg-white/20"></div>
             <p className="text-sm text-white/70">Federal Authority for Government Human Resources</p>
          </div>
          <div className="text-sm text-white/50">
            &copy; {new Date().getFullYear()} UAE Government. All rights reserved.
          </div>
        </div>
      </footer>

      <AIConcierge />

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
                  <Button type="button" variant="outline" onClick={() => setIsRegModalOpen(false)} className="hover:bg-black/5 border-border">Cancel</Button>
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
