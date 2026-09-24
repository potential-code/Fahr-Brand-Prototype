import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RotateCcw } from "lucide-react";

export type RevisionTarget = { submissionId: string; title: string; learnerName: string };

/**
 * The manager's "request revision" step. The comment is not optional — it is
 * what the learner receives, so returning a project without saying why is not
 * something the demo lets you do.
 */
export function RevisionRequestDialog({
  target,
  onClose,
  onSend,
}: {
  target: RevisionTarget | null;
  onClose: () => void;
  onSend: (target: RevisionTarget, note: string) => void;
}) {
  const [note, setNote] = useState("");

  if (!target) return null;

  const close = () => {
    setNote("");
    onClose();
  };

  return (
    <Dialog open={!!target} onOpenChange={(open) => !open && close()}>
      <DialogContent data-testid="dialog-request-revision">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-primary" /> Request revision
          </DialogTitle>
          <DialogDescription>
            &ldquo;{target.title}&rdquo; goes back to {target.learnerName}. Your comments travel with it and appear on
            their workplace project.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="revision-comments">Comments for {target.learnerName}</Label>
          <Textarea
            id="revision-comments"
            data-testid="input-revision-comments"
            rows={5}
            placeholder="What needs to change before this can be signed off — the evidence, the measured impact, the governance step…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            {target.learnerName} sees this in full, alongside a notification.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={close}>Cancel</Button>
          <Button
            data-testid="button-send-revision"
            disabled={!note.trim()}
            onClick={() => {
              onSend(target, note.trim());
              setNote("");
              onClose();
            }}
          >
            Send to learner
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
