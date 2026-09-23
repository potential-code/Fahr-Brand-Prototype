// Role-aware registration dialog opened from the landing page.
//
// Mock provisioning only: the form validates, waits, shows a confirmation and
// drops the visitor into the portal for the role they picked.

import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/lib/LanguageContext";
import { STAKEHOLDERS } from "@/lib/constants";
import { LANDING_MOTION } from "./motion";
import { ROLE_TITLE_KEYS } from "./roles";

type Stakeholder = (typeof STAKEHOLDERS)[number];

const ENTITY_OPTIONS = [
  { value: "mohap", key: "landing.registration.entities.mohap" },
  { value: "moe", key: "landing.registration.entities.moe" },
  { value: "mof", key: "landing.registration.entities.mof" },
  { value: "moei", key: "landing.registration.entities.moei" },
  { value: "fahr", key: "landing.registration.entities.fahr" },
];

export function RegistrationDialog({
  role,
  open,
  onOpenChange,
}: {
  role: Stakeholder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [, setLocation] = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const reduced = useReducedMotion();
  const timers = useRef<number[]>([]);
  const { t } = useLanguage();

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  // Abandon the simulated provisioning if the dialog closes or unmounts, so a
  // pending timer can never navigate the visitor somewhere they did not ask for.
  useEffect(() => {
    if (!open) {
      clearTimers();
      setSubmitting(false);
      setDone(false);
    }
    return clearTimers;
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    timers.current.push(
      window.setTimeout(() => {
        setSubmitting(false);
        setDone(true);
        timers.current.push(
          window.setTimeout(() => {
            onOpenChange(false);
            setDone(false);
            if (role) setLocation(role.route);
          }, 1400),
        );
      }, 1100),
    );
  };

  const identity = (
    <>
      <Field
        id="name"
        label={t("landing.registration.nameLabel")}
        placeholder={t("landing.registration.namePlaceholder")}
      />
      <Field
        id="email"
        label={t("landing.registration.emailLabel")}
        type="email"
        placeholder={t("landing.registration.emailPlaceholder")}
      />
    </>
  );

  const entityField = (
    <div className="space-y-2">
      <Label htmlFor="entity">{t("landing.registration.entityLabel")}</Label>
      <Select required>
        <SelectTrigger id="entity">
          <SelectValue placeholder={t("landing.registration.entityPlaceholder")} />
        </SelectTrigger>
        <SelectContent>
          {ENTITY_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {t(option.key)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const fields = () => {
    switch (role?.id) {
      case "learner":
        return (
          <>
            {identity}
            {entityField}
            <Field
              id="title"
              label={t("landing.registration.jobTitleLabel")}
              placeholder={t("landing.registration.learner.jobTitlePlaceholder")}
            />
          </>
        );
      case "manager":
        return (
          <>
            {identity}
            {entityField}
            <Field
              id="title"
              label={t("landing.registration.jobTitleLabel")}
              placeholder={t("landing.registration.manager.jobTitlePlaceholder")}
            />
            <Field
              id="team"
              label={t("landing.registration.manager.teamSizeLabel")}
              type="number"
              placeholder={t("landing.registration.manager.teamSizePlaceholder")}
              min="1"
            />
          </>
        );
      case "entity":
        return (
          <>
            {identity}
            {entityField}
            <Field
              id="adminCode"
              label={t("landing.registration.entity.adminCodeLabel")}
              type="password"
              placeholder={t("landing.registration.entity.adminCodePlaceholder")}
            />
          </>
        );
      case "fahr-team":
        return (
          <>
            {identity}
            <Field
              id="fahrId"
              label={t("landing.registration.fahrTeam.programmeIdLabel")}
              placeholder={t("landing.registration.fahrTeam.programmeIdPlaceholder")}
            />
          </>
        );
      case "leadership":
        return (
          <>
            {identity}
            {entityField}
            <Field
              id="execTitle"
              label={t("landing.registration.leadership.execTitleLabel")}
              placeholder={t("landing.registration.leadership.execTitlePlaceholder")}
            />
          </>
        );
      default:
        return identity;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden border border-border p-0 shadow-xl sm:max-w-[500px]">
        <AnimatePresence mode="wait" initial={false}>
          {done ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: LANDING_MOTION.ease }}
              className="flex flex-col items-center bg-white p-10 text-center text-foreground"
            >
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
                className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary"
              >
                <CheckCircle2 className="h-8 w-8" />
              </motion.span>
              <DialogTitle className="mb-1.5 text-xl font-bold text-foreground">
                {t("landing.registration.doneTitle")}
              </DialogTitle>
              <DialogDescription className="mb-6 text-sm text-muted-foreground">
                {t("landing.registration.doneDescription")}
              </DialogDescription>
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    animate={reduced ? undefined : { opacity: [0.25, 1, 0.25] }}
                    transition={
                      reduced ? undefined : { repeat: Infinity, duration: 1, delay: i * 0.18 }
                    }
                    className="h-2 w-2 rounded-full bg-primary"
                  />
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
            >
              <div className="flex items-center gap-3.5 border-b border-border bg-background p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </span>
                <div className="min-w-0">
                  <DialogTitle className="text-lg font-bold text-foreground">
                    {t("landing.registration.createProfileTitle")}
                  </DialogTitle>
                  <DialogDescription className="truncate text-sm text-muted-foreground">
                    {t("landing.registration.registeringAs", {
                      title: role ? t(ROLE_TITLE_KEYS[role.id]) : t("landing.registration.fallbackRole"),
                    })}
                  </DialogDescription>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5 bg-white p-5">
                <motion.div
                  className="space-y-4"
                  initial="hidden"
                  animate="shown"
                  variants={{
                    hidden: {},
                    shown: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
                  }}
                >
                  {React.Children.map(fields(), (child, i) => (
                    <motion.div
                      key={i}
                      variants={{ hidden: { opacity: 0, y: 10 }, shown: { opacity: 1, y: 0 } }}
                      transition={{ duration: 0.3, ease: LANDING_MOTION.ease }}
                    >
                      {child}
                    </motion.div>
                  ))}
                </motion.div>
                <div className="flex justify-end gap-2.5 border-t border-border pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="border-border text-foreground hover:bg-black/5"
                  >
                    {t("landing.registration.cancel")}
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    data-testid="button-submit-registration"
                    className="min-w-[130px] bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="me-2 h-4 w-4 animate-spin" /> {t("landing.registration.submitting")}
                      </>
                    ) : (
                      t("landing.registration.submit")
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  id,
  label,
  type = "text",
  placeholder,
  min,
}: {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  min?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} placeholder={placeholder} min={min} required />
    </div>
  );
}
