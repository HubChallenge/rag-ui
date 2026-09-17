import { useState } from "react";
import { uploadDocument } from "../api/client";

interface FileStatus {
  name: string;
  status: "pending" | "uploading" | "done" | "error";
  message?: string;
}

interface UploadPanelProps {
  onUploaded: () => void;
}

export function UploadPanel({ onUploaded }: UploadPanelProps) {
  const [statuses, setStatuses] = useState<FileStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    setStatuses(files.map((f) => ({ name: f.name, status: "pending" })));
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
              <span>{s.name}</span>
              <span>{s.status === "error" ? s.message : s.message ?? s.status}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
