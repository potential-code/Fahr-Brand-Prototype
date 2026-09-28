import React, { useEffect, useMemo, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useFederalData } from "@/lib/FederalDataContext";
import { LEARNER_PROFILE } from "@/lib/constants";

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

/**
 * A one-to-one conversation between a manager and a member of their team,
 * read from the shared session store, so a message sent from one console is
 * waiting in the other. The viewer's own messages sit on the right.
 */
export function DirectConversation({
  meId,
  otherId,
  placeholder,
  emptyNote,
}: {
  meId: string;
  otherId: string;
  placeholder: string;
  /** Shown before anyone has written. */
  emptyNote: string;
}) {
  const { directMessages, getPerson, sendDirectMessage, focus } = useFederalData();
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const messages = useMemo(
    () =>
      directMessages.filter(
        (m) => (m.fromId === meId && m.toId === otherId) || (m.fromId === otherId && m.toId === meId),
      ),
    [directMessages, meId, otherId],
  );

  // Keep the newest message in view, scrolling the list only — never the page.
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages.length]);

  const nameOf = (id: string) => getPerson(id)?.name ?? (id === focus.learnerId ? LEARNER_PROFILE.name : "Your department manager");

  const send = () => {
    if (!draft.trim()) return;
    sendDirectMessage(otherId, draft, meId);
    setDraft("");
  };

  return (
    <div className="flex flex-col" data-testid="direct-conversation">
      <div ref={listRef} className="max-h-[420px] space-y-4 overflow-y-auto overscroll-contain scroll-smooth pe-1">
        {messages.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{emptyNote}</p>
        ) : (
          messages.map((message) => {
            const mine = message.fromId === meId;
            const name = mine ? "You" : nameOf(message.fromId);
            return (
              <div
                key={message.id}
                className={`flex gap-2.5 ${mine ? "flex-row-reverse" : ""}`}
                data-testid={mine ? "message-mine" : "message-theirs"}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    mine ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                  }`}
                >
                  {initials(nameOf(message.fromId))}
                </span>
                <div className={`flex min-w-0 max-w-[80%] flex-col ${mine ? "items-end" : "items-start"}`}>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{name}</span> · {message.on}
                  </p>
                  <p
                    className={`mt-1 whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      mine
                        ? "rounded-se-sm bg-primary text-primary-foreground"
                        : "rounded-ss-sm border border-border bg-muted/40 text-foreground"
                    }`}
                  >
                    {message.body}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 flex items-end gap-2 border-t border-border pt-4">
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            // Enter sends; Shift+Enter starts a new line.
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              send();
            }
          }}
          placeholder={placeholder}
          rows={2}
          className="min-h-[44px] resize-none"
          data-testid="input-direct-reply"
        />
        <Button onClick={send} disabled={!draft.trim()} className="shrink-0 gap-2" data-testid="button-direct-send">
          <Send className="h-4 w-4 rtl:rotate-180" /> Send
        </Button>
      </div>
    </div>
  );
}
