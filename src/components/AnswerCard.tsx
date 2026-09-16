import type { ConversationEntry } from "../types";

interface AnswerCardProps {
  entry: ConversationEntry;
}

export function AnswerCard({ entry }: AnswerCardProps) {
  return (
    <div className="answer-card">
      <p className="answer-card__question">{entry.question}</p>
      <p className="answer-card__answer">{entry.answer}</p>
      {entry.sources.length > 0 && (
        <div className="answer-card__sources">
          <strong>Sources</strong>
          <ul>
            {entry.sources.map((src, i) => (
              <li key={`${src.source}-${src.chunk_index}-${i}`}>
                {src.source}
                {src.page !== null ? ` (page ${src.page})` : ""} — score {src.score.toFixed(2)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
