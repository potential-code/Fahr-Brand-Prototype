import React, { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { PageEnter, PanelEnter } from "@/components/motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import {
  BookOpen,
  CheckCircle2,
  Clock3,
  FilePlus2,
  FileText,
  Layers,
  Plus,
  Search,
  ShieldAlert,
  History,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEntityAdmin } from "@/lib/EntityAdminContext";
import type { ContentRecord, ContentStatus } from "@/lib/entityAdmin/model";
import { CONTENT_STATUSES } from "@/lib/entityAdmin/model";
import {
  CONTENT_PROGRAMMES,
  CONTENT_AUDIENCES,
} from "@/lib/entityAdmin/seed";
import { PATHWAY_OPTIONS } from "@/lib/entityAdmin/seed";
import { competencyLabel } from "@/lib/federal";
import { COMPETENCIES } from "@/lib/learningData";
import { downloadCsv } from "@/lib/exportFile";
import { KpiRow, FilterSelect, StatusPill, type Kpi } from "@/components/ministry/CatalogueKit";

const CONTENT_TYPES: ContentRecord["type"][] = [
  "Course",
  "Microlearning",
  "Simulation",
  "Assignment",
  "Virtual session",
];
const CONTENT_LANGUAGES: ContentRecord["language"][] = ["English", "Arabic", "Bilingual"];

/** Valid manual status moves from a given status (publish/retire are separate). */
const NEXT_STATUSES: Record<ContentStatus, ContentStatus[]> = {
  Draft: ["In review"],
  "In review": ["Draft", "Scheduled", "Published"],
  Scheduled: ["Published", "In review"],
  Published: [],
  Retired: [],
};

export default function MinistryContent() {
  const { toast } = useToast();
  const reduceMotion = useReducedMotion();
  const { content, createContent, publishContent, retireContent, setContentStatus } = useEntityAdmin();

  const [search, setSearch] = useState("");
  const [programme, setProgramme] = useState("all");
  const [pathway, setPathway] = useState("all");
  const [competency, setCompetency] = useState("all");
  const [audience, setAudience] = useState("all");
  const [language, setLanguage] = useState("all");
  const [status, setStatus] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [justPublishedId, setJustPublishedId] = useState<string | null>(null);

  // Create-form state.
  const [form, setForm] = useState({
    title: "",
    type: "Microlearning" as ContentRecord["type"],
    programme: CONTENT_PROGRAMMES[0],
    pathway: PATHWAY_OPTIONS[0],
    competencyId: COMPETENCIES[0].id,
    audience: CONTENT_AUDIENCES[0],
    language: "English" as ContentRecord["language"],
    durationMins: "45",
    summary: "",
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return content.filter((item) => {
      if (programme !== "all" && item.programme !== programme) return false;
      if (pathway !== "all" && item.pathway !== pathway) return false;
      if (competency !== "all" && item.competencyId !== competency) return false;
      if (audience !== "all" && item.audience !== audience) return false;
      if (language !== "all" && item.language !== language) return false;
      if (status !== "all" && item.status !== status) return false;
      if (q && !`${item.title} ${item.owner} ${item.programme}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [content, search, programme, pathway, competency, audience, language, status]);

  // KPIs and competency coverage read from the whole catalogue, not the filter.
  const counts = useMemo(() => {
    const by = (s: ContentStatus) => content.filter((c) => c.status === s).length;
    const publishedByCompetency = new Map<string, number>();
    for (const item of content) {
      if (item.status === "Published") {
        publishedByCompetency.set(item.competencyId, (publishedByCompetency.get(item.competencyId) ?? 0) + 1);
      }
    }
    const coveredCompetencies = COMPETENCIES.filter((c) => (publishedByCompetency.get(c.id) ?? 0) > 0);
    const uncovered = COMPETENCIES.filter((c) => (publishedByCompetency.get(c.id) ?? 0) === 0);
    return {
      published: by("Published"),
      inReview: by("In review"),
      draft: by("Draft"),
      retired: by("Retired"),
      scheduled: by("Scheduled"),
      publishedByCompetency,
      coverage: coveredCompetencies.length,
      uncovered,
    };
  }, [content]);

  const selected = selectedId ? content.find((c) => c.id === selectedId) ?? null : null;

  const kpis: Kpi[] = [
    { label: "Published", value: counts.published, icon: CheckCircle2, color: "text-green-600", testId: "kpi-published" },
    { label: "In review", value: counts.inReview, icon: Clock3, color: "text-amber-600", testId: "kpi-in-review" },
    { label: "Drafts", value: counts.draft, icon: FileText, color: "text-slate-500", testId: "kpi-drafts" },
    { label: "Retired", value: counts.retired, icon: ShieldAlert, color: "text-rose-600", testId: "kpi-retired" },
    {
      label: "Competency coverage",
      value: counts.coverage,
      suffix: `/${COMPETENCIES.length}`,
      icon: Layers,
      color: "text-primary",
      testId: "kpi-coverage",
      hint: counts.uncovered.length === 0 ? "All competencies covered" : `${counts.uncovered.length} with no published item`,
    },
  ];

  const resetForm = () =>
    setForm({
      title: "",
      type: "Microlearning",
      programme: CONTENT_PROGRAMMES[0],
      pathway: PATHWAY_OPTIONS[0],
      competencyId: COMPETENCIES[0].id,
      audience: CONTENT_AUDIENCES[0],
      language: "English",
      durationMins: "45",
      summary: "",
    });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const record = createContent({
      title: form.title.trim(),
      type: form.type,
      programme: form.programme,
      pathway: form.pathway,
      competencyId: form.competencyId,
      audience: form.audience,
      language: form.language,
      durationMins: Math.max(5, Number(form.durationMins) || 45),
      summary: form.summary.trim() || "Entity-authored catalogue item.",
    });
    setCreateOpen(false);
    resetForm();
    setSelectedId(record.id);
    toast({
      title: "Draft created",
      description: `"${record.title}" is in the catalogue as a Draft (${record.version}).`,
    });
  };

  const handlePublish = (item: ContentRecord) => {
    publishContent(item.id);
    setJustPublishedId(item.id);
    window.setTimeout(() => setJustPublishedId((cur) => (cur === item.id ? null : cur)), 2200);
    toast({
      title: "Published to the catalogue",
      description: `"${item.title}" is live for ${item.audience}. Version bumped and stamped in the history.`,
    });
  };

  const handleRetire = (item: ContentRecord) => {
    retireContent(item.id);
    toast({ title: "Retired", description: `"${item.title}" has been retired from the catalogue.` });
  };

  const handleExport = () => {
    const name = downloadCsv({
      filename: "entity-content-catalogue",
      title: "MOHAP — Content Catalogue",
      notes: [`${filtered.length} of ${content.length} items`, `Exported for the entity catalogue review`],
      headers: ["Title", "Type", "Programme", "Pathway", "Competency", "Audience", "Language", "Version", "Status", "Updated", "Owner", "Duration (mins)"],
      rows: filtered.map((c) => [
        c.title,
        c.type,
        c.programme,
        c.pathway,
        competencyLabel(c.competencyId),
        c.audience,
        c.language,
        c.version,
        c.status,
        c.updatedOn,
        c.owner,
        c.durationMins,
      ]),
    });
    toast({ title: "Catalogue exported", description: `Saved ${name}.` });
  };

  return (
    <Layout role="ministry">
      <PageEnter className="space-y-6">
        <PageHeader
          tone="primary"
          icon={<BookOpen className="h-7 w-7 text-primary" />}
          title="Content Catalogue"
          description="Browse the entity catalogue by programme, pathway, competency, audience and language, and create, publish or retire an item."
          actions={
            <>
              <Button variant="outline" onClick={handleExport} data-testid="button-export-content">
                Export catalogue
              </Button>
              <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm(); }}>
                <DialogTrigger asChild>
                  <Button className="gap-2" data-testid="button-create-content">
                    <Plus className="h-4 w-4" /> New content
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[560px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <FilePlus2 className="h-5 w-5 text-primary" /> Create catalogue item
                    </DialogTitle>
                    <DialogDescription>
                      A new item enters the catalogue as a Draft at v0.1. Move it through review before you publish.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreate} className="space-y-4 py-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="content-title">Title</label>
                      <Input
                        id="content-title"
                        value={form.title}
                        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                        placeholder="e.g. Reading Service Data with AI"
                        data-testid="input-content-title"
                        autoFocus
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Type</label>
                        <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as ContentRecord["type"] }))}>
                          <SelectTrigger data-testid="select-content-type"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {CONTENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Programme</label>
                        <Select value={form.programme} onValueChange={(v) => setForm((f) => ({ ...f, programme: v }))}>
                          <SelectTrigger data-testid="select-content-programme"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {CONTENT_PROGRAMMES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Learning pathway</label>
                        <Select value={form.pathway} onValueChange={(v) => setForm((f) => ({ ...f, pathway: v }))}>
                          <SelectTrigger data-testid="select-content-pathway"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Unassigned">Unassigned</SelectItem>
                            {PATHWAY_OPTIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Competency</label>
                        <Select value={form.competencyId} onValueChange={(v) => setForm((f) => ({ ...f, competencyId: v }))}>
                          <SelectTrigger data-testid="select-content-competency"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {COMPETENCIES.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2 col-span-2">
                        <label className="text-sm font-medium">Audience</label>
                        <Select value={form.audience} onValueChange={(v) => setForm((f) => ({ ...f, audience: v }))}>
                          <SelectTrigger data-testid="select-content-audience"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {CONTENT_AUDIENCES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="content-duration">Duration (mins)</label>
                        <Input
                          id="content-duration"
                          type="number"
                          min={5}
                          value={form.durationMins}
                          onChange={(e) => setForm((f) => ({ ...f, durationMins: e.target.value }))}
                          data-testid="input-content-duration"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Language</label>
                      <Select value={form.language} onValueChange={(v) => setForm((f) => ({ ...f, language: v as ContentRecord["language"] }))}>
                        <SelectTrigger data-testid="select-content-language"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CONTENT_LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="content-summary">Summary</label>
                      <Textarea
                        id="content-summary"
                        value={form.summary}
                        onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                        placeholder="What the learner takes away from this item."
                        className="min-h-[80px]"
                        data-testid="input-content-summary"
                      />
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                      <Button type="submit" disabled={!form.title.trim()} data-testid="button-submit-content">
                        Create draft
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </>
          }
        />

        <KpiRow kpis={kpis} className="grid grid-cols-2 gap-4 md:grid-cols-5" />

        {counts.uncovered.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/60">
            <CardContent className="flex items-start gap-3 p-4 text-sm">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-amber-800">
                <span className="font-semibold">Coverage gap:</span> no published content for{" "}
                {counts.uncovered.map((c) => c.label).join(", ")}. Learners on those competencies have nothing to
                draw on — a real programme risk.
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="gap-3">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-lg">Catalogue</CardTitle>
                <CardDescription>
                  Showing {filtered.length} of {content.length} items
                </CardDescription>
              </div>
              <div className="relative w-full lg:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search title, owner or programme"
                  className="pl-9"
                  data-testid="input-search-content"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterSelect label="Programme" value={programme} onChange={setProgramme} allLabel="All programmes" testId="select-filter-programme" options={CONTENT_PROGRAMMES.map((p) => ({ value: p, label: p }))} />
              <FilterSelect label="Pathway" value={pathway} onChange={setPathway} allLabel="All pathways" testId="select-filter-pathway" options={[{ value: "Unassigned", label: "Unassigned" }, ...PATHWAY_OPTIONS.map((p) => ({ value: p, label: p }))]} />
              <FilterSelect label="Competency" value={competency} onChange={setCompetency} allLabel="All competencies" testId="select-filter-competency" options={COMPETENCIES.map((c) => ({ value: c.id, label: c.label }))} />
              <FilterSelect label="Audience" value={audience} onChange={setAudience} allLabel="All audiences" testId="select-filter-audience" options={CONTENT_AUDIENCES.map((a) => ({ value: a, label: a }))} />
              <FilterSelect label="Language" value={language} onChange={setLanguage} allLabel="All languages" testId="select-filter-language" options={CONTENT_LANGUAGES.map((l) => ({ value: l, label: l }))} />
              <FilterSelect label="Status" value={status} onChange={setStatus} allLabel="All statuses" testId="select-filter-status" options={CONTENT_STATUSES.map((s) => ({ value: s, label: s }))} />
            </div>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon"><FileText /></EmptyMedia>
                  <EmptyTitle>No matching items</EmptyTitle>
                  <EmptyDescription>Adjust the filters or create a new catalogue item.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Programme</TableHead>
                      <TableHead>Competency</TableHead>
                      <TableHead>Audience</TableHead>
                      <TableHead>Lang</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence initial={false}>
                      {filtered.map((item) => (
                        <motion.tr
                          key={item.id}
                          layout={!reduceMotion}
                          initial={item.createdInSession ? { opacity: 0, backgroundColor: "rgba(15,124,116,0.08)" } : false}
                          animate={{ opacity: 1, backgroundColor: "rgba(0,0,0,0)" }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.4 }}
                          className="cursor-pointer border-b transition-colors hover:bg-muted/50 focus-within:bg-muted/50"
                          onClick={() => setSelectedId(item.id)}
                          data-testid={`row-content-${item.id}`}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {item.title}
                              {item.createdInSession && (
                                <Badge variant="secondary" className="bg-primary/10 text-primary">New</Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">{item.type} · {item.pathway}</span>
                          </TableCell>
                          <TableCell className="text-sm">{item.programme}</TableCell>
                          <TableCell className="text-sm">{competencyLabel(item.competencyId)}</TableCell>
                          <TableCell className="text-sm">{item.audience}</TableCell>
                          <TableCell className="text-sm">{item.language}</TableCell>
                          <TableCell>
                            <motion.span
                              key={item.version}
                              initial={justPublishedId === item.id && !reduceMotion ? { scale: 0.6, opacity: 0 } : false}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ type: "spring", stiffness: 400, damping: 18 }}
                              className="inline-block font-mono text-sm"
                              data-testid={`text-version-${item.id}`}
                            >
                              {item.version}
                            </motion.span>
                          </TableCell>
                          <TableCell><StatusPill status={item.status} testId={`status-content-${item.id}`} /></TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-1">
                              {item.status !== "Published" && item.status !== "Retired" && (
                                <Button size="sm" variant="outline" onClick={() => handlePublish(item)} data-testid={`button-publish-${item.id}`}>
                                  Publish
                                </Button>
                              )}
                              {item.status === "Published" && (
                                <Button size="sm" variant="ghost" className="text-rose-600 hover:text-rose-700" onClick={() => handleRetire(item)} data-testid={`button-retire-${item.id}`}>
                                  Retire
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" onClick={() => setSelectedId(item.id)} data-testid={`button-view-${item.id}`}>
                                Details
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Sheet open={!!selected} onOpenChange={(open) => !open && setSelectedId(null)}>
          <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
            {selected && (
              <PanelEnter className="space-y-6 py-4">
                <SheetHeader className="space-y-3 text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill status={selected.status} />
                    <Badge variant="outline">{selected.type}</Badge>
                    <Badge variant="outline" className="font-mono">{selected.version}</Badge>
                  </div>
                  <SheetTitle className="text-2xl">{selected.title}</SheetTitle>
                  <SheetDescription className="text-base">{selected.summary}</SheetDescription>
                </SheetHeader>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <Detail label="Programme" value={selected.programme} />
                  <Detail label="Learning pathway" value={selected.pathway} />
                  <Detail label="Competency" value={competencyLabel(selected.competencyId)} />
                  <Detail label="Audience" value={selected.audience} />
                  <Detail label="Language" value={selected.language} />
                  <Detail label="Duration" value={`${selected.durationMins} mins`} />
                  <Detail label="Owner" value={selected.owner} />
                  <Detail label="Updated" value={selected.updatedOn} />
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 text-sm font-semibold">
                    <History className="h-4 w-4 text-primary" /> Version history
                  </h4>
                  <ScrollArea className="max-h-64 pr-3">
                    <ol className="space-y-3 border-l-2 border-primary/20 pl-4">
                      {selected.history.map((entry, i) => (
                        <li key={`${entry.version}-${i}`} className="relative">
                          <span className="absolute -left-[22px] top-1 h-2.5 w-2.5 rounded-full border-2 border-primary bg-background" />
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-semibold">{entry.version}</span>
                            <span className="text-xs text-muted-foreground">{entry.on} · {entry.by}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{entry.note}</p>
                        </li>
                      ))}
                    </ol>
                  </ScrollArea>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Publishing</h4>
                  <div className="flex flex-wrap gap-2">
                    {NEXT_STATUSES[selected.status].map((next) => (
                      <Button
                        key={next}
                        size="sm"
                        variant={next === "Published" ? "default" : "outline"}
                        onClick={() => {
                          if (next === "Published") handlePublish(selected);
                          else setContentStatus(selected.id, next);
                          if (next !== "Published") toast({ title: `Moved to ${next}`, description: `"${selected.title}" is now ${next}.` });
                        }}
                        data-testid={`button-status-${next.replace(/\s+/g, "-").toLowerCase()}`}
                      >
                        Move to {next}
                      </Button>
                    ))}
                    {selected.status === "Published" && (
                      <Button size="sm" variant="outline" className="text-rose-600" onClick={() => handleRetire(selected)} data-testid="button-detail-retire">
                        Retire from catalogue
                      </Button>
                    )}
                    {selected.status === "Retired" && (
                      <Button size="sm" variant="outline" onClick={() => handlePublish(selected)} data-testid="button-detail-republish">
                        Re-publish
                      </Button>
                    )}
                  </div>
                </div>
              </PanelEnter>
            )}
          </SheetContent>
        </Sheet>
      </PageEnter>
    </Layout>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="font-medium">{value}</p>
    </div>
  );
}
