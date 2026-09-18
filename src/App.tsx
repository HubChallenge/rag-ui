import { useEffect, useRef, useState } from "react";
import "./App.css";
import { askQuestionStream, fetchHealth, fetchModels, listDocuments } from "./api/client";
import { ChatComposer } from "./components/ChatComposer";
import { Timeline } from "./components/Timeline";
import { createEmptySession, deriveTitle, generateId, loadSessionsState, saveSessionsState } from "./sessions";
import type { DocumentInfo, HistoryTurn, TimelineItem } from "./types";

function toHistory(items: TimelineItem[]): HistoryTurn[] {
  return items.flatMap((item): HistoryTurn[] => {
    if (item.kind === "user") return [{ role: "user", content: item.text }];
    if (item.kind === "assistant" && item.text) return [{ role: "assistant", content: item.text }];
    return [];
  });
}

export default function App() {
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [health, setHealth] = useState("…");
  const [initialSessionsState] = useState(() => loadSessionsState());
  const [sessions, setSessions] = useState(initialSessionsState.sessions);
  const [activeId, setActiveId] = useState(initialSessionsState.activeId);
  const [running, setRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const activeSession = sessions.find((s) => s.id === activeId) ?? sessions[0];
  const items = activeSession?.items ?? [];
  const hasConversation = items.length > 0;

  async function refreshDocuments() {
    try {
      setDocuments(await listDocuments());
    } catch {
      // backend not reachable yet; keep previous list
    }
  }

  useEffect(() => {
    refreshDocuments();

    fetchHealth()
      .then((h) => setHealth(h.ollama && h.qdrant ? "OK" : "Ollama/Qdrant indisponible"))
      .catch(() => setHealth("API hors ligne"));

    fetchModels()
      .then((m) => {
        setModels(m.models);
        setSelectedModel((current) => current || m.default || m.models[0] || "");
      })
      .catch(() => {
        // model list unavailable; the model chip will show a placeholder
      });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [items]);

  useEffect(() => {
    saveSessionsState({ sessions, activeId });
  }, [sessions, activeId]);

  function updateActiveItems(updater: (items: TimelineItem[]) => TimelineItem[]) {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== activeId) return s;
        const nextItems = updater(s.items);
        const firstUser = nextItems.find(
          (i): i is Extract<TimelineItem, { kind: "user" }> => i.kind === "user"
        );
        return {
          ...s,
          items: nextItems,
          updatedAt: new Date().toISOString(),
          title: firstUser ? deriveTitle(firstUser.text) : s.title,
        };
      })
    );
  }

  function updateAssistant(
    id: string,
    updater: (item: Extract<TimelineItem, { kind: "assistant" }>) => Extract<TimelineItem, { kind: "assistant" }>
  ) {
    updateActiveItems((items) =>
      items.map((item) => (item.id === id && item.kind === "assistant" ? updater(item) : item))
    );
  }

  async function handleSubmit(question: string) {
    const history = toHistory(items);
    const assistantId = generateId();

    updateActiveItems((items) => [
      ...items,
      { id: generateId(), kind: "user", text: question },
      {
        id: assistantId,
        kind: "assistant",
        text: "",
        thinkingText: "",
        sources: [],
        phase: "thinking",
      },
    ]);
    setRunning(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      await askQuestionStream(
        question,
        history,
        {
          onSources: (sources) => updateAssistant(assistantId, (a) => ({ ...a, sources })),
          onThinking: (text) =>
            updateAssistant(assistantId, (a) => ({ ...a, thinkingText: a.thinkingText + text })),
          onToken: (text) =>
            updateAssistant(assistantId, (a) => ({
              ...a,
              phase: "streaming",
              text: a.text + text,
            })),
        },
        { model: selectedModel || undefined, signal: ctrl.signal }
      );
      updateAssistant(assistantId, (a) => ({ ...a, phase: "done" }));
    } catch (err) {
      const message =
        (err as Error).name === "AbortError" ? "Réponse interrompue." : (err as Error).message;
      updateAssistant(assistantId, (a) => ({ ...a, phase: "done", error: message }));
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }

  function handleStop() {
    abortRef.current?.abort();
  }

  function handleCreateSession() {
    const session = createEmptySession();
    setSessions((prev) => [...prev, session]);
    setActiveId(session.id);
  }

  function handleSwitchSession(id: string) {
    setActiveId(id);
  }

  function handleDeleteSession(id: string) {
    const remaining = sessions.filter((s) => s.id !== id);

    if (remaining.length === 0) {
      const session = createEmptySession();
      setSessions([session]);
      setActiveId(session.id);
      return;
    }

    setSessions(remaining);
    if (id === activeId) {
      const mostRecent = [...remaining].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
      setActiveId(mostRecent.id);
    }
  }

  const composer = (
    <ChatComposer
      documents={documents}
      onDocumentsChanged={refreshDocuments}
      models={models}
      selectedModel={selectedModel}
      onSelectModel={setSelectedModel}
      sessions={sessions}
      activeSessionId={activeId}
      onSwitchSession={handleSwitchSession}
      onCreateSession={handleCreateSession}
      onDeleteSession={handleDeleteSession}
      health={health}
      running={running}
      onSubmit={handleSubmit}
      onStop={handleStop}
    />
  );

  return (
    <div className={`app ${hasConversation ? "has-chat" : "idle"}`}>
      <div className="glow" aria-hidden />

      <header className="hero">
        <p className="brand">RAG Local</p>
        {!hasConversation && (
          <>
            <h1>
              Discute avec <em>tes documents</em>
            </h1>
            <p className="tagline">
              Pose une question, ou importe des fichiers pour que le modèle les utilise comme
              contexte — le tout en local, via Ollama et Qdrant.
            </p>
          </>
        )}
      </header>

      {hasConversation ? (
        <>
          <main className="main">
            <Timeline items={items} />
            <div ref={bottomRef} />
          </main>
          <div className="composer-dock">{composer}</div>
        </>
      ) : (
        <div className="composer-dock idle-dock">{composer}</div>
      )}
    </div>
  );
}
