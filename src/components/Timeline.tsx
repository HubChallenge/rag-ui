import { useState } from "react";
import type { SourceRef, TimelineItem } from "../types";

function ThinkingBlock({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  if (!text.trim()) return null;

  return (
    <div className={`thinking ${open ? "open" : ""}`}>
      <button
        type="button"
        className="collapse-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="chevron" aria-hidden>
          ▸
        </span>
        Réflexion
      </button>
      <div className="collapse-body">
        <p>{text}</p>
      </div>
    </div>
  );
}

function SourcesBlock({ sources }: { sources: SourceRef[] }) {
  const [open, setOpen] = useState(false);
  if (sources.length === 0) return null;

  return (
    <div className={`thinking sources-block ${open ? "open" : ""}`}>
      <button
        type="button"
        className="collapse-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="chevron" aria-hidden>
          ▸
        </span>
        Sources ({sources.length})
      </button>
      <div className="collapse-body">
        <ul className="sources-list">
          {sources.map((s, i) => (
            <li key={`${s.source}-${s.chunk_index}-${i}`}>
              {s.source}
              {s.page !== null ? ` (page ${s.page})` : ""} · score {s.score.toFixed(2)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function AssistantTurn({ item }: { item: Extract<TimelineItem, { kind: "assistant" }> }) {
  const showPending = item.phase === "thinking" && !item.text && !item.error;

  return (
    <div className="agent-blocks">
      <ThinkingBlock text={item.thinkingText} />
      {showPending && (
        <div className="agent-pending" aria-live="polite">
          <span className="pending-dot" />
          Réflexion…
        </div>
      )}
      {item.text && (
        <article className="msg-assistant">
          <p>
            {item.text}
            {item.phase === "streaming" && <span className="answer-cursor" aria-hidden />}
          </p>
        </article>
      )}
      {item.error && (
        <article className="msg-error">
          <p>{item.error}</p>
        </article>
      )}
      <SourcesBlock sources={item.sources} />
    </div>
  );
}

interface TimelineProps {
  items: TimelineItem[];
}

export function Timeline({ items }: TimelineProps) {
  if (items.length === 0) return null;

  return (
    <div className="timeline">
      {items.map((item) =>
        item.kind === "user" ? (
          <article key={item.id} className="msg-user">
            <p>{item.text}</p>
          </article>
        ) : (
          <AssistantTurn key={item.id} item={item} />
        )
      )}
    </div>
  );
}
