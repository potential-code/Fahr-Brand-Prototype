import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Download, Maximize2, ShieldCheck } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

type CertificateProps = {
  learnerName: string;
  projectTitle: string;
  /**
   * The evaluation's scoring dimensions (Practical application, Innovation,
   * Feasibility, …) — deliberately not the five AI competencies the badge
   * grid below this certificate uses. The two are different vocabularies for
   * different things (how the project was scored vs. which competencies the
   * learner has reached Practitioner in), so this is labelled on the
   * certificate face as what it is rather than left to be mistaken for the
   * badge set.
   */
  dimensions: string[];
  score: number;
  issuedOn: string;
  verifyId: string;
  reviewer: string;
};

/**
 * The certificate face. Landscape, bordered, deliberately formal — this is the
 * one surface on the platform allowed to look like a printed document rather
 * than product UI. Rendered twice: small and non-interactive in the inline
 * preview, full size inside the dialog.
 */
function CertificateFace({
  learnerName,
  projectTitle,
  dimensions,
  score,
  issuedOn,
  verifyId,
  reviewer,
}: CertificateProps) {
  return (
    <div
      className="relative mx-auto aspect-[1.414/1] w-full max-w-3xl overflow-hidden rounded-lg border-[3px] border-double border-primary/50 bg-card p-5 text-foreground sm:p-8 md:p-10"
      data-testid="certificate-face"
    >
      {/* Corner brackets — the only ornament, so the document reads as bordered rather than decorated. */}
      <span aria-hidden="true" className="absolute start-3 top-3 h-5 w-5 border-s-2 border-t-2 border-primary/40 sm:h-7 sm:w-7" />
      <span aria-hidden="true" className="absolute end-3 top-3 h-5 w-5 border-e-2 border-t-2 border-primary/40 sm:h-7 sm:w-7" />
      <span aria-hidden="true" className="absolute bottom-3 start-3 h-5 w-5 border-b-2 border-s-2 border-primary/40 sm:h-7 sm:w-7" />
      <span aria-hidden="true" className="absolute bottom-3 end-3 h-5 w-5 border-b-2 border-e-2 border-primary/40 sm:h-7 sm:w-7" />

      <div className="flex h-full flex-col items-center justify-between text-center">
        <div>
          <img src={`${BASE}brand/fahr-logo.png`} alt="FAHR" className="mx-auto h-8 sm:h-10" />
          <p className="mt-2 text-[9px] font-semibold uppercase tracking-[0.28em] text-muted-foreground sm:text-[10px]">
            Federal Authority for Government Human Resources
          </p>
        </div>

        <div className="min-h-0 flex-1 py-3 sm:py-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-primary sm:text-xs">
            Certificate of Completion
          </p>
          <p className="mt-3 text-[11px] text-muted-foreground sm:mt-4 sm:text-sm">This certifies that</p>
          <p
            className="mt-1.5 truncate font-serif text-2xl font-bold text-foreground sm:mt-2 sm:text-4xl"
            data-testid="text-certificate-name"
          >
            {learnerName}
          </p>
          <p className="mt-1.5 text-[11px] text-muted-foreground sm:mt-2 sm:text-sm">
            has completed and been evaluated on the workplace AI project
          </p>
          <p className="mt-1 truncate px-4 text-sm font-semibold text-foreground sm:text-lg" data-testid="text-certificate-project">
            {projectTitle}
          </p>

          <p className="mt-3 text-[8px] uppercase tracking-[0.2em] text-muted-foreground sm:mt-4 sm:text-[9px]">
            Evaluated across
          </p>
          <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            {dimensions.map((dimension) => (
              <span
                key={dimension}
                className="rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[9px] font-medium text-foreground sm:px-2.5 sm:py-1 sm:text-[11px]"
              >
                {dimension}
              </span>
            ))}
          </div>
        </div>

        <div className="w-full">
          <div className="grid grid-cols-3 gap-2 border-t border-border pt-3 text-center sm:gap-4 sm:pt-4">
            <div>
              <p className="text-base font-bold tabular-nums text-primary sm:text-xl">{score}%</p>
              <p className="text-[8px] uppercase tracking-wider text-muted-foreground sm:text-[10px]">Evaluation score</p>
            </div>
            <div>
              <ShieldCheck className="mx-auto h-4 w-4 text-primary sm:h-5 sm:w-5" aria-hidden="true" />
              <p className="mt-0.5 text-[8px] uppercase tracking-wider text-muted-foreground sm:text-[10px]">
                Issued {issuedOn}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-semibold leading-tight text-foreground sm:text-sm">{reviewer}</p>
              <p className="text-[8px] uppercase tracking-wider text-muted-foreground sm:text-[10px]">Reviewed and approved by</p>
            </div>
          </div>
          <p className="mt-2 font-mono text-[8px] text-muted-foreground sm:mt-3 sm:text-[10px]" data-testid="text-certificate-verify-id">
            Verification ID {verifyId}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * The workplace project certificate. Opens full-screen from an inline
 * preview, because it is the headline artefact of the Recognition screen —
 * every field on it is read from the learner's own evaluated project, so it
 * carries no number the platform did not already show elsewhere.
 */
export function ProjectCertificate(props: CertificateProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative block w-full rounded-2xl text-start focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        data-testid="button-open-certificate"
        aria-label="Open the full certificate"
      >
        <CertificateFace {...props} />
        <span className="absolute end-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-card/90 px-2.5 py-1 text-[10px] font-medium text-muted-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 sm:end-6 sm:top-6">
          <Maximize2 className="h-3 w-3" aria-hidden="true" /> View full certificate
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-h-[92vh] w-[95vw] max-w-4xl overflow-y-auto bg-background p-4 sm:p-8"
          data-testid="dialog-certificate"
        >
          <DialogTitle className="sr-only">Project certificate for {props.learnerName}</DialogTitle>
          <CertificateFace {...props} />
          <div className="mt-5 flex justify-center sm:mt-6">
            <Button
              variant="outline"
              onClick={() =>
                toast({
                  title: "Certificate downloaded",
                  description: `${props.projectTitle} — verification ID ${props.verifyId}.`,
                })
              }
              data-testid="button-download-certificate"
            >
              <Download className="me-2 h-4 w-4" /> Download PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
