import React, { useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { PageEnter, Stagger, StaggerItem } from "@/components/motion";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronRight, Search } from "lucide-react";
import { useFederalData } from "@/lib/FederalDataContext";
import { LEVEL_BY_ID, type LearnerStatus } from "@/lib/federal";
import { Input } from "@/components/ui/input";

export default function TeamMembers() {
  const { focus, teamOf } = useFederalData();
  const team = teamOf(focus.managerId);
  const [search, setSearch] = useState("");

  const filteredTeam = team.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.role.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: LearnerStatus) => {
    switch (status) {
      case 'on-track': return <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20">On Track</Badge>;
      case 'excelling': return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Excelling</Badge>;
      case 'needs-attention': return <Badge variant="outline" className="bg-accent/10 text-accent border-accent/25">Needs Attention</Badge>;
      case 'at-risk': return <Badge variant="destructive" className="shadow-none">At Risk</Badge>;
      default: return null;
    }
  };

  return (
    <Layout role="manager">
      <PageEnter className="space-y-6 max-w-7xl mx-auto w-full pb-12">
        <PageHeader
          tone="primary"
          title="Team Members"
          description="Manage and monitor the progression of your direct reports."
        />

        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="relative w-72">
                <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Search team..." 
                  className="ps-9"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Capability</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-end">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeam.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div className="font-semibold text-foreground">{employee.name}</div>
                      <div className="text-xs text-muted-foreground">{employee.role}</div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">{LEVEL_BY_ID[employee.levelId]?.label ?? employee.levelId}</span>
                    </TableCell>
                    <TableCell>
                      <div className="w-[100px] flex flex-col gap-1.5">
                        <Progress value={employee.pathwayProgress} className="h-1.5" />
                        <span className="text-[10px] text-muted-foreground text-end">
                          {employee.pathwayProgress}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(employee.status)}
                    </TableCell>
                    <TableCell className="text-end">
                       <Link href={`/manager/team/${employee.id}`}>
                         <Button variant="ghost" size="sm">
                           View Profile <ChevronRight className="w-4 h-4 ms-1" />
                         </Button>
                       </Link>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredTeam.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No team members found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </PageEnter>
    </Layout>
  );
}
