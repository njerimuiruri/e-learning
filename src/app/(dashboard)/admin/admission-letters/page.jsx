'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Upload,
  FileText,
  Mail,
  Send,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  Search,
  Trash2,
  Eye,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import admissionLetterService from '@/lib/api/admissionLetterService';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://api.elearning.arin-africa.org';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StepIndicator({ steps, current }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, i) => {
        const idx = i + 1;
        const done = idx < current;
        const active = idx === current;
        return (
          <div key={idx} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  done
                    ? 'bg-green-500 text-white'
                    : active
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {done ? <Check size={16} /> : idx}
              </div>
              <span
                className={`mt-1 text-xs font-medium ${
                  active ? 'text-blue-600' : done ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                {step}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-0.5 w-16 mx-2 mt-[-14px] transition-all ${
                  idx < current ? 'bg-green-400' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    SENT: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Sent' },
    OPENED: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Opened' },
    ACKNOWLEDGED: { bg: 'bg-green-50', text: 'text-green-700', label: 'Acknowledged' },
    FAILED: { bg: 'bg-red-50', text: 'text-red-700', label: 'Failed' },
    PENDING: { bg: 'bg-gray-50', text: 'text-gray-600', label: 'Pending' },
  };
  const s = map[status] || map.PENDING;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative bg-white rounded-xl shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Step 1: PDF Selection ─────────────────────────────────────────────────────

function PdfStep({ selected, onSelect, templates, onUpload, onDelete, loading }) {
  const [uploading, setUploading] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const fileRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowed.includes(file.type)) {
      toast.error('Please select a PDF or Word (.docx) file');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File must be under 20 MB');
      return;
    }
    setPendingFile(file);
    setNameInput(file.name.replace(/\.(pdf|docx|doc)$/i, ''));
    setShowNameModal(true);
    e.target.value = '';
  };

  const handleUploadConfirm = async () => {
    if (!pendingFile || !nameInput.trim()) return;
    setUploading(true);
    setShowNameModal(false);
    try {
      const formData = new FormData();
      formData.append('file', pendingFile);

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      const res = await fetch(`${API_URL}/api/upload/document`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const uploadResult = await res.json();
      if (!uploadResult.url) throw new Error('Upload failed — no URL returned');

      await onUpload({
        name: nameInput.trim(),
        pdfUrl: uploadResult.url,
        pdfPublicId: uploadResult.publicId || uploadResult.public_id || uploadResult.url,
        originalFileName: pendingFile.name,
      });
      toast.success('PDF uploaded successfully');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      setPendingFile(null);
    }
  };

  return (
    <div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">Select Admission Letter PDF</h3>
      <p className="text-sm text-gray-500 mb-4">Upload a new PDF or choose from previously uploaded letters.</p>

      {/* Upload zone */}
      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-blue-200 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition-all mb-5"
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="text-blue-500 animate-spin" size={32} />
            <p className="text-sm text-blue-600 font-medium">Uploading…</p>
          </div>
        ) : (
          <>
            <Upload className="mx-auto text-blue-400 mb-2" size={32} />
            <p className="text-sm font-medium text-gray-700">Click to upload PDF or Word document</p>
            <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX · Max 20 MB</p>
          </>
        )}
        <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={handleFileChange} />
      </div>

      {/* Existing templates */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-gray-400" size={24} /></div>
      ) : templates.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">No PDFs uploaded yet.</p>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {templates.map((t) => (
            <div
              key={t._id}
              onClick={() => onSelect(t)}
              className={`flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                selected?._id === t._id
                  ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-300'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                <FileText className="text-red-500" size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{t.name}</p>
                <p className="text-xs text-gray-400">
                  {new Date(t.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {selected?._id === t._id && <Check className="text-blue-500" size={16} />}
                <a
                  href={t.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-gray-400 hover:text-blue-500 transition-colors p-1"
                  title="Preview"
                >
                  <Eye size={15} />
                </a>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(t._id); }}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  title="Delete"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Name modal */}
      <Modal open={showNameModal} onClose={() => { setShowNameModal(false); setPendingFile(null); }} title="Name this PDF">
        <p className="text-sm text-gray-600 mb-3">Give this admission letter a recognisable name.</p>
        <input
          autoFocus
          type="text"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleUploadConfirm()}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          placeholder="e.g. Cohort 2025 Admission Letter"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={() => { setShowNameModal(false); setPendingFile(null); }}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUploadConfirm}
            disabled={!nameInput.trim()}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            Upload
          </button>
        </div>
      </Modal>
    </div>
  );
}

// ─── Step 2: Recipient Selection ───────────────────────────────────────────────

function RecipientsStep({ selected, onToggle, onSelectAll, ccEmails, onCcChange }) {
  const [fellows, setFellows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({ total: 0, pages: 1, page: 1 });
  const [ccInput, setCcInput] = useState('');
  const [ccError, setCcError] = useState('');

  const fetchFellows = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const res = await admissionLetterService.getFellows({
        search: params.search ?? search,
        status: params.status ?? statusFilter,
        page: params.page ?? 1,
        limit: 50,
      });
      setFellows(res.fellows || []);
      setPagination(res.pagination || { total: 0, pages: 1, page: 1 });
    } catch {
      toast.error('Failed to load fellows');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { fetchFellows(); }, []);

  const handleSearch = (val) => {
    setSearch(val);
    fetchFellows({ search: val, status: statusFilter });
  };

  const handleStatus = (val) => {
    setStatusFilter(val);
    fetchFellows({ search, status: val });
  };

  const addCc = () => {
    const email = ccInput.trim().toLowerCase();
    if (!email) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setCcError('Invalid email address'); return; }
    if (ccEmails.includes(email)) { setCcError('Already added'); return; }
    onCcChange([...ccEmails, email]);
    setCcInput('');
    setCcError('');
  };

  const removeCc = (email) => onCcChange(ccEmails.filter((e) => e !== email));

  const allOnPageSelected =
    fellows.length > 0 && fellows.every((f) => selected.has(f._id));

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-base font-semibold text-gray-900">Select Recipients</h3>
        {selected.size > 0 && (
          <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
            {selected.size} selected
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-4">Choose fellows who will receive the admission letter.</p>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-3">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search fellows…"
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => handleStatus(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="expired">Expired</option>
        </select>
        <button
          onClick={() => fetchFellows()}
          className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
          title="Refresh"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Select all on page */}
      <div className="flex items-center gap-2 mb-2 px-1">
        <input
          type="checkbox"
          id="selectAll"
          checked={allOnPageSelected}
          onChange={() => onSelectAll(fellows, !allOnPageSelected)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="selectAll" className="text-xs text-gray-600 cursor-pointer">
          Select all on this page ({fellows.length})
        </label>
        <span className="ml-auto text-xs text-gray-400">{pagination.total} total fellows</span>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400" size={24} /></div>
      ) : fellows.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">No fellows found.</div>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden mb-4">
          <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
            {fellows.map((f) => {
              const isSelected = selected.has(f._id);
              return (
                <div
                  key={f._id}
                  onClick={() => onToggle(f._id)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggle(f._id)}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-blue-700">
                      {([f.firstName, f.lastName].filter(Boolean).join('') || f.fullName || f.email || '?')[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {[f.firstName, f.lastName].filter(Boolean).join(' ') || f.fullName || f.email}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{f.email}</p>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 text-right">
                    {f.fellowData?.cohort && (
                      <span className="text-xs text-gray-500">{f.fellowData.cohort}</span>
                    )}
                    {f.fellowData?.fellowshipStatus && (
                      <span className={`text-xs font-medium ${
                        f.fellowData.fellowshipStatus === 'ACTIVE' ? 'text-green-600' :
                        f.fellowData.fellowshipStatus === 'COMPLETED' ? 'text-blue-600' : 'text-orange-500'
                      }`}>
                        {f.fellowData.fellowshipStatus.toLowerCase()}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CC */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          CC Emails <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <div className="flex gap-2">
          <input
            type="email"
            value={ccInput}
            onChange={(e) => { setCcInput(e.target.value); setCcError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCc())}
            placeholder="cc@example.com"
            className={`flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              ccError ? 'border-red-300' : 'border-gray-200'
            }`}
          />
          <button
            onClick={addCc}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
          >
            <Plus size={15} />
          </button>
        </div>
        {ccError && <p className="text-xs text-red-500 mt-1">{ccError}</p>}
        {ccEmails.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {ccEmails.map((e) => (
              <span key={e} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full">
                {e}
                <button onClick={() => removeCc(e)} className="text-gray-400 hover:text-red-500 ml-0.5">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step 3: Compose & Sign-off ────────────────────────────────────────────────

function ComposeStep({ form, onChange, fromEmails, onAddFromEmail }) {
  const [showAddFrom, setShowAddFrom] = useState(false);
  const [newFrom, setNewFrom] = useState({ email: '', displayName: '', isDefault: false });
  const [savingFrom, setSavingFrom] = useState(false);

  const handleAddFrom = async () => {
    if (!newFrom.email || !newFrom.displayName) return;
    setSavingFrom(true);
    try {
      await onAddFromEmail(newFrom);
      setShowAddFrom(false);
      setNewFrom({ email: '', displayName: '', isDefault: false });
      toast.success('Sender email added');
    } catch (err) {
      toast.error(err.message || 'Failed to add sender email');
    } finally {
      setSavingFrom(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">Compose Email</h3>
        <p className="text-sm text-gray-500">Customise the email that fellows will receive.</p>
      </div>

      {/* From */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-medium text-gray-700">From Email</label>
          <button
            onClick={() => setShowAddFrom(true)}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <Plus size={12} /> Add sender
          </button>
        </div>
        <select
          value={form.fromEmail}
          onChange={(e) => {
            const picked = fromEmails.find((f) => f.email === e.target.value);
            onChange('fromEmail', e.target.value);
            if (picked) onChange('fromName', picked.displayName);
          }}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">— Select sender email —</option>
          {fromEmails.map((f) => (
            <option key={f._id} value={f.email}>
              {f.displayName} &lt;{f.email}&gt;{f.isDefault ? ' (default)' : ''}
            </option>
          ))}
        </select>
        {fromEmails.length === 0 && (
          <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
            <AlertCircle size={12} />
            No sender emails configured. Add one above.
          </p>
        )}
      </div>

      {/* From Name (editable override) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Sender Display Name</label>
        <input
          type="text"
          value={form.fromName}
          onChange={(e) => onChange('fromName', e.target.value)}
          placeholder="e.g. Arin Fellowship Program"
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Subject */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Subject</label>
        <input
          type="text"
          value={form.subject}
          onChange={(e) => onChange('subject', e.target.value)}
          placeholder="e.g. Arin Fellowship — Your Admission Letter"
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Body */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Cover Note <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          rows={4}
          value={form.bodyHtml}
          onChange={(e) => onChange('bodyHtml', e.target.value)}
          placeholder="Add a personal message to accompany the PDF… Use {{name}} or {{firstName}} to personalise per fellow."
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
          <AlertCircle size={11} />
          Use <code className="bg-gray-100 px-1 rounded text-gray-600">{'{{name}}'}</code> or <code className="bg-gray-100 px-1 rounded text-gray-600">{'{{firstName}}'}</code> — replaced with each fellow&apos;s name when sent.
        </p>
      </div>

      {/* Sign-off */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Check size={15} className="text-green-500" />
          Digital Sign-Off
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
            <input
              type="text"
              value={form.signOffName}
              onChange={(e) => onChange('signOffName', e.target.value)}
              placeholder="e.g. Dr. Jane Smith"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Title / Role</label>
            <input
              type="text"
              value={form.signOffTitle}
              onChange={(e) => onChange('signOffTitle', e.target.value)}
              placeholder="e.g. Program Director, Arin Fellowship"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        </div>
        {(form.signOffName || form.signOffTitle) && (
          <div className="mt-3 pl-3 border-l-2 border-blue-300">
            <p className="text-sm font-semibold text-gray-800">{form.signOffName || '—'}</p>
            <p className="text-xs text-gray-500">{form.signOffTitle || '—'}</p>
          </div>
        )}
      </div>

      {/* Add Sender Modal */}
      <Modal open={showAddFrom} onClose={() => setShowAddFrom(false)} title="Add Sender Email">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
            <input
              type="email"
              value={newFrom.email}
              onChange={(e) => setNewFrom({ ...newFrom, email: e.target.value })}
              placeholder="fellowship@arinfoundation.org"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
              <AlertCircle size={11} />
              Ensure SPF/DKIM records are configured for this domain.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Display Name</label>
            <input
              type="text"
              value={newFrom.displayName}
              onChange={(e) => setNewFrom({ ...newFrom, displayName: e.target.value })}
              placeholder="Arin Fellowship Program"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={newFrom.isDefault}
              onChange={(e) => setNewFrom({ ...newFrom, isDefault: e.target.checked })}
              className="rounded border-gray-300 text-blue-600"
            />
            <span className="text-sm text-gray-700">Set as default sender</span>
          </label>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={() => setShowAddFrom(false)}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleAddFrom}
            disabled={savingFrom || !newFrom.email || !newFrom.displayName}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {savingFrom && <Loader2 size={14} className="animate-spin" />}
            Add Sender
          </button>
        </div>
      </Modal>
    </div>
  );
}

// ─── Step 4: Review & Send ─────────────────────────────────────────────────────

function ReviewStep({ template, selectedCount, ccEmails, form, onSend, sending }) {
  const rows = [
    { label: 'PDF', value: template?.name },
    { label: 'Recipients', value: `${selectedCount} fellow${selectedCount !== 1 ? 's' : ''}` },
    { label: 'From', value: form.fromEmail ? `${form.fromName} <${form.fromEmail}>` : '—' },
    { label: 'CC', value: ccEmails.length ? ccEmails.join(', ') : 'None' },
    { label: 'Subject', value: form.subject || '—' },
    { label: 'Sign-off', value: form.signOffName ? `${form.signOffName} · ${form.signOffTitle}` : '—' },
  ];

  return (
    <div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">Review & Send</h3>
      <p className="text-sm text-gray-500 mb-5">Confirm everything looks correct before sending.</p>

      <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden mb-5">
        {rows.map((r, i) => (
          <div key={i} className={`flex items-start gap-4 px-4 py-3 ${i < rows.length - 1 ? 'border-b border-gray-100' : ''}`}>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-24 flex-shrink-0 pt-0.5">{r.label}</span>
            <span className="text-sm text-gray-800 break-all">{r.value}</span>
          </div>
        ))}
      </div>

      {selectedCount > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5">
          <AlertCircle className="text-amber-500 flex-shrink-0 mt-0.5" size={16} />
          <p className="text-sm text-amber-800">
            This will immediately send <strong>{selectedCount} email{selectedCount !== 1 ? 's' : ''}</strong>.
            This action cannot be undone.
          </p>
        </div>
      )}

      <button
        onClick={onSend}
        disabled={sending}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {sending ? (
          <><Loader2 size={16} className="animate-spin" /> Sending…</>
        ) : (
          <><Send size={16} /> Send {selectedCount} Letter{selectedCount !== 1 ? 's' : ''}</>
        )}
      </button>
    </div>
  );
}

// ─── Logs Tab ──────────────────────────────────────────────────────────────────

function LogsTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true);
    setSelected(new Set());
    try {
      const res = await admissionLetterService.getLogs({ page, limit: 15 });
      setLogs(res.logs || []);
      setPagination(res.pagination || { total: 0, page: 1, pages: 1 });
    } catch {
      toast.error('Failed to load send history');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this record? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await admissionLetterService.deleteLog(id);
      setLogs((prev) => prev.filter((l) => l._id !== id));
      setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
      toast.success('Record deleted');
    } catch {
      toast.error('Failed to delete record');
    } finally {
      setDeletingId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} selected record${selected.size > 1 ? 's' : ''}? This cannot be undone.`)) return;
    setBulkDeleting(true);
    try {
      await Promise.all([...selected].map((id) => admissionLetterService.deleteLog(id)));
      setLogs((prev) => prev.filter((l) => !selected.has(l._id)));
      setSelected(new Set());
      toast.success(`${selected.size} record${selected.size > 1 ? 's' : ''} deleted`);
    } catch {
      toast.error('Some records could not be deleted');
    } finally {
      setBulkDeleting(false);
    }
  };

  const toggleSelect = (id) => setSelected((prev) => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const allSelected = logs.length > 0 && logs.every((l) => selected.has(l._id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(logs.map((l) => l._id)));

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const openDetail = async (id) => {
    setDetailLoading(true);
    setDetail({ _id: id, loading: true });
    try {
      const res = await admissionLetterService.getLogDetail(id);
      setDetail(res.log);
    } catch {
      toast.error('Failed to load details');
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-gray-900">Send History</h3>
          {selected.size > 0 && (
            <span className="text-xs font-semibold bg-red-50 text-red-600 px-2.5 py-1 rounded-full">
              {selected.size} selected
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {bulkDeleting
                ? <Loader2 size={12} className="animate-spin" />
                : <Trash2 size={12} />}
              Delete {selected.size}
            </button>
          )}
          <button onClick={() => fetchLogs()} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-400" size={24} /></div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Mail size={36} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No letters sent yet.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Subject</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sent</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Opened</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ack'd</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Failed</th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log._id} className={`transition-colors ${selected.has(log._id) ? 'bg-red-50/40' : 'hover:bg-gray-50'}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(log._id)}
                        onChange={() => toggleSelect(log._id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-gray-800 truncate max-w-[180px]">{log.subject}</p>
                      <p className="text-xs text-gray-400">{log.fromEmail}</p>
                    </td>
                    <td className="px-3 py-3 text-gray-600 whitespace-nowrap text-xs">
                      {new Date(log.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-blue-600 font-semibold">{log.successCount}</span>
                      <span className="text-gray-300">/</span>
                      <span className="text-gray-500 text-xs">{log.totalRecipients}</span>
                    </td>
                    <td className="px-3 py-3 text-center text-purple-600 font-semibold">{log.openedCount}</td>
                    <td className="px-3 py-3 text-center text-green-600 font-semibold">{log.acknowledgedCount}</td>
                    <td className="px-3 py-3 text-center text-red-500 font-semibold">{log.failureCount}</td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => openDetail(log._id)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDelete(log._id)}
                          disabled={deletingId === log._id}
                          className="text-red-400 hover:text-red-600 transition-colors disabled:opacity-40"
                          title="Delete"
                        >
                          {deletingId === log._id
                            ? <Loader2 size={13} className="animate-spin" />
                            : <Trash2 size={13} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-4">
              <button
                onClick={() => fetchLogs(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-sm text-gray-600">Page {pagination.page} of {pagination.pages}</span>
              <button
                onClick={() => fetchLogs(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="Send Details"
        maxWidth="max-w-2xl"
      >
        {detailLoading || detail?.loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-gray-400" size={24} /></div>
        ) : detail ? (
          <div>
            <div className="grid grid-cols-2 gap-3 mb-5 text-sm">
              {[
                ['Subject', detail.subject],
                ['From', `${detail.fromName} <${detail.fromEmail}>`],
                ['Sign-off', detail.signOffName ? `${detail.signOffName} · ${detail.signOffTitle}` : '—'],
                ['Sent by', detail.sentBy ? `${detail.sentBy.firstName} ${detail.sentBy.lastName}` : '—'],
              ].map(([l, v]) => (
                <div key={l}>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">{l}</p>
                  <p className="text-gray-800 break-all">{v}</p>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-2 mb-5">
              {[
                { label: 'Total', val: detail.totalRecipients, color: 'text-gray-700', bg: 'bg-gray-100' },
                { label: 'Sent', val: detail.successCount, color: 'text-blue-700', bg: 'bg-blue-50' },
                { label: 'Opened', val: detail.openedCount, color: 'text-purple-700', bg: 'bg-purple-50' },
                { label: "Ack'd", val: detail.acknowledgedCount, color: 'text-green-700', bg: 'bg-green-50' },
              ].map((s) => (
                <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
                  <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Recipients list */}
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Recipients</h4>
            <div className="border border-gray-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
              <div className="divide-y divide-gray-100">
                {(detail.recipients || []).map((r, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-blue-700">
                        {r.name?.[0] || '?'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">{r.name}</p>
                      <p className="text-xs text-gray-400 truncate">{r.email}</p>
                    </div>
                    <StatusBadge status={r.status} />
                    {r.sentAt && (
                      <span className="text-xs text-gray-400 hidden sm:block">
                        {new Date(r.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

const STEPS = ['PDF', 'Recipients', 'Compose', 'Review'];

const EMPTY_FORM = {
  subject: '',
  bodyHtml: '',
  fromEmail: '',
  fromName: '',
  signOffName: '',
  signOffTitle: '',
};

export default function AdmissionLettersPage() {
  const [tab, setTab] = useState('send'); // 'send' | 'logs'
  const [step, setStep] = useState(1);

  // Data
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [fromEmails, setFromEmails] = useState([]);

  // Wizard state
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedFellows, setSelectedFellows] = useState(new Set());
  const [ccEmails, setCcEmails] = useState([]);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [sending, setSending] = useState(false);

  // Success state
  const [sentResult, setSentResult] = useState(null);

  const loadTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    try {
      const res = await admissionLetterService.listPdfs();
      setTemplates(res.templates || []);
    } catch {
      toast.error('Failed to load PDFs');
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  const loadFromEmails = useCallback(async () => {
    try {
      const res = await admissionLetterService.listFromEmails();
      const emails = res.emails || [];
      setFromEmails(emails);
      // Auto-select default
      const def = emails.find((e) => e.isDefault);
      if (def && !form.fromEmail) {
        setForm((f) => ({ ...f, fromEmail: def.email, fromName: def.displayName }));
      }
    } catch {
      // silent — not critical
    }
  }, []);

  useEffect(() => {
    loadTemplates();
    loadFromEmails();
  }, []);

  const handleFieldChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleToggleFellow = (id) => {
    setSelectedFellows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSelectAll = (fellows, select) => {
    setSelectedFellows((prev) => {
      const next = new Set(prev);
      fellows.forEach((f) => (select ? next.add(f._id) : next.delete(f._id)));
      return next;
    });
  };

  const canAdvance = () => {
    if (step === 1) return !!selectedTemplate;
    if (step === 2) return selectedFellows.size > 0;
    if (step === 3)
      return (
        form.subject.trim() &&
        form.fromEmail &&
        form.fromName.trim() &&
        form.signOffName.trim() &&
        form.signOffTitle.trim()
      );
    return true;
  };

  const handleSend = async () => {
    setSending(true);
    try {
      const res = await admissionLetterService.sendLetters({
        templateId: selectedTemplate._id,
        subject: form.subject,
        bodyHtml: form.bodyHtml,
        fromEmail: form.fromEmail,
        fromName: form.fromName,
        ccEmails,
        recipientIds: Array.from(selectedFellows),
        signOffName: form.signOffName,
        signOffTitle: form.signOffTitle,
      });
      setSentResult(res);
      toast.success(`Sending ${res.totalRecipients} letters — in progress`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send letters');
    } finally {
      setSending(false);
    }
  };

  const resetWizard = () => {
    setStep(1);
    setSelectedTemplate(null);
    setSelectedFellows(new Set());
    setCcEmails([]);
    setForm({ ...EMPTY_FORM });
    setSentResult(null);
  };

  const handleDeleteTemplate = async (id) => {
    if (!confirm('Delete this PDF?')) return;
    try {
      await admissionLetterService.deletePdf(id);
      setTemplates((prev) => prev.filter((t) => t._id !== id));
      if (selectedTemplate?._id === id) setSelectedTemplate(null);
      toast.success('PDF deleted');
    } catch {
      toast.error('Failed to delete PDF');
    }
  };

  const handleAddFromEmail = async (payload) => {
    const res = await admissionLetterService.addFromEmail(payload);
    await loadFromEmails();
    return res;
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (sentResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-500" size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Letters Are Being Sent!</h2>
          <p className="text-gray-500 text-sm mb-6">
            {sentResult.totalRecipients} admission letter{sentResult.totalRecipients !== 1 ? 's are' : ' is'} being
            delivered in the background. Check the Send History tab to track delivery.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => { resetWizard(); setTab('logs'); }}
              className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              View Send History
            </button>
            <button
              onClick={resetWizard}
              className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Send Another Batch
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Admission Letters</h1>
          <p className="text-gray-500 text-sm mt-1">Upload and send admission letters to fellows.</p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          {[
            { key: 'send', label: 'Send Letters', icon: Send },
            { key: 'logs', label: 'Send History', icon: Clock },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === key
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {tab === 'logs' ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <LogsTab />
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            {/* Step indicator */}
            <StepIndicator steps={STEPS} current={step} />

            {/* Step content */}
            <div className="min-h-[320px]">
              {step === 1 && (
                <PdfStep
                  selected={selectedTemplate}
                  onSelect={setSelectedTemplate}
                  templates={templates}
                  onUpload={async (payload) => {
                    const res = await admissionLetterService.savePdf(payload);
                    setTemplates((prev) => [res.template, ...prev]);
                    setSelectedTemplate(res.template);
                  }}
                  onDelete={handleDeleteTemplate}
                  loading={templatesLoading}
                />
              )}
              {step === 2 && (
                <RecipientsStep
                  selected={selectedFellows}
                  onToggle={handleToggleFellow}
                  onSelectAll={handleSelectAll}
                  ccEmails={ccEmails}
                  onCcChange={setCcEmails}
                />
              )}
              {step === 3 && (
                <ComposeStep
                  form={form}
                  onChange={handleFieldChange}
                  fromEmails={fromEmails}
                  onAddFromEmail={handleAddFromEmail}
                />
              )}
              {step === 4 && (
                <ReviewStep
                  template={selectedTemplate}
                  selectedCount={selectedFellows.size}
                  ccEmails={ccEmails}
                  form={form}
                  onSend={handleSend}
                  sending={sending}
                />
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-5 border-t border-gray-100">
              <button
                onClick={() => setStep((s) => s - 1)}
                disabled={step === 1}
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-0 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft size={15} /> Back
              </button>

              <div className="flex items-center gap-1">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i + 1 === step ? 'w-6 bg-blue-600' : i + 1 < step ? 'w-3 bg-green-400' : 'w-3 bg-gray-200'
                    }`}
                  />
                ))}
              </div>

              {step < 4 ? (
                <button
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canAdvance()}
                  className="flex items-center gap-1.5 px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Next <ChevronRight size={15} />
                </button>
              ) : (
                // On step 4, the send button is inside ReviewStep
                <div className="w-20" />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
