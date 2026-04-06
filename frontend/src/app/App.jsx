import React, { useState, useEffect } from 'react';
import { C, PAGE_META } from '../constants/constants';
import { TOKEN_KEY, USER_KEY } from '../config/client';
import { apiFetch } from '../lib/api';
import AuthScreen from '../pages/AuthScreen';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import ChatPage from '../pages/ChatPage';
import UploadPage from '../pages/UploadPage';
import HistoryPage from '../pages/HistoryPage';
import AnalyticsPage from '../pages/AnalyticsPage';
import ApiSdkPage from '../pages/ApiSdkPage';
import DocsPage from '../pages/DocsPage';
import SettingsPage from '../pages/SettingsPage';
import PlansPage from '../pages/PlansPage';

export default function App() {
  // Clean up corrupted localStorage data
  // Add this at the TOP of your App component, before any other useEffect
  useEffect(() => {
      if (window.location.pathname === "/auth-success") {
          const params = new URLSearchParams(window.location.search);
          const token = params.get("token");
          if (token) {
              fetch("/api/auth/me", {
                  headers: { Authorization: `Bearer ${token}` }
              })
              .then(res => res.json())
              .then(data => {
                  localStorage.setItem("medibot_token", token);
                  localStorage.setItem("medibot_user", JSON.stringify(data.user));
                  setToken(token);
                  setUser(data.user);
                  window.history.replaceState({}, "", "/");
                  setBooting(false);
              })
              .catch(() => {
                  window.history.replaceState({}, "", "/");
                  setBooting(false);
              });
          } else {
              window.history.replaceState({}, "", "/");
              setBooting(false);
          }
          return;
      }
  }, []); // runs once on mount

  useEffect(() => {
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedUser === "undefined") {
      localStorage.removeItem(USER_KEY);
    }
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (storedToken === "undefined") {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, []);

  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored && stored !== "undefined" ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [page, setPage] = useState("chat");
  const [collapsed, setCollapsed] = useState(false);
  const [settings, setSettings] = useState(null);
  const [booting, setBooting] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));

  // ✅ Restore session on page refresh
  useEffect(() => {
    if (!token) { setBooting(false); return; }
    apiFetch("/auth/me", {}, token)
      .then((data) => {
        setUser(data.user);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken("");
        setUser(null);
      })
      .finally(() => setBooting(false));
  }, [token]);

  // ✅ Load settings after login
  useEffect(() => {
    if (!user || !token) return;
    apiFetch("/settings", {}, token)
      .then((data) => setSettings(data))
      .catch(() => {});
  }, [user, token]);

  const onAuthenticated = (data) => {
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    setPage("chat");
  };

  const onLogout = async () => {
    try {
      if (token) await apiFetch("/auth/logout", { method: "POST" }, token);
    } catch (_) {}
    finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setToken("");
      setUser(null);
      setSettings(null);
    }
  };

  const onSettingsSaved = (newSettings) => setSettings(newSettings);

  const onUserUpdated = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
  };

  useEffect(() => {
    if (settings?.darkMode !== undefined) {
      document.documentElement.dataset.theme = settings.darkMode ? 'dark' : 'light';
    }
  }, [settings?.darkMode]);

  if (booting) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center",
        background: C.bg, color: C.textMuted }}>
        Restoring your MediBot session...
      </div>
    );
  }

  if (!token || !user) {
    return <AuthScreen onAuthenticated={onAuthenticated} />;
  }

  const renderPage = () => {
    switch (page) {
      case "chat":      return <ChatPage token={token} notificationsEnabled={Boolean(settings?.notifications)} />;
      case "upload":    return <UploadPage token={token} />;
      case "history":   return <HistoryPage token={token} />;
      case "analytics": return <AnalyticsPage token={token} />;
      case "api_sdk":   return <ApiSdkPage token={token} />;
      case "docs":      return <DocsPage />;
      case "settings":  return <SettingsPage token={token} user={user} initialSettings={settings} onSettingsSaved={onSettingsSaved} onUserUpdated={onUserUpdated} />;
      case "plans":     return <PlansPage />;
      default:          return <ChatPage token={token} notificationsEnabled={Boolean(settings?.notifications)} />;
    }
  };

  return (
    <div style={{ height: "100vh", display: "flex", background: C.bg, color: C.text }}>
      <Sidebar page={page} setPage={setPage} collapsed={collapsed}
        setCollapsed={setCollapsed} user={user} onLogout={onLogout} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Topbar title={PAGE_META[page]?.title} subtitle={PAGE_META[page]?.subtitle} />
        {renderPage()}
      </div>
    </div>
  );
}
