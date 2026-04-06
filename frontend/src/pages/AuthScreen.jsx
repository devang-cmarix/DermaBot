import React, { useState } from 'react';
import { C } from '../constants/constants';
import Badge from '../components/Badge';
import InputField from '../components/InputField';

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

    const submit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError("");
        try {
            const response = await fetch("/api/auth/" + mode, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await response.json();
            if (response.ok) {
                // ✅ Save token and user to localStorage here
                localStorage.setItem("medibot_token", data.token);
                localStorage.setItem("medibot_user", JSON.stringify(data.user));
                onAuthenticated(data);  // pass full data to App.jsx
            } else {
                setError(data.detail || "Authentication failed");
            }
        } catch (err) {
            setError("Network error. Is the backend running?");
        }
        setLoading(false);
    };
    const handleGoogleLogin = () => {
            window.location.href = "https://nonconfident-stapedial-cherrie.ngrok-free.dev/api/auth/google";
        };
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 32,
        background:
          "radial-gradient(circle at 20% 20%, rgba(79,142,247,0.22), transparent 40%), radial-gradient(circle at 80% 80%, rgba(34,211,160,0.15), transparent 40%), #10131a",
      }}
    >
      <div
        className="fade-up"
        style={{
          width: "100%",
          maxWidth: 1040,
          display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr",
          background: "rgba(24,28,39,0.98)",
          border: `1.5px solid ${C.borderHi}`,
          borderRadius: 32,
          overflow: "hidden",
          boxShadow: "0 12px 48px 0 rgba(44, 62, 80, 0.18)",
        }}
      >
        <div style={{ padding: 56, display: "flex", flexDirection: "column", gap: 32, justifyContent: "center" }}>
<div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
    <div style={{
        width: 40, height: 40, borderRadius: 12,
        background: `linear-gradient(135deg, ${C.accent}, #6b5ef7)`,
        display: "grid", placeItems: "center", fontSize: 20,
    }}>🩺</div>
    <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20 }}>
        MediBot
    </div>
</div>
          <Badge color={C.green}>MongoDB Auth + Memory</Badge>
          <div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 44, fontWeight: 800, lineHeight: 1.08, letterSpacing: -1 }}>
              MediBot now remembers each user's conversations.
            </div>
            <div style={{ color: C.textMuted, marginTop: 18, lineHeight: 1.7, maxWidth: 540, fontSize: 17 }}>
              Sign in to create private chat sessions, continue follow-up questions, and keep your consultation history attached to your account.
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 18, marginTop: 18 }}>
            {[
              ["Private sessions", "Each user gets isolated chats in MongoDB."],
              ["Conversation memory", "Recent messages are reused for follow-up answers."],
              ["Saved history", "Past questions are searchable after login."],
              ["Token auth", "Frontend keeps a secure session token per device."],
            ].map(([title, text]) => (
              <div
                key={title}
                style={{
                  background: C.card,
                  border: `1.5px solid ${C.border}`,
                  borderRadius: 20,
                  padding: 22,
                  minHeight: 90,
                  boxShadow: "0 2px 8px 0 rgba(44, 62, 80, 0.08)",
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 16 }}>{title}</div>
                <div style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>{text}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: 48, background: "linear-gradient(180deg, rgba(24,28,39,0.98), rgba(19,22,30,1))", display: "flex", flexDirection: "column", justifyContent: "center", minHeight: 480 }}>
          <div style={{ display: "flex", gap: 14, marginBottom: 32 }}>
            {["login", "register"].map((value) => (
              <button
                key={value}
                onClick={() => setMode(value)}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: 14,
                  border: "none",
                  cursor: "pointer",
                  background: mode === value ? C.accent : C.card,
                  color: mode === value ? "#fff" : C.textMuted,
                  fontWeight: 700,
                }}
              >
                {value === "login" ? "Login" : "Register"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {mode === "register" && (
              <InputField label="Full name" value={form.name} onChange={(value) => setForm((prev) => ({ ...prev, name: value }))} />
            )}
            <InputField label="Email" type="email" value={form.email} onChange={(value) => setForm((prev) => ({ ...prev, email: value }))} />
            <InputField label="Password" type="password" value={form.password} onChange={(value) => setForm((prev) => ({ ...prev, password: value }))} />
            {error && (
              <div style={{ background: `${C.red}14`, border: `1px solid ${C.red}44`, color: C.red, padding: "12px 14px", borderRadius: 12, fontSize: 13 }}>
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 8,
                padding: "14px 18px",
                borderRadius: 14,
                border: "none",
                cursor: "pointer",
                background: `linear-gradient(135deg, ${C.accent}, #6b5ef7)`,
                color: "#fff",
                fontWeight: 700,
                boxShadow: `0 10px 30px ${C.accentGlow}`,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Please wait..." : mode === "login" ? "Login to MediBot" : "Create account"}
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0" }}>
    <div style={{ flex: 1, height: 1, background: "var(--app-border)" }} />
    <span style={{ color: "var(--app-text-muted)", fontSize: 12 }}>OR</span>
    <div style={{ flex: 1, height: 1, background: "var(--app-border)" }} />
</div>

<button
    type="button"
    onClick={handleGoogleLogin}
    style={{
        width: "100%", padding: "13px 18px", borderRadius: 14,
        border: "1px solid var(--app-border)",
        background: "var(--app-surface)",
        color: "var(--app-text)", fontWeight: 700,
        cursor: "pointer", display: "flex",
        alignItems: "center", justifyContent: "center", gap: 10,
        fontSize: 15,
    }}
>
    <svg width="20" height="20" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
    Continue with Google
</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AuthScreen;