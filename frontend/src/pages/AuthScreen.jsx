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
      className="auth-shell"
      style={{
        background:
          "radial-gradient(circle at 18% 18%, rgba(15,118,110,0.12), transparent 30%), radial-gradient(circle at 82% 20%, rgba(23,114,69,0.1), transparent 28%), linear-gradient(180deg, rgba(245,247,244,0.98), rgba(239,243,239,0.98))",
      }}
    >
      <div
        className="fade-up auth-panel"
        style={{
          background: "rgba(255,255,255,0.78)",
          border: `1px solid ${C.borderHi}`,
          boxShadow: "0 28px 80px rgba(17, 23, 20, 0.12)",
          backdropFilter: "blur(18px)",
        }}
      >
        <div style={{ padding: "clamp(24px, 5vw, 56px)", display: "flex", flexDirection: "column", gap: 32, justifyContent: "center", background: "linear-gradient(180deg, rgba(255,255,255,0.65), rgba(245,247,244,0.7))" }}>
<div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
    <div style={{
        width: 42, height: 42, borderRadius: 14,
        background: `linear-gradient(180deg, ${C.text}, ${C.accent})`,
        color: "#fff",
        display: "grid", placeItems: "center", fontSize: 13, fontWeight: 800, letterSpacing: 0.8,
    }}>MB</div>
    <div style={{ fontWeight: 800, fontSize: 20 }}>
        MediBot
    </div>
</div>
          <Badge color={C.green}>Secure memory workspace</Badge>
          <div>
            <div style={{ fontSize: 46, fontWeight: 800, lineHeight: 1.02, letterSpacing: -1.4 }}>
              A cleaner clinical workspace for every conversation.
            </div>
            <div style={{ color: C.textMuted, marginTop: 18, lineHeight: 1.7, maxWidth: 540, fontSize: 17 }}>
              Sign in to review symptoms, attach images, continue follow-up questions, and keep your consultation history attached to your account.
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18, marginTop: 18 }}>
            {[
              ["Private sessions", "Each account gets isolated conversations and session memory."],
              ["Image analysis", "Attach disease photos and review them inside the same thread."],
              ["Saved history", "Past consultations remain searchable after login."],
              ["Focused workflow", "One professional workspace for chat, docs, uploads, and settings."],
            ].map(([title, text]) => (
              <div
                key={title}
                style={{
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: 24,
                  padding: 22,
                  minHeight: 90,
                  boxShadow: "0 14px 30px rgba(17, 23, 20, 0.04)",
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 16 }}>{title}</div>
                <div style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>{text}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "clamp(24px, 5vw, 48px)", background: "linear-gradient(180deg, rgba(252,253,252,0.94), rgba(245,247,244,0.94))", display: "flex", flexDirection: "column", justifyContent: "center", minHeight: 480 }}>
          <div style={{ display: "flex", gap: 14, marginBottom: 32 }}>
            {["login", "register"].map((value) => (
              <button
                key={value}
                onClick={() => setMode(value)}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: 16,
                  border: "none",
                  cursor: "pointer",
                  background: mode === value ? C.text : C.card,
                  color: mode === value ? "#fff" : C.textMuted,
                  fontWeight: 800,
                  boxShadow: mode === value ? "0 12px 24px rgba(17, 23, 20, 0.12)" : "none",
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
                borderRadius: 16,
                border: "none",
                cursor: "pointer",
                background: C.text,
                color: "#fff",
                fontWeight: 800,
                boxShadow: "0 16px 28px rgba(17, 23, 20, 0.18)",
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
        width: "100%", padding: "13px 18px", borderRadius: 16,
        border: "1px solid var(--app-border)",
        background: "var(--app-card)",
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
