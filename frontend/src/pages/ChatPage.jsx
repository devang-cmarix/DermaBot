import React, { useState, useEffect, useRef } from 'react';
import { C } from '../constants/constants';
import { apiFetch } from '../lib/api';
import Avatar from '../components/Avatar';

function ChatPage({ token, notificationsEnabled = false }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [notice, setNotice] = useState("");
  const [attachedImage, setAttachedImage] = useState(null);
  const [attachedImagePreview, setAttachedImagePreview] = useState("");
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const userAwayRef = useRef(false);
  const user = JSON.parse(localStorage.getItem("medibot_user"));
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= 820 : false
  );
  const [showSessions, setShowSessions] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth > 820 : true
  );

  // ✅ Load sessions and suggestions
  useEffect(() => {
    if (!token) return;
    apiFetch("/sessions", {}, token)
      .then((data) => {
        const list = data.sessions || [];
        setSessions(list);
        if (list.length) setActiveSessionId(list[0].id);
      })
      .catch(() => {});

    apiFetch("/suggestions", {}, token)
      .then((data) => setSuggestions(data.suggestions || []))
      .catch(() => {});
  }, [token]);

  // ✅ Load messages when session changes
  useEffect(() => {
    if (!activeSessionId || !token) return;
    apiFetch(`/sessions/${activeSessionId}/messages`, {}, token)
      .then((data) => setMessages(data.messages || []))
      .catch(() => {});
  }, [activeSessionId, token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (typeof document === "undefined" || typeof window === "undefined") return;

    const updateAwayState = () => {
      const pageHidden = document.visibilityState !== "visible";
      const pageUnfocused = typeof document.hasFocus === "function" ? !document.hasFocus() : false;
      userAwayRef.current = pageHidden || pageUnfocused;
    };

    updateAwayState();
    document.addEventListener("visibilitychange", updateAwayState);
    window.addEventListener("blur", updateAwayState);
    window.addEventListener("focus", updateAwayState);

    return () => {
      document.removeEventListener("visibilitychange", updateAwayState);
      window.removeEventListener("blur", updateAwayState);
      window.removeEventListener("focus", updateAwayState);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const onResize = () => {
      const mobile = window.innerWidth <= 820;
      setIsMobile(mobile);
      setShowSessions((prev) => (mobile ? prev : true));
    };

    onResize();
    window.addEventListener("resize", onResize);

    return () => window.removeEventListener("resize", onResize);
  }, []);

  const clearAttachedImage = () => {
    setAttachedImage(null);
    setAttachedImagePreview("");
  };

  const notifyIfNeeded = (messageText) => {
    if (!notificationsEnabled) return;
    if (typeof document === "undefined" || typeof window === "undefined") return;
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    if (!userAwayRef.current) return;

    const body = (messageText || "Your MediBot response is ready.").slice(0, 140);
    new Notification("MediBot response completed", {
      body,
      tag: "medibot-response-ready",
      requireInteraction: true,
    });
  };

  const handleImageSelection = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setAttachedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setAttachedImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const createNewChat = async () => {
    try {
      const data = await apiFetch("/sessions", {
        method: "POST",
        body: JSON.stringify({ title: "New Consultation" }),
      }, token);
      const session = data.session || data;
      setSessions((prev) => [session, ...prev]);
      setActiveSessionId(session.id);
      setMessages([]);
    } catch (err) {
      setNotice(err.message);
    }
  };

const [confirmDeleteId, setConfirmDeleteId] = useState(null);

const deleteSession = async (sessionId, event) => {
    event.stopPropagation();
    
    // First click — ask for confirmation
    if (confirmDeleteId !== sessionId) {
        setConfirmDeleteId(sessionId);
        setTimeout(() => setConfirmDeleteId(null), 3000); // auto-cancel after 3s
        return;
    }

    // Second click — confirmed, delete
    setConfirmDeleteId(null);
    try {
        await apiFetch(`/sessions/${sessionId}`, { method: "DELETE" }, token);
        setSessions((prev) => prev.filter(s => s.id !== sessionId));
        if (activeSessionId === sessionId) {
            setActiveSessionId("");
            setMessages([]);
        }
        setNotice("Session deleted.");
        setTimeout(() => setNotice(""), 3000);
    } catch (err) {
        setNotice(err.message);
    }
};

  const send = async (text) => {
    if (!text.trim() && !attachedImage) return;

    let sessionId = activeSessionId;

    // Auto-create session if none exists
    if (!sessionId) {
      try {
        const data = await apiFetch("/sessions", {
          method: "POST",
          body: JSON.stringify({ title: text.slice(0, 40) }),
        }, token);
        const session = data.session || data;
        setSessions((prev) => [session, ...prev]);
        setActiveSessionId(session.id);
        sessionId = session.id;
      } catch (err) {
        setNotice(err.message);
        return;
      }
    }

    // Optimistic user message
    const userMsg = {
      role: "user",
      text: text || "Please review this disease image.",
      image_url: attachedImage ? attachedImagePreview : null,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setNotice("");

    try {
      if (attachedImage) {
        // ✅ Vision endpoint for images
        const formData = new FormData();
        formData.append("file", attachedImage);
        formData.append("session_id", sessionId);
        if (text.trim()) formData.append("question", text);

        const data = await apiFetch("/vision", {
          method: "POST",
          body: formData,
        }, token);

        const botMessage = {
          role: "bot",
          text: data.analysis || data.answer,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, botMessage]);
        notifyIfNeeded(botMessage.text);
        clearAttachedImage();
      } else {
        // ✅ Regular ask endpoint
        const data = await apiFetch("/ask", {
          method: "POST",
          body: JSON.stringify({ question: text, session_id: sessionId }),
        }, token);

        const botMessage = data.assistant_message || {
          role: "bot",
          text: data.answer,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, botMessage]);
        notifyIfNeeded(botMessage.text);

        // Refresh sessions list
        const sessionsData = await apiFetch("/sessions", {}, token);
        setSessions(sessionsData.sessions || []);
      }
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: "bot",
        text: err.message,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-shell">
      {/* Sessions sidebar */}
      {(!isMobile || showSessions) && (
      <div className="chat-sessions" style={{
        borderRight: isMobile ? "none" : `1px solid ${C.border}`,
        borderBottom: isMobile ? `1px solid ${C.border}` : "none",
        background: C.surface,
      }}>
        <div style={{ fontSize: 11, color: C.textMuted, letterSpacing: 1, fontWeight: 700, padding: "6px 8px 0" }}>
          PRIVATE SESSIONS
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={createNewChat} style={{
          flex: 1,
          padding: "12px 14px", borderRadius: 12,
          border: `1px dashed ${C.borderHi}`, background: "transparent",
          color: C.accent, cursor: "pointer", fontWeight: 700,
        }}>
          + New Chat
        </button>
        {isMobile && (
          <button
            type="button"
            onClick={() => setShowSessions(false)}
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              border: `1px solid ${C.borderHi}`,
              background: C.card,
              color: C.textMuted,
              fontWeight: 700,
            }}
          >
            Hide
          </button>
        )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, overflowY: "auto" }}>
          {/* ✅ Safe array check */}
          {(sessions || []).map((session) => (
            <div key={session.id} style={{ position: "relative" }}>
              <button onClick={() => setActiveSessionId(session.id)} style={{
                padding: "12px 14px", borderRadius: 12, border: "none",
                cursor: "pointer", textAlign: "left", width: "100%",
                background: activeSessionId === session.id ? C.accentSoft : C.card,
                color: activeSessionId === session.id ? C.accent : C.textMuted,
              }}>
                <div style={{ fontWeight: 700, color: activeSessionId === session.id ? C.accent : C.text }}>
                  {session.title}
                </div>
                <div style={{ fontSize: 11, marginTop: 4 }}>
                  {new Date(session.updated_at).toLocaleString()}
                </div>
              </button>
              <button 
                onClick={(e) => deleteSession(session.id, e)}
                style={{
                  position: "absolute", top: 6, right: 6,
                  width: 24, height: 24, borderRadius: 6,
                  border: "none", background: "transparent",
                  color: C.textMuted, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700,
                  opacity: 0.7,
                }}
                onMouseEnter={(e) => e.target.style.opacity = 1}
                onMouseLeave={(e) => e.target.style.opacity = 0.7}
                title="Delete chat session"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* Chat area */}
      <div className="chat-main">
        {isMobile && !showSessions && (
          <div style={{ padding: "12px 16px 0" }}>
            <button
              type="button"
              onClick={() => setShowSessions(true)}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: `1px solid ${C.borderHi}`,
                background: C.card,
                color: C.text,
                fontWeight: 700,
              }}
            >
              View sessions
            </button>
          </div>
        )}
        <div className="chat-messages">
          {!messages.length && (
            <div className="fade-up" style={{
              padding: 24, borderRadius: 22,
              border: `1px solid ${C.border}`,
              background: `linear-gradient(180deg, ${C.card}, ${C.surface})`,
            }}>
              <div style={{ fontSize: 26, fontWeight: 800 }}>
                Welcome back to your saved medical workspace
              </div>
              <div style={{ marginTop: 10, color: C.textMuted, lineHeight: 1.7 }}>
                Each conversation keeps recent memory so follow-up questions stay in context.
              </div>
            </div>
          )}

          {(messages || []).map((message, index) => (
    <div
      key={`${message.role}-${index}`}
      className={`fade-up chat-message-row${message.role === "user" ? " is-user" : ""}`}
    >
        <Avatar
  name={message.role === "user" ? user?.name : "M"}
  size={34}
  color={message.role === "user" ? C.accent : C.green}
/>
        <div className={`chat-message-content ${message.role === "user" ? "is-user" : "is-bot"}`}>
            {/* ✅ Show image if attached */}
            {message.image_url && (
                <img
                    src={message.image_url}
                    alt="Uploaded disease"
                    style={{
                        maxWidth: 240, borderRadius: 16,
                        border: `1px solid ${C.border}`,
                        boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                        marginBottom: 4,
                    }}
                />
            )}

            {/* Text bubble — hide "[Attached disease image...]" text */}
            {message.text && !message.text.includes("[Attached disease image") && (
                <div style={{
                    padding: "13px 16px",
                    borderRadius: message.role === "user" ? "20px 20px 6px 20px" : "20px 20px 20px 6px",
                    background: message.role === "user"
                        ? `linear-gradient(135deg, ${C.accent}, #6b5ef7)` : C.card,
                    border: message.role === "user" ? "none" : `1px solid ${C.border}`,
                    lineHeight: 1.7, whiteSpace: "pre-wrap",
                }}>
                    {message.text.replace("\n\n[Attached disease image for visual analysis]", "").trim()}
                </div>
            )}
            <div style={{ fontSize: 11, color: C.textDim }}>{message.time}</div>
        </div>
    </div>
))}

          {loading && (
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <Avatar name="M" size={34} color={C.green} />
              <div style={{ display: "flex", gap: 7, padding: "14px 18px", borderRadius: 18, background: C.card, border: `1px solid ${C.border}` }}>
                {[0, 1, 2].map((dot) => (
                  <div key={dot} style={{
                    width: 7, height: 7, borderRadius: "50%", background: C.accent,
                    animation: `pulse 1.2s ease-in-out ${dot * 0.15}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}

          {notice && (
            <div style={{ color: C.red, background: `${C.red}12`, border: `1px solid ${C.red}33`, padding: "12px 14px", borderRadius: 12 }}>
              {notice}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {!messages.length && suggestions.length > 0 && (
          <div className="chat-suggestions">
            {suggestions.map((item) => (
              <button key={item} onClick={() => send(item)} style={{
                padding: "9px 14px", borderRadius: 999,
                border: `1px solid ${C.borderHi}`, background: C.card,
                color: C.textMuted, cursor: "pointer",
              }}>{item}</button>
            ))}
          </div>
        )}

        {/* Input bar */}
        <div className="chat-input-wrap" style={{ borderTop: `1px solid ${C.border}`, background: C.surface }}>
          {attachedImage && (
            <div style={{
              marginBottom: 12, display: "flex", alignItems: "center",
              justifyContent: "space-between", gap: 14, padding: 12,
              borderRadius: 16, background: C.card, border: `1px solid ${C.borderHi}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                <img src={attachedImagePreview} alt="preview" style={{
                  width: 52, height: 52, objectFit: "cover",
                  borderRadius: 12, border: `1px solid ${C.border}`,
                }} />
                <div>
                  <div style={{ fontWeight: 700 }}>Disease image attached</div>
                  <div style={{ fontSize: 12, color: C.textMuted }}>{attachedImage.name}</div>
                </div>
              </div>
              <button onClick={clearAttachedImage} style={{
                padding: "9px 12px", borderRadius: 10,
                border: `1px solid ${C.borderHi}`, background: "transparent",
                color: C.textMuted, cursor: "pointer",
              }}>Remove</button>
            </div>
          )}

          <input ref={fileInputRef} type="file" accept="image/*"
            onChange={handleImageSelection} style={{ display: "none" }} />

          <div className="chat-composer" style={{
            background: C.card, border: `1px solid ${C.borderHi}`,
          }}>
            <button onClick={() => fileInputRef.current?.click()} disabled={loading}
              style={{
                width: 42, height: 42, borderRadius: 12, cursor: "pointer",
                border: `1px solid ${attachedImage ? `${C.accent}66` : C.borderHi}`,
                background: attachedImage ? C.accentSoft : C.surface,
                color: attachedImage ? C.accent : C.textMuted, fontWeight: 700,
              }}>+</button>

            <textarea value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
              rows={1} placeholder="Ask a question or attach a disease image..."
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                color: C.text, resize: "none", lineHeight: 1.7, maxHeight: 130,
              }} />

            <button onClick={() => send(input)}
              disabled={loading || (!input.trim() && !attachedImage)}
              style={{
                width: 42, height: 42, borderRadius: 12, border: "none",
                cursor: input.trim() || attachedImage ? "pointer" : "default",
                background: input.trim() || attachedImage ? `linear-gradient(135deg, ${C.accent}, #6b5ef7)` : C.border,
                color: "#fff", fontWeight: 700,
              }}>↑</button>
          </div>
          <div style={{ fontSize: 11, color: C.textDim, textAlign: "center", marginTop: 10 }}>
            MediBot can assist but should not replace a licensed doctor.
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
