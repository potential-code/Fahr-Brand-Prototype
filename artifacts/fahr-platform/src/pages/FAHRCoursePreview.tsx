import React, { useState } from "react";
import { Link, useParams } from "wouter";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, ExternalLink, FileDown, PlayCircle, XCircle } from "lucide-react";
import { useFahrConsole } from "@/lib/FahrConsoleContext";
import { COMPETENCY_BY_ID } from "@/lib/learningData";
import type { LearningBlock } from "@/lib/federal/model";
import { coverSrc, formatMinutes, structureOf, structureTotals, youtubeId } from "@/lib/contentLibrary";
import { PageEnter } from "@/components/motion";

/**
 * A course as a learner meets it, for the courses that have no learner player
 * of their own — the ones FAHR builds here and the Coursera imports. The
 * platform's own courses open in the real course player instead.
 */
export default function FAHRCoursePreview() {
  const { contentId } = useParams<{ contentId: string }>();
  const { catalogueWithAdditions } = useFahrConsole();
  const item = catalogueWithAdditions.find((c) => c.id === contentId);

  if (!item) {
    return (
      <Layout role="fahr">
        <div className="space-y-4 py-12 text-center">
          <p className="text-lg font-semibold">Course not found</p>
          <Link href="/fahr/content" className="text-primary underline-offset-4 hover:underline">
            Back to the content library
          </Link>
        </div>
      </Layout>
    );
  }

  const modules = structureOf(item);
  const totals = structureTotals(modules);
  const external = item.source === "Coursera";

  return (
    <Layout role="fahr">
      <PageEnter className="mx-auto w-full max-w-4xl space-y-6 pb-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href={`/fahr/content/${item.id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to the editor
          </Link>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary" data-testid="preview-banner">
            Previewing as a learner
          </span>
        </div>

        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <img src={coverSrc(item.cover)} alt="" className="h-48 w-full object-cover" />
          <div className="space-y-2 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {COMPETENCY_BY_ID[item.competencyId]?.label} · {item.level}
            </p>
            <h1 className="text-2xl font-bold text-foreground">{item.title}</h1>
            {item.summary && <p className="text-muted-foreground">{item.summary}</p>}
            <p className="text-sm text-muted-foreground">
              {totals.modules} modules
              {!external && ` · ${totals.units} units · ${formatMinutes(totals.mins)}`}
              {item.pointsPerUnit ? ` · ${item.pointsPerUnit} points per unit` : ""}
              {item.certificate ? " · certificate on completion" : ""}
            </p>
          </div>
        </section>

        {modules.map((module, mi) => (
          <section key={module.id} className="space-y-3" data-testid={`preview-module-${module.id}`}>
            <h2 className="text-lg font-semibold text-foreground">
              <span className="me-2 text-muted-foreground">Module {mi + 1}</span>
              {module.title}
            </h2>
            {external ? (
              <p className="flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground">
                <ExternalLink className="h-4 w-4" /> Taken on Coursera.
              </p>
            ) : (
              module.units.map((unit, ui) => (
                <article key={unit.id} className="space-y-4 rounded-2xl border border-border bg-card p-5" data-testid={`preview-unit-${unit.id}`}>
                  <header className="flex items-baseline justify-between gap-3">
                    <h3 className="font-semibold text-foreground">
                      {mi + 1}.{ui + 1} {unit.title}
                    </h3>
                    <span className="shrink-0 text-xs text-muted-foreground">{unit.mins} min</span>
                  </header>
                  {unit.blocks.length === 0 && <p className="text-sm text-muted-foreground">No content in this unit yet.</p>}
                  {unit.blocks.map((block) => (
                    <BlockView key={block.id} block={block} />
                  ))}
                </article>
              ))
            )}
          </section>
        ))}
      </PageEnter>
    </Layout>
  );
}

function BlockView({ block }: { block: LearningBlock }) {
  if (block.kind === "Text") {
    return (
      <div className="space-y-2 text-sm leading-relaxed text-foreground">
        {(block.text ?? "").split(/\n\s*\n/).map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
    );
  }
  if (block.kind === "Video") {
    const id = youtubeId(block.videoUrl);
    return id ? (
      <div className="aspect-video overflow-hidden rounded-xl border border-border">
        <iframe src={`https://www.youtube-nocookie.com/embed/${id}?rel=0`} title={block.title} className="h-full w-full" allowFullScreen />
      </div>
    ) : (
      <div className="flex aspect-video items-center justify-center rounded-xl border border-border bg-muted/40 text-sm text-muted-foreground">
        <PlayCircle className="me-2 h-5 w-5" /> {block.fileName ?? block.title}
      </div>
    );
  }
  if (block.kind === "Document") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm">
        <FileDown className="h-5 w-5 text-primary" />
        <span className="flex-1 text-foreground">{block.title}</span>
        <span className="text-xs text-muted-foreground">{block.fileName}</span>
      </div>
    );
  }
  return <QuestionView block={block} />;
}

function QuestionView({ block }: { block: LearningBlock }) {
  const [picked, setPicked] = useState<number | null>(null);
  const q = block.question;
  if (!q) return null;
  const checked = picked !== null;
  return (
    <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
      <p className="text-sm font-medium text-foreground">{q.prompt}</p>
      <div className="space-y-2">
        {q.options.map((option, i) => {
          const correct = i === q.correctIndex;
          const chosen = picked === i;
          return (
            <Button
              key={i}
              variant="outline"
              className={`h-auto w-full justify-start whitespace-normal py-2 text-start ${
                checked && correct ? "border-green-300 bg-green-50" : checked && chosen ? "border-destructive/40 bg-destructive/5" : ""
              }`}
              onClick={() => setPicked(i)}
            >
              {checked && correct && <CheckCircle2 className="me-2 h-4 w-4 shrink-0 text-green-600" />}
              {checked && chosen && !correct && <XCircle className="me-2 h-4 w-4 shrink-0 text-destructive" />}
              {option}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
