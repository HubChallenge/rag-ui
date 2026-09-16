import { useEffect, useState } from "react";
import "./App.css";
import { listDocuments } from "./api/client";
import { ChatPanel } from "./components/ChatPanel";
import { DocumentList } from "./components/DocumentList";
import { UploadPanel } from "./components/UploadPanel";
import type { ConversationEntry, DocumentInfo } from "./types";

const CONVERSATION_STORAGE_KEY = "rag-conversation-history";

function loadConversation(): ConversationEntry[] {
  try {
    const raw = localStorage.getItem(CONVERSATION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ConversationEntry[]) : [];
  } catch {
    return [];
  }
}

function App() {
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [conversation, setConversation] = useState<ConversationEntry[]>(loadConversation);

  async function refreshDocuments() {
    try {
      const docs = await listDocuments();
      setDocuments(docs);
    } catch {
      // backend not reachable yet; document list stays as-is
    }
  }

  useEffect(() => {
    refreshDocuments();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CONVERSATION_STORAGE_KEY, JSON.stringify(conversation));
    } catch {
      // storage unavailable (private mode, quota, ...) — skip persistence silently
    }
  }, [conversation]);

  return (
    <div className="app">
      <header>
        <h1>RAG Local</h1>
      </header>
      <main className="app-layout">
        <aside className="app-sidebar">
          <UploadPanel onUploaded={refreshDocuments} />
          <DocumentList documents={documents} onChanged={refreshDocuments} />
        </aside>
        <section className="app-main">
          <ChatPanel
            conversation={conversation}
            onNewEntry={(entry) => setConversation((prev) => [...prev, entry])}
          />
        </section>
      </main>
    </div>
  );
}

export default App;
