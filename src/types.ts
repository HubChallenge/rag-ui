export interface DocumentInfo {
  source: string;
  file_type: string;
  chunk_count: number;
  indexed_at: string;
}

export interface UploadResponse {
  source: string;
  file_type: string;
  chunks_indexed: number;
  status: string;
}

export interface DeleteResponse {
  source: string;
  deleted: boolean;
  chunks_deleted: number;
}

export interface SourceRef {
  source: string;
  page: number | null;
  chunk_index: number;
  score: number;
}

export interface HistoryTurn {
  role: "user" | "assistant";
  content: string;
}

export interface ConversationEntry {
  id: string;
  question: string;
  answer: string;
  sources: SourceRef[];
  createdAt: string;
}
