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
// a government audience, and a screen that flags a budget figure or a
// ministry's name is a worse look than one that misses an edge case. Each
// detector is therefore deliberately narrow — the name rule, in particular,
// only fires after an introducing phrase ("my name is", "i am", "اسمي"),
// never on any capitalised pair.

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

/** Words that mean the question is reaching for someone's personal data. */
const PERSONAL_DATA_TERMS = [
  "emirates id",
  "passport",
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

type Detector = {
  kind: PiiKind;
  regex: RegExp;
};

/**
 * Ordered list of detectors, each a regex plus a kind. Order matters: when
 * two detectors match overlapping spans, the earlier detector in this list
 * wins (see `screenForPii`).
 */
const DETECTORS: Detector[] = [
  {
    // Emirates ID: 784 + 4-digit year + 7 digits + 1 check digit, with
    // optional dash/space separators between groups.
    kind: "emiratesId",
    regex: /784[-\s]?\d{4}[-\s]?\d{7}[-\s]?\d/g,
  },
  {
    // UAE mobile number: requires a UAE prefix (+971, 00971, or a leading
    // 05) so a bare number like a budget figure can never match.
    kind: "phone",
    regex: /(?:\+971[-\s]?|00971[-\s]?|(?<![\d.])0)5\d(?:[-\s]?\d){7}/g,
  },
  {
    kind: "email",
    regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  },
  {
    // AE IBAN: AE + 2 check digits + 3-digit bank code + 16-digit account.
    kind: "iban",
    regex: /\bAE\d{2}\d{3}\d{16}\b/g,
  },
  {
    // Passport: a passport-related word immediately followed by a
    // 6-9 character alphanumeric document number. Boundaries use a
    // Unicode-aware lookaround (not `\b`) because JS's `\b` only recognises
    // ASCII word characters — it silently fails to anchor next to Arabic
    // script, which would break the Arabic phrase below.
    kind: "passport",
    regex:
      /(?<![\p{L}\p{N}])(?:passport(?:\s*(?:no\.?|number))?|رقم\s*الجواز|جواز\s*السفر)\s*[:#]?\s*([A-Z0-9]{6,9})(?![\p{L}\p{N}])/giu,
  },
  {
    // Date of birth: a birth-related word near a date-like token.
    kind: "dateOfBirth",
    regex:
      /(?<![\p{L}\p{N}])(?:born|dob|date of birth|مواليد)(?![\p{L}\p{N}])[^.\n]{0,20}?\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2})\b/giu,
  },
  {
    // Name: anchored to an introducing phrase, not any capitalised pair —
    // otherwise "Ministry of Health and Prevention" would trip it.
    kind: "name",
    regex:
      /(?<![\p{L}\p{N}])(?:[Mm]y name is|[Ii] am|[Tt]his is|اسمي)\s+([A-Z][a-zA-Z']+(?:\s+[A-Z][a-zA-Z']+){1,2})/gu,
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

/** Every candidate finding from every detector, unsorted and possibly overlapping. */
function candidateFindings(text: string): PiiFinding[] {
  const findings: PiiFinding[] = [...keywordFindings(text)];

  for (const detector of DETECTORS) {
    const regex = new RegExp(detector.regex.source, detector.regex.flags);
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      // For detectors with a capture group (passport, dateOfBirth, name) the
      // finding covers only the captured value, not the introducing phrase —
      // that keeps the redaction focused on the sensitive part.
      const captured = match[1];
      const start = captured ? match[0].indexOf(captured) + match.index : match.index;
      const value = captured ?? match[0];
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
