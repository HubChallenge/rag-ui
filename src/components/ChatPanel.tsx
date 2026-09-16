import { useState, type FormEvent } from "react";
import { askQuestionStream } from "../api/client";
import type { ConversationEntry, HistoryTurn, SourceRef } from "../types";
import { AnswerCard } from "./AnswerCard";

function toHistory(conversation: ConversationEntry[]): HistoryTurn[] {
  return conversation.flatMap((entry) => [
    { role: "user" as const, content: entry.question },
    { role: "assistant" as const, content: entry.answer },
  ]);
}

interface PendingAnswer {
  question: string;
  text: string;
  sources: SourceRef[];
  status: "thinking" | "streaming";
}

interface ChatPanelProps {
  conversation: ConversationEntry[];
  onNewEntry: (entry: ConversationEntry) => void;
}

export function ChatPanel({ conversation, onNewEntry }: ChatPanelProps) {
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState<PendingAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || pending) return;

    setError(null);
    setPending({ question: trimmed, text: "", sources: [], status: "thinking" });
    setQuestion("");

    let finalText = "";
    let finalSources: SourceRef[] = [];

    try {
      await askQuestionStream(trimmed, toHistory(conversation), {
        onSources: (sources) => {
          finalSources = sources;
          setPending((p) => (p ? { ...p, sources } : p));
        },
        onThinking: () => setPending((p) => (p ? { ...p, status: "thinking" } : p)),
        onToken: (text) => {
          finalText += text;
          setPending((p) => (p ? { ...p, status: "streaming", text: p.text + text } : p));
        },
      });

      onNewEntry({
        id: crypto.randomUUID(),
        question: trimmed,
        answer: finalText,
        sources: finalSources,
        createdAt: new Date().toISOString(),
      });
      setPending(null);
    } catch (err) {
      setError((err as Error).message);
      setPending(null);
    }
  }

  return (
    <div className="panel panel--chat">
      <h2>Chat</h2>
      <form onSubmit={handleSubmit} className="chat-form">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Discute librement, ou pose une question sur tes documents indexés..."
          rows={3}
          disabled={!!pending}
        />
        <button type="submit" disabled={!!pending || !question.trim()}>
          Envoyer
        </button>
      </form>
      {error && <p className="error">{error}</p>}

      <div className="conversation-list">
        {pending && (
          <div className="answer-card answer-card--pending">
            <p className="answer-card__question">{pending.question}</p>
            {pending.status === "thinking" && !pending.text ? (
              <p className="answer-card__thinking">Réflexion en cours…</p>
            ) : (
              <p className="answer-card__answer">
                {pending.text}
                <span className="answer-card__cursor" />
              </p>
            )}
          </div>
        )}
        {conversation
          .slice()
          .reverse()
          .map((entry) => (
            <AnswerCard key={entry.id} entry={entry} />
          ))}
      </div>
    </div>
  );
}
