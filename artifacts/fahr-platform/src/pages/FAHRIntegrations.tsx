import React, { useMemo } from "react";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlugZap, AlertTriangle, Database, FileDown, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFahrConsole } from "@/lib/FahrConsoleContext";
import type { Integration, IntegrationCategory } from "@/lib/federal";
import { CountUp, PageEnter, Stagger, StaggerItem } from "@/components/motion";
import { downloadCsv, printReport } from "@/lib/exportFile";

/** Category order and copy for the connection card groups. */
const CATEGORY_ORDER: IntegrationCategory[] = [
  "Identity",
  "HR",
  "Analytics",
  "Productivity",
  "Content",
  "API",
];

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
  // Records synced today: sum the record counts of connections whose last sync
  // reads "Today" or "Live", since those are the ones that moved data today.
  const recordsToday = integrations
    .filter((i) => i.status !== "Not connected" && (i.lastSync.startsWith("Today") || i.lastSync === "Live"))
    .reduce((sum, i) => sum + (i.records ?? 0), 0);

  const kpis = [
    { label: "Connections live", value: liveCount, icon: PlugZap, tone: "text-green-600", testid: "kpi-live" },
    { label: "Records synced today", value: recordsToday, icon: Database, tone: "text-primary", testid: "kpi-records-today" },
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
        "Reference",
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
        i.reference,
        i.purpose,
      ]),
    });
    toast({ title: "Estate exported", description: `Saved ${name}.` });
  };

  const printEstate = () => {
    printReport({
      title: "Integration estate report",
      subtitle: "FAHR AI Learning Platform — connection administration",
      meta: [
        `${liveCount} live · ${degradedCount} degraded · ${notConnectedCount} not connected`,
        `Generated ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`,
      ],
      sections: [
        {
          heading: "Connection estate",
          facts: [
            { label: "Live", value: String(liveCount) },
            { label: "Degraded", value: String(degradedCount) },
            { label: "Not connected", value: String(notConnectedCount) },
            { label: "Records synced today", value: recordsToday.toLocaleString() },
          ],
          table: {
            headers: ["Name", "Vendor", "Category", "Status", "Direction", "Last sync", "Records", "Owner"],
            numericColumns: [6],
            rows: integrations.map((i) => [
              i.name,
              i.vendor,
              i.category,
              i.status,
              i.direction,
              i.lastSync,
              i.records ? i.records.toLocaleString() : "—",
              i.owner,
            ]),
          },
        },
      ],
      footnote: "Front-end administration view — no third-party systems are contacted and no secrets appear in this report.",
    });
    toast({ title: "Report ready", description: "Sending the integration estate report to print." });
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
              <Button variant="outline" onClick={printEstate} data-testid="button-print-estate">
                <Printer className="w-4 h-4 mr-2" /> Estate report
              </Button>
            </>
          }
        />

        {/* KPI row */}
        <Stagger className="grid grid-cols-2 gap-4">
          {kpis.map((kpi) => (
            <StaggerItem key={kpi.label}>
              <StatCard className="h-full">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <kpi.icon className={`w-6 h-6 mb-2 ${kpi.tone}`} />
                  <p className="text-2xl font-bold" data-testid={kpi.testid}>
                    <CountUp to={kpi.value} />
                  </p>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
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

                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                          <div>
                            <span className="text-muted-foreground">Direction</span>
                            <p className="font-medium">{integration.direction}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Last sync</span>
                            <p className="font-medium" data-testid={`lastsync-${integration.id}`}>
                              {integration.lastSync}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Records</span>
                            <p className="font-medium">
                              {integration.records ? integration.records.toLocaleString() : "—"}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Owner</span>
                            <p className="font-medium">{integration.owner}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {integration.dataPoints.map((dp) => (
                            <span
                              key={dp}
                              className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground border border-border"
                            >
                              {dp}
                            </span>
                          ))}
                        </div>

                        <p className="text-[11px] text-muted-foreground">{integration.reference}</p>

                        {integration.statusNote && (
                          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                            {integration.statusNote}
                          </div>
                        )}

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
