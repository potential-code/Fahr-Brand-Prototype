import React, { useMemo } from "react";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlugZap, AlertTriangle, BookOpen, Clock, FileDown, Fingerprint } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFahrConsole } from "@/lib/FahrConsoleContext";
import type { Integration, IntegrationCategory } from "@/lib/federal";
import { CountUp, PageEnter, Stagger, StaggerItem } from "@/components/motion";
import { downloadCsv } from "@/lib/exportFile";

/** Category order and copy for the connection card groups. */
const CATEGORY_ORDER: IntegrationCategory[] = [
  "Identity",
  "HR",
  "Analytics",
  "Productivity",
  "Content",
  "API",
];

/** What a connection's record count is a count of, in plain words. */
const RECORD_NOUN: Partial<Record<IntegrationCategory, string>> = {
  Identity: "federal employees can sign in with it",
  Content: "courses available in the federal catalogue",
};

const CATEGORY_BLURB: Record<IntegrationCategory, string> = {
  Identity: "How federal employees sign in.",
  HR: "The authoritative source of employee records.",
  Analytics: "Where programme figures are reported onward.",
  Productivity: "Calendar, mail and collaboration hand-offs.",
  Content: "How learning content reaches the catalogue.",
  API: "Programmatic surfaces and outbound registries.",
};

/** Status pill styling, matching the green/amber/muted convention. */
function statusPill(status: Integration["status"]) {
  if (status === "Connected") return "bg-green-50 text-green-700 border-green-200";
  if (status === "Degraded") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-muted text-muted-foreground border-border";
}

export default function FAHRIntegrations() {
  const { toast } = useToast();
  const { integrations } = useFahrConsole();


  // --- KPIs (derived from the integration estate) --------------------------
  const liveCount = integrations.filter((i) => i.status === "Connected").length;
  const degradedCount = integrations.filter((i) => i.status === "Degraded").length;
  const notConnectedCount = integrations.filter((i) => i.status === "Not connected").length;
  // Each connection's records, in the plain terms a client reads them in.
  const recordsOf = (category: string) =>
    integrations.find((i) => i.category === category && i.status !== "Not connected")?.records ?? 0;

  const kpis = [
    {
      label: "Connections live",
      caption: `${liveCount} of ${integrations.length} connections healthy right now`,
      value: liveCount,
      icon: PlugZap,
      tone: "text-green-600",
      testid: "kpi-live",
    },
    {
      label: "Employees who can sign in",
      caption: "Through UAE PASS, the national digital identity",
      value: recordsOf("Identity"),
      icon: Fingerprint,
      tone: "text-primary",
      testid: "kpi-employees-signin",
    },
    {
      label: "Courses from Coursera",
      caption: "Available to the Content Agent for learners' pathways",
      value: recordsOf("Content"),
      icon: BookOpen,
      tone: "text-primary",
      testid: "kpi-coursera-courses",
    },
  ];

  const grouped = useMemo(
    () =>
      CATEGORY_ORDER.map((category) => ({
        category,
        items: integrations.filter((i) => i.category === category),
      })).filter((group) => group.items.length > 0),
    [integrations],
  );


  // --- Exports -------------------------------------------------------------
  const exportEstateCsv = () => {
    const name = downloadCsv({
      filename: "fahr-integration-estate",
      headers: [
        "Name",
        "Vendor",
        "Category",
        "Status",
        "Direction",
        "Last sync",
        "Records",
        "Owner",
        "Purpose",
      ],
      rows: integrations.map((i) => [
        i.name,
        i.vendor,
        i.category,
        i.status,
        i.direction,
        i.lastSync,
        i.records ?? "",
        i.owner,
        i.purpose,
      ]),
    });
    toast({ title: "Estate exported", description: `Saved ${name}.` });
  };

  return (
    <Layout role="fahr">
      <PageEnter className="space-y-6 pb-12">
        <PageHeader
          tone="primary"
          title="Integrations"
          description="The national identity connection every federal employee signs in through, and the content sources the Content Agent draws on."
          actions={
            <>
              <Button variant="outline" onClick={exportEstateCsv} data-testid="button-export-estate">
                <FileDown className="w-4 h-4 mr-2" /> Export CSV
              </Button>
            </>
          }
        />

        {/* KPI row */}
        <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {kpis.map((kpi) => (
            <StaggerItem key={kpi.label}>
              <StatCard className="h-full">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <kpi.icon className={`w-6 h-6 mb-2 ${kpi.tone}`} />
                  <p className="text-2xl font-bold" data-testid={kpi.testid}>
                    <CountUp to={kpi.value} />
                  </p>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{kpi.caption}</p>
                </CardContent>
              </StatCard>
            </StaggerItem>
          ))}
        </Stagger>

        {/* Connection cards grouped by category */}
        {grouped.map((group) => (
          <div key={group.category} className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {group.category}
              </h2>
              <p className="text-xs text-muted-foreground">{CATEGORY_BLURB[group.category]}</p>
            </div>
            <Stagger className="grid grid-cols-1 lg:grid-cols-2 gap-4" onView>
              {group.items.map((integration) => {
                return (
                  <StaggerItem key={integration.id}>
                    <Card className="h-full flex flex-col" data-testid={`card-integration-${integration.id}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <CardTitle className="text-base">{integration.name}</CardTitle>
                            <CardDescription>{integration.vendor}</CardDescription>
                          </div>
                          <Badge variant="outline" className={statusPill(integration.status)} data-testid={`status-${integration.id}`}>
                            {integration.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col gap-3 text-sm">
                        <p className="text-muted-foreground">{integration.purpose}</p>

                        {integration.records ? (
                          <p className="text-sm font-medium text-foreground" data-testid={`fact-${integration.id}`}>
                            {integration.records.toLocaleString()} {RECORD_NOUN[integration.category] ?? "records"}
                          </p>
                        ) : null}

                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          What it brings in
                        </p>
                        <div className="-mt-1.5 flex flex-wrap gap-1.5">
                          {integration.dataPoints.map((dp) => (
                            <span
                              key={dp}
                              className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground border border-border"
                            >
                              {dp}
                            </span>
                          ))}
                        </div>

                        {integration.statusNote && (
                          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                            {integration.statusNote}
                          </div>
                        )}

                        <p
                          className="mt-auto flex items-center gap-1.5 text-xs text-muted-foreground"
                          data-testid={`lastsync-${integration.id}`}
                        >
                          <Clock className="h-3.5 w-3.5" />{" "}
                          {integration.lastSync === "Live" ? "Syncing live" : `Last synced ${integration.lastSync.toLowerCase()}`}
                        </p>

                      </CardContent>
                    </Card>
                  </StaggerItem>
                );
              })}
            </Stagger>
          </div>
        ))}

      </PageEnter>

    </Layout>
  );
}
