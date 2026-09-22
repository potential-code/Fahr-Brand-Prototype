import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useFederalData } from "@/lib/FederalDataContext";
import type { Person } from "@/lib/federal/model";

export type ManagerActionType = "Send Nudge" | "Assign Role" | "Assign New Pathway" | "Send Direct Message" | "Schedule Intervention Meeting" | "Schedule Intervention" | "Send Encouragement Message" | null;

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
  const [pathway, setPathway] = useState("");
  const [date, setDate] = useState("");

  if (!action || !subject) return null;

  const handleConfirm = () => {
    let auditAction = "";
    if (action === "Send Nudge" || action === "Send Direct Message" || action === "Send Encouragement Message") {
      auditAction = `Sent direct message to ${subject.name}: "${message}"`;
    } else if (action === "Assign Role") {
      auditAction = `Assigned role "${pathway}" to ${subject.name}`;
    } else if (action === "Assign New Pathway") {
      auditAction = `Assigned new pathway "${pathway}" to ${subject.name}`;
    } else if (action === "Schedule Intervention Meeting" || action === "Schedule Intervention") {
      auditAction = `Scheduled intervention meeting with ${subject.name} on ${date}`;
    }

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
    setPathway("");
    setDate("");
    onClose();
  };

  const isMessage = action === "Send Nudge" || action === "Send Direct Message" || action === "Send Encouragement Message";
  const isPathway = action === "Assign New Pathway";
  const isRole = action === "Assign Role";
  const isMeeting = action === "Schedule Intervention Meeting" || action === "Schedule Intervention";

  return (
    <Dialog open={!!action} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{action}</DialogTitle>
          <DialogDescription>
            {isMessage && `Compose a message to ${subject.name}.`}
            {isPathway && `Select a new learning pathway for ${subject.name}.`}
            {isRole && `Assign a new role or responsibility to ${subject.name}.`}
            {isMeeting && `Schedule a 1-on-1 meeting with ${subject.name}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isMessage && (
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea 
                placeholder="Type your message here..." 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
              />
            </div>
          )}

          {isPathway && (
            <div className="space-y-2">
              <Label>Learning Pathway</Label>
              <Select value={pathway} onValueChange={setPathway}>
                <SelectTrigger><SelectValue placeholder="Select pathway" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Strategic AI Leadership">Strategic AI Leadership</SelectItem>
                  <SelectItem value="AI-Enhanced Service Delivery">AI-Enhanced Service Delivery</SelectItem>
                  <SelectItem value="Predictive Analytics Mastery">Predictive Analytics Mastery</SelectItem>
                  <SelectItem value="Applied Agentic AI">Applied Agentic AI</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {isRole && (
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={pathway} onValueChange={setPathway}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Peer Mentor">Peer Mentor</SelectItem>
                  <SelectItem value="AI Champion">AI Champion</SelectItem>
                  <SelectItem value="Review Committee">Review Committee</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {isMeeting && (
            <div className="space-y-2">
              <Label>Meeting Date</Label>
              <Input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={(isMessage && !message) || ((isPathway || isRole) && !pathway) || (isMeeting && !date)}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
