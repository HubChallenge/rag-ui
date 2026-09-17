import type {
  DeleteResponse,
  DocumentInfo,
  HealthResponse,
  HistoryTurn,
  ModelsResponse,
  SourceRef,
  UploadResponse,
} from "../types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.json();
      detail = body.detail ?? detail;
    } catch {
      // ignore JSON parse failure, fall back to statusText
    }
    throw new Error(detail);
  }
  return response.json() as Promise<T>;
}

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${BASE_URL}/health`);
  return handleResponse<HealthResponse>(response);
}

export async function fetchModels(): Promise<ModelsResponse> {
  const response = await fetch(`${BASE_URL}/models`);
  return handleResponse<ModelsResponse>(response);
}

export async function uploadDocument(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${BASE_URL}/documents/upload`, {
    method: "POST",
    body: formData,
  });
  return handleResponse<UploadResponse>(response);
}

export async function listDocuments(): Promise<DocumentInfo[]> {
  const response = await fetch(`${BASE_URL}/documents`);
  const data = await handleResponse<{ documents: DocumentInfo[] }>(response);
  return data.documents;
}

export async function deleteDocument(source: string): Promise<DeleteResponse> {
  const response = await fetch(`${BASE_URL}/documents/${encodeURIComponent(source)}`, {
    method: "DELETE",
  });
  return handleResponse<DeleteResponse>(response);
}

export interface AskStreamCallbacks {
  onSources?: (sources: SourceRef[]) => void;
  onThinking?: (text: string) => void;
  onToken?: (text: string) => void;
}

export interface AskStreamOptions {
  model?: string;
  topK?: number;
  signal?: AbortSignal;
}

type StreamEvent =
  | { type: "sources"; sources: SourceRef[] }
  | { type: "thinking"; content: string }
  | { type: "token"; content: string }
  | { type: "done" }
  | { type: "error"; message: string };

export async function askQuestionStream(
  question: string,
  history: HistoryTurn[],
  callbacks: AskStreamCallbacks,
  options: AskStreamOptions = {}
): Promise<void> {
  const response = await fetch(`${BASE_URL}/chat/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      history,
      top_k: options.topK,
      model: options.model,
    }),
    signal: options.signal,
  });

  if (!response.ok || !response.body) {
    let detail = response.statusText;
    try {
      const body = await response.json();
      detail = body.detail ?? detail;
    } catch {
      // ignore JSON parse failure, fall back to statusText
    }
    throw new Error(detail);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIndex = buffer.indexOf("\n");
    while (newlineIndex !== -1) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);
      newlineIndex = buffer.indexOf("\n");
      if (!line) continue;

      const event = JSON.parse(line) as StreamEvent;
      if (event.type === "sources") callbacks.onSources?.(event.sources);
      else if (event.type === "thinking") callbacks.onThinking?.(event.content);
      else if (event.type === "token") callbacks.onToken?.(event.content);
      else if (event.type === "error") throw new Error(event.message);
    }
  }
}
