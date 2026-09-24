import React, { useMemo, useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  BookOpen,
  CheckCircle2,
  Download,
  ExternalLink,
  Library,
  PlayCircle,
  PlusCircle,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFahrConsole } from "@/lib/FahrConsoleContext";
import { AGENTS } from "@/lib/constants";
import { COMPETENCIES, COMPETENCY_BY_ID } from "@/lib/learningData";
import type { ContentItem } from "@/lib/federal/model";
import type { CourseraCourse } from "@/lib/federal/fahrConsole";
import { contentStructure, formatMinutes, structureTotals } from "@/lib/contentLibrary";
import { CourseOutline } from "@/components/content/CourseOutline";
import { CourseBuilder } from "@/components/content/CourseBuilder";
import { CountUp, PageEnter, Stagger, StaggerItem } from "@/components/motion";

const STATUS_TONE: Record<ContentItem["status"], string> = {
  Published: "border-green-200 bg-green-50 text-green-700",
  Draft: "border-border bg-muted text-muted-foreground",
  Imported: "border-primary/30 bg-primary/10 text-primary",
};

const ALL = "all";
const UNPUBLISHED = "unpublished";

/**
 * The federal content library.
 *
 * FAHR stocks it; the Content Agent draws on what is published — down to a
 * single unit — when it builds each learner's pathway. So the screen shows
 * every item's modules and units, lets FAHR build a course of its own, and
 * brings Coursera courses in. FAHR's own courses publish straight away; a
 * Coursera import arrives unpublished so someone looks through it first.
 */
export default function FAHRContent() {
  const { toast } = useToast();
  const {
    catalogueWithAdditions,
    courseraCatalogue,
    importedCourseraIds,
    saveCourse,
    importCourseraCourse,
    publishContentItem,
    removeContentItem,
  } = useFahrConsole();

  const [tab, setTab] = useState("library");
  const [query, setQuery] = useState("");
  const [competencyFilter, setCompetencyFilter] = useState<string>(ALL);
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  // Coursera browse → preview → import.
  const [courseQuery, setCourseQuery] = useState("");
  const [courseCompetency, setCourseCompetency] = useState<string>(ALL);
  const [courseLevel, setCourseLevel] = useState<string>(ALL);
  const [previewCourse, setPreviewCourse] = useState<CourseraCourse | null>(null);
  const [previewCompetency, setPreviewCompetency] = useState<string>("");

  const openItem = openId ? catalogueWithAdditions.find((i) => i.id === openId) ?? null : null;
  const openStructure = openItem ? contentStructure(openItem) : [];

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
  const unpublished = catalogueWithAdditions.length - published.length;
  const unitsInReach = published.reduce((n, item) => n + structureTotals(contentStructure(item)).units, 0);

  /** Competencies with nothing published are holes in the Content Agent's reach. */
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

  const publish = (item: ContentItem) => {
    publishContentItem(item.id, { by: "FAHR Programme Team" });
    toast({ title: "Published", description: `${AGENTS.content} can now use "${item.title}" in learner pathways.` });
  };

  const remove = (item: ContentItem) => {
    removeContentItem(item.id, { by: "FAHR Programme Team" });
    setOpenId(null);
    toast({ title: "Removed", description: `"${item.title}" is no longer in the library.` });
  };

  const submitImport = () => {
    if (!previewCourse) return;
    const item = importCourseraCourse(previewCourse.id, previewCompetency, { by: "FAHR Programme Team" });
    setPreviewCourse(null);
    if (!item) return;
    toast({
      title: "Imported",
      description: `"${item.title}" is in the library, not yet published. Publish it when you're happy with it.`,
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
            <Button className="gap-2" onClick={() => setBuilderOpen(true)} data-testid="button-build-course">
              <PlusCircle className="h-4 w-4" /> Build a course
            </Button>
          }
        />

        <Stagger className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: "Items in the library", value: catalogueWithAdditions.length, testid: "kpi-content-total" },
            { label: "Published units in reach", value: unitsInReach, testid: "kpi-content-units" },
            { label: "Not yet published", value: unpublished, testid: "kpi-content-unpublished" },
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
          <TabsContent value="library" className="mt-4">
            <Card>
              <CardHeader className="gap-3">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" /> Federal content library
                    </CardTitle>
                    <CardDescription>
                      Open any item to see its modules and units. Each is tagged to an AI competency, which is how{" "}
                      {AGENTS.content} matches it to a learner&apos;s gap.
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="pointer-events-none absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search title or owner"
                        className="w-52 ps-8"
                        data-testid="input-content-search"
                      />
                    </div>
                    <Select value={competencyFilter} onValueChange={setCompetencyFilter}>
                      <SelectTrigger className="w-52" data-testid="select-content-competency">
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
                </div>

                {uncovered.length > 0 && (
                  <p className="text-xs text-muted-foreground" data-testid="text-content-gaps">
                    Nothing published for {uncovered.map((c) => c.label).join(", ")} — {AGENTS.content} has nothing to
                    offer a learner whose gap is there.
                  </p>
                )}
              </CardHeader>
              <CardContent>
                {filtered.length === 0 ? (
                  <div className="py-12 text-center" data-testid="empty-content">
                    <Library className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                    <p className="font-medium">Nothing matches these filters</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {catalogueWithAdditions.length} items are in the library in total.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Competency</TableHead>
                          <TableHead>Language</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Owner</TableHead>
                          <TableHead className="text-end">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.map((item) => {
                          const totals = structureTotals(contentStructure(item));
                          return (
                            <TableRow
                              key={item.id}
                              className="cursor-pointer"
                              onClick={() => setOpenId(item.id)}
                              data-testid={`row-content-${item.id}`}
                            >
                              <TableCell>
                                <p className="font-medium text-foreground">{item.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {totals.modules} module{totals.modules === 1 ? "" : "s"}
                                  {item.source === "Coursera"
                                    ? " · units on Coursera"
                                    : ` · ${totals.units} unit${totals.units === 1 ? "" : "s"} · ${formatMinutes(totals.mins)}`}
                                </p>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">{item.type}</TableCell>
                              <TableCell className="text-sm">
                                {COMPETENCY_BY_ID[item.competencyId]?.label ?? item.competencyId}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">{item.language}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={STATUS_TONE[item.status]}>
                                  {item.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">{item.owner}</TableCell>
                              <TableCell className="text-end" onClick={(e) => e.stopPropagation()}>
                                {item.status === "Published" ? (
                                  <Button size="sm" variant="ghost" onClick={() => setOpenId(item.id)}>
                                    View
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() => publish(item)}
                                    data-testid={`button-publish-${item.id}`}
                                  >
                                    Publish
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
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
                    competency it maps to and import it. It arrives in the library unpublished — publish it once
                    you&apos;ve looked through it.
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

      {/* An item's modules and units. */}
      <Sheet open={openItem !== null} onOpenChange={(open) => !open && setOpenId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {openItem && (
            <div className="space-y-5 py-4" data-testid="content-detail">
              <SheetHeader className="text-start">
                <SheetTitle>{openItem.title}</SheetTitle>
                <SheetDescription>
                  {openItem.owner} · {openItem.version} · updated {openItem.updatedOn}
                </SheetDescription>
              </SheetHeader>

              {openItem.summary && <p className="text-sm text-foreground">{openItem.summary}</p>}

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={STATUS_TONE[openItem.status]}>
                  {openItem.status}
                </Badge>
                <Badge variant="outline">{COMPETENCY_BY_ID[openItem.competencyId]?.label}</Badge>
                <Badge variant="outline">{openItem.type}</Badge>
                {openItem.level && <Badge variant="outline">{openItem.level}</Badge>}
                <Badge variant="outline">{openItem.language}</Badge>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Modules and units
                  {openItem.source !== "Coursera" && (
                    <span className="ms-2 font-normal text-muted-foreground">
                      {(() => {
                        const t = structureTotals(openStructure);
                        return `${t.modules} modules · ${t.units} units · ${formatMinutes(t.mins)}`;
                      })()}
                    </span>
                  )}
                </p>
                <CourseOutline
                  modules={openStructure}
                  external={openItem.source === "Coursera"}
                  testId="content-detail-outline"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
                {openItem.courseId ? (
                  <Link
                    href={`/learner/course/${openItem.courseId}`}
                    className="inline-flex items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline"
                    data-testid="link-open-as-learner"
                  >
                    <PlayCircle className="h-4 w-4" /> Open as a learner
                  </Link>
                ) : openItem.source === "Coursera" ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ExternalLink className="h-3.5 w-3.5" /> Learners take this course on Coursera
                  </span>
                ) : (
                  <span />
                )}
                {openItem.status !== "Published" && (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => remove(openItem)}
                      data-testid="button-remove-content"
                    >
                      <Trash2 className="me-1 h-4 w-4" /> Remove
                    </Button>
                    <Button onClick={() => publish(openItem)} data-testid="button-publish-detail">
                      Publish
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

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
                <CourseOutline
                  modules={previewCourse.syllabus.map((title, i) => ({
                    id: `${previewCourse.id}-m${i + 1}`,
                    title,
                    units: [],
                  }))}
                  external
                />
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

      <CourseBuilder
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        onSave={(input) => {
          const item = saveCourse({ ...input, by: "FAHR Programme Team" });
          toast({
            title: item.status === "Published" ? "Course published" : "Draft saved",
            description:
              item.status === "Published"
                ? `${AGENTS.content} can now use "${item.title}" in learner pathways.`
                : `"${item.title}" is in the library as a draft. Publish it when it's ready.`,
          });
        }}
      />
    </Layout>
  );
}
