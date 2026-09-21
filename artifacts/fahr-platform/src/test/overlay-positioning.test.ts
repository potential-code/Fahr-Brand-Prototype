// Overlay primitives position themselves in the viewport with `fixed`.
//
// `cn` runs class lists through tailwind-merge, which treats position as one
// group and keeps the last value. So a caller passing `relative` silently
// replaces the primitive's `fixed`, and the panel is laid out in the document
// instead of the viewport: scroll the page behind it and the content renders
// off-screen while the fixed backdrop still covers everything. The symptom is
// a dialog that opens as nothing but a dark overlay, which is easy to misread
// as a rendering bug rather than a class conflict.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

const SRC = join(__dirname, "..");

/** Radix primitives that portal out and position themselves. */
const PORTALLED = [
  "DialogContent",
  "SheetContent",
  "AlertDialogContent",
  "DrawerContent",
  "PopoverContent",
  "DropdownMenuContent",
  "SelectContent",
  "TooltipContent",
  "HoverCardContent",
];

const POSITION = /\b(relative|absolute|static|sticky)\b/;

function tsxFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      // The primitives themselves are allowed to set their own position.
      return entry === "ui" ? [] : tsxFiles(path);
    }
    return path.endsWith(".tsx") ? [path] : [];
  });
}

describe("overlay positioning", () => {
  it("tailwind-merge really does drop the primitive's `fixed`", () => {
    // Pinning the behaviour the rule below exists to protect against.
    expect(cn("fixed left-[50%] top-[50%]", "relative")).not.toContain("fixed");
    expect(cn("fixed left-[50%] top-[50%]", "max-h-[88vh]")).toContain("fixed");
  });

  it("no screen overrides the position of a portalled overlay", () => {
    const offenders: string[] = [];

    for (const file of tsxFiles(SRC)) {
      const source = readFileSync(file, "utf8");

      for (const component of PORTALLED) {
        const opening = new RegExp(`<${component}\\b((?:[^>]|\\n)*?)>`, "g");
        for (const match of source.matchAll(opening)) {
          const className = /className=(?:"([^"]*)"|\{`([^`]*)`\})/.exec(match[1]);
          if (!className) continue;

          const value = className[1] ?? className[2] ?? "";
          const conflict = POSITION.exec(value);
          if (conflict) {
            const line = source.slice(0, match.index).split("\n").length;
            offenders.push(
              `${file.replace(SRC, "src")}:${line} <${component}> passes "${conflict[1]}"`,
            );
          }
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
