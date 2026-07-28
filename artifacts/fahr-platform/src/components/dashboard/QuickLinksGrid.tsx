import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import {
  Award,
  BadgeCheck,
  Bot,
  FileBarChart,
  FlaskConical,
  Rocket,
  Target,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useLearnerProgress } from "@/lib/LearnerProgressContext";

type QuickLink = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  status?: string;
};

/**
 * Shortcut tiles to every destination in the learner journey, so the dashboard
 * works as the hub rather than a dead end.
 */
export function QuickLinksGrid() {
  const { result } = useLearnerProgress();
  const reduceMotion = useReducedMotion();

  const links: QuickLink[] = [
    {
      href: "/learner/mission",
      label: "Learning Pathway",
      description: "Your personalised blocks",
      icon: Target,
      status: "48%",
    },
    {
      href: "/learner/profile",
      label: "Capability Profile",
      description: "Skills, level and history",
      icon: User,
      status: result ? `${result.overall}%` : "New",
    },
    {
      href: "/learner/lab/twin",
      label: "Digital Twin Lab",
      description: "Train your AI assistant",
      icon: Bot,
      status: "70%",
    },
    {
      href: "/learner/lab/project",
      label: "Workplace Project",
      description: "Campaign Brief Generator",
      icon: Rocket,
      status: "In progress",
    },
    {
      href: "/learner/evaluation",
      label: "Evaluation & Certification",
      description: "AI and human review",
      icon: BadgeCheck,
      status: "Ready",
    },
    {
      href: "/learner/recognition",
      label: "Recognition & Impact",
      description: "Badges and hours saved",
      icon: Award,
      status: "6 badges",
    },
    {
      href: "/learner/community",
      label: "Community",
      description: "Peers, events and leaderboard",
      icon: Users,
      status: "Rank 2",
    },
    {
      href: result ? "/learner/assessment/report" : "/learner/assessment",
      label: result ? "Assessment Report" : "Baseline Assessment",
      description: result ? "Your competency breakdown" : "Start here to be placed",
      icon: FileBarChart,
      status: result ? "Complete" : "Not started",
    },
  ];

  return (
    <div>
      <h2 className="mb-3 text-lg font-bold text-primary">Everything in your journey</h2>
      <div
        className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(190px,1fr))]"
        data-testid="grid-quick-links"
      >
        {links.map((link, i) => {
          const Icon = link.icon;
          return (
            <motion.div
              key={link.href}
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, ease: "easeOut", delay: i * 0.05 }}
              whileHover={reduceMotion ? undefined : { y: -3 }}
              className="h-full"
            >
              <Link href={link.href} data-testid={`quicklink-${link.href.replace(/\//g, "-")}`} className="block h-full">
                <Card className="h-full border-card-border transition-colors hover:border-primary/40 hover:bg-muted/40">
                  <CardContent className="flex h-full flex-col p-4">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-4.5 w-4.5 text-primary" />
                      </div>
                      {link.status && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          {link.status}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold leading-snug text-foreground">{link.label}</p>
                    <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{link.description}</p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
