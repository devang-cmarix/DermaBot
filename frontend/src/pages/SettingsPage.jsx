import React, { useState, useEffect } from 'react';
import { C } from '../constants/constants';
import Panel from '../components/Panel';
import Badge from '../components/Badge';
import { apiFetch } from '../lib/api';

function SettingsPage({ token, user, initialSettings, onSettingsSaved, onUserUpdated }) {
  const [settings, setSettings] = useState(initialSettings);
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [about, setAbout] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState('');
  const [notificationStatus, setNotificationStatus] = useState('unsupported');

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  useEffect(() => {
    if (!user) return;
    setProfile({
      name: user.name || '',
      email: user.email || '',
    });
  }, [user]);

  useEffect(() => {
    if (!token) return;
    let active = true;

    async function loadPageData() {
      try {
        const aboutData = await apiFetch('/about', {}, token);
        if (!active) return;
        setAbout(aboutData);
      } catch (error) {
        console.error('Failed to load settings page data:', error);
      }
    }

    loadPageData();
    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotificationStatus('unsupported');
      return;
    }
    setNotificationStatus(Notification.permission);
  }, [settings?.notifications]);

  const profileChanged = Boolean(user) && (profile.name !== user.name || profile.email !== user.email);

  const updateSetting = async (key, value) => {
    if (key === 'notifications' && value) {
      if (typeof window === 'undefined' || !('Notification' in window)) {
        setSaveNotice('Browser notifications are not supported on this device.');
        return;
      }

      if (Notification.permission === 'denied') {
        setNotificationStatus('denied');
        setSaveNotice('Notifications are blocked in your browser settings.');
        return;
      }

      if (Notification.permission === 'default') {
        try {
          const permission = await Notification.requestPermission();
          setNotificationStatus(permission);
          if (permission !== 'granted') {
            setSaveNotice('Please allow browser notifications to turn this on.');
            return;
          }
        } catch (error) {
          setSaveNotice('Could not request notification permission.');
          return;
        }
      }
    }

    const nextSettings = { ...(settings || {}), [key]: value };
    setSettings(nextSettings);
    onSettingsSaved?.(nextSettings);
    setSaveNotice('');
  };

  const sendTestNotification = () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setSaveNotice('Browser notifications are not supported on this device.');
      return;
    }
    if (Notification.permission !== 'granted') {
      setSaveNotice('Allow browser notifications first.');
      return;
    }
    new Notification('MediBot test notification', {
      body: 'Notifications are working for this browser session.',
    });
    setSaveNotice('Test notification sent.');
  };

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      if (profileChanged) {
        const updatedProfile = await apiFetch(
          '/auth/me',
          { method: 'PUT', body: JSON.stringify(profile) },
          token,
        );
        onUserUpdated?.(updatedProfile.user);
      }

      const savedSettings = await apiFetch(
        '/settings',
        { method: 'PUT', body: JSON.stringify(settings) },
        token,
      );

      setSettings(savedSettings);
      onSettingsSaved?.(savedSettings);
      setSaveNotice(profileChanged ? 'Profile and settings saved.' : 'Settings saved.');
    } catch (error) {
      setSaveNotice(error.message || 'Failed to save settings.');
      console.error('Save settings failed:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!settings) {
    return <div style={{ padding: 40, color: C.textMuted }}>Loading settings...</div>;
  }

  return (
    <div className="page-shell page-grid" style={{ gridTemplateColumns: '1fr', gap: 22 }}>
      <Panel title="Settings" subtitle="Manage profile, preferences, and appearance in one panel">
        <div style={{ display: 'grid', gap: 24 }}>
          <section>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Profile</div>
            <div style={{ display: 'grid', gap: 12 }}>
              <label style={{ display: 'grid', gap: 6, fontSize: 13, color: C.textMuted }}>
                Full name
                <input
                  value={profile.name}
                  onChange={(event) => setProfile((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Jane Doe"
                  style={{ width: '100%', padding: 12, borderRadius: 12, border: `1px solid ${C.border}`, background: C.surface, color: C.text }}
                />
              </label>
              <label style={{ display: 'grid', gap: 6, fontSize: 13, color: C.textMuted }}>
                Email address
                <input
                  type="email"
                  value={profile.email}
                  onChange={(event) => setProfile((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="jane@example.com"
                  style={{ width: '100%', padding: 12, borderRadius: 12, border: `1px solid ${C.border}`, background: C.surface, color: C.text }}
                />
              </label>
              <div style={{ color: C.textMuted, fontSize: 12 }}>
                Update your account name and email here. Email must be unique across accounts.
              </div>
            </div>
          </section>

          <section>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Preferences</div>
            <div style={{ display: 'grid', gap: 12 }}>
              {[
                ['darkMode', 'Dark mode', 'Switch between light and dark app colors.'],
                ['notifications', 'Notifications', 'Enable browser alerts for important events.'],
                ['autoSave', 'Auto save', 'Keep your chat state synced automatically.'],
                ['medicalDisclaimer', 'Medical disclaimer', 'Show medical safety reminders in the app.'],
              ].map(([key, label, hint]) => {
                const isActive = Boolean(settings[key]);
                const isDarkMode = key === 'darkMode';
                const activeColor = isDarkMode ? C.accent : C.green;
                const activeBackground = isActive ? (isDarkMode ? C.accentSoft : `${C.green}18`) : C.surface;
                const activeBorder = isActive ? (isDarkMode ? `${C.accent}55` : `${C.green}55`) : C.borderHi;

                return (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '14px 0', borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{label}</div>
                      <div style={{ color: C.textMuted, fontSize: 12, marginTop: 4 }}>{hint}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateSetting(key, !settings[key])}
                      style={{
                        alignSelf: 'center',
                        minWidth: 74,
                        padding: '10px 14px',
                        borderRadius: 999,
                        border: `1px solid ${activeBorder}`,
                        background: activeBackground,
                        color: isActive ? activeColor : C.textMuted,
                        cursor: 'pointer',
                        fontWeight: 700,
                      }}
                    >
                      {isActive ? 'On' : 'Off'}
                    </button>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 18, padding: 14, borderRadius: 12, background: C.surface, border: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>Browser notification status</div>
                  <div style={{ color: C.textMuted, fontSize: 12, marginTop: 4 }}>
                    {notificationStatus === 'granted' && 'Permission granted. Alerts can be shown.'}
                    {notificationStatus === 'default' && 'Permission not decided yet. Turn notifications on to allow them.'}
                    {notificationStatus === 'denied' && 'Permission denied in the browser.'}
                    {notificationStatus === 'unsupported' && 'This browser or origin does not support notifications.'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={sendTestNotification}
                  disabled={!settings.notifications || notificationStatus !== 'granted'}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: `1px solid ${notificationStatus === 'granted' ? `${C.accent}55` : C.borderHi}`,
                    background: notificationStatus === 'granted' ? C.accentSoft : C.surface,
                    color: notificationStatus === 'granted' ? C.accent : C.textMuted,
                    cursor: !settings.notifications || notificationStatus !== 'granted' ? 'default' : 'pointer',
                    fontWeight: 700,
                  }}
                >
                  Test Notification
                </button>
              </div>
            </div>
          </section>

          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ color: saveNotice.includes('saved') ? C.green : C.textMuted, fontSize: 12 }}>
                {saveNotice || 'Save profile and preference changes together.'}
              </div>
              <button
                type="button"
                onClick={saveSettings}
                disabled={saving}
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: 'none',
                  cursor: 'pointer',
                  background: `linear-gradient(135deg, ${C.accent}, #6b5ef7)`,
                  color: '#fff',
                  fontWeight: 700,
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </section>

          <section style={{ paddingTop: 18, borderTop: `1px solid ${C.border}` }}>
            <div style={{ color: C.textMuted, lineHeight: 1.7 }}>{about?.description || 'Loading project information...'}</div>
            <div style={{ fontSize: 12, color: C.textDim, marginTop: 12 }}>
              Last updated: {settings.updated_at ? new Date(settings.updated_at).toLocaleString() : 'Using default settings'}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
              {(about?.tech || []).map((item) => (
                <Badge key={item}>{item}</Badge>
              ))}
            </div>
          </section>
        </div>
      </Panel>
    </div>
  );
}

export default SettingsPage;
