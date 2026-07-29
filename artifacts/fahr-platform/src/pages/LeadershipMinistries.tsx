import React, { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Table, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useFederalData } from "@/lib/FederalDataContext";
import { ON_TRACK_READINESS } from "@/lib/federal";
import { PageEnter, Stagger, StaggerItem } from "@/components/motion";
import { ArrowUpDown, ChevronDown, ChevronUp, AlertCircle, CheckCircle2 } from "lucide-react";

export default function LeadershipMinistries() {
  const { ministries } = useFederalData();
  const [, setLocation] = useLocation();
  const [sortCol, setSortCol] = useState<string>("readiness");
  const [sortDesc, setSortDesc] = useState<boolean>(true);

  const toggleSort = (col: string) => {
    if (sortCol === col) {
      setSortDesc(!sortDesc);
    } else {
      setSortCol(col);
      setSortDesc(true);
    }
  };

  const sortedMinistries = useMemo(() => {
    return [...ministries].sort((a, b) => {
      let aVal = a[sortCol as keyof typeof a] as number;
      let bVal = b[sortCol as keyof typeof b] as number;
      
      if (sortCol === 'coverage') {
        aVal = (a.activeLearners / a.employees) * 100;
        bVal = (b.activeLearners / b.employees) * 100;
      }

      if (aVal < bVal) return sortDesc ? 1 : -1;
      if (aVal > bVal) return sortDesc ? -1 : 1;
      return 0;
    });
  }, [ministries, sortCol, sortDesc]);

  const SortIcon = ({ col }: { col: string }) => {
    if (sortCol !== col) return <ArrowUpDown className="w-3.5 h-3.5 opacity-40 ms-1" />;
    return sortDesc ? <ChevronDown className="w-3.5 h-3.5 ms-1 text-primary" /> : <ChevronUp className="w-3.5 h-3.5 ms-1 text-primary" />;
  };

  return (
    <Layout role="leadership">
      <PageEnter className="space-y-8 pb-12">
        <PageHeader 
          bordered
          title="Federal Ministries" 
          description="Readiness and impact ranking across all federal entities."
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Entity Comparison</CardTitle>
            <CardDescription>
              Click any entity row to jump directly to its detailed profile in the FAHR Programme portal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entity</TableHead>
                    <TableHead className="text-end cursor-pointer hover:bg-muted/50 transition-colors select-none" onClick={() => toggleSort('readiness')}>
                      <div className="flex items-center justify-end">Readiness <SortIcon col="readiness" /></div>
                    </TableHead>
                    <TableHead className="text-end cursor-pointer hover:bg-muted/50 transition-colors select-none" onClick={() => toggleSort('coverage')}>
                      <div className="flex items-center justify-end">Coverage <SortIcon col="coverage" /></div>
                    </TableHead>
                    <TableHead className="text-end cursor-pointer hover:bg-muted/50 transition-colors select-none" onClick={() => toggleSort('valueCreatedAedM')}>
                      <div className="flex items-center justify-end">Value (AED M) <SortIcon col="valueCreatedAedM" /></div>
                    </TableHead>
                    <TableHead className="text-end cursor-pointer hover:bg-muted/50 transition-colors select-none" onClick={() => toggleSort('projectsSubmitted')}>
                      <div className="flex items-center justify-end">Projects <SortIcon col="projectsSubmitted" /></div>
                    </TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <Stagger as="tbody" gap={0.05}>
                  {sortedMinistries.map(m => {
                    const coverage = Math.round((m.activeLearners / m.employees) * 100);
                    const onTrack = m.readiness >= ON_TRACK_READINESS;
                    return (
                      <StaggerItem 
                        as="tr" 
                        key={m.id}
                        variant="row"
                        className="cursor-pointer transition-colors hover:bg-muted/50 focus-visible:bg-muted/60 focus-visible:outline-none border-b border-border last:border-0"
                      >
                        <TableCell 
                          className="font-medium text-primary"
                          onClick={() => setLocation(`/fahr?ministry=${m.id}`)}
                        >
                          <button 
                            className="text-start hover:underline focus-visible:outline-none"
                          >
                            {m.name}
                          </button>
                        </TableCell>
                        <TableCell className="text-end font-bold" onClick={() => setLocation(`/fahr?ministry=${m.id}`)}>{m.readiness}%</TableCell>
                        <TableCell className="text-end" onClick={() => setLocation(`/fahr?ministry=${m.id}`)}>{coverage}%</TableCell>
                        <TableCell className="text-end font-medium" onClick={() => setLocation(`/fahr?ministry=${m.id}`)}>AED {m.valueCreatedAedM.toFixed(1)}</TableCell>
                        <TableCell className="text-end" onClick={() => setLocation(`/fahr?ministry=${m.id}`)}>{m.projectsSubmitted}</TableCell>
                        <TableCell onClick={() => setLocation(`/fahr?ministry=${m.id}`)}>
                          {onTrack ? (
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              On Track
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-destructive">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Needs Attention
                            </span>
                          )}
                        </TableCell>
                      </StaggerItem>
                    );
                  })}
                </Stagger>
              </Table>
            </div>
          </CardContent>
        </Card>
      </PageEnter>
    </Layout>
  );
}
