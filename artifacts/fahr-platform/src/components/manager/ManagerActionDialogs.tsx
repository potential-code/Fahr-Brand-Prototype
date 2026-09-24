import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useFederalData } from "@/lib/FederalDataContext";
import type { Person } from "@/lib/federal/model";

/**
 * A department manager coaches and signs off — they do not grant roles or hand
 * out pathways. Learners generate their own pathway from their baseline, and
 * platform roles are set outside this console, so the actions here are all
 * conversations.
 */
export type ManagerActionType =
  | "Send Nudge"
  | "Send Direct Message"
  | "Schedule Intervention Meeting"
  | "Schedule Intervention"
  | "Send Encouragement Message"
  | null;

export function ManagerActionDialogs({
  action,
  subject,
  onClose
}: {
  action: ManagerActionType;
  subject: Person | null;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const { recordAudit } = useFederalData();

  const [message, setMessage] = useState("");
  const [date, setDate] = useState("");

  if (!action || !subject) return null;

  const isMessage = action === "Send Nudge" || action === "Send Direct Message" || action === "Send Encouragement Message";
  const isMeeting = action === "Schedule Intervention Meeting" || action === "Schedule Intervention";

  const handleConfirm = () => {
    const auditAction = isMessage
      ? `Sent direct message to ${subject.name}: "${message}"`
      : `Scheduled intervention meeting with ${subject.name} on ${date}`;

    recordAudit({
      actor: "Department Manager",
      agent: "Human decision",
      action: auditAction,
      risk: "Low",
      status: "Completed",
      ministryId: subject.ministryId
    });

    toast({
      title: "Action completed",
      description: `Successfully executed: ${action} for ${subject.name}.`
    });

    setMessage("");
    setDate("");
    onClose();
  };

  return (
    <Dialog open={!!action} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{action}</DialogTitle>
          <DialogDescription>
            {isMessage && `Compose a message to ${subject.name}.`}
            {isMeeting && `Schedule a 1-on-1 meeting with ${subject.name}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isMessage && (
            <div className="space-y-2">
              <Label htmlFor="manager-action-message">Message</Label>
              <Textarea
                id="manager-action-message"
                placeholder="Type your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
          )}

          {isMeeting && (
            <div className="space-y-2">
              <Label htmlFor="manager-action-date">Meeting Date</Label>
              <Input
                id="manager-action-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={(isMessage && !message) || (isMeeting && !date)}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
