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

export interface ResetResponse {
  chunks_deleted: number;
  files_deleted: number;
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

export interface HealthResponse {
  status: string;
  ollama: boolean;
  qdrant: boolean;
}

export interface ModelsResponse {
  models: string[];
  default: string;
}

export type TimelineItem =
  | { id: string; kind: "user"; text: string }
  | {
      id: string;
      kind: "assistant";
      text: string;
      thinkingText: string;
      sources: SourceRef[];
      phase: "thinking" | "streaming" | "done";
      error?: string;
    };

export interface Session {
  id: string;
  title: string;
  items: TimelineItem[];
  createdAt: string;
  updatedAt: string;
}
