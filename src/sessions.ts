import type { Session } from "./types";

const STORAGE_KEY = "rag-ui-sessions-v1";

export interface SessionsState {
  sessions: Session[];
  activeId: string;
}

function freshSession(): Session {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: "Nouvelle session",
    items: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function createEmptySession(): Session {
  return freshSession();
}

export function deriveTitle(text: string, max = 48): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (!flat) return "Nouvelle session";
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

export function loadSessionsState(): SessionsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SessionsState;
      if (Array.isArray(parsed.sessions) && parsed.sessions.length > 0) {
        const activeId = parsed.sessions.some((s) => s.id === parsed.activeId)
          ? parsed.activeId
          : parsed.sessions[0].id;
        return { sessions: parsed.sessions, activeId };
      }
    }
  } catch {
    // ignore corrupt storage, fall through to a fresh session
  }

  const session = freshSession();
  return { sessions: [session], activeId: session.id };
}

export function saveSessionsState(state: SessionsState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage unavailable (private mode, quota, ...) — skip persistence silently
  }
}
