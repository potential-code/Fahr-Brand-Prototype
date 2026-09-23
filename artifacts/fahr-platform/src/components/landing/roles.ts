// Maps each stakeholder id to the landing page's own translated title key.
//
// `STAKEHOLDERS` in `@/lib/constants` stays English — it is shared with the
// app, which the language toggle does not govern (see `App.tsx`'s
// `ResetLanguageOutsideLanding`). The landing page needs its own bilingual
// copy of the same five role titles, so this map lets `PathwaysSection`,
// `LandingFooter` and `RegistrationDialog` each resolve
// `STAKEHOLDERS[i].title` to a `landing.pathways.<id>.title` key at the
// render site, without mutating the shared constant.

import type { STAKEHOLDERS } from "@/lib/constants";

export type StakeholderId = (typeof STAKEHOLDERS)[number]["id"];

export const ROLE_TITLE_KEYS: Record<StakeholderId, string> = {
  learner: "landing.pathways.learner.title",
  manager: "landing.pathways.manager.title",
  entity: "landing.pathways.entity.title",
  "fahr-team": "landing.pathways.fahrTeam.title",
  leadership: "landing.pathways.leadership.title",
};
