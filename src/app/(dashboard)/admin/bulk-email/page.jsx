'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mail,
  Send,
  Users,
  Filter,
  Paperclip,
  X,
  Plus,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { bulkEmailService } from '@/lib/api/adminService';
import categoryService from '@/lib/api/categoryService';
import uploadService from '@/lib/api/uploadService';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';

// Lazy-load Quill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';

// ─── Constants ───────────────────────────────────────────────────────────────

const FILTER_OPTIONS = [
  { value: 'all_fellows', label: 'All Fellows' },
  { value: 'by_category', label: 'By Category / Programme' },
  { value: 'by_cohort', label: 'By Cohort' },
  { value: 'all_students', label: 'All Students' },
  { value: 'all_instructors', label: 'All Instructors' },
  { value: 'manual', label: 'Manual Selection' },
];

const STATUS_COLOR = {
  sending: 'bg-yellow-100 text-yellow-800',
  sent: 'bg-green-100 text-green-800',
  partial: 'bg-orange-100 text-orange-800',
  failed: 'bg-red-100 text-red-800',
};

const RECIPIENT_STATUS_COLOR = {
  sent: 'text-green-600',
  failed: 'text-red-500',
  pending: 'text-gray-400',
};

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ color: [] }, { background: [] }],
    ['link'],
    ['clean'],
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-KE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function fileSizeLabel(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BulkEmailPage() {
  const [activeTab, setActiveTab] = useState('compose');

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-green-100 rounded-lg">
          <Mail className="h-6 w-6 text-green-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Email</h1>
          <p className="text-sm text-gray-500">
            Compose and send emails to multiple fellows at once
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="compose" className="flex items-center gap-2">
            <Send className="h-4 w-4" /> Compose
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock className="h-4 w-4" /> Campaign History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compose">
          <ComposePanel />
        </TabsContent>

        <TabsContent value="history">
          <HistoryPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Compose Panel ────────────────────────────────────────────────────────────

function ComposePanel() {
  // Step state: 1 = recipients, 2 = compose, 3 = preview & send
  const [step, setStep] = useState(1);

  // Recipients
  const [filterType, setFilterType] = useState('all_fellows');
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [cohortInput, setCohortInput] = useState('');
  const [selectedCohorts, setSelectedCohorts] = useState([]);
  const [manualEmailInput, setManualEmailInput] = useState('');
  const [manualUsers, setManualUsers] = useState([]); // {id, name, email}
  const [previewRecipients, setPreviewRecipients] = useState(null);
  const [previewing, setPreviewing] = useState(false);

  // Compose
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  // CC / BCC
  const [ccInput, setCcInput] = useState('');
  const [ccList, setCcList] = useState([]);
  const [bccInput, setBccInput] = useState('');
  const [bccList, setBccList] = useState([]);
  const [showBcc, setShowBcc] = useState(false);

  // Attachments
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Send
  const [sending, setSending] = useState(false);

  // Load categories once
  useEffect(() => {
    categoryService.getAllCategories().then(setCategories).catch(() => {});
  }, []);

  // ── Recipients helpers ──

  const buildFilterPayload = useCallback(() => ({
    filterType,
    filterCategoryIds: filterType === 'by_category' ? selectedCategories : undefined,
    filterCohorts: filterType === 'by_cohort' ? selectedCohorts : undefined,
    manualUserIds: filterType === 'manual' ? manualUsers.map((u) => u.id) : undefined,
  }), [filterType, selectedCategories, selectedCohorts, manualUsers]);

  const handlePreviewRecipients = async () => {
    setPreviewing(true);
    try {
      const res = await bulkEmailService.previewRecipients(buildFilterPayload());
      setPreviewRecipients(res.data);
    } catch {
      toast.error('Failed to load recipients');
    } finally {
      setPreviewing(false);
    }
  };

  const toggleCategory = (id) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
    setPreviewRecipients(null);
  };

  const addCohort = () => {
    const trimmed = cohortInput.trim();
    if (trimmed && !selectedCohorts.includes(trimmed)) {
      setSelectedCohorts((p) => [...p, trimmed]);
      setPreviewRecipients(null);
    }
    setCohortInput('');
  };

  const removeCohort = (c) => {
    setSelectedCohorts((p) => p.filter((x) => x !== c));
    setPreviewRecipients(null);
  };

  // ── CC / BCC helpers ──

  const addEmail = (value, setter, listSetter) => {
    const trimmed = value.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      toast.error('Enter a valid email address');
      return;
    }
    listSetter((prev) => {
      if (prev.some((e) => e.email === trimmed)) return prev;
      return [...prev, { email: trimmed }];
    });
    setter('');
  };

  const removeFromList = (email, listSetter) => {
    listSetter((prev) => prev.filter((e) => e.email !== email));
  };

  // ── Attachments ──

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const result = await uploadService.uploadDocument(file);
        setAttachments((prev) => [
          ...prev,
          {
            filename: file.name,
            url: result.url,
            mimeType: file.type || 'application/octet-stream',
            size: file.size,
          },
        ]);
      }
      toast.success('Attachment(s) uploaded');
    } catch {
      toast.error('Failed to upload attachment');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (idx) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Send ──

  const handleSend = async () => {
    if (!subject.trim()) { toast.error('Subject is required'); return; }
    if (!body.trim() || body === '<p><br></p>') { toast.error('Email body is required'); return; }

    setSending(true);
    try {
      const payload = {
        ...buildFilterPayload(),
        subject,
        body,
        cc: ccList.length ? ccList : undefined,
        bcc: bccList.length ? bccList : undefined,
        attachments: attachments.length ? attachments : undefined,
      };
      const res = await bulkEmailService.send(payload);
      toast.success(res.message || `Campaign started for ${res.total} recipient(s)`);
      // Reset form
      setStep(1);
      setSubject('');
      setBody('');
      setCcList([]);
      setBccList([]);
      setAttachments([]);
      setPreviewRecipients(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send emails');
    } finally {
      setSending(false);
    }
  };

  // ── Step validation ──

  const canProceedStep1 = (() => {
    if (filterType === 'by_category') return selectedCategories.length > 0;
    if (filterType === 'by_cohort') return selectedCohorts.length > 0;
    if (filterType === 'manual') return manualUsers.length > 0;
    return true;
  })();

  const canProceedStep2 = subject.trim().length > 0 && body.trim().length > 0 && body !== '<p><br></p>';

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        {['Recipients', 'Compose', 'Review & Send'].map((label, i) => {
          const num = i + 1;
          const active = step === num;
          const done = step > num;
          return (
            <React.Fragment key={label}>
              <button
                onClick={() => done && setStep(num)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-colors ${
                  active
                    ? 'bg-green-600 text-white'
                    : done
                      ? 'bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer'
                      : 'bg-gray-100 text-gray-400 cursor-default'
                }`}
              >
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs border border-current">
                  {done ? '✓' : num}
                </span>
                {label}
              </button>
              {i < 2 && <ChevronRight className="h-4 w-4 text-gray-300" />}
            </React.Fragment>
          );
        })}
      </div>

      {/* ── STEP 1: Recipients ─────────────────────────────────────────── */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-green-600" /> Select Recipients
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Filter type */}
            <div>
              <Label className="mb-1.5 block">Recipient Group</Label>
              <Select
                value={filterType}
                onValueChange={(v) => {
                  setFilterType(v);
                  setPreviewRecipients(null);
                }}
              >
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FILTER_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category picker */}
            {filterType === 'by_category' && (
              <div>
                <Label className="mb-2 block">Select Categories / Programmes</Label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => {
                    const selected = selectedCategories.includes(cat._id);
                    return (
                      <button
                        key={cat._id}
                        onClick={() => toggleCategory(cat._id)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                          selected
                            ? 'bg-green-600 text-white border-green-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-green-400'
                        }`}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                  {categories.length === 0 && (
                    <p className="text-sm text-gray-400">No categories found.</p>
                  )}
                </div>
              </div>
            )}

            {/* Cohort picker */}
            {filterType === 'by_cohort' && (
              <div>
                <Label className="mb-2 block">Cohort Names</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={cohortInput}
                    onChange={(e) => setCohortInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCohort()}
                    placeholder="e.g. Cohort 3"
                    className="max-w-xs"
                  />
                  <Button variant="outline" size="sm" onClick={addCohort}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedCohorts.map((c) => (
                    <Badge key={c} variant="secondary" className="flex items-center gap-1">
                      {c}
                      <button onClick={() => removeCohort(c)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Manual selection — search fellows by email */}
            {filterType === 'manual' && (
              <ManualRecipientSelector
                manualUsers={manualUsers}
                setManualUsers={setManualUsers}
                onChange={() => setPreviewRecipients(null)}
              />
            )}

            {/* Preview recipients */}
            <div className="pt-2 border-t flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviewRecipients}
                disabled={previewing || !canProceedStep1}
              >
                {previewing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Eye className="h-4 w-4 mr-1" />
                )}
                Preview Recipients
              </Button>
              {previewRecipients !== null && (
                <span className="text-sm text-gray-600">
                  <strong>{previewRecipients.length}</strong> recipient
                  {previewRecipients.length !== 1 ? 's' : ''} will receive this email
                </span>
              )}
            </div>

            {/* Preview list */}
            {previewRecipients !== null && previewRecipients.length > 0 && (
              <RecipientPreviewList recipients={previewRecipients} />
            )}

            <div className="flex justify-end pt-2">
              <Button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Next: Compose <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── STEP 2: Compose ───────────────────────────────────────────── */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-4 w-4 text-green-600" /> Compose Email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Subject */}
            <div>
              <Label htmlFor="subject" className="mb-1.5 block">Subject *</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject line"
                className="max-w-2xl"
              />
            </div>

            {/* CC */}
            <div>
              <Label className="mb-1.5 block">CC</Label>
              <div className="flex gap-2 mb-2 max-w-2xl">
                <Input
                  value={ccInput}
                  onChange={(e) => setCcInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && addEmail(ccInput, setCcInput, setCcList)
                  }
                  placeholder="email@example.com — press Enter to add"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addEmail(ccInput, setCcInput, setCcList)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {ccList.map((e) => (
                  <Badge key={e.email} variant="outline" className="flex items-center gap-1 text-xs">
                    {e.email}
                    <button onClick={() => removeFromList(e.email, setCcList)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* BCC toggle */}
            <div>
              {!showBcc ? (
                <button
                  className="text-xs text-green-600 hover:underline"
                  onClick={() => setShowBcc(true)}
                >
                  + Add BCC
                </button>
              ) : (
                <div>
                  <Label className="mb-1.5 block">BCC</Label>
                  <div className="flex gap-2 mb-2 max-w-2xl">
                    <Input
                      value={bccInput}
                      onChange={(e) => setBccInput(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === 'Enter' && addEmail(bccInput, setBccInput, setBccList)
                      }
                      placeholder="email@example.com — press Enter to add"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addEmail(bccInput, setBccInput, setBccList)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {bccList.map((e) => (
                      <Badge key={e.email} variant="outline" className="flex items-center gap-1 text-xs">
                        {e.email}
                        <button onClick={() => removeFromList(e.email, setBccList)}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Body */}
            <div>
              <Label className="mb-1.5 block">Body *</Label>
              <div className="border rounded-lg overflow-hidden max-w-3xl">
                <ReactQuill
                  theme="snow"
                  value={body}
                  onChange={setBody}
                  modules={QUILL_MODULES}
                  style={{ minHeight: 220 }}
                  placeholder="Write your email body here…"
                />
              </div>
            </div>

            {/* Attachments */}
            <div>
              <Label className="mb-1.5 block">Attachments</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {attachments.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 bg-gray-50 border rounded-lg px-3 py-2 text-sm"
                  >
                    <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className="max-w-[160px] truncate">{a.filename}</span>
                    {a.size > 0 && (
                      <span className="text-gray-400 text-xs">
                        {fileSizeLabel(a.size)}
                      </span>
                    )}
                    <button onClick={() => removeAttachment(i)}>
                      <X className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
              />
              <Button
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Paperclip className="h-4 w-4 mr-1" />
                )}
                {uploading ? 'Uploading…' : 'Attach File(s)'}
              </Button>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                ← Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!canProceedStep2}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Next: Review <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── STEP 3: Review & Send ────────────────────────────────────────── */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Send className="h-4 w-4 text-green-600" /> Review & Send
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
              <SummaryRow label="Recipients" value={FILTER_OPTIONS.find((o) => o.value === filterType)?.label} />
              {previewRecipients !== null && (
                <SummaryRow
                  label="Estimated count"
                  value={`${previewRecipients.length} recipient${previewRecipients.length !== 1 ? 's' : ''}`}
                />
              )}
              <SummaryRow label="Subject" value={subject} />
              {ccList.length > 0 && (
                <SummaryRow label="CC" value={ccList.map((e) => e.email).join(', ')} />
              )}
              {bccList.length > 0 && (
                <SummaryRow label="BCC" value={bccList.map((e) => e.email).join(', ')} />
              )}
              {attachments.length > 0 && (
                <SummaryRow
                  label="Attachments"
                  value={attachments.map((a) => a.filename).join(', ')}
                />
              )}
            </div>

            {/* Body preview */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Email Body Preview
              </p>
              <div
                className="border rounded-lg p-4 max-h-64 overflow-y-auto prose prose-sm max-w-none text-gray-800"
                dangerouslySetInnerHTML={{ __html: body }}
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
              Emails are sent in batches in the background. Large campaigns may take a few minutes.
              You can track delivery status in Campaign History.
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                ← Back
              </Button>
              <Button
                onClick={handleSend}
                disabled={sending}
                className="bg-green-600 hover:bg-green-700 text-white min-w-[120px]"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Email
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Manual Recipient Selector ────────────────────────────────────────────────

function ManualRecipientSelector({ manualUsers, setManualUsers, onChange }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);

  const handleSearch = useCallback(
    (value) => {
      setSearch(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (value.trim().length < 2) { setResults([]); return; }
      debounceRef.current = setTimeout(async () => {
        setSearching(true);
        try {
          // Use preview with manual filter to search — or just allow email entry
          // For now, allow direct email entry
          setResults([]);
        } finally {
          setSearching(false);
        }
      }, 400);
    },
    [],
  );

  const addManual = () => {
    const trimmed = search.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      toast.error('Enter a valid email address');
      return;
    }
    if (manualUsers.some((u) => u.email === trimmed)) return;
    const newUser = { id: trimmed, name: trimmed, email: trimmed };
    setManualUsers((p) => [...p, newUser]);
    onChange();
    setSearch('');
  };

  const remove = (email) => {
    setManualUsers((p) => p.filter((u) => u.email !== email));
    onChange();
  };

  return (
    <div>
      <Label className="mb-2 block">Add Recipients by Email</Label>
      <div className="flex gap-2 mb-3 max-w-md">
        <Input
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addManual()}
          placeholder="fellow@example.com — press Enter to add"
        />
        <Button variant="outline" size="sm" onClick={addManual}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {manualUsers.length > 0 && (
        <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
          {manualUsers.map((u) => (
            <Badge
              key={u.email}
              variant="secondary"
              className="flex items-center gap-1 text-xs"
            >
              {u.email}
              <button onClick={() => remove(u.email)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      {manualUsers.length > 0 && (
        <p className="text-xs text-gray-500 mt-1">
          {manualUsers.length} recipient{manualUsers.length !== 1 ? 's' : ''} added manually
        </p>
      )}
    </div>
  );
}

// ─── Recipient Preview List ───────────────────────────────────────────────────

function RecipientPreviewList({ recipients }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? recipients : recipients.slice(0, 5);

  return (
    <div className="border rounded-lg overflow-hidden text-sm">
      <div className="bg-gray-50 px-4 py-2 font-medium text-gray-700 border-b flex items-center justify-between">
        <span>Recipients ({recipients.length})</span>
        {recipients.length > 5 && (
          <button
            className="text-green-600 hover:underline text-xs"
            onClick={() => setExpanded((p) => !p)}
          >
            {expanded ? 'Show less' : `Show all ${recipients.length}`}
          </button>
        )}
      </div>
      <div className="divide-y">
        {shown.map((r) => (
          <div key={r.id || r.email} className="flex items-center justify-between px-4 py-2">
            <div>
              <p className="font-medium text-gray-800">{r.name}</p>
              <p className="text-gray-500 text-xs">{r.email}</p>
            </div>
            {r.cohort && (
              <Badge variant="outline" className="text-xs">
                {r.cohort}
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Summary Row ─────────────────────────────────────────────────────────────

function SummaryRow({ label, value }) {
  return (
    <div className="flex gap-3">
      <span className="w-28 font-medium text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-gray-800">{value || '—'}</span>
    </div>
  );
}

// ─── History Panel ────────────────────────────────────────────────────────────

function HistoryPanel() {
  const [campaigns, setCampaigns] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await bulkEmailService.getCampaigns(20, 0);
      setCampaigns(res.data || []);
      setTotal(res.total || 0);
    } catch {
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const openDetail = async (campaign) => {
    setDetailOpen(true);
    setLoadingDetail(true);
    try {
      const res = await bulkEmailService.getCampaign(campaign._id);
      setSelected(res.data);
    } catch {
      toast.error('Failed to load campaign details');
      setDetailOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4 text-green-600" /> Campaign History
        </CardTitle>
        <Button variant="outline" size="sm" onClick={fetchCampaigns} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Mail className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No bulk email campaigns yet.</p>
          </div>
        ) : (
          <div className="divide-y">
            {campaigns.map((c) => (
              <div
                key={c._id}
                className="py-4 flex items-start justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-900 truncate">{c.subject}</p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[c.status] || 'bg-gray-100 text-gray-600'}`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Sent by <strong>{c.senderName}</strong> · {formatDate(c.createdAt)}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" /> {c.totalRecipients} total
                    </span>
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-3 w-3" /> {c.sentCount} sent
                    </span>
                    {c.failedCount > 0 && (
                      <span className="flex items-center gap-1 text-red-500">
                        <AlertCircle className="h-3 w-3" /> {c.failedCount} failed
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openDetail(c)}
                  className="flex-shrink-0"
                >
                  Details
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Campaign Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Campaign Details</DialogTitle>
          </DialogHeader>
          {loadingDetail ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : selected ? (
            <CampaignDetail campaign={selected} />
          ) : null}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ─── Campaign Detail ──────────────────────────────────────────────────────────

function CampaignDetail({ campaign }) {
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? campaign.recipients : campaign.recipients?.slice(0, 10);

  const deliveryRate =
    campaign.totalRecipients > 0
      ? Math.round((campaign.sentCount / campaign.totalRecipients) * 100)
      : 0;

  return (
    <div className="space-y-5 text-sm">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: campaign.totalRecipients, color: 'text-gray-800' },
          { label: 'Sent', value: campaign.sentCount, color: 'text-green-600' },
          { label: 'Failed', value: campaign.failedCount, color: 'text-red-500' },
        ].map((s) => (
          <div key={s.label} className="bg-gray-50 rounded-lg p-3 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Delivery rate bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Delivery rate</span>
          <span>{deliveryRate}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all"
            style={{ width: `${deliveryRate}%` }}
          />
        </div>
      </div>

      {/* Meta */}
      <div className="space-y-2 bg-gray-50 rounded-lg p-3">
        <SummaryRow label="Subject" value={campaign.subject} />
        <SummaryRow label="Sender" value={campaign.senderName} />
        <SummaryRow label="Status" value={campaign.status} />
        <SummaryRow label="Sent at" value={formatDate(campaign.createdAt)} />
        <SummaryRow label="Completed" value={formatDate(campaign.completedAt)} />
        {campaign.cc?.length > 0 && (
          <SummaryRow label="CC" value={campaign.cc.map((c) => c.email).join(', ')} />
        )}
        {campaign.bcc?.length > 0 && (
          <SummaryRow label="BCC" value={campaign.bcc.map((b) => b.email).join(', ')} />
        )}
        {campaign.attachments?.length > 0 && (
          <SummaryRow
            label="Attachments"
            value={campaign.attachments.map((a) => a.filename).join(', ')}
          />
        )}
      </div>

      {/* Recipient delivery list */}
      {campaign.recipients?.length > 0 && (
        <div>
          <p className="font-medium text-gray-700 mb-2">
            Recipient Delivery Status
          </p>
          <div className="border rounded-lg overflow-hidden">
            <div className="divide-y max-h-64 overflow-y-auto">
              {shown?.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-gray-800">{r.name}</p>
                    <p className="text-gray-500 text-xs">{r.email}</p>
                    {r.error && (
                      <p className="text-red-500 text-xs mt-0.5">{r.error}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span
                      className={`text-xs font-medium capitalize ${RECIPIENT_STATUS_COLOR[r.status] || 'text-gray-400'}`}
                    >
                      {r.status}
                    </span>
                    {r.sentAt && (
                      <span className="text-gray-400 text-xs">
                        {formatDate(r.sentAt)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {campaign.recipients.length > 10 && (
              <div className="px-3 py-2 border-t bg-gray-50 text-center">
                <button
                  className="text-green-600 text-xs hover:underline"
                  onClick={() => setShowAll((p) => !p)}
                >
                  {showAll
                    ? 'Show less'
                    : `Show all ${campaign.recipients.length} recipients`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
