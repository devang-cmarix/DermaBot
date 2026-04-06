import React from 'react';
import { C } from '../constants/constants';
import Badge from '../components/Badge';

function DocsPage() {

  const quickStart = [
    "Create an account or log in to restore your private MediBot workspace.",
    "Open Chat to ask a medical question and continue the same session for follow-up questions.",
    "Attach an image in Chat when you want help reviewing a visible symptom or disease image.",
    "Use Upload to analyze prescriptions, reports, and PDF or image-based medical documents.",
    "Check History to revisit saved questions and answers from earlier sessions.",
    "Open Analytics to review usage stats, weekly query trends, and topic breakdowns.",
    "Use API SDK if you want to generate API keys and connect MediBot to another app.",
    "Visit Settings to change preferences like theme, notifications, model, and safety reminders.",
  ];

  const pageGuide = [
    {
      title: "Chat",
      color: C.accent,
      description:
        "The main consultation area. You can create private sessions, continue past chats, ask follow-up questions, and send an optional disease image with your message.",
      includes: [
        "New Chat button and saved session list",
        "Conversation memory for follow-up context",
        "Suggested prompt chips when a chat is empty",
        "Image attachment support for visual medical questions",
      ],
    },
    {
      title: "Upload",
      color: C.green,
      description:
        "Used for medical files such as prescriptions, reports, and PDFs. MediBot extracts text from the file, shows the query used, and explains the result.",
      includes: [
        "Drag-and-drop upload box",
        "Support for JPG, PNG, and PDF files",
        "Extracted text output",
        "Explanation of the uploaded document",
      ],
    },
    {
      title: "History",
      color: C.yellow,
      description:
        "A searchable record of saved conversations. This page helps users quickly find previous questions, answers, and related session titles.",
      includes: [
        "Search bar for old questions and answers",
        "Saved session title and date",
        "Question and answer review cards",
      ],
    },
    {
      title: "Analytics",
      color: C.accent,
      description:
        "Shows usage insights for the logged-in user. It helps track activity, query volume, and the types of topics discussed over time.",
      includes: [
        "Statistics cards",
        "Weekly query chart",
        "Topic breakdown percentages",
      ],
    },
    {
      title: "API SDK",
      color: C.green,
      description:
        "Built for developers who want to integrate MediBot into another product. Users can generate API keys and review sample code for multiple environments.",
      includes: [
        "API key creation and revocation",
        "Python, JavaScript, and cURL examples",
        "Integration-ready developer section",
      ],
    },
    {
      title: "Docs",
      color: C.yellow,
      description:
        "This page. It explains what MediBot is, how to use it properly, and what each area of the application is designed for.",
      includes: [
        "Product overview",
        "Quick start instructions",
        "Page-by-page feature guide",
      ],
    },
    {
      title: "Settings",
      color: C.accent,
      description:
        "The account and product preference area. It lets users manage saved settings, choose a model, review backend info, and read the project overview.",
      includes: [
        "Dark mode and notification toggles",
        "Auto-save and disclaimer settings",
        "Model selection",
        "Backend and project information",
      ],
    },
  ];

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "32px 40px", display: "flex", flexDirection: "column", gap: 32 }}>
      <div>
        <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 32, marginBottom: 8 }}>MediBot Documentation</div>
        <div style={{ color: C.textMuted, lineHeight: 1.7, maxWidth: 600 }}>
          MediBot is an AI-powered medical assistant that helps users understand health information through natural conversations. It maintains conversation memory, supports image analysis for visual symptoms, and provides document analysis for prescriptions and reports.
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Badge color={C.green}>MongoDB Sessions</Badge>
        <Badge color={C.yellow}>RAG Pipeline</Badge>
        <Badge color={C.accent}>Vision Analysis</Badge>
        <Badge color={C.green}>OCR Processing</Badge>
        <Badge color={C.yellow}>API Integration</Badge>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 24 }}>
        <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, marginBottom: 16 }}>Quick Start</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {quickStart.map((step, index) => (
            <div key={index} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ fontWeight: 700, color: C.accent, flexShrink: 0 }}>{index + 1}.</div>
              <div style={{ color: C.textMuted, lineHeight: 1.6 }}>{step}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 24 }}>
        <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, marginBottom: 16 }}>Page Guide</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
          {pageGuide.map((page) => (
            <div key={page.title} style={{ border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
              <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, color: page.color, marginBottom: 8 }}>{page.title}</div>
              <div style={{ color: C.textMuted, lineHeight: 1.6, marginBottom: 12 }}>{page.description}</div>
              <div style={{ fontSize: 12, color: C.textDim, fontWeight: 700, marginBottom: 8 }}>Includes:</div>
              <ul style={{ margin: 0, paddingLeft: 16, color: C.textMuted, lineHeight: 1.5 }}>
                {page.includes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 24 }}>
        <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, marginBottom: 16 }}>Important Notes</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ color: C.red, fontWeight: 700 }}>⚠️ Medical Disclaimer</div>
          <div style={{ color: C.textMuted, lineHeight: 1.7 }}>
            MediBot is designed to provide general health information and assist with understanding medical content. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare providers for medical concerns.
          </div>
          <div style={{ color: C.yellow, fontWeight: 700 }}>🔒 Privacy & Security</div>
          <div style={{ color: C.textMuted, lineHeight: 1.7 }}>
            All conversations are stored securely in MongoDB with user isolation. API keys are hashed and never stored in plain text. Image uploads are processed temporarily and not permanently stored.
          </div>
          <div style={{ color: C.green, fontWeight: 700 }}>🚀 Technical Stack</div>
          <div style={{ color: C.textMuted, lineHeight: 1.7 }}>
            Built with React frontend, FastAPI backend, MongoDB for sessions, FAISS for vector search, and integrated with vision models for image analysis. Supports multiple LLM providers through a unified interface.
          </div>
        </div>
      </div>
    </div>
  );
}

export default DocsPage;