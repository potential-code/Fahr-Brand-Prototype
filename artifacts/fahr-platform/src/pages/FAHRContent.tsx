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
import { CheckCircle2, Download, ExternalLink, Library, PlusCircle, Search, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFahrConsole } from "@/lib/FahrConsoleContext";
import { AGENTS } from "@/lib/constants";
import { COMPETENCIES, COMPETENCY_BY_ID } from "@/lib/learningData";
import type { ContentItem } from "@/lib/federal/model";
import type { CourseraCourse } from "@/lib/federal/fahrConsole";
import { structureOf, structureTotals } from "@/lib/contentLibrary";
import { CourseCard } from "@/components/content/CourseCard";
import { CountUp, PageEnter, Stagger, StaggerItem } from "@/components/motion";

const ALL = "all";
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
          <TabsContent value="coursera" className="mt-4">
            <Card>
              <CardHeader className="gap-3">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Download className="h-5 w-5 text-primary" /> Import from Coursera
                  </CardTitle>
                  <CardDescription>
                    Search the Coursera for Government catalogue, preview a course&apos;s modules, confirm the
                    competency it maps to and import it. It arrives in the library unpublished — check it, then publish.
                  </CardDescription>
                </div>
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
              </CardHeader>
              <CardContent>
                {courseResults.length === 0 ? (
                  <div className="py-10 text-center" data-testid="empty-coursera">
                    <Sparkles className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                    <p className="font-medium">No Coursera courses match</p>
                    <p className="mt-1 text-sm text-muted-foreground">Try a broader search or clear the filters.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    {courseResults.map((course) => {
                      const imported = importedCourseraIds.includes(course.id);
                      return (
                        <div
                          key={course.id}
                          className="flex flex-col gap-2 rounded-lg border border-border p-4"
                          data-testid={`coursera-course-${course.id}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-medium text-foreground">{course.title}</p>
                            {imported && (
                              <Badge variant="outline" className="shrink-0 border-green-200 bg-green-50 text-green-700">
                                <CheckCircle2 className="me-1 h-3 w-3" /> In library
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {course.partner} · {course.hours} hours · {course.level} · {course.syllabus.length} modules
                          </p>
                          <p className="text-sm text-muted-foreground">{course.summary}</p>
                          <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                            <Badge variant="outline">
                              {COMPETENCY_BY_ID[course.competencyId]?.label ?? course.competencyId}
                            </Badge>
                            <Button
                              size="sm"
                              variant={imported ? "ghost" : "outline"}
                              disabled={imported}
                              onClick={() => {
                                setPreviewCourse(course);
                                setPreviewCompetency(course.competencyId);
                              }}
                              data-testid={`button-preview-${course.id}`}
                            >
                              {imported ? "Imported" : "Preview"}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </PageEnter>

      {/* Preview a Coursera course and confirm its competency before import. */}
      <Sheet open={previewCourse !== null} onOpenChange={(open) => !open && setPreviewCourse(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {previewCourse && (
            <div className="space-y-6 py-4" data-testid="coursera-preview">
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
