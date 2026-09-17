import { useEffect, useRef, useState } from "react";
import "./App.css";
import { askQuestionStream, fetchHealth, fetchModels, listDocuments } from "./api/client";
import { ChatComposer } from "./components/ChatComposer";
import { Timeline } from "./components/Timeline";
import type { DocumentInfo, HistoryTurn, TimelineItem } from "./types";

const CONVERSATION_STORAGE_KEY = "rag-ui-conversation";

function loadConversation(): TimelineItem[] {
  try {
    const raw = localStorage.getItem(CONVERSATION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TimelineItem[]) : [];
  } catch {
    return [];
  }
}

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
  const [items, setItems] = useState<TimelineItem[]>(loadConversation);
  const [running, setRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
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
    try {
      localStorage.setItem(CONVERSATION_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage unavailable (private mode, quota, ...) — skip persistence silently
    }
  }, [items]);

  function updateAssistant(id: string, updater: (item: Extract<TimelineItem, { kind: "assistant" }>) => Extract<TimelineItem, { kind: "assistant" }>) {
    setItems((prev) =>
      prev.map((item) => (item.id === id && item.kind === "assistant" ? updater(item) : item))
    );
  }

  async function handleSubmit(question: string) {
    const history = toHistory(items);
    const assistantId = crypto.randomUUID();

    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), kind: "user", text: question },
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

  const composer = (
    <ChatComposer
      documents={documents}
      onDocumentsChanged={refreshDocuments}
      models={models}
      selectedModel={selectedModel}
      onSelectModel={setSelectedModel}
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
