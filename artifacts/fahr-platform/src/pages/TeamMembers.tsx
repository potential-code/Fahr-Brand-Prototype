import React, { useMemo, useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { PageEnter, Stagger, StaggerItem } from "@/components/motion";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronRight, Search, ShieldCheck } from "lucide-react";
import { useFederalData } from "@/lib/FederalDataContext";
import { Input } from "@/components/ui/input";
import { teamRoster } from "@/lib/manager/selectors";
import { CertificationBadge, TeamStatusBadge } from "@/components/manager/TeamStatusBadge";

export default function TeamMembers() {
  const { focus, teamOf, credentials } = useFederalData();
  const team = teamOf(focus.managerId);
  const [search, setSearch] = useState("");

  const roster = useMemo(() => teamRoster(team, credentials), [team, credentials]);

  const query = search.trim().toLowerCase();
  const filteredRoster = roster.filter((row) =>
    query.length === 0
      ? true
      : [row.person.name, row.person.role, row.pathway, row.level.label, row.certification]
          .join(" ")
          .toLowerCase()
          .includes(query),
  );

  return (
    <Layout role="manager">
      <PageEnter className="mx-auto w-full max-w-7xl space-y-6 pb-12">
        <PageHeader
          tone="primary"
          title="Team Members"
          description="Monitor progress, assigned pathways, assessment outcomes and certification standing across your direct reports."
        />

        <Card>
          <CardContent className="p-0">
            <div className="flex items-center justify-between gap-4 border-b border-border p-4">
              <div className="relative w-72">
                <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search name, pathway or standing..."
                  className="ps-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  data-testid="input-search-team"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {filteredRoster.length} of {roster.length} team members
              </p>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Assigned pathway</TableHead>
                    <TableHead>Capability</TableHead>
                    <TableHead>Pathway completion</TableHead>
                    <TableHead>Last active</TableHead>
                    <TableHead>Certification</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-end">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <Stagger as="tbody">
                  {filteredRoster.map((row) => (
                    <StaggerItem
                      as="tr"
                      variant="row"
                      key={row.person.id}
                      className="border-b border-border transition-colors last:border-0 hover:bg-muted/30"
                      data-testid={`row-roster-${row.person.id}`}
                    >
                      <TableCell>
                        <div className="font-semibold text-foreground">{row.person.name}</div>
                        <div className="text-xs text-muted-foreground">{row.person.role}</div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[190px] text-sm text-foreground">{row.pathway}</div>
                        <div className="text-xs text-muted-foreground">{row.cohortName}</div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">{row.level.label}</span>
                        <div className="text-xs text-muted-foreground">
                          Capability average {row.capabilityAverage}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex w-[110px] flex-col gap-1.5">
                          <Progress value={row.pathwayProgress} className="h-1.5" />
                          <span className="text-end text-[10px] text-muted-foreground">
                            {row.pathwayProgress}% · {row.assessmentOutcome}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-foreground">{row.lastActive}</div>
                        {!row.activeThisWeek && (
                          <div className="text-xs text-muted-foreground">Dormant this week</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <CertificationBadge state={row.certification} />
                        {row.credentials.length > 0 && (
                          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <ShieldCheck className="h-3 w-3 text-primary" />
                            {row.credentials.length}{" "}
                            {row.credentials.length === 1 ? "credential" : "credentials"}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <TeamStatusBadge status={row.status} />
                      </TableCell>
                      <TableCell className="text-end">
                        <Link href={`/manager/team/${row.person.id}`}>
                          <Button variant="ghost" size="sm" data-testid={`button-view-${row.person.id}`}>
                            View Profile <ChevronRight className="ms-1 h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </StaggerItem>
                  ))}
                </Stagger>
              </Table>
            </div>
            {filteredRoster.length === 0 && (
              <div className="px-6 py-12 text-center">
                <p className="font-semibold text-foreground">
                  {roster.length === 0 ? "No direct reports yet" : "No team members found"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {roster.length === 0
                    ? "Team members appear here once they are enrolled on a Personalised Learning Pathway."
                    : "Try a different name, pathway or certification standing."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </PageEnter>
    </Layout>
  );
}
