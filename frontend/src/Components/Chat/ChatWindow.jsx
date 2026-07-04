import { useState, useRef, useEffect } from "react";
import ChatInput from "./ChatInput";
import apiFetch from "../../../apifetch";
import MessageBubble from "./MessageBubble";
import "./ChatWindow.css";

const BASE_URL = import.meta.env.VITE_BASE_URL

export default function ChatWindow({
  project,
  chatSession,
  onSendMessage,
  onFileUploaded,
}) {
  const [messages, setMessages] = useState([]);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const scrollRef = useRef(null);


  // Fetch chat history ONCE whenever we get a valid chat_id (e.g. on
  // selecting an existing chat, or right after /chat/init creates one).
  // Guarded by loadedChatIdRef so we don't refetch on every re-render.
  const loadedChatIdRef = useRef(null);

  // When we send the very first message of a brand new chat, chat_id
  // transitions null -> real id *while the send is still in flight*
  // (AppPage sets chatSession/navigates before the /chat/ POST resolves).
  // That transition would otherwise trigger the fetch-history effect below
  // and overwrite our optimistically-appended message with an empty/partial
  // result from the DB, since the message may not be committed yet. This
  // ref tells that effect "we already have this chat's messages locally,
  // don't fetch" for exactly that one transition.
  const expectingNewChatRef = useRef(false);

  useEffect(() => {
    const chatId = chatSession?.chat_id;

    // No chat yet (e.g. brand new, first-message-pending session) -> reset
    if (!chatId) {
      setMessages([]);
      loadedChatIdRef.current = null;
      expectingNewChatRef.current = false;
      return;
    }

    // Already loaded this chat's history, don't refetch
    if (loadedChatIdRef.current === chatId) return;

    // This chat_id just appeared because WE created it via the first
    // message in this session, and we already have the optimistic user
    // message locally — don't clobber it with a fetch. Checking actual
    // local message content (not just the flag) means this only ever
    // skips a fetch when there's genuinely something local to preserve.
    if (expectingNewChatRef.current && messages.length > 0) {
      expectingNewChatRef.current = false;
      loadedChatIdRef.current = chatId;
      return;
    }
    expectingNewChatRef.current = false;

    async function fetchMessages() {
      try {
        const response = await apiFetch(
          `${BASE_URL}/chat/messages/${chatId}`,
          "GET"
        );

        if (!response || !response.ok) {
          setMessages([]);
          return;
        }

        const data = await response.json();

        // Backend's GET /messages/{chat_id} returns the Chat row(s) with a
        // nested `messages` relationship (selectinload). Be defensive about
        // the exact shape in case it's ever simplified to a flat list.
        const rawMessages =
          Array.isArray(data) && data.length > 0 && data[0]?.messages
            ? data[0].messages
            : Array.isArray(data)
            ? data
            : [];

        const formatted = rawMessages.map((m) => ({
          id: m.id ?? m.message_id ?? `${Date.now()}-${Math.random()}`,
          role: m.role === "human" ? "user" : "assistant",
          content: m.content,
          context: m.context,
          timestamp: m.created_at
            ? new Date(m.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : undefined,
        }));

        setMessages(formatted);
        loadedChatIdRef.current = chatId;
      } catch (err) {
        console.error("Error fetching chat messages:", err);
        setMessages([]);
      }
    }

    fetchMessages();
  }, [chatSession?.chat_id]);



  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    setTimeout(() => { el.scrollTop = el.scrollHeight; }, 0);
  }, [messages, isWaitingForResponse]);

  const handleSend = async (text, attachments) => {
    if (!chatSession) return;

    // If this is the first message of a fresh chat (no chat_id yet), a
    // real chat_id is about to be assigned mid-flight by onSendMessage.
    // Flag it so the history-fetch effect skips the resulting transition.
    if (!chatSession.chat_id) {
      expectingNewChatRef.current = true;
    }

    // Add user message immediately. `context` here is the uploaded
    // Document objects (already have .filename) — same shape MessageBubble
    // uses to render AI retrieval pills, so it renders as file pills too.
    const userMessage = {
      id: Date.now(),
      role: "user",
      content: text,
      context: attachments,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMessage]);

    setIsWaitingForResponse(true);
    try {
      if (typeof onSendMessage === "function") {
        // Pass along the history as it was BEFORE this new user message,
        // so the caller can send { message: text, messages: [...] } to /chat
        const assistantResponse = await onSendMessage(text, attachments, messages);
        if (assistantResponse) {
          setMessages((prev) => [
            ...prev,
            { id: Date.now() + 1, ...assistantResponse },
          ]);
        } else {
          // Send failed — chat_id may never have transitioned, so clear the
          // flag to avoid it wrongly suppressing a future, unrelated fetch.
          expectingNewChatRef.current = false;
        }
      }
    } catch (err) {
      console.error("Error getting response:", err);
      expectingNewChatRef.current = false;
    } finally {
      setIsWaitingForResponse(false);
    }
  };

  const isEmpty = messages.length === 0;
  const emptyTitle = project
    ? `What are we working on in ${project.name}?`
    : "Select a project to get started";

  return (
    <div className="chat-window">
      {isEmpty ? (
        <div className="chat-window-empty">
          <h1 className="chat-window-empty-title">{emptyTitle}</h1>
          {project && chatSession && (
            <ChatInput
              onSend={handleSend}
              centered
              projectId={project?.project_id}
              onFileUploaded={onFileUploaded}
            />
          )}
        </div>
      ) : (
        <>
          <div className="chat-window-messages" ref={scrollRef}>
            {messages.map((m) => (
              <MessageBubble
                key={m.id}
                role={m.role}
                content={m.content}
                context={m.context}
                timestamp={m.timestamp}
              />
            ))}
            {isWaitingForResponse && (
              <div className="chat-message-loading">
                <div className="chat-loading-dots">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
          </div>
          {chatSession && (
            <ChatInput
              onSend={handleSend}
              centered={false}
              projectId={project?.project_id}
              onFileUploaded={onFileUploaded}
            />
          )}
        </>
      )}
    </div>
  );
}
