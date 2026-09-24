import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, ShieldCheck, ShieldX, ShieldQuestion, UserCheck, UserX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEntityAdmin } from "@/lib/EntityAdminContext";
import { departmentsOf } from "@/lib/federal";
import { JOB_ROLE_OPTIONS } from "@/lib/entityAdmin/seed";
import { PLATFORM_ROLES, type ConsentState, type EntityAccount } from "@/lib/entityAdmin/model";

/** Consent pill styling shared with the directory table. */
export function ConsentBadge({ consent }: { consent: ConsentState }) {
  const styles: Record<ConsentState, string> = {
    Granted: "bg-green-50 text-green-700 border-green-200",
    Pending: "bg-amber-50 text-amber-700 border-amber-200",
    Withdrawn: "bg-red-50 text-red-700 border-red-200",
  };
  const Icon = consent === "Granted" ? ShieldCheck : consent === "Withdrawn" ? ShieldX : ShieldQuestion;
  return (
    <Badge variant="outline" className={styles[consent]}>
      <Icon className="mr-1 h-3 w-3" /> {consent}
    </Badge>
  );
}

/** Account status pill shared with the directory table. */
export function AccountStatusBadge({ status }: { status: EntityAccount["status"] }) {
  const styles: Record<EntityAccount["status"], string> = {
    Active: "bg-green-50 text-green-700 border-green-200",
    Invited: "bg-blue-50 text-blue-700 border-blue-200",
    Suspended: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <Badge variant="outline" className={styles[status]}>
      {status}
    </Badge>
  );
}

/**
 * The reassign / consent / status editor for one account. Shared by the Users
 * directory sheet and the learner drill-down so the two never diverge. Every
 * control writes through the entity store, so a change persists for the session
 * and shows in the table immediately.
 */
export function UsersAccountPanel({ accountId }: { accountId: string }) {
  const { toast } = useToast();
  const {
    getAccount,
    cohorts,
    updateAccount,
    setAccountStatus,
    setConsent,
    requestConsent,
  } = useEntityAdmin();

  const account = getAccount(accountId);
  const departments = useMemo(() => departmentsOf("mohap"), []);

  if (!account) {
    return <p className="text-sm text-muted-foreground">This account is no longer available.</p>;
  }

  const cohortName = account.cohortId
    ? cohorts.find((c) => c.id === account.cohortId)?.name ?? "—"
    : "—";

  return (
    <motion.div layout className="space-y-6" data-testid={`panel-account-${account.id}`}>
      <div className="rounded-lg border border-border bg-muted/40 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold">{account.name}</p>
            <p className="truncate text-sm text-muted-foreground">{account.email}</p>
          </div>
          <AccountStatusBadge status={account.status} />
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1">
            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>Profile completion</span>
              <span className="font-medium text-foreground">{account.profileCompletion}%</span>
            </div>
            <Progress value={account.profileCompletion} className="h-2" />
          </div>
          <ConsentBadge consent={account.consent} />
        </div>
        {account.missingProfileFields.length > 0 && (
          <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-700">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Outstanding: {account.missingProfileFields.join(", ")}
            </span>
          </p>
        )}
      </div>

      {/* Assignment */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor={`dept-${account.id}`}>
            Department
          </label>
          <Select
            value={account.departmentId ?? ""}
            onValueChange={(value) => updateAccount(account.id, { departmentId: value })}
          >
            <SelectTrigger id={`dept-${account.id}`} data-testid={`select-account-department-${account.id}`}>
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor={`role-${account.id}`}>
            Job role
          </label>
          <Select
            value={account.jobRole}
            onValueChange={(value) => updateAccount(account.id, { jobRole: value })}
          >
            <SelectTrigger id={`role-${account.id}`} data-testid={`select-account-jobrole-${account.id}`}>
              <SelectValue placeholder="Select a job role" />
            </SelectTrigger>
            <SelectContent>
              {Array.from(new Set([account.jobRole, ...JOB_ROLE_OPTIONS])).map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor={`cohort-${account.id}`}>
            Cohort
          </label>
          <Select
            value={account.cohortId ?? "none"}
            onValueChange={(value) =>
              updateAccount(account.id, { cohortId: value === "none" ? undefined : value })
            }
          >
            <SelectTrigger id={`cohort-${account.id}`} data-testid={`select-account-cohort-${account.id}`}>
              <SelectValue placeholder="Not allocated" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Not allocated</SelectItem>
              {cohorts.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Currently: {cohortName}</p>
        </div>

        {/* Platform roles are granted federally, not by the entity. Stated, not set. */}
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Platform role</p>
          <p
            className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-foreground"
            data-testid={`text-account-platformrole-${account.id}`}
          >
            {account.platformRole}
          </p>
          <p className="text-xs text-muted-foreground">Granted federally — raise an escalation to change it.</p>
        </div>
      </div>

      <Separator />

      {/* Consent */}
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium">Data-processing consent</p>
          <p className="text-xs text-muted-foreground">
            Record the consent state or send the learner a fresh request (§4.2).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={account.consent === "Granted" ? "default" : "outline"}
            data-testid={`button-consent-grant-${account.id}`}
            onClick={() => {
              setConsent(account.id, "Granted");
              toast({ title: "Consent recorded", description: `${account.name} is marked as having granted consent.` });
            }}
          >
            Record granted
          </Button>
          <Button
            size="sm"
            variant={account.consent === "Withdrawn" ? "destructive" : "outline"}
            data-testid={`button-consent-withdraw-${account.id}`}
            onClick={() => {
              setConsent(account.id, "Withdrawn");
              toast({ title: "Consent withdrawn", description: `${account.name} is marked as having withdrawn consent.` });
            }}
          >
            Record withdrawn
          </Button>
          <Button
            size="sm"
            variant="outline"
            data-testid={`button-consent-request-${account.id}`}
            onClick={() => {
              requestConsent(account.id);
              toast({ title: "Consent request sent", description: `A consent request was sent to ${account.name}.` });
            }}
          >
            Request consent
          </Button>
        </div>
      </div>

      <Separator />

      {/* Status */}
      <div className="space-y-3">
        <p className="text-sm font-medium">Account status</p>
        <div className="flex flex-wrap gap-2">
          {account.status !== "Suspended" ? (
            <Button
              size="sm"
              variant="outline"
              className="text-red-700"
              data-testid={`button-suspend-${account.id}`}
              onClick={() => {
                setAccountStatus(account.id, "Suspended");
                toast({ title: "Account suspended", description: `${account.name} can no longer sign in.` });
              }}
            >
              <UserX className="mr-1.5 h-4 w-4" /> Suspend account
            </Button>
          ) : (
            <Button
              size="sm"
              data-testid={`button-reactivate-${account.id}`}
              onClick={() => {
                setAccountStatus(account.id, "Active");
                toast({ title: "Account reactivated", description: `${account.name} can sign in again.` });
              }}
            >
              <UserCheck className="mr-1.5 h-4 w-4" /> Reactivate account
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
