// The real "Create Cohort" flow for the entity cohorts screen.
//
// Collects a name, department, learner count and start date, then
// hands them to `createCohort`. The parent animates the returned cohort into
// the top of the list.

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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle } from "lucide-react";
import { departmentsOf } from "@/lib/federal";
import type { CreateCohortInput } from "@/lib/EntityAdminContext";

const UNASSIGNED_DEPARTMENT = "__none__";

/** Today, formatted the way every seeded date is written. */
function todayIso(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Turns a yyyy-mm-dd value into the "6 August 2026" form the demo uses. */
function humaniseDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function CohortCreateDialog({
  ministryId,
  open,
  onOpenChange,
  onCreate,
}: {
  ministryId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (input: CreateCohortInput) => void;
}) {
  const departments = useMemo(() => departmentsOf(ministryId), [ministryId]);
  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState<string>(UNASSIGNED_DEPARTMENT);
  const [learners, setLearners] = useState("40");
  const [startsOn, setStartsOn] = useState(todayIso());

  const reset = () => {
    setName("");
    setDepartmentId(UNASSIGNED_DEPARTMENT);
    setLearners("40");
    setStartsOn(todayIso());
  };

  const learnerCount = Number(learners);
  const valid = name.trim().length > 1 && Number.isFinite(learnerCount) && learnerCount >= 0 && Boolean(startsOn);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    onCreate({
      name: name.trim(),
      departmentId: departmentId === UNASSIGNED_DEPARTMENT ? undefined : departmentId,
      learners: Math.max(0, Math.round(learnerCount)),
      startsOn: humaniseDate(startsOn),
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
            <PlusCircle className="h-5 w-5 text-primary" /> Create a cohort
          </DialogTitle>
          <DialogDescription>
            Set up a new learning batch. Each learner generates their own Personalised Learning Pathway from their baseline.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="cohort-name">Cohort name</Label>
            <Input
              id="cohort-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Clinical Operations Wave 3"
              data-testid="input-cohort-name"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger data-testid="select-cohort-department">
                  <SelectValue placeholder="Select a department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED_DEPARTMENT}>Entity-wide (no department)</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id} data-testid={`option-dept-${dept.id}`}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cohort-learners">Learners enrolled</Label>
              <Input
                id="cohort-learners"
                type="number"
                min={0}
                value={learners}
                onChange={(e) => setLearners(e.target.value)}
                data-testid="input-cohort-learners"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cohort-start">Start date</Label>
              <Input
                id="cohort-start"
                type="date"
                value={startsOn}
                onChange={(e) => setStartsOn(e.target.value)}
                data-testid="input-cohort-start"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
              data-testid="button-cohort-cancel"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!valid} data-testid="button-cohort-create-confirm">
              Create cohort
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
