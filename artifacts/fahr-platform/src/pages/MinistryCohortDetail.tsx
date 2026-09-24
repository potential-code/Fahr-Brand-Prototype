import React, { useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ArrowLeft,
  Users,
  CheckCircle2,
  Gauge,
  Award,
  ShieldCheck,
  Repeat,
  AlertTriangle,
  Download,
  MessageSquare,
  Search,
  Rocket,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageEnter, Stagger, StaggerItem, ChartReveal, CountUp } from "@/components/motion";
import { useFederalData } from "@/lib/FederalDataContext";
import { useEntityAdmin } from "@/lib/EntityAdminContext";
import {
  DEPARTMENT_BY_ID,
  MINISTRY_BY_ID,
  LEVEL_BY_ID,
  SUBMISSION_STATE_LABEL,
} from "@/lib/federal";
import { CAPABILITY_LEVELS } from "@/lib/constants";
import { cohortSummary } from "@/lib/entityAdmin/selectors";
import { downloadCsv } from "@/lib/exportFile";
import type { CohortMember, AssessmentOutcome, CertificationState } from "@/lib/entityAdmin/model";
import type { CohortStatus } from "@/lib/federal/model";
import {
  CohortStatusBadge,
  CohortStatusSelect,
} from "@/components/ministry/CohortShared";
import { CohortRosterTable } from "@/components/ministry/CohortRosterTable";
import { CohortAnnounceDialog } from "@/components/ministry/CohortAnnounceDialog";

const ALL = "__all__";

const OUTCOME_FILTERS: AssessmentOutcome[] = ["Passed", "Awaiting assessment", "Retake needed"];
const CERT_FILTERS: CertificationState[] = ["Certified", "Ready to certify", "In progress", "Not started"];

export default function MinistryCohortDetail() {
  const { toast } = useToast();
  const [, params] = useRoute("/ministry/cohorts/:cohortId");
  const cohortId = params?.cohortId ?? "";

  const { focus, people, credentials, submissions, getPerson, issueCredential } = useFederalData();
  const { getCohort, setCohortStatus, sendCommunication } = useEntityAdmin();

  const cohort = getCohort(cohortId);

  const [announceOpen, setAnnounceOpen] = useState(false);
  const [certifyingId, setCertifyingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState<string>(ALL);
  const [certFilter, setCertFilter] = useState<string>(ALL);

  const summary = useMemo(
    () => (cohort ? cohortSummary(cohort, people, credentials) : null),
    [cohort, people, credentials],
  );

  const cohortSubmissions = useMemo(() => {
    if (!cohort) return [];
    const cohortPeopleIds = new Set(people.filter((p) => p.cohortId === cohort.id).map((p) => p.id));
    return submissions.filter((s) => s.cohortId === cohort.id || cohortPeopleIds.has(s.personId));
  }, [cohort, people, submissions]);

  if (!cohort || !summary) {
    return (
      <Layout role="ministry">
        <PageEnter className="space-y-6">
          <PageHeader title="Cohort not found" description="This cohort no longer exists in your entity." tone="primary" />
          <Empty className="border" data-testid="empty-cohort-not-found">
            <EmptyHeader>
              <EmptyTitle>We couldn't find that cohort</EmptyTitle>
              <EmptyDescription>It may have been renamed or removed this session.</EmptyDescription>
            </EmptyHeader>
            <Button asChild data-testid="link-back-to-cohorts">
              <Link href="/ministry/cohorts">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to cohorts
              </Link>
            </Button>
          </Empty>
        </PageEnter>
      </Layout>
    );
  }

  const ministry = MINISTRY_BY_ID[focus.ministryId];
  const department = cohort.departmentId ? DEPARTMENT_BY_ID[cohort.departmentId] : undefined;

  const filteredMembers = summary.members.filter((m) => {
    if (outcomeFilter !== ALL && m.assessmentOutcome !== outcomeFilter) return false;
    if (certFilter !== ALL && m.certification !== certFilter) return false;
    const q = search.trim().toLowerCase();
    if (q && !m.name.toLowerCase().includes(q) && !m.role.toLowerCase().includes(q)) return false;
    return true;
  });

  const readyToCertify = summary.members.filter(
    (m) => !m.synthetic && m.certification === "Ready to certify",
  ).length;

  // Charts -------------------------------------------------------------------
  const completionBuckets = [
    { band: "0–25%", count: 0 },
    { band: "26–50%", count: 0 },
    { band: "51–75%", count: 0 },
    { band: "76–99%", count: 0 },
    { band: "100%", count: 0 },
  ];
  for (const m of summary.members) {
    const p = m.pathwayProgress;
    const idx = p >= 100 ? 4 : p >= 76 ? 3 : p >= 51 ? 2 : p >= 26 ? 1 : 0;
    completionBuckets[idx].count += 1;
  }

  const outcomeData = [
    { name: "Passed", value: summary.passed, fill: "hsl(142 71% 40%)" },
    { name: "Retake needed", value: summary.retakes, fill: "hsl(38 92% 50%)" },
    { name: "Awaiting", value: summary.awaiting, fill: "hsl(215 16% 65%)" },
  ];

  const levelMix = CAPABILITY_LEVELS.map((level) => ({
    name: level.label.split(" ")[0],
    count: summary.members.filter((m) => m.levelId === level.id).length,
  }));

  // Actions ------------------------------------------------------------------
  const handleStatus = (status: CohortStatus) => {
    if (status === cohort.status) return;
    setCohortStatus(cohort.id, status);
    toast({ title: "Status updated", description: `${cohort.name} moved to ${status}.` });
  };

  const handleCertify = (member: CohortMember) => {
    setCertifyingId(member.id);
    const person = getPerson(member.id);
    const level = LEVEL_BY_ID[member.levelId];
    issueCredential({
      personId: member.id,
      personName: person?.name ?? member.name,
      title: `${level?.label ?? "Applied AI"} — ${cohort.name}`,
      levelId: member.levelId,
      by: ministry.entityAdmin,
    });
    toast({
      title: "Credential issued",
      description: `${member.name} now holds a verified credential.`,
    });
    window.setTimeout(() => setCertifyingId(null), 800);
  };

  const handleSend = (input: Parameters<typeof sendCommunication>[0]) => {
    const record = sendCommunication(input);
    toast({
      title: "Announcement sent",
      description: `Sent to ${record.audienceLabel} — ${record.recipients.toLocaleString()} learners.`,
    });
  };

  const handleExport = () => {
    const rows = summary.members.map((m) => [
      m.name,
      m.synthetic ? "Sampled" : "Roster",
      m.role,
      LEVEL_BY_ID[m.levelId]?.label ?? m.levelId,
      `${m.pathwayProgress}%`,
      m.assessmentOutcome === "Awaiting assessment" ? "—" : `${m.assessmentScore}%`,
      m.assessmentOutcome,
      m.certification,
      m.lastActive,
    ]);
    const name = downloadCsv({
      filename: `cohort-${cohort.id}`,
      title: `${cohort.name} — Roster`,
      notes: [
        `${ministry.shortName} · ${cohort.name}`,
        `Roster sample: ${summary.members.length} of ${cohort.learners.toLocaleString()} learners`,
      ],
      headers: [
        "Learner",
        "Source",
        "Role",
        "Capability level",
        "Pathway progress",
        "Assessment",
        "Outcome",
        "Certification",
        "Last active",
      ],
      rows,
    });
    toast({ title: "Export ready", description: `Downloaded ${name}.` });
  };

  const kpis = [
    { label: "Enrolled", value: cohort.learners, icon: Users, tint: "bg-primary/10 text-primary", suffix: "" },
    { label: "Completed", value: summary.completed, icon: CheckCircle2, tint: "bg-green-50 text-green-700", suffix: "" },
    { label: "Avg. progress", value: cohort.progress, icon: Gauge, tint: "bg-accent/10 text-accent", suffix: "%" },
    { label: "Avg. assessment", value: summary.averageScore, icon: Award, tint: "bg-blue-50 text-blue-700", suffix: "%" },
    { label: "Passed", value: summary.passed, icon: CheckCircle2, tint: "bg-green-50 text-green-700", suffix: "" },
    { label: "Retakes", value: summary.retakes, icon: Repeat, tint: "bg-amber-50 text-amber-700", suffix: "" },
    { label: "Certified", value: summary.certified, icon: ShieldCheck, tint: "bg-primary/10 text-primary", suffix: "" },
    { label: "At risk", value: summary.atRisk, icon: AlertTriangle, tint: "bg-red-50 text-red-700", suffix: "" },
  ];

  const filtersActive = search.trim() !== "" || outcomeFilter !== ALL || certFilter !== ALL;

  return (
    <Layout role="ministry">
      <PageEnter className="space-y-6">
        <Link
          href="/ministry/cohorts"
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          data-testid="link-back"
        >
          <ArrowLeft className="h-4 w-4" /> Cohorts & Programmes
        </Link>

        <PageHeader
          tone="primary"
          icon={<Users className="h-7 w-7 text-primary" />}
          title={cohort.name}
          description={
            <span className="flex flex-wrap items-center gap-2">
              <CohortStatusBadge status={cohort.status} />
              {department ? (
                <Link
                  href={`/ministry/departments/${department.id}`}
                  className="text-primary hover:underline"
                  data-testid="link-department"
                >
                  {department.name}
                </Link>
              ) : (
                <span className="text-muted-foreground">Entity-wide</span>
              )}
              <span className="text-muted-foreground">· Starts {cohort.startsOn}</span>
            </span>
          }
          actions={
            <>
              <Button variant="outline" className="gap-2" onClick={handleExport} data-testid="button-export-roster">
                <Download className="h-4 w-4" /> Export roster
              </Button>
              <Button className="gap-2" onClick={() => setAnnounceOpen(true)} data-testid="button-announce-cohort">
                <MessageSquare className="h-4 w-4" /> Announce
              </Button>
            </>
          }
        />

        {/* Status controls */}
        <Card>
          <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-muted-foreground">Lifecycle status</span>
              <CohortStatusSelect value={cohort.status} onChange={handleStatus} testId="select-detail-status" />
            </div>
            <div className="flex flex-col gap-1 text-sm md:text-right">
              <span className="text-muted-foreground">Ready to certify</span>
              <span className="text-lg font-semibold text-accent">
                <CountUp to={readyToCertify} /> learner{readyToCertify === 1 ? "" : "s"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* KPIs */}
        <Stagger className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-8">
          {kpis.map((kpi) => (
            <StaggerItem key={kpi.label}>
              <StatCard className="h-full hover-elevate transition-all">
                <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
                  <span className={`rounded-full p-2 ${kpi.tint}`}>
                    <kpi.icon className="h-5 w-5" />
                  </span>
                  <p className="text-2xl font-bold">
                    <CountUp to={kpi.value} suffix={kpi.suffix} />
                  </p>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                </CardContent>
              </StatCard>
            </StaggerItem>
          ))}
        </Stagger>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <ChartReveal direction="rise">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Progress distribution</CardTitle>
                <CardDescription>Roster sample by pathway completion band.</CardDescription>
              </CardHeader>
              <CardContent className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={completionBuckets} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="band" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip cursor={{ fill: "transparent" }} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </ChartReveal>

          <ChartReveal direction="rise" delay={0.05}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Assessment outcomes</CardTitle>
                <CardDescription>How the sample is tracking against the assessment.</CardDescription>
              </CardHeader>
              <CardContent className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={outcomeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip cursor={{ fill: "transparent" }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {outcomeData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </ChartReveal>

          <ChartReveal direction="rise" delay={0.1}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Capability level mix</CardTitle>
                <CardDescription>Where the roster sits on the capability ladder.</CardDescription>
              </CardHeader>
              <CardContent className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={levelMix} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip cursor={{ fill: "transparent" }} />
                    <Bar dataKey="count" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </ChartReveal>
        </div>

        {/* Roster */}
        <Card>
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-1">
              <CardTitle>Roster</CardTitle>
              <CardDescription>
                Showing a sample of {summary.members.length} of {cohort.learners.toLocaleString()} learners. Roster members
                on the entity's authored roster link to their Capability Profile; sampled learners represent the wider
                cohort.
              </CardDescription>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search learners"
                  className="pl-9"
                  data-testid="input-roster-search"
                />
              </div>
              <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
                <SelectTrigger data-testid="select-filter-outcome">
                  <SelectValue placeholder="Outcome" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All outcomes</SelectItem>
                  {OUTCOME_FILTERS.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={certFilter} onValueChange={setCertFilter}>
                <SelectTrigger data-testid="select-filter-certification">
                  <SelectValue placeholder="Certification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All certification states</SelectItem>
                  {CERT_FILTERS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {filteredMembers.length === 0 ? (
              <Empty className="border" data-testid="empty-roster">
                <EmptyHeader>
                  <EmptyTitle>No learners match these filters</EmptyTitle>
                  <EmptyDescription>Adjust the outcome or certification filter to see more.</EmptyDescription>
                </EmptyHeader>
                {filtersActive && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearch("");
                      setOutcomeFilter(ALL);
                      setCertFilter(ALL);
                    }}
                    data-testid="button-clear-roster-filters"
                  >
                    Clear filters
                  </Button>
                )}
              </Empty>
            ) : (
              <CohortRosterTable members={filteredMembers} onCertify={handleCertify} certifyingId={certifyingId} />
            )}
          </CardContent>
        </Card>

        {/* Workplace projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-primary" /> Workplace projects
              </CardTitle>
              <CardDescription>Projects submitted by this cohort's learners.</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild data-testid="link-portfolio">
              <Link href="/ministry/portfolio">Open portfolio</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {cohortSubmissions.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground" data-testid="empty-projects">
                No workplace projects from this cohort yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Learner</TableHead>
                      <TableHead>Impact</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead className="text-right">Open</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cohortSubmissions.map((s) => (
                      <TableRow
                        key={s.id}
                        className="transition-colors hover:bg-muted/50 focus-within:bg-muted/50"
                        data-testid={`row-project-${s.id}`}
                      >
                        <TableCell className="font-medium">{s.title}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {getPerson(s.personId)?.name ?? "Entity team"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              s.impact === "High"
                                ? "border-accent/20 bg-accent/10 text-accent"
                                : "border-slate-200 bg-slate-100 text-slate-600"
                            }
                          >
                            {s.impact}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{SUBMISSION_STATE_LABEL[s.state]}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild data-testid={`link-project-${s.id}`}>
                            <Link href="/ministry/portfolio">View</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Separator />
        <p className="text-xs text-muted-foreground">
          Certification issues a verified credential through the federal store and is only available for learners on the
          entity's authored roster who are ready to certify.
        </p>
      </PageEnter>

      <CohortAnnounceDialog
        cohort={cohort}
        open={announceOpen}
        onOpenChange={setAnnounceOpen}
        onSend={handleSend}
      />
    </Layout>
  );
}
