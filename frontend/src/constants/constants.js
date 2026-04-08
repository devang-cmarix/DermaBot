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
  chat:      { title: "MediBot",   subtitle: "Clinical conversations, image review, and session memory in one workspace" },
  upload:    { title: "Uploads",   subtitle: "Turn prescriptions, scans, and reports into structured analysis" },
  history:   { title: "History",   subtitle: "Search previous consultations and revisit saved answers" },
  analytics: { title: "Analytics", subtitle: "Usage trends, response volume, and workspace activity" },
  api_sdk:   { title: "API SDK",   subtitle: "Integrate MediBot into product flows and internal tooling" },
  docs:      { title: "Docs",      subtitle: "Guides, workflows, and product reference" },
  settings:  { title: "Settings",  subtitle: "Profile, notifications, appearance, and safeguards" },
  plans:     { title: "Plans",     subtitle: "Review access tiers and platform capabilities" },
};

export const NAV = [
  { id: "chat", icon: "CH", label: "Chat" },
  { id: "upload", icon: "UP", label: "Upload" },
  { id: "history", icon: "HI", label: "History" },
  { id: "analytics", icon: "AN", label: "Analytics" },
  { id: "api_sdk", icon: "API", label: "API SDK" },
  { id: "docs", icon: "DOC", label: "Docs" },
  { id: "settings", icon: "SET", label: "Settings" },
];
