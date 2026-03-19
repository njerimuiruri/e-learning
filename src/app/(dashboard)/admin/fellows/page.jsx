'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import adminService from '@/lib/api/adminService';
import categoryService from '@/lib/api/categoryService';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

// ─────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────
const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
const TRACK_OPTIONS  = ['AI & Machine Learning', 'Data Science', 'Climate Tech', 'Agri-Tech', 'Health Tech', 'FinTech', 'EdTech', 'Other'];

const BLANK_ROW = () => ({
  id: Date.now() + Math.random(),
  fullName: '', email: '', gender: '',
  country: '', region: '', track: '', category: '', phoneNumber: '',
});


// ─────────────────────────────────────────────────────────────────
// MODAL WRAPPER
// ─────────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children, maxWidth = 'max-w-2xl' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><Icons.X className="w-5 h-5" /></Button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color = 'blue', sub }) {
  const colors = {
    blue:   'bg-blue-50 text-blue-600 border-blue-100',
    green:  'bg-green-50 text-green-600 border-green-100',
    amber:  'bg-amber-50 text-amber-600 border-amber-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    red:    'bg-red-50 text-red-600 border-red-100',
  };
  return (
    <Card className={`border ${colors[color]}`}>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs mt-1 opacity-60">{sub}</p>}
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-white/60 border`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────
// SINGLE FELLOW FORM
// ─────────────────────────────────────────────────────────────────
function SingleFellowForm({ categories, onSuccess, onClose }) {
  const [form, setForm] = useState({
    fullName: '', email: '', gender: '',
    country: '', region: '', track: '', category: '', phoneNumber: '',
    sendEmail: true,
  });
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(null); // { email, temporaryPassword, emailSent }
  const [copied, setCopied] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const copyPassword = (pw) => {
    navigator.clipboard.writeText(pw).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSubmit = async () => {
    if (!form.email) return toast.error('Email address is required');
    setLoading(true);
    try {
      const res = await adminService.createFellow({
        ...form,
        fullName: form.fullName,
        category: (form.category && form.category !== '__none__') ? form.category : undefined,
      });
      if (form.sendEmail) {
        toast.success('Fellow created and invitation email sent!');
        onSuccess?.();
        onClose?.();
      } else {
        // Show temp password to admin so they can share it manually
        setCreated({ email: form.email, temporaryPassword: res.temporaryPassword, emailSent: false });
        onSuccess?.();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create fellow');
    } finally {
      setLoading(false);
    }
  };

  // ── Success state: show temp password ────────────────────────────
  if (created) {
    return (
      <div className="space-y-5">
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
            <Icons.CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-gray-900">Fellow Created</h3>
            <p className="text-sm text-gray-500 mt-0.5">{created.email}</p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-2">
            <Icons.KeyRound className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Temporary Password</p>
              <p className="text-xs text-amber-600 mt-0.5">
                No invitation email was sent. Share this temporary password with the fellow. They will be required to change it on first login.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white border border-amber-200 rounded-lg px-3 py-2">
            <code className="flex-1 text-sm font-mono font-bold text-gray-900 tracking-wider">
              {created.temporaryPassword}
            </code>
            <Button
              variant="ghost" size="sm"
              onClick={() => copyPassword(created.temporaryPassword)}
              className="gap-1.5 text-xs h-7"
            >
              {copied
                ? <><Icons.CheckCircle className="w-3.5 h-3.5 text-green-500" /> Copied!</>
                : <><Icons.Copy className="w-3.5 h-3.5" /> Copy</>}
            </Button>
          </div>
          <p className="text-xs text-amber-600">
            You can also send the invitation email later using the <strong>Send Invitations</strong> button (which will generate a fresh password automatically).
          </p>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose} className="bg-green-600 hover:bg-green-700">Done</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <Label>Full Name</Label>
        <Input value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="e.g. Amara Diallo" />
      </div>
      <div className="space-y-1">
        <Label>Email Address <span className="text-red-500">*</span></Label>
        <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="fellow@example.com" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Phone Number</Label>
          <Input value={form.phoneNumber} onChange={e => set('phoneNumber', e.target.value)} placeholder="+254 700 000 000" />
        </div>
        <div className="space-y-1">
          <Label>Gender</Label>
          <Select value={form.gender} onValueChange={v => set('gender', v)}>
            <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
            <SelectContent>{GENDER_OPTIONS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Country</Label>
          <Input value={form.country} onChange={e => set('country', e.target.value)} placeholder="e.g. Kenya" />
        </div>
        <div className="space-y-1">
          <Label>Region</Label>
          <Input value={form.region} onChange={e => set('region', e.target.value)} placeholder="e.g. East Africa" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Track</Label>
          <Select value={form.track} onValueChange={v => set('track', v)}>
            <SelectTrigger><SelectValue placeholder="Select track" /></SelectTrigger>
            <SelectContent>{TRACK_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Category</Label>
          <Select value={form.category} onValueChange={v => set('category', v)}>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">None</SelectItem>
              {categories.map(c => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <div className={`flex items-start gap-3 p-4 rounded-xl border ${form.sendEmail ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-200'}`}>
        <Checkbox id="sendEmail" checked={form.sendEmail} onCheckedChange={v => set('sendEmail', v)} className="mt-0.5" />
        <div>
          <label htmlFor="sendEmail" className={`text-sm font-medium cursor-pointer ${form.sendEmail ? 'text-blue-800' : 'text-gray-700'}`}>
            Send invitation email with temporary password
          </label>
          <p className={`text-xs mt-0.5 ${form.sendEmail ? 'text-blue-600' : 'text-gray-500'}`}>
            {form.sendEmail
              ? 'Fellow will receive a welcome email with their temporary password and a prompt to set a new one on first login.'
              : 'No email will be sent. A temporary password will be shown to you after creation so you can share it manually.'}
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={loading} className="gap-2 bg-green-600 hover:bg-green-700">
          {loading ? <><Icons.Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><Icons.UserPlus className="w-4 h-4" /> Create Fellow</>}
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// BULK TABLE ROW EDITOR
// ─────────────────────────────────────────────────────────────────
function BulkTableEditor({ categories, onSuccess, onClose }) {
  const [rows, setRows]         = useState([BLANK_ROW(), BLANK_ROW(), BLANK_ROW()]);
  const [sendEmails, setSend]   = useState(true);
  const [loading, setLoading]   = useState(false);
  const [results, setResults]   = useState(null);
  const fileRef                 = useRef(null);

  const updateRow = (idx, field, val) =>
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));

  const addRow = () => setRows(prev => [...prev, BLANK_ROW()]);
  const removeRow = (idx) => setRows(prev => prev.filter((_, i) => i !== idx));

  // Paste handler — tab-separated rows: Full Name \t email \t gender \t country \t region \t track \t phone
  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text');
    const lines = text.trim().split('\n').filter(l => l.trim());
    if (lines.length < 1) return;

    const parsed = lines.map(line => {
      const cols = line.split('\t').map(s => s.trim());
      return {
        id: Date.now() + Math.random(),
        fullName:    cols[0] || '',
        email:       cols[1] || '',
        gender:      cols[2] || '',
        country:     cols[3] || '',
        region:      cols[4] || '',
        track:       cols[5] || '',
        category:    '',
        phoneNumber: cols[6] || '',
      };
    });

    const nonEmpty = rows.filter(r => r.email || r.fullName);
    setRows([...nonEmpty, ...parsed]);
    toast.success(`Pasted ${parsed.length} row${parsed.length !== 1 ? 's' : ''}`);
  };

  // CSV upload
  const handleCSV = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) return toast.error('CSV must have a header row and at least one data row');

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, ''));
      const colIdx = (names) => names.map(n => headers.indexOf(n)).find(i => i >= 0) ?? -1;

      const fullNameIdx = colIdx(['fullname', 'full_name', 'name']);
      const fNameIdx    = colIdx(['firstname', 'first_name']);
      const lNameIdx    = colIdx(['lastname',  'last_name']);
      const emailIdx    = colIdx(['email']);
      const genderIdx   = colIdx(['gender']);
      const countryIdx  = colIdx(['country']);
      const regionIdx   = colIdx(['region']);
      const trackIdx    = colIdx(['track']);
      const phoneIdx    = colIdx(['phone', 'phonenumber', 'phone_number']);

      if (emailIdx < 0) return toast.error('CSV must have an "email" column');

      const parsed = lines.slice(1).map(line => {
        const cols = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
        const fn = fNameIdx >= 0 ? cols[fNameIdx] : '';
        const ln = lNameIdx >= 0 ? cols[lNameIdx] : '';
        const resolvedFullName = fullNameIdx >= 0
          ? cols[fullNameIdx]
          : [fn, ln].filter(Boolean).join(' ');
        return {
          id: Date.now() + Math.random(),
          fullName:    resolvedFullName,
          email:       emailIdx   >= 0 ? cols[emailIdx]   : '',
          gender:      genderIdx  >= 0 ? cols[genderIdx]  : '',
          country:     countryIdx >= 0 ? cols[countryIdx] : '',
          region:      regionIdx  >= 0 ? cols[regionIdx]  : '',
          track:       trackIdx   >= 0 ? cols[trackIdx]   : '',
          category:    '',
          phoneNumber: phoneIdx   >= 0 ? cols[phoneIdx]   : '',
        };
      }).filter(r => r.email);

      setRows(prev => {
        const nonEmpty = prev.filter(r => r.email || r.fullName);
        return [...nonEmpty, ...parsed];
      });
      toast.success(`Imported ${parsed.length} row${parsed.length !== 1 ? 's' : ''} from CSV`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const downloadTemplate = () => {
    const header = 'fullName,email,gender,country,region,track,phoneNumber';
    const sample = 'Amara Diallo,amara@example.com,Female,Kenya,East Africa,AI & Machine Learning,+254700000000';
    const blob = new Blob([`${header}\n${sample}`], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url; a.download = 'fellows-template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const validRows = rows.filter(r => r.email?.trim());

  const handleSubmit = async () => {
    if (validRows.length === 0) return toast.error('Add at least one fellow with an email address');
    setLoading(true);
    setResults(null);
    try {
      const res = await adminService.bulkCreateFellows(validRows.map(r => ({
        fullName:    r.fullName,
        email:       r.email,
        gender:      r.gender      || undefined,
        country:     r.country     || undefined,
        region:      r.region      || undefined,
        track:       r.track       || undefined,
        category:    (r.category && r.category !== '__none__') ? r.category : undefined,
        phoneNumber: r.phoneNumber || undefined,
      })), sendEmails);
      setResults(res);
      toast.success(res.message);
      if (res.created > 0) onSuccess?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Bulk creation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        <Button type="button" variant="outline" size="sm" onClick={downloadTemplate} className="gap-1.5">
          <Icons.Download className="w-3.5 h-3.5" /> Download Template
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="gap-1.5">
          <Icons.Upload className="w-3.5 h-3.5" /> Import CSV
        </Button>
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSV} />
        <span className="text-xs text-gray-400 ml-1">or paste tab-separated rows directly into the table below</span>
        <span className="ml-auto text-xs font-medium text-gray-600">{validRows.length} / {rows.length} valid</span>
      </div>

      <Alert className="border-blue-100 bg-blue-50 py-2.5">
        <Icons.Info className="w-4 h-4 text-blue-500" />
        <AlertDescription className="text-blue-700 text-xs">
          <strong>Paste tip:</strong> Copy rows from Excel/Sheets (columns: First Name, Last Name, Email, Gender, Country, Region, Track, Phone). Select any cell and press <kbd className="px-1 py-0.5 bg-white border rounded text-xs">Ctrl+V</kbd>.
        </AlertDescription>
      </Alert>

      {/* Table */}
      <div className="border rounded-xl overflow-x-auto" onPaste={handlePaste}>
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 w-8">#</th>
              {['Full Name', 'Email *', 'Gender', 'Country', 'Region', 'Track', 'Phone'].map(h => (
                <th key={h} className="px-2 py-2.5 text-left text-xs font-semibold text-gray-500">{h}</th>
              ))}
              <th className="px-2 py-2.5 text-left text-xs font-semibold text-gray-500">Category</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id} className={`border-b last:border-0 ${row.email ? '' : 'bg-gray-50/50'}`}>
                <td className="px-3 py-1.5 text-xs text-gray-400 font-mono">{idx + 1}</td>
                {[
                  ['fullName', 'Full Name', 'text'],
                  ['email',    'Email',     'email'],
                ].map(([field, ph, type]) => (
                  <td key={field} className="px-1.5 py-1">
                    <Input
                      type={type}
                      value={row[field]}
                      onChange={e => updateRow(idx, field, e.target.value)}
                      placeholder={ph}
                      className={`h-8 text-xs ${field === 'email' && row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email) ? 'border-red-300 focus-visible:ring-red-300' : ''}`}
                    />
                  </td>
                ))}
                <td className="px-1.5 py-1">
                  <Select value={row.gender} onValueChange={v => updateRow(idx, 'gender', v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Gender" /></SelectTrigger>
                    <SelectContent>{GENDER_OPTIONS.map(g => <SelectItem key={g} value={g} className="text-xs">{g}</SelectItem>)}</SelectContent>
                  </Select>
                </td>
                {[
                  ['country',     'Country'],
                  ['region',      'Region'],
                ].map(([field, ph]) => (
                  <td key={field} className="px-1.5 py-1">
                    <Input value={row[field]} onChange={e => updateRow(idx, field, e.target.value)} placeholder={ph} className="h-8 text-xs" />
                  </td>
                ))}
                <td className="px-1.5 py-1">
                  <Select value={row.track} onValueChange={v => updateRow(idx, 'track', v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Track" /></SelectTrigger>
                    <SelectContent>{TRACK_OPTIONS.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}</SelectContent>
                  </Select>
                </td>
                <td className="px-1.5 py-1">
                  <Input value={row.phoneNumber} onChange={e => updateRow(idx, 'phoneNumber', e.target.value)} placeholder="Phone" className="h-8 text-xs" />
                </td>
                <td className="px-1.5 py-1">
                  <Select value={row.category} onValueChange={v => updateRow(idx, 'category', v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__" className="text-xs">None</SelectItem>
                      {categories.map(c => <SelectItem key={c._id} value={c._id} className="text-xs">{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-1.5 py-1">
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeRow(idx)}>
                    <Icons.X className="w-3.5 h-3.5 text-red-400" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button type="button" variant="outline" size="sm" onClick={addRow} className="gap-1.5 w-full border-dashed">
        <Icons.Plus className="w-3.5 h-3.5" /> Add Row
      </Button>

      {/* Email option */}
      <div className={`flex items-start gap-3 p-4 rounded-xl border ${sendEmails ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-200'}`}>
        <Checkbox id="bulkSend" checked={sendEmails} onCheckedChange={v => setSend(v)} className="mt-0.5" />
        <div>
          <label htmlFor="bulkSend" className={`text-sm font-medium cursor-pointer ${sendEmails ? 'text-blue-800' : 'text-gray-700'}`}>
            Send invitation emails with temporary passwords
          </label>
          <p className={`text-xs mt-0.5 ${sendEmails ? 'text-blue-600' : 'text-gray-500'}`}>
            {sendEmails
              ? 'Each fellow will receive a welcome email with their temporary password. They will be required to change it on first login.'
              : 'No emails will be sent. Temporary passwords for all created fellows will be shown below after creation.'}
          </p>
        </div>
      </div>

      {/* Results */}
      {results && (
        <div className={`rounded-xl border p-4 space-y-3 ${results.failed === 0 ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'}`}>
          <p className="font-semibold text-sm text-gray-800">{results.message}</p>
          {results.errors?.length > 0 && (
            <div className="space-y-1">
              {results.errors.map((e, i) => (
                <p key={i} className="text-xs text-red-600">• <strong>{e.email}</strong>: {e.error}</p>
              ))}
            </div>
          )}
          {/* Show temp passwords when emails were NOT sent */}
          {!sendEmails && results.fellows?.some(f => f.temporaryPassword) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 pt-1">
                <Icons.KeyRound className="w-4 h-4 text-amber-600" />
                <p className="text-xs font-semibold text-amber-800">Temporary Passwords — share these with each fellow</p>
              </div>
              <p className="text-xs text-amber-600">Fellows must change their password on first login. You can also send invitation emails later using the &quot;Send Invitations&quot; button.</p>
              <div className="bg-white rounded-lg border border-amber-200 divide-y divide-amber-100 max-h-48 overflow-y-auto">
                {results.fellows.filter(f => f.temporaryPassword).map((f, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2">
                    <span className="text-xs text-gray-600 flex-1 truncate">{f.email}</span>
                    <code className="text-xs font-mono font-bold text-gray-900 tracking-wide">{f.temporaryPassword}</code>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onClose} disabled={loading}>Close</Button>
        <Button onClick={handleSubmit} disabled={loading || validRows.length === 0} className="gap-2 bg-green-600 hover:bg-green-700">
          {loading
            ? <><Icons.Loader2 className="w-4 h-4 animate-spin" /> Creating {validRows.length} fellows...</>
            : <><Icons.Users className="w-4 h-4" /> Create {validRows.length} Fellow{validRows.length !== 1 ? 's' : ''}</>
          }
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// BULK EMAIL DIALOG
// ─────────────────────────────────────────────────────────────────
function BulkEmailDialog({ selected, fellows, onClose, onDone, isInvitation }) {
  const [form, setForm] = useState({
    subject:  isInvitation ? 'Welcome to the Arin Fellowship Programme' : '',
    message:  isInvitation
      ? `Dear Fellow,\n\nWelcome to the Arin Fellowship Programme! Your account has been created and you can now log in to complete your profile and start your learning journey.\n\nWe are excited to have you as part of our community.\n\nBest regards,\nArin Academy Team`
      : '',
    cc:  '',
    bcc: '',
  });
  const [loading, setLoading]   = useState(false);
  const [results, setResults]   = useState(null);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const selectedFellows = fellows.filter(f => selected.has(f._id));

  const parseCcBcc = (val) =>
    val.split(',').map(e => e.trim()).filter(e => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

  const handleSend = async () => {
    if (!form.subject.trim()) return toast.error('Subject is required');
    if (!form.message.trim()) return toast.error('Message body is required');

    setLoading(true);
    try {
      let res;
      if (isInvitation) {
        res = await adminService.sendFellowInvitations(Array.from(selected));
      } else {
        res = await adminService.sendBulkEmail(
          Array.from(selected),
          form.subject,
          form.message,
          parseCcBcc(form.cc),
          parseCcBcc(form.bcc),
        );
      }
      setResults(res);
      toast.success(res.message);
      onDone?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send emails');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Recipients preview */}
      <div className="space-y-2">
        <Label className="font-semibold">Recipients ({selectedFellows.length})</Label>
        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-3 border rounded-xl bg-gray-50">
          {selectedFellows.map(f => (
            <Badge key={f._id} variant="secondary" className="text-xs">
              {f.fullName || f.firstName || f.email}
              {!f.invitationEmailSent && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" title="No invitation sent yet" />}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-gray-500">
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> = no invitation sent yet</span>
        </p>
      </div>

      {isInvitation ? (
        <Alert className="border-green-100 bg-green-50">
          <Icons.Mail className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-700 text-sm">
            Each selected fellow will receive the <strong>standard fellowship invitation email</strong> with a freshly generated temporary password. Their passwords will be reset.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="space-y-1">
            <Label>Subject <span className="text-red-500">*</span></Label>
            <Input value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="Email subject line" />
          </div>
          <div className="space-y-1">
            <Label>Message <span className="text-red-500">*</span></Label>
            <Textarea
              value={form.message}
              onChange={e => set('message', e.target.value)}
              placeholder="Write your message to the selected fellows..."
              rows={8}
              className="resize-none"
            />
            <p className="text-xs text-gray-400">Plain text. Personalisation (fellow's name) is automatically prepended by the system.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>CC <span className="text-gray-400 font-normal text-xs">(comma-separated emails)</span></Label>
              <Input value={form.cc} onChange={e => set('cc', e.target.value)} placeholder="cc@example.com, cc2@example.com" />
            </div>
            <div className="space-y-1">
              <Label>BCC <span className="text-gray-400 font-normal text-xs">(comma-separated emails)</span></Label>
              <Input value={form.bcc} onChange={e => set('bcc', e.target.value)} placeholder="bcc@example.com" />
            </div>
          </div>
        </>
      )}

      {/* Results */}
      {results && (
        <div className={`rounded-xl border p-4 space-y-2 ${results.failed === 0 ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'}`}>
          <p className="font-semibold text-sm">{results.message}</p>
          {results.details?.filter(d => d.status === 'failed').map((d, i) => (
            <p key={i} className="text-xs text-red-600">• {d.email}: {d.error}</p>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={handleSend} disabled={loading || selectedFellows.length === 0} className="gap-2 bg-blue-600 hover:bg-blue-700">
          {loading
            ? <><Icons.Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
            : <><Icons.Send className="w-4 h-4" /> Send to {selectedFellows.length} Fellow{selectedFellows.length !== 1 ? 's' : ''}</>
          }
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// REMINDER DIALOG
// ─────────────────────────────────────────────────────────────────
function ReminderDialog({ fellow, onClose }) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return toast.error('Please enter a reminder message');
    setLoading(true);
    try {
      await adminService.sendFellowReminder(fellow._id, message.trim());
      toast.success(`Reminder sent to ${fellow.email}`);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send reminder');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {(fellow.fullName?.[0] || fellow.email?.[0] || '?').toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">{fellow.fullName || ''}</p>
          <p className="text-xs text-gray-500">{fellow.email}</p>
        </div>
      </div>

      <div className="space-y-1">
        <Label>Reminder Message <span className="text-red-500">*</span></Label>
        <Textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Write a personalised reminder for this fellow..."
          rows={6}
          className="resize-none"
        />
        <p className="text-xs text-gray-400">The fellow's name will be automatically prepended to the message.</p>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={handleSend} disabled={loading || !message.trim()} className="gap-2 bg-blue-600 hover:bg-blue-700">
          {loading ? <><Icons.Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <><Icons.BellRing className="w-4 h-4" /> Send Reminder</>}
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// EDIT FELLOW DIALOG
// ─────────────────────────────────────────────────────────────────
function EditFellowDialog({ fellow, onClose, onDone }) {
  const [form, setForm] = useState({
    fullName:    fellow.fullName || `${fellow.firstName || ''} ${fellow.lastName || ''}`.trim(),
    gender:      fellow.gender      || '',
    country:     fellow.country     || '',
    phoneNumber: fellow.phoneNumber || '',
    region:      fellow.fellowData?.region || '',
    track:       fellow.fellowData?.track  || '',
    isActive:    fellow.isActive,
  });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setLoading(true);
    try {
      await adminService.updateFellow(fellow._id, { ...form, fullName: form.fullName });
      toast.success('Fellow updated');
      onDone?.();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1"><Label>Full Name</Label>
        <Input value={form.fullName} onChange={e => set('fullName', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1"><Label>Phone Number</Label>
          <Input value={form.phoneNumber} onChange={e => set('phoneNumber', e.target.value)} /></div>
        <div className="space-y-1"><Label>Gender</Label>
          <Select value={form.gender} onValueChange={v => set('gender', v)}>
            <SelectTrigger><SelectValue placeholder="Gender" /></SelectTrigger>
            <SelectContent>{GENDER_OPTIONS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1"><Label>Country</Label>
          <Input value={form.country} onChange={e => set('country', e.target.value)} /></div>
        <div className="space-y-1"><Label>Region</Label>
          <Input value={form.region} onChange={e => set('region', e.target.value)} /></div>
      </div>
      <div className="space-y-1"><Label>Track</Label>
        <Select value={form.track} onValueChange={v => set('track', v)}>
          <SelectTrigger><SelectValue placeholder="Track" /></SelectTrigger>
          <SelectContent>{TRACK_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-3 p-3 border rounded-xl">
        <Checkbox id="active" checked={form.isActive} onCheckedChange={v => set('isActive', v)} />
        <label htmlFor="active" className="text-sm font-medium cursor-pointer">Account Active</label>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={handleSave} disabled={loading} className="gap-2">
          {loading ? <><Icons.Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Icons.Save className="w-4 h-4" /> Save Changes</>}
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────
export default function FellowsManagementPage() {
  const router = useRouter();
  const [fellows, setFellows]           = useState([]);
  const [categories, setCategories]     = useState([]);
  const [loading, setLoading]           = useState(false);
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [pagination, setPagination]     = useState({ page: 1, limit: 50, total: 0, pages: 0 });

  // Selection
  const [selected, setSelected]         = useState(new Set());
  const allOnPageSelected               = fellows.length > 0 && fellows.every(f => selected.has(f._id));
  const someSelected                    = selected.size > 0;

  // Modals
  const [modal, setModal] = useState(null); // 'single' | 'bulk' | 'email' | 'invitation' | 'edit' | 'delete'
  const [editTarget, setEditTarget]       = useState(null);
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [reminderTarget, setReminderTarget] = useState(null);
  const [deleting, setDeleting]           = useState(false);

  const fetchFellows = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminService.getAllFellows({ status: filterStatus, page, limit: 50, search });
      setFellows(res.fellows || []);
      setPagination(res.pagination || { page: 1, limit: 50, total: 0, pages: 0 });
    } catch {
      toast.error('Failed to load fellows');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, search]);

  useEffect(() => {
    categoryService.getAllCategories().then(d => setCategories(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchFellows(1), search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchFellows, search]);

  const reload = () => { fetchFellows(pagination.page); setSelected(new Set()); };

  const toggleSelect = (id) => setSelected(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const toggleAll = () => {
    if (allOnPageSelected) setSelected(new Set());
    else setSelected(new Set(fellows.map(f => f._id)));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminService.deleteFellow(deleteTarget._id);
      toast.success('Fellow deleted');
      setModal(null);
      setDeleteTarget(null);
      reload();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const statusBadge = (f) => {
    const s = f.fellowData?.fellowshipStatus;
    if (s === 'active')    return <Badge className="bg-green-100 text-green-700 text-xs">Active</Badge>;
    if (s === 'completed') return <Badge className="bg-blue-100 text-blue-700 text-xs">Completed</Badge>;
    if (s === 'expired')   return <Badge className="bg-red-100 text-red-700 text-xs">Expired</Badge>;
    return <Badge variant="secondary" className="text-xs">Unknown</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      {/* ── Header ─────────────────────────────────── */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fellows Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Add, manage, and communicate with programme fellows</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setModal('single')} variant="outline" className="gap-2">
            <Icons.UserPlus className="w-4 h-4" /> Add Fellow
          </Button>
          <Button onClick={() => router.push('/admin/fellows/bulk')} className="gap-2 bg-green-600 hover:bg-green-700">
            <Icons.Users className="w-4 h-4" /> Bulk Add Fellows
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* ── Stats ────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Fellows"       value={pagination.total} icon={Icons.Users}     color="blue" />
          <StatCard label="Active"              value={fellows.filter(f=>f.fellowData?.fellowshipStatus==='active').length} icon={Icons.CheckCircle} color="green" sub={`of ${fellows.length} shown`} />
          <StatCard label="Awaiting Invitation" value={fellows.filter(f=>!f.invitationEmailSent).length}    icon={Icons.MailOpen}   color="amber" sub="No email sent yet" />
          <StatCard label="Inactive"            value={fellows.filter(f=>!f.isActive).length}              icon={Icons.UserX}      color="red" />
        </div>

        {/* ── Toolbar ──────────────────────────────── */}
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex flex-wrap gap-3 items-center">
              {/* Search */}
              <div className="relative flex-1 min-w-56">
                <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name, email, track or region…"
                  className="pl-9"
                />
              </div>

              {/* Status filter */}
              <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); setSelected(new Set()); }}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>

              {/* Bulk actions (shown when something is selected) */}
              {someSelected && (
                <>
                  <Separator orientation="vertical" className="h-8" />
                  <span className="text-sm font-medium text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                    {selected.size} selected
                  </span>
                  <Button size="sm" variant="outline" onClick={() => setModal('invitation')} className="gap-1.5">
                    <Icons.Mail className="w-3.5 h-3.5" /> Send Invitations
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setModal('email')} className="gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-50">
                    <Icons.Send className="w-3.5 h-3.5" /> Custom Email
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())} className="text-gray-500">
                    <Icons.X className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}

              <Button variant="outline" size="icon" onClick={() => reload()} className="ml-auto" title="Refresh">
                <Icons.RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Fellows Table ─────────────────────────── */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-3 text-left w-10">
                    <Checkbox checked={allOnPageSelected} onCheckedChange={toggleAll} aria-label="Select all" />
                  </th>
                  {['Fellow', 'Track / Region', 'Country', 'Status', 'Invitation', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && fellows.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-16">
                    <Icons.Loader2 className="w-8 h-8 animate-spin text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Loading fellows…</p>
                  </td></tr>
                ) : fellows.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-16">
                    <Icons.Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No fellows found</p>
                    <p className="text-gray-400 text-xs mt-1">Try adjusting your search or add fellows using the buttons above.</p>
                  </td></tr>
                ) : (
                  fellows.map(f => (
                    <tr key={f._id} className={`border-b last:border-0 hover:bg-gray-50/60 transition-colors ${selected.has(f._id) ? 'bg-blue-50/40' : ''}`}>
                      <td className="px-4 py-3">
                        <Checkbox checked={selected.has(f._id)} onCheckedChange={() => toggleSelect(f._id)} />
                      </td>
                      {/* Fellow */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {(f.fullName?.[0] || f.email?.[0] || '?').toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-800 truncate">
                              {f.fullName || <span className="text-gray-400 italic">No name</span>}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{f.email}</p>
                            {f.gender && <p className="text-xs text-gray-400">{f.gender}</p>}
                          </div>
                        </div>
                      </td>
                      {/* Track / Region */}
                      <td className="px-3 py-3">
                        {f.fellowData?.track && <p className="text-xs font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full inline-block">{f.fellowData.track}</p>}
                        {f.fellowData?.region && <p className="text-xs text-gray-500 mt-1">{f.fellowData.region}</p>}
                        {!f.fellowData?.track && !f.fellowData?.region && <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      {/* Country */}
                      <td className="px-3 py-3 text-sm text-gray-700">{f.country || <span className="text-gray-300">—</span>}</td>
                      {/* Status */}
                      <td className="px-3 py-3">{statusBadge(f)}</td>
                      {/* Invitation */}
                      <td className="px-3 py-3">
                        {f.invitationEmailSent
                          ? <span className="flex items-center gap-1.5 text-xs text-green-700"><Icons.MailCheck className="w-3.5 h-3.5" /> Sent</span>
                          : <span className="flex items-center gap-1.5 text-xs text-amber-600"><Icons.MailOpen className="w-3.5 h-3.5" /> Not sent</span>
                        }
                      </td>
                      {/* Joined */}
                      <td className="px-3 py-3 text-xs text-gray-500">
                        {f.createdAt ? new Date(f.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      {/* Actions */}
                      <td className="px-3 py-3">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8" title="Send invitation"
                            onClick={() => { setSelected(new Set([f._id])); setModal('invitation'); }}
                          >
                            <Icons.Mail className="w-3.5 h-3.5 text-blue-500" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8" title="Send reminder"
                            onClick={() => { setReminderTarget(f); setModal('reminder'); }}
                          >
                            <Icons.BellRing className="w-3.5 h-3.5 text-amber-500" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8" title="Edit"
                            onClick={() => { setEditTarget(f); setModal('edit'); }}
                          >
                            <Icons.Pencil className="w-3.5 h-3.5 text-gray-500" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8" title="Delete"
                            onClick={() => { setDeleteTarget(f); setModal('delete'); }}
                          >
                            <Icons.Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50/50">
              <p className="text-xs text-gray-500">
                Page {pagination.page} of {pagination.pages} · {pagination.total} total fellows
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={pagination.page <= 1} onClick={() => fetchFellows(pagination.page - 1)}>
                  <Icons.ChevronLeft className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" disabled={pagination.page >= pagination.pages} onClick={() => fetchFellows(pagination.page + 1)}>
                  <Icons.ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* ── MODALS ────────────────────────────────────── */}

      {/* Single Create */}
      <Modal open={modal === 'single'} onClose={() => setModal(null)} title="Add New Fellow">
        <SingleFellowForm categories={categories} onSuccess={reload} onClose={() => setModal(null)} />
      </Modal>

      {/* Bulk Create */}
      <Modal open={modal === 'bulk'} onClose={() => setModal(null)} title="Bulk Add Fellows" maxWidth="max-w-6xl">
        <BulkTableEditor categories={categories} onSuccess={reload} onClose={() => setModal(null)} />
      </Modal>

      {/* Custom Bulk Email */}
      <Modal open={modal === 'email'} onClose={() => setModal(null)} title={`Send Custom Email — ${selected.size} Fellows`} maxWidth="max-w-2xl">
        <BulkEmailDialog
          selected={selected}
          fellows={fellows}
          isInvitation={false}
          onClose={() => setModal(null)}
          onDone={reload}
        />
      </Modal>

      {/* Send Invitations */}
      <Modal open={modal === 'invitation'} onClose={() => setModal(null)} title={`Send Fellowship Invitations — ${selected.size} Fellows`} maxWidth="max-w-xl">
        <BulkEmailDialog
          selected={selected}
          fellows={fellows}
          isInvitation={true}
          onClose={() => setModal(null)}
          onDone={reload}
        />
      </Modal>

      {/* Send Reminder */}
      {reminderTarget && (
        <Modal open={modal === 'reminder'} onClose={() => { setModal(null); setReminderTarget(null); }} title="Send Reminder" maxWidth="max-w-lg">
          <ReminderDialog
            fellow={reminderTarget}
            onClose={() => { setModal(null); setReminderTarget(null); }}
          />
        </Modal>
      )}

      {/* Edit Fellow */}
      {editTarget && (
        <Modal open={modal === 'edit'} onClose={() => setModal(null)} title={`Edit — ${editTarget.fullName || editTarget.email}`} maxWidth="max-w-lg">
          <EditFellowDialog
            fellow={editTarget}
            onClose={() => { setModal(null); setEditTarget(null); }}
            onDone={reload}
          />
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteTarget && modal === 'delete' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Icons.Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Delete Fellow?</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Are you sure you want to delete <strong>{deleteTarget.fullName || deleteTarget.email}</strong>? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setModal(null)} disabled={deleting}>Cancel</Button>
              <Button onClick={handleDelete} disabled={deleting} className="gap-1.5 bg-red-600 hover:bg-red-700 text-white">
                {deleting ? <><Icons.Loader2 className="w-4 h-4 animate-spin" /> Deleting...</> : <><Icons.Trash2 className="w-4 h-4" /> Delete</>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
