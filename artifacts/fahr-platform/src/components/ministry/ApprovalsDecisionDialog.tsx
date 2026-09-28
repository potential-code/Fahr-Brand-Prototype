import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Undo2, ArrowUpRight, Rocket, CornerUpLeft } from "lucide-react";

/** Entity decisions, plus the two FAHR takes on an escalated project. */
export type DecisionKind = "endorse" | "return" | "escalate" | "approve_live" | "return_entity";

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
  approve_live: {
    title: "Approve for federal rollout",
    verb: "Approve",
    description:
      "The project goes live across the federal programme and the learner's credential is issued. The learner, department manager, entity and leadership are notified. A note is optional.",
    noteRequired: false,
    placeholder: "Optional note — conditions on the rollout, or what made the case.",
    icon: Rocket,
    tone: "text-primary",
    confirmLabel: "Approve for federal rollout",
  },
  return_entity: {
    title: "Return to the entity",
    verb: "Return",
    description: "The project goes back to the entity admin, who can endorse it, return it or escalate again. Tell them why.",
    noteRequired: true,
    placeholder: "Required — what the entity needs to resolve before FAHR can decide.",
    icon: CornerUpLeft,
    tone: "text-accent",
    confirmLabel: "Return to entity",
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
