import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDown, ArrowUp, Check, Plus, Trash2, Upload } from "lucide-react";
import { COMPETENCIES, COMPETENCY_BY_ID } from "@/lib/learningData";
import type { ContentItem, ContentModule, ContentUnitKind } from "@/lib/federal/model";
import { UNIT_KINDS, UNIT_KIND_HINT, UPLOAD_KINDS, formatMinutes, structureTotals } from "@/lib/contentLibrary";
import type { NewCourseInput } from "@/lib/FahrConsoleContext";
import { CourseOutline } from "./CourseOutline";

const STEPS = ["Course details", "Modules & units", "Preview as a learner"] as const;
const TYPES: ContentItem["type"][] = ["Course", "Microlearning", "Simulation", "Assignment"];
const LANGUAGES: ContentItem["language"][] = ["English", "Arabic", "Bilingual"];
const LEVELS: NonNullable<ContentItem["level"]>[] = ["Beginner", "Intermediate", "Advanced"];

let seq = 0;
const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${++seq}`;

type UnitDraft = { title: string; kind: ContentUnitKind; mins: string; fileName: string };
const EMPTY_UNIT: UnitDraft = { title: "", kind: "Video", mins: "10", fileName: "" };

/** Moves an item one place up or down, leaving the array untouched at the ends. */
function move<T>(list: T[], index: number, delta: -1 | 1): T[] {
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/**
 * Builds a course the way FAHR would author one: details, then modules and the
 * units inside them, then a look at it through a learner's eyes. Saving keeps
 * it as a draft; publishing puts it in the Content Agent's reach at once —
 * FAHR's own work needs no one else's approval.
 *
 * Uploads are simulated: the file's name is kept so the course reads true, but
 * nothing is stored.
 */
export function CourseBuilder({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (input: Omit<NewCourseInput, "by">) => void;
}) {
  const [step, setStep] = useState(0);
  const [details, setDetails] = useState({
    title: "",
    summary: "",
    type: "Course" as ContentItem["type"],
    competencyId: COMPETENCIES[0].id,
    language: "Bilingual" as ContentItem["language"],
    level: "Beginner" as NonNullable<ContentItem["level"]>,
  });
  const [modules, setModules] = useState<ContentModule[]>([]);
  const [newModule, setNewModule] = useState("");
  /** The add-unit row for each module, keyed by module id. */
  const [unitDrafts, setUnitDrafts] = useState<Record<string, UnitDraft>>({});

  const reset = () => {
    setStep(0);
    setDetails({
      title: "",
      summary: "",
      type: "Course",
      competencyId: COMPETENCIES[0].id,
      language: "Bilingual",
      level: "Beginner",
    });
    setModules([]);
    setNewModule("");
    setUnitDrafts({});
  };

  const close = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const totals = structureTotals(modules);
  const detailsDone = details.title.trim() !== "";
  const structureDone = modules.length > 0 && modules.every((m) => m.units.length > 0);
  const canNext = step === 0 ? detailsDone : step === 1 ? structureDone : true;

  const addModule = () => {
    if (!newModule.trim()) return;
    setModules((prev) => [...prev, { id: uid("mod"), title: newModule.trim(), units: [] }]);
    setNewModule("");
  };

  const draftFor = (moduleId: string) => unitDrafts[moduleId] ?? EMPTY_UNIT;
  const setDraft = (moduleId: string, patch: Partial<UnitDraft>) =>
    setUnitDrafts((prev) => ({ ...prev, [moduleId]: { ...draftFor(moduleId), ...patch } }));

  const addUnit = (moduleId: string) => {
    const d = draftFor(moduleId);
    if (!d.title.trim()) return;
    const unit = {
      id: uid("unit"),
      title: d.title.trim(),
      kind: d.kind,
      mins: Math.max(1, Number(d.mins) || 5),
      fileName: UPLOAD_KINDS.includes(d.kind) && d.fileName ? d.fileName : undefined,
    };
    setModules((prev) => prev.map((m) => (m.id === moduleId ? { ...m, units: [...m.units, unit] } : m)));
    setUnitDrafts((prev) => ({ ...prev, [moduleId]: { ...EMPTY_UNIT, kind: d.kind } }));
  };

  const save = (publish: boolean) => {
    onSave({ ...details, title: details.title.trim(), summary: details.summary.trim(), modules, publish });
    close(false);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl" data-testid="course-builder">
        <DialogHeader>
          <DialogTitle>Build a course</DialogTitle>
          <DialogDescription>
            Set it up, add modules and the units inside them, then preview it as a learner before you publish.
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <ol className="flex flex-wrap gap-2" data-testid="builder-steps">
          {STEPS.map((label, i) => (
            <li
              key={label}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${
                i === step
                  ? "border-primary bg-primary/10 text-primary"
                  : i < step
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-border text-muted-foreground"
              }`}
            >
              {i < step ? <Check className="h-3 w-3" /> : <span className="font-semibold">{i + 1}</span>} {label}
            </li>
          ))}
        </ol>

        {/* ---------------------------------------------------------- step 1 */}
        {step === 0 && (
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="course-title">Course title</Label>
              <Input
                id="course-title"
                value={details.title}
                onChange={(e) => setDetails((d) => ({ ...d, title: e.target.value }))}
                placeholder="e.g. Writing Service Replies with AI"
                data-testid="input-course-title"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="course-summary">What learners will get from it</Label>
              <Textarea
                id="course-summary"
                rows={3}
                value={details.summary}
                onChange={(e) => setDetails((d) => ({ ...d, summary: e.target.value }))}
                placeholder="One or two sentences shown to learners."
                data-testid="input-course-summary"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>AI competency it builds</Label>
                <Select
                  value={details.competencyId}
                  onValueChange={(v) => setDetails((d) => ({ ...d, competencyId: v }))}
                >
                  <SelectTrigger data-testid="select-course-competency">
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
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select
                  value={details.type}
                  onValueChange={(v) => setDetails((d) => ({ ...d, type: v as ContentItem["type"] }))}
                >
                  <SelectTrigger data-testid="select-course-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Level</Label>
                <Select
                  value={details.level}
                  onValueChange={(v) =>
                    setDetails((d) => ({ ...d, level: v as NonNullable<ContentItem["level"]> }))
                  }
                >
                  <SelectTrigger data-testid="select-course-level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVELS.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Language</Label>
                <Select
                  value={details.language}
                  onValueChange={(v) => setDetails((d) => ({ ...d, language: v as ContentItem["language"] }))}
                >
                  <SelectTrigger data-testid="select-course-language">
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
          </div>
        )}

        {/* ---------------------------------------------------------- step 2 */}
        {step === 1 && (
          <div className="space-y-4 py-2">
            {modules.map((module, mi) => {
              const d = draftFor(module.id);
              const needsFile = UPLOAD_KINDS.includes(d.kind);
              return (
                <div key={module.id} className="rounded-lg border border-border" data-testid={`builder-module-${mi}`}>
                  <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-3 py-2">
                    <span className="text-xs font-semibold text-muted-foreground">Module {mi + 1}</span>
                    <Input
                      value={module.title}
                      onChange={(e) =>
                        setModules((prev) =>
                          prev.map((m) => (m.id === module.id ? { ...m, title: e.target.value } : m)),
                        )
                      }
                      className="h-8 flex-1"
                      aria-label={`Module ${mi + 1} title`}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      disabled={mi === 0}
                      onClick={() => setModules((prev) => move(prev, mi, -1))}
                      aria-label="Move module up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      disabled={mi === modules.length - 1}
                      onClick={() => setModules((prev) => move(prev, mi, 1))}
                      aria-label="Move module down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setModules((prev) => prev.filter((m) => m.id !== module.id))}
                      aria-label="Remove module"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {module.units.length > 0 && (
                    <ul className="divide-y divide-border">
                      {module.units.map((unit, ui) => (
                        <li key={unit.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                          <span className="text-muted-foreground">
                            {mi + 1}.{ui + 1}
                          </span>
                          <span className="min-w-0 flex-1 truncate">{unit.title}</span>
                          <Badge variant="outline" className="shrink-0 text-[10px]">
                            {unit.kind} · {unit.mins} min
                          </Badge>
                          {unit.fileName && (
                            <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                              {unit.fileName}
                            </span>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            disabled={ui === 0}
                            onClick={() =>
                              setModules((prev) =>
                                prev.map((m) => (m.id === module.id ? { ...m, units: move(m.units, ui, -1) } : m)),
                              )
                            }
                            aria-label="Move unit up"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() =>
                              setModules((prev) =>
                                prev.map((m) =>
                                  m.id === module.id ? { ...m, units: m.units.filter((u) => u.id !== unit.id) } : m,
                                ),
                              )
                            }
                            aria-label="Remove unit"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Add a unit to this module. */}
                  <div className="space-y-2 border-t border-dashed border-border p-3">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_140px_80px]">
                      <Input
                        value={d.title}
                        onChange={(e) => setDraft(module.id, { title: e.target.value })}
                        placeholder="Unit title"
                        className="h-9"
                        data-testid={`input-unit-title-${mi}`}
                      />
                      <Select
                        value={d.kind}
                        onValueChange={(v) => setDraft(module.id, { kind: v as ContentUnitKind, fileName: "" })}
                      >
                        <SelectTrigger className="h-9" data-testid={`select-unit-kind-${mi}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {UNIT_KINDS.map((k) => (
                            <SelectItem key={k} value={k}>
                              {k}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        min={1}
                        value={d.mins}
                        onChange={(e) => setDraft(module.id, { mins: e.target.value })}
                        className="h-9"
                        aria-label="Minutes"
                        data-testid={`input-unit-mins-${mi}`}
                      />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">{UNIT_KIND_HINT[d.kind]}.</p>
                      <div className="flex items-center gap-2">
                        {needsFile && (
                          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted/50">
                            <Upload className="h-3.5 w-3.5" />
                            {d.fileName || "Choose file"}
                            <input
                              type="file"
                              className="sr-only"
                              onChange={(e) => setDraft(module.id, { fileName: e.target.files?.[0]?.name ?? "" })}
                              data-testid={`input-unit-file-${mi}`}
                            />
                          </label>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!d.title.trim()}
                          onClick={() => addUnit(module.id)}
                          data-testid={`button-add-unit-${mi}`}
                        >
                          <Plus className="me-1 h-3.5 w-3.5" /> Add unit
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="flex gap-2">
              <Input
                value={newModule}
                onChange={(e) => setNewModule(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addModule()}
                placeholder={modules.length === 0 ? "First module title, e.g. Getting started" : "Next module title"}
                data-testid="input-module-title"
              />
              <Button onClick={addModule} disabled={!newModule.trim()} data-testid="button-add-module">
                <Plus className="me-1 h-4 w-4" /> Add module
              </Button>
            </div>

            <p className="text-xs text-muted-foreground" data-testid="text-builder-totals">
              {totals.modules} module{totals.modules === 1 ? "" : "s"} · {totals.units} unit
              {totals.units === 1 ? "" : "s"} · {formatMinutes(totals.mins)}
              {!structureDone && modules.length > 0 && " — every module needs at least one unit."}
            </p>
          </div>
        )}

        {/* ---------------------------------------------------------- step 3 */}
        {step === 2 && (
          <div className="space-y-4 py-2" data-testid="builder-preview">
            <div className="rounded-xl border border-border bg-muted/20 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                What a learner sees
              </p>
              <h3 className="mt-1 text-xl font-bold text-foreground">{details.title}</h3>
              {details.summary && <p className="mt-1 text-sm text-muted-foreground">{details.summary}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline">{COMPETENCY_BY_ID[details.competencyId]?.label}</Badge>
                <Badge variant="outline">{details.level}</Badge>
                <Badge variant="outline">{details.language}</Badge>
                <Badge variant="outline">
                  {totals.modules} modules · {totals.units} units · {formatMinutes(totals.mins)}
                </Badge>
              </div>
            </div>
            <CourseOutline modules={modules} />
            <p className="text-xs text-muted-foreground">
              Publishing makes every unit available to the Content Agent, which can place a whole course or a single
              unit in the pathway of a learner with a gap in{" "}
              {COMPETENCY_BY_ID[details.competencyId]?.label ?? "this competency"}.
            </p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="ghost" onClick={() => (step === 0 ? close(false) : setStep((s) => s - 1))}>
            {step === 0 ? "Cancel" : "Back"}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button disabled={!canNext} onClick={() => setStep((s) => s + 1)} data-testid="button-builder-next">
              Next
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => save(false)} data-testid="button-save-draft">
                Save as draft
              </Button>
              <Button onClick={() => save(true)} data-testid="button-publish-course">
                Publish
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
