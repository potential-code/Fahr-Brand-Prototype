import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Undo2, ArrowUpRight } from "lucide-react";

export type DecisionKind = "endorse" | "return" | "escalate";

const CONFIG: Record<
  DecisionKind,
  {
    title: string;
    verb: string;
    description: string;
    noteRequired: boolean;
    placeholder: string;
    icon: React.ElementType;
    tone: string;
    confirmLabel: string;
  }
> = {
  endorse: {
    title: "Endorse workplace project",
    verb: "Endorse",
    description: "Endorsing sends this project on for deployment across the entity. A note is optional.",
    noteRequired: false,
    placeholder: "Optional endorsement note — what convinced you, or conditions on the pilot.",
    icon: CheckCircle2,
    tone: "text-primary",
    confirmLabel: "Endorse project",
  },
  return: {
    title: "Return to the department manager",
    verb: "Return",
    description: "The project goes back to the department manager to work with the learner. Tell them what to fix.",
    noteRequired: true,
    placeholder: "Required — what the department manager and learner need to address before resubmitting.",
    icon: Undo2,
    tone: "text-amber-600",
    confirmLabel: "Return to manager",
  },
  escalate: {
    title: "Escalate to FAHR",
    verb: "Escalate",
    description: "Refers this project to the FAHR Programme Team for a federal decision. State why.",
    noteRequired: true,
    placeholder: "Required — the federal question, e.g. a data-sharing exception or a cross-entity rollout.",
    icon: ArrowUpRight,
    tone: "text-accent",
    confirmLabel: "Escalate to FAHR",
  },
};

type Props = {
  kind: DecisionKind | null;
  projectTitle: string;
  onCancel: () => void;
  onConfirm: (note: string) => void;
};

export function ApprovalsDecisionDialog({ kind, projectTitle, onCancel, onConfirm }: Props) {
  const [note, setNote] = useState("");

  useEffect(() => {
    if (kind) setNote("");
  }, [kind]);

  const config = kind ? CONFIG[kind] : null;
  const Icon = config?.icon;
  const trimmed = note.trim();
  const canConfirm = config ? (config.noteRequired ? trimmed.length > 0 : true) : false;

  return (
    <Dialog open={!!kind} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-lg" data-testid="dialog-approval-decision">
        {config && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {Icon && <Icon className={`h-5 w-5 ${config.tone}`} />}
                {config.title}
              </DialogTitle>
              <DialogDescription>{config.description}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Badge variant="outline" className="max-w-full truncate text-xs">
                {projectTitle}
              </Badge>
              <label className="block text-sm font-medium" htmlFor="approval-note">
                {config.noteRequired ? "Reason" : "Note"}
                {config.noteRequired && <span className="text-destructive"> *</span>}
              </label>
              <Textarea
                id="approval-note"
                data-testid="input-approval-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={config.placeholder}
                rows={4}
                className="resize-none"
                autoFocus
              />
              {config.noteRequired && trimmed.length === 0 && (
                <p className="text-xs text-muted-foreground">A reason is required so the trail records why.</p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onCancel} data-testid="button-decision-cancel">
                Cancel
              </Button>
              <Button
                onClick={() => canConfirm && onConfirm(trimmed)}
                disabled={!canConfirm}
                data-testid="button-decision-confirm"
              >
                {config.confirmLabel}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
