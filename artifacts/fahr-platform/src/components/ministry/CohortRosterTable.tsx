// The roster table for a cohort detail screen.
//
// Rows come from `cohortSummary(...).members`. Authored (non-synthetic) members
// link to their profile and can be certified when ready; generated members are
// shown honestly as sampled and are not clickable profiles.

import React from "react";
import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Stagger, StaggerItem } from "@/components/motion";
import { ShieldCheck } from "lucide-react";
import type { CohortMember } from "@/lib/entityAdmin/model";
import { LEVEL_BY_ID } from "@/lib/federal";
import {
  OutcomeBadge,
  CertificationBadge,
  EngagementBadge,
} from "./CohortShared";

export function CohortRosterTable({
  members,
  onCertify,
  certifyingId,
}: {
  members: CohortMember[];
  onCertify: (member: CohortMember) => void;
  certifyingId: string | null;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Learner</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Capability level</TableHead>
            <TableHead className="w-[160px]">Pathway progress</TableHead>
            <TableHead className="text-right">Assessment</TableHead>
            <TableHead>Outcome</TableHead>
            <TableHead>Certification</TableHead>
            <TableHead>Last active</TableHead>
            <TableHead>Engagement</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <Stagger as="tbody" onView>
          {members.map((member) => {
            const level = LEVEL_BY_ID[member.levelId];
            const canCertify = !member.synthetic && member.certification === "Ready to certify";
            return (
              <StaggerItem
                as="tr"
                variant="row"
                key={member.id}
                className="border-b transition-colors hover:bg-muted/50 focus-within:bg-muted/50"
                data-testid={`row-member-${member.id}`}
              >
                <TableCell className="font-medium">
                  {member.synthetic ? (
                    <span className="flex items-center gap-2">
                      {member.name}
                      <Badge variant="outline" className="border-slate-200 bg-slate-100 text-[10px] text-slate-500">
                        sampled
                      </Badge>
                    </span>
                  ) : (
                    <Link
                      href={`/ministry/people/${member.id}`}
                      className="text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                      data-testid={`link-person-${member.id}`}
                    >
                      {member.name}
                    </Link>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{member.role}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                    {level?.label ?? member.levelId}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={member.pathwayProgress} className="h-2 flex-1" />
                    <span className="w-9 text-right text-xs text-muted-foreground">{member.pathwayProgress}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {member.assessmentOutcome === "Awaiting assessment" ? "—" : `${member.assessmentScore}%`}
                </TableCell>
                <TableCell>
                  <OutcomeBadge outcome={member.assessmentOutcome} />
                </TableCell>
                <TableCell>
                  <CertificationBadge state={member.certification} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{member.lastActive}</TableCell>
                <TableCell>
                  <EngagementBadge status={member.status} />
                </TableCell>
                <TableCell className="text-right">
                  {canCertify ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      disabled={certifyingId === member.id}
                      onClick={() => onCertify(member)}
                      data-testid={`button-certify-${member.id}`}
                    >
                      <motion.span
                        initial={false}
                        animate={reduceMotion ? {} : { scale: certifyingId === member.id ? 1.1 : 1 }}
                        className="flex items-center gap-1"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" /> Certify
                      </motion.span>
                    </Button>
                  ) : member.certification === "Certified" ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                      <ShieldCheck className="h-3.5 w-3.5" /> Issued
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
              </StaggerItem>
            );
          })}
        </Stagger>
      </Table>
    </div>
  );
}
