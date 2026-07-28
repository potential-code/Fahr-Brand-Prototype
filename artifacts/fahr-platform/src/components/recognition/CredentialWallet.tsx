import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { WalletCredential } from "@/lib/recognitionRecord";
import { ArrowRight, Download, Loader, Lock, Share2, ShieldCheck, Sparkles } from "lucide-react";

/** Dark credential card — the wallet is the one dark surface below the hero. */
function CredentialCard({
  credential,
  index,
  onOpen,
}: {
  credential: WalletCredential;
  index: number;
  onOpen: () => void;
}) {
  const earned = credential.state === "earned";
  const inProgress = credential.state === "in-progress";

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      whileHover={{ y: -4 }}
      className={`group relative flex w-full flex-col overflow-hidden rounded-2xl p-5 text-start transition-shadow hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
        earned ? "bg-[#171310]" : inProgress ? "bg-[#221c17]" : "border border-dashed border-border bg-muted/40"
      }`}
      data-testid={`credential-card-${credential.id}`}
    >
      {earned && (
        <>
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.3]"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.14) 1px, transparent 0)",
              backgroundSize: "20px 20px",
            }}
          />
          <div
            aria-hidden="true"
            className="absolute -end-16 -top-16 h-48 w-48 rounded-full bg-primary/20 blur-2xl transition-opacity group-hover:opacity-80"
          />
        </>
      )}

      <div className="relative flex-1">
        <div className="flex items-start justify-between gap-3">
          <p
            className={`text-[10px] font-bold uppercase tracking-[0.14em] ${
              earned || inProgress ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {credential.issuer}
          </p>
          <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
              earned
                ? "border border-primary/40 bg-primary/15 text-primary"
                : inProgress
                  ? "border border-white/20 bg-white/10 text-white/75"
                  : "border border-border bg-background text-muted-foreground"
            }`}
          >
            {earned ? (
              <>
                <ShieldCheck className="h-3 w-3" /> Verified
              </>
            ) : inProgress ? (
              <>
                <Loader className="h-3 w-3" /> {credential.percent}%
              </>
            ) : (
              <>
                <Lock className="h-3 w-3" /> Available
              </>
            )}
          </span>
        </div>

        <h3
          className={`mt-3 text-lg font-bold leading-tight ${
            earned || inProgress ? "text-white" : "text-foreground"
          }`}
        >
          {credential.title}
        </h3>
        <p className={`mt-1.5 text-xs ${earned || inProgress ? "text-white/55" : "text-muted-foreground"}`}>
          {credential.competencyLabel}
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {credential.skills.slice(0, 2).map((skill) => (
            <span
              key={skill}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                earned || inProgress
                  ? "border border-white/15 bg-white/10 text-white/80"
                  : "border border-border bg-background text-muted-foreground"
              }`}
            >
              {skill.length > 44 ? `${skill.slice(0, 42)}…` : skill}
            </span>
          ))}
          {credential.skills.length > 2 && (
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                earned || inProgress
                  ? "border border-white/15 bg-white/[0.06] text-white/60"
                  : "border border-border bg-background text-muted-foreground"
              }`}
            >
              +{credential.skills.length - 2}
            </span>
          )}
        </div>

        {inProgress && (
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              whileInView={{ width: `${credential.percent}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />
          </div>
        )}
      </div>

      <div
        className={`relative mt-5 flex items-center justify-between border-t pt-3 text-[11px] ${
          earned || inProgress ? "border-white/10 text-white/55" : "border-border text-muted-foreground"
        }`}
      >
        <span className="font-semibold uppercase tracking-wider">{credential.level}</span>
        <span className="font-mono">{earned ? credential.issuedOn : credential.state === "in-progress" ? "In progress" : "Not started"}</span>
      </div>
    </motion.button>
  );
}

/** The wallet: verified credentials, the ones in flight, and what is available next. */
export function CredentialWallet({
  credentials,
  onAction,
}: {
  credentials: WalletCredential[];
  onAction: (action: string, credential: WalletCredential) => void;
}) {
  const [open, setOpen] = useState<WalletCredential | null>(null);
  const earned = credentials.filter((c) => c.state === "earned");
  const rest = credentials.filter((c) => c.state !== "earned");
  const ordered = [...earned, ...rest];

  return (
    <section aria-labelledby="wallet-heading" data-testid="section-credential-wallet">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 id="wallet-heading" className="inline-flex items-center gap-2 text-lg font-bold text-foreground">
            <ShieldCheck className="h-5 w-5 text-primary" /> Digital credentials wallet
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {earned.length} verified {earned.length === 1 ? "credential" : "credentials"} on your federal record, plus
            everything your current pathway will issue. Open any card for its verification details.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {ordered.map((credential, i) => (
          <CredentialCard key={credential.id} credential={credential} index={i} onOpen={() => setOpen(credential)} />
        ))}
      </div>

      <Dialog open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="sm:max-w-lg">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl leading-tight">{open.title}</DialogTitle>
                <DialogDescription>
                  {open.state === "earned" ? "Verified credential" : "Credential in progress"} · {open.issuer}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-2">
                <div className="relative overflow-hidden rounded-xl bg-[#171310] p-5">
                  <div aria-hidden="true" className="absolute -end-12 -top-12 h-40 w-40 rounded-full bg-primary/25 blur-2xl" />
                  <div className="relative flex items-center gap-4">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/15">
                      <ShieldCheck className="h-7 w-7 text-primary" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                        {open.level}
                      </p>
                      <p className="mt-1 text-sm text-white/70">{open.competencyLabel}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Demonstrated capability
                  </h4>
                  <ul className="mt-2.5 space-y-1.5">
                    {open.skills.map((skill) => (
                      <li key={skill} className="flex gap-2 text-sm text-foreground">
                        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                        <span>{skill}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-border bg-muted/40 p-3.5">
                  <p className="text-sm text-foreground">{open.evidence}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {open.state === "earned" ? "Issued on" : "Status"}
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-foreground">
                      {open.state === "earned" ? open.issuedOn : `${open.percent}% complete`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Verification ID</p>
                    <p className="mt-0.5 font-mono text-sm font-medium text-foreground">
                      {open.state === "earned" ? open.verifyId : "Issued on completion"}
                    </p>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 border-t border-border pt-4 sm:justify-start">
                {open.state === "earned" ? (
                  <>
                    <Button className="gap-2" onClick={() => onAction("Download", open)} data-testid="button-download-credential">
                      <Download className="h-4 w-4" /> Download PDF
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => onAction("Share", open)}>
                      <Share2 className="h-4 w-4" /> Share
                    </Button>
                  </>
                ) : (
                  <Button asChild className="gap-2">
                    <Link href={open.href} onClick={() => setOpen(null)} data-testid="button-continue-credential">
                      {open.state === "in-progress" ? "Continue this course" : "Start this course"}{" "}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
