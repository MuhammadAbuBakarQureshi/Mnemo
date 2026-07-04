import "./MessageBubble.css";

// Both AI and human messages can carry a `context` array of file/chunk
// references, e.g.:
//   AI:    [{ content, filename, similarity, page_number }, ...]
//   Human: [{ filename, document_id, file_path, ... }, ...]  (uploaded docs)
// Either shape renders fine here — page/score are simply omitted when not
// present. Empty/absent context renders nothing.
function parseContextPills(context) {
  if (!context) return [];

  // Defensive: handle the case where context arrives as a JSON string
  // instead of an already-parsed array/object.
  let items = context;
  if (typeof items === "string") {
    try {
      items = JSON.parse(items);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(items)) return [];

  return items
    .filter((item) => item && item.filename)
    .map((item, i) => {
      let score = typeof item.similarity === "number"
        ? item.similarity
        : item.similarity != null
        ? parseFloat(item.similarity)
        : NaN;

      if (Number.isNaN(score)) {
        score = null;
      } else if (score <= 1) {
        // Similarity may come through as a 0–1 fraction or already as a
        // percentage — normalize to a percentage either way.
        score *= 100;
      }

      return {
        key: `${item.filename}-${item.page_number ?? "x"}-${i}`,
        filename: item.filename,
        page: item.page_number ?? null,
        score: score !== null ? score.toFixed(2) : null,
      };
    });
}

function ContextPills({ pills }) {
  if (pills.length === 0) return null;

  return (
    <div className="message-context-pills">
      {pills.map((pill) => (
        <span
          className="message-context-pill"
          key={pill.key}
          title={
            pill.score !== null
              ? `${pill.filename} · Page ${pill.page} · ${pill.score}% match`
              : pill.page != null
              ? `${pill.filename} · Page ${pill.page}`
              : pill.filename
          }
        >
          <span className="message-context-pill-file">{pill.filename}</span>
          {pill.page != null && (
            <>
              <span className="message-context-pill-dot">·</span>
              <span className="message-context-pill-page">Page {pill.page}</span>
            </>
          )}
          {pill.score !== null && (
            <>
              <span className="message-context-pill-dot">·</span>
              <span className="message-context-pill-score">{pill.score}%</span>
            </>
          )}
        </span>
      ))}
    </div>
  );
}

/**
 * MessageBubble
 *
 * Props:
 * - role: "user" | "assistant" — determines alignment and styling
 * - content: string — the message text
 * - context: optional array of file/chunk reference objects. Rendered as
 *   pills — above the text for user messages (files just attached), below
 *   the text for assistant messages (sources used to answer). Omitted
 *   entirely if empty/absent.
 * - timestamp: optional string/Date to display
 */
export default function MessageBubble({
  role = "assistant",
  content,
  context,
  timestamp,
}) {
  const isUser = role === "user";
  const pills = parseContextPills(context);

  return (
    <div className={`message-row ${isUser ? "message-row-user" : "message-row-assistant"}`}>
      <div className={`message-bubble ${isUser ? "message-bubble-user" : "message-bubble-assistant"}`}>
        {isUser && <ContextPills pills={pills} />}

        {content && <p className="message-content">{content}</p>}

        {!isUser && <ContextPills pills={pills} />}

        {timestamp && <span className="message-timestamp">{timestamp}</span>}
      </div>
    </div>
  );
}
