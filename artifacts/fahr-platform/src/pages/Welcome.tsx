// Public landing page.
//
// Composition only — each band lives in `@/components/landing`, and the shared
// motion primitives and type scale live alongside them so a new section cannot
// drift from the rest of the page.

import React, { useState } from "react";
import { CtaSection } from "@/components/landing/CtaSection";
import { EcosystemSection } from "@/components/landing/EcosystemSection";
import { HeroSection } from "@/components/landing/HeroSection";
import { JourneySection } from "@/components/landing/JourneySection";
import { LabSection } from "@/components/landing/LabSection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { PathwaysSection } from "@/components/landing/PathwaysSection";
import { RegistrationDialog } from "@/components/landing/RegistrationDialog";
import type { STAKEHOLDERS } from "@/lib/constants";

type Stakeholder = (typeof STAKEHOLDERS)[number];

export default function Welcome() {
  const [selectedRole, setSelectedRole] = useState<Stakeholder | null>(null);
  const [registrationOpen, setRegistrationOpen] = useState(false);

  const openRegistration = (role: Stakeholder) => {
    setSelectedRole(role);
    setRegistrationOpen(true);
  };

  const scrollToPathways = () =>
    document.getElementById("pathways")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="flex min-h-[100dvh] flex-col overflow-x-clip bg-background font-sans">
      <LandingHeader onRegister={scrollToPathways} />
      <main className="flex-1">
        <HeroSection onPrimary={scrollToPathways} />
        <PathwaysSection onSelect={openRegistration} />
        <JourneySection />
        <EcosystemSection />
        <LabSection />
        <CtaSection onRegister={scrollToPathways} />
      </main>
      <LandingFooter />
      <RegistrationDialog
        role={selectedRole}
        open={registrationOpen}
        onOpenChange={setRegistrationOpen}
      />
    </div>
  );
}
