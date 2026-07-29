import React, { useMemo, useState } from "react";
import { Link } from "wouter";
import { AnimatePresence } from "framer-motion";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { PageEnter, Stagger, StaggerItem, CountUp } from "@/components/motion";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import {
  Users,
  UserPlus,
  Upload,
  Download,
  Search,
  ShieldAlert,
  ArrowUpDown,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEntityAdmin } from "@/lib/EntityAdminContext";
import { MINISTRY_BY_ID, DEPARTMENT_BY_ID } from "@/lib/federal";
import { PLATFORM_ROLES, type EntityAccount } from "@/lib/entityAdmin/model";
import { downloadCsv } from "@/lib/exportFile";
import {
  UsersAccountPanel,
  AccountStatusBadge,
  ConsentBadge,
} from "@/components/ministry/UsersAccountPanel";
import { InviteUserDialog, ImportUsersDialog } from "@/components/ministry/UsersInviteDialogs";

type SortKey = "name" | "completion";

export default function MinistryUsers() {
  const { toast } = useToast();
  const { accounts, cohorts } = useEntityAdmin();
  const ministry = MINISTRY_BY_ID["mohap"];

  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [cohortFilter, setCohortFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [consentFilter, setConsentFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  // -- KPIs -----------------------------------------------------------------
  const total = accounts.length;
  const active = accounts.filter((a) => a.status === "Active").length;
  const pending = accounts.filter((a) => a.status === "Invited").length;
  const avgCompletion =
    total === 0 ? 0 : Math.round(accounts.reduce((s, a) => s + a.profileCompletion, 0) / total);
  const consentOutstanding = accounts.filter((a) => a.consent !== "Granted").length;

  const cohortName = (id?: string) =>
    id ? cohorts.find((c) => c.id === id)?.name ?? "—" : "—";

  // -- Directory ------------------------------------------------------------
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = accounts.filter((a) => {
      if (q && !`${a.name} ${a.email} ${a.jobRole}`.toLowerCase().includes(q)) return false;
      if (departmentFilter !== "all" && a.departmentId !== departmentFilter) return false;
      if (cohortFilter !== "all" && a.cohortId !== cohortFilter) return false;
      if (roleFilter !== "all" && a.platformRole !== roleFilter) return false;
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (consentFilter !== "all" && a.consent !== consentFilter) return false;
      return true;
    });
    const sorted = [...rows].sort((a, b) => {
      const cmp =
        sortKey === "name"
          ? a.name.localeCompare(b.name)
          : a.profileCompletion - b.profileCompletion;
      return sortAsc ? cmp : -cmp;
    });
    return sorted;
  }, [accounts, search, departmentFilter, cohortFilter, roleFilter, statusFilter, consentFilter, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const departments = useMemo(
    () =>
      Object.values(DEPARTMENT_BY_ID).filter((d) => d.ministryId === "mohap"),
    [],
  );

  const handleExport = () => {
    const file = downloadCsv({
      filename: "mohap-user-directory",
      title: `${ministry.name} — User Directory`,
      notes: [`${filtered.length} of ${total} accounts`, `Generated for ${ministry.name}`],
      headers: [
        "Name",
        "Email",
        "Job role",
        "Department",
        "Cohort",
        "Platform role",
        "Status",
        "Profile completion",
        "Consent",
        "Last active",
      ],
      rows: filtered.map((a) => [
        a.name,
        a.email,
        a.jobRole,
        a.departmentId ? DEPARTMENT_BY_ID[a.departmentId]?.name ?? "—" : "—",
        cohortName(a.cohortId),
        a.platformRole,
        a.status,
        `${a.profileCompletion}%`,
        a.consent,
        a.lastActive,
      ]),
    });
    toast({ title: "Directory exported", description: `Saved ${file}.` });
  };

  const kpis = [
    { label: "Total accounts", value: total, icon: Users, color: "text-primary" },
    { label: "Active", value: active, icon: UserCheck, color: "text-secondary" },
    { label: "Invited / pending", value: pending, icon: UserPlus, color: "text-accent" },
    { label: "Avg. profile completion", value: avgCompletion, suffix: "%", icon: Sparkles, color: "text-[hsl(var(--chart-4))]" },
    { label: "Consent outstanding", value: consentOutstanding, icon: ShieldAlert, color: "text-[hsl(var(--chart-5))]" },
  ];

  const selectedAccount = selectedId ? accounts.find((a) => a.id === selectedId) ?? null : null;

  return (
    <Layout role="ministry">
      <PageEnter className="space-y-6">
        <PageHeader
          tone="primary"
          icon={<Users className="h-7 w-7 text-primary" />}
          title="Users & Access"
          description={`Accounts, roles, cohort allocation and consent across ${ministry.name}.`}
          actions={
            <>
              <Button variant="outline" onClick={handleExport} data-testid="button-export-directory">
                <Download className="mr-1.5 h-4 w-4" /> Export
              </Button>
              <Button variant="outline" onClick={() => setImportOpen(true)} data-testid="button-open-import">
                <Upload className="mr-1.5 h-4 w-4" /> Bulk import
              </Button>
              <Button onClick={() => setInviteOpen(true)} data-testid="button-open-invite">
                <UserPlus className="mr-1.5 h-4 w-4" /> Invite user
              </Button>
            </>
          }
        />

        {/* KPIs */}
        <Stagger className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {kpis.map((kpi) => (
            <StaggerItem key={kpi.label}>
              <StatCard className="h-full">
                <CardContent className="flex flex-col items-center p-4 text-center">
                  <kpi.icon className={`mb-2 h-6 w-6 ${kpi.color}`} />
                  <p className="text-2xl font-bold">
                    <CountUp to={kpi.value} suffix={kpi.suffix} />
                  </p>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                </CardContent>
              </StatCard>
            </StaggerItem>
          ))}
        </Stagger>

        {/* Filters */}
        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email or role"
                className="pl-9"
                data-testid="input-search-users"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger data-testid="select-filter-department"><SelectValue placeholder="Department" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={cohortFilter} onValueChange={setCohortFilter}>
                <SelectTrigger data-testid="select-filter-cohort"><SelectValue placeholder="Cohort" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All cohorts</SelectItem>
                  {cohorts.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger data-testid="select-filter-role"><SelectValue placeholder="Platform role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  {PLATFORM_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="select-filter-status"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Invited">Invited</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <Select value={consentFilter} onValueChange={setConsentFilter}>
                <SelectTrigger data-testid="select-filter-consent"><SelectValue placeholder="Consent" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All consent</SelectItem>
                  <SelectItem value="Granted">Granted</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Withdrawn">Withdrawn</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Directory table */}
        <Card>
          <CardContent className="p-0">
            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-sm text-muted-foreground" data-testid="text-directory-count">
                Showing {filtered.length} of {total} accounts
              </p>
            </div>
            {filtered.length === 0 ? (
              <div className="p-6">
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon"><Search className="h-6 w-6" /></EmptyMedia>
                    <EmptyTitle>No accounts match</EmptyTitle>
                    <EmptyDescription>Adjust the search or filters to see people in the entity.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <button
                          className="flex items-center gap-1 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          onClick={() => toggleSort("name")}
                          data-testid="button-sort-name"
                        >
                          Name <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </TableHead>
                      <TableHead>Job role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Cohort</TableHead>
                      <TableHead>Platform role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>
                        <button
                          className="flex items-center gap-1 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          onClick={() => toggleSort("completion")}
                          data-testid="button-sort-completion"
                        >
                          Profile <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </TableHead>
                      <TableHead>Consent</TableHead>
                      <TableHead>Last active</TableHead>
                    </TableRow>
                  </TableHeader>
                  <AnimatePresence initial={false}>
                    <Stagger as="tbody">
                      {filtered.map((a) => (
                        <StaggerItem
                          as="tr"
                          variant="row"
                          key={a.id}
                          className="cursor-pointer border-b border-border hover:bg-muted/50 focus-within:bg-muted/50"
                          data-testid={`row-account-${a.id}`}
                        >
                          <UserRow
                            account={a}
                            cohortLabel={cohortName(a.cohortId)}
                            onOpen={() => setSelectedId(a.id)}
                          />
                        </StaggerItem>
                      ))}
                    </Stagger>
                  </AnimatePresence>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </PageEnter>

      {/* Row detail sheet */}
      <Sheet open={!!selectedAccount} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {selectedAccount && (
            <div className="py-4">
              <SheetHeader className="mb-6 text-left">
                <SheetTitle>Manage account</SheetTitle>
                <SheetDescription>
                  Reassign, record consent and set the account status. Changes persist for the session.
                </SheetDescription>
              </SheetHeader>
              <UsersAccountPanel accountId={selectedAccount.id} />
            </div>
          )}
        </SheetContent>
      </Sheet>

      <InviteUserDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      <ImportUsersDialog open={importOpen} onOpenChange={setImportOpen} />
    </Layout>
  );
}

/** One directory row. Name and department link out to the drill-downs. */
function UserRow({
  account,
  cohortLabel,
  onOpen,
}: {
  account: EntityAccount;
  cohortLabel: string;
  onOpen: () => void;
}) {
  const department = account.departmentId ? DEPARTMENT_BY_ID[account.departmentId] : undefined;
  return (
    <>
      <TableCell onClick={onOpen}>
        {account.personId ? (
          <Link
            href={`/ministry/people/${account.personId}`}
            className="font-medium text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
            data-testid={`link-person-${account.id}`}
          >
            {account.name}
          </Link>
        ) : (
          <span className="font-medium">{account.name}</span>
        )}
        <p className="text-xs text-muted-foreground">{account.email}</p>
      </TableCell>
      <TableCell onClick={onOpen}>{account.jobRole}</TableCell>
      <TableCell onClick={onOpen}>
        {department ? (
          <Link
            href={`/ministry/departments/${department.id}`}
            className="text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
            data-testid={`link-department-${account.id}`}
          >
            {department.name}
          </Link>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell onClick={onOpen}>{cohortLabel}</TableCell>
      <TableCell onClick={onOpen}>
        <Badge variant="outline">{account.platformRole}</Badge>
      </TableCell>
      <TableCell onClick={onOpen}>
        <AccountStatusBadge status={account.status} />
      </TableCell>
      <TableCell onClick={onOpen}>
        <div className="flex items-center gap-2">
          <Progress value={account.profileCompletion} className="h-2 w-16" />
          <span className="text-xs text-muted-foreground">{account.profileCompletion}%</span>
        </div>
      </TableCell>
      <TableCell onClick={onOpen}>
        <ConsentBadge consent={account.consent} />
      </TableCell>
      <TableCell onClick={onOpen} className="text-muted-foreground">{account.lastActive}</TableCell>
    </>
  );
}
