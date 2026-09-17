import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import type { DocumentInfo, Session } from "../types";
import { DocumentsPanel } from "./DocumentsPanel";
import { SessionsPanel } from "./SessionsPanel";
import { SettingsPopover } from "./SettingsPopover";

const TEXTAREA_MAX_PX = 140;

interface ChatComposerProps {
  documents: DocumentInfo[];
  onDocumentsChanged: () => void;
  models: string[];
  selectedModel: string;
  onSelectModel: (model: string) => void;
  sessions: Session[];
  activeSessionId: string;
  onSwitchSession: (id: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string) => void;
  health: string;
  running: boolean;
  onSubmit: (question: string) => void;
  onStop: () => void;
}

function healthOk(health: string): boolean {
  return health.startsWith("OK");
}

export function ChatComposer({
  documents,
  onDocumentsChanged,
  models,
  selectedModel,
  onSelectModel,
  sessions,
  activeSessionId,
  onSwitchSession,
  onCreateSession,
  onDeleteSession,
  health,
  running,
  onSubmit,
  onStop,
}: ChatComposerProps) {
  const [question, setQuestion] = useState("");
  const [openPopover, setOpenPopover] = useState<"documents" | "settings" | "sessions" | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  function resizeTextarea() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, TEXTAREA_MAX_PX)}px`;
  }

  useEffect(() => {
    resizeTextarea();
  }, [question]);

  function handleSubmit(e?: FormEvent) {
    e?.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || running) return;
    onSubmit(trimmed);
    setQuestion("");
    requestAnimationFrame(() => {
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    });
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function togglePopover(name: "documents" | "settings" | "sessions") {
    setOpenPopover((prev) => (prev === name ? null : name));
  }

  const ok = healthOk(health);

  return (
    <div className="composer-shell">
      {openPopover === "sessions" && (
        <SessionsPanel
          sessions={sessions}
          activeId={activeSessionId}
          onSwitch={onSwitchSession}
          onCreate={onCreateSession}
          onDelete={onDeleteSession}
          disabled={running}
        />
      )}
      {openPopover === "documents" && (
        <DocumentsPanel documents={documents} onChanged={onDocumentsChanged} />
      )}
      {openPopover === "settings" && (
        <SettingsPopover
          models={models}
          selectedModel={selectedModel}
          onSelectModel={onSelectModel}
          disabled={running}
        />
      )}

      <form className="composer-pill" onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Discute librement, ou pose une question sur tes documents indexés…"
          rows={1}
          disabled={running}
        />
        <div className="composer-toolbar">
          <button
            type="button"
            className={`sessions-chip ${openPopover === "sessions" ? "active" : ""}`}
            onClick={() => togglePopover("sessions")}
            aria-expanded={openPopover === "sessions"}
            title="Gérer les sessions"
          >
            Sessions ({sessions.length})
          </button>
          <button
            type="button"
            className={`docs-chip ${openPopover === "documents" ? "active" : ""}`}
            onClick={() => togglePopover("documents")}
            aria-expanded={openPopover === "documents"}
            title="Gérer les documents indexés"
          >
            Documents{documents.length > 0 ? ` (${documents.length})` : ""}
          </button>
          <div className="composer-spacer" />
          <button
            type="button"
            className="model-chip"
            title="Changer le modèle"
            onClick={() => togglePopover("settings")}
            aria-expanded={openPopover === "settings"}
          >
            {selectedModel || "modèle…"}
          </button>
          <button
            type="button"
            className={`gear-btn ${ok ? "ok" : "bad"}`}
            onClick={() => togglePopover("settings")}
            aria-label={`Réglages · ${health}`}
            aria-expanded={openPopover === "settings"}
            title={health}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
            <span className="gear-dot" aria-hidden />
          </button>
          {running ? (
            <button type="button" className="send-btn stop" onClick={onStop} aria-label="Stop">
              ■
            </button>
          ) : (
            <button type="submit" className="send-btn" disabled={!question.trim()} aria-label="Envoyer">
              ↗
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
