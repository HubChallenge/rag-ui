import type { Session } from "../types";

interface SessionsPanelProps {
  sessions: Session[];
  activeId: string;
  onSwitch: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  disabled?: boolean;
}

export function SessionsPanel({ sessions, activeId, onSwitch, onCreate, onDelete, disabled }: SessionsPanelProps) {
  const sorted = [...sessions].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <div className="sessions-popover" role="dialog" aria-label="Sessions">
      <div className="sessions-header">
        <h3>Sessions</h3>
        <button type="button" className="new-session-btn" onClick={onCreate} disabled={disabled}>
          + Nouvelle
        </button>
      </div>
      <ul className="sessions-list">
        {sorted.map((s) => (
          <li key={s.id} className={`session-row ${s.id === activeId ? "active" : ""}`}>
            <button
              type="button"
              className="session-title"
              onClick={() => onSwitch(s.id)}
              disabled={disabled}
              title={s.title}
            >
              {s.title}
            </button>
            <button
              type="button"
              className="session-delete"
              onClick={() => {
                if (confirm(`Supprimer la session "${s.title}" ?`)) onDelete(s.id);
              }}
              disabled={disabled || sessions.length <= 1}
              aria-label="Supprimer la session"
              title="Supprimer la session"
            >
              🗑
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
