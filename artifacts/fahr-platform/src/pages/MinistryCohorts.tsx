import React, { useMemo, useState } from "react";
import { Link } from "wouter";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import {
  Users,
  BookOpen,
  Gauge,
  Layers,
  Download,
  MessageSquare,
  PlusCircle,
  ChevronRight,
  Search,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  PageEnter,
  Stagger,
  StaggerItem,
  CountUp,
  MOTION,
} from "@/components/motion";
import { useFederalData } from "@/lib/FederalDataContext";
import { useEntityAdmin } from "@/lib/EntityAdminContext";
import { DEPARTMENT_BY_ID, MINISTRY_BY_ID, departmentsOf } from "@/lib/federal";
import { downloadCsv } from "@/lib/exportFile";
import type { Cohort, CohortStatus } from "@/lib/federal/model";
import {
  CohortStatusBadge,
  CohortStatusSelect,
  COHORT_STATUSES,
  PathwaySelect,
  PATHWAY_CHOICES,
} from "@/components/ministry/CohortShared";
import { CohortCreateDialog } from "@/components/ministry/CohortCreateDialog";
import { CohortAnnounceDialog } from "@/components/ministry/CohortAnnounceDialog";

const ALL = "__all__";

export default function MinistryCohorts() {
  const { toast } = useToast();
  const reduceMotion = useReducedMotion();
  const { focus } = useFederalData();
  const { cohorts, createCohort, assignPathway, setCohortStatus, sendCommunication } = useEntityAdmin();

  const ministry = MINISTRY_BY_ID[focus.ministryId];
  const departments = useMemo(() => departmentsOf(focus.ministryId), [focus.ministryId]);

  const [createOpen, setCreateOpen] = useState(false);
  const [announceCohort, setAnnounceCohort] = useState<Cohort | null>(null);
  const [justCreatedId, setJustCreatedId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [departmentFilter, setDepartmentFilter] = useState<string>(ALL);
  const [pathwayFilter, setPathwayFilter] = useState<string>(ALL);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cohorts.filter((c) => {
      if (statusFilter !== ALL && c.status !== statusFilter) return false;
      if (departmentFilter !== ALL && (c.departmentId ?? "") !== departmentFilter) return false;
      if (pathwayFilter !== ALL && c.pathway !== pathwayFilter) return false;
      if (q && !c.name.toLowerCase().includes(q) && !c.pathway.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [cohorts, search, statusFilter, departmentFilter, pathwayFilter]);

  // KPIs from the (unfiltered) cohort list so the headline never shifts with a filter.
  const totalLearners = cohorts.reduce((sum, c) => sum + c.learners, 0);
  const averageProgress =
    totalLearners > 0
      ? Math.round(cohorts.reduce((sum, c) => sum + c.progress * c.learners, 0) / totalLearners)
      : 0;
  const activeCount = cohorts.filter((c) => c.status === "Active").length;

  const departmentName = (id?: string) => (id ? DEPARTMENT_BY_ID[id]?.name ?? id : "Entity-wide");

  const handleCreate = (input: Parameters<typeof createCohort>[0]) => {
    const cohort = createCohort(input);
    setJustCreatedId(cohort.id);
    window.setTimeout(() => setJustCreatedId(null), 2400);
    toast({
      title: "Cohort created",
      description: `${cohort.name} is in your cohort list (${cohort.learners.toLocaleString()} learners).`,
    });
  };

  const handleAssignPathway = (cohort: Cohort, pathway: string) => {
    if (pathway === cohort.pathway) return;
    assignPathway(cohort.id, pathway);
    toast({
      title: pathway === "Unassigned" ? "Pathway cleared" : "Pathway assigned",
      description:
        pathway === "Unassigned"
          ? `${cohort.name} has no Learning Pathway assigned.`
          : `${cohort.name} now follows the ${pathway} pathway.`,
    });
  };

  const handleStatus = (cohort: Cohort, status: CohortStatus) => {
    if (status === cohort.status) return;
    setCohortStatus(cohort.id, status);
    toast({ title: "Status updated", description: `${cohort.name} moved to ${status}.` });
  };

  const handleSend = (input: Parameters<typeof sendCommunication>[0]) => {
    const record = sendCommunication(input);
    toast({
      title: "Announcement sent",
      description: `Sent to ${record.audienceLabel} — ${record.recipients.toLocaleString()} learners.`,
    });
  };

  const handleExport = () => {
    const rows = filtered.map((c) => [
      c.name,
      c.status,
      departmentName(c.departmentId),
      c.pathway,
      c.learners,
      `${c.progress}%`,
      c.startsOn,
    ]);
    const name = downloadCsv({
      filename: "mohap-cohorts",
      title: `${ministry.shortName} — Cohorts & Programmes`,
      notes: [
        `Showing ${filtered.length} of ${cohorts.length} cohorts`,
        statusFilter !== ALL ? `Status: ${statusFilter}` : "Status: all",
        pathwayFilter !== ALL ? `Pathway: ${pathwayFilter}` : "Pathway: all",
      ],
      headers: ["Cohort", "Status", "Department", "Learning Pathway", "Learners", "Progress", "Starts"],
      rows,
    });
    toast({ title: "Export ready", description: `Downloaded ${name}.` });
  };

  const kpis = [
    { label: "Cohorts", value: cohorts.length, icon: Users, tint: "bg-primary/10 text-primary", suffix: "" },
    { label: "Learners enrolled", value: totalLearners, icon: BookOpen, tint: "bg-secondary/10 text-secondary", suffix: "" },
    { label: "Average progress", value: averageProgress, icon: Gauge, tint: "bg-accent/10 text-accent", suffix: "%" },
    { label: "Active cohorts", value: activeCount, icon: Layers, tint: "bg-blue-50 text-blue-700", suffix: "" },
  ];

  const filtersActive =
    search.trim() !== "" || statusFilter !== ALL || departmentFilter !== ALL || pathwayFilter !== ALL;

  return (
    <Layout role="ministry">
      <PageEnter className="space-y-6">
        <PageHeader
          tone="primary"
          icon={<Layers className="h-7 w-7 text-primary" />}
          title="Cohorts & Programmes"
          description={`${ministry.name} — manage learning batches and their Personalised Learning Pathways.`}
          actions={
            <>
              <Button variant="outline" className="gap-2" onClick={handleExport} data-testid="button-export-cohorts">
                <Download className="h-4 w-4" /> Export
              </Button>
              <Button className="gap-2" onClick={() => setCreateOpen(true)} data-testid="button-create-cohort">
                <PlusCircle className="h-4 w-4" /> Create cohort
              </Button>
            </>
          }
        />

        <Stagger className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <StaggerItem key={kpi.label}>
              <StatCard className="h-full hover-elevate transition-all">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className={`rounded-full p-3 ${kpi.tint}`}>
                    <kpi.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{kpi.label}</p>
                    <p className="text-2xl font-bold" data-testid={`kpi-${kpi.label.replace(/\s+/g, "-").toLowerCase()}`}>
                      <CountUp to={kpi.value} suffix={kpi.suffix} />
                    </p>
                  </div>
                </CardContent>
              </StatCard>
            </StaggerItem>
          ))}
        </Stagger>

        <Card>
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-1">
              <CardTitle>Cohort management</CardTitle>
              <CardDescription>
                Showing {filtered.length} of {cohorts.length} cohorts. Assign a Learning Pathway, move a cohort along its
                lifecycle or announce to everyone in it.
              </CardDescription>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search cohorts or pathways"
                  className="pl-9"
                  data-testid="input-cohort-search"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="select-filter-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All statuses</SelectItem>
                  {COHORT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger data-testid="select-filter-department">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={pathwayFilter} onValueChange={setPathwayFilter}>
                <SelectTrigger data-testid="select-filter-pathway">
                  <SelectValue placeholder="Pathway" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All pathways</SelectItem>
                  {PATHWAY_CHOICES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <Empty className="border" data-testid="empty-cohorts">
                <EmptyHeader>
                  <EmptyTitle>No cohorts match these filters</EmptyTitle>
                  <EmptyDescription>
                    {filtersActive
                      ? "Clear a filter to see more, or create a cohort."
                      : "Create your first cohort to get started."}
                  </EmptyDescription>
                </EmptyHeader>
                <div className="flex justify-center gap-2">
                  {filtersActive && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearch("");
                        setStatusFilter(ALL);
                        setDepartmentFilter(ALL);
                        setPathwayFilter(ALL);
                      }}
                      data-testid="button-clear-filters"
                    >
                      Clear filters
                    </Button>
                  )}
                  <Button onClick={() => setCreateOpen(true)} data-testid="button-create-cohort-empty">
                    Create cohort
                  </Button>
                </div>
              </Empty>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cohort</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Learners</TableHead>
                      <TableHead className="w-[180px]">Progress</TableHead>
                      <TableHead className="w-[240px]">Learning Pathway</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <AnimatePresence initial={false}>
                    <motion.tbody layout>
                      {filtered.map((cohort) => {
                        const isNew = cohort.id === justCreatedId;
                        return (
                          <motion.tr
                            key={cohort.id}
                            layout
                            initial={reduceMotion ? false : { opacity: 0, y: -12, backgroundColor: "rgba(15,124,116,0.12)" }}
                            animate={{ opacity: 1, y: 0, backgroundColor: "rgba(0,0,0,0)" }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: MOTION.duration.base, ease: MOTION.ease.out }}
                            className="border-b transition-colors hover:bg-muted/50 focus-within:bg-muted/50"
                            data-testid={`row-cohort-${cohort.id}`}
                          >
                            <TableCell className="font-medium">
                              <Link
                                href={`/ministry/cohorts/${cohort.id}`}
                                className="inline-flex items-center gap-1 text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                                data-testid={`link-cohort-${cohort.id}`}
                              >
                                {cohort.name}
                                {isNew && (
                                  <span className="ml-1 rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                                    New
                                  </span>
                                )}
                              </Link>
                            </TableCell>
                            <TableCell>
                              {cohort.departmentId ? (
                                <Link
                                  href={`/ministry/departments/${cohort.departmentId}`}
                                  className="text-sm text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                                  data-testid={`link-department-${cohort.id}`}
                                >
                                  {departmentName(cohort.departmentId)}
                                </Link>
                              ) : (
                                <span className="text-sm text-muted-foreground">Entity-wide</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <CohortStatusBadge status={cohort.status} />
                            </TableCell>
                            <TableCell>{cohort.learners.toLocaleString()}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress value={cohort.progress} className="h-2 flex-1" />
                                <span className="w-9 text-right text-xs text-muted-foreground">{cohort.progress}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <PathwaySelect
                                value={cohort.pathway}
                                onChange={(pathway) => handleAssignPathway(cohort, pathway)}
                                testId={`select-pathway-${cohort.id}`}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-2">
                                <CohortStatusSelect
                                  value={cohort.status}
                                  onChange={(status) => handleStatus(cohort, status)}
                                  testId={`select-cohort-status-${cohort.id}`}
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => setAnnounceCohort(cohort)}
                                  data-testid={`button-announce-${cohort.id}`}
                                  aria-label={`Announce to ${cohort.name}`}
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                                <Link
                                  href={`/ministry/cohorts/${cohort.id}`}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                  data-testid={`link-open-cohort-${cohort.id}`}
                                  aria-label={`Open ${cohort.name}`}
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </Link>
                              </div>
                            </TableCell>
                          </motion.tr>
                        );
                      })}
                    </motion.tbody>
                  </AnimatePresence>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </PageEnter>

      <CohortCreateDialog
        ministryId={focus.ministryId}
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={handleCreate}
      />
      <CohortAnnounceDialog
        cohort={announceCohort}
        open={announceCohort !== null}
        onOpenChange={(open) => !open && setAnnounceCohort(null)}
        onSend={handleSend}
      />
    </Layout>
  );
}
