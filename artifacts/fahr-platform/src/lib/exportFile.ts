// Real exports for the admin consoles.
//
// The demo has no backend, so an export has to be produced in the browser: a
// CSV the stakeholder actually receives as a file, or a print view they can
// save as PDF. Every "Export" control in the platform writes an actual file or
// opens a print-ready document — no toast standing in for a download. CSV is
// generated from the same rows the table renders, so an export can never
// disagree with the screen it came from.

export type CsvValue = string | number | boolean | null | undefined;

export type CsvRow = CsvValue[];

/** A row as the report screens build them. */
export type ExportRow = (string | number)[];

/**
 * One table in an export. `title` and `notes` are written above the rows, which
 * is how a report records the filters it was run with.
 */
export type ExportSheet = {
  /** Base name without the extension; a date stamp is appended. */
  filename: string;
  title?: string;
  headers: string[];
  rows: CsvRow[];
  /** Lines written above the table, e.g. filters the report was run with. */
  notes?: string[];
};

/** Kept for call sites that only ever export a flat table. */
export type CsvExport = ExportSheet;

/** Escapes one cell for CSV: quotes wrap anything containing a separator. */
function csvCell(value: CsvValue): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(headers: string[], rows: CsvRow[]): string {
  return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}

/** A sheet as CSV, with its title and notes as leading lines when present. */
export function sheetToCsv(sheet: ExportSheet): string {
  const lines: string[] = [];
  if (sheet.title) lines.push(csvCell(sheet.title));
  for (const note of sheet.notes ?? []) lines.push(csvCell(note));
  if (lines.length > 0) lines.push("");
  lines.push(toCsv(sheet.headers, sheet.rows));
  return lines.join("\r\n");
}

/** Slug-safe filename with a date stamp, e.g. `fahr-audit-log-2026-07-28.csv`. */
export function stampedFilename(base: string, extension: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${slug}-${date}.${extension}`;
}

/** Triggers a browser download of `contents`. Returns the filename written. */
export function downloadTextFile(filename: string, contents: string, mimeType: string): string {
  if (typeof document === "undefined") return filename;
  // The BOM keeps Arabic entity names and AED figures readable in Excel.
  const blob = new Blob([`\uFEFF${contents}`], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Revoked on the next tick so Safari has time to start the download.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return filename;
}

/** Writes a CSV file from the rows a table is showing. Returns the filename. */
export function downloadCsv(sheet: ExportSheet): string {
  const name = stampedFilename(sheet.filename, "csv");
  downloadTextFile(name, sheetToCsv(sheet), "text/csv");
  return name;
}

/**
 * Downloads several tables as one CSV, each under its own heading — the shape a
 * reporting pack takes when it has to travel as a single attachment.
 */
export function downloadCsvPack(filename: string, sheets: ExportSheet[], title?: string): string {
  const name = stampedFilename(filename, "csv");
  const body = sheets.map(sheetToCsv).join("\r\n\r\n");
  downloadTextFile(name, title ? `${csvCell(title)}\r\n\r\n${body}` : body, "text/csv");
  return name;
}

export type PrintTable = {
  headers: string[];
  rows: CsvRow[];
  /** Columns rendered right-aligned, by index. */
  numericColumns?: number[];
};

export type PrintSection = {
  heading?: string;
  /** Short lines of prose above the table. */
  paragraphs?: string[];
  /** Label/value pairs rendered as a summary grid. */
  facts?: { label: string; value: string }[];
  table?: PrintTable;
};

export type PrintDocument = {
  title: string;
  subtitle?: string;
  /** Context printed under the title, e.g. filters in force. */
  meta?: string[];
  sections: PrintSection[];
  footnote?: string;
};

/** The sheet-shaped request the report screens send to `printReport`. */
export type PrintSheets = {
  title: string;
  subtitle?: string;
  notes?: string[];
  sheets: ExportSheet[];
};

const escapeHtml = (value: CsvValue): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

function printStyles(): string {
  return `
    @page { size: A4; margin: 16mm 14mm; }
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
      color: #1a1a1a;
      margin: 0;
      font-size: 11pt;
      line-height: 1.45;
    }
    header { border-bottom: 2px solid #9c8034; padding-bottom: 10px; margin-bottom: 18px; }
    .brand { font-size: 9pt; letter-spacing: .16em; text-transform: uppercase; color: #9c8034; }
    h1 { font-size: 19pt; margin: 6px 0 2px; }
    .subtitle { color: #444; margin: 0; font-size: 11pt; }
    .meta { margin: 8px 0 0; padding: 0; list-style: none; color: #555; font-size: 9.5pt; }
    .meta li { display: inline-block; margin-right: 14px; }
    section { margin-bottom: 20px; page-break-inside: avoid; }
    h2 { font-size: 12.5pt; margin: 0 0 6px; color: #0f2f4b; }
    p { margin: 0 0 6px; }
    .facts { display: flex; flex-wrap: wrap; gap: 10px; margin: 0 0 10px; }
    .fact { border: 1px solid #ddd; border-radius: 5px; padding: 6px 10px; min-width: 120px; }
    .fact .label { display: block; font-size: 8.5pt; text-transform: uppercase; letter-spacing: .06em; color: #666; }
    .fact .value { font-size: 13pt; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
    th, td { border-bottom: 1px solid #e2e2e2; padding: 5px 6px; text-align: left; vertical-align: top; }
    th { background: #f6f3ea; font-size: 8.5pt; text-transform: uppercase; letter-spacing: .05em; color: #4a4a4a; }
    td.num, th.num { text-align: right; white-space: nowrap; }
    footer { margin-top: 22px; border-top: 1px solid #ddd; padding-top: 8px; color: #666; font-size: 8.5pt; }
  `;
}

function sectionHtml(section: PrintSection): string {
  const numeric = new Set(section.table?.numericColumns ?? []);
  const table = section.table
    ? `<table><thead><tr>${section.table.headers
        .map((h, i) => `<th${numeric.has(i) ? ' class="num"' : ""}>${escapeHtml(h)}</th>`)
        .join("")}</tr></thead><tbody>${section.table.rows
        .map(
          (row) =>
            `<tr>${row
              .map((cell, i) => `<td${numeric.has(i) ? ' class="num"' : ""}>${escapeHtml(cell)}</td>`)
              .join("")}</tr>`,
        )
        .join("")}</tbody></table>`
    : "";
  const facts = section.facts?.length
    ? `<div class="facts">${section.facts
        .map(
          (f) =>
            `<div class="fact"><span class="label">${escapeHtml(f.label)}</span><span class="value">${escapeHtml(
              f.value,
            )}</span></div>`,
        )
        .join("")}</div>`
    : "";
  return `<section>${section.heading ? `<h2>${escapeHtml(section.heading)}</h2>` : ""}${(section.paragraphs ?? [])
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join("")}${facts}${table}</section>`;
}

export function printDocumentHtml(doc: PrintDocument): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8" /><title>${escapeHtml(
    doc.title,
  )}</title><style>${printStyles()}</style></head><body><header><p class="brand">FAHR — Federal Authority for Government Human Resources</p><h1>${escapeHtml(
    doc.title,
  )}</h1>${doc.subtitle ? `<p class="subtitle">${escapeHtml(doc.subtitle)}</p>` : ""}${
    doc.meta?.length
      ? `<ul class="meta">${doc.meta.map((m) => `<li>${escapeHtml(m)}</li>`).join("")}</ul>`
      : ""
  }</header>${doc.sections.map(sectionHtml).join("")}${
    doc.footnote ? `<footer>${escapeHtml(doc.footnote)}</footer>` : ""
  }</body></html>`;
}

/** A pack of sheets printed as one document, each sheet its own section. */
function documentFromSheets(request: PrintSheets): PrintDocument {
  return {
    title: request.title,
    subtitle: request.subtitle,
    meta: request.notes,
    sections: request.sheets.map((sheet) => ({
      heading: sheet.title,
      paragraphs: sheet.notes,
      table: { headers: sheet.headers, rows: sheet.rows },
    })),
  };
}

/**
 * Opens a print-ready version of a report in a hidden iframe and calls print,
 * so the operator can send it to a printer or save it as PDF. An iframe rather
 * than a new window: a popup blocker would silently swallow the export.
 *
 * Accepts either a composed document or a pack of report sheets.
 */
export function printReport(input: PrintDocument | PrintSheets): void {
  if (typeof document === "undefined") return;
  const doc = "sheets" in input ? documentFromSheets(input) : input;
  const frame = document.createElement("iframe");
  frame.setAttribute("title", doc.title);
  frame.setAttribute("aria-hidden", "true");
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  document.body.appendChild(frame);

  const remove = () => {
    if (frame.parentNode) frame.parentNode.removeChild(frame);
  };

  frame.onload = () => {
    try {
      const win = frame.contentWindow;
      if (!win || typeof win.print !== "function") {
        remove();
        return;
      }
      win.focus();
      win.print();
    } finally {
      window.setTimeout(remove, 1500);
    }
  };

  frame.srcdoc = printDocumentHtml(doc);
}
