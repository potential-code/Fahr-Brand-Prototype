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
 * Several bare, single-concept terms were removed or narrowed after review
 * found they over-matched on ordinary UAE-government / FAHR-platform prose —
 * the same failure mode as the bare "passport" term below, just less
 * obvious because the terms are common words with an innocent everyday
 * sense as well as a personal-data one. Each note below names the specific
 * innocent phrase that used to trip the term, in the language it was found
 * in, and its counterpart was checked (and narrowed the same way, or left
 * as a deliberate judgement call) in the other language — this platform is
 * bilingual and the client is Arabic-speaking, so an inconsistency between
 * the two would be exactly as embarrassing on stage regardless of which
 * language the sentence happens to be in.
 *
 * - "passport" / "جواز" — removed entirely (English previously, Arabic
 *   here). "renew your passport"/"يرجى تجديد جواز السفر" both merely
 *   mention a passport, they do not disclose a number. The dedicated
 *   `passport` pattern detector supersedes both: it only fires on a real
 *   document-number mention (a meaningful marker plus a digit-bearing
 *   token), in either script.
 * - "patient" (bare) — narrowed to "patient's" (possessive only). A first
 *   attempt narrowed it to "the patient" / "a patient", but English also
 *   uses the *article* form adjectivally — "a patient approach to difficult
 *   conversations", "the patient support team" — so that narrowing was
 *   still catching ordinary, innocuous government-facing phrasing. The
 *   possessive "patient's" is not produced by the adjective sense at all
 *   ("a patient's approach" is not idiomatic English), so it keys on
 *   grammar that only the noun sense produces. "patients" (plural, no
 *   adjective form) was already safe and is unchanged. Arabic "مريض" was
 *   checked for the same ambiguity and has none: Arabic's adjective for
 *   "patient" (calm, even-tempered) is a different word entirely
 *   ("صبور"), not "مريض" — "مريض" only ever means sick/unwell/a patient,
 *   so it has no innocuous everyday reading to guard against and was left
 *   unchanged.
 * - "diagnosis" / "تشخيص" — both narrowed to "medical diagnosis" /
 *   "تشخيص طبي". Bare "diagnosis" is also ordinary organisational/technical
 *   language ("a diagnosis of service-delivery bottlenecks"), and its
 *   Arabic equivalent is standard Gulf strategic-planning terminology
 *   ("تشخيص مؤسسي" / "دراسة تشخيصية" — institutional diagnosis / diagnostic
 *   study) — arguably more entrenched in Arabic bureaucratic usage than in
 *   English, so both were narrowed rather than just the one a reviewer
 *   happened to test in English.
 * - "salary" / "الراتب" — narrowed to possessive-specific phrasing ("his
 *   salary", "her salary", "my salary", "your salary", "employee's salary"
 *   / "راتبه", "راتبها", "راتبي", "راتبك", "راتب الموظف"). FAHR is the
 *   Federal Authority for Government Human Resources — "salary structure
 *   reform" or "سياسة الراتب الأساسي" (basic salary policy) is core,
 *   non-personal policy subject matter, not a disclosure of any one
 *   person's pay.
 * - "هوية" (bare "identity") — narrowed to "رقم الهوية" (ID number) and
 *   "بطاقة الهوية" (ID card). Bare "هوية" is a substring of "الهوية
 *   البصرية" (visual identity/brand identity) and "الهوية المؤسسية"
 *   (corporate identity) — exactly the kind of brand terminology likely on
 *   a FAHR-branded platform. English never had an equivalent bare
 *   "identity" term (only the already-specific "emirates id"), so no
 *   English-side narrowing was needed here.
 * - "العنوان" (bare "address") — narrowed to "العنوان السكني" (residential
 *   address) and "عنوان المنزل" (home address). "العنوان" equally means
 *   "title"/"heading" in ordinary Arabic ("العنوان الرئيسي للتقرير" — the
 *   report's main heading) — a document-drafting assistant is exactly the
 *   context where that sense comes up. English "home address" is already
 *   specific to a residence and has no such homograph, so it was left
 *   unchanged.
 *
 * Note on "diagnosis": English "diagnosis" alone would have been a
 * defensible leave-it-be call on its own — but it is narrowed above anyway,
 * for parity with the Arabic fix, so an equivalent sentence produces the
 * same outcome in either language regardless of which one a reviewer
 * happened to test first.
 *
 * Judged fine as-is (considered, not changed): "personal data" /
 * "بيانات شخصية" is the generic name for the whole concept this screen
 * exists to catch and is intentionally broad on both sides — mirrored, not
 * asymmetric. "phone number" is the term the module's own motivating
 * example is built around (see the header comment) and is specific enough
 * that it has no plausible innocent reading. "emirates id", "medical
 * record", and "سجل طبي" are already two/three-word compounds with no
 * innocuous alternate sense.
 */
const PERSONAL_DATA_TERMS = [
  "emirates id",
  "medical record",
  "patient's",
  "patients",
  "medical diagnosis",
  "phone number",
  "home address",
  "his salary",
  "her salary",
  "my salary",
  "your salary",
  "employee's salary",
  "personal data",
  "resident's name",
  "رقم الهوية",
  "بطاقة الهوية",
  "سجل طبي",
  "مريض",
  "تشخيص طبي",
  "رقم الهاتف",
  "العنوان السكني",
  "عنوان المنزل",
  "راتبه",
  "راتبها",
  "راتبي",
  "راتبك",
  "راتب الموظف",
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
 */
const NAME_STOPLIST_EN = new Set([
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

/**
 * The Arabic equivalent of NAME_STOPLIST_EN, for the same defense-in-depth
 * reason: "اسمي مدير عام الهيئة الاتحادية" ("my name is Director General of
 * the Federal Authority") should not be captured as a name just because it
 * follows the unambiguous "اسمي" trigger.
 */
const NAME_STOPLIST_AR = new Set([
  "وزارة", // ministry
  "هيئة", // authority
  "مدير", // director
  "رئيس", // chairman / president / head
  "معالي", // Excellency (honorific)
  "سعادة", // Excellency / Your Excellency (honorific)
  "دائرة", // department
  "وزير", // minister
  "نائب", // deputy
  "عام", // general (as in "مدير عام" -- director general)
  "أمين", // secretary (as in "أمين عام" -- secretary general)
  "اتحادي",
  "اتحادية", // federal (masc./fem.)
  "قسم", // department (alternate word)
]);

/** Arabic attaches its definite article directly to the noun (no space). */
function stripArabicDefiniteArticle(word: string): string {
  return word.startsWith("ال") && word.length > 2 ? word.slice(2) : word;
}

function isAllStoplisted(value: string): boolean {
  const words = value.split(/\s+/).filter(Boolean);
  if (words.length === 0) return false;
  if (/\p{Script=Arabic}/u.test(value)) {
    return words.every((word) => NAME_STOPLIST_AR.has(stripArabicDefiniteArticle(word)));
  }
  return words.every((word) => NAME_STOPLIST_EN.has(word.toLowerCase()));
}

/**
 * Closed-class Arabic words that commonly continue a sentence right after a
 * name ("و" prefixed onto the next word, "أنا", a preposition, ...). Arabic
 * has no letter case, so unlike the Latin name capture (bounded by
 * capitalisation), a greedy word-count capture has nothing structural to
 * stop it from sweeping the next clause's opening word in as if it were
 * part of the name. trimArabicNameCapture peels off a trailing word drawn
 * from this set, so a captured span never extends past the real name into
 * "...الشامسي وأنا أعمل" territory.
 */
const ARABIC_NAME_CONTINUATION_WORDS = new Set([
  "و",
  "وأنا",
  "وأنت",
  "وهو",
  "وهي",
  "أنا",
  "نحن",
  "هو",
  "هي",
  "هذا",
  "هذه",
  "ذلك",
  "من",
  "في",
  "على",
  "عن",
  "إلى",
  "مع",
  "ثم",
  "لكن",
  "أو",
]);

/**
 * Trim a trailing continuation word from a captured Arabic name, never
 * shrinking below 2 words (the minimum a real name capture requires). Kept
 * separate from isAllStoplisted: that function rejects a title-only
 * capture outright, this one repairs a genuine name capture that over-ran
 * into the next clause.
 */
function trimArabicNameCapture(value: string): string {
  let result = value;
  for (;;) {
    const match = /^(.*?)(\s+)(\p{Script=Arabic}+)$/su.exec(result);
    if (!match) break;
    const [, head, , lastWord] = match;
    const headWordCount = head.trim().split(/\s+/).filter(Boolean).length;
    if (headWordCount < 2 || !ARABIC_NAME_CONTINUATION_WORDS.has(lastWord)) break;
    result = head;
  }
  return result;
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
    // Name (Latin script): anchored to an unambiguous self-introduction
    // only — "my name is" — not any capitalised pair, and not a bare "I
    // am" or "this is" (dropped: those are far too common outside
    // self-introduction, e.g. "I am Director General for policy...",
    // "This is Federal Authority guidance..."). Capitalisation is what
    // bounds the capture to 2-3 words: a following lowercase word (e.g.
    // "and I work...") cannot extend the match.
    kind: "name",
    regex: /(?<![\p{L}\p{N}])[Mm]y name is\s+([A-Z][a-zA-Z']+(?:\s+[A-Z][a-zA-Z']+){1,2})/gdu,
  },
  {
    // Name (Arabic script): a separate detector, not a second alternative
    // squeezed into the Latin regex above. The Latin capture group
    // ([A-Z][a-zA-Z']+) is Latin-script only, so "اسمي أحمد الشامسي" — a
    // realistic, monolingual Arabic self-introduction — could never be
    // captured by it; every "Arabic" case that regex could pass was
    // actually a code-mixed sentence pairing the Arabic trigger with a
    // Latin-script name. Arabic has no letter case, so the trigger phrase
    // and the script class (\p{Script=Arabic}) are what anchor this
    // detector instead of capitalisation; trimArabicNameCapture (below,
    // applied in candidateFindings) then repairs the over-capture that
    // capitalisation would otherwise have prevented.
    kind: "name",
    regex: /(?<![\p{L}\p{N}])اسمي\s+(\p{Script=Arabic}+(?:\s+\p{Script=Arabic}+){1,2})/gdu,
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
      let value = captured ?? match[0];

      // The Arabic name detector's greedy word-count capture has nothing
      // structural (no capitalisation) stopping it from sweeping a
      // continuation word from the next clause into the match — trim it
      // back to the real name before anything else looks at `value`.
      if (detector.kind === "name" && /\p{Script=Arabic}/u.test(value)) {
        value = trimArabicNameCapture(value);
      }

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
