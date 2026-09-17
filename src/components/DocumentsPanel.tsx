import type { DocumentInfo } from "../types";
import { DocumentList } from "./DocumentList";
import { UploadPanel } from "./UploadPanel";

interface DocumentsPanelProps {
  documents: DocumentInfo[];
  onChanged: () => void;
}

export function DocumentsPanel({ documents, onChanged }: DocumentsPanelProps) {
  return (
    <div className="documents-popover" role="dialog" aria-label="Documents">
      <h3>Documents indexés</h3>
      <UploadPanel onUploaded={onChanged} />
      <DocumentList documents={documents} onChanged={onChanged} />
    </div>
  );
}
