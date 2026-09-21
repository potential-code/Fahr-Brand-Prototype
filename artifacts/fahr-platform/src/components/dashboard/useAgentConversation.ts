import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * One conversation, three interfaces.
 *
 * The chat, voice and avatar panes are the same agent through different
 * channels, so they have to share one position in the script: switch to voice
 * halfway through and the agent carries on from where it was, rather than
 * restarting into a different canned demo. That means the playhead lives here,
 * above all three panes, and keeps running while a pane is off screen.
 */

export type Utterance = { speaker: "agent" | "learner"; text: string };

type Options<Step> = {
  script: Step[];
  /** Pulls the spoken line out of a step, or null for steps that are visual only. */
  toUtterance: (step: Step) => Utterance | null;
  /** How long a step sits before the next one arrives. */
  delayFor: (step: Step) => number;
};

export type AgentConversation = {
  /** Number of steps revealed so far. */
  visible: number;
  /** The agent is composing the next step. */
  typing: boolean;
  finished: boolean;
  paused: boolean;
  setPaused: (paused: boolean) => void;
  /** The most recent spoken line, for the voice and avatar channels. */
  current: Utterance | null;
  /** `current` split into words, so a caption can dim what has not been said. */
  words: string[];
  /** How many of `words` have been spoken. */
  spokenCount: number;
  /** True while the agent's line is still being spoken. */
  speaking: boolean;
  replay: () => void;
};

/** Words are revealed at roughly the pace they would be spoken aloud. */
const WORD_MS = 110;

export function useAgentConversation<Step>({
  script,
  toUtterance,
  delayFor,
}: Options<Step>): AgentConversation {
  const [visible, setVisible] = useState(1);
  const [typing, setTyping] = useState(false);
  const [paused, setPaused] = useState(false);
  const [spokenWords, setSpokenWords] = useState(0);

  const finished = visible >= script.length;

  // Advance the script. Runs regardless of which pane is mounted.
  useEffect(() => {
    if (finished) {
      setTyping(false);
      return;
    }
    if (paused) return;

    const next = script[visible];
    setTyping(toUtterance(next)?.speaker !== "learner");

    const timer = window.setTimeout(() => setVisible((v) => v + 1), delayFor(next));
    return () => window.clearTimeout(timer);
    // `toUtterance` and `delayFor` are stable literals at the call site.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, paused, finished, script]);

  /** The latest line with words in it, which may be several steps back. */
  const current = useMemo(() => {
    for (let index = Math.min(visible, script.length) - 1; index >= 0; index -= 1) {
      const utterance = toUtterance(script[index]);
      if (utterance) return utterance;
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, script]);

  const words = useMemo(() => (current ? current.text.split(/\s+/).filter(Boolean) : []), [current]);

  // Restart the word reveal whenever the line changes.
  const lastText = useRef<string | null>(null);
  useEffect(() => {
    if (current?.text === lastText.current) return;
    lastText.current = current?.text ?? null;
    setSpokenWords(0);
  }, [current]);

  useEffect(() => {
    if (paused) return;
    if (spokenWords >= words.length) return;
    const timer = window.setTimeout(() => setSpokenWords((count) => count + 1), WORD_MS);
    return () => window.clearTimeout(timer);
  }, [spokenWords, words.length, paused]);

  const replay = useCallback(() => {
    setVisible(1);
    setSpokenWords(0);
    setTyping(true);
    setPaused(false);
  }, []);

  return {
    visible,
    typing,
    finished,
    paused,
    setPaused,
    current,
    words,
    spokenCount: spokenWords,
    speaking: spokenWords < words.length,
    replay,
  };
}
