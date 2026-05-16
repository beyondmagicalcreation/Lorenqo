import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.js';
import { useSocket } from './hooks/useSocket.js';
import AdminLogin from './pages/AdminLogin.jsx';
import JoinProject from './pages/JoinProject.jsx';
import Sidebar from './components/Sidebar.jsx';
import ChatWindow from './components/ChatWindow.jsx';
import RightPanel from './components/RightPanel.jsx';

const APP_NAME = import.meta.env.VITE_APP_NAME || 'Lorenqo';

// ── No-invite / expired session landing ──────────────────────────────────────
function NoInvite({ expiredUser }) {
  const isExpiredAdmin = expiredUser?.role === 'admin';
  const isExpiredContact = expiredUser?.role === 'contact';

  return (
    <div className="fixed inset-0 bg-bg flex flex-col items-center justify-center p-4">
      <div className="bg-surface rounded-2xl p-8 w-full max-w-sm border border-white/10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-3xl">L</span>
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">{APP_NAME}</h1>

        {isExpiredAdmin && (
          <>
            <p className="text-muted text-sm mb-4">
              Your admin session has expired. Please sign in again.
            </p>
            <a
              href="/admin"
              className="inline-block bg-accent text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-accent/90 transition-colors text-sm"
            >
              Admin sign in →
            </a>
          </>
        )}

        {isExpiredContact && (
          <>
            <p className="text-muted text-sm mb-1">
              Hi <span className="text-foreground font-medium">{expiredUser.name}</span>,
            </p>
            <p className="text-muted text-sm">
              Your session has expired. Ask your admin to resend your invite link.
            </p>
          </>
        )}

        {!isExpiredAdmin && !isExpiredContact && (
          <p className="text-muted text-sm">
            You need an invitation link to join. Ask your admin to send you a link via WhatsApp.
          </p>
        )}
      </div>
      <div className="mt-6 text-[10px] text-muted/40 text-center">
        Made with ❤️ by{' '}
        <a href="https://mijnaistudio.nl" target="_blank" rel="noopener noreferrer" className="hover:text-muted/70 transition-colors underline underline-offset-2">
          MijnAIStudio.nl
        </a>
      </div>
    </div>
  );
}

// ── Onboarding wizard (first-time admin) ─────────────────────────────────────
function OnboardingWizard({ adminName, onCreateProject, onDone }) {
  const [step, setStep] = useState(1);
  const [projectName, setProjectName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!projectName.trim()) return;
    setCreating(true);
    await onCreateProject(projectName.trim());
    setCreating(false);
    setStep(3);
  };

  return (
    <div className="fixed inset-0 z-50 bg-bg/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl w-full max-w-md border border-white/10 shadow-2xl overflow-hidden">
        {/* Progress */}
        <div className="flex h-1">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`flex-1 transition-colors ${s <= step ? 'bg-accent' : 'bg-white/10'}`} />
          ))}
        </div>

        <div className="p-8">
          {step === 1 && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto">
                <span className="text-white font-bold text-3xl">L</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Welcome to {APP_NAME}, {adminName}!</h2>
                <p className="text-muted text-sm mt-2">
                  {APP_NAME} lets you chat with clients in their own language — Dutch, Darija, French, and English — all automatically translated.
                </p>
              </div>
              <div className="bg-surface2 rounded-xl p-4 text-left space-y-2">
                <p className="text-xs font-semibold text-muted">HOW IT WORKS</p>
                <div className="space-y-1.5 text-xs text-foreground/80">
                  <p>📁 Create a project for each client or team</p>
                  <p>🔗 Generate an invite link and send it via WhatsApp</p>
                  <p>💬 Chat flows — translations happen automatically</p>
                </div>
              </div>
              <button
                onClick={() => setStep(2)}
                className="w-full bg-accent text-white font-semibold py-3 rounded-xl hover:bg-accent/90 transition-colors"
              >
                Get started →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">Create your first project</h2>
                <p className="text-muted text-sm mt-1">A project groups a client's conversations. Use their company name or case name.</p>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted block mb-2">PROJECT NAME</label>
                  <input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g. Benali Family, Construction Project..."
                    autoFocus
                    className="w-full bg-surface2 border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder-muted outline-none focus:border-accent transition-colors text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!projectName.trim() || creating}
                  className="w-full bg-accent text-white font-semibold py-3 rounded-xl hover:bg-accent/90 transition-colors disabled:opacity-40"
                >
                  {creating ? 'Creating…' : 'Create project →'}
                </button>
              </form>
              <button onClick={() => setStep(1)} className="w-full text-xs text-muted hover:text-foreground transition-colors">
                ← Back
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Project created!</h2>
                <p className="text-muted text-sm mt-2">
                  Now invite your first contact. Click the invite button next to your project in the sidebar to generate a WhatsApp-ready link.
                </p>
              </div>
              <button
                onClick={onDone}
                className="w-full bg-accent text-white font-semibold py-3 rounded-xl hover:bg-accent/90 transition-colors"
              >
                Open {APP_NAME} →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Mobile bottom tab bar ────────────────────────────────────────────────────
function BottomTabBar({ activeTab, onTabChange, hasUnread }) {
  const tabs = [
    {
      id: 'sidebar',
      label: 'Projects',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h18" />
        </svg>
      ),
    },
    {
      id: 'chat',
      label: 'Chat',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      badge: hasUnread,
    },
    {
      id: 'files',
      label: 'Files',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-surface border-t border-white/5 flex z-40 safe-area-bottom">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors relative ${
            activeTab === tab.id ? 'text-accent' : 'text-muted'
          }`}
          style={{ minHeight: '44px' }}
        >
          <div className="relative">
            {tab.icon}
            {tab.badge && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-accent rounded-full" />
            )}
          </div>
          <span className="text-[10px] font-medium">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

// ── Main chat layout ──────────────────────────────────────────────────────────
function ChatLayout({ user, token, logout }) {
  const isAdmin = user.role === 'admin';
  const notifRequestedRef = useRef(false);

  const [adminLanguage, setAdminLanguage] = useState(() =>
    localStorage.getItem('admin-language') || 'nl'
  );
  const handleAdminLanguageChange = (lang) => {
    setAdminLanguage(lang);
    localStorage.setItem('admin-language', lang);
  };

  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(() => {
    if (user?.role !== 'admin' && user?.projectId) {
      return { id: user.projectId, name: user.projectName || '' };
    }
    return null;
  });
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [files, setFiles] = useState([]);
  const [contactsMap, setContactsMap] = useState({});
  const [typingLabel, setTypingLabel] = useState(null);
  const [mobileTab, setMobileTab] = useState('chat');
  const [searchQuery, setSearchQuery] = useState('');
  const [readThreads, setReadThreads] = useState(new Set());
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setProjects(data);
      // Show onboarding if admin has no projects yet
      if (isAdmin && data.length === 0 && !localStorage.getItem('lorenqo-onboarding-done')) {
        setShowOnboarding(true);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  }, [token, isAdmin]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  useEffect(() => {
    if (!isAdmin && user.projectId && projects.length > 0) {
      const myProject = projects.find((p) => p.id === user.projectId);
      if (myProject) setActiveProject(myProject);
    }
  }, [isAdmin, user.projectId, projects]);

  const showPushNotification = useCallback((msg) => {
    if (Notification.permission !== 'granted') {
      if (!notifRequestedRef.current) {
        notifRequestedRef.current = true;
        Notification.requestPermission();
      }
      return;
    }
    if (document.hidden) {
      const body = msg.content_original?.slice(0, 80) || msg.file_name || 'Shared a file';
      new Notification(`${msg.sender_name} — ${APP_NAME}`, { body, icon: '/favicon.ico' });
    }
  }, []);

  const onMessage = useCallback((msg) => {
    setMessages((prev) => {
      const exists = prev.find((m) => m.id === msg.id);
      if (exists) return prev;
      // Show push notification for messages not from self
      const isOwnMsg = isAdmin
        ? (msg.sender_id === 'admin' || msg.sender_id?.startsWith('admin-'))
        : msg.sender_id === user.id;
      if (!isOwnMsg) showPushNotification(msg);
      return [...prev, msg];
    });
  }, [isAdmin, user.id, showPushNotification]);

  const onTranslated = useCallback(({ id, content_nl, content_ma_arab, content_ma_franco, content_fr, content_en }) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, content_nl, content_ma_arab, content_ma_franco, content_fr, content_en, translating: false } : m
      )
    );
  }, []);

  const onHistory = useCallback((msgs) => setMessages(msgs), []);
  const onThreadHistory = useCallback(({ messages: msgs }) => setMessages(msgs), []);
  const onParticipants = useCallback((data) => {
    if (data && data.projectId && Array.isArray(data.participants)) {
      setContactsMap((prev) => ({ ...prev, [data.projectId]: data.participants }));
    }
  }, []);
  const onFileList = useCallback((fileList) => setFiles(fileList), []);

  const typingTimeout = useRef(null);
  const onTyping = useCallback(({ name, isTyping }) => {
    if (isTyping) {
      setTypingLabel(name);
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => setTypingLabel(null), 3000);
    } else {
      setTypingLabel(null);
    }
  }, []);

  const onUserOnline = useCallback(() => {}, []);

  const onMessagesRead = useCallback(({ projectId, contactId }) => {
    setReadThreads((prev) => new Set([...prev, `${projectId}:${contactId}`]));
  }, []);

  const socket = useSocket({
    token, role: user.role,
    onMessage, onTranslated, onHistory, onThreadHistory,
    onParticipants, onFileList, onTyping, onUserOnline, onMessagesRead,
    onReconnecting: setIsReconnecting,
  });

  const handleSelectProject = useCallback((project) => {
    setActiveProject(project);
    setActiveContact(null);
    setMessages([]);
    setSearchQuery('');
    if (isAdmin) socket.joinProject(project.id);
  }, [isAdmin, socket]);

  const handleSelectContact = useCallback((contact) => {
    setActiveContact(contact);
    setMessages([]);
    setSearchQuery('');
    setMobileTab('chat');
    if (isAdmin && activeProject) socket.getThread(activeProject.id, contact._id);
  }, [isAdmin, activeProject, socket]);

  const handleCreateProject = useCallback(async (name) => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to create project.');
        return;
      }
      await fetchProjects();
    } catch (err) {
      console.error('Failed to create project:', err);
      alert('Connection error. Please try again.');
    }
  }, [token, fetchProjects]);

  const handleGenerateInvite = useCallback(async (projectId, contactName, contactLanguage) => {
    const res = await fetch(`/api/projects/${projectId}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ contactName, contactLanguage }),
    });
    return res.json();
  }, [token]);

  const handleSelectAdminChannel = useCallback(() => {
    setActiveProject({ id: '__admin__', name: 'Admin Channel' });
    setActiveContact({ _id: '__admin__', name: 'Admin Channel', language: 'nl' });
    setMessages([]);
    setSearchQuery('');
    setMobileTab('chat');
    socket.getThread('__admin__', '__admin__');
  }, [socket]);

  const handleRenameProject = useCallback(async (projectId, name) => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) return;
      setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, name } : p));
      if (activeProject?.id === projectId) setActiveProject((p) => ({ ...p, name }));
    } catch (err) {
      console.error('Rename project failed:', err);
    }
  }, [token, activeProject]);

  const handleDeleteContact = useCallback(async (projectId, contactId, contactName) => {
    if (!window.confirm(`Delete "${contactName}"?\n\nAll messages will be permanently removed.`)) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/contacts/${contactId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { alert('Failed to delete contact.'); return; }
      setContactsMap(prev => ({
        ...prev,
        [projectId]: (prev[projectId] || []).filter(c => c._id !== contactId),
      }));
      if (activeContact?._id === contactId) {
        setActiveContact(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Delete contact failed:', err);
      alert('Connection error. Please try again.');
    }
  }, [token, activeContact]);

  const isAdminChannel = activeProject?.id === '__admin__';
  const currentThreadKey = activeProject && activeContact ? `${activeProject.id}:${activeContact._id}` : null;
  const threadIsRead = currentThreadKey ? readThreads.has(currentThreadKey) : false;

  return (
    <div className="flex h-dvh overflow-hidden bg-bg">
      {/* Reconnecting banner */}
      {isReconnecting && (
        <div className="fixed top-0 inset-x-0 bg-amber-600/95 text-white text-xs text-center py-2 z-50 flex items-center justify-center gap-2">
          <svg className="w-3 h-3 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Reconnecting…
        </div>
      )}

      {/* Onboarding wizard */}
      {showOnboarding && (
        <OnboardingWizard
          adminName={user.name || 'Admin'}
          onCreateProject={handleCreateProject}
          onDone={() => {
            localStorage.setItem('lorenqo-onboarding-done', '1');
            setShowOnboarding(false);
          }}
        />
      )}

      {/* Sidebar — hidden on mobile unless on sidebar tab */}
      <div className={`${mobileTab === 'sidebar' ? 'flex' : 'hidden'} md:flex flex-col flex-shrink-0 w-full md:w-auto pb-16 md:pb-0`}>
        <Sidebar
          isAdmin={isAdmin}
          projects={projects}
          activeProject={activeProject}
          activeContact={activeContact}
          contactsMap={contactsMap}
          currentUser={user}
          adminLanguage={adminLanguage}
          onAdminLanguageChange={handleAdminLanguageChange}
          onSelectProject={handleSelectProject}
          onSelectContact={handleSelectContact}
          onCreateProject={handleCreateProject}
          onGenerateInvite={handleGenerateInvite}
          onDeleteContact={handleDeleteContact}
          onRenameProject={handleRenameProject}
          isAdminChannel={isAdminChannel}
          onSelectAdminChannel={handleSelectAdminChannel}
          onLogout={logout}
          token={token}
        />
      </div>

      {/* Chat — hidden on mobile unless on chat tab */}
      <div className={`${mobileTab === 'chat' ? 'flex' : 'hidden'} md:flex flex-1 flex-col min-w-0 pb-16 md:pb-0`}>
        <ChatWindow
          isAdmin={isAdmin}
          project={activeProject}
          contact={activeContact}
          currentUser={user}
          socket={socket}
          messages={messages}
          typingLabel={typingLabel}
          adminLanguage={adminLanguage}
          onFilesUpdate={setFiles}
          token={token}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          threadIsRead={threadIsRead}
        />
      </div>

      {/* Right panel — hidden on mobile unless on files tab */}
      <div className={`${mobileTab === 'files' ? 'flex' : 'hidden'} md:flex flex-col flex-shrink-0 w-full md:w-auto pb-16 md:pb-0`}>
        <RightPanel files={files} project={activeProject} />
      </div>

      {/* Mobile bottom tab bar */}
      <BottomTabBar activeTab={mobileTab} onTabChange={setMobileTab} />
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  const { token, user, expiredUser, login, logout } = useAuth();

  return (
    <Routes>
      <Route path="/admin" element={
        user ? <Navigate to="/" replace /> : <AdminLogin onLogin={login} />
      } />
      <Route path="/join/:token" element={<JoinProject onLogin={login} isAdminViewing={user?.role === 'admin'} />} />
      <Route path="/" element={
        user
          ? <ChatLayout user={user} token={token} logout={logout} />
          : <NoInvite expiredUser={expiredUser} />
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
