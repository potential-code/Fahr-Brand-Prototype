import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Bot } from "lucide-react";
import { CoachPanel } from "@/components/coach/CoachPanel";
import { AGENTS } from "@/lib/constants";
import type { CoachContext } from "@/lib/coach";

type CoachDockProps = {
  context: CoachContext;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Fixed slide-in dock for the AI Learning Coach, used inside the course
 * player. Closed, it leaves a tab on the edge of the screen; open, it can be
 * collapsed to a rail so the lesson stays readable without losing the thread.
 */
export function CoachDock({ context, open, onOpenChange }: CoachDockProps) {
  const reduceMotion = useReducedMotion();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Edge tab — the always-available way back in */}
      <AnimatePresence>
        {!open && (
          <motion.button
            type="button"
            onClick={() => {
              setCollapsed(false);
              onOpenChange(true);
            }}
            data-testid="button-coach-open"
            initial={reduceMotion ? false : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            className="fixed end-0 top-1/2 z-[45] hidden -translate-y-1/2 items-center gap-2 rounded-s-xl bg-primary py-4 pe-2 ps-2.5 text-primary-foreground shadow-lg shadow-primary/25 transition-[padding] hover:pe-3 lg:flex"
          >
            <Bot className="h-5 w-5" />
            <span className="text-[11px] font-semibold uppercase tracking-widest [writing-mode:vertical-rl]">
              {AGENTS.coach}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.aside
            key="coach-dock"
            role="complementary"
            aria-label={AGENTS.coach}
            initial={reduceMotion ? { opacity: 0 } : { x: "100%" }}
            animate={reduceMotion ? { opacity: 1 } : { x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="fixed inset-y-0 end-0 z-[70] flex shadow-2xl"
          >
            <motion.div
              animate={{ width: collapsed ? 56 : 380 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="h-full max-w-[100vw] overflow-hidden"
            >
              <CoachPanel
                context={context}
                collapsed={collapsed}
                onCollapse={() => setCollapsed((c) => !c)}
                onClose={() => onOpenChange(false)}
              />
            </motion.div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
