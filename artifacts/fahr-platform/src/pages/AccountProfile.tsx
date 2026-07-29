import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/lib/LanguageContext";
import {
  ACCOUNT_PROFILES,
  profileInitials,
  type PortalRole,
} from "@/lib/accountProfiles";
import {
  ArrowRight,
  Building2,
  BadgeCheck,
  Check,
  IdCard,
  Languages,
  LogOut,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";

const ROLE_LABELS: Record<PortalRole, string> = {
  learner: "Federal Employee",
  manager: "Line Manager",
  ministry: "Entity Admin",
  fahr: "FAHR Programme Team",
  leadership: "Federal Leadership",
};

const NOTIFICATION_ROWS: {
  id: "announcements" | "digest" | "reminders";
  label: string;
  detail: string;
}[] = [
  {
    id: "announcements",
    label: "Programme announcements",
    detail: "Policy changes, new framework versions and federal notices.",
  },
  {
    id: "digest",
    label: "Weekly progress digest",
    detail: "One email each Sunday summarising the week's movement.",
  },
  {
    id: "reminders",
    label: "Session and deadline reminders",
    detail: "Live sessions, validation queues and re-assessment dates.",
  },
];

/** One label/value row in the organisation card. */
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border/70 py-3 last:border-0 sm:flex-row sm:items-baseline sm:gap-4">
      <p className="w-full shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:w-44">
        {label}
      </p>
      <p className="min-w-0 text-sm text-foreground">{value}</p>
    </div>
  );
}

export default function AccountProfile({ role }: { role: PortalRole }) {
  const profile = ACCOUNT_PROFILES[role];
  const { language, setLanguage } = useLanguage();
  const [, setLocation] = useLocation();
  const [notifications, setNotifications] = useState(profile.notifications);

  return (
    <Layout role={role}>
      <div className="mx-auto w-full max-w-5xl space-y-6 pb-6">
        <PageHeader
          title="Profile"
          description="Your account on the FAHR Agentic AI Learning Platform, the entity it belongs to, and how the platform contacts you."
          icon={<UserRound className="h-6 w-6 text-primary" />}
          actions={
            <Button
              variant="outline"
              onClick={() => setLocation("/")}
              className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
              data-testid="button-profile-sign-out"
            >
              <LogOut className="me-2 h-4 w-4" /> Sign out
            </Button>
          }
        />

        {/* Identity */}
        <ScrollReveal>
          <Card className="overflow-hidden border-card-border" data-testid="card-profile-identity">
            <CardContent className="p-0">
              <div className="flex flex-col gap-5 bg-gradient-to-r from-primary/[0.08] to-transparent p-6 sm:flex-row sm:items-center">
                {profile.avatar ? (
                  <img
                    src={`${import.meta.env.BASE_URL}${profile.avatar}`}
                    alt=""
                    className="h-20 w-20 shrink-0 rounded-2xl object-cover ring-1 ring-primary/20"
                    data-testid="img-profile-avatar"
                  />
                ) : (
                  <span
                    className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground"
                    data-testid="text-profile-initials"
                  >
                    {profileInitials(profile.name)}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-foreground" data-testid="text-profile-name">
                      {profile.name}
                    </h2>
                    <Badge variant="outline" className="rounded-full border-primary/40 text-primary">
                      {ROLE_LABELS[role]}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground" dir="rtl">
                    {profile.nameAr}
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">{profile.jobTitle}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-primary" />
                      <span data-testid="text-profile-email">{profile.email}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-primary" /> {profile.entity}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <IdCard className="h-3.5 w-3.5 text-primary" /> {profile.employeeId}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </ScrollReveal>

        <ScrollReveal className="grid items-start gap-6 lg:grid-cols-[1.25fr_1fr]" stagger={0.1}>
          {/* Organisation */}
          <Card className="border-card-border" data-testid="card-profile-organisation">
            <CardContent className="p-6">
              <h3 className="text-base font-semibold text-foreground">Organisation details</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Held by your entity's HR record. Changes are requested through your entity administrator.
              </p>
              <div className="mt-4">
                <DetailRow label="Federal entity" value={profile.entity} />
                <DetailRow label="Department" value={profile.department} />
                <DetailRow label="Job role" value={profile.jobTitle} />
                <DetailRow label="Seniority" value={profile.seniority} />
                <DetailRow label="Reports to" value={profile.reportsTo} />
                <DetailRow label="On the platform since" value={profile.joinedOn} />
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card className="border-card-border" data-testid="card-profile-preferences">
            <CardContent className="p-6">
              <h3 className="text-base font-semibold text-foreground">Preferences</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Applies to this account across every screen in the platform.
              </p>

              <div className="mt-5">
                <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Languages className="h-3.5 w-3.5 text-primary" /> Interface language
                </p>
                <div
                  className="mt-2 inline-flex rounded-full bg-muted p-1"
                  role="group"
                  aria-label="Interface language"
                >
                  {(
                    [
                      { id: "en", label: "English" },
                      { id: "ar", label: "العربية" },
                    ] as const
                  ).map((option) => {
                    const active = language === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setLanguage(option.id)}
                        aria-pressed={active}
                        className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                          active
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        data-testid={`button-language-${option.id}`}
                      >
                        {option.label}
                        {option.id === "ar" && (
                          <span className="ms-2 rounded-full bg-foreground/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                            Preview
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Arabic mirrors the interface right to left. Navigation is translated today; course content and
                  reports follow entity by entity, so some screens still read in English.
                </p>
              </div>

              <div className="mt-6 space-y-4 border-t border-border pt-5">
                {NOTIFICATION_ROWS.map((row) => (
                  <div key={row.id} className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{row.label}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{row.detail}</p>
                    </div>
                    <Switch
                      checked={notifications[row.id]}
                      onCheckedChange={(next) =>
                        setNotifications((current) => ({ ...current, [row.id]: next }))
                      }
                      aria-label={row.label}
                      data-testid={`switch-${row.id}`}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </ScrollReveal>

        <ScrollReveal className="grid items-start gap-6 lg:grid-cols-2" stagger={0.1}>
          {/* Access */}
          <Card className="border-card-border" data-testid="card-profile-access">
            <CardContent className="p-6">
              <h3 className="inline-flex items-center gap-2 text-base font-semibold text-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" /> What this account can access
              </h3>
              <ul className="mt-4 space-y-2.5">
                {profile.access.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-foreground/85">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="min-w-0">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                Access is granted by your entity administrator against the federal role model. All activity is
                recorded in the governance audit trail.
              </p>
            </CardContent>
          </Card>

          {/* Capability profile cross-link for the learner; sign-in facts otherwise */}
          {role === "learner" ? (
            <Card className="border-card-border" data-testid="card-profile-capability-link">
              <CardContent className="p-6">
                <h3 className="inline-flex items-center gap-2 text-base font-semibold text-foreground">
                  <BadgeCheck className="h-4 w-4 text-primary" /> Your capability record
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Competency scores, ladder position, assessment history and credentials live on your capability
                  profile — this page only covers your account.
                </p>
                <Button asChild className="mt-4">
                  <Link href="/learner/profile" data-testid="link-capability-profile">
                    Open capability profile <ArrowRight className="ms-2 h-4 w-4 rtl:-scale-x-100" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-card-border" data-testid="card-profile-signin">
              <CardContent className="p-6">
                <h3 className="inline-flex items-center gap-2 text-base font-semibold text-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" /> Sign-in and security
                </h3>
                <div className="mt-4">
                  <DetailRow label="Sign-in method" value="Federal single sign-on (UAE PASS)" />
                  <DetailRow label="Government email" value={profile.email} />
                  <DetailRow label="Data residency" value="United Arab Emirates" />
                </div>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  Passwords and multi-factor settings are managed by your entity's identity provider, not by this
                  platform.
                </p>
              </CardContent>
            </Card>
          )}
        </ScrollReveal>
      </div>
    </Layout>
  );
}
