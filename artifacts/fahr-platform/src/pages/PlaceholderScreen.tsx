import { Link } from "wouter";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { PageEnter } from "@/components/motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Hammer } from "lucide-react";

type Role = "learner" | "manager" | "ministry" | "fahr" | "leadership";

type PlaceholderScreenProps = {
  role: Role;
  title: string;
  description: string;
  /** What this screen will hold once its role console is built. */
  willInclude?: string[];
  /** Where "back" goes. Defaults to the role's index screen. */
  backHref?: string;
  backLabel?: string;
};

const ROLE_HOME: Record<Role, string> = {
  learner: "/learner",
  manager: "/manager",
  ministry: "/ministry",
  fahr: "/fahr",
  leadership: "/leadership",
};

/**
 * Titled placeholder for a screen whose console is still being built.
 *
 * Every sidebar entry points at a real, titled page from the first build, so
 * navigation is never broken while the four role consoles land separately.
 */
export default function PlaceholderScreen({
  role,
  title,
  description,
  willInclude,
  backHref,
  backLabel = "Back to dashboard",
}: PlaceholderScreenProps) {
  return (
    <Layout role={role}>
      <PageEnter className="space-y-6">
        <PageHeader
          title={title}
          description={description}
          tone={role === "learner" ? "default" : "primary"}
          actions={<Badge variant="secondary">In build</Badge>}
        />

        <Card className="border-card-border">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Hammer className="h-4.5 w-4.5 text-primary" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">This screen is next in the build</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  The navigation, route and shared programme data behind it are already in place, so it opens
                  with the rest of the role's console rather than being wired up later.
                </p>
              </div>
            </div>

            {willInclude && willInclude.length > 0 && (
              <ul className="ms-12 space-y-1.5">
                {willInclude.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="ms-12">
              <Link
                href={backHref ?? ROLE_HOME[role]}
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                data-testid="link-placeholder-back"
              >
                <ArrowLeft className="h-4 w-4" />
                {backLabel}
              </Link>
            </div>
          </CardContent>
        </Card>
      </PageEnter>
    </Layout>
  );
}
