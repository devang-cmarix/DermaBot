// constants/constants.js
export const C = {
  bg:         "var(--app-bg)",
  surface:    "var(--app-surface)",
  card:       "var(--app-card)",
  border:     "var(--app-border)",
  borderHi:   "var(--app-border-hi)",
  accent:     "var(--app-accent)",
  accentSoft: "var(--app-accent-soft)",
  accentGlow: "var(--app-accent-glow)",
  green:      "var(--app-green)",
  greenSoft:  "var(--app-green-soft)",
  red:        "var(--app-red)",
  redSoft:    "var(--app-red-soft)",
  yellow:     "var(--app-yellow)",
  yellowSoft: "var(--app-yellow-soft)",
  text:       "var(--app-text)",
  textMuted:  "var(--app-text-muted)",
  textDim:    "var(--app-text-dim)",
};

export const PAGE_META = {
  chat:      { title: "Chat",      subtitle: "Continue saved consultations with session memory" },
  upload:    { title: "Upload",    subtitle: "Analyze prescriptions and reports" },
  history:   { title: "History",   subtitle: "Your past conversations" },
  analytics: { title: "Analytics", subtitle: "Usage insights & statistics" },
  api_sdk:   { title: "API SDK",   subtitle: "Integrate MediBot into your applications" },
  docs:      { title: "Docs",      subtitle: "Use cases and documentation" },
  settings:  { title: "Settings",  subtitle: "Configure your assistant" },
  plans:     { title: "Plans",     subtitle: "Choose your subscription plan" },
};

export const NAV = [
  { id: "chat", icon: "💬", label: "Chat" },
  { id: "upload", icon: "📋", label: "Upload" },
  { id: "history", icon: "🕐", label: "History" },
  { id: "analytics", icon: "📊", label: "Analytics" },
  // { id: "plans", icon: "💰", label: "Plans" },
  { id: "api_sdk", icon: "🔧", label: "API SDK" },
  { id: "docs", icon: "📖", label: "Docs" },
  { id: "settings", icon: "⚙️", label: "Settings" },
];