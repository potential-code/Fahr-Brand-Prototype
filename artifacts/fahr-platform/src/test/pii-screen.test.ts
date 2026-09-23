// The twin's headline governance claim is that personal data never reaches the
// model. A screen that misses a plain phone number cannot support that claim —
// and one that flags a budget figure is worse than useless in a demo.
import { describe, it, expect } from "vitest";
import { screenForPii } from "@/lib/piiScreen";

describe("screenForPii catches personal data", () => {
  it("catches a UAE mobile number in any common format", () => {
    for (const number of ["0501234567", "+971 50 123 4567", "00971501234567", "050 123 4567"]) {
      const screen = screenForPii(`Call me on ${number} tomorrow`);
      expect(screen.hit, number).toBe(true);
      expect(screen.findings.some((f) => f.kind === "phone"), number).toBe(true);
    }
  });

  it("catches an Emirates ID with or without separators", () => {
    expect(screenForPii("784-1987-1234567-1").hit).toBe(true);
    expect(screenForPii("784198712345671").hit).toBe(true);
  });

  it("catches an email address and an AE IBAN", () => {
    expect(screenForPii("write to aisha.almansoori@fahr.gov.ae").findings[0].kind).toBe("email");
    expect(screenForPii("AE070331234567890123456").findings[0].kind).toBe("iban");
  });

  it("catches a name only when the sentence introduces one", () => {
    const introduced = screenForPii("My name is Aisha Al Mansoori and I work in communications");
    expect(introduced.findings.some((f) => f.kind === "name")).toBe(true);
  });

  it("keeps the existing keyword list working", () => {
    expect(screenForPii("summarise this patient's medical record").hit).toBe(true);
  });

  it("redacts every finding by label", () => {
    const screen = screenForPii("My name is Aisha Al Mansoori, call 0501234567");
    expect(screen.redacted).toContain("[full name]");
    expect(screen.redacted).toContain("[phone number]");
    expect(screen.redacted).not.toContain("0501234567");
    expect(screen.redacted).not.toContain("Aisha");
  });
});

describe("screenForPii does not cry wolf", () => {
  it("a budget figure is not a phone number", () => {
    expect(screenForPii("The campaign budget was 4500000 dirhams").hit).toBe(false);
  });

  it("an entity name is not a person", () => {
    expect(screenForPii("Draft a note for the Ministry of Health and Prevention").hit).toBe(false);
  });

  it("a year is not a date of birth", () => {
    expect(screenForPii("Our 2026 plan is ready").hit).toBe(false);
  });

  it("an empty prompt is clean", () => {
    const screen = screenForPii("");
    expect(screen.hit).toBe(false);
    expect(screen.findings).toEqual([]);
    expect(screen.redacted).toBe("");
  });
});

// Regression cases from code review: realistic UAE-government phrasing that
// the original detectors over-matched on. Each of these previously flagged
// ordinary prose as personal data — unacceptable in front of a government
// audience where passports and ministries are core, everyday subject matter.
describe("screenForPii does not flag realistic government phrasing", () => {
  it("mentioning a passport without a document number is not personal data", () => {
    expect(screenForPii("Please renew your passport before the trip ends").hit).toBe(false);
    expect(screenForPii("Passport control at the airport was slow today").hit).toBe(false);
    expect(screenForPii("Draft a note about passport office hours next week").hit).toBe(false);
  });

  it("a job title or the client's own organisation is not a person's name", () => {
    expect(screenForPii("I am Director General for policy at the Ministry").hit).toBe(false);
    expect(screenForPii("This is Federal Authority guidance on remote work").hit).toBe(false);
    expect(screenForPii("I am Deputy Chairman of the committee").hit).toBe(false);
  });

  it("a structured reference number is not a phone number or an Emirates ID", () => {
    expect(screenForPii("PO-0501234567-2026 was approved yesterday").hit).toBe(false);
    expect(screenForPii("Order reference 927841987123456713 confirmed").hit).toBe(false);
  });

  it("still catches a real passport number", () => {
    const screen = screenForPii("Please note passport number: A1234567 was issued last year");
    expect(screen.hit).toBe(true);
    expect(screen.findings.some((f) => f.kind === "passport")).toBe(true);
  });

  it("still catches a real self-introduction, including the one-click demo prompt", () => {
    const demo = screenForPii(
      "My name is Aisha Al Mansoori, my mobile is 0501234567 — draft a reply from me.",
    );
    expect(demo.hit).toBe(true);
    expect(demo.findings.some((f) => f.kind === "name")).toBe(true);
    expect(demo.findings.some((f) => f.kind === "phone")).toBe(true);
  });
});

// Regression cases from a second review round: the English keyword list had
// its worst offender ("passport") removed, but the Arabic half of the list
// was never scrutinised, and several other English terms were common nouns
// with an innocent everyday sense as well as a personal-data one. This
// platform is bilingual and the client is Arabic-speaking, so an
// inconsistency between the two languages is exactly as embarrassing on
// stage regardless of which language the sentence happens to be in.
describe("screenForPii treats English and Arabic keywords with the same scrutiny", () => {
  it("mentioning a passport is not personal data, in either language (parity)", () => {
    const en = screenForPii("Please renew your passport before the trip ends").hit;
    const ar = screenForPii("يرجى تجديد جواز السفر قبل انتهاء الرحلة").hit;
    expect(ar).toBe(en);
    expect(ar).toBe(false);
  });

  it("brand/visual identity is not a person's ID (Arabic)", () => {
    expect(screenForPii("راجع إرشادات الهوية البصرية للمنصة").hit).toBe(false);
  });

  it("still catches a real Emirates ID reference by number, in Arabic", () => {
    expect(screenForPii("يرجى تحديث رقم الهوية في النظام").hit).toBe(true);
    expect(screenForPii("أرسل صورة بطاقة الهوية الخاصة به").hit).toBe(true);
  });

  it("a document title/heading is not a home address (Arabic 'العنوان' also means 'title')", () => {
    expect(screenForPii("راجع العنوان الرئيسي للتقرير").hit).toBe(false);
  });

  it("still catches a real residential address, in Arabic", () => {
    expect(screenForPii("سجل العنوان السكني في النظام").hit).toBe(true);
    expect(screenForPii("أرسل عنوان المنزل بالكامل").hit).toBe(true);
  });

  it("salary policy discussion is not one person's pay, in either language", () => {
    expect(screenForPii("Draft a note about salary review timelines for next year").hit).toBe(false);
    expect(screenForPii("راجع سياسة الراتب الأساسي للموظفين").hit).toBe(false);
  });

  it("still catches one specific person's salary, in either language", () => {
    expect(screenForPii("His salary was delayed this month").hit).toBe(true);
    expect(screenForPii("تم تأخير راتبه هذا الشهر").hit).toBe(true);
  });

  it("an organisational diagnosis is not a medical one, in either language", () => {
    expect(screenForPii("Run a diagnosis of the service delivery bottlenecks").hit).toBe(false);
    expect(screenForPii("قدم تشخيصًا مؤسسيًا لأداء الخدمة").hit).toBe(false);
  });

  it("still catches a real medical diagnosis, in either language", () => {
    expect(screenForPii("The medical diagnosis was shared with the family").hit).toBe(true);
    expect(screenForPii("تم تسجيل تشخيص طبي للمريض").hit).toBe(true);
  });

  it("being asked to wait patiently is not a medical patient (English 'patient' is also an adjective)", () => {
    expect(
      screenForPii("Please be patient while we process this, and thank you for your patience").hit,
    ).toBe(false);
  });

  it("still catches a real reference to a patient (possessive, or plural)", () => {
    expect(screenForPii("The patient's file was updated this morning").hit).toBe(true);
    expect(screenForPii("The patients were transferred to another ward").hit).toBe(true);
  });
});

// Regression cases from a third review round.
//
// Finding 6: narrowing bare "patient" to "the patient" / "a patient" (round
// 2) was aimed at the adjective sense ("please be patient"), but English
// uses the *article* form adjectivally too — "a patient approach", "the
// patient support team". Re-narrowed to the possessive "patient's", which
// the adjective sense cannot produce.
//
// Finding 7: the name detector's Latin-only capture group meant no
// realistic, monolingual Arabic self-introduction could ever be caught —
// every prior "Arabic" test paired the Arabic trigger with a Latin-script
// name (a code-mixed sentence). Split into a separate Arabic-script
// detector with its own stoplist and over-capture guard.
describe("screenForPii's narrowing does not go too far, round 3", () => {
  it("a patient/calm demeanour is not a medical patient, even with an article", () => {
    expect(screenForPii("He always takes a patient approach to difficult conversations").hit).toBe(
      false,
    );
    expect(
      screenForPii("Thank you for being so understanding — the patient support team appreciates it")
        .hit,
    ).toBe(false);
  });

  it("still catches a patient's record by the possessive, and patients by the plural", () => {
    expect(screenForPii("The patient's file was updated this morning").hit).toBe(true);
    expect(screenForPii("The patients were transferred to another ward").hit).toBe(true);
  });

  it("catches a real, monolingual Arabic self-introduction", () => {
    const screen = screenForPii("اسمي أحمد الشامسي");
    expect(screen.hit).toBe(true);
    expect(
      screen.findings.some((f) => f.kind === "name" && f.match === "أحمد الشامسي"),
    ).toBe(true);
  });

  it("does not let the Arabic name capture run on into the next clause", () => {
    const screen = screenForPii("اسمي أحمد الشامسي وأنا أعمل في الاتصالات");
    const nameFinding = screen.findings.find((f) => f.kind === "name");
    expect(nameFinding?.match).toBe("أحمد الشامسي");
    expect(screen.redacted).toContain("[full name]");
    expect(screen.redacted).not.toContain("أحمد");
    expect(screen.redacted).not.toContain("الشامسي");
  });

  it("rejects an all-title Arabic capture after the self-introduction trigger", () => {
    expect(screenForPii("اسمي مدير عام الهيئة").hit).toBe(false);
  });

  it("does not fire on an entity/title sentence that never declares a name", () => {
    expect(screenForPii("هذه إرشادات وزارة الصحة والوقاية").hit).toBe(false);
  });

  it("existing Latin self-introduction behaviour is unchanged", () => {
    const screen = screenForPii("My name is Aisha Al Mansoori and I work in communications");
    expect(screen.hit).toBe(true);
    expect(
      screen.findings.some((f) => f.kind === "name" && f.match === "Aisha Al Mansoori"),
    ).toBe(true);
  });

  it("English and Arabic self-introductions produce the same hit (parity)", () => {
    const en = screenForPii("My name is Ahmed Al Shamsi and I work in communications").hit;
    const ar = screenForPii("اسمي أحمد الشامسي وأنا أعمل في الاتصالات").hit;
    expect(ar).toBe(en);
    expect(ar).toBe(true);
  });
});

// Regression cases from a fourth review round — both are *span* defects in
// the Arabic name detector, so every case asserts on the captured `match`,
// not merely on `hit`.
//
// Defect 1: rejecting a capture only when *every* word was a title let any
// realistic introduction-by-title through, because such phrases always
// contain an ordinary noun ("الموارد", "السياسات"). FAHR officials introduce
// themselves by title routinely, so redacting the title on stage is the same
// live failure the English "This is Federal Authority guidance" bug was.
//
// Defect 2: Arabic prefixes the conjunction و directly onto the next word
// with no space, and those forms were absent from the continuation-word set,
// so the capture swallowed the next clause's first word into the redacted
// span.
describe("the Arabic name detector captures the name and only the name", () => {
  it("an introduction by job title is not a name", () => {
    for (const phrase of [
      "اسمي مدير الموارد البشرية",
      "اسمي مستشار السياسات",
      "اسمي مدير الاتصال الحكومي",
    ]) {
      const screen = screenForPii(phrase);
      expect(
        screen.findings.filter((f) => f.kind === "name"),
        phrase,
      ).toEqual([]);
      expect(screen.hit, phrase).toBe(false);
    }
  });

  it("rejects the title whichever way the first word is written (definite article or not)", () => {
    expect(screenForPii("اسمي المدير التنفيذي للهيئة").hit).toBe(false);
    expect(screenForPii("اسمي رئيس قسم التدريب").hit).toBe(false);
  });

  it("does not swallow a و-prefixed continuation into the captured name", () => {
    const working = screenForPii("اسمي أحمد الشامسي وأعمل في الاتصالات");
    expect(working.findings.find((f) => f.kind === "name")?.match).toBe("أحمد الشامسي");
    expect(working.redacted).toBe("اسمي [full name] وأعمل في الاتصالات");

    const employed = screenForPii("اسمي أحمد الشامسي وموظف في الوزارة");
    expect(employed.findings.find((f) => f.kind === "name")?.match).toBe("أحمد الشامسي");
    expect(employed.redacted).toBe("اسمي [full name] وموظف في الوزارة");
  });

  it("still catches a genuine self-introduction, two words or three, with the exact span", () => {
    const two = screenForPii("اسمي أحمد الشامسي");
    expect(two.hit).toBe(true);
    expect(two.findings.find((f) => f.kind === "name")?.match).toBe("أحمد الشامسي");

    // The capture regex caps the raw match at three words, so a genuine
    // three-word name fills it completely and the و-trim never fires on it.
    const three = screenForPii("اسمي أحمد محمد الشامسي");
    expect(three.hit).toBe(true);
    const threeName = three.findings.find((f) => f.kind === "name");
    expect(threeName?.match).toBe("أحمد محمد الشامسي");
    expect(three.redacted).toBe("اسمي [full name]");

    // ... and the same three-word name followed directly by a continuation
    // word is still captured in full, not clipped back to two words.
    const followed = screenForPii("اسمي أحمد محمد الشامسي وأنا أعمل");
    expect(followed.findings.find((f) => f.kind === "name")?.match).toBe("أحمد محمد الشامسي");
  });

  it("keeps a real و-initial given name rather than trimming it as a conjunction", () => {
    const screen = screenForPii("اسمي محمد وليد");
    expect(screen.findings.find((f) => f.kind === "name")?.match).toBe("محمد وليد");
  });
});

// Regression cases carried over from a prior task's review round, verified
// empirically before being handed off.
//
// P1: an honorific-led introduction ("اسمي الدكتور أحمد الشامسي") does carry
// a real name, and was being rejected wholesale along with true
// introductions-by-title. Stripping at most one leading honorific before
// the existing first-word role test fixes this without reopening the
// title defect, because a role word (never an honorific) is never
// stripped.
//
// P2: the role list was enumeration-bounded and missing compound-title
// openers ("كبير", "قائم") that a FAHR official could plausibly open a
// self-introduction with on stage.
describe("Arabic honorific-led names and compound job titles", () => {
  it("catches a real name behind an honorific, span excludes the honorific", () => {
    const doctor = screenForPii("اسمي الدكتور أحمد الشامسي");
    expect(doctor.hit).toBe(true);
    expect(doctor.findings.find((f) => f.kind === "name")?.match).toBe("أحمد الشامسي");
    // The honorific itself is not personal data, so it stays in the
    // redacted text — only the name span is replaced.
    expect(doctor.redacted).toBe("اسمي الدكتور [full name]");

    const excellency = screenForPii("اسمي معالي أحمد الشامسي");
    expect(excellency.hit).toBe(true);
    expect(excellency.findings.find((f) => f.kind === "name")?.match).toBe("أحمد الشامسي");
    expect(excellency.redacted).toBe("اسمي معالي [full name]");
  });

  it("still rejects an introduction by job title (no honorific involved)", () => {
    for (const phrase of [
      "اسمي مدير الموارد البشرية",
      "اسمي مستشار السياسات",
      "اسمي مدير الاتصال الحكومي",
    ]) {
      const screen = screenForPii(phrase);
      expect(screen.findings.filter((f) => f.kind === "name"), phrase).toEqual([]);
      expect(screen.hit, phrase).toBe(false);
    }
  });

  it("rejects compound job titles that open with a chief/acting word", () => {
    for (const phrase of [
      "اسمي كبير المستشارين",
      "اسمي كبير الخبراء",
      "اسمي قائم بأعمال المدير",
      "اسمي كبير موظفي التقنية",
    ]) {
      const screen = screenForPii(phrase);
      expect(screen.findings.filter((f) => f.kind === "name"), phrase).toEqual([]);
      expect(screen.hit, phrase).toBe(false);
    }
  });
});
