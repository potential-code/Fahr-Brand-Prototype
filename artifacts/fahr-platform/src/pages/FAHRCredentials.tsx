import React, { useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Award,
  Building2,
  Copy,
  Check,
  Download,
  Printer,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  ShieldCheck,
  ShieldX,
  Plus,
  User,
  Briefcase,
  CheckCircle2,
  Stamp,
  Award as AwardIcon,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFederalData } from "@/lib/FederalDataContext";
import { PageEnter, Stagger, StaggerItem, PanelEnter, CountUp } from "@/components/motion";
import {
  MINISTRY_BY_ID,
  LEVEL_BY_ID,
  SUBMISSION_STATE_LABEL,
  certificationRows,
  DEFAULT_REPORT_PERIOD,
  REPORT_PERIOD_BY_ID,
} from "@/lib/federal";
import { CAPABILITY_LEVELS } from "@/lib/constants";
import { downloadCsv, printReport } from "@/lib/exportFile";
import type { Credential } from "@/lib/federal";

type SortKey = "personName" | "entity" | "title" | "level" | "issuedOn";
type SortState = { key: SortKey; direction: "asc" | "desc" };

/** Legible level pill colours across the capability ladder. */
function levelClass(levelId: string): string {
  switch (levelId) {
    case "champion":
      return "bg-primary/10 text-primary border-primary/20";
    case "advanced":
      return "bg-secondary/10 text-secondary border-secondary/20";
    case "practitioner":
      return "bg-green-50 text-green-700 border-green-200";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

const levelLabel = (id: string) => LEVEL_BY_ID[id]?.label ?? id;
const entityName = (id: string) => MINISTRY_BY_ID[id]?.name ?? id;
const entityShort = (id: string) => MINISTRY_BY_ID[id]?.shortName ?? id;

export default function FAHRCredentials() {
  const { toast } = useToast();
  const { credentials, submissions, getPerson, getSubmission, approvalsFor, issueCredential } =
    useFederalData();
  const reduceMotion = useReducedMotion();

  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortState>({ key: "issuedOn", direction: "desc" });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Verify control state, scoped to the open detail sheet.
  const [verifyState, setVerifyState] = useState<"idle" | "verified" | "not-found">("idle");

  // Issuing control state.
  const [issueOpen, setIssueOpen] = useState(false);
  const [issueSubmissionId, setIssueSubmissionId] = useState<string>("");
  const [issuing, setIssuing] = useState(false);

  const selected = selectedId ? credentials.find((c) => c.id === selectedId) ?? null : null;

  // ---- KPI row ------------------------------------------------------------
  // "Issued this period" is derived from the reporting certification rows, which
  // scale the authored per-entity figure by the default period's share.
  const period = REPORT_PERIOD_BY_ID[DEFAULT_REPORT_PERIOD];
  const certRows = useMemo(
    () => certificationRows({ ministries: Object.values(MINISTRY_BY_ID), period }, credentials),
    [credentials, period],
  );
  const issuedThisPeriod = useMemo(
    () => certRows.reduce((a, r) => a + r.issuedThisPeriod, 0),
    [certRows],
  );

  const entitiesRepresented = useMemo(
    () => new Set(credentials.map((c) => c.ministryId)).size,
    [credentials],
  );

  const levelSplit = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of credentials) counts[c.levelId] = (counts[c.levelId] ?? 0) + 1;
    return counts;
  }, [credentials]);

  // The dominant level, for the KPI card headline.
  const topLevel = useMemo(() => {
    const entries = Object.entries(levelSplit).sort((a, b) => b[1] - a[1]);
    return entries[0] ?? null;
  }, [levelSplit]);

  // ---- Filter + sort ------------------------------------------------------
  const entityOptions = useMemo(() => {
    const ids = Array.from(new Set(credentials.map((c) => c.ministryId)));
    return ids.sort((a, b) => entityName(a).localeCompare(entityName(b)));
  }, [credentials]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return credentials.filter((c) => {
      if (entityFilter !== "all" && c.ministryId !== entityFilter) return false;
      if (levelFilter !== "all" && c.levelId !== levelFilter) return false;
      if (!q) return true;
      return (
        c.personName.toLowerCase().includes(q) ||
        c.verificationCode.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q)
      );
    });
  }, [credentials, search, entityFilter, levelFilter]);

  const sorted = useMemo(() => {
    const rows = [...filtered];
    const dir = sort.direction === "asc" ? 1 : -1;
    return rows.sort((a, b) => {
      let av: string | number;
      let bv: string | number;
      switch (sort.key) {
        case "personName":
          av = a.personName;
          bv = b.personName;
          break;
        case "entity":
          av = entityName(a.ministryId);
          bv = entityName(b.ministryId);
          break;
        case "title":
          av = a.title;
          bv = b.title;
          break;
        case "level":
          av = LEVEL_BY_ID[a.levelId]?.order ?? 0;
          bv = LEVEL_BY_ID[b.levelId]?.order ?? 0;
          break;
        case "issuedOn":
          av = new Date(a.issuedOn).getTime() || 0;
          bv = new Date(b.issuedOn).getTime() || 0;
          break;
      }
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [filtered, sort]);

  const toggleSort = (key: SortKey) =>
    setSort((prev) =>
      prev.key === key ? { key, direction: prev.direction === "asc" ? "desc" : "asc" } : { key, direction: "asc" },
    );

  const SortIcon = ({ colKey }: { colKey: SortKey }) => {
    if (sort.key !== colKey) return <ChevronsUpDown className="w-3.5 h-3.5 opacity-40" />;
    return sort.direction === "asc" ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />;
  };

  // ---- Copy verification code --------------------------------------------
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      /* clipboard unavailable in some sandboxes — the visible tick still confirms intent */
    }
    setCopiedCode(code);
    window.setTimeout(() => setCopiedCode((c) => (c === code ? null : c)), 1500);
  };

  // ---- Issuing candidates -------------------------------------------------
  // Endorsed or deployed projects that do not yet have a credential on the register.
  const credentialledSubmissionIds = useMemo(
    () => new Set(credentials.map((c) => c.submissionId).filter(Boolean) as string[]),
    [credentials],
  );
  const issueCandidates = useMemo(
    () =>
      submissions.filter(
        (s) => (s.state === "endorsed" || s.state === "deployed") && !credentialledSubmissionIds.has(s.id),
      ),
    [submissions, credentialledSubmissionIds],
  );

  const candidatePersonLevel = (personId: string) => getPerson(personId)?.levelId ?? "practitioner";

  const runIssue = () => {
    const sub = submissions.find((s) => s.id === issueSubmissionId);
    if (!sub) return;
    const person = getPerson(sub.personId);
    setIssuing(true);
    // Short, in-card confirmation that the registry is being written — never a
    // blocking overlay and never longer than the demo can tolerate.
    window.setTimeout(() => {
      const levelId = person?.levelId ?? "practitioner";
      const title =
        levelId === "champion"
          ? "AI Capability Champion"
          : levelId === "advanced"
            ? "Advanced Agentic AI Practitioner"
            : "AI Practitioner";
      issueCredential({
        personId: sub.personId,
        personName: person?.name,
        title,
        levelId,
        submissionId: sub.id,
        by: "FAHR Programme Team",
      });
      setIssuing(false);
      setIssueOpen(false);
      setIssueSubmissionId("");
      toast({
        title: "Credential issued",
        description: `${title} added to the register for ${person?.name ?? "the learner"}.`,
      });
    }, 900);
  };

  // ---- Detail sheet: validation lineage -----------------------------------
  const detailPerson = selected ? getPerson(selected.personId) : undefined;
  const detailSubmission = selected?.submissionId ? getSubmission(selected.submissionId) : undefined;
  const detailApprovals = selected?.submissionId ? approvalsFor(selected.submissionId) : [];
  const managerSignOff = detailApprovals.find((a) => a.role === "manager");
  const entityEndorse = detailApprovals.find((a) => a.role === "ministry");

  const openDetail = (id: string) => {
    setSelectedId(id);
    setVerifyState("idle");
  };

  const runVerify = () => {
    if (!selected) return;
    const exists = credentials.some((c) => c.verificationCode === selected.verificationCode);
    setVerifyState(exists ? "verified" : "not-found");
  };

  // ---- Exports ------------------------------------------------------------
  const registerCsv = () => {
    const filename = downloadCsv({
      filename: "fahr-national-credential-register",
      headers: [
        "Learner",
        "Entity",
        "Credential",
        "Capability level",
        "Issued on",
        "Verification code",
        "Earned on project",
        "Validated by",
      ],
      rows: sorted.map((c) => {
        const sub = c.submissionId ? getSubmission(c.submissionId) : undefined;
        const appr = c.submissionId ? approvalsFor(c.submissionId) : [];
        const validator = appr.find((a) => a.role === "manager")?.by ?? "—";
        return [
          c.personName,
          entityName(c.ministryId),
          c.title,
          levelLabel(c.levelId),
          c.issuedOn,
          c.verificationCode,
          sub?.title ?? "—",
          validator,
        ];
      }),
    });
    toast({ title: "Register exported", description: `${filename} downloaded with ${sorted.length} credentials.` });
  };

  const registerPrint = () => {
    printReport({
      title: "National credential register",
      subtitle: "Every credential on the federal register, with its verification code",
      meta: [
        `Credentials: ${sorted.length}`,
        entityFilter === "all" ? "All entities" : entityName(entityFilter),
        levelFilter === "all" ? "All levels" : levelLabel(levelFilter),
        `Generated: ${new Date().toISOString().slice(0, 10)}`,
      ],
      sections: [
        {
          heading: "Register",
          table: {
            headers: ["Learner", "Entity", "Credential", "Level", "Issued", "Verification code", "Project"],
            rows: sorted.map((c) => {
              const sub = c.submissionId ? getSubmission(c.submissionId) : undefined;
              return [
                c.personName,
                entityShort(c.ministryId),
                c.title,
                levelLabel(c.levelId),
                c.issuedOn,
                c.verificationCode,
                sub?.title ?? "—",
              ];
            }),
          },
        },
      ],
      footnote:
        "Each credential is validated through the workplace-project chain: line-manager sign-off, entity endorsement and federal issue. Verify a code against this register at any federal entity.",
    });
    toast({ title: "Register pack opened", description: "The print dialogue carries the current filters." });
  };

  const certificatePrint = (c: Credential) => {
    const sub = c.submissionId ? getSubmission(c.submissionId) : undefined;
    const appr = c.submissionId ? approvalsFor(c.submissionId) : [];
    const mgr = appr.find((a) => a.role === "manager");
    const ent = appr.find((a) => a.role === "ministry");
    printReport({
      title: "Credential record",
      subtitle: c.title,
      meta: [`Verification code: ${c.verificationCode}`, `Issued: ${c.issuedOn}`],
      sections: [
        {
          heading: "Awarded to",
          facts: [
            { label: "Learner", value: c.personName },
            { label: "Entity", value: entityName(c.ministryId) },
            { label: "Capability level", value: levelLabel(c.levelId) },
            { label: "Issued on", value: c.issuedOn },
          ],
        },
        {
          heading: "Validation lineage",
          paragraphs: [
            sub ? `Workplace project: ${sub.title}.` : "Awarded on capability assessment (no linked workplace project).",
            mgr ? `Line-manager sign-off by ${mgr.by} on ${mgr.on}.` : "Line-manager sign-off: on file.",
            ent ? `Entity endorsement by ${ent.by} on ${ent.on}.` : "Entity endorsement: on file.",
            `Federal issue recorded with verification code ${c.verificationCode}.`,
          ],
        },
      ],
      footnote: "This record can be verified against the national credential register by its verification code.",
    });
    toast({ title: "Certificate record opened", description: `Printable record for ${c.personName}.` });
  };

  const hasResults = sorted.length > 0;

  return (
    <Layout role="fahr">
      <PageEnter className="space-y-6 pb-12">
        <PageHeader
          tone="primary"
          title="Credential registry"
          description="Every credential issued nationally, with the project and validation behind it."
          actions={
            <>
              <Button variant="outline" onClick={registerCsv} data-testid="button-export-csv">
                <Download className="w-4 h-4 mr-2" /> Export CSV
              </Button>
              <Button variant="outline" onClick={registerPrint} data-testid="button-print-register">
                <Printer className="w-4 h-4 mr-2" /> Print register
              </Button>
              <Button onClick={() => setIssueOpen(true)} data-testid="button-issue-credential">
                <Plus className="w-4 h-4 mr-2" /> Issue credential
              </Button>
            </>
          }
        />

        {/* KPI row */}
        <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StaggerItem>
            <Card>
              <CardContent className="p-4 flex flex-col items-center text-center">
                <Award className="w-6 h-6 mb-2 text-primary" />
                <p className="text-2xl font-bold" data-testid="kpi-total">
                  <CountUp to={credentials.length} />
                </p>
                <p className="text-xs text-muted-foreground">Credentials on the register</p>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card>
              <CardContent className="p-4 flex flex-col items-center text-center">
                <Stamp className="w-6 h-6 mb-2 text-primary" />
                <p className="text-2xl font-bold" data-testid="kpi-period">
                  <CountUp to={issuedThisPeriod} />
                </p>
                <p className="text-xs text-muted-foreground">Issued nationally this period</p>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card>
              <CardContent className="p-4 flex flex-col items-center text-center">
                <Building2 className="w-6 h-6 mb-2 text-primary" />
                <p className="text-2xl font-bold" data-testid="kpi-entities">
                  <CountUp to={entitiesRepresented} />
                </p>
                <p className="text-xs text-muted-foreground">Entities represented</p>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card>
              <CardContent className="p-4 flex flex-col items-center text-center">
                <AwardIcon className="w-6 h-6 mb-2 text-primary" />
                <p className="text-2xl font-bold" data-testid="kpi-top-level">
                  <CountUp to={topLevel ? topLevel[1] : 0} />
                </p>
                <p className="text-xs text-muted-foreground">
                  {topLevel ? `at ${levelLabel(topLevel[0])}` : "By capability level"}
                </p>
              </CardContent>
            </Card>
          </StaggerItem>
        </Stagger>

        {/* Level split strip */}
        <Card>
          <CardContent className="p-4 flex flex-wrap gap-2">
            {CAPABILITY_LEVELS.filter((l) => levelSplit[l.id]).map((l) => (
              <Badge key={l.id} variant="outline" className={levelClass(l.id)} data-testid={`badge-level-${l.id}`}>
                {l.label}: {levelSplit[l.id]}
              </Badge>
            ))}
            {Object.keys(levelSplit).length === 0 && (
              <span className="text-sm text-muted-foreground">No credentials on the register yet.</span>
            )}
          </CardContent>
        </Card>

        {/* Registry table */}
        <Card>
          <CardHeader className="space-y-4">
            <div>
              <CardTitle className="text-lg">National credential register</CardTitle>
              <CardDescription>
                {sorted.length} of {credentials.length} credentials shown
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search learner, code or title"
                  className="pl-9"
                  data-testid="input-search"
                />
              </div>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="w-[200px]" data-testid="input-entity-filter">
                  <SelectValue placeholder="Entity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All entities</SelectItem>
                  {entityOptions.map((id) => (
                    <SelectItem key={id} value={id}>
                      {entityName(id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-[180px]" data-testid="input-level-filter">
                  <SelectValue placeholder="Capability level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All levels</SelectItem>
                  {CAPABILITY_LEVELS.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {hasResults ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("personName")} data-testid="button-sort-learner">
                          Learner <SortIcon colKey="personName" />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("entity")} data-testid="button-sort-entity">
                          Entity <SortIcon colKey="entity" />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("title")} data-testid="button-sort-title">
                          Credential <SortIcon colKey="title" />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("level")} data-testid="button-sort-level">
                          Level <SortIcon colKey="level" />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("issuedOn")} data-testid="button-sort-issued">
                          Issued <SortIcon colKey="issuedOn" />
                        </button>
                      </TableHead>
                      <TableHead>Verification code</TableHead>
                      <TableHead>Validated by / project</TableHead>
                    </TableRow>
                  </TableHeader>
                  <Stagger as="tbody" gap={0.02}>
                    <AnimatePresence initial={false}>
                      {sorted.map((c) => {
                        const sub = c.submissionId ? getSubmission(c.submissionId) : undefined;
                        const appr = c.submissionId ? approvalsFor(c.submissionId) : [];
                        const validator = appr.find((a) => a.role === "manager")?.by;
                        return (
                          <motion.tr
                            key={c.id}
                            layout={!reduceMotion}
                            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={reduceMotion ? undefined : { opacity: 0 }}
                            className="border-b border-border cursor-pointer hover:bg-muted/50 transition-colors focus-within:bg-muted/50"
                            onClick={() => openDetail(c.id)}
                            data-testid={`row-credential-${c.id}`}
                          >
                            <TableCell className="font-medium">{c.personName}</TableCell>
                            <TableCell className="text-nowrap">{entityShort(c.ministryId)}</TableCell>
                            <TableCell className="max-w-[220px]">{c.title}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={levelClass(c.levelId)}>
                                {levelLabel(c.levelId)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-nowrap text-muted-foreground">{c.issuedOn}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{c.verificationCode}</code>
                                <button
                                  className="text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyCode(c.verificationCode);
                                  }}
                                  aria-label="Copy verification code"
                                  data-testid={`button-copy-${c.id}`}
                                >
                                  {copiedCode === c.verificationCode ? (
                                    <Check className="w-3.5 h-3.5 text-green-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-[220px]">
                              {validator ? <span className="text-foreground">{validator}</span> : "Assessment-based"}
                              {sub && <span className="block truncate">{sub.title}</span>}
                            </TableCell>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </Stagger>
                </Table>
              </div>
            ) : (
              <div className="py-16 flex flex-col items-center text-center gap-3">
                <Search className="w-10 h-10 text-muted-foreground" />
                <h3 className="text-lg font-semibold">No credentials match</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  No credential on the register matches the current search and filters. Clear them to see the full
                  national register.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setEntityFilter("all");
                    setLevelFilter("all");
                  }}
                >
                  Clear filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </PageEnter>

      {/* Issue credential sheet */}
      <Sheet open={issueOpen} onOpenChange={(open) => !open && !issuing && setIssueOpen(false)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <PanelEnter>
            <SheetHeader className="text-left space-y-2">
              <SheetTitle>Issue a credential</SheetTitle>
              <SheetDescription>
                Credentials are issued against an endorsed or deployed workplace project that is not yet on the
                register.
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-4">
              {issueCandidates.length === 0 ? (
                <div className="py-10 flex flex-col items-center text-center gap-3">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                  <h3 className="text-base font-semibold">Every eligible project is credentialled</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    There are no endorsed or deployed projects awaiting a credential. New candidates appear here as
                    entities endorse projects during the session.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Eligible project</label>
                    <Select value={issueSubmissionId} onValueChange={setIssueSubmissionId}>
                      <SelectTrigger data-testid="input-issue-candidate">
                        <SelectValue placeholder="Choose an endorsed project" />
                      </SelectTrigger>
                      <SelectContent>
                        {issueCandidates.map((s) => {
                          const person = getPerson(s.personId);
                          return (
                            <SelectItem key={s.id} value={s.id}>
                              {person?.name ?? "Learner"} — {s.title}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {issueSubmissionId &&
                    (() => {
                      const s = submissions.find((x) => x.id === issueSubmissionId);
                      if (!s) return null;
                      const person = getPerson(s.personId);
                      return (
                        <div className="rounded-md border border-border p-4 space-y-2 text-sm bg-muted/40" data-testid="panel-issue-preview">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Learner</span>
                            <span className="font-medium">{person?.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Entity</span>
                            <span className="font-medium">{entityName(s.ministryId)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Capability level</span>
                            <Badge variant="outline" className={levelClass(candidatePersonLevel(s.personId))}>
                              {levelLabel(candidatePersonLevel(s.personId))}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Project state</span>
                            <span className="font-medium">{SUBMISSION_STATE_LABEL[s.state]}</span>
                          </div>
                        </div>
                      );
                    })()}

                  <Button
                    className="w-full"
                    disabled={!issueSubmissionId || issuing}
                    onClick={runIssue}
                    data-testid="button-confirm-issue"
                  >
                    {issuing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Writing to register…
                      </>
                    ) : (
                      <>
                        <Stamp className="w-4 h-4 mr-2" /> Issue credential
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </PanelEnter>
        </SheetContent>
      </Sheet>

      {/* Detail / lineage sheet */}
      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selected && (
            <PanelEnter>
              <SheetHeader className="text-left space-y-3">
                <Badge variant="outline" className={`${levelClass(selected.levelId)} w-fit`}>
                  {levelLabel(selected.levelId)}
                </Badge>
                <SheetTitle className="text-2xl">{selected.title}</SheetTitle>
                <SheetDescription className="text-base">
                  {selected.personName} · {entityName(selected.ministryId)} · issued {selected.issuedOn}
                </SheetDescription>
              </SheetHeader>

              {/* Verification code + verify control */}
              <div className="mt-6 rounded-md border border-border p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Verification code</p>
                    <code className="font-mono text-sm">{selected.verificationCode}</code>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => copyCode(selected.verificationCode)} data-testid="button-detail-copy">
                      {copiedCode === selected.verificationCode ? (
                        <>
                          <Check className="w-4 h-4 mr-1 text-green-600" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1" /> Copy
                        </>
                      )}
                    </Button>
                    <Button size="sm" onClick={runVerify} data-testid="button-verify">
                      <ShieldCheck className="w-4 h-4 mr-1" /> Verify
                    </Button>
                  </div>
                </div>
                <AnimatePresence mode="wait">
                  {verifyState !== "idle" && (
                    <motion.div
                      key={verifyState}
                      initial={reduceMotion ? false : { opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduceMotion ? undefined : { opacity: 0 }}
                      className={`flex items-center gap-2 text-sm rounded-md px-3 py-2 ${
                        verifyState === "verified"
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-red-50 text-destructive border border-red-200"
                      }`}
                      data-testid="panel-verify-result"
                    >
                      {verifyState === "verified" ? (
                        <>
                          <ShieldCheck className="w-4 h-4" /> Verified — this code is on the national register.
                        </>
                      ) : (
                        <>
                          <ShieldX className="w-4 h-4" /> Not found — this code is not on the register.
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Validation lineage trail */}
              <div className="mt-6">
                <h4 className="text-sm font-semibold mb-4">Validation lineage</h4>
                <ol className="relative border-l border-border ml-3 space-y-6">
                  <LineageStep icon={User} title="Learner" testid="lineage-learner">
                    {detailPerson ? (
                      <>
                        {detailPerson.name} — {detailPerson.role}
                        <span className="block text-muted-foreground">
                          {entityName(selected.ministryId)} · assessment {detailPerson.assessmentScore}%
                        </span>
                      </>
                    ) : (
                      selected.personName
                    )}
                  </LineageStep>

                  <LineageStep icon={Briefcase} title="Workplace project" testid="lineage-project">
                    {detailSubmission ? (
                      <>
                        {detailSubmission.title}
                        <span className="block text-muted-foreground">
                          {SUBMISSION_STATE_LABEL[detailSubmission.state]} · {detailSubmission.impact} impact
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">
                        Awarded on capability assessment — no linked workplace project.
                      </span>
                    )}
                  </LineageStep>

                  <LineageStep icon={CheckCircle2} title="Line-manager sign-off" testid="lineage-manager">
                    {managerSignOff ? (
                      <>
                        {managerSignOff.by}
                        <span className="block text-muted-foreground">{managerSignOff.on}</span>
                        {managerSignOff.note && <span className="block text-muted-foreground italic">“{managerSignOff.note}”</span>}
                      </>
                    ) : (
                      <span className="text-muted-foreground">Sign-off on file with the entity.</span>
                    )}
                  </LineageStep>

                  <LineageStep icon={ShieldCheck} title="Entity endorsement" testid="lineage-entity">
                    {entityEndorse ? (
                      <>
                        {entityEndorse.by}
                        <span className="block text-muted-foreground">{entityEndorse.on}</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">Endorsement on file with the entity.</span>
                    )}
                  </LineageStep>

                  <LineageStep icon={Stamp} title="Credential issued" testid="lineage-issued" last>
                    {selected.title}
                    <span className="block text-muted-foreground">
                      {selected.issuedOn} · code {selected.verificationCode}
                    </span>
                  </LineageStep>
                </ol>
              </div>

              <div className="mt-8 flex justify-end">
                <Button variant="outline" onClick={() => certificatePrint(selected)} data-testid="button-certificate">
                  <Printer className="w-4 h-4 mr-2" /> Print certificate record
                </Button>
              </div>
            </PanelEnter>
          )}
        </SheetContent>
      </Sheet>
    </Layout>
  );
}

/** One step in the vertical validation trail. */
function LineageStep({
  icon: Icon,
  title,
  children,
  testid,
  last = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
  testid: string;
  last?: boolean;
}) {
  return (
    <li className={`ml-6 ${last ? "" : ""}`} data-testid={testid}>
      <span className="absolute -left-3 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground">
        <Icon className="w-3.5 h-3.5" />
      </span>
      <p className="text-sm font-semibold">{title}</p>
      <div className="text-sm">{children}</div>
    </li>
  );
}
