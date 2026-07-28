// A cohort-targeted announcement composer that really sends through the entity
// admin store (audience kind `cohort`, recipients = the cohort's learners), so
// the send lands in the communications history rather than a dead toast.

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send } from "lucide-react";
import type { Cohort } from "@/lib/federal/model";
import type { CommunicationChannel } from "@/lib/entityAdmin/model";
import { COMMUNICATION_CHANNELS } from "@/lib/entityAdmin/model";
import type { SendCommunicationInput } from "@/lib/EntityAdminContext";

export function CohortAnnounceDialog({
  cohort,
  open,
  onOpenChange,
  onSend,
}: {
  cohort: Cohort | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (input: SendCommunicationInput) => void;
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [channel, setChannel] = useState<CommunicationChannel>("In-platform and email");

  const reset = () => {
    setSubject("");
    setBody("");
    setChannel("In-platform and email");
  };

  const valid = Boolean(cohort) && subject.trim().length > 2 && body.trim().length > 2;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cohort || !valid) return;
    onSend({
      kind: "Announcement",
      subject: subject.trim(),
      body: body.trim(),
      audienceKind: "cohort",
      audienceId: cohort.id,
      audienceLabel: cohort.name,
      recipients: cohort.learners,
      channel,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" /> Announce to {cohort?.name ?? "cohort"}
          </DialogTitle>
          <DialogDescription>
            {cohort
              ? `This reaches all ${cohort.learners.toLocaleString()} learners in ${cohort.name} and is logged in your communications history.`
              : "Select a cohort to announce to."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="announce-subject">Subject</Label>
            <Input
              id="announce-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Baseline assessment due Friday"
              data-testid="input-announce-subject"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="announce-body">Message</Label>
            <Textarea
              id="announce-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[120px]"
              placeholder="Write your announcement…"
              data-testid="input-announce-body"
            />
          </div>
          <div className="space-y-2">
            <Label>Channel</Label>
            <Select value={channel} onValueChange={(v) => setChannel(v as CommunicationChannel)}>
              <SelectTrigger data-testid="select-announce-channel">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMMUNICATION_CHANNELS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
              data-testid="button-announce-cancel"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!valid} className="gap-2" data-testid="button-announce-send">
              <Send className="h-4 w-4" /> Send announcement
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
