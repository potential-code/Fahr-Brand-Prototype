import React, { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckCircle2, Clock, Download, ExternalLink, Layers, Library, PlusCircle, Search, Sparkles, Star, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFahrConsole } from "@/lib/FahrConsoleContext";
import { AGENTS } from "@/lib/constants";
import { COMPETENCIES, COMPETENCY_BY_ID } from "@/lib/learningData";
import type { ContentItem } from "@/lib/federal/model";
import type { CourseraCourse } from "@/lib/federal/fahrConsole";
import { coverSrc, structureOf, structureTotals } from "@/lib/contentLibrary";
import { CourseCard } from "@/components/content/CourseCard";
import { CountUp, PageEnter, Stagger, StaggerItem } from "@/components/motion";

const ALL = "all";

/** 1540000 → "1.5M", 97000 → "97K". */
function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}
const UNPUBLISHED = "unpublished";

/**
 * The federal content library, as course cards.
 *
 * FAHR stocks it — building courses module by module, or importing them from
 * Coursera — and the Content Agent builds each learner's pathway from what is
 * published here, whole courses or single units. Edit opens the course editor;
 * Open shows the course the way a learner takes it.
 */
export default function FAHRContent() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const {
    catalogueWithAdditions,
    courseraCatalogue,
    importedCourseraIds,
    createCourse,
    deleteContent,
    importCourseraCourse,
  } = useFahrConsole();

  const [tab, setTab] = useState("library");
  const [query, setQuery] = useState("");
  const [competencyFilter, setCompetencyFilter] = useState<string>(ALL);
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [deleteTarget, setDeleteTarget] = useState<ContentItem | null>(null);

  // Coursera browse → preview → import.
  const [courseQuery, setCourseQuery] = useState("");
  const [courseCompetency, setCourseCompetency] = useState<string>(ALL);
  const [courseLevel, setCourseLevel] = useState<string>(ALL);
  const [previewCourse, setPreviewCourse] = useState<CourseraCourse | null>(null);
  const [previewCompetency, setPreviewCompetency] = useState<string>("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalogueWithAdditions.filter((item) => {
      if (competencyFilter !== ALL && item.competencyId !== competencyFilter) return false;
      if (statusFilter === UNPUBLISHED && item.status === "Published") return false;
      if (statusFilter === "Published" && item.status !== "Published") return false;
      if (!q) return true;
      return [item.title, item.owner, COMPETENCY_BY_ID[item.competencyId]?.label ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [catalogueWithAdditions, competencyFilter, statusFilter, query]);

  const published = catalogueWithAdditions.filter((i) => i.status === "Published");
  const unitsInReach = published.reduce((n, item) => n + structureTotals(structureOf(item)).units, 0);
  const uncovered = COMPETENCIES.filter((c) => !published.some((i) => i.competencyId === c.id));

  const courseResults = useMemo(() => {
    const q = courseQuery.trim().toLowerCase();
    return courseraCatalogue.filter((course) => {
      if (courseCompetency !== ALL && course.competencyId !== courseCompetency) return false;
      if (courseLevel !== ALL && course.level !== courseLevel) return false;
      if (!q) return true;
      return [course.title, course.partner, course.summary].join(" ").toLowerCase().includes(q);
    });
  }, [courseraCatalogue, courseQuery, courseCompetency, courseLevel]);

  const newCourse = () => {
    const item = createCourse({ by: "FAHR Programme Team" });
    setLocation(`/fahr/content/${item.id}`);
  };

  const openItem = (item: ContentItem) => setLocation(`/fahr/content/${item.id}`);

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteContent(deleteTarget.id, { by: "FAHR Programme Team" });
    toast({ title: "Deleted", description: `"${deleteTarget.title}" was removed from the library.` });
    setDeleteTarget(null);
  };

  const submitImport = () => {
    if (!previewCourse) return;
    const item = importCourseraCourse(previewCourse.id, previewCompetency, { by: "FAHR Programme Team" });
    setPreviewCourse(null);
    if (!item) return;
    setTab("library");
    toast({
      title: "Imported",
      description: `"${item.title}" is in the library, not yet published. Open Edit to check its settings, then publish.`,
    });
  };

  return (
    <Layout role="fahr">
      <PageEnter className="space-y-6 pb-12">
        <PageHeader
          tone="primary"
          title="Content"
          description={`The federal content library. ${AGENTS.content} builds each learner's pathway from what is published here — whole courses or single units.`}
          actions={
            <Button className="gap-2" onClick={newCourse} data-testid="button-new-course">
              <PlusCircle className="h-4 w-4" /> New course
            </Button>
          }
        />

        <Stagger className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: "Courses in the library", value: catalogueWithAdditions.length, testid: "kpi-content-total" },
            { label: "Published units in reach", value: unitsInReach, testid: "kpi-content-units" },
            {
              label: "Not yet published",
              value: catalogueWithAdditions.length - published.length,
              testid: "kpi-content-unpublished",
            },
          ].map((kpi) => (
            <StaggerItem key={kpi.label}>
              <StatCard className="h-full">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold" data-testid={kpi.testid}>
                    <CountUp to={kpi.value} />
                  </p>
                </CardContent>
              </StatCard>
            </StaggerItem>
          ))}
        </Stagger>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="library" data-testid="tab-library">
              <Library className="me-2 h-4 w-4" /> Library
            </TabsTrigger>
            <TabsTrigger value="coursera" data-testid="tab-coursera">
              <Download className="me-2 h-4 w-4" /> Import from Coursera
            </TabsTrigger>
          </TabsList>

          {/* ------------------------------------------------------ library */}
          <TabsContent value="library" className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[220px] flex-1">
                <Search className="pointer-events-none absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search courses"
                  className="ps-8"
                  data-testid="input-content-search"
                />
              </div>
              <Select value={competencyFilter} onValueChange={setCompetencyFilter}>
                <SelectTrigger className="w-56" data-testid="select-content-competency">
                  <SelectValue placeholder="Competency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All competencies</SelectItem>
                  {COMPETENCIES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-44" data-testid="select-content-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All statuses</SelectItem>
                  <SelectItem value="Published">Published</SelectItem>
                  <SelectItem value={UNPUBLISHED}>Not yet published</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {uncovered.length > 0 && (
              <p className="text-xs text-muted-foreground" data-testid="text-content-gaps">
                Nothing published for {uncovered.map((c) => c.label).join(", ")} — {AGENTS.content} has nothing to offer
                a learner whose gap is there.
              </p>
            )}

            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border py-12 text-center" data-testid="empty-content">
                <Library className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                <p className="font-medium">No courses match these filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filtered.map((item) => (
                  <CourseCard
                    key={item.id}
                    item={item}
                    onEdit={() => setLocation(`/fahr/content/${item.id}`)}
                    onDelete={() => setDeleteTarget(item)}
                    onOpen={() => openItem(item)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ----------------------------------------------------- coursera */}
          <TabsContent value="coursera" className="mt-4 space-y-5">
            {/* The connection itself, so the tab reads as a live integration. */}
            <section
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0056D2] via-[#0048b3] to-[#002f7a] p-6 text-white shadow-sm"
              data-testid="coursera-banner"
            >
              <div className="pointer-events-none absolute -end-16 -top-16 h-56 w-56 rounded-full bg-white/10" aria-hidden />
              <div className="pointer-events-none absolute -bottom-20 end-24 h-48 w-48 rounded-full bg-white/5" aria-hidden />
              <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold tracking-tight">coursera</span>
                    <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium">for Government</span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-2.5 py-0.5 text-xs font-medium text-emerald-100">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Connected
                    </span>
                  </div>
                  <p className="max-w-xl text-sm text-white/80">
                    Browse the catalogue your licence covers, preview a course, confirm the AI competency it builds, and
                    import it. It lands in the library unpublished — check it, then publish.
                  </p>
                </div>
                <dl className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: "Courses available", value: courseraCatalogue.length },
                    { label: "Imported", value: importedCourseraIds.length },
                    { label: "Partners", value: new Set(courseraCatalogue.map((c) => c.partner)).size },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
                      <dd className="text-2xl font-bold">{stat.value}</dd>
                      <dt className="text-[11px] text-white/70">{stat.label}</dt>
                    </div>
                  ))}
                </dl>
              </div>
            </section>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[220px] flex-1">
                <Search className="pointer-events-none absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={courseQuery}
                  onChange={(e) => setCourseQuery(e.target.value)}
                  placeholder="Search Coursera courses"
                  className="ps-8"
                  data-testid="input-coursera-search"
                />
              </div>
              <Select value={courseCompetency} onValueChange={setCourseCompetency}>
                <SelectTrigger className="w-56" data-testid="select-coursera-competency">
                  <SelectValue placeholder="Competency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All competencies</SelectItem>
                  {COMPETENCIES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={courseLevel} onValueChange={setCourseLevel}>
                <SelectTrigger className="w-40" data-testid="select-coursera-level">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All levels</SelectItem>
                  {["Beginner", "Intermediate", "Advanced"].map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {courseResults.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border py-12 text-center" data-testid="empty-coursera">
                <Sparkles className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                <p className="font-medium">No Coursera courses match</p>
                <p className="mt-1 text-sm text-muted-foreground">Try a broader search or clear the filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {courseResults.map((course) => {
                  const imported = importedCourseraIds.includes(course.id);
                  return (
                    <article
                      key={course.id}
                      className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
                      data-testid={`coursera-course-${course.id}`}
                    >
                      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                        <img src={coverSrc(course.cover)} alt="" className="h-full w-full object-cover" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0" aria-hidden />
                        <span className="absolute start-3 top-3 rounded-full bg-background/95 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground shadow-sm">
                          {course.level}
                        </span>
                        {imported ? (
                          <span className="absolute end-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
                            <CheckCircle2 className="h-3 w-3" /> In library
                          </span>
                        ) : (
                          <span className="absolute end-3 top-3 rounded-full bg-[#0056D2] px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
                            Coursera
                          </span>
                        )}
                        <div className="absolute bottom-3 start-3 flex items-center gap-2">
                          <span
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-bold text-[#0056D2] shadow"
                            aria-hidden
                          >
                            {course.partner
                              .split(/[\s.]+/)
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((w) => w[0])
                              .join("")
                              .toUpperCase()}
                          </span>
                          <span className="text-sm font-medium text-white drop-shadow">{course.partner}</span>
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col gap-3 p-5">
                        <h3 className="text-lg font-semibold leading-snug text-foreground">{course.title}</h3>
                        <p className="line-clamp-2 text-sm text-muted-foreground">{course.summary}</p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {course.rating.toFixed(1)}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Users className="h-4 w-4" /> {compact(course.enrolled)}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="h-4 w-4" /> {course.hours} h
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Layers className="h-4 w-4" /> {course.syllabus.length} modules
                          </span>
                        </div>

                        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-4">
                          <Badge variant="outline" className="max-w-[60%] truncate">
                            {COMPETENCY_BY_ID[course.competencyId]?.label ?? course.competencyId}
                          </Badge>
                          <Button
                            size="sm"
                            variant={imported ? "ghost" : "default"}
                            disabled={imported}
                            onClick={() => {
                              setPreviewCourse(course);
                              setPreviewCompetency(course.competencyId);
                            }}
                            data-testid={`button-preview-${course.id}`}
                          >
                            {imported ? "Imported" : "Preview & import"}
                          </Button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </TabsContent>

        </Tabs>
      </PageEnter>

      {/* Preview a Coursera course and confirm its competency before import. */}
      <Sheet open={previewCourse !== null} onOpenChange={(open) => !open && setPreviewCourse(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {previewCourse && (
            <div className="space-y-6 py-4" data-testid="coursera-preview">
              <div className="relative -mx-6 -mt-4 aspect-[16/8] overflow-hidden">
                <img src={coverSrc(previewCourse.cover)} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" aria-hidden />
                <div className="absolute bottom-3 start-6 flex flex-wrap items-center gap-2 text-xs font-medium text-white">
                  <span className="rounded-full bg-[#0056D2] px-2.5 py-1">Coursera</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {previewCourse.rating.toFixed(1)}
                  </span>
                  <span className="rounded-full bg-black/40 px-2.5 py-1">{compact(previewCourse.enrolled)} learners</span>
                </div>
              </div>
              <SheetHeader className="text-start">
                <SheetTitle>{previewCourse.title}</SheetTitle>
                <SheetDescription>
                  {previewCourse.partner} · {previewCourse.hours} hours · {previewCourse.level}
                </SheetDescription>
              </SheetHeader>

              <p className="text-sm text-foreground">{previewCourse.summary}</p>

              <div className="space-y-2">
                <p className="text-sm font-medium">Modules</p>
                <ol className="space-y-2">
                  {previewCourse.syllabus.map((title, i) => (
                    <li key={title} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm">
                      <span className="text-muted-foreground">Module {i + 1}</span>
                      <span className="text-foreground">{title}</span>
                    </li>
                  ))}
                </ol>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ExternalLink className="h-3.5 w-3.5" /> Learners take the units on Coursera.
                </p>
              </div>

              <div className="space-y-1.5 rounded-lg border border-border p-4">
                <Label>Maps to competency</Label>
                <Select value={previewCompetency} onValueChange={setPreviewCompetency}>
                  <SelectTrigger data-testid="select-preview-competency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPETENCIES.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Suggested from the course content. {AGENTS.content} uses it to match the course to a learner&apos;s
                  gap.
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setPreviewCourse(null)}>
                  Cancel
                </Button>
                <Button onClick={submitImport} data-testid="button-import-coursera">
                  <Download className="me-2 h-4 w-4" /> Import
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>


      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{deleteTarget?.title}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              It has not been published, so no learner has it. This removes it from the library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} data-testid="button-confirm-delete">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
