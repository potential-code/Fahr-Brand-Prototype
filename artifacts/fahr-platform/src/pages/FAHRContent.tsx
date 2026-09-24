import React, { useMemo, useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BookOpen, CheckCircle2, ClipboardCheck, Download, ExternalLink, Library, PlusCircle, Search, Sparkles, X } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { CourseraCourse } from "@/lib/federal/fahrConsole";
import { useToast } from "@/hooks/use-toast";
import { useFahrConsole } from "@/lib/FahrConsoleContext";
import { AGENTS } from "@/lib/constants";
import { COMPETENCIES, COMPETENCY_BY_ID } from "@/lib/learningData";
import type { ContentItem } from "@/lib/federal/model";
import { CountUp, PageEnter, Stagger, StaggerItem } from "@/components/motion";

const CONTENT_TYPES: ContentItem["type"][] = [
  "Course",
  "Microlearning",
  "Simulation",
  "Assignment",
  "Virtual session",
];

const LANGUAGES: ContentItem["language"][] = ["English", "Arabic", "Bilingual"];

const STATUS_TONE: Record<ContentItem["status"], string> = {
  Published: "border-green-200 bg-green-50 text-green-700",
  "In review": "border-amber-200 bg-amber-50 text-amber-700",
  Draft: "border-border bg-muted text-muted-foreground",
  Scheduled: "border-primary/30 bg-primary/10 text-primary",
};

const ALL = "all";

/**
 * The federal content library.
 *
 * Everything here is what the Content Agent reads when it generates a
 * learner's Personalised Learning Pathway, so the screen is organised around
 * that: what is in the library, which competency each item answers, and the
 * two ways to add more — author one, or pull one in from Coursera.
 */
export default function FAHRContent() {
  const { toast } = useToast();
  const {
    catalogueWithAdditions,
    courseraCatalogue,
    importedCourseraIds,
    addContentItem,
    importCourseraCourse,
    publishContentItem,
    rejectContentItem,
  } = useFahrConsole();

  const [query, setQuery] = useState("");
  const [competencyFilter, setCompetencyFilter] = useState<string>(ALL);
  const [addOpen, setAddOpen] = useState(false);
  const [tab, setTab] = useState("library");

  // Coursera browse → preview → import.
  const [courseQuery, setCourseQuery] = useState("");
  const [courseCompetency, setCourseCompetency] = useState<string>(ALL);
  const [courseLevel, setCourseLevel] = useState<string>(ALL);
  const [previewCourse, setPreviewCourse] = useState<CourseraCourse | null>(null);
  const [previewCompetency, setPreviewCompetency] = useState<string>("");

  const [form, setForm] = useState({
    title: "",
    type: "Course" as ContentItem["type"],
    competencyId: COMPETENCIES[0].id,
    language: "Bilingual" as ContentItem["language"],
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalogueWithAdditions.filter((item) => {
      if (competencyFilter !== ALL && item.competencyId !== competencyFilter) return false;
      if (!q) return true;
      return [item.title, item.owner, COMPETENCY_BY_ID[item.competencyId]?.label ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [catalogueWithAdditions, competencyFilter, query]);

  const publishedCount = catalogueWithAdditions.filter((i) => i.status === "Published").length;

  /** Competencies with nothing published are the holes in the Content Agent's reach. */
  const coverage = useMemo(
    () =>
      COMPETENCIES.map((competency) => ({
        competency,
        items: catalogueWithAdditions.filter(
          (item) => item.competencyId === competency.id && item.status === "Published",
        ).length,
      })),
    [catalogueWithAdditions],
  );
  const uncovered = coverage.filter((row) => row.items === 0);

  const inReview = catalogueWithAdditions.filter((i) => i.status === "In review");

  const courseResults = useMemo(() => {
    const q = courseQuery.trim().toLowerCase();
    return courseraCatalogue.filter((course) => {
      if (courseCompetency !== ALL && course.competencyId !== courseCompetency) return false;
      if (courseLevel !== ALL && course.level !== courseLevel) return false;
      if (!q) return true;
      return [course.title, course.partner, course.summary].join(" ").toLowerCase().includes(q);
    });
  }, [courseraCatalogue, courseQuery, courseCompetency, courseLevel]);

  const openPreview = (course: CourseraCourse) => {
    setPreviewCourse(course);
    setPreviewCompetency(course.competencyId);
  };

  const submitAdd = () => {
    if (!form.title.trim()) {
      toast({ title: "Give the item a title", variant: "destructive" });
      return;
    }
    const item = addContentItem({ ...form, title: form.title });
    setAddOpen(false);
    setForm({
      title: "",
      type: "Course",
      competencyId: COMPETENCIES[0].id,
      language: "Bilingual",
    });
    toast({
      title: "Added to the library",
      description: `${AGENTS.content} can now draw on "${item.title}" when it builds a pathway.`,
    });
  };

  const submitImport = () => {
    if (!previewCourse) return;
    const item = importCourseraCourse(previewCourse.id, previewCompetency, { by: "FAHR Programme Team" });
    setPreviewCourse(null);
    if (!item) return;
    toast({
      title: "Imported for review",
      description: `"${item.title}" is in the review queue. Publish it to make it available to ${AGENTS.content}.`,
    });
  };

  const publish = (id: string, title: string) => {
    publishContentItem(id, { by: "FAHR Programme Team" });
    toast({ title: "Published", description: `${AGENTS.content} can now use "${title}" in learner pathways.` });
  };

  const reject = (id: string, title: string) => {
    rejectContentItem(id, { by: "FAHR Programme Team" });
    toast({ title: "Rejected", description: `"${title}" was removed from the library.` });
  };

  return (
    <Layout role="fahr">
      <PageEnter className="space-y-6 pb-12">
        <PageHeader
          tone="primary"
          title="Content"
          description={`The federal content library. ${AGENTS.content} draws on everything published here when it generates a learner's Personalised Learning Pathway.`}
          actions={
            <Button className="gap-2" onClick={() => setAddOpen(true)} data-testid="button-add-content">
              <PlusCircle className="h-4 w-4" /> Add content
            </Button>
          }
        />

        <Stagger className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: "Items in the library", value: catalogueWithAdditions.length, testid: "kpi-content-total" },
            { label: "Published and in reach", value: publishedCount, testid: "kpi-content-published" },
            { label: "Awaiting review", value: inReview.length, testid: "kpi-content-review" },
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
            <TabsTrigger value="review" data-testid="tab-review">
              <ClipboardCheck className="me-2 h-4 w-4" /> Review queue
              {inReview.length > 0 && (
                <Badge variant="secondary" className="ms-2">
                  {inReview.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ------------------------------------------------------ library */}
          <TabsContent value="library" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="gap-3">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" /> Federal content library
                    </CardTitle>
                    <CardDescription>
                      Every item, and the competency it answers. Tagging is what lets {AGENTS.content} match an item
                      to a learner&apos;s gap.
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
                  </div>
                </div>

                {uncovered.length > 0 && (
                  <p className="text-xs text-muted-foreground" data-testid="text-content-gaps">
                    Nothing published against {uncovered.map((row) => row.competency.label).join(", ")} —{" "}
                    {AGENTS.content} has nothing to reach for when a learner&apos;s gap is there.
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
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.map((item) => (
                          <TableRow key={item.id} data-testid={`row-content-${item.id}`}>
                            <TableCell className="font-medium">{item.title}</TableCell>
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
                          </TableRow>
                        ))}
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
                    Search the Coursera for Government catalogue, open a course to preview it, confirm the competency it
                    maps to, and import it. Imported courses wait in the review queue until someone publishes them.
                  </CardDescription>
                </div>
                <ol className="flex flex-wrap gap-2 text-xs text-muted-foreground" data-testid="coursera-steps">
                  {["Search", "Preview", "Confirm competency", "Import for review", "Publish"].map((step, i) => (
                    <li key={step} className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1">
                      <span className="font-semibold text-foreground">{i + 1}</span> {step}
                    </li>
                  ))}
                </ol>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-[220px]">
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
                            {course.partner} · {course.hours} hours · {course.level}
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
                              onClick={() => openPreview(course)}
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

          {/* ------------------------------------------------------- review */}
          <TabsContent value="review" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-primary" /> Review queue
                </CardTitle>
                <CardDescription>
                  Imported content is checked here before learners can get it. Publishing makes an item available to{" "}
                  {AGENTS.content}; rejecting removes it from the library.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {inReview.length === 0 ? (
                  <div className="py-10 text-center" data-testid="empty-review">
                    <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                    <p className="font-medium">Nothing waiting for review</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Courses imported from Coursera land here first.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {inReview.map((item) => (
                      <li
                        key={item.id}
                        className="flex flex-wrap items-center justify-between gap-3 py-3"
                        data-testid={`review-${item.id}`}
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">{item.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.owner} · {COMPETENCY_BY_ID[item.competencyId]?.label ?? item.competencyId} · imported{" "}
                            {item.updatedOn}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => reject(item.id, item.title)}
                            data-testid={`button-reject-${item.id}`}
                          >
                            <X className="me-1 h-4 w-4" /> Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => publish(item.id, item.title)}
                            data-testid={`button-publish-${item.id}`}
                          >
                            <CheckCircle2 className="me-1 h-4 w-4" /> Publish
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
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
                <p className="text-sm font-medium">Syllabus</p>
                <ol className="space-y-1.5">
                  {previewCourse.syllabus.map((module, i) => (
                    <li key={module} className="flex gap-2 text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">{i + 1}.</span> {module}
                    </li>
                  ))}
                </ol>
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
                  Suggested from the course content. {AGENTS.content} uses this to match the course to a learner&apos;s gap.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <ExternalLink className="h-3.5 w-3.5" /> Hosted on Coursera
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setPreviewCourse(null)}>
                    Cancel
                  </Button>
                  <Button onClick={submitImport} data-testid="button-import-coursera">
                    <Download className="me-2 h-4 w-4" /> Import for review
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Author an item straight into the library. */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add content</DialogTitle>
            <DialogDescription>
              Tag it to a framework competency — that tag is how {AGENTS.content} decides which learner it is for.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="content-title">Title</Label>
              <Input
                id="content-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Reading a Capability Profile"
                data-testid="input-content-title"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm((f) => ({ ...f, type: v as ContentItem["type"] }))}
                >
                  <SelectTrigger data-testid="select-content-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Language</Label>
                <Select
                  value={form.language}
                  onValueChange={(v) => setForm((f) => ({ ...f, language: v as ContentItem["language"] }))}
                >
                  <SelectTrigger data-testid="select-content-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Competency</Label>
              <Select
                value={form.competencyId}
                onValueChange={(v) => setForm((f) => ({ ...f, competencyId: v }))}
              >
                <SelectTrigger data-testid="select-content-form-competency">
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
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitAdd} data-testid="button-submit-content">
              Add to library
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
