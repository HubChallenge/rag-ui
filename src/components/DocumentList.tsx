import { useState } from "react";
import { deleteDocument } from "../api/client";
import type { DocumentInfo } from "../types";

interface DocumentListProps {
  documents: DocumentInfo[];
  onChanged: () => void;
}

export function DocumentList({ documents, onChanged }: DocumentListProps) {
  const [deletingSource, setDeletingSource] = useState<string | null>(null);

  async function handleDelete(source: string) {
    if (!confirm(`Supprimer "${source}" et tous ses passages indexés ?`)) return;
    setDeletingSource(source);
    try {
      await deleteDocument(source);
      onChanged();
    } catch (err) {
      alert(`Échec de la suppression : ${(err as Error).message}`);
    } finally {
      setDeletingSource(null);
    }
  }

  return (
    <div className="panel">
      <h2>Documents indexés</h2>
      {documents.length === 0 ? (
        <p className="muted">Aucun document indexé pour le moment.</p>
      ) : (
        <table className="document-table">
          <thead>
            <tr>
              <th>Fichier</th>
              <th>Type</th>
              <th>Chunks</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.source}>
                <td>{doc.source}</td>
                <td>{doc.file_type}</td>
                <td>{doc.chunk_count}</td>
                <td>
                  <button
                    onClick={() => handleDelete(doc.source)}
                    disabled={deletingSource === doc.source}
                  >
                    {deletingSource === doc.source ? "..." : "Supprimer"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
