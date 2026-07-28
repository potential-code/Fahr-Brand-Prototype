import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

type Props = {
  lines: string[];
  onChange: (lines: string[]) => void;
  placeholders: string[];
  addLabel: string;
  disabled?: boolean;
  testIdPrefix: string;
};

let rowSeq = 0;
const nextRowId = () => `row-${(rowSeq += 1)}`;

/** A short editable list — expected outcomes, measures — one item per row. */
export function LineList({ lines, onChange, placeholders, addLabel, disabled = false, testIdPrefix }: Props) {
  // Rows carry stable ids so adding or removing one never remaps the text of a
  // neighbouring row onto the wrong input.
  const [ids, setIds] = useState<string[]>(() => lines.map(nextRowId));
  useEffect(() => {
    setIds((current) =>
      current.length === lines.length ? current : lines.map((_, i) => current[i] ?? nextRowId()),
    );
  }, [lines.length]);

  const set = (index: number, value: string) => onChange(lines.map((l, i) => (i === index ? value : l)));
  const remove = (index: number) => {
    setIds((current) => current.filter((_, i) => i !== index));
    onChange(lines.filter((_, i) => i !== index));
  };
  const add = () => {
    setIds((current) => [...current, nextRowId()]);
    onChange([...lines, ""]);
  };

  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {lines.map((line, i) => (
          <motion.div
            key={ids[i] ?? `fallback-${i}`}
            layout
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-[11px] font-semibold text-muted-foreground">
              {i + 1}
            </span>
            <Input
              value={line}
              disabled={disabled}
              placeholder={placeholders[i] ?? placeholders[placeholders.length - 1]}
              onChange={(e) => set(i, e.target.value)}
              data-testid={`${testIdPrefix}-${i}`}
            />
            {lines.length > 1 && !disabled && (
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground" onClick={() => remove(i)} aria-label={`Remove item ${i + 1}`}>
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
      {!disabled && (
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={add} data-testid={`${testIdPrefix}-add`}>
          <Plus className="h-3.5 w-3.5" /> {addLabel}
        </Button>
      )}
    </div>
  );
}
