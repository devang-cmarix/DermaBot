import React, { useEffect, useRef, useState } from 'react';
import { C } from '../constants/constants';
import { apiFetch } from '../lib/api';
import Avatar from '../components/Avatar';

function formatMessageTime(value) {
  if (!value) {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function normalizeMessage(message) {
  return {
    ...message,
    role: message.role === 'assistant' ? 'bot' : message.role,
    text: message.text || message.content || '',
    image_url: message.image_url || null,
    time: formatMessageTime(message.time || message.created_at),
  };
}

function ChatPage({ token, notificationsEnabled = false }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [notice, setNotice] = useState('');
  const [attachedImage, setAttachedImage] = useState(null);
  const [attachedImagePreview, setAttachedImagePreview] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 820 : false
  );
  const [showSessions, setShowSessions] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth > 820 : true
  );
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const userAwayRef = useRef(false);
  const user = JSON.parse(localStorage.getItem('medibot_user'));

  useEffect(() => {
    if (!token) return;

    apiFetch('/sessions', {}, token)
      .then((data) => {
        const list = data.sessions || [];
        setSessions(list);
        if (list.length) setActiveSessionId(list[0].id);
      })
      .catch(() => {});

    apiFetch('/suggestions', {}, token)
      .then((data) => setSuggestions(data.suggestions || []))
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!activeSessionId || !token) return;
    apiFetch(`/sessions/${activeSessionId}/messages`, {}, token)
      .then((data) => setMessages((data.messages || []).map(normalizeMessage)))
      .catch(() => {});
  }, [activeSessionId, token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = '0px';
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 168)}px`;
  }, [input]);

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;

    const updateAwayState = () => {
      const pageHidden = document.visibilityState !== 'visible';
      const pageUnfocused = typeof document.hasFocus === 'function' ? !document.hasFocus() : false;
      userAwayRef.current = pageHidden || pageUnfocused;
    };

    updateAwayState();
    document.addEventListener('visibilitychange', updateAwayState);
    window.addEventListener('blur', updateAwayState);
    window.addEventListener('focus', updateAwayState);

    return () => {
      document.removeEventListener('visibilitychange', updateAwayState);
      window.removeEventListener('blur', updateAwayState);
      window.removeEventListener('focus', updateAwayState);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const onResize = () => {
      const mobile = window.innerWidth <= 820;
      setIsMobile(mobile);
      setShowSessions((prev) => (mobile ? prev : true));
    };

    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const clearAttachedImage = () => {
    setAttachedImage(null);
    setAttachedImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const notifyIfNeeded = (messageText) => {
    if (!notificationsEnabled) return;
    if (typeof document === 'undefined' || typeof window === 'undefined') return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    if (!userAwayRef.current) return;

    const body = (messageText || 'Your MediBot response is ready.').slice(0, 140);
    new Notification('MediBot response completed', {
      body,
      tag: 'medibot-response-ready',
      requireInteraction: true,
    });
  };

  const handleImageSelection = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAttachedImage(file);
    const reader = new FileReader();
    reader.onload = (loadEvent) => setAttachedImagePreview(loadEvent.target.result);
    reader.readAsDataURL(file);
  };

  const createNewChat = async () => {
    try {
      const data = await apiFetch('/sessions', {
        method: 'POST',
        body: JSON.stringify({ title: 'New consultation' }),
      }, token);
      const session = data.session || data;
      setSessions((prev) => [session, ...prev]);
      setActiveSessionId(session.id);
      setMessages([]);
      setNotice('');
      if (isMobile) setShowSessions(false);
    } catch (error) {
      setNotice(error.message);
    }
  };

  const deleteSession = async (sessionId, event) => {
    event.stopPropagation();

    if (confirmDeleteId !== sessionId) {
      setConfirmDeleteId(sessionId);
      setTimeout(() => setConfirmDeleteId(null), 3000);
      return;
    }

    setConfirmDeleteId(null);
    try {
      await apiFetch(`/sessions/${sessionId}`, { method: 'DELETE' }, token);
      setSessions((prev) => prev.filter((session) => session.id !== sessionId));
      if (activeSessionId === sessionId) {
        setActiveSessionId('');
        setMessages([]);
      }
      setNotice('Session deleted.');
    } catch (error) {
      setNotice(error.message);
    }
  };

  const send = async (text) => {
    if (!text.trim() && !attachedImage) return;

    let sessionId = activeSessionId;
    const trimmed = text.trim();

    if (!sessionId) {
      try {
        const data = await apiFetch('/sessions', {
          method: 'POST',
          body: JSON.stringify({ title: (trimmed || 'Image review').slice(0, 40) }),
        }, token);
        const session = data.session || data;
        setSessions((prev) => [session, ...prev]);
        setActiveSessionId(session.id);
        sessionId = session.id;
      } catch (error) {
        setNotice(error.message);
        return;
      }
    }

    const userMessage = normalizeMessage({
      role: 'user',
      text: trimmed || 'Please review this disease image.',
      image_url: attachedImage ? attachedImagePreview : null,
      time: new Date().toISOString(),
    });

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setNotice('');
    if (isMobile) setShowSessions(false);

    try {
      if (attachedImage) {
        const formData = new FormData();
        formData.append('file', attachedImage);
        formData.append('session_id', sessionId);
        if (trimmed) formData.append('question', trimmed);

        const data = await apiFetch('/vision', {
          method: 'POST',
          body: formData,
        }, token);

        const botMessage = normalizeMessage({
          role: 'bot',
          text: data.analysis || data.answer,
          time: new Date().toISOString(),
        });
        setMessages((prev) => [...prev, botMessage]);
        notifyIfNeeded(botMessage.text);
        clearAttachedImage();
      } else {
        const data = await apiFetch('/ask', {
          method: 'POST',
          body: JSON.stringify({ question: trimmed, session_id: sessionId }),
        }, token);

        const botMessage = normalizeMessage(data.assistant_message || {
          role: 'bot',
          text: data.answer,
          time: new Date().toISOString(),
        });
        setMessages((prev) => [...prev, botMessage]);
        notifyIfNeeded(botMessage.text);

        const sessionsData = await apiFetch('/sessions', {}, token);
        setSessions(sessionsData.sessions || []);
      }
    } catch (error) {
      setMessages((prev) => [...prev, normalizeMessage({
        role: 'bot',
        text: error.message,
        time: new Date().toISOString(),
      })]);
    } finally {
      setLoading(false);
    }
  };

  const sessionCountLabel = `${sessions.length} saved ${sessions.length === 1 ? 'session' : 'sessions'}`;
  const suggestionPool = suggestions.length ? suggestions : [
    'Summarize the likely condition from these symptoms.',
    'Review this skin image and suggest next questions.',
    'Explain the prescription in simple language.',
    'Give a safe follow-up checklist for this case.',
  ];

  return (
    <div className="chat-shell">
      {(!isMobile || showSessions) && (
        <aside
          className="chat-sessions"
          style={{
            borderRight: isMobile ? '1px solid transparent' : `1px solid ${C.border}`,
            borderBottom: isMobile ? `1px solid ${C.border}` : '1px solid transparent',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: 18, borderRadius: 22, background: C.card, border: `1px solid ${C.border}`, boxShadow: "0 12px 28px rgba(17, 23, 20, 0.05)" }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: C.textMuted }}>THREADS</div>
                  <div style={{ marginTop: 4, fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>Conversations</div>
                </div>
                <div style={{ padding: '8px 10px', borderRadius: 999, background: C.accentSoft, color: C.accent, fontSize: 11, fontWeight: 800 }}>
                  {sessionCountLabel}
                </div>
              </div>
              <div style={{ marginTop: 10, color: C.textMuted, fontSize: 13, lineHeight: 1.6 }}>
                Start a new consultation or reopen a previous one with full context.
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                <button className="button-solid" onClick={createNewChat} style={{ flex: 1, minWidth: 140 }}>
                  New chat
                </button>
                {isMobile && (
                  <button className="button-ghost" type="button" onClick={() => setShowSessions(false)}>
                    Hide
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
              {[
                ['Images', attachedImage ? '1 attached' : 'Ready'],
                ['Alerts', notificationsEnabled ? 'On' : 'Off'],
              ].map(([label, value]) => (
                <div key={label} style={{ padding: 14, borderRadius: 18, border: `1px solid ${C.border}`, background: C.card }}>
                  <div style={{ fontSize: 12, color: C.textMuted }}>{label}</div>
                  <div style={{ marginTop: 4, fontWeight: 800 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 18, marginBottom: 10, fontSize: 11, fontWeight: 800, letterSpacing: 1, color: C.textMuted }}>
            RECENT
          </div>

          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              paddingRight: 6,
              scrollbarGutter: 'stable',
            }}
          >
            {(sessions || []).map((session) => {
              const isActive = activeSessionId === session.id;
              return (
                <div key={session.id} style={{ position: 'relative' }}>
                  <button
                    onClick={() => {
                      setActiveSessionId(session.id);
                      if (isMobile) setShowSessions(false);
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '14px 40px 14px 14px',
                      borderRadius: 18,
                      border: `1px solid ${isActive ? `${C.accent}2f` : C.border}`,
                      background: isActive ? C.accentSoft : C.card,
                      color: C.text,
                    }}
                  >
                    <div style={{ fontWeight: 700, paddingRight: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {session.title}
                    </div>
                    <div style={{ marginTop: 4, fontSize: 12, color: isActive ? C.accent : C.textMuted }}>
                      {new Date(session.updated_at).toLocaleString()}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={(event) => deleteSession(session.id, event)}
                    title="Delete chat session"
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 10,
                      minWidth: 22,
                      height: 22,
                      padding: '0 6px',
                      borderRadius: 999,
                      border: 'none',
                      background: confirmDeleteId === session.id ? `${C.red}18` : 'transparent',
                      color: confirmDeleteId === session.id ? C.red : C.textDim,
                      fontSize: 11,
                      fontWeight: 800,
                    }}
                  >
                    {confirmDeleteId === session.id ? 'DEL' : 'X'}
                  </button>
                </div>
              );
            })}

            {!sessions.length && (
              <div style={{ padding: 18, borderRadius: 18, background: C.card, border: `1px dashed ${C.borderHi}`, color: C.textMuted, lineHeight: 1.6 }}>
                No saved sessions yet. Start a conversation and it will appear here automatically.
              </div>
            )}
          </div>
        </aside>
      )}

      {(!isMobile || !showSessions) && (
      <section className="chat-main">
        {isMobile && !showSessions && (
          <div style={{ padding: '14px 16px 0' }}>
            <button className="button-ghost" type="button" onClick={() => setShowSessions(true)}>
              View sessions
            </button>
          </div>
        )}

        <div className="chat-messages">
          {!messages.length && (
            <div className="fade-up" style={{ padding: 28, borderRadius: 28, background: C.card, border: `1px solid ${C.border}`, boxShadow: "0 22px 50px rgba(17, 23, 20, 0.05)" }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                <div style={{ width: 48, height: 48, borderRadius: 16, background: C.accentSoft, color: C.accent, display: 'grid', placeItems: 'center', fontWeight: 800 }}>
                  MB
                </div>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.8 }}>How can I help with this case?</div>
                  <div style={{ marginTop: 4, color: C.textMuted }}>
                    Ask about symptoms, medication, lab findings, or attach an image for visual review.
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                {[
                  ['Case summary', 'Turn a scattered description into a concise clinical overview.'],
                  ['Image review', 'Attach a disease image and request a focused interpretation.'],
                  ['Prescription help', 'Explain medication schedules and patient-facing instructions.'],
                  ['Follow-up plan', 'Generate safer next-step questions and red-flag checks.'],
                ].map(([title, text]) => (
                  <button
                    key={title}
                    type="button"
                    onClick={() => send(title === 'Image review' ? 'Review this image and describe the likely condition.' : `Help me with ${title.toLowerCase()}.`)}
                    style={{
                      padding: 18,
                      borderRadius: 20,
                      border: `1px solid ${C.border}`,
                      background: 'transparent',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ fontWeight: 800 }}>{title}</div>
                    <div style={{ marginTop: 6, fontSize: 13, color: C.textMuted, lineHeight: 1.55 }}>{text}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {(messages || []).map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`fade-up chat-message-row${message.role === 'user' ? ' is-user' : ''}`}
            >
              <Avatar
                name={message.role === 'user' ? user?.name : 'MB'}
                size={38}
                color={message.role === 'user' ? C.text : C.accent}
              />
              <div className={`chat-message-content ${message.role === 'user' ? 'is-user' : 'is-bot'}`}>
                <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 700 }}>
                  {message.role === 'user' ? (user?.name || 'You') : 'MediBot'}
                </div>
                <div
                  style={{
                    width: '100%',
                    padding: message.image_url && !message.text ? '12px' : '16px 18px',
                    borderRadius: 24,
                    border: `1px solid ${message.role === 'user' ? C.borderHi : C.border}`,
                    background: message.role === 'user' ? 'rgba(63, 74, 69, 0.88)' : C.card,
                    color: message.role === 'user' ? 'rgba(244, 247, 245, 0.96)' : C.text,
                    boxShadow: message.role === 'user' ? '0 10px 24px rgba(0, 0, 0, 0.14)' : '0 10px 24px rgba(17, 23, 20, 0.04)',
                  }}
                >
                  {message.image_url && (
                    <img
                      src={message.image_url}
                      alt="Uploaded disease"
                      style={{
                        maxWidth: 260,
                        width: '100%',
                        borderRadius: 18,
                        border: `1px solid ${message.role === 'user' ? 'rgba(255,255,255,0.14)' : C.border}`,
                        marginBottom: message.text ? 12 : 0,
                      }}
                    />
                  )}
                  {message.text && !message.text.includes('[Attached disease image') && (
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.75 }}>
                      {message.text.replace('\n\n[Attached disease image for visual analysis]', '').trim()}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 11, color: C.textDim }}>{message.time}</div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="chat-message-row">
              <Avatar name="MB" size={38} color={C.accent} />
              <div className="chat-message-content is-bot">
                <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 700 }}>MediBot</div>
                <div style={{ display: 'flex', gap: 8, padding: '16px 18px', borderRadius: 24, background: C.card, border: `1px solid ${C.border}` }}>
                  {[0, 1, 2].map((dot) => (
                    <span
                      key={dot}
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: C.accent,
                        animation: `pulse 1.1s ease-in-out ${dot * 0.14}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {notice && (
            <div style={{ color: C.red, background: `${C.red}10`, border: `1px solid ${C.red}33`, padding: '12px 14px', borderRadius: 16 }}>
              {notice}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="chat-suggestions">
          {suggestionPool.slice(0, messages.length ? 4 : 6).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => send(item)}
              style={{
                padding: '10px 14px',
                borderRadius: 999,
                border: `1px solid ${C.border}`,
                background: C.card,
                color: C.textMuted,
              }}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="chat-input-wrap" style={{ background: 'transparent' }}>
          {attachedImage && (
            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: 14, borderRadius: 20, background: C.card, border: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <img
                  src={attachedImagePreview}
                  alt="preview"
                  style={{
                    width: 54,
                    height: 54,
                    objectFit: 'cover',
                    borderRadius: 14,
                    border: `1px solid ${C.border}`,
                  }}
                />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800 }}>Image attached</div>
                  <div style={{ fontSize: 12, color: C.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {attachedImage.name}
                  </div>
                </div>
              </div>
              <button className="button-ghost" onClick={clearAttachedImage}>
                Remove
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelection}
            style={{ display: 'none' }}
          />

          <div className="chat-composer">
            <button
              className="button-ghost"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              style={{
                width: 48,
                height: 48,
                padding: 0,
                borderRadius: 16,
                borderColor: attachedImage ? `${C.accent}55` : C.border,
                background: attachedImage ? C.accentSoft : C.surface,
                color: attachedImage ? C.accent : C.textMuted,
                flexShrink: 0,
              }}
            >
              Add
            </button>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  send(input);
                }
              }}
              rows={1}
              placeholder="Message MediBot with symptoms, findings, or next-step questions..."
              style={{
                flex: 1,
                minHeight: 48,
                maxHeight: 168,
                background: 'transparent',
                border: 'none',
                color: C.text,
                lineHeight: 1.7,
                padding: '10px 0',
              }}
            />

            <button
              className="button-solid"
              onClick={() => send(input)}
              disabled={loading || (!input.trim() && !attachedImage)}
              style={{
                width: 48,
                height: 48,
                padding: 0,
                borderRadius: 16,
                opacity: loading || (!input.trim() && !attachedImage) ? 0.45 : 1,
                flexShrink: 0,
              }}
            >
              Send
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 10, flexWrap: 'wrap', fontSize: 12, color: C.textDim }}>
            <span>Enter to send, Shift+Enter for a new line.</span>
            <span>MediBot supports clinical assistance, not final diagnosis.</span>
          </div>
        </div>
      </section>
      )}
    </div>
  );
}

export default ChatPage;
