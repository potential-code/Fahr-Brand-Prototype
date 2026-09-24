import React, { useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  UserCheck,
  Mailbox,
  UserX,
  ShieldCheck,
  Search,
  Download,
  Printer,
  ChevronsUpDown,
  ChevronRight,
  UserPlus,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useFederalData } from "@/lib/FederalDataContext";
import { useFahrConsole } from "@/lib/FahrConsoleContext";
import {
  FEDERAL_ROLES,
  MINISTRY_BY_ID,
  DEPARTMENT_BY_ID,
  LEVEL_BY_ID,
  ROLE_BY_LABEL,
  competencyLabel,
  type PlatformUser,
} from "@/lib/federal";
import {
  CountUp,
  PageEnter,
  PanelEnter,
  Stagger,
  StaggerItem,
} from "@/components/motion";
import { downloadCsv, printReport } from "@/lib/exportFile";

type SortKey = "name" | "role" | "lastActive";

const statusPillClass = (status: PlatformUser["status"]): string =>
  status === "Active"
    ? "text-green-700 border-green-200 bg-green-50"
    : status === "Invited"
      ? "text-primary border-primary/30 bg-primary/5"
      : "text-destructive border-destructive/30 bg-destructive/10";

const entityName = (id?: string): string => (id ? MINISTRY_BY_ID[id]?.shortName ?? "—" : "Federal");

export default function FAHRUsers() {
  const { toast } = useToast();
  const { people, submissions, ministries } = useFederalData();
  const { users, setUserStatus, inviteUser } = useFahrConsole();

  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [invName, setInvName] = useState("");
  const [invEmail, setInvEmail] = useState("");
  const [invRole, setInvRole] = useState<string>(FEDERAL_ROLES[0].label);
  const [invEntity, setInvEntity] = useState<string>("none");
  const [invDept, setInvDept] = useState("");

  // KPIs — counted from the live directory so they move when a status changes.
  const counts = useMemo(() => {
    const federalRoleLabels = new Set(
      FEDERAL_ROLES.filter((r) => r.scope === "Federal").map((r) => r.label),
    );
    return {
      total: users.length,
      active: users.filter((u) => u.status === "Active").length,
      invited: users.filter((u) => u.status === "Invited").length,
      suspended: users.filter((u) => u.status === "Suspended").length,
      // Federal-role holders: anyone whose role's scope is Federal.
      federal: users.filter((u) => federalRoleLabels.has(u.roleLabel)).length,
    };
  }, [users]);

  const kpis = [
    { label: "Accounts", icon: Users, node: <CountUp to={counts.total} />, testid: "kpi-total" },
    { label: "Active", icon: UserCheck, node: <CountUp to={counts.active} />, testid: "kpi-active" },
    { label: "Invited", icon: Mailbox, node: <CountUp to={counts.invited} />, testid: "kpi-invited" },
    { label: "Suspended", icon: UserX, node: <CountUp to={counts.suspended} />, testid: "kpi-suspended" },
    { label: "Federal-role holders", icon: ShieldCheck, node: <CountUp to={counts.federal} />, testid: "kpi-federal" },
  ];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = users.filter((u) => {
      const matchesText =
        q.length === 0 ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q);
      const matchesRole = roleFilter === "all" || u.roleLabel === roleFilter;
      const matchesEntity =
        entityFilter === "all" ||
        (entityFilter === "federal" ? !u.ministryId : u.ministryId === entityFilter);
      const matchesStatus = statusFilter === "all" || u.status === statusFilter;
      return matchesText && matchesRole && matchesEntity && matchesStatus;
    });
    const dir = sortDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      if (sortKey === "role") return a.roleLabel.localeCompare(b.roleLabel) * dir;
      if (sortKey === "lastActive") return a.lastActive.localeCompare(b.lastActive) * dir;
      return a.name.localeCompare(b.name) * dir;
    });
  }, [users, query, roleFilter, entityFilter, statusFilter, sortKey, sortDir]);

  const setSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const selected = selectedId ? users.find((u) => u.id === selectedId) ?? null : null;
  const selectedRole = selected ? ROLE_BY_LABEL[selected.roleLabel] : undefined;
  const selectedEntity = selected?.ministryId ? MINISTRY_BY_ID[selected.ministryId] : undefined;
  // Match a directory user to a named Person by name, when one exists.
  const matchedPerson = useMemo(
    () => (selected ? people.find((p) => p.name === selected.name) ?? null : null),
    [selected, people],
  );
  const personSubmissions = useMemo(
    () => (matchedPerson ? submissions.filter((s) => s.personId === matchedPerson.id) : []),
    [matchedPerson, submissions],
  );

  const resetInvite = () => {
    setInvName("");
    setInvEmail("");
    setInvRole(FEDERAL_ROLES[0].label);
    setInvEntity("none");
    setInvDept("");
  };

  const handleInvite = () => {
    if (!invName.trim() || !invEmail.trim()) {
      toast({ title: "Invite not sent", description: "Enter the person's name and email." });
      return;
    }
    inviteUser({
      name: invName.trim(),
      email: invEmail.trim(),
      roleLabel: invRole,
      ministryId: invEntity === "none" ? undefined : invEntity,
      departmentId: invDept.trim() || undefined,
      by: "FAHR Programme Team",
    });
    toast({ title: "User invited", description: `${invName.trim()} invited as ${invRole}.` });
    resetInvite();
    setInviteOpen(false);
  };

  const handleToggleStatus = (user: PlatformUser) => {
    const next: PlatformUser["status"] = user.status === "Suspended" ? "Active" : "Suspended";
    setUserStatus(user.id, next, { by: "FAHR Programme Team" });
    toast({
      title: next === "Suspended" ? "Account suspended" : "Account reactivated",
      description: `${user.name} is now ${next.toLowerCase()}.`,
    });
  };

  const handleExportCsv = () => {
    const name = downloadCsv({
      filename: "fahr-user-directory",
      headers: ["Name", "Email", "Role", "Entity", "Department", "Status", "Last active"],
      rows: filtered.map((u) => [
        u.name,
        u.email,
        u.roleLabel,
        entityName(u.ministryId),
        u.departmentId ? DEPARTMENT_BY_ID[u.departmentId]?.name ?? u.departmentId : "—",
        u.status,
        u.lastActive,
      ]),
    });
    toast({ title: "Directory exported", description: `Saved ${name}.` });
  };

  const handlePrintRegister = () => {
    printReport({
      title: "Federal user and role register",
      subtitle: "Federal AI Learning Programme — platform accounts and their roles",
      meta: [
        `Accounts: ${filtered.length} of ${users.length}`,
        `Role: ${roleFilter === "all" ? "All roles" : roleFilter}`,
        `Status: ${statusFilter === "all" ? "All" : statusFilter}`,
      ],
      sections: [
        {
          heading: "Directory summary",
          facts: [
            { label: "Accounts", value: String(counts.total) },
            { label: "Active", value: String(counts.active) },
            { label: "Invited", value: String(counts.invited) },
            { label: "Suspended", value: String(counts.suspended) },
            { label: "Federal-role holders", value: String(counts.federal) },
          ],
        },
        {
          heading: "Accounts",
          table: {
            headers: ["Name", "Email", "Role", "Entity", "Status", "Last active"],
            rows: filtered.map((u) => [
              u.name,
              u.email,
              u.roleLabel,
              entityName(u.ministryId),
              u.status,
              u.lastActive,
            ]),
          },
        },
      ],
      footnote: "Federal-role holders hold roles scoped across every entity. Suspended accounts cannot sign in.",
    });
    toast({ title: "Register ready", description: "The user and role register has opened for printing." });
  };

  const SortHead = ({ label, k }: { label: string; k: SortKey }) => (
    <button
      type="button"
      onClick={() => setSort(k)}
      className="inline-flex items-center gap-1 font-medium hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
      data-testid={`sort-${k}`}
    >
      {label}
      <ChevronsUpDown className={`h-3.5 w-3.5 ${sortKey === k ? "text-primary" : "text-muted-foreground"}`} />
    </button>
  );

  return (
    <Layout role="fahr">
      <PageEnter className="space-y-6 pb-12">
        <PageHeader
          tone="primary"
          title="Users and roles"
          description="Federal user administration across every entity and role."
          actions={
            <>
              <Button variant="outline" onClick={handleExportCsv} className="gap-2" data-testid="button-export-csv">
                <Download className="h-4 w-4" /> Export CSV
              </Button>
              <Button variant="outline" onClick={handlePrintRegister} className="gap-2" data-testid="button-print-register">
                <Printer className="h-4 w-4" /> Role register
              </Button>
              <Button onClick={() => setInviteOpen(true)} className="gap-2" data-testid="button-invite-user">
                <UserPlus className="h-4 w-4" /> Invite a user
              </Button>
            </>
          }
        />

        {/* KPI row */}
        <Stagger className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {kpis.map((kpi) => (
            <StaggerItem key={kpi.label}>
              <StatCard className="h-full">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <kpi.icon className="h-4 w-4" />
                    <span className="text-xs">{kpi.label}</span>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-foreground" data-testid={kpi.testid}>
                    {kpi.node}
                  </p>
                </CardContent>
              </StatCard>
            </StaggerItem>
          ))}
        </Stagger>

        {/* User directory */}
        <Card>
          <CardHeader className="gap-4">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
              <div>
                <CardTitle className="text-lg">User directory</CardTitle>
                <CardDescription>Set a status inline, or open a user for their detail.</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search name or email"
                    className="pl-8 w-52"
                    data-testid="input-user-search"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-44" data-testid="select-role-filter">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    {FEDERAL_ROLES.map((r) => (
                      <SelectItem key={r.id} value={r.label}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={entityFilter} onValueChange={setEntityFilter}>
                  <SelectTrigger className="w-40" data-testid="select-entity-filter">
                    <SelectValue placeholder="Entity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All entities</SelectItem>
                    <SelectItem value="federal">Federal (no entity)</SelectItem>
                    {ministries.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.shortName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32" data-testid="select-status-filter">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Invited">Invited</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center">
                <Users className="mb-4 h-12 w-12 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium text-foreground">No users match these filters</h3>
                <p className="mt-1 max-w-sm text-muted-foreground">
                  Adjust the search or filters, or invite a new user to the directory.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead><SortHead label="Name" k="name" /></TableHead>
                      <TableHead><SortHead label="Role" k="role" /></TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead><SortHead label="Last active" k="lastActive" /></TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <Stagger as="tbody">
                    <AnimatePresence initial={false}>
                      {filtered.map((u) => (
                        <StaggerItem
                          as="tr"
                          variant="row"
                          key={u.id}
                          className="border-b border-border hover:bg-muted/50 focus-within:bg-muted/50"
                          data-testid={`row-user-${u.id}`}
                        >
                          <TableCell
                            className="cursor-pointer font-medium text-primary"
                            onClick={() => setSelectedId(u.id)}
                          >
                            <span className="block">{u.name}</span>
                            <span className="block text-xs font-normal text-muted-foreground">{u.email}</span>
                          </TableCell>
                          <TableCell className="cursor-pointer" onClick={() => setSelectedId(u.id)}>
                            <span className="text-sm text-foreground" data-testid={`text-user-role-${u.id}`}>
                              {u.roleLabel}
                            </span>
                          </TableCell>
                          <TableCell className="cursor-pointer text-sm" onClick={() => setSelectedId(u.id)}>
                            {entityName(u.ministryId)}
                          </TableCell>
                          <TableCell className="cursor-pointer" onClick={() => setSelectedId(u.id)}>
                            <Badge variant="outline" className={statusPillClass(u.status)}>{u.status}</Badge>
                          </TableCell>
                          <TableCell className="cursor-pointer text-sm text-muted-foreground" onClick={() => setSelectedId(u.id)}>
                            {u.lastActive}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleStatus(u)}
                                data-testid={`button-toggle-status-${u.id}`}
                              >
                                {u.status === "Suspended" ? "Reactivate" : "Suspend"}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedId(u.id)}
                                data-testid={`button-open-user-${u.id}`}
                              >
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </div>
                          </TableCell>
                        </StaggerItem>
                      ))}
                    </AnimatePresence>
                  </Stagger>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User detail sheet */}
        <Sheet open={selectedId !== null} onOpenChange={(open) => !open && setSelectedId(null)}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            {selected && (
              <PanelEnter className="space-y-6">
                <SheetHeader>
                  <SheetTitle className="text-primary">{selected.name}</SheetTitle>
                  <SheetDescription>{selected.email}</SheetDescription>
                </SheetHeader>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={statusPillClass(selected.status)}>{selected.status}</Badge>
                  <Badge variant="outline" className="text-muted-foreground">{selected.roleLabel}</Badge>
                  <Badge variant="outline" className="text-muted-foreground">{entityName(selected.ministryId)}</Badge>
                  {selected.departmentId && (
                    <Badge variant="outline" className="text-muted-foreground">
                      {DEPARTMENT_BY_ID[selected.departmentId]?.name ?? selected.departmentId}
                    </Badge>
                  )}
                </div>

                {/* Role permissions */}
                {selectedRole && (
                  <div className="rounded-md border border-border p-4">
                    <p className="text-sm font-medium text-foreground">{selectedRole.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{selectedRole.description}</p>
                    <ul className="mt-2 space-y-0.5">
                      {selectedRole.permissions.map((p) => (
                        <li key={p} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-primary/60" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Entity readiness */}
                {selectedEntity && (
                  <div className="rounded-md border border-border p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{selectedEntity.name}</span>
                      <span className="tabular-nums text-muted-foreground">{selectedEntity.readiness}% readiness</span>
                    </div>
                    <Progress value={selectedEntity.readiness} className="mt-2 h-2" />
                  </div>
                )}

                {/* Matched learner detail */}
                {matchedPerson ? (
                  <div className="rounded-md border border-border p-4 space-y-3">
                    <p className="text-sm font-medium text-foreground">Learner profile</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Capability level</p>
                        <p className="mt-0.5 text-sm font-medium text-foreground">
                          {LEVEL_BY_ID[matchedPerson.levelId]?.label ?? matchedPerson.levelId}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Assessment</p>
                        <p className="mt-0.5 text-sm font-medium text-foreground">{matchedPerson.assessmentScore}%</p>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Pathway progress</span>
                        <span>{matchedPerson.pathwayProgress}%</span>
                      </div>
                      <Progress value={matchedPerson.pathwayProgress} className="mt-1 h-2" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground">
                        Workplace projects ({personSubmissions.length})
                      </p>
                      {personSubmissions.length === 0 ? (
                        <p className="mt-1 text-xs text-muted-foreground">No workplace projects submitted.</p>
                      ) : (
                        <ul className="mt-1 space-y-1">
                          {personSubmissions.map((s) => (
                            <li key={s.id} className="text-xs text-muted-foreground">
                              {s.title} — {competencyLabel(s.competencyIds[0] ?? "")}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    This account is not matched to a named learner profile in the roster.
                  </p>
                )}

                {/* Actions */}
                <div className="space-y-3 rounded-md border border-border p-4">
                  <div className="grid gap-1.5">
                    <Label className="text-sm">Platform role</Label>
                    <p
                      className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-foreground"
                      data-testid="text-detail-role"
                    >
                      {selected.roleLabel}
                    </p>
                  </div>
                  <Button
                    variant={selected.status === "Suspended" ? "default" : "outline"}
                    onClick={() => handleToggleStatus(selected)}
                    className="w-full"
                    data-testid="button-detail-toggle-status"
                  >
                    {selected.status === "Suspended" ? "Reactivate account" : "Suspend account"}
                  </Button>
                </div>
              </PanelEnter>
            )}
          </SheetContent>
        </Sheet>

        {/* Invite user dialog */}
        <Dialog open={inviteOpen} onOpenChange={(open) => { setInviteOpen(open); if (!open) resetInvite(); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Invite a user</DialogTitle>
              <DialogDescription>
                The invited account appears in the directory immediately and can sign in once it accepts.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="inv-name">Name</Label>
                <Input id="inv-name" value={invName} onChange={(e) => setInvName(e.target.value)} data-testid="input-invite-name" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="inv-email">Email</Label>
                <Input id="inv-email" type="email" value={invEmail} onChange={(e) => setInvEmail(e.target.value)} placeholder="name@entity.gov.ae" data-testid="input-invite-email" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="inv-role">Role</Label>
                  <Select value={invRole} onValueChange={setInvRole}>
                    <SelectTrigger id="inv-role" data-testid="select-invite-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FEDERAL_ROLES.map((r) => (
                        <SelectItem key={r.id} value={r.label}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="inv-entity">Entity</Label>
                  <Select value={invEntity} onValueChange={setInvEntity}>
                    <SelectTrigger id="inv-entity" data-testid="select-invite-entity">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Federal (no entity)</SelectItem>
                      {ministries.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.shortName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="inv-dept">Department (optional)</Label>
                <Input id="inv-dept" value={invDept} onChange={(e) => setInvDept(e.target.value)} placeholder="e.g. Digital Transformation" data-testid="input-invite-dept" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setInviteOpen(false); resetInvite(); }}>Cancel</Button>
              <Button onClick={handleInvite} data-testid="button-confirm-invite">Send invite</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageEnter>
    </Layout>
  );
}
