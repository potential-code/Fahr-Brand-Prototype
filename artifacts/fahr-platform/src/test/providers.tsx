import React from "react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { render, type RenderResult } from "@testing-library/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/lib/LanguageContext";
import { LearnerProgressProvider } from "@/lib/LearnerProgressContext";
import { FederalDataProvider } from "@/lib/FederalDataContext";
import { FahrConsoleProvider } from "@/lib/FahrConsoleContext";
import { EntityAdminProvider } from "@/lib/EntityAdminContext";
import { WorkplaceProjectProvider } from "@/lib/WorkplaceProjectContext";
import { DigitalTwinProvider } from "@/lib/DigitalTwinContext";

/**
 * Renders a screen inside the same provider stack as the app, so tests exercise
 * the shared federal spine rather than a stubbed copy of it.
 *
 * `seedProject` defaults to true, matching the app's default of opening on an
 * approved workplace project. Pass `{ seedProject: false }` for a test that
 * needs to start from a genuinely empty project.
 */
export function renderScreen(
  ui: React.ReactElement,
  path = "/",
  options?: { seedProject?: boolean },
): RenderResult {
  const { hook } = memoryLocation({ path, static: true });
  return render(
    <Router hook={hook}>
      <LanguageProvider>
        <TooltipProvider>
          <LearnerProgressProvider>
            <FederalDataProvider>
              <FahrConsoleProvider>
                <EntityAdminProvider>
                  <WorkplaceProjectProvider seedSubmission={options?.seedProject ?? true}>
                    <DigitalTwinProvider>{ui}</DigitalTwinProvider>
                  </WorkplaceProjectProvider>
                </EntityAdminProvider>
              </FahrConsoleProvider>
            </FederalDataProvider>
          </LearnerProgressProvider>
        </TooltipProvider>
      </LanguageProvider>
    </Router>,
  );
}

/** Digits out of a rendered figure, e.g. "AED 72M" or "41,850". */
export function numberFrom(text: string | null): number {
  return Number((text ?? "").replace(/[^\d.]/g, ""));
}
