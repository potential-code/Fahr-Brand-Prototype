import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  emptyProfile,
  isTrainable,
  readiness,
  type TwinFieldId,
  type TwinProfile,
} from "@/lib/digitalTwin";

type Ctx = {
  profile: TwinProfile;
  /** Record an interview answer. Multi-value fields append. */
  capture: (field: TwinFieldId, value: string) => void;
  /** Remove one captured value — the learner can correct themselves mid-demo. */
  discard: (field: TwinFieldId, value: string) => void;
  /** Add a rule of the learner's own. A rule is present or removed — no disabled state. */
  addCustomGuardrail: (label: string) => void;
  removeCustomGuardrail: (id: string) => void;
  /** Marks the training run complete; the twin only counts as live after this. */
  completeTraining: () => void;
  reset: () => void;
  readiness: number;
  isTrainable: boolean;
  isLive: boolean;
};

const DigitalTwinContext = createContext<Ctx | undefined>(undefined);

/**
 * Holds the Digital Twin the learner builds in the Agentic AI Lab.
 *
 * In-memory for the demo, in line with every other store in this prototype:
 * closing the tab starts a fresh twin, which is what you want when the same
 * laptop is used to demo to the next room.
 */
export function DigitalTwinProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<TwinProfile>(() => emptyProfile());

  const capture = useCallback((field: TwinFieldId, value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    setProfile((current) => {
      switch (field) {
        case "role":
          return { ...current, role: trimmed };
        case "tone":
          return { ...current, tone: trimmed };
        case "tasks":
        case "briefs":
        case "knowledge": {
          const existing = current[field];
          // Adding the same suggestion twice is a demo misfire, not an intent.
          if (existing.some((entry) => entry.toLowerCase() === trimmed.toLowerCase())) return current;
          return { ...current, [field]: [...existing, trimmed] };
        }
      }
    });
  }, []);

  const discard = useCallback((field: TwinFieldId, value: string) => {
    setProfile((current) => {
      switch (field) {
        case "role":
          return { ...current, role: "" };
        case "tone":
          return { ...current, tone: "" };
        case "tasks":
        case "briefs":
        case "knowledge":
          return { ...current, [field]: current[field].filter((entry) => entry !== value) };
      }
    });
  }, []);

  const addCustomGuardrail = useCallback((label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;

    setProfile((current) => {
      if (current.customGuardrails.some((rule) => rule.label.toLowerCase() === trimmed.toLowerCase())) {
        return current;
      }
      // Ids are derived from the label rather than random, so the same demo
      // replayed twice produces the same audit-facing identifiers.
      const base = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "rule";
      let id = `own-${base}`;
      let suffix = 2;
      while (current.customGuardrails.some((rule) => rule.id === id)) {
        id = `own-${base}-${suffix}`;
        suffix += 1;
      }
      return {
        ...current,
        customGuardrails: [...current.customGuardrails, { id, label: trimmed }],
      };
    });
  }, []);

  const removeCustomGuardrail = useCallback((id: string) => {
    setProfile((current) => ({
      ...current,
      customGuardrails: current.customGuardrails.filter((rule) => rule.id !== id),
    }));
  }, []);

  const completeTraining = useCallback(() => {
    setProfile((current) => ({ ...current, trainedAt: new Date().toISOString() }));
  }, []);

  const reset = useCallback(() => setProfile(emptyProfile()), []);

  const value = useMemo<Ctx>(
    () => ({
      profile,
      capture,
      discard,
      addCustomGuardrail,
      removeCustomGuardrail,
      completeTraining,
      reset,
      readiness: readiness(profile),
      isTrainable: isTrainable(profile),
      isLive: profile.trainedAt !== null,
    }),
    [profile, capture, discard, addCustomGuardrail, removeCustomGuardrail, completeTraining, reset],
  );

  return <DigitalTwinContext.Provider value={value}>{children}</DigitalTwinContext.Provider>;
}

export function useDigitalTwin(): Ctx {
  const ctx = useContext(DigitalTwinContext);
  if (!ctx) throw new Error("useDigitalTwin must be used inside DigitalTwinProvider");
  return ctx;
}
