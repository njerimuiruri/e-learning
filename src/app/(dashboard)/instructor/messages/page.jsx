'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Send, MessageCircle, ArrowLeft, Plus, BookOpen,
  FileText, TrendingUp, ClipboardCheck, Video, Shield, X,
  Users, RefreshCw,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/ToastProvider';
import ProtectedInstructorRoute from '@/components/ProtectedInstructorRoute';
import messageService from '@/lib/api/messageService';
import moduleEnrollmentService from '@/lib/api/moduleEnrollmentService';
import moduleService from '@/lib/api/moduleService';
import authService from '@/lib/api/authService';

// ── helpers ──────────────────────────────────────────────────────────────────

function formatTime(date) {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const mins = Math.floor((now - d) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  if (hrs < 48) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getIdStr(val) {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (val.$oid) return val.$oid;
  if (val._id) { const s = String(val._id); return s !== '[object Object]' ? s : ''; }
  if (val.id) { const s = String(val.id); return s !== '[object Object]' ? s : ''; }
  return '';
}

function initials(user) {
  return `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || '?';
}

// ── context config ────────────────────────────────────────────────────────────

const CONTEXT_TYPES = [
  { value: 'general',    label: 'General',    Icon: MessageCircle,  color: 'gray'   },
  { value: 'module',     label: 'Module',     Icon: BookOpen,       color: 'blue'   },
  { value: 'lesson',     label: 'Lesson',     Icon: Video,          color: 'cyan'   },
  { value: 'essay',      label: 'Essay',      Icon: FileText,       color: 'amber'  },
  { value: 'progress',   label: 'Progress',   Icon: TrendingUp,     color: 'green'  },
  { value: 'assessment', label: 'Assessment', Icon: ClipboardCheck, color: 'orange' },
];

const CTX_BADGE = {
  module:     'bg-blue-100 text-blue-700',
  lesson:     'bg-cyan-100 text-cyan-700',
  essay:      'bg-amber-100 text-amber-700',
  progress:   'bg-green-100 text-green-700',
  assessment: 'bg-orange-100 text-orange-700',
  general:    'bg-gray-100 text-gray-600',
};

const CTX_HEADER = {
  module:     { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   Icon: BookOpen       },
  lesson:     { bg: 'bg-cyan-50',   border: 'border-cyan-200',   text: 'text-cyan-700',   Icon: Video          },
  essay:      { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  Icon: FileText       },
  progress:   { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  Icon: TrendingUp     },
  assessment: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', Icon: ClipboardCheck },
  general:    { bg: 'bg-gray-50',   border: 'border-gray-200',   text: 'text-gray-600',   Icon: MessageCircle  },
};

function ContextBadge({ type }) {
  const cfg = CONTEXT_TYPES.find((c) => c.value === type);
  if (!cfg) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${CTX_BADGE[type] ?? CTX_BADGE.general}`}>
      <cfg.Icon className="w-2.5 h-2.5" />{cfg.label}
    </span>
  );
}

function ContextHeader({ context }) {
  if (!context?.type || context.type === 'general') return null;
  const c = CTX_HEADER[context.type] ?? CTX_HEADER.general;
  return (
    <div className={`mx-4 mt-3 mb-1 rounded-xl border p-3 flex items-start gap-3 ${c.bg} ${c.border}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${c.bg}`}>
        <c.Icon className={`w-4 h-4 ${c.text}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-[10px] font-bold uppercase tracking-wide mb-0.5 ${c.text}`}>
          {CONTEXT_TYPES.find((t) => t.value === context.type)?.label}
        </p>
        <p className="text-sm font-semibold text-gray-800">{context.title}</p>
        {context.metadata?.description && (
          <p className="text-xs text-gray-500 mt-0.5">{context.metadata.description}</p>
        )}
      </div>
    </div>
  );
}

// ── avatar ────────────────────────────────────────────────────────────────────

function Avatar({ user, size = 'md', role }) {
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  const bg =
    role === 'admin'
      ? 'bg-gradient-to-br from-purple-600 to-violet-700'
      : role === 'instructor'
      ? 'bg-gradient-to-br from-green-600 to-emerald-700'
      : 'bg-gradient-to-br from-blue-500 to-indigo-600';
  return (
    <div className={`${sz} ${bg} rounded-full flex items-center justify-center text-white font-semibold shrink-0`}>
      {role === 'admin' ? <Shield className="w-4 h-4" /> : initials(user)}
    </div>
  );
}

// ── message bubble ────────────────────────────────────────────────────────────

function MessageBubble({ message, currentUserId }) {
  const senderId = getIdStr(message.senderId);
  const isOwn = senderId === currentUserId;
  const sender = typeof message.senderId === 'object' ? message.senderId : null;
  const isAdmin = sender?.role === 'admin';

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3 gap-2 px-1`}>
      {!isOwn && <Avatar user={sender} role={sender?.role} size="sm" />}
      <div className={`max-w-xs sm:max-w-md flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && (
          <div className="flex items-center gap-1.5 mb-1 px-1">
            <span className="text-xs font-semibold text-gray-700">
              {isAdmin ? 'Admin Support' : sender ? `${sender.firstName || ''} ${sender.lastName || ''}`.trim() : 'Student'}
            </span>
            {isAdmin && (
              <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[9px] font-bold rounded-full flex items-center gap-0.5">
                <Shield className="w-2.5 h-2.5" /> Admin
              </span>
            )}
            {!isAdmin && sender?.role && (
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-medium rounded-full capitalize">
                {sender.role}
              </span>
            )}
          </div>
        )}
        <div className={`px-4 py-2.5 rounded-2xl shadow-sm ${
          isOwn
            ? 'bg-green-600 text-white rounded-br-sm'
            : isAdmin
            ? 'bg-purple-50 text-gray-900 border border-purple-200 rounded-bl-sm'
            : 'bg-white text-gray-900 border border-gray-100 rounded-bl-sm'
        }`}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          <p className={`text-[10px] mt-1 text-right ${isOwn ? 'text-green-100' : 'text-gray-400'}`}>
            {formatTime(message.createdAt)}
            {message.isRead && isOwn && ' · Read'}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── compose dialog ────────────────────────────────────────────────────────────

function ComposeDialog({ open, onClose, onSent, prefill }) {
  const { showToast } = useToast();
  const [studentSearch, setStudentSearch] = useState('');
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [contextType, setContextType] = useState('general');
  const [contextTitle, setContextTitle] = useState('');
  const [contextDetails, setContextDetails] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [instructorModules, setInstructorModules] = useState([]);
  const dropdownRef = useRef(null);
  const searchDebounce = useRef(null);

  useEffect(() => {
    if (!open) {
      setStudentSearch('');
      setStudents([]);
      setSelectedStudent(null);
      setContextType('general');
      setContextTitle('');
      setContextDetails('');
      setMessage('');
    } else {
      // Load instructor's modules for the module context dropdown
      moduleService.getInstructorModules().then((res) => {
        const list = Array.isArray(res) ? res : (res?.modules ?? res?.data ?? []);
        setInstructorModules(list);
      }).catch(() => {});

      // Apply pre-fill if provided (from Student Responses page)
      if (prefill) {
        setContextType(prefill.contextType || 'general');
        setContextTitle(prefill.contextTitle || '');
        setContextDetails(prefill.contextDetails || '');
        if (prefill.studentId) {
          setSelectedStudent({
            _id: prefill.studentId,
            firstName: prefill.studentName?.split(' ')[0] || '',
            lastName: prefill.studentName?.split(' ').slice(1).join(' ') || '',
            email: prefill.studentEmail || '',
            role: 'student',
          });
        }
      }
    }
  }, [open, prefill]);

  const searchStudents = async (q) => {
    setStudentsLoading(true);
    try {
      // Try instructor-specific student list (uses module enrollment data  always accessible)
      const data = await moduleEnrollmentService.getInstructorStudents({ search: q || undefined, limit: 50 });
      const list = Array.isArray(data) ? data : [];
      const normalized = list.map((s) => ({
        _id: s._id || s.id || '',
        firstName: s.firstName || s.name?.split(' ')[0] || '',
        lastName: s.lastName || s.name?.split(' ').slice(1).join(' ') || '',
        email: s.email || '',
        role: 'student',
      })).filter((s) => s._id);
      setStudents(normalized);
    } catch {
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleStudentSearchChange = (e) => {
    const val = e.target.value;
    setStudentSearch(val);
    setShowDropdown(true);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => searchStudents(val), 300);
  };

  const handleStudentFocus = () => {
    setShowDropdown(true);
    if (students.length === 0 && !studentsLoading) {
      searchStudents(studentSearch);
    }
  };

  const filteredStudents = students;

  const handleSend = async () => {
    if (!selectedStudent || !message.trim()) {
      showToast('Please select a student and write a message', { type: 'warning' });
      return;
    }
    const receiverId = getIdStr(selectedStudent);
    if (!receiverId) { showToast('Cannot identify student', { type: 'error' }); return; }

    setSending(true);
    try {
      const payload = {
        receiverId,
        content: message.trim(),
        context: contextType !== 'general' || contextTitle.trim()
          ? {
              type: contextType,
              title: contextTitle.trim() || 'General message',
              metadata: contextDetails.trim() ? { description: contextDetails.trim() } : undefined,
            }
          : undefined,
      };
      await messageService.sendMessage(payload);
      showToast('Message sent!', { type: 'success' });
      onSent?.(receiverId, selectedStudent);
      onClose();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send message', { type: 'error' });
    } finally {
      setSending(false);
    }
  };

  const selectedCtxConfig = CONTEXT_TYPES.find((c) => c.value === contextType);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-green-600" />
            </div>
            New Message to Student
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Student selector */}
          <div className="space-y-1.5" ref={dropdownRef}>
            <Label>
              To: Student <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              {selectedStudent ? (
                <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl bg-green-50">
                  <Avatar user={selectedStudent} role="student" size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {selectedStudent.firstName} {selectedStudent.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{selectedStudent.email}</p>
                  </div>
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                  <input
                    type="text"
                    placeholder="Type a name or email to search…"
                    value={studentSearch}
                    onChange={handleStudentSearchChange}
                    onFocus={handleStudentFocus}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                  />
                  {showDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
                      {studentsLoading ? (
                        <div className="p-3 text-center text-sm text-gray-500">
                          <span className="inline-block w-3 h-3 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin mr-2 align-middle" />
                          Searching…
                        </div>
                      ) : filteredStudents.length === 0 ? (
                        <div className="p-3 text-center text-sm text-gray-500">
                          {studentSearch
                            ? `No students found for "${studentSearch}"`
                            : 'Type a name or email to find a student'}
                        </div>
                      ) : (
                        filteredStudents.map((s) => {
                          const id = getIdStr(s);
                          return (
                            <button
                              key={id || s.email}
                              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-left transition-colors"
                              onClick={() => { setSelectedStudent(s); setStudentSearch(''); setShowDropdown(false); }}
                            >
                              <Avatar user={s} role="student" size="sm" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {s.firstName} {s.lastName}
                                </p>
                                <p className="text-xs text-gray-400 truncate">{s.email}</p>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Context type */}
          <div className="space-y-1.5">
            <Label>Message Context</Label>
            <div className="grid grid-cols-3 gap-2">
              {CONTEXT_TYPES.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setContextType(value)}
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium border transition-all ${
                    contextType === value
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Context title (not for general) */}
          {contextType !== 'general' && (
            <div className="space-y-1.5">
              <Label htmlFor="ctx-title">
                {selectedCtxConfig?.label} Reference <span className="text-red-500">*</span>
              </Label>
              {contextType === 'module' && instructorModules.length > 0 ? (
                <select
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none bg-white"
                  value={contextTitle}
                  onChange={(e) => setContextTitle(e.target.value)}
                >
                  <option value="">Select a module…</option>
                  {instructorModules.map((m) => (
                    <option key={m._id || m.id} value={m.title}>
                      {m.title}{m.level ? ` (${m.level})` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  id="ctx-title"
                  placeholder={
                    contextType === 'module' ? 'e.g. Introduction to Machine Learning' :
                    contextType === 'lesson' ? 'e.g. Lesson 3: Neural Networks' :
                    contextType === 'essay' ? 'e.g. Research Paper – AI in Healthcare' :
                    contextType === 'progress' ? 'e.g. Week 4 Progress Review' :
                    'e.g. Mid-term Assessment Feedback'
                  }
                  value={contextTitle}
                  onChange={(e) => setContextTitle(e.target.value)}
                />
              )}
              <Input
                placeholder="Additional details (optional)"
                value={contextDetails}
                onChange={(e) => setContextDetails(e.target.value)}
              />
            </div>
          )}

          {/* Preview context badge */}
          {(contextType !== 'general' && contextTitle.trim()) && (
            <div className={`rounded-xl border p-3 flex items-center gap-2.5 ${CTX_HEADER[contextType]?.bg} ${CTX_HEADER[contextType]?.border}`}>
              <selectedCtxConfig.Icon className={`w-4 h-4 shrink-0 ${CTX_HEADER[contextType]?.text}`} />
              <div className="min-w-0">
                <p className={`text-[10px] font-bold uppercase tracking-wide ${CTX_HEADER[contextType]?.text}`}>
                  {selectedCtxConfig?.label}
                </p>
                <p className="text-sm font-medium text-gray-800 truncate">{contextTitle}</p>
              </div>
            </div>
          )}

          {/* Message */}
          <div className="space-y-1.5">
            <Label htmlFor="compose-msg">
              Message <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="compose-msg"
              placeholder="Write your message to the student…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={2000}
            />
            <p className="text-xs text-gray-400 text-right">{message.length}/2000</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSend}
            disabled={sending || !selectedStudent || !message.trim()}
            className="bg-green-600 hover:bg-green-700 text-white gap-2"
          >
            {sending ? (
              <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {sending ? 'Sending…' : 'Send Message'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── conversation row ──────────────────────────────────────────────────────────

function ConvRow({ conv, isActive, onClick }) {
  const user = conv.user || {};
  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Student';
  const time = conv.lastMessage?.createdAt ? formatTime(conv.lastMessage.createdAt) : '';

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-0 ${
        isActive ? 'bg-green-50 border-r-[3px] border-r-green-600' : ''
      }`}
    >
      <div className="relative shrink-0">
        <Avatar user={user} role={user.role || 'student'} />
        {conv.unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p className={`text-sm font-semibold truncate ${isActive ? 'text-green-700' : 'text-gray-900'} ${conv.unreadCount > 0 ? 'font-bold' : ''}`}>
            {name}
          </p>
          <span className="text-[10px] text-gray-400 shrink-0 ml-2">{time}</span>
        </div>
        <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
          {conv.lastMessage?.content || 'No messages yet'}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-medium">
            Student
          </span>
          {conv.context?.type && <ContextBadge type={conv.context.type} />}
        </div>
      </div>
    </button>
  );
}

// ── main content ──────────────────────────────────────────────────────────────

function InstructorMessagesContent() {
  const { showToast } = useToast();
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [composeOpen, setComposeOpen] = useState(false);
  const [composePrefill, setComposePrefill] = useState(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  const currentUser = typeof window !== 'undefined'
    ? (authService.getCurrentUser() ?? JSON.parse(localStorage.getItem('user') || 'null'))
    : null;
  const currentUserId = currentUser?._id || currentUser?.id || '';

  useEffect(() => {
    fetchConversations();
    // Check for pre-fill from Student Responses page
    try {
      const raw = sessionStorage.getItem('instructor_compose_prefill');
      if (raw) {
        const prefill = JSON.parse(raw);
        sessionStorage.removeItem('instructor_compose_prefill');
        setComposePrefill(prefill);
        setComposeOpen(true);
      }
    } catch {}
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  useEffect(() => {
    if (selected) {
      fetchMessages(getIdStr(selected.user));
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => fetchMessages(getIdStr(selected.user), false), 5000);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
    }
  }, [selected?.user?._id ?? selected?.user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await messageService.getConversations();
      setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('fetchConversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId, scroll = true) => {
    if (!userId) return;
    try {
      const data = await messageService.getConversation(userId, 100);
      setMessages(Array.isArray(data) ? data : []);
      if (scroll) {
        await messageService.markConversationAsRead(userId);
        setConversations((prev) =>
          prev.map((c) => (getIdStr(c.user) === userId ? { ...c, unreadCount: 0 } : c))
        );
      }
    } catch (err) {
      console.error('fetchMessages:', err);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selected) return;
    const receiverId = getIdStr(selected.user);
    if (!receiverId) return;
    const text = newMessage.trim();
    setNewMessage('');
    setSending(true);
    setMessages((prev) => [
      ...prev,
      { _id: `tmp-${Date.now()}`, senderId: currentUserId, content: text, createdAt: new Date().toISOString() },
    ]);
    try {
      await messageService.sendMessage({ receiverId, content: text });
      await fetchMessages(receiverId, false);
      fetchConversations(true);
    } catch (err) {
      showToast('Failed to send message', { type: 'error' });
      setNewMessage(text);
    } finally {
      setSending(false);
    }
  };

  const handleComposeSent = async (receiverId) => {
    await fetchConversations();
    // Auto-select the conversation with that student
    setTimeout(() => {
      setConversations((prev) => {
        const found = prev.find((c) => getIdStr(c.user) === receiverId);
        if (found) { setSelected(found); setMobileShowChat(true); }
        return prev;
      });
    }, 300);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  };

  const filtered = conversations.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      `${c.user?.firstName || ''} ${c.user?.lastName || ''}`.toLowerCase().includes(q) ||
      (c.lastMessage?.content || '').toLowerCase().includes(q)
    );
  });

  const totalUnread = conversations.reduce((s, c) => s + (c.unreadCount || 0), 0);
  const selectedUser = selected?.user || {};
  const selectedName = `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() || 'Student';
  const selectedContext = selected?.context ?? null;

  return (
    <div className="h-[calc(100vh-4rem)] bg-gray-50 flex overflow-hidden">
      <div className="flex flex-1 overflow-hidden bg-white shadow-sm">

        {/* ── Sidebar ── */}
        <div className={`w-full sm:w-80 md:w-[340px] flex-shrink-0 border-r bg-white flex flex-col ${mobileShowChat ? 'hidden sm:flex' : 'flex'}`}>
          {/* Header */}
          <div className="p-4 border-b sticky top-0 bg-white z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-gray-900">Messages</h1>
                {totalUnread > 0 && (
                  <span className="min-w-[22px] h-5 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setComposeOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-xl transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New
                </button>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search students…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-200 rounded-full w-1/2" />
                      <div className="h-3 bg-gray-200 rounded-full w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">No conversations yet</p>
                <p className="text-xs text-gray-400 mb-4">Start by sending a message to a student</p>
                <button
                  onClick={() => setComposeOpen(true)}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-4 h-4" /> New Message
                </button>
              </div>
            ) : (
              filtered.map((conv) => (
                <ConvRow
                  key={getIdStr(conv.user)}
                  conv={conv}
                  isActive={getIdStr(selected?.user) === getIdStr(conv.user)}
                  onClick={() => { setSelected(conv); setMobileShowChat(true); }}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Chat Panel ── */}
        <div className={`flex-1 flex flex-col min-w-0 bg-gray-50 ${!mobileShowChat ? 'hidden sm:flex' : 'flex'}`}>
          {selected ? (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b bg-white shadow-sm">
                <button
                  className="sm:hidden p-1.5 rounded-xl hover:bg-gray-100"
                  onClick={() => { setMobileShowChat(false); setSelected(null); }}
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <Avatar user={selectedUser} role={selectedUser.role || 'student'} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 text-sm">{selectedName}</p>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded-full font-medium">
                      Student
                    </span>
                    {selectedContext?.type && <ContextBadge type={selectedContext.type} />}
                  </div>
                  <p className="text-xs text-gray-400">{selectedUser.email || ''}</p>
                </div>
              </div>

              {/* Context header */}
              {selectedContext && <ContextHeader context={selectedContext} />}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto py-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-6">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <MessageCircle className="w-7 h-7 text-gray-300" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">No messages yet</p>
                    <p className="text-xs text-gray-400 mt-1">Send the first message to start the conversation</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <MessageBubble key={msg._id} message={msg} currentUserId={currentUserId} />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t bg-white p-3">
                <form onSubmit={handleSend} className="flex items-end gap-2">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                    placeholder={`Message ${selectedName}…`}
                    disabled={sending}
                    rows={1}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none resize-none leading-relaxed"
                    style={{ minHeight: '44px', maxHeight: '120px' }}
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    className="h-11 px-4 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-40 flex items-center gap-2 text-sm font-medium shrink-0"
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </form>
                <p className="text-[10px] text-gray-400 mt-1.5 ml-1">Enter to send · Shift+Enter for new line</p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div className="max-w-xs">
                <div className="inline-flex p-5 bg-gray-100 rounded-full mb-4">
                  <MessageCircle className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-1">Student Messaging</h3>
                <p className="text-sm text-gray-400 mb-6">
                  Select a conversation or compose a context-aware message to a student
                </p>
                <button
                  onClick={() => setComposeOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4" /> New Message
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compose dialog */}
      <ComposeDialog
        open={composeOpen}
        onClose={() => { setComposeOpen(false); setComposePrefill(null); }}
        onSent={handleComposeSent}
        prefill={composePrefill}
      />
    </div>
  );
}

export default function InstructorMessagesPage() {
  return (
    <ProtectedInstructorRoute>
      <InstructorMessagesContent />
    </ProtectedInstructorRoute>
  );
}
