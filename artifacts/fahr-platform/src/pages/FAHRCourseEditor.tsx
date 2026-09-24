import React, { useRef, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  ExternalLink,
  FileDown,
  FileText,
  GraduationCap,
  GripVertical,
  HelpCircle,
  ImageUp,
  Pencil,
  Plus,
  Settings,
  Trash2,
  Video,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFahrConsole } from "@/lib/FahrConsoleContext";
import { COMPETENCIES, COMPETENCY_BY_ID } from "@/lib/learningData";
import type { ContentItem, ContentModule, ContentUnit, LearningBlock, LearningBlockKind } from "@/lib/federal/model";
import { COVER_OPTIONS, coverSrc, formatMinutes, newId, structureOf, structureTotals } from "@/lib/contentLibrary";
import { BlockDialog, ModuleDialog, UnitDialog } from "@/components/content/EditDialogs";
import { PageEnter } from "@/components/motion";

const BLOCK_STYLE: Record<LearningBlockKind, { icon: React.ComponentType<{ className?: string }>; pill: string }> = {
  Video: { icon: Video, pill: "bg-primary/10 text-primary" },
  Text: { icon: FileText, pill: "bg-secondary/15 text-secondary-foreground" },
  Question: { icon: HelpCircle, pill: "bg-amber-50 text-amber-700" },
  Document: { icon: FileDown, pill: "bg-sky-50 text-sky-700" },
};

const STATUS_PILL: Record<ContentItem["status"], string> = {
  Published: "bg-green-50 text-green-700 border-green-200",
  Draft: "bg-amber-50 text-amber-700 border-amber-200",
  Imported: "bg-primary/10 text-primary border-primary/20",
};

/** Moves `from` to `to` in a copy of the list. */
function reorder<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0) return list;
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

type DialogState =
  | { kind: "module"; moduleId?: string }
  | { kind: "unit"; moduleId: string; unitId?: string }
  | { kind: "block"; moduleId: string; unitId: string; blockId?: string }
  | null;

/**
 * The course editor: modules, the units inside them and the learning blocks
 * inside those on the left; the course's settings on the right. Every change
 * saves as it is made.
 *
 * For the platform's own courses, text and video edits flow straight into the
 * learner's course player. Coursera courses are taken on Coursera, so only
 * their settings are editable here.
 */
export default function FAHRCourseEditor() {
  const { contentId } = useParams<{ contentId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { catalogueWithAdditions, updateContent, setContentPublished } = useFahrConsole();

  const item = catalogueWithAdditions.find((c) => c.id === contentId);
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});
  const [openUnits, setOpenUnits] = useState<Record<string, boolean>>({});
  const [dialog, setDialog] = useState<DialogState>(null);
  /** The row being dragged, scoped to its own list so a unit can't land among modules. */
  const dragging = useRef<{ scope: string; index: number } | null>(null);

  if (!item) {
    return (
      <Layout role="fahr">
        <div className="space-y-4 py-12 text-center">
          <p className="text-lg font-semibold">Course not found</p>
          <Link href="/fahr/content" className="text-primary underline-offset-4 hover:underline">
            Back to the content library
          </Link>
        </div>
      </Layout>
    );
  }

  const external = item.source === "Coursera";
  const modules = structureOf(item);
  const totals = structureTotals(modules);
  const published = item.status === "Published";
  const setModules = (next: ContentModule[]) => updateContent(item.id, { modules: next });
  const patch = (p: Partial<ContentItem>) => updateContent(item.id, p);
  /** Drag-to-reorder props for one row of one list. */
  const drag = <T,>(scope: string, index: number, list: T[], apply: (next: T[]) => void) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      e.stopPropagation();
      dragging.current = { scope, index };
      e.dataTransfer.effectAllowed = "move";
    },
    onDragOver: (e: React.DragEvent) => {
      if (dragging.current?.scope !== scope) return;
      e.preventDefault();
      e.stopPropagation();
    },
    onDrop: (e: React.DragEvent) => {
      const from = dragging.current;
      if (!from || from.scope !== scope) return;
      e.preventDefault();
      e.stopPropagation();
      dragging.current = null;
      apply(reorder(list, from.index, index));
    },
  });

  const isModuleOpen = (id: string, i: number) => openModules[id] ?? i === 0;
  const isUnitOpen = (id: string, i: number) => openUnits[id] ?? i === 0;

  const editModule = (moduleId: string, fn: (m: ContentModule) => ContentModule) =>
    setModules(modules.map((m) => (m.id === moduleId ? fn(m) : m)));
  const editUnit = (moduleId: string, unitId: string, fn: (u: ContentUnit) => ContentUnit) =>
    editModule(moduleId, (m) => ({ ...m, units: m.units.map((u) => (u.id === unitId ? fn(u) : u)) }));

  // Dialog targets
  const dialogModule = dialog && "moduleId" in dialog && dialog.moduleId ? modules.find((m) => m.id === dialog.moduleId) : undefined;
  const dialogUnit =
    dialog && (dialog.kind === "unit" || dialog.kind === "block") && dialog.unitId
      ? dialogModule?.units.find((u) => u.id === dialog.unitId)
      : undefined;
  const dialogBlock =
    dialog?.kind === "block" && dialog.blockId ? dialogUnit?.blocks.find((b) => b.id === dialog.blockId) : undefined;

  const togglePublish = () => {
    setContentPublished(item.id, !published, { by: "FAHR Programme Team" });
    toast({
      title: published ? "Unpublished" : "Published",
      description: published
        ? `"${item.title}" is out of the Content Agent's reach until you publish it again.`
        : `The Content Agent can now use "${item.title}" in learner pathways.`,
    });
  };

  const openAsLearner = () =>
    item.courseId ? setLocation(`/learner/course/${item.courseId}`) : setLocation(`/fahr/content/${item.id}/preview`);

  return (
    <Layout role="fahr">
      <PageEnter className="space-y-6 pb-12">
        <Link href="/fahr/content" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Content library
        </Link>

        {/* Header */}
        <section className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm md:flex-row md:items-center">
          <img src={coverSrc(item.cover)} alt="" className="h-28 w-full rounded-xl object-cover md:w-48" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide">
              <span className={`rounded-full border px-2.5 py-0.5 ${STATUS_PILL[item.status]}`} data-testid="editor-status">
                {item.status}
              </span>
              {item.level && <span className="rounded-full bg-muted px-2.5 py-0.5 text-muted-foreground">{item.level}</span>}
              <span className="text-muted-foreground">{COMPETENCY_BY_ID[item.competencyId]?.label}</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground md:text-3xl" data-testid="editor-title">
              {item.title}
            </h1>
            {item.summary && <p className="text-sm text-muted-foreground">{item.summary}</p>}
            <p className="text-xs text-muted-foreground">
              {totals.modules} modules
              {!external && ` · ${totals.units} units · ${totals.blocks} learning blocks · ${formatMinutes(totals.mins)}`}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 md:flex-col">
            <Button variant={published ? "outline" : "default"} className="gap-2" onClick={togglePublish} data-testid="button-toggle-publish">
              {published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {published ? "Unpublish" : "Publish"}
            </Button>
            <Button variant="ghost" className="gap-2" onClick={openAsLearner} data-testid="button-open-as-learner">
              <GraduationCap className="h-4 w-4" /> View as a learner
            </Button>
          </div>
        </section>

        {item.courseId && (
          <p className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm text-foreground" data-testid="editor-sync-note">
            This is a live learner course. Changes to text and video show up in the learner&apos;s course player straight away.
          </p>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Curriculum */}
          <section className="space-y-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Curriculum</p>
                <h2 className="text-xl font-bold text-foreground">Modules &amp; content</h2>
              </div>
              {!external && (
                <Button className="gap-2" onClick={() => setDialog({ kind: "module" })} data-testid="button-add-module">
                  <Plus className="h-4 w-4" /> Add module
                </Button>
              )}
            </div>

            {external && (
              <p className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm text-muted-foreground">
                <ExternalLink className="h-4 w-4" /> Coursera course — learners take the units on Coursera, so only the
                settings on the right are editable.
              </p>
            )}

            {modules.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center" data-testid="editor-empty">
                <p className="font-medium">No modules yet</p>
                <p className="mt-1 text-sm text-muted-foreground">Add a module, then units inside it, then learning blocks.</p>
              </div>
            )}

            {modules.map((module, mi) => {
              const open = isModuleOpen(module.id, mi);
              return (
                <div
                  key={module.id}
                  className="rounded-2xl border border-border bg-card shadow-sm"
                  {...(external ? {} : drag("modules", mi, modules, setModules))}
                  data-testid={`editor-module-${module.id}`}
                >
                  <div className="flex items-center gap-2 p-4">
                    {!external && <GripVertical className="h-5 w-5 shrink-0 cursor-grab text-muted-foreground" aria-hidden />}
                    <button
                      type="button"
                      onClick={() => setOpenModules((s) => ({ ...s, [module.id]: !open }))}
                      className="flex min-w-0 flex-1 items-center gap-2 text-start"
                      aria-expanded={open}
                    >
                      {open ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                      <span className="min-w-0">
                        <span className="block font-semibold text-foreground">{module.title}</span>
                        <span className="block text-xs text-muted-foreground">
                          {external ? "Taken on Coursera" : `${module.units.length} unit${module.units.length === 1 ? "" : "s"}`}
                        </span>
                      </span>
                    </button>
                    {!external && (
                      <>
                        <Button size="icon" variant="ghost" onClick={() => setDialog({ kind: "module", moduleId: module.id })} aria-label="Edit module" data-testid={`button-edit-module-${mi}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setModules(modules.filter((m) => m.id !== module.id))} aria-label="Delete module">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>

                  {open && !external && (
                    <div className="space-y-3 border-t border-border bg-muted/20 p-4">
                      <button
                        type="button"
                        onClick={() => setDialog({ kind: "unit", moduleId: module.id })}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm font-medium text-primary hover:bg-background"
                        data-testid={`button-add-unit-${mi}`}
                      >
                        <Plus className="h-4 w-4" /> Add unit
                      </button>

                      {module.units.map((unit, ui) => {
                        const unitOpen = isUnitOpen(unit.id, ui);
                        const UnitIcon = unit.blocks.some((b) => b.kind === "Video") ? Video : FileText;
                        return (
                          <div
                            key={unit.id}
                            className="rounded-xl border border-border bg-card"
                            {...drag(`units-${module.id}`, ui, module.units, (units) =>
                              editModule(module.id, (m) => ({ ...m, units })),
                            )}
                            data-testid={`editor-unit-${unit.id}`}
                          >
                            <UnitRow
                              unit={unit}
                              open={unitOpen}
                              Icon={UnitIcon}
                              onToggle={() => setOpenUnits((s) => ({ ...s, [unit.id]: !unitOpen }))}
                              onEdit={() => setDialog({ kind: "unit", moduleId: module.id, unitId: unit.id })}
                              onDelete={() => editModule(module.id, (m) => ({ ...m, units: m.units.filter((u) => u.id !== unit.id) }))}
                              testIndex={`${mi}-${ui}`}
                            />
                            {unitOpen && (
                              <div className="space-y-2 border-t border-border p-3">
                                <button
                                  type="button"
                                  onClick={() => setDialog({ kind: "block", moduleId: module.id, unitId: unit.id })}
                                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2.5 text-sm font-medium text-primary hover:bg-muted/40"
                                  data-testid={`button-add-block-${mi}-${ui}`}
                                >
                                  <Plus className="h-4 w-4" /> Add learning block
                                </button>
                                {unit.blocks.map((block, bi) => (
                                  <BlockRow
                                    key={block.id}
                                    block={block}
                                    dragProps={drag(`blocks-${unit.id}`, bi, unit.blocks, (blocks) =>
                                      editUnit(module.id, unit.id, (u) => ({ ...u, blocks })),
                                    )}
                                    onEdit={() => setDialog({ kind: "block", moduleId: module.id, unitId: unit.id, blockId: block.id })}
                                    onDelete={() => editUnit(module.id, unit.id, (u) => ({ ...u, blocks: u.blocks.filter((b) => b.id !== block.id) }))}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </section>

          {/* Settings */}
          <CourseSettings item={item} onChange={patch} />
        </div>
      </PageEnter>

      {/* Dialogs */}
      <ModuleDialog
        open={dialog?.kind === "module"}
        initialTitle={dialog?.kind === "module" && dialog.moduleId ? dialogModule?.title : undefined}
        onOpenChange={(o) => !o && setDialog(null)}
        onSave={(title) => {
          if (dialog?.kind !== "module") return;
          if (dialog.moduleId) editModule(dialog.moduleId, (m) => ({ ...m, title }));
          else {
            const id = newId("mod");
            setModules([...modules, { id, title, units: [] }]);
            setOpenModules((s) => ({ ...s, [id]: true }));
          }
        }}
      />
      <UnitDialog
        open={dialog?.kind === "unit"}
        initial={dialog?.kind === "unit" && dialogUnit ? { title: dialogUnit.title, mins: dialogUnit.mins } : undefined}
        onOpenChange={(o) => !o && setDialog(null)}
        onSave={({ title, mins }) => {
          if (dialog?.kind !== "unit") return;
          if (dialog.unitId) editUnit(dialog.moduleId, dialog.unitId, (u) => ({ ...u, title, mins }));
          else {
            const id = newId("unit");
            editModule(dialog.moduleId, (m) => ({ ...m, units: [...m.units, { id, title, mins, blocks: [] }] }));
            setOpenUnits((s) => ({ ...s, [id]: true }));
          }
        }}
      />
      <BlockDialog
        open={dialog?.kind === "block"}
        initial={dialogBlock}
        onOpenChange={(o) => !o && setDialog(null)}
        onSave={(block) => {
          if (dialog?.kind !== "block") return;
          editUnit(dialog.moduleId, dialog.unitId, (u) => ({
            ...u,
            blocks: dialog.blockId ? u.blocks.map((b) => (b.id === block.id ? block : b)) : [...u.blocks, block],
          }));
        }}
      />
    </Layout>
  );
}

function UnitRow({
  unit,
  open,
  Icon,
  onToggle,
  onEdit,
  onDelete,
  testIndex,
}: {
  unit: ContentUnit;
  open: boolean;
  Icon: React.ComponentType<{ className?: string }>;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  testIndex: string;
}) {
  return (
    <div className="flex items-center gap-2 p-3">
      <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground" aria-hidden />
      <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-2 text-start" aria-expanded={open}>
        {open ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-medium text-foreground">{unit.title}</span>
          <span className="block text-xs text-muted-foreground">
            {unit.blocks.length} block{unit.blocks.length === 1 ? "" : "s"} · {unit.mins} min
          </span>
        </span>
      </button>
      <Button size="icon" variant="ghost" onClick={onEdit} aria-label="Edit unit" data-testid={`button-edit-unit-${testIndex}`}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={onDelete} aria-label="Delete unit">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function BlockRow({
  block,
  dragProps,
  onEdit,
  onDelete,
}: {
  block: LearningBlock;
  dragProps: Record<string, unknown>;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const style = BLOCK_STYLE[block.kind];
  const Icon = style.icon;
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2" {...dragProps} data-testid={`editor-block-${block.id}`}>
      <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground" aria-hidden />
      <span className="min-w-0 flex-1 truncate text-sm text-foreground">{block.title}</span>
      <span className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase ${style.pill}`}>
        <Icon className="h-3 w-3" /> {block.kind}
      </span>
      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onEdit} aria-label="Edit block" data-testid={`button-edit-block-${block.id}`}>
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={onDelete} aria-label="Delete block">
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function CourseSettings({ item, onChange }: { item: ContentItem; onChange: (p: Partial<ContentItem>) => void }) {
  return (
    <aside className="h-fit space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm lg:sticky lg:top-24" data-testid="course-settings">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Settings className="h-5 w-5" />
        </span>
        <div>
          <p className="font-semibold text-foreground">Course settings</p>
          <p className="text-xs text-muted-foreground">Changes save as you make them.</p>
        </div>
      </div>

      <Field label="Title">
        <Input value={item.title} onChange={(e) => onChange({ title: e.target.value })} data-testid="input-settings-title" />
      </Field>
      <Field label="Description">
        <Textarea rows={4} value={item.summary ?? ""} onChange={(e) => onChange({ summary: e.target.value })} data-testid="input-settings-summary" />
      </Field>

      <Field label="Cover image">
        <div className="grid grid-cols-5 gap-1.5">
          {COVER_OPTIONS.map((cover) => (
            <button
              key={cover}
              type="button"
              onClick={() => onChange({ cover })}
              className={`aspect-square overflow-hidden rounded-md border-2 ${item.cover === cover ? "border-primary" : "border-transparent"}`}
              aria-label="Use this cover"
            >
              <img src={coverSrc(cover)} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
        <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-primary hover:underline">
          <ImageUp className="h-3.5 w-3.5" /> Upload your own image
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onChange({ cover: URL.createObjectURL(file) });
            }}
          />
        </label>
      </Field>

      <Field label="AI competency">
        <Select value={item.competencyId} onValueChange={(v) => onChange({ competencyId: v })}>
          <SelectTrigger data-testid="select-settings-competency">
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
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Difficulty">
          <Select value={item.level ?? "Beginner"} onValueChange={(v) => onChange({ level: v as ContentItem["level"] })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["Beginner", "Intermediate", "Advanced"].map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Language">
          <Select value={item.language} onValueChange={(v) => onChange({ language: v as ContentItem["language"] })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["English", "Arabic", "Bilingual"].map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="Points awarded per unit" hint="Added to the learner's impact points when they complete a unit.">
        <Input
          type="number"
          min={0}
          value={item.pointsPerUnit ?? 0}
          onChange={(e) => onChange({ pointsPerUnit: Math.max(0, Number(e.target.value) || 0) })}
          data-testid="input-settings-points"
        />
      </Field>

      <label className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3">
        <span>
          <span className="block text-sm font-medium text-foreground">Enable certificate</span>
          <span className="block text-xs text-muted-foreground">Issued when a learner finishes the course.</span>
        </span>
        <Switch
          checked={item.certificate ?? false}
          onCheckedChange={(checked) => onChange({ certificate: checked })}
          data-testid="switch-settings-certificate"
        />
      </label>
    </aside>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
