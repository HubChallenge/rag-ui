import { useState } from "react";
import { resetDocuments } from "../api/client";
import type { DocumentInfo } from "../types";
import { DocumentList } from "./DocumentList";
import { UploadPanel } from "./UploadPanel";

interface DocumentsPanelProps {
  documents: DocumentInfo[];
  onChanged: () => void;
}

export function DocumentsPanel({ documents, onChanged }: DocumentsPanelProps) {
  const [isResetting, setIsResetting] = useState(false);

  async function handleReset() {
    if (!confirm("Supprimer TOUS les documents indexés ? Cette action est irréversible.")) return;
    setIsResetting(true);
    try {
      await resetDocuments();
      onChanged();
    } catch (err) {
      alert(`Échec de la réinitialisation : ${(err as Error).message}`);
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <div className="documents-popover" role="dialog" aria-label="Documents">
      <div className="documents-header">
        <h3>Documents indexés</h3>
        <button
          type="button"
          className="reset-btn"
          onClick={handleReset}
          disabled={isResetting || documents.length === 0}
          title="Vider entièrement la base de documents"
        >
          {isResetting ? "..." : "Tout réinitialiser"}
        </button>
      </div>
      <UploadPanel onUploaded={onChanged} />
      <DocumentList documents={documents} onChanged={onChanged} />
    </div>
  );
}
