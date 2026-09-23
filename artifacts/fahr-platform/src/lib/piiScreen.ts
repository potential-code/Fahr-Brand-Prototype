// Pattern-based PII screening for the digital twin.
//
// The twin's headline governance claim is that personal data never reaches
// the model. A vocabulary screen catches the phrase "phone number" but sails
// straight past an actual number like 0501234567 — this module screens on
// patterns (a UAE phone, an Emirates ID, an email, an IBAN, a birth date, an
// introduced name) as well as the original keyword list, so a real name and
// number typed live in a demo gets caught.
//
// False positives are worse than false negatives here: this runs in front of
// a government audience, and a screen that flags a budget figure, a
// ministry's name, or ordinary passport-adjacent prose is a worse look than
// one that misses an edge case. Each detector is therefore deliberately
// narrow — the name rule only fires after an unambiguous self-introduction
// ("my name is", "اسمي"), never on any capitalised pair or on a bare "I am"
// / "this is", which are far too common outside self-introduction; the
// passport rule requires both a meaningful marker (a "no."/"number"/":"/"#",
// not just the bare word "passport") and a digit inside the captured token.

export type PiiKind =
  | "emiratesId"
  | "phone"
  | "email"
  | "iban"
  | "passport"
  | "dateOfBirth"
  | "name"
  | "keyword";

export type PiiFinding = {
  kind: PiiKind;
  label: string;
  match: string;
  start: number;
  end: number;
};

export type PiiScreen = { hit: boolean; findings: PiiFinding[]; redacted: string };

/**
 * Words that mean the question is reaching for someone's personal data.
 *
 * Note: the bare word "passport" was removed from this list. It matched any
 * ordinary sentence that merely mentions passports ("renew your passport",
 * "passport control", "passport office hours") — exactly the kind of core
 * UAE-government subject matter this screen must not flag. The dedicated
 * `passport` pattern detector below supersedes it: it only fires on a real
 * document-number mention (a meaningful marker plus a digit-bearing token).
 */
const PERSONAL_DATA_TERMS = [
  "emirates id",
  "medical record",
  "patient",
  "patients",
  "diagnosis",
  "phone number",
  "home address",
  "salary",
  "personal data",
  "resident's name",
  "هوية",
  "جواز",
  "سجل طبي",
  "مريض",
  "تشخيص",
  "رقم الهاتف",
  "العنوان",
  "الراتب",
  "بيانات شخصية",
];

const HUMAN_LABEL: Record<PiiKind, string> = {
  emiratesId: "Emirates ID",
  phone: "phone number",
  email: "email address",
  iban: "bank account",
  passport: "passport number",
  dateOfBirth: "date of birth",
  name: "full name",
  keyword: "personal data",
};

/**
 * Title/entity words that, on their own, are not a person's name — used to
 * reject a name-detector capture whose words are ALL drawn from this set
 * (e.g. "Director General", "Federal Authority"). This is defense in depth:
 * narrowing the name detector's trigger phrases to only unambiguous
 * self-introductions already rules out the demonstrated false positives
 * (all of them followed a bare "I am" / "this is", now removed); this
 * stoplist additionally guards the case where "my name is" itself is
 * followed by a title rather than a name.
 *
 * Arabic equivalents are deliberately not included: the name-capture regex
 * only matches Latin-script words (`[A-Z][a-zA-Z']+`), so an Arabic title
 * word could never appear in a captured value regardless of a stoplist.
 */
const NAME_STOPLIST = new Set([
  "general",
  "chairman",
  "authority",
  "director",
  "minister",
  "federal",
  "ministry",
  "department",
  "secretary",
  "undersecretary",
  "excellency",
]);

function isAllStoplisted(value: string): boolean {
  const words = value.split(/\s+/).filter(Boolean);
  return words.length > 0 && words.every((word) => NAME_STOPLIST.has(word.toLowerCase()));
}

type Detector = {
  kind: PiiKind;
  regex: RegExp;
};

/**
 * Ordered list of detectors, each a regex plus a kind. Order matters: when
 * two detectors match overlapping spans, the earlier detector in this list
 * wins (see `screenForPii`).
 *
 * Boundaries throughout use a Unicode-aware lookaround (`\p{L}` / `\p{N}`,
 * with the `u` flag), not `\b` — JS's `\b` only recognises ASCII word
 * characters, so it silently fails to anchor next to Arabic script, which
 * would break the Arabic phrases used below. The digit-pattern detectors
 * (`emiratesId`, `phone`) additionally exclude a hyphen (and, for `phone`, a
 * period) from the same boundary: a structured reference number such as
 * "PO-0501234567-2026" or "REF-784198712345671" delimits its digit run with
 * a hyphen, not a letter or a digit, so a letter/digit-only boundary is not
 * enough to keep the pattern from matching inside it.
 */
const DETECTORS: Detector[] = [
  {
    // Emirates ID: 784 + 4-digit year + 7 digits + 1 check digit, with
    // optional dash/space separators between groups.
    kind: "emiratesId",
    regex: /(?<![\p{L}\p{N}-])784[-\s]?\d{4}[-\s]?\d{7}[-\s]?\d(?![\p{L}\p{N}-])/gdu,
  },
  {
    // UAE mobile number: requires a UAE prefix (+971, 00971, or a leading
    // 05) so a bare number like a budget figure can never match.
    kind: "phone",
    regex: /(?<![\p{L}\p{N}\-.])(?:\+971[-\s]?|00971[-\s]?|0)5\d(?:[-\s]?\d){7}(?![\p{L}\p{N}-])/gdu,
  },
  {
    kind: "email",
    regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gd,
  },
  {
    // AE IBAN: AE + 2 check digits + 3-digit bank code + 16-digit account.
    kind: "iban",
    regex: /\bAE\d{2}\d{3}\d{16}\b/gd,
  },
  {
    // Passport: a *meaningful* passport marker — "no."/"number", or a
    // colon/hash, never the bare word "passport" alone — immediately
    // followed by a 6-9 character alphanumeric token that contains at
    // least one digit. Both conditions are required: a document number
    // has digits in it, and "passport" alone is not a declaration that one
    // follows (see the false positives this used to produce: "before" in
    // "renew your passport before...", "control" in "Passport control...",
    // "office" in "...passport office hours...").
    kind: "passport",
    regex:
      /(?<![\p{L}\p{N}])(?:passport\s*(?:no\.?|number)|passport\s*[:#]|رقم\s*الجواز|جواز\s*السفر)\s*[:#]?\s*((?=[A-Z0-9]*\d)[A-Z0-9]{6,9})(?![\p{L}\p{N}])/gdiu,
  },
  {
    // Date of birth: a birth-related word near a date-like token.
    kind: "dateOfBirth",
    regex:
      /(?<![\p{L}\p{N}])(?:born|dob|date of birth|مواليد)(?![\p{L}\p{N}])[^.\n]{0,20}?\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2})\b/gdiu,
  },
  {
    // Name: anchored to an unambiguous self-introduction only — "my name
    // is" or "اسمي" — not any capitalised pair, and not a bare "I am" or
    // "this is" (dropped: those are far too common outside self-
    // introduction, e.g. "I am Director General for policy...", "This is
    // Federal Authority guidance...").
    kind: "name",
    regex: /(?<![\p{L}\p{N}])(?:[Mm]y name is|اسمي)\s+([A-Z][a-zA-Z']+(?:\s+[A-Z][a-zA-Z']+){1,2})/gdu,
  },
];

/** Match spans for the keyword list, one finding per occurrence. */
function keywordFindings(text: string): PiiFinding[] {
  const lower = text.toLowerCase();
  const findings: PiiFinding[] = [];
  for (const term of PERSONAL_DATA_TERMS) {
    let from = 0;
    for (;;) {
      const index = lower.indexOf(term, from);
      if (index === -1) break;
      findings.push({
        kind: "keyword",
        label: HUMAN_LABEL.keyword,
        match: text.slice(index, index + term.length),
        start: index,
        end: index + term.length,
      });
      from = index + term.length;
    }
  }
  return findings;
}

/** A regex exec result when the `d` (hasIndices) flag was set. */
type ExecWithIndices = RegExpExecArray & { indices?: Array<[number, number] | undefined> };

/** Every candidate finding from every detector, unsorted and possibly overlapping. */
function candidateFindings(text: string): PiiFinding[] {
  const findings: PiiFinding[] = [...keywordFindings(text)];

  for (const detector of DETECTORS) {
    const regex = new RegExp(detector.regex.source, detector.regex.flags);
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      const captured = match[1];
      // For detectors with a capture group (passport, dateOfBirth, name) the
      // finding covers only the captured value, not the introducing phrase
      // — that keeps the redaction focused on the sensitive part. The exact
      // offset comes from the `d` flag's `match.indices`, not a heuristic
      // `match[0].indexOf(captured)` — indexOf finds the *first* occurrence
      // of the captured text inside the full match, which is wrong if that
      // text repeats earlier in the match.
      const indices = (match as ExecWithIndices).indices;
      const capturedRange = captured ? indices?.[1] : undefined;
      const start = capturedRange ? capturedRange[0] : match.index;
      const value = captured ?? match[0];

      if (detector.kind === "name" && isAllStoplisted(value)) {
        if (match[0].length === 0) regex.lastIndex++;
        continue;
      }

      findings.push({
        kind: detector.kind,
        label: HUMAN_LABEL[detector.kind],
        match: value,
        start,
        end: start + value.length,
      });
      if (match[0].length === 0) regex.lastIndex++;
    }
  }

  return findings;
}

/**
 * Drop overlapping findings, keeping the one whose detector appears earlier
 * in DETECTORS (keyword findings are treated as coming first, since they
 * guard the original demo behaviour). Findings are otherwise ordered by
 * position in the text.
 */
function resolveOverlaps(findings: PiiFinding[]): PiiFinding[] {
  const priority: PiiKind[] = ["keyword", ...DETECTORS.map((d) => d.kind)];
  const kept: PiiFinding[] = [];

  // Walk detectors in priority order (not text position): a finding from an
  // earlier detector is locked in before a later detector's findings are
  // even considered, so the earlier one always wins an overlap.
  for (const kind of priority) {
    const group = findings.filter((f) => f.kind === kind).sort((a, b) => a.start - b.start);
    for (const finding of group) {
      const overlaps = kept.some((existing) => finding.start < existing.end && finding.end > existing.start);
      if (!overlaps) kept.push(finding);
    }
  }

  return kept.sort((a, b) => a.start - b.start);
}

function redact(text: string, findings: PiiFinding[]): string {
  let result = text;
  // Right-to-left so earlier offsets stay valid as later spans are replaced.
  const rightToLeft = [...findings].sort((a, b) => b.start - a.start);
  for (const finding of rightToLeft) {
    result = result.slice(0, finding.start) + `[${finding.label}]` + result.slice(finding.end);
  }
  return result;
}

export function screenForPii(text: string): PiiScreen {
  if (!text) {
    return { hit: false, findings: [], redacted: text };
  }

  const findings = resolveOverlaps(candidateFindings(text));

  return {
    hit: findings.length > 0,
    findings,
    redacted: redact(text, findings),
  };
}
