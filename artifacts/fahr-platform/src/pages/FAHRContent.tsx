import React, { useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { BookOpen, Download, Library, PlusCircle, Search, Sparkles } from "lucide-react";
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
    importCourseraCourses,
  } = useFahrConsole();

  const [query, setQuery] = useState("");
  const [competencyFilter, setCompetencyFilter] = useState<string>(ALL);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

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

  const availableCourses = courseraCatalogue.filter((c) => !importedCourseraIds.includes(c.id));

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
    const items = importCourseraCourses(selectedCourses, { by: "FAHR Programme Team" });
    setSelectedCourses([]);
    toast({
      title: `${items.length} course${items.length === 1 ? "" : "s"} imported`,
      description: `Tagged to their competencies and available to ${AGENTS.content}.`,
    });
  };

  const toggleCourse = (id: string) =>
    setSelectedCourses((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));

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
            {
              label: "Imported from Coursera",
              value: importedCourseraIds.length,
              testid: "kpi-content-coursera",
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

        <Tabs defaultValue="library">
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
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Download className="h-5 w-5 text-primary" /> Import from Coursera
                </CardTitle>
                <CardDescription>
                  Courses offered through the Coursera for Government connection. An imported course is tagged to its
                  framework competency and joins the library, so {AGENTS.content} treats it like any other item.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {availableCourses.length === 0 ? (
                  <div className="py-10 text-center" data-testid="empty-coursera">
                    <Sparkles className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                    <p className="font-medium">Everything on offer is already imported</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      All {courseraCatalogue.length} courses are in the federal library.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                      {availableCourses.map((course) => {
                        const checked = selectedCourses.includes(course.id);
                        return (
                          <label
                            key={course.id}
                            className={`flex cursor-pointer gap-3 rounded-lg border p-4 transition-colors ${
                              checked ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
                            }`}
                            data-testid={`coursera-course-${course.id}`}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleCourse(course.id)}
                              data-testid={`checkbox-course-${course.id}`}
                            />
                            <div className="min-w-0 space-y-1">
                              <p className="font-medium text-foreground">{course.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {course.partner} · {course.hours} hours · {course.level}
                              </p>
                              <p className="text-sm text-muted-foreground">{course.summary}</p>
                              <Badge variant="outline" className="mt-1">
                                {COMPETENCY_BY_ID[course.competencyId]?.label ?? course.competencyId}
                              </Badge>
                            </div>
                          </label>
                        );
                      })}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                      <p className="text-sm text-muted-foreground" data-testid="text-import-count">
                        {selectedCourses.length} of {availableCourses.length} selected.
                      </p>
                      <Button
                        disabled={selectedCourses.length === 0}
                        onClick={submitImport}
                        className="gap-2"
                        data-testid="button-import-coursera"
                      >
                        <Download className="h-4 w-4" /> Import into the library
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </PageEnter>

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
