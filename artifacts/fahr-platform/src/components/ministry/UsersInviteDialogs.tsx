import React, { useMemo, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEntityAdmin, type InviteUserInput } from "@/lib/EntityAdminContext";
import { departmentsOf } from "@/lib/federal";
import { JOB_ROLE_OPTIONS } from "@/lib/entityAdmin/seed";
import { PLATFORM_ROLES, type PlatformRole } from "@/lib/entityAdmin/model";

// ---------------------------------------------------------------------------
// Invite one user
// ---------------------------------------------------------------------------

export function InviteUserDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const { inviteUser, cohorts } = useEntityAdmin();
  const departments = useMemo(() => departmentsOf("mohap"), []);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [jobRole, setJobRole] = useState(JOB_ROLE_OPTIONS[0]);
  const [departmentId, setDepartmentId] = useState<string>("");
  const [cohortId, setCohortId] = useState<string>("none");
  const [platformRole, setPlatformRole] = useState<PlatformRole>("Federal Employee");

  const reset = () => {
    setName("");
    setEmail("");
    setJobRole(JOB_ROLE_OPTIONS[0]);
    setDepartmentId("");
    setCohortId("none");
    setPlatformRole("Federal Employee");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const account = inviteUser({
      name: name.trim(),
      email: email.trim() || undefined,
      jobRole,
      departmentId: departmentId || undefined,
      cohortId: cohortId === "none" ? undefined : cohortId,
      platformRole,
    });
    toast({ title: "Invitation sent", description: `${account.name} has been invited to the platform.` });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) reset(); onOpenChange(next); }}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Invite a user</DialogTitle>
            <DialogDescription>
              Send a platform invitation. Leave the email blank to derive it from the name.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-medium" htmlFor="invite-name">Full name</label>
              <Input
                id="invite-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ahmed Al Marzooqi"
                data-testid="input-invite-name"
                required
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-medium" htmlFor="invite-email">Email (optional)</label>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="derived from the name if blank"
                data-testid="input-invite-email"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Job role</label>
              <Select value={jobRole} onValueChange={setJobRole}>
                <SelectTrigger data-testid="select-invite-jobrole"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {JOB_ROLE_OPTIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Department</label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger data-testid="select-invite-department"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Cohort</label>
              <Select value={cohortId} onValueChange={setCohortId}>
                <SelectTrigger data-testid="select-invite-cohort"><SelectValue placeholder="Not allocated" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not allocated</SelectItem>
                  {cohorts.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Platform role</label>
              <Select value={platformRole} onValueChange={(v) => setPlatformRole(v as PlatformRole)}>
                <SelectTrigger data-testid="select-invite-platformrole"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLATFORM_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-invite-cancel">
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()} data-testid="button-invite-submit">
              Send invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Bulk import
// ---------------------------------------------------------------------------

type ParsedRow =
  | { ok: true; line: number; input: InviteUserInput; deptLabel: string; cohortLabel: string }
  | { ok: false; line: number; raw: string; reason: string };

export function ImportUsersDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const { importUsers, cohorts } = useEntityAdmin();
  const departments = useMemo(() => departmentsOf("mohap"), []);
  const [text, setText] = useState("");

  const parsed = useMemo<ParsedRow[]>(() => {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    return lines.map((raw, idx) => {
      const line = idx + 1;
      const cells = raw.split(",").map((c) => c.trim());
      const [name, email, jobRole, deptText, cohortText] = cells;
      if (!name) return { ok: false, line, raw, reason: "No name in this row" };
      const dept = deptText
        ? departments.find(
            (d) =>
              d.name.toLowerCase() === deptText.toLowerCase() ||
              d.id.toLowerCase() === deptText.toLowerCase() ||
              d.name.toLowerCase().includes(deptText.toLowerCase()),
          )
        : undefined;
      const cohort = cohortText
        ? cohorts.find(
            (c) =>
              c.name.toLowerCase() === cohortText.toLowerCase() ||
              c.id.toLowerCase() === cohortText.toLowerCase() ||
              c.name.toLowerCase().includes(cohortText.toLowerCase()),
          )
        : undefined;
      return {
        ok: true,
        line,
        input: {
          name,
          email: email || undefined,
          jobRole: jobRole || JOB_ROLE_OPTIONS[0],
          departmentId: dept?.id,
          cohortId: cohort?.id,
          platformRole: "Federal Employee",
        },
        deptLabel: dept ? dept.name : deptText ? `${deptText} (unmatched)` : "—",
        cohortLabel: cohort ? cohort.name : cohortText ? `${cohortText} (unmatched)` : "—",
      };
    });
  }, [text, departments, cohorts]);

  const valid = parsed.filter((r): r is Extract<ParsedRow, { ok: true }> => r.ok);
  const invalid = parsed.filter((r): r is Extract<ParsedRow, { ok: false }> => !r.ok);

  const reset = () => setText("");

  const handleImport = () => {
    if (valid.length === 0) return;
    importUsers(valid.map((r) => r.input));
    toast({
      title: "Import complete",
      description: `${valid.length} account${valid.length === 1 ? "" : "s"} invited${invalid.length > 0 ? `, ${invalid.length} skipped` : ""}.`,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) reset(); onOpenChange(next); }}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Bulk import users</DialogTitle>
          <DialogDescription>
            Paste one person per line. No file upload — this is a session-scoped demo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Alert>
            <AlertDescription className="text-xs">
              Format: <code className="rounded bg-muted px-1 py-0.5">Name, email, job role, department, cohort</code>.
              Email, department and cohort are optional. Department and cohort are matched by name.
            </AlertDescription>
          </Alert>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder={"Latifa Al Ameri, latifa.alameri@mohap.gov.ae, Data Analyst, Digital Health, Data Analytics Champions\nSalem Al Blooshi, , Programme Officer, HR & Training,"}
            className="font-mono text-xs"
            data-testid="input-import-textarea"
          />

          {parsed.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <span className="flex items-center gap-1 text-green-700">
                  <CheckCircle2 className="h-4 w-4" /> {valid.length} to create
                </span>
                {invalid.length > 0 && (
                  <span className="flex items-center gap-1 text-amber-700">
                    <AlertTriangle className="h-4 w-4" /> {invalid.length} cannot be parsed
                  </span>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Job role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Cohort</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsed.map((row) =>
                      row.ok ? (
                        <TableRow key={row.line} data-testid={`row-import-${row.line}`}>
                          <TableCell className="text-muted-foreground">{row.line}</TableCell>
                          <TableCell className="font-medium">{row.input.name}</TableCell>
                          <TableCell>{row.input.jobRole}</TableCell>
                          <TableCell>{row.deptLabel}</TableCell>
                          <TableCell>{row.cohortLabel}</TableCell>
                        </TableRow>
                      ) : (
                        <TableRow key={row.line} className="bg-amber-50/50" data-testid={`row-import-${row.line}`}>
                          <TableCell className="text-muted-foreground">{row.line}</TableCell>
                          <TableCell colSpan={4}>
                            <span className="flex items-center gap-2 text-sm text-amber-700">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              <span className="font-mono text-xs">{row.raw}</span>
                              <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                                {row.reason}
                              </Badge>
                            </span>
                          </TableCell>
                        </TableRow>
                      ),
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-import-cancel">
            Cancel
          </Button>
          <Button type="button" disabled={valid.length === 0} onClick={handleImport} data-testid="button-import-submit">
            Import {valid.length > 0 ? valid.length : ""} account{valid.length === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
