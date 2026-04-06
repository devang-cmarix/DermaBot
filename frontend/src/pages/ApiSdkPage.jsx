import React, { useState, useEffect, useCallback } from 'react';
import { C } from '../constants/constants';
import Panel from '../components/Panel';
import CodePanel from '../components/CodePanel';

function ApiSdkPage({ token }) {
  const [sdk, setSdk] = useState(null);
  const [apiKeys, setApiKeys] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [keyName, setKeyName] = useState("Production App");
  const [revealedKey, setRevealedKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const refreshDeveloperData = useCallback(async () => {
    try {
      const [sdkRes, keysRes, sessionsRes] = await Promise.all([
        fetch("/api/api_sdk",            { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/developer/api-keys", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/sessions",           { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const sdkData      = await sdkRes.json();
      const keysData     = await keysRes.json();
      const sessionsData = await sessionsRes.json();

      setSdk(sdkData);
      setApiKeys(keysData.api_keys || []);
      const sessionList = sessionsData.sessions || [];
      setSessions(sessionList);
      setSelectedSessionId(prev =>
        prev || (sessionList.length ? sessionList[0].id : "")
      );
    } catch (err) {
      setError("Failed to load developer data.");
    }
    setLoading(false);
  }, [token]);  // ← removed selectedSessionId from deps to avoid loop

  useEffect(() => {
    if (token) refreshDeveloperData();
  }, [token, refreshDeveloperData]);

  const createKey = async () => {
    setCreating(true);
    try {
      const response = await fetch("/api/developer/api-keys", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: keyName }),
      });
      const data = await response.json();
      if (response.ok) {
        setRevealedKey(data.api_key?.token || data.key || "");
        refreshDeveloperData();
      } else {
        setError(data.detail || "Failed to create key");
      }
    } catch (err) {
      setError("Network error");
    }
    setCreating(false);
  };

  const revokeKey = async (keyId) => {
    try {
      await fetch(`/api/developer/api-keys/${keyId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      refreshDeveloperData();
    } catch (err) {
      setError("Failed to revoke key");
    }
  };

  if (loading && !sdk) return (
    <div style={{ padding: 40, color: C.textMuted }}>Loading developer portal...</div>
  );

  const sessionId = selectedSessionId || sdk?.sample_session_id || "YOUR_SESSION_ID";
  const apiKey    = revealedKey || "YOUR_API_KEY";
  const baseUrl   = sdk?.base_url || "https://nonconfident-stapedial-cherrie.ngrok-free.dev";

  const pythonCode     = (sdk?.python     || "").replace("YOUR_API_KEY", apiKey).replace("BASE_URL_PLACEHOLDER", baseUrl);
  const javascriptCode = (sdk?.javascript || "").replace("YOUR_API_KEY", apiKey).replace("BASE_URL_PLACEHOLDER", baseUrl);
  const curlCode       = (sdk?.curl       || "").replace("YOUR_API_KEY", apiKey).replace("SESSION_ID", sessionId).replace("BASE_URL_PLACEHOLDER", baseUrl);

  const copy = (text) => {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text);
  } else {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
};
  return (
    <div className="page-shell page-stack" style={{ gap: 22 }}>
      {error && (
        <div style={{ color: C.red, background: `${C.red}12`, border: `1px solid ${C.red}33`, padding: "12px 16px", borderRadius: 12 }}>
          {error}
        </div>
      )}

      {/* Getting Started */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 28 }}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>🚀 Getting Started</div>
        <div style={{ color: C.textMuted, fontSize: 13, marginBottom: 24 }}>
          3 steps to integrate MediBot into your application
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { step: "01", color: C.accent,  title: "Generate an API Key",  desc: 'Enter a name and click "Create API Key" below. Copy it immediately — it\'s shown only once.' },
            { step: "02", color: C.green,   title: "Pick a Session ID",    desc: "Select one of your existing sessions below. It will auto-fill in the code examples." },
            { step: "03", color: C.yellow,  title: "Call the API",         desc: "Use your key and session ID in any language. Copy the code example below and run it." },
          ].map(({ step, color, title, desc }) => (
            <div key={step} style={{
              display: "flex", gap: 18,
              background: C.surface, borderRadius: 14, padding: "16px 20px",
              border: `1px solid ${color}33`, borderLeft: `3px solid ${color}`,
            }}>
              <div style={{ fontFamily: "monospace", fontSize: 24, fontWeight: 800, color: `${color}55`, flexShrink: 0, width: 32 }}>
                {step}
              </div>
              <div>
                <div style={{ fontWeight: 700, color, fontSize: 14, marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* API info + Create key */}
      <div className="page-grid page-grid-two">
        <Panel title="Production API" subtitle="Base URL for all requests">
          <div style={{
            background: C.surface, border: `1px solid ${C.borderHi}`,
            borderRadius: 12, padding: 14, fontFamily: "monospace",
            wordBreak: "break-all", color: C.text,
          }}>
            {baseUrl}
          </div>
          <div style={{ color: C.textMuted, lineHeight: 1.7, fontSize: 13 }}>
            Authenticate with <code style={{ background: C.surface, padding: "2px 6px", borderRadius: 4 }}>X-API-Key</code> header.
            Each request needs a <code style={{ background: C.surface, padding: "2px 6px", borderRadius: 4 }}>session_id</code> to maintain conversation context.
          </div>
        </Panel>

        <Panel title="Create API Key" subtitle="Generate a key for your app or script">
          <input
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            placeholder="e.g. My Clinic App"
            style={{
              background: C.surface, border: `1px solid ${C.borderHi}`,
              borderRadius: 12, padding: "13px 14px", color: C.text,
              outline: "none", width: "100%",
            }}
          />
          <button onClick={createKey} disabled={creating} style={{
            padding: "13px 16px", borderRadius: 12, border: "none",
            cursor: "pointer", width: "100%",
            background: `linear-gradient(135deg, ${C.accent}, #6b5ef7)`,
            color: "#fff", fontWeight: 700,
          }}>
            {creating ? "Creating..." : "+ Create API Key"}
          </button>
          {revealedKey && (
            <div style={{
              background: `${C.yellow}14`, border: `1px solid ${C.yellow}44`,
              borderRadius: 12, padding: 14,
            }}>
              <div style={{ fontWeight: 700, color: C.yellow, marginBottom: 8 }}>
                ⚠️ Copy this now — shown only once
              </div>
              <div style={{ fontFamily: "monospace", wordBreak: "break-all", fontSize: 13 }}>
                {revealedKey}
              </div>
              <button onClick={() => {copy(revealedKey); alert("Copied!");}} style={{
                marginTop: 10, padding: "8px 14px", borderRadius: 8,
                border: `1px solid ${C.yellow}44`, background: `${C.yellow}22`,
                color: C.yellow, cursor: "pointer", fontWeight: 700, fontSize: 12,
              }}>
                📋 Copy Key
              </button>
            </div>
          )}
        </Panel>
      </div>

      {/* Session picker */}
      <Panel title="Pick a Session ID" subtitle="Select a session to use in the code examples below">
        {sessions.length === 0 ? (
          <div style={{ color: C.textMuted, fontSize: 13 }}>
            No sessions yet. Go to <strong style={{ color: C.accent }}>Chat</strong> and start a conversation first.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sessions.map((s) => (
              <div key={s.id} onClick={() => setSelectedSessionId(s.id)} style={{
                padding: "12px 16px", borderRadius: 12, cursor: "pointer",
                border: `1px solid ${selectedSessionId === s.id ? C.accent : C.border}`,
                background: selectedSessionId === s.id ? C.accentSoft : C.surface,
                transition: "all .15s", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap",
              }}>
                <div>
                  <div style={{ fontWeight: 700, color: selectedSessionId === s.id ? C.accent : C.text }}>
                    {s.title}
                  </div>
                  <div style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace", marginTop: 2 }}>
                    {s.id}
                  </div>
                </div>
                {selectedSessionId === s.id && <span style={{ color: C.accent }}>✓</span>}
              </div>
            ))}
          </div>
        )}
        {selectedSessionId && (
          <button onClick={() => navigator.clipboard.writeText(selectedSessionId)} style={{
            alignSelf: "flex-start", padding: "9px 16px", borderRadius: 10,
            border: `1px solid ${C.accent}44`, background: C.accentSoft,
            color: C.accent, cursor: "pointer", fontWeight: 700, fontSize: 13,
          }}>
            📋 Copy Session ID
          </button>
        )}
      </Panel>

      {/* Your API keys */}
      <Panel title="Your API Keys" subtitle="Stored masked after creation">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {(apiKeys || []).map((apiKey) => (
            <div key={apiKey.id} style={{
              display: "flex", justifyContent: "space-between", gap: 16,
              padding: "14px 16px", borderRadius: 12,
              background: C.surface, border: `1px solid ${C.border}`, flexWrap: "wrap",
            }}>
              <div>
                <div style={{ fontWeight: 700 }}>{apiKey.name}</div>
                <div style={{ color: C.textMuted, fontSize: 12, marginTop: 4 }}>
                  {apiKey.masked_key} · Created {new Date(apiKey.created_at).toLocaleString()}
                </div>
                <div style={{ color: C.textMuted, fontSize: 12, marginTop: 2 }}>
                  Last used: {apiKey.last_used_at ? new Date(apiKey.last_used_at).toLocaleString() : "Never"}
                </div>
              </div>
              <button onClick={() => revokeKey(apiKey.id)} disabled={apiKey.revoked} style={{
                alignSelf: "center", padding: "10px 14px", borderRadius: 10,
                border: `1px solid ${apiKey.revoked ? C.border : `${C.red}33`}`,
                background: apiKey.revoked ? C.card : `${C.red}12`,
                color: apiKey.revoked ? C.textMuted : C.red,
                cursor: apiKey.revoked ? "default" : "pointer", fontWeight: 700,
              }}>
                {apiKey.revoked ? "Revoked" : "Revoke"}
              </button>
            </div>
          ))}
          {!apiKeys.length && (
            <div style={{ color: C.textMuted, fontSize: 13 }}>No API keys created yet.</div>
          )}
        </div>
      </Panel>

      {/* Code examples */}
      <div className="page-grid page-grid-two">
        <CodePanel title="Python SDK"     color={C.green}  code={pythonCode} />
        <CodePanel title="JavaScript SDK" color={C.yellow} code={javascriptCode} />
      </div>
      <CodePanel title="cURL Example" color={C.accent} code={curlCode} />
    </div>
  );
}

export default ApiSdkPage;
