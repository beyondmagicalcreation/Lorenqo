import React, { useState, useCallback } from 'react';
import InviteModal from './InviteModal.jsx';
import Footer from './Footer.jsx';

const APP_NAME = import.meta.env.VITE_APP_NAME || 'Lorenqo';
const COMPANY_NAME = import.meta.env.VITE_COMPANY_NAME || 'Admin';

const LANG_FLAGS = { nl: '🇳🇱', fr: '🇫🇷', ma: '🇲🇦', en: '🇬🇧' };
const LANG_LABELS = { nl: 'NL', fr: 'FR', ma: 'MA', en: 'EN' };
const LANG_OPTIONS = [
  { value: 'nl', label: 'Dutch', flag: '🇳🇱' },
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'ma', label: 'Darija', flag: '🇲🇦' },
  { value: 'fr', label: 'Français', flag: '🇫🇷' },
];

function Avatar({ name, color, size = 8 }) {
  return (
    <div
      className={`w-${size} h-${size} rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0`}
      style={{ backgroundColor: color || '#E87B1E' }}
    >
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  );
}

// ── Contact invite link modal (for resharing to existing contacts) ─────────────
function ContactInviteModal({ contact, projectId, token, onClose }) {
  const APP_NAME_CONST = import.meta.env.VITE_APP_NAME || 'Lorenqo';
  const [inviteUrl, setInviteUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    async function fetchLink() {
      try {
        const res = await fetch(`/api/projects/${projectId}/contacts/${contact._id}/invite`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setInviteUrl(data.fullUrl || `${window.location.origin}${data.url}`);
      } catch {
        setInviteUrl(null);
      } finally {
        setLoading(false);
      }
    }
    fetchLink();
  }, [projectId, contact._id, token]);

  const handleCopy = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const whatsappUrl = inviteUrl
    ? `https://wa.me/?text=${encodeURIComponent(`Hi ${contact.name}! Here's your link to rejoin ${APP_NAME_CONST}:\n${inviteUrl}`)}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl w-full max-w-sm border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div>
            <h2 className="font-semibold text-foreground text-sm">Invite link for {contact.name}</h2>
            <p className="text-xs text-muted mt-0.5">Share this to reconnect or add a new device</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-foreground transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">
          {loading ? (
            <p className="text-sm text-muted text-center py-4">Retrieving link…</p>
          ) : inviteUrl ? (
            <>
              <p className="text-xs text-foreground break-all font-mono bg-surface2 rounded-lg px-3 py-2 border border-white/5">
                {inviteUrl}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    copied ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-foreground hover:bg-white/10'
                  }`}
                >
                  {copied ? (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy link
                    </>
                  )}
                </button>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-semibold transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </a>
              </div>
            </>
          ) : (
            <p className="text-sm text-red-400 text-center">Failed to retrieve link. Try again.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Admin settings modal ──────────────────────────────────────────────────────
function AdminSettingsModal({ token, onClose }) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newPass, setNewPass] = useState('');
  const [adding, setAdding] = useState(false);
  const [changingPassId, setChangingPassId] = useState(null);
  const [newPassValue, setNewPassValue] = useState('');
  const [error, setError] = useState('');

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admins', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setAdmins(data);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { fetchAdmins(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    setAdding(true);
    try {
      const res = await fetch('/api/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newName.trim(), password: newPass.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to add admin'); return; }
      setNewName(''); setNewPass('');
      fetchAdmins();
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove admin "${name}"?`)) return;
    const res = await fetch(`/api/admins/${encodeURIComponent(id)}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Failed to delete'); return; }
    fetchAdmins();
  };

  const handleChangePassword = async (id) => {
    if (!newPassValue.trim()) return;
    const res = await fetch(`/api/admins/${encodeURIComponent(id)}/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ password: newPassValue.trim() }),
    });
    if (!res.ok) { setError('Failed to change password'); return; }
    setChangingPassId(null);
    setNewPassValue('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl w-full max-w-md border border-white/10 shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 flex-shrink-0">
          <h2 className="font-semibold text-foreground text-sm">Admin Management</h2>
          <button onClick={onClose} className="text-muted hover:text-foreground transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {error && <p className="text-red-400 text-xs text-center">{error}</p>}

          {/* Current admins */}
          <div>
            <p className="text-[10px] font-semibold text-muted tracking-widest mb-2">ADMINS</p>
            {loading ? (
              <p className="text-xs text-muted">Loading…</p>
            ) : (
              <div className="space-y-1">
                {admins.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 py-1.5 group">
                    <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-accent text-xs font-bold">{a.name[0]?.toUpperCase()}</span>
                    </div>
                    <span className="text-sm text-foreground flex-1">{a.name}</span>
                    {changingPassId === a.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          autoFocus
                          type="password"
                          value={newPassValue}
                          onChange={(e) => setNewPassValue(e.target.value)}
                          placeholder="New password"
                          className="bg-surface2 border border-white/10 rounded-lg px-2 py-1 text-xs text-foreground outline-none w-32 focus:border-accent"
                        />
                        <button
                          onClick={() => handleChangePassword(a.id)}
                          className="text-xs text-green-400 hover:text-green-300 px-2"
                        >Save</button>
                        <button
                          onClick={() => { setChangingPassId(null); setNewPassValue(''); }}
                          className="text-xs text-muted hover:text-foreground"
                        >✕</button>
                      </div>
                    ) : (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setChangingPassId(a.id); setNewPassValue(''); }}
                          className="text-[10px] text-muted hover:text-accent px-2 py-1 rounded hover:bg-accent/10 transition-colors"
                        >Password</button>
                        <button
                          onClick={() => handleDelete(a.id, a.name)}
                          className="text-[10px] text-red-400/60 hover:text-red-400 px-2 py-1 rounded hover:bg-red-400/10 transition-colors"
                        >Remove</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add admin form */}
          <form onSubmit={handleAdd} className="border-t border-white/5 pt-4 space-y-2">
            <p className="text-[10px] font-semibold text-muted tracking-widest">ADD ADMIN</p>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Name"
              className="w-full bg-surface2 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground placeholder-muted outline-none focus:border-accent"
            />
            <input
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="Password"
              className="w-full bg-surface2 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground placeholder-muted outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={adding || !newName.trim() || !newPass.trim()}
              className="w-full bg-accent/20 text-accent text-xs font-semibold py-2 rounded-lg hover:bg-accent/30 transition-colors disabled:opacity-40"
            >
              {adding ? 'Adding…' : '+ Add admin'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Admin sidebar ─────────────────────────────────────────────────────────────
function AdminSidebar({
  projects, activeProject, activeContact, contactsMap,
  adminLanguage, onAdminLanguageChange,
  onSelectProject, onSelectContact, onCreateProject, onGenerateInvite, onDeleteContact,
  onRenameProject,
  isAdminChannel, onSelectAdminChannel, onLogout, currentUser, token,
}) {
  const [newProjectName, setNewProjectName] = useState('');
  const [showNewProject, setShowNewProject] = useState(false);
  const [inviteTarget, setInviteTarget] = useState(null);
  const [reshareTarget, setReshareTarget] = useState(null); // { contact, projectId }
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const handleCreate = (e) => {
    e.preventDefault();
    const name = newProjectName.trim();
    if (!name) return;
    onCreateProject(name);
    setNewProjectName('');
    setShowNewProject(false);
  };

  const handleOpenInvite = (e, project) => {
    e.stopPropagation();
    setInviteTarget({ projectId: project.id, projectName: project.name });
  };

  const startEditProject = (e, project) => {
    e.stopPropagation();
    setEditingProjectId(project.id);
    setEditingName(project.name);
  };

  const commitRename = async (projectId) => {
    const name = editingName.trim();
    if (name && onRenameProject) await onRenameProject(projectId, name);
    setEditingProjectId(null);
  };

  const handleRenameKeyDown = (e, projectId) => {
    if (e.key === 'Enter') { e.preventDefault(); commitRename(projectId); }
    if (e.key === 'Escape') setEditingProjectId(null);
  };

  return (
    <>
      <aside className="w-full md:w-64 flex-shrink-0 bg-surface flex flex-col border-r border-white/5 h-full">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">L</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground leading-tight">{APP_NAME}</h1>
              <p className="text-[10px] text-muted">Admin · NL · MA · FR · EN</p>
            </div>
          </div>
        </div>

        {/* Admin Channel */}
        <div className="px-3 pt-3 pb-1">
          <button
            onClick={onSelectAdminChannel}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors ${
              isAdminChannel ? 'bg-accent/20 border border-accent/30' : 'bg-surface2/60 hover:bg-white/5'
            }`}
            style={{ minHeight: '44px' }}
          >
            <span className="text-sm flex-shrink-0">🔒</span>
            <div className="flex-1 text-left min-w-0">
              <p className="text-xs font-semibold text-foreground">Admin Channel</p>
              <p className="text-[10px] text-muted">Private team chat</p>
            </div>
          </button>
        </div>

        {/* Projects + contacts */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3 space-y-1">
          <div className="flex items-center justify-between px-1 mb-2">
            <p className="text-[10px] font-semibold text-muted tracking-widest">PROJECTS</p>
            <button
              onClick={() => setShowNewProject((v) => !v)}
              title="Create new project"
              className="text-[10px] font-semibold text-muted hover:text-accent px-2 py-0.5 rounded-md hover:bg-accent/10 transition-colors"
            >
              + New
            </button>
          </div>

          {showNewProject && (
            <form onSubmit={handleCreate} className="flex gap-2 px-1 mb-2">
              <input
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Project name"
                autoFocus
                className="flex-1 bg-surface2 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-foreground placeholder-muted outline-none focus:border-accent"
              />
              <button type="submit" className="text-xs bg-accent text-white px-3 py-1.5 rounded-lg hover:bg-accent/80">
                Create
              </button>
            </form>
          )}

          {projects.length === 0 && !showNewProject && (
            <div className="py-4 text-center space-y-2">
              <p className="text-xs text-muted">No projects yet</p>
              <button
                onClick={() => setShowNewProject(true)}
                className="text-xs text-accent hover:underline"
              >
                + Create your first project
              </button>
            </div>
          )}

          {projects.map((project) => {
            const contacts = contactsMap[project.id] || [];
            const isActive = activeProject?.id === project.id;

            return (
              <div key={project.id}>
                {editingProjectId === project.id ? (
                  <div className="flex items-center gap-1 px-1 py-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => commitRename(project.id)}
                      onKeyDown={(e) => handleRenameKeyDown(e, project.id)}
                      className="flex-1 bg-surface2 border border-accent/50 rounded-lg px-2 py-1 text-xs text-foreground outline-none"
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => onSelectProject(project)}
                    onDoubleClick={(e) => startEditProject(e, project)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors flex items-center gap-2 group ${
                      isActive ? 'bg-accent/20 border border-accent/30' : 'hover:bg-white/5'
                    }`}
                    style={{ minHeight: '44px' }}
                  >
                    <span className="text-base flex-shrink-0">💬</span>
                    <span className="text-sm font-semibold text-foreground truncate flex-1">{project.name}</span>
                    <button
                      onClick={(e) => handleOpenInvite(e, project)}
                      title="Invite contact"
                      className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg bg-accent/20 text-accent hover:bg-accent/30 transition-all flex-shrink-0"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Invite
                    </button>
                  </button>
                )}

                {isActive && (
                  <div className="mt-0.5 ml-3 border-l border-white/10 pl-3 space-y-0.5 pb-1">
                    {contacts.length === 0 ? (
                      <div className="py-2 space-y-1.5">
                        <p className="text-[11px] text-muted italic">No contacts yet</p>
                        <button
                          onClick={(e) => handleOpenInvite(e, project)}
                          className="flex items-center gap-1 text-[11px] text-accent hover:underline"
                          style={{ minHeight: '44px' }}
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                          Add contact
                        </button>
                      </div>
                    ) : (
                      <>
                        {contacts.map((contact) => (
                          <div
                            key={contact._id}
                            className={`flex items-center gap-1 rounded-lg group ${
                              activeContact?._id === contact._id ? 'bg-accent/15' : 'hover:bg-white/5'
                            }`}
                          >
                            <button
                              onClick={() => onSelectContact(contact)}
                              className={`flex-1 text-left flex items-center gap-2 px-2 py-2 min-w-0`}
                              style={{ minHeight: '44px' }}
                            >
                              <span
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: contact.avatar_color || '#E87B1E' }}
                              />
                              <span className={`text-xs font-medium truncate flex-1 ${
                                activeContact?._id === contact._id ? 'text-foreground' : 'text-muted hover:text-foreground'
                              }`}>{contact.name}</span>
                              <span className="text-sm">{LANG_FLAGS[contact.language] || ''}</span>
                              {contact.status === 'invited' ? (
                                <span className="text-[9px] font-medium text-muted/60 bg-white/5 px-1.5 py-0.5 rounded-full flex-shrink-0">Invited</span>
                              ) : contact.online === 1 ? (
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                              ) : null}
                            </button>
                            {/* 🔗 Reshare invite link */}
                            <button
                              onClick={(e) => { e.stopPropagation(); setReshareTarget({ contact, projectId: project.id }); }}
                              className="opacity-0 group-hover:opacity-100 p-2 rounded text-muted/50 hover:text-accent hover:bg-accent/10 transition-all flex-shrink-0"
                              title="Get invite link"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                            </button>
                            {/* 🗑 Delete */}
                            <button
                              onClick={(e) => { e.stopPropagation(); onDeleteContact(project.id, contact._id, contact.name); }}
                              className="opacity-0 group-hover:opacity-100 p-2 mr-1 rounded text-red-400/50 hover:text-red-400 hover:bg-red-400/10 transition-all flex-shrink-0"
                              title="Delete contact"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={(e) => handleOpenInvite(e, project)}
                          className="flex items-center gap-1.5 px-2 py-1.5 text-[11px] text-accent hover:underline w-full text-left"
                          style={{ minHeight: '44px' }}
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                          Add contact
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Admin footer: language picker + logout */}
        <div className="px-4 py-3 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{currentUser?.name?.[0]?.toUpperCase() || 'A'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{currentUser?.name || 'Admin'}</p>
              <div className="relative">
                <button
                  onClick={() => setShowLangPicker((v) => !v)}
                  className="flex items-center gap-1 text-xs text-muted hover:text-accent transition-colors"
                >
                  <span>{LANG_FLAGS[adminLanguage]}</span>
                  <span>{LANG_LABELS[adminLanguage]}</span>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showLangPicker && (
                  <div className="absolute bottom-6 left-0 bg-surface2 border border-white/10 rounded-xl shadow-xl overflow-hidden z-10 w-44">
                    {LANG_OPTIONS.map((l) => (
                      <button
                        key={l.value}
                        onClick={() => { onAdminLanguageChange(l.value); setShowLangPicker(false); }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                          adminLanguage === l.value ? 'text-accent bg-accent/10' : 'text-foreground hover:bg-white/5'
                        }`}
                        style={{ minHeight: '44px' }}
                      >
                        <span>{l.flag}</span>
                        <span>{l.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              title="Settings"
              className="text-muted hover:text-foreground transition-colors p-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button onClick={onLogout} title="Sign out" className="text-muted hover:text-foreground transition-colors p-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
        <Footer />
      </aside>

      {inviteTarget && (
        <InviteModal
          projectName={inviteTarget.projectName}
          onGenerateInvite={(contactName, contactLanguage) =>
            onGenerateInvite(inviteTarget.projectId, contactName, contactLanguage)
          }
          onClose={() => setInviteTarget(null)}
        />
      )}

      {reshareTarget && (
        <ContactInviteModal
          contact={reshareTarget.contact}
          projectId={reshareTarget.projectId}
          token={token}
          onClose={() => setReshareTarget(null)}
        />
      )}

      {showSettings && (
        <AdminSettingsModal token={token} onClose={() => setShowSettings(false)} />
      )}
    </>
  );
}

// ── Contact sidebar (minimal) ─────────────────────────────────────────────────
function ContactSidebar({ currentUser, onLogout }) {
  return (
    <aside className="w-full md:w-56 flex-shrink-0 bg-surface flex flex-col border-r border-white/5 h-full">
      <div className="px-4 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
            <span className="text-white font-bold text-lg">{COMPANY_NAME[0]?.toUpperCase() || 'L'}</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground leading-tight">{COMPANY_NAME}</h1>
            <p className="text-[10px] text-muted">NL · MA · FR · EN</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 flex flex-col items-center justify-center text-center space-y-3">
        <Avatar name={currentUser.name} color={currentUser.avatarColor} size={12} />
        <div>
          <p className="text-sm font-semibold text-foreground">{currentUser.name}</p>
          {currentUser.projectName && (
            <p className="text-xs text-muted mt-0.5">{currentUser.projectName}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted bg-surface2 px-3 py-1.5 rounded-full">
          <span>{LANG_FLAGS[currentUser.language]}</span>
          <span>{LANG_LABELS[currentUser.language]}</span>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-xs text-muted">Online</span>
        </div>
        <button onClick={onLogout} title="Sign out" className="text-muted hover:text-foreground transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
      <Footer />
    </aside>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────
export default function Sidebar(props) {
  if (props.isAdmin) return <AdminSidebar {...props} />;
  return <ContactSidebar currentUser={props.currentUser} onLogout={props.onLogout} />;
}
