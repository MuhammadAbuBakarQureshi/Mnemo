import { useState, useRef, useEffect } from "react";
import { Paperclip, ArrowUp, X, FileText, Loader } from "lucide-react";
import "./ChatInput.css";

const BASE_URL = import.meta.env.VITE_BASE_URL

/**
 * ChatInput
 *
 * Props:
 * - onSend(message, attachments): called when the user submits
 *   attachments is an array of Document objects returned by the upload API
 *   { document_id, filename, file_path, file_type, project_id, user_id }
 * - centered: boolean — true on empty page, false when pinned to bottom of chat
 * - projectId: current project ID, required for upload
 */
export default function ChatInput({
  onSend,
  centered = false,
  placeholder = "Message Mnemo...",
  projectId = null,
  onFileUploaded,
}) {
  const [value, setValue] = useState("");
  const [attachments, setAttachments] = useState([]);
  // attachments shape: { tempId, name, document: <backend response> | null, uploading, error }
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-grow the textarea up to a max height
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  const isUploading = attachments.some((a) => a.uploading);
  const canSend = (value.trim().length > 0 || attachments.some((a) => a.document)) && !isUploading;

  const handleSend = () => {
    if (!canSend) return;
    // Only pass successfully uploaded documents (with document object from backend)
    const uploaded = attachments
      .filter((a) => a.document && !a.error)
      .map((a) => a.document);
    onSend?.(value.trim(), uploaded);
    setValue("");
    setAttachments([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const uploadFile = async (file) => {
    const tempId = `${file.name}-${Date.now()}`;

    // Add to list immediately with uploading state
    setAttachments((prev) => [
      ...prev,
      { tempId, name: file.name, document: null, uploading: true, error: null },
    ]);

    try {
      if (!projectId) throw new Error("No project selected");

      // Multipart upload — do NOT use apiFetch since it forces Content-Type: application/json
      // Let browser set Content-Type with the correct multipart boundary automatically
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${BASE_URL}/chat/upload?project_id=${projectId}`,
        {
          method: "POST",
          body: formData,
          credentials: "include", // send httpOnly auth cookie
        }
      );

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || `Upload failed (${response.status})`);
      }

      const document = await response.json();
      // Backend returns: { document_id, filename, file_path, file_type, project_id, user_id, ... }

      setAttachments((prev) =>
        prev.map((a) =>
          a.tempId === tempId
            ? { ...a, name: document.filename, document, uploading: false }
            : a
        )
      );

      // Let the files panel know a new document exists for this project
      onFileUploaded?.(document);
    } catch (err) {
      console.error("Upload error:", err);
      setAttachments((prev) =>
        prev.map((a) =>
          a.tempId === tempId
            ? { ...a, uploading: false, error: err.message || "Upload failed" }
            : a
        )
      );
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    files.forEach(uploadFile);
    e.target.value = "";
  };

  const removeAttachment = (tempId) => {
    setAttachments((prev) => prev.filter((a) => a.tempId !== tempId));
  };

  return (
    <div className={`chat-input-wrapper ${centered ? "chat-input-centered" : "chat-input-bottom"}`}>
      <div className="chat-input-box">

        {attachments.length > 0 && (
          <div className="chat-input-attachments">
            {attachments.map((a) => (
              <div
                key={a.tempId}
                className={`chat-input-attachment-chip ${a.error ? "chat-input-attachment-error" : ""}`}
                title={a.error || a.name}
              >
                {a.uploading
                  ? <Loader size={12} className="chat-input-attachment-spinner" />
                  : <FileText size={12} strokeWidth={2} />
                }
                <span className="chat-input-attachment-name">
                  {a.error ? `${a.name} — ${a.error}` : a.name}
                </span>
                <button
                  type="button"
                  className="chat-input-attachment-remove"
                  onClick={() => removeAttachment(a.tempId)}
                  aria-label={`Remove ${a.name}`}
                >
                  <X size={11} strokeWidth={2.5} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="chat-input-row">
          <button
            type="button"
            className="chat-input-icon-btn"
            aria-label="Attach file"
            onClick={() => fileInputRef.current?.click()}
            title={!projectId ? "Select a project first" : "Attach file (PDF, TXT, MD — max 10MB)"}
          >
            <Paperclip size={18} strokeWidth={2} />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.txt,.md"
            className="chat-input-file-hidden"
            onChange={handleFileChange}
            disabled={!projectId}
          />

          <textarea
            ref={textareaRef}
            className="chat-input-textarea"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
          />

          <button
            type="button"
            className="chat-input-send-btn"
            onClick={handleSend}
            disabled={!canSend}
            aria-label="Send message"
          >
            {isUploading
              ? <Loader size={16} className="chat-input-send-spinner" />
              : <ArrowUp size={18} strokeWidth={2.5} />
            }
          </button>
        </div>
      </div>
    </div>
  );
}
