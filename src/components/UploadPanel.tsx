import { useState } from "react";
import { uploadDocument } from "../api/client";

interface FileStatus {
  name: string;
  size: number;
  status: "pending" | "uploading" | "done" | "error";
  message?: string;
}

interface UploadPanelProps {
  onUploaded: () => void;
}

const LARGE_FILE_BYTES = 5 * 1024 * 1024;

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function statusLabel(s: FileStatus): string {
  if (s.status === "error") return s.message ?? "Erreur";
  if (s.status === "done") return s.message ?? "Terminé";
  if (s.status === "pending") return "En attente…";
  return s.size > LARGE_FILE_BYTES
    ? "Indexation en cours… cela peut prendre plusieurs minutes pour un gros fichier"
    : "Indexation en cours…";
}

export function UploadPanel({ onUploaded }: UploadPanelProps) {
  const [statuses, setStatuses] = useState<FileStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    setStatuses(files.map((f) => ({ name: f.name, size: f.size, status: "pending" })));
    setIsUploading(true);

    for (const file of files) {
      setStatuses((prev) =>
        prev.map((s) => (s.name === file.name ? { ...s, status: "uploading" } : s))
      );
      try {
        const result = await uploadDocument(file);
        setStatuses((prev) =>
          prev.map((s) =>
            s.name === file.name
              ? { ...s, status: "done", message: `${result.chunks_indexed} chunks indexés` }
              : s
          )
        );
      } catch (err) {
        setStatuses((prev) =>
          prev.map((s) =>
            s.name === file.name
              ? { ...s, status: "error", message: (err as Error).message }
              : s
          )
        );
      }
    }

    setIsUploading(false);
    onUploaded();
  }

  return (
    <div className="upload-panel">
      <input
        type="file"
        multiple
        accept=".pdf,.txt,.md,.markdown,.docx"
        disabled={isUploading}
        onChange={(e) => handleFiles(e.target.files)}
      />
      {statuses.length > 0 && (
        <ul className="upload-status-list">
          {statuses.map((s) => (
            <li key={s.name} className={`upload-status upload-status--${s.status}`}>
              <span className="upload-name">
                {s.name} <span className="upload-size">({formatSize(s.size)})</span>
              </span>
              <span className="upload-status-text">
                {s.status === "uploading" && <span className="pending-dot" />}
                {statusLabel(s)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
