import type { Session } from "./types";

const STORAGE_KEY = "rag-ui-sessions-v1";

export interface SessionsState {
  sessions: Session[];
  activeId: string;
}

export function generateId(): string {
  // crypto.randomUUID is only defined in secure contexts (HTTPS or localhost),
  // so fall back to a manual UUID v4 when accessed over plain HTTP (e.g. Tailscale IP).
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function freshSession(): Session {
  const now = new Date().toISOString();
  return {
    id: generateId(),
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
