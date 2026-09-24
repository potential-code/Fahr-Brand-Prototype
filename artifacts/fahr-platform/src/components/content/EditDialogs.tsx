import React, { useEffect, useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Trash2, Upload } from "lucide-react";
import type { LearningBlock, LearningBlockKind } from "@/lib/federal/model";
import { BLOCK_KINDS, newId, youtubeId } from "@/lib/contentLibrary";

// ---------------------------------------------------------------------------
// Module and unit — a title, and for a unit its length
// ---------------------------------------------------------------------------

export function ModuleDialog({
  open,
  initialTitle,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  initialTitle?: string;
  onOpenChange: (open: boolean) => void;
  onSave: (title: string) => void;
}) {
  const [title, setTitle] = useState("");
  useEffect(() => {
    if (open) setTitle(initialTitle ?? "");
  }, [open, initialTitle]);
  const editing = initialTitle !== undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-module">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit module" : "Add module"}</DialogTitle>
          <DialogDescription>A module groups the units learners take together.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5 py-2">
          <Label htmlFor="module-title">Module title</Label>
          <Input
            id="module-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Getting started"
            autoFocus
            data-testid="input-module-title"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!title.trim()}
            onClick={() => {
              onSave(title.trim());
              onOpenChange(false);
            }}
            data-testid="button-save-module"
          >
            {editing ? "Save" : "Add module"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function UnitDialog({
  open,
  initial,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  initial?: { title: string; mins: number };
  onOpenChange: (open: boolean) => void;
  onSave: (unit: { title: string; mins: number }) => void;
}) {
  const [title, setTitle] = useState("");
  const [mins, setMins] = useState("10");
  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? "");
      setMins(String(initial?.mins ?? 10));
    }
  }, [open, initial]);
  const editing = initial !== undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-unit">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit unit" : "Add unit"}</DialogTitle>
          <DialogDescription>
            A unit is one sitting for a learner. You add its text, video, questions and documents as learning blocks.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-[1fr_110px] gap-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="unit-title">Unit title</Label>
            <Input
              id="unit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. What AI can and cannot do"
              autoFocus
              data-testid="input-unit-title"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="unit-mins">Minutes</Label>
            <Input
              id="unit-mins"
              type="number"
              min={1}
              value={mins}
              onChange={(e) => setMins(e.target.value)}
              data-testid="input-unit-mins"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!title.trim()}
            onClick={() => {
              onSave({ title: title.trim(), mins: Math.max(1, Number(mins) || 10) });
              onOpenChange(false);
            }}
            data-testid="button-save-unit"
          >
            {editing ? "Save" : "Add unit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Learning block — text, video, question or document
// ---------------------------------------------------------------------------

const KIND_HINT: Record<LearningBlockKind, string> = {
  Text: "A passage learners read.",
  Video: "A YouTube link plays in the learner's course player. An uploaded file is attached to the unit.",
  Question: "A single-answer knowledge check.",
  Document: "A file learners download — a template, a guide, a worksheet.",
};

type BlockDraft = {
  kind: LearningBlockKind;
  title: string;
  text: string;
  videoUrl: string;
  fileName: string;
  prompt: string;
  options: string[];
  correctIndex: number;
};

function draftFrom(block?: LearningBlock): BlockDraft {
  return {
    kind: block?.kind ?? "Text",
    title: block?.title ?? "",
    text: block?.text ?? "",
    videoUrl: block?.videoUrl ?? "",
    fileName: block?.fileName ?? "",
    prompt: block?.question?.prompt ?? "",
    options: block?.question?.options ?? ["", ""],
    correctIndex: block?.question?.correctIndex ?? 0,
  };
}

/** Whether the draft has what its kind needs. */
function isComplete(d: BlockDraft): boolean {
  if (!d.title.trim()) return false;
  if (d.kind === "Text") return d.text.trim() !== "";
  if (d.kind === "Video") return youtubeId(d.videoUrl) !== null || d.fileName !== "";
  if (d.kind === "Document") return d.fileName !== "";
  const filled = d.options.filter((o) => o.trim());
  return d.prompt.trim() !== "" && filled.length >= 2 && d.options[d.correctIndex]?.trim() !== "";
}

export function BlockDialog({
  open,
  initial,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  initial?: LearningBlock;
  onOpenChange: (open: boolean) => void;
  onSave: (block: LearningBlock) => void;
}) {
  const [d, setD] = useState<BlockDraft>(draftFrom());
  useEffect(() => {
    if (open) setD(draftFrom(initial));
  }, [open, initial]);
  const editing = initial !== undefined;
  const set = (patch: Partial<BlockDraft>) => setD((prev) => ({ ...prev, ...patch }));
  const videoPreview = d.kind === "Video" ? youtubeId(d.videoUrl) : null;

  const save = () => {
    const block: LearningBlock = { id: initial?.id ?? newId("block"), kind: d.kind, title: d.title.trim() };
    if (d.kind === "Text") block.text = d.text.trim();
    if (d.kind === "Video") {
      if (d.videoUrl.trim()) block.videoUrl = d.videoUrl.trim();
      if (d.fileName) block.fileName = d.fileName;
    }
    if (d.kind === "Document") block.fileName = d.fileName;
    if (d.kind === "Question") {
      const options = d.options.map((o) => o.trim()).filter(Boolean);
      const correct = d.options[d.correctIndex]?.trim();
      block.question = { prompt: d.prompt.trim(), options, correctIndex: Math.max(0, options.indexOf(correct)) };
    }
    onSave(block);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl" data-testid="dialog-block">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit learning block" : "Add learning block"}</DialogTitle>
          <DialogDescription>{KIND_HINT[d.kind]}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[160px_1fr]">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={d.kind} onValueChange={(v) => set({ kind: v as LearningBlockKind })} disabled={editing}>
                <SelectTrigger data-testid="select-block-kind">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BLOCK_KINDS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {k}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="block-title">Title</Label>
              <Input
                id="block-title"
                value={d.title}
                onChange={(e) => set({ title: e.target.value })}
                placeholder="e.g. Reading: AI vs automation"
                data-testid="input-block-title"
              />
            </div>
          </div>

          {d.kind === "Text" && (
            <div className="space-y-1.5">
              <Label htmlFor="block-text">Text</Label>
              <Textarea
                id="block-text"
                rows={9}
                value={d.text}
                onChange={(e) => set({ text: e.target.value })}
                placeholder="Write the passage. Leave a blank line between paragraphs."
                data-testid="input-block-text"
              />
            </div>
          )}

          {d.kind === "Video" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="block-video">YouTube link</Label>
                <Input
                  id="block-video"
                  value={d.videoUrl}
                  onChange={(e) => set({ videoUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=…"
                  data-testid="input-block-video"
                />
              </div>
              {videoPreview && (
                <div className="aspect-video overflow-hidden rounded-lg border border-border">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${videoPreview}?rel=0`}
                    title={d.title || "Video preview"}
                    className="h-full w-full"
                    allowFullScreen
                  />
                </div>
              )}
              <FileField
                label="Or upload a video file"
                accept="video/*"
                fileName={d.fileName}
                onChange={(fileName) => set({ fileName })}
                testId="input-block-video-file"
              />
            </div>
          )}

          {d.kind === "Document" && (
            <FileField
              label="Document"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xlsx"
              fileName={d.fileName}
              onChange={(fileName) => set({ fileName })}
              testId="input-block-file"
            />
          )}

          {d.kind === "Question" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="block-prompt">Question</Label>
                <Textarea
                  id="block-prompt"
                  rows={2}
                  value={d.prompt}
                  onChange={(e) => set({ prompt: e.target.value })}
                  data-testid="input-block-prompt"
                />
              </div>
              <div className="space-y-2">
                <Label>Answers — select the correct one</Label>
                <RadioGroup
                  value={String(d.correctIndex)}
                  onValueChange={(v) => set({ correctIndex: Number(v) })}
                  className="space-y-2"
                >
                  {d.options.map((option, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <RadioGroupItem value={String(i)} aria-label={`Answer ${i + 1} is correct`} />
                      <Input
                        value={option}
                        onChange={(e) =>
                          set({ options: d.options.map((o, j) => (j === i ? e.target.value : o)) })
                        }
                        placeholder={`Answer ${i + 1}`}
                        data-testid={`input-block-option-${i}`}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={d.options.length <= 2}
                        onClick={() =>
                          set({
                            options: d.options.filter((_, j) => j !== i),
                            correctIndex: d.correctIndex >= i && d.correctIndex > 0 ? d.correctIndex - 1 : d.correctIndex,
                          })
                        }
                        aria-label={`Remove answer ${i + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </RadioGroup>
                {d.options.length < 5 && (
                  <Button size="sm" variant="ghost" onClick={() => set({ options: [...d.options, ""] })}>
                    <Plus className="me-1 h-4 w-4" /> Add answer
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!isComplete(d)} onClick={save} data-testid="button-save-block">
            {editing ? "Save" : "Add block"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** A simulated upload: the file's name is kept so the course reads true; nothing is stored. */
function FileField({
  label,
  accept,
  fileName,
  onChange,
  testId,
}: {
  label: string;
  accept: string;
  fileName: string;
  onChange: (fileName: string) => void;
  testId: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border px-4 py-3 text-sm hover:bg-muted/40">
        <Upload className="h-4 w-4 text-primary" />
        <span className={fileName ? "text-foreground" : "text-muted-foreground"}>
          {fileName || "Choose a file to upload"}
        </span>
        <input
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => onChange(e.target.files?.[0]?.name ?? "")}
          data-testid={testId}
        />
      </label>
    </div>
  );
}
