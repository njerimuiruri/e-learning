'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import adminService, { bankPaymentService } from '@/lib/api/adminService';
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
const PARTICIPANT_CATEGORY_OPTIONS = ['Student', 'Working Professional'];
const PAYMENT_STATUS_OPTIONS = ['paid', 'partial', 'pending', 'pay_later'];

const BLANK_BP_ROW = () => ({
  id: Date.now() + Math.random(),
  fullName: '', email: '', gender: '', nationality: '', phoneNumber: '',
  institution: '', participantCategory: '',
  amountDue: '', amountPaid: '', paymentStatus: 'pending',
  tranche: '', dateOfPayment: '', comments: '',
});

const BLANK_ROW = () => ({
  id: Date.now() + Math.random(),
  fullName: '', email: '', gender: '',
  country: '', region: '', track: '', category: '', phoneNumber: '',
});


// ─────────────────────────────────────────────────────────────────
// ARIN PUBLISHING ACADEMY  SINGLE ADD FORM
// ─────────────────────────────────────────────────────────────────
function BankPaymentForm({ categoryId, onSuccess, onClose }) {
  const [form, setForm] = useState({
    fullName: '', email: '', gender: '', nationality: '', phoneNumber: '',
    institution: '', participantCategory: '',
    amountDue: '', amountPaid: '', paymentStatus: 'pending',
    tranche: '', dateOfPayment: '', comments: '',
    sendEmail: true,
  });
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(null);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.email) return toast.error('Email is required');
    if (!form.fullName) return toast.error('Full name is required');
    setLoading(true);
    try {
      const computedAmtDue  = parseFloat(form.amountDue) || 0;
      const computedAmtPaid = form.paymentStatus === 'paid'
        ? computedAmtDue
        : form.paymentStatus === 'pay_later'
          ? 0
          : parseFloat(form.amountPaid) || 0;
      const res = await bankPaymentService.create({
        categoryId,
        fullName: form.fullName,
        email: form.email,
        gender: form.gender || undefined,
        nationality: form.nationality || undefined,
        phoneNumber: form.phoneNumber || undefined,
        institution: form.institution || undefined,
        participantCategory: form.participantCategory || undefined,
        amountDue: computedAmtDue,
        amountPaid: computedAmtPaid,
        paymentStatus: form.paymentStatus || undefined,
        tranche: form.tranche || undefined,
        dateOfPayment: form.paymentStatus === 'pay_later' ? undefined : form.dateOfPayment || undefined,
        comments: form.comments || undefined,
        sendEmail: form.sendEmail,
      });
      setCreated(res);
      onSuccess?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create record');
    } finally {
      setLoading(false);
    }
  };

  if (created) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
            <Icons.CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-gray-900">Record Created</h3>
            <p className="text-sm text-gray-500 mt-0.5">{created.record?.email}</p>
          </div>
        </div>

        {/* ── NEW user: show credentials ── */}
        {created.isNewUser && created.temporaryPassword && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Icons.KeyRound className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <p className="text-sm font-semibold text-blue-800">New account created — credentials below</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white border border-blue-200 rounded-lg px-3 py-2">
                <p className="text-blue-500 mb-0.5">Email</p>
                <p className="font-mono font-semibold text-gray-900 select-all break-all">{created.record?.email}</p>
              </div>
              <div className="bg-white border border-blue-200 rounded-lg px-3 py-2">
                <p className="text-blue-500 mb-0.5">Temporary Password</p>
                <p className="font-mono font-bold text-gray-900 tracking-widest select-all">{created.temporaryPassword}</p>
              </div>
            </div>
            <p className="text-xs text-blue-600">An invitation email has been sent. Share the password above as a backup in case the email is not received.</p>
          </div>
        )}

        {/* ── EXISTING user: explain what was sent ── */}
        {!created.isNewUser && (
          <div className="flex items-start gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl">
            <Icons.UserCheck className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-600">
              This user already has an account and their own password —{' '}
              {created.emailType === 'module1_access'
                ? 'a notification email has been sent informing them that Module 1 is now available.'
                : created.emailType === 'payment_confirmation'
                  ? 'a payment confirmation email has been sent.'
                  : 'no new credentials were sent.'}
            </p>
          </div>
        )}

        {/* ── Access level result ── */}
        {created.record?.paymentStatus === 'paid' && (
          <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
            <Icons.ShieldCheck className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-green-700">Full access granted — all modules unlocked.</p>
          </div>
        )}
        {created.record?.paymentStatus === 'partial' && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <Icons.Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Partial payment: <strong>USD {created.record?.amountPaid?.toLocaleString()}</strong> paid,{' '}
              <strong>USD {created.record?.balance?.toLocaleString()}</strong> remaining. Full access granted — send a reminder for the balance.
            </p>
          </div>
        )}
        {created.record?.paymentStatus === 'pay_later' && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <Icons.Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700"><strong>Module 1 access only.</strong> Appears in Pay Later sub-tab — send a payment reminder when ready.</p>
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={onClose} className="bg-green-600 hover:bg-green-700">Done</Button>
        </div>
      </div>
    );
  }

  const amtDue  = parseFloat(form.amountDue)  || 0;
  const amtPaid = form.paymentStatus === 'paid'
    ? amtDue
    : form.paymentStatus === 'pay_later'
      ? 0
      : parseFloat(form.amountPaid) || 0;
  const balance = Math.max(0, amtDue - amtPaid);
  const isPayLater = form.paymentStatus === 'pay_later';
  const isPaid     = form.paymentStatus === 'paid';
  const isPartial  = form.paymentStatus === 'partial';

  // Auto-set amountPaid when "paid" is selected and amountDue changes
  const handleStatusChange = (v) => {
    set('paymentStatus', v);
    if (v === 'paid') {
      set('tranche', 'Full Payment');
      set('amountPaid', form.amountDue);
    } else if (v === 'pay_later') {
      set('amountPaid', '0');
      set('tranche', 'Pay Later');
      set('dateOfPayment', '');
    }
  };
  const handleAmountDueChange = (v) => {
    set('amountDue', v);
    if (isPaid) set('amountPaid', v);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1 col-span-2">
          <Label>Full Name <span className="text-red-500">*</span></Label>
          <Input value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="e.g. Amara Diallo" />
        </div>
        <div className="space-y-1 col-span-2">
          <Label>Email Address <span className="text-red-500">*</span></Label>
          <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="fellow@example.com" />
        </div>
        <div className="space-y-1">
          <Label>Gender</Label>
          <Select value={form.gender} onValueChange={v => set('gender', v)}>
            <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
            <SelectContent>{GENDER_OPTIONS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Nationality</Label>
          <Input value={form.nationality} onChange={e => set('nationality', e.target.value)} placeholder="e.g. Kenyan" />
        </div>
        <div className="space-y-1">
          <Label>Phone Number</Label>
          <Input value={form.phoneNumber} onChange={e => set('phoneNumber', e.target.value)} placeholder="+254 700 000 000" />
        </div>
        <div className="space-y-1">
          <Label>Institution / Organization</Label>
          <Input value={form.institution} onChange={e => set('institution', e.target.value)} placeholder="e.g. University of Nairobi" />
        </div>
        <div className="space-y-1 col-span-2">
          <Label>Category (Tier)</Label>
          <Select value={form.participantCategory} onValueChange={v => set('participantCategory', v)}>
            <SelectTrigger><SelectValue placeholder="Student or Working Professional" /></SelectTrigger>
            <SelectContent>{PARTICIPANT_CATEGORY_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Payment Status — drives smart amount display */}
      <div className="space-y-1">
        <Label>Payment Status</Label>
        <Select value={form.paymentStatus} onValueChange={handleStatusChange}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="paid">Paid — Full Payment</SelectItem>
            <SelectItem value="partial">Partial — Installment</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="pay_later">Pay Later (Module 1 access only)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Pay Later info box */}
      {isPayLater && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
          <Icons.Clock className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700 leading-relaxed">
            Fellow will get access to <strong>Module 1 only</strong>. They will appear in the <strong>Pay Later</strong> sub-tab. Set Amount Due so you can track the outstanding balance. No payment date is required yet.
          </p>
        </div>
      )}

      {/* Amount fields — smart display */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label>Amount Due (USD)</Label>
          <Input
            type="number" min="0"
            value={form.amountDue}
            onChange={e => handleAmountDueChange(e.target.value)}
            placeholder="0"
            disabled={isPayLater && !form.amountDue}
          />
        </div>
        <div className="space-y-1">
          <Label>Amount Paid (USD)</Label>
          <Input
            type="number" min="0"
            value={isPaid ? amtDue : isPayLater ? '0' : form.amountPaid}
            onChange={e => !isPaid && !isPayLater && set('amountPaid', e.target.value)}
            readOnly={isPaid || isPayLater}
            className={isPaid || isPayLater ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}
            placeholder="0"
          />
        </div>
        <div className="space-y-1">
          <Label>Balance</Label>
          <div className={`h-10 flex items-center px-3 border rounded-md text-sm font-semibold
            ${isPaid ? 'bg-green-50 border-green-200 text-green-700' :
              isPartial && balance > 0 ? 'bg-amber-50 border-amber-200 text-amber-700' :
              'bg-gray-50 border-gray-200 text-gray-700'}`}>
            {isPaid ? '✓ Paid in Full' : `USD ${balance.toLocaleString()}`}
          </div>
        </div>
      </div>

      {/* Partial payment summary */}
      {isPartial && amtDue > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between text-xs">
          <span className="text-amber-700">
            Paid <strong>USD {amtPaid.toLocaleString()}</strong> of <strong>USD {amtDue.toLocaleString()}</strong>
          </span>
          <span className={`font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {balance > 0 ? `USD ${balance.toLocaleString()} remaining` : 'Fully settled'}
          </span>
        </div>
      )}

      {/* Full payment summary */}
      {isPaid && amtDue > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2 text-xs text-green-700">
          <Icons.CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
          Full payment of <strong>USD {amtDue.toLocaleString()}</strong> recorded. Fellow will get immediate access to all modules.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Tranche / Installment</Label>
          <Input
            value={form.tranche}
            onChange={e => set('tranche', e.target.value)}
            placeholder={isPaid ? 'Full Payment' : isPartial ? 'e.g. Installment 1' : 'e.g. Full Payment / Installment 1'}
          />
        </div>
        <div className="space-y-1">
          <Label>Date of Payment</Label>
          <Input
            type="date"
            value={form.dateOfPayment}
            onChange={e => set('dateOfPayment', e.target.value)}
            disabled={isPayLater}
            className={isPayLater ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label>Comments</Label>
        <Textarea value={form.comments} onChange={e => set('comments', e.target.value)} placeholder="Any additional notes…" rows={2} />
      </div>

      <Separator />

      <div className={`flex items-start gap-3 p-4 rounded-xl border ${form.sendEmail ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-200'}`}>
        <Checkbox id="bpSendEmail" checked={form.sendEmail} onCheckedChange={v => set('sendEmail', v)} className="mt-0.5" />
        <div>
          <label htmlFor="bpSendEmail" className={`text-sm font-medium cursor-pointer ${form.sendEmail ? 'text-blue-800' : 'text-gray-700'}`}>
            Send invitation email (if new user)
          </label>
          <p className={`text-xs mt-0.5 ${form.sendEmail ? 'text-blue-600' : 'text-gray-500'}`}>
            {form.sendEmail ? 'A welcome email with a temporary password will be sent if a new account is created.' : 'No email will be sent. A temporary password will be shown after creation.'}
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={loading} className="gap-2 bg-[#021d49] hover:bg-[#032a66]">
          {loading ? <><Icons.Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Icons.Plus className="w-4 h-4" /> Add Record</>}
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ARIN PUBLISHING ACADEMY  BULK UPLOAD
// ─────────────────────────────────────────────────────────────────
function BankPaymentBulkForm({ categoryId, onSuccess, onClose }) {
  const [rows, setRows] = useState([BLANK_BP_ROW(), BLANK_BP_ROW(), BLANK_BP_ROW()]);
  const [sendEmail, setSendEmail] = useState(true);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const fileRef = useRef(null);

  const updateRow = (idx, field, val) =>
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));
  const addRow = () => setRows(prev => [...prev, BLANK_BP_ROW()]);
  const removeRow = (idx) => setRows(prev => prev.filter((_, i) => i !== idx));

  const downloadTemplate = () => {
    const headers = ['Full Name', 'Email', 'Gender', 'Nationality', 'Phone Number', 'Institution/Organization', 'Category (Student/Working Professional)', 'Amount Due', 'Amount Paid', 'Payment Status (paid/partial/pending)', 'Tranche', 'Date of Payment (YYYY-MM-DD)', 'Comments'];
    const sample = ['Amara Diallo', 'amara@example.com', 'Female', 'Kenyan', '+254700000000', 'University of Nairobi', 'Student', '15000', '15000', 'paid', 'Full Payment', '2024-03-01', ''];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, sample]);
    ws['!cols'] = headers.map(() => ({ wch: 22 }));
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'arin-publishing-payments-template.xlsx');
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { header: 1 });
        if (raw.length < 2) return toast.error('File must have a header row and at least one data row');
        const headers = (raw[0] || []).map(h => String(h).toLowerCase().trim().replace(/\s+/g, '').replace(/[^a-z0-9]/g, ''));
        const col = (names) => names.map(n => headers.findIndex(h => h.includes(n))).find(i => i >= 0) ?? -1;
        const nameIdx   = col(['fullname', 'name']);
        const emailIdx  = col(['email']);
        const genderIdx = col(['gender']);
        const natIdx    = col(['nationality']);
        const phoneIdx  = col(['phone']);
        const instIdx   = col(['institution', 'organization']);
        const catIdx    = col(['category']);
        const dueIdx    = col(['amountdue', 'due']);
        const paidIdx   = col(['amountpaid', 'paid']);
        const statusIdx = col(['paymentstatus', 'status']);
        const trancheIdx = col(['tranche', 'installment']);
        const dateIdx   = col(['dateofpayment', 'date']);
        const commIdx   = col(['comments', 'notes']);

        if (emailIdx < 0) return toast.error('File must have an "Email" column');

        const parsed = raw.slice(1).map(row => {
          const r = (i) => (i >= 0 && row[i] != null) ? String(row[i]).trim() : '';
          return {
            id: Date.now() + Math.random(),
            fullName: r(nameIdx),
            email: r(emailIdx),
            gender: r(genderIdx),
            nationality: r(natIdx),
            phoneNumber: r(phoneIdx),
            institution: r(instIdx),
            participantCategory: r(catIdx),
            amountDue: r(dueIdx),
            amountPaid: r(paidIdx),
            paymentStatus: r(statusIdx) || 'pending',
            tranche: r(trancheIdx),
            dateOfPayment: r(dateIdx),
            comments: r(commIdx),
          };
        }).filter(r => r.email);

        setRows(prev => {
          const nonEmpty = prev.filter(r => r.email || r.fullName);
          return [...nonEmpty, ...parsed];
        });
        toast.success(`Imported ${parsed.length} row${parsed.length !== 1 ? 's' : ''}`);
      } catch {
        toast.error('Failed to parse file');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text');
    const lines = text.trim().split('\n').filter(l => l.trim());
    if (!lines.length) return;
    const parsed = lines.map(line => {
      const cols = line.split('\t').map(s => s.trim());
      return {
        id: Date.now() + Math.random(),
        fullName: cols[0] || '', email: cols[1] || '', gender: cols[2] || '',
        nationality: cols[3] || '', phoneNumber: cols[4] || '', institution: cols[5] || '',
        participantCategory: cols[6] || '', amountDue: cols[7] || '', amountPaid: cols[8] || '',
        paymentStatus: cols[9] || 'pending', tranche: cols[10] || '',
        dateOfPayment: cols[11] || '', comments: cols[12] || '',
      };
    });
    setRows(prev => [...prev.filter(r => r.email || r.fullName), ...parsed]);
    toast.success(`Pasted ${parsed.length} row${parsed.length !== 1 ? 's' : ''}`);
  };

  const validRows = rows.filter(r => r.email?.trim() && r.fullName?.trim());

  const handleSubmit = async () => {
    if (!validRows.length) return toast.error('Add at least one record with name and email');
    setLoading(true);
    try {
      const res = await bankPaymentService.createBulk({
        categoryId,
        sendEmail,
        records: validRows.map(r => ({
          fullName: r.fullName,
          email: r.email,
          gender: r.gender || undefined,
          nationality: r.nationality || undefined,
          phoneNumber: r.phoneNumber || undefined,
          institution: r.institution || undefined,
          participantCategory: r.participantCategory || undefined,
          amountDue: parseFloat(r.amountDue) || 0,
          amountPaid: parseFloat(r.amountPaid) || 0,
          paymentStatus: r.paymentStatus || 'pending',
          tranche: r.tranche || undefined,
          dateOfPayment: r.dateOfPayment || undefined,
          comments: r.comments || undefined,
        })),
      });
      setResults(res);
      if (res.created > 0) onSuccess?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Bulk upload failed');
    } finally {
      setLoading(false);
    }
  };

  if (results) {
    return (
      <div className="space-y-5">
        <div className="flex flex-col items-center gap-3 py-4">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${results.failed === 0 ? 'bg-green-100' : 'bg-amber-100'}`}>
            {results.failed === 0
              ? <Icons.CheckCircle className="w-8 h-8 text-green-600" />
              : <Icons.AlertCircle className="w-8 h-8 text-amber-600" />}
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-gray-900">Bulk Upload Complete</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {results.created} created · {results.failed} failed
            </p>
          </div>
        </div>
        {results.errors?.length > 0 && (
          <div className="border border-red-100 rounded-xl overflow-hidden">
            <div className="bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700">Errors ({results.errors.length})</div>
            <div className="max-h-48 overflow-y-auto divide-y divide-red-50">
              {results.errors.map((e, i) => (
                <div key={i} className="px-4 py-2 text-xs">
                  <span className="font-medium text-gray-700">{e.email}</span>
                  <span className="text-red-600 ml-2">{e.error}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex justify-end">
          <Button onClick={onClose} className="bg-[#021d49] hover:bg-[#032a66]">Done</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <Button type="button" variant="outline" size="sm" onClick={downloadTemplate} className="gap-1.5">
          <Icons.Download className="w-3.5 h-3.5" /> Download Template
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="gap-1.5">
          <Icons.Upload className="w-3.5 h-3.5" /> Import Excel / CSV
        </Button>
        <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFile} />
        <span className="text-xs text-gray-400 ml-1">or paste tab-separated rows below</span>
        <span className="ml-auto text-xs font-medium text-gray-600">{validRows.length} / {rows.length} valid</span>
      </div>

      <Alert className="border-blue-100 bg-blue-50 py-2.5">
        <Icons.Info className="w-4 h-4 text-blue-500" />
        <AlertDescription className="text-blue-700 text-xs">
          Columns: Full Name, Email, Gender, Nationality, Phone, Institution, Category, Amount Due, Amount Paid, Status, Tranche, Date, Comments
        </AlertDescription>
      </Alert>

      <div className="border rounded-xl overflow-x-auto" onPaste={handlePaste}>
        <table className="w-full text-sm" style={{ minWidth: 1400 }}>
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 w-6">#</th>
              {['Full Name *', 'Email *', 'Gender', 'Nationality', 'Phone', 'Institution', 'Category', 'Amount Due', 'Amount Paid', 'Status', 'Tranche', 'Date Paid', 'Comments', ''].map(h => (
                <th key={h} className="px-2 py-2 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id} className={`border-b last:border-0 ${row.email && row.fullName ? '' : 'bg-gray-50/50'}`}>
                <td className="px-2 py-1 text-xs text-gray-400 font-mono">{idx + 1}</td>
                <td className="px-1 py-1"><Input value={row.fullName} onChange={e => updateRow(idx, 'fullName', e.target.value)} placeholder="Full Name" className="h-7 text-xs w-32" /></td>
                <td className="px-1 py-1"><Input type="email" value={row.email} onChange={e => updateRow(idx, 'email', e.target.value)} placeholder="email" className="h-7 text-xs w-44" /></td>
                <td className="px-1 py-1">
                  <select value={row.gender} onChange={e => updateRow(idx, 'gender', e.target.value)} className="h-7 text-xs border rounded px-1 w-24">
                    <option value=""></option>
                    {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </td>
                <td className="px-1 py-1"><Input value={row.nationality} onChange={e => updateRow(idx, 'nationality', e.target.value)} placeholder="Kenyan" className="h-7 text-xs w-24" /></td>
                <td className="px-1 py-1"><Input value={row.phoneNumber} onChange={e => updateRow(idx, 'phoneNumber', e.target.value)} placeholder="+254…" className="h-7 text-xs w-28" /></td>
                <td className="px-1 py-1"><Input value={row.institution} onChange={e => updateRow(idx, 'institution', e.target.value)} placeholder="Institution" className="h-7 text-xs w-32" /></td>
                <td className="px-1 py-1">
                  <select value={row.participantCategory} onChange={e => updateRow(idx, 'participantCategory', e.target.value)} className="h-7 text-xs border rounded px-1 w-28">
                    <option value=""></option>
                    {PARTICIPANT_CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </td>
                <td className="px-1 py-1"><Input type="number" value={row.amountDue} onChange={e => updateRow(idx, 'amountDue', e.target.value)} placeholder="0" className="h-7 text-xs w-20" /></td>
                <td className="px-1 py-1"><Input type="number" value={row.amountPaid} onChange={e => updateRow(idx, 'amountPaid', e.target.value)} placeholder="0" className="h-7 text-xs w-20" /></td>
                <td className="px-1 py-1">
                  <select value={row.paymentStatus} onChange={e => updateRow(idx, 'paymentStatus', e.target.value)} className="h-7 text-xs border rounded px-1 w-20">
                    {PAYMENT_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-1 py-1"><Input value={row.tranche} onChange={e => updateRow(idx, 'tranche', e.target.value)} placeholder="Installment 1" className="h-7 text-xs w-28" /></td>
                <td className="px-1 py-1"><Input type="date" value={row.dateOfPayment} onChange={e => updateRow(idx, 'dateOfPayment', e.target.value)} className="h-7 text-xs w-32" /></td>
                <td className="px-1 py-1"><Input value={row.comments} onChange={e => updateRow(idx, 'comments', e.target.value)} placeholder="Notes…" className="h-7 text-xs w-28" /></td>
                <td className="px-1 py-1">
                  <button onClick={() => removeRow(idx)} className="text-red-400 hover:text-red-600 p-1">
                    <Icons.X className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button type="button" variant="outline" size="sm" onClick={addRow} className="gap-1.5">
        <Icons.Plus className="w-3.5 h-3.5" /> Add Row
      </Button>

      <div className={`flex items-start gap-3 p-3 rounded-xl border ${sendEmail ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-200'}`}>
        <Checkbox id="bpBulkEmail" checked={sendEmail} onCheckedChange={setSendEmail} className="mt-0.5" />
        <label htmlFor="bpBulkEmail" className={`text-sm cursor-pointer ${sendEmail ? 'text-blue-800' : 'text-gray-700'}`}>
          Send invitation emails to newly created accounts
        </label>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={loading || validRows.length === 0} className="gap-2 bg-[#021d49] hover:bg-[#032a66]">
          {loading ? <><Icons.Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <><Icons.Upload className="w-4 h-4" /> Upload {validRows.length} Record{validRows.length !== 1 ? 's' : ''}</>}
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ARIN PUBLISHING ACADEMY  EDIT RECORD DIALOG
// ─────────────────────────────────────────────────────────────────
function EditBankPaymentDialog({ record, onClose, onDone }) {
  const [form, setForm] = useState({
    fullName: record.fullName || '',
    gender: record.gender || '',
    nationality: record.nationality || '',
    phoneNumber: record.phoneNumber || '',
    institution: record.institution || '',
    participantCategory: record.participantCategory || '',
    amountDue: record.amountDue?.toString() || '0',
    amountPaid: record.amountPaid?.toString() || '0',
    paymentStatus: record.paymentStatus || 'pending',
    tranche: record.tranche || '',
    dateOfPayment: record.dateOfPayment ? record.dateOfPayment.slice(0, 10) : '',
    comments: record.comments || '',
  });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setLoading(true);
    try {
      await bankPaymentService.update(record._id, {
        ...form,
        amountDue: parseFloat(form.amountDue) || 0,
        amountPaid: parseFloat(form.amountPaid) || 0,
      });
      toast.success('Record updated');
      onDone?.();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const amtDue = parseFloat(form.amountDue) || 0;
  const amtPaid = parseFloat(form.amountPaid) || 0;
  const balance = Math.max(0, amtDue - amtPaid);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1 col-span-2">
          <Label>Full Name</Label>
          <Input value={form.fullName} onChange={e => set('fullName', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Gender</Label>
          <Select value={form.gender} onValueChange={v => set('gender', v)}>
            <SelectTrigger><SelectValue placeholder="Gender" /></SelectTrigger>
            <SelectContent>{GENDER_OPTIONS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Nationality</Label>
          <Input value={form.nationality} onChange={e => set('nationality', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Phone Number</Label>
          <Input value={form.phoneNumber} onChange={e => set('phoneNumber', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Institution / Organization</Label>
          <Input value={form.institution} onChange={e => set('institution', e.target.value)} />
        </div>
        <div className="space-y-1 col-span-2">
          <Label>Category</Label>
          <Select value={form.participantCategory} onValueChange={v => set('participantCategory', v)}>
            <SelectTrigger><SelectValue placeholder="Student or Working Professional" /></SelectTrigger>
            <SelectContent>{PARTICIPANT_CATEGORY_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <Separator />
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label>Amount Due (USD)</Label>
          <Input type="number" min="0" value={form.amountDue} onChange={e => set('amountDue', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Amount Paid (USD)</Label>
          <Input type="number" min="0" value={form.amountPaid} onChange={e => set('amountPaid', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Balance</Label>
          <div className="h-10 flex items-center px-3 bg-gray-50 border rounded-md text-sm font-semibold">USD {balance.toLocaleString()}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Payment Status</Label>
          <Select value={form.paymentStatus} onValueChange={v => set('paymentStatus', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Tranche</Label>
          <Input value={form.tranche} onChange={e => set('tranche', e.target.value)} placeholder="e.g. Installment 1" />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Date of Payment</Label>
        <Input type="date" value={form.dateOfPayment} onChange={e => set('dateOfPayment', e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label>Comments</Label>
        <Textarea value={form.comments} onChange={e => set('comments', e.target.value)} rows={2} />
      </div>
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={handleSave} disabled={loading} className="bg-[#021d49] hover:bg-[#032a66]">
          {loading ? <><Icons.Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ARIN PUBLISHING ACADEMY  MAIN TAB CONTENT
// ─────────────────────────────────────────────────────────────────
function ArinPublishingTab({ categories }) {
  const publishingCategory = categories.find(c =>
    c.name?.toLowerCase().includes('publishing') || c.name?.toLowerCase().includes('arin publishing')
  );
  const categoryId = publishingCategory?._id;

  const [subTab, setSubTab] = useState('bank'); // 'bank' | 'pay_later'
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({ paid: 0, partial: 0, pending: 0, totalAmountDue: 0, totalAmountPaid: 0, totalBalance: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [modal, setModal] = useState(null); // 'single' | 'bulk' | 'edit' | 'delete'
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  // Pay-later state
  const [payLaterUsers, setPayLaterUsers] = useState([]);
  const [payLaterLoading, setPayLaterLoading] = useState(false);
  const [payLaterSearch, setPayLaterSearch] = useState('');
  const [reminderSending, setReminderSending] = useState(null);
  const [lockingUser, setLockingUser] = useState(null);

  const fetchRecords = useCallback(async () => {
    if (!categoryId) return;
    setLoading(true);
    try {
      const res = await bankPaymentService.getAll({ categoryId, status: filterStatus, search, limit: 500 });
      setRecords(res.records || []);
      setStats(res.stats || { paid: 0, partial: 0, pending: 0, totalAmountDue: 0, totalAmountPaid: 0, totalBalance: 0 });
    } catch {
      toast.error('Failed to load bank payment records');
    } finally {
      setLoading(false);
    }
  }, [categoryId, filterStatus, search]);

  useEffect(() => {
    const t = setTimeout(fetchRecords, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchRecords]);

  const fetchPayLaterUsers = useCallback(async () => {
    if (!categoryId) return;
    setPayLaterLoading(true);
    try {
      const { default: paymentService } = await import('@/lib/api/paymentService');
      const data = await paymentService.adminGetPayLaterEnrollments(categoryId);
      setPayLaterUsers(Array.isArray(data) ? data : []);
    } catch { toast.error('Failed to load pay-later users'); }
    finally { setPayLaterLoading(false); }
  }, [categoryId]);

  useEffect(() => { if (subTab === 'pay_later') fetchPayLaterUsers(); }, [subTab, fetchPayLaterUsers]);

  const handleSendReminder = async (userId) => {
    setReminderSending(userId);
    try {
      const { default: paymentService } = await import('@/lib/api/paymentService');
      await paymentService.adminSendPayLaterReminder(categoryId, userId);
      toast.success('Reminder email sent');
    } catch { toast.error('Failed to send reminder'); }
    finally { setReminderSending(null); }
  };

  const handleToggleLock = async (user) => {
    setLockingUser(user._id);
    try {
      const { default: paymentService } = await import('@/lib/api/paymentService');
      if (user.isLocked) {
        await paymentService.adminUnlockUser(categoryId, user._id);
        toast.success(`${user.firstName} unlocked`);
      } else {
        await paymentService.adminLockUser(categoryId, user._id);
        toast.success(`${user.firstName} locked`);
      }
      fetchPayLaterUsers();
    } catch { toast.error('Failed to update lock status'); }
    finally { setLockingUser(null); }
  };

  const handleSendBulkReminders = async () => {
    try {
      const { default: paymentService } = await import('@/lib/api/paymentService');
      const res = await paymentService.adminSendBulkPayLaterReminders(categoryId);
      toast.success(`Reminders sent: ${res.sent} sent, ${res.failed} failed`);
    } catch { toast.error('Failed to send bulk reminders'); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await bankPaymentService.remove(deleteTarget._id);
      toast.success('Record deleted');
      setModal(null);
      setDeleteTarget(null);
      fetchRecords();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    const rows = [
      ['Full Name', 'Email', 'Gender', 'Nationality', 'Phone', 'Institution', 'Category', 'Amount Due (USD)', 'Amount Paid (USD)', 'Balance (USD)', 'Status', 'Tranche', 'Date of Payment', 'Comments'],
      ...records.map(r => [
        r.fullName, r.email, r.gender || '', r.nationality || '',
        r.phoneNumber || '', r.institution || '', r.participantCategory || '',
        r.amountDue, r.amountPaid, r.balance,
        r.paymentStatus, r.tranche || '',
        r.dateOfPayment ? new Date(r.dateOfPayment).toLocaleDateString('en-GB') : '',
        r.comments || '',
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = rows[0].map(() => ({ wch: 20 }));
    XLSX.utils.book_append_sheet(wb, ws, 'Bank Payments');
    XLSX.writeFile(wb, `arin-publishing-bank-payments-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const statusBadge = (status) => {
    if (status === 'paid')    return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Paid</span>;
    if (status === 'partial') return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Partial</span>;
    return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">Pending</span>;
  };

  if (!categoryId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Icons.AlertCircle className="w-12 h-12 text-amber-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">Arin Publishing Academy category not found</p>
        <p className="text-gray-400 text-xs mt-1">Make sure the category exists in the system.</p>
      </div>
    );
  }

  const filteredPayLater = payLaterUsers.filter(u => {
    const q = payLaterSearch.toLowerCase();
    return !q || `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Sub-tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {[{ key: 'bank', label: 'Bank / Manual Records', icon: Icons.CreditCard },
          { key: 'pay_later', label: 'Pay Later (Self-Registered)', icon: Icons.Clock }].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setSubTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${subTab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* Stats  bank only */}
      {subTab === 'bank' && <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <StatCard label="Paid" value={stats.paid} icon={Icons.CheckCircle} color="green" />
        <StatCard label="Partial" value={stats.partial} icon={Icons.Clock} color="amber" />
        <StatCard label="Pending" value={stats.pending} icon={Icons.Clock} color="red" />
        <StatCard label="Total Due" value={`USD ${(stats.totalAmountDue || 0).toLocaleString()}`} icon={Icons.DollarSign} color="blue" />
        <StatCard label="Total Paid" value={`USD ${(stats.totalAmountPaid || 0).toLocaleString()}`} icon={Icons.DollarSign} color="purple" />
        <StatCard label="Balance" value={`USD ${(stats.totalBalance || 0).toLocaleString()}`} icon={Icons.DollarSign} color="amber" />
      </div>}

      {/* Pay Later sub-tab */}
      {subTab === 'pay_later' && (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-56">
                  <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input value={payLaterSearch} onChange={e => setPayLaterSearch(e.target.value)} placeholder="Search by name or email…" className="pl-9" />
                </div>
                <Button variant="outline" size="icon" onClick={fetchPayLaterUsers} title="Refresh">
                  <Icons.RefreshCw className={`w-4 h-4 ${payLaterLoading ? 'animate-spin' : ''}`} />
                </Button>
                <Button onClick={handleSendBulkReminders} className="gap-2 bg-amber-600 hover:bg-amber-700">
                  <Icons.Send className="w-4 h-4" /> Send All Reminders
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    {['Name', 'Email', 'Tier', 'Enrolled', 'Status', 'Locked', 'Actions'].map(h => (
                      <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payLaterLoading && filteredPayLater.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-16">
                      <Icons.Loader2 className="w-8 h-8 animate-spin text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">Loading…</p>
                    </td></tr>
                  ) : filteredPayLater.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-16">
                      <Icons.Clock className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">No pay-later enrollments yet</p>
                      <p className="text-gray-400 text-xs mt-1">Users who register and choose "Pay Later" will appear here.</p>
                    </td></tr>
                  ) : filteredPayLater.map(u => (
                    <tr key={u._id} className="border-b last:border-0 hover:bg-gray-50/60">
                      <td className="px-3 py-3 font-semibold text-gray-800 whitespace-nowrap">{u.firstName} {u.lastName}</td>
                      <td className="px-3 py-3 text-xs text-gray-600">{u.email}</td>
                      <td className="px-3 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.tier === 'student' ? 'bg-sky-100 text-sky-700' : 'bg-orange-100 text-orange-700'}`}>
                          {u.tier === 'student' ? 'Student' : 'Non-Student'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {u.enrolledAt ? new Date(u.enrolledAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Pay Later</span>
                      </td>
                      <td className="px-3 py-3">
                        {u.isLocked
                          ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1 w-fit"><Icons.Lock className="w-3 h-3" />Locked</span>
                          : <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1 w-fit"><Icons.Unlock className="w-3 h-3" />Active</span>}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 text-amber-700 hover:bg-amber-50"
                            disabled={reminderSending === u._id}
                            onClick={() => handleSendReminder(u._id)}>
                            {reminderSending === u._id ? <Icons.Loader2 className="w-3 h-3 animate-spin" /> : <Icons.Mail className="w-3 h-3" />}
                            Remind
                          </Button>
                          <Button variant="ghost" size="sm" className={`h-8 text-xs gap-1 ${u.isLocked ? 'text-green-700 hover:bg-green-50' : 'text-red-600 hover:bg-red-50'}`}
                            disabled={lockingUser === u._id}
                            onClick={() => handleToggleLock(u)}>
                            {lockingUser === u._id ? <Icons.Loader2 className="w-3 h-3 animate-spin" /> : u.isLocked ? <Icons.Unlock className="w-3 h-3" /> : <Icons.Lock className="w-3 h-3" />}
                            {u.isLocked ? 'Unlock' : 'Lock'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Bank records UI */}
      {subTab === 'bank' && <>
      {/* Toolbar */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-56">
              <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…" className="pl-9" />
            </div>
            <Select value={filterStatus} onValueChange={v => setFilterStatus(v)}>
              <SelectTrigger className="w-36"><SelectValue placeholder="All statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchRecords} title="Refresh">
              <Icons.RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="outline" onClick={exportToExcel} className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50">
              <Icons.FileDown className="w-4 h-4" /> Export Excel
            </Button>
            <Button variant="outline" onClick={() => setModal('single')} className="gap-2">
              <Icons.Plus className="w-4 h-4" /> Add Record
            </Button>
            <Button onClick={() => setModal('bulk')} className="gap-2 bg-[#021d49] hover:bg-[#032a66]">
              <Icons.Upload className="w-4 h-4" /> Bulk Upload
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                {['Full Name', 'Gender', 'Nationality', 'Email', 'Phone', 'Institution', 'Category', 'Amount Due', 'Amount Paid', 'Balance', 'Status', 'Tranche', 'Date Paid', 'Comments', 'Actions'].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && records.length === 0 ? (
                <tr><td colSpan={15} className="text-center py-16">
                  <Icons.Loader2 className="w-8 h-8 animate-spin text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Loading records…</p>
                </td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={15} className="text-center py-16">
                  <Icons.BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No bank payment records yet</p>
                  <p className="text-gray-400 text-xs mt-1">Use "Add Record" or "Bulk Upload" to get started.</p>
                </td></tr>
              ) : (
                records.map(r => (
                  <tr key={r._id} className="border-b last:border-0 hover:bg-gray-50/60 transition-colors">
                    <td className="px-3 py-3">
                      <div>
                        <p className="font-semibold text-gray-800 whitespace-nowrap">{r.fullName}</p>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-600">{r.gender || <span className="text-gray-300"></span>}</td>
                    <td className="px-3 py-3 text-xs text-gray-600">{r.nationality || <span className="text-gray-300"></span>}</td>
                    <td className="px-3 py-3 text-xs text-gray-600">{r.email}</td>
                    <td className="px-3 py-3 text-xs text-gray-600">{r.phoneNumber || <span className="text-gray-300"></span>}</td>
                    <td className="px-3 py-3 text-xs text-gray-600 max-w-32 truncate">{r.institution || <span className="text-gray-300"></span>}</td>
                    <td className="px-3 py-3 text-xs">{r.participantCategory ? <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-medium">{r.participantCategory}</span> : <span className="text-gray-300"></span>}</td>
                    <td className="px-3 py-3 text-xs font-medium text-gray-700">USD {(r.amountDue || 0).toLocaleString()}</td>
                    <td className="px-3 py-3 text-xs font-medium text-green-700">USD {(r.amountPaid || 0).toLocaleString()}</td>
                    <td className="px-3 py-3 text-xs font-medium text-red-600">USD {(r.balance || 0).toLocaleString()}</td>
                    <td className="px-3 py-3">{statusBadge(r.paymentStatus)}</td>
                    <td className="px-3 py-3 text-xs text-gray-600">{r.tranche || <span className="text-gray-300"></span>}</td>
                    <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">{r.dateOfPayment ? new Date(r.dateOfPayment).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : <span className="text-gray-300"></span>}</td>
                    <td className="px-3 py-3 text-xs text-gray-500 max-w-40 truncate">{r.comments || <span className="text-gray-300"></span>}</td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit" onClick={() => { setEditTarget(r); setModal('edit'); }}>
                          <Icons.Pencil className="w-3.5 h-3.5 text-gray-500" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Delete" onClick={() => { setDeleteTarget(r); setModal('delete'); }}>
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
      </Card>

      {/* Modals */}
      <Modal open={modal === 'single'} onClose={() => setModal(null)} title="Add Bank Payment Record" maxWidth="max-w-2xl">
        <BankPaymentForm categoryId={categoryId} onSuccess={fetchRecords} onClose={() => setModal(null)} />
      </Modal>

      <Modal open={modal === 'bulk'} onClose={() => setModal(null)} title="Bulk Upload  Bank Payments" maxWidth="max-w-[95vw]">
        <BankPaymentBulkForm categoryId={categoryId} onSuccess={fetchRecords} onClose={() => setModal(null)} />
      </Modal>

      {editTarget && (
        <Modal open={modal === 'edit'} onClose={() => { setModal(null); setEditTarget(null); }} title={`Edit  ${editTarget.fullName}`} maxWidth="max-w-2xl">
          <EditBankPaymentDialog record={editTarget} onClose={() => { setModal(null); setEditTarget(null); }} onDone={fetchRecords} />
        </Modal>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Icons.Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Delete Record?</h3>
                <p className="text-sm text-gray-500 mt-1">Remove <strong>{deleteTarget.fullName}</strong> ({deleteTarget.email}) from bank payment records?</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setModal(null); setDeleteTarget(null); }} disabled={deleting}>Cancel</Button>
              <Button onClick={handleDelete} disabled={deleting} className="gap-1.5 bg-red-600 hover:bg-red-700 text-white">
                {deleting ? <><Icons.Loader2 className="w-4 h-4 animate-spin" /> Deleting…</> : <><Icons.Trash2 className="w-4 h-4" /> Delete</>}
              </Button>
            </div>
          </div>
        </div>
      )}
      </>} {/* end bank sub-tab */}
    </div>
  );
}

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
    tier: 'non-student',
    accessType: 'full', // 'full' | 'pay_later'
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
        category: (form.category && form.category !== '__none__') ? form.category : undefined,
      });
      // Always show the temporary password so the admin has it as a backup
      setCreated({ email: form.email, temporaryPassword: res.temporaryPassword, emailSent: form.sendEmail });
      onSuccess?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create fellow');
    } finally {
      setLoading(false);
    }
  };

  // ── Success state: always show temp password ─────────────────────
  if (created) {
    return (
      <div className="space-y-5">
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
            <Icons.CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-gray-900">Fellow Created Successfully</h3>
            <p className="text-sm text-gray-500 mt-0.5">{created.email}</p>
          </div>
        </div>

        {/* Email status banner */}
        {created.emailSent ? (
          <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
            <Icons.MailCheck className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-green-700">
              An invitation email with the temporary password has been sent to the fellow. Keep the password below as a backup in case the email is not received.
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <Icons.MailOpen className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              No invitation email was sent. Share the temporary password below with the fellow directly. They will be required to change it on first login.
            </p>
          </div>
        )}

        {/* Temporary password  always visible */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Icons.KeyRound className="w-4 h-4 text-gray-600 flex-shrink-0" />
            <p className="text-sm font-semibold text-gray-800">Temporary Password</p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2.5">
            <code className="flex-1 text-sm font-mono font-bold text-gray-900 tracking-widest select-all">
              {created.temporaryPassword}
            </code>
            <Button
              variant="ghost" size="sm"
              onClick={() => copyPassword(created.temporaryPassword)}
              className="gap-1.5 text-xs h-7 flex-shrink-0"
            >
              {copied
                ? <><Icons.CheckCircle className="w-3.5 h-3.5 text-green-500" /> Copied!</>
                : <><Icons.Copy className="w-3.5 h-3.5" /> Copy</>}
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            The fellow will be prompted to set a new personal password on first login. You can also resend the invitation email later via <strong>Send Invitations</strong>.
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

      {/* Tier + Access Type — only shown when a category is selected */}
      {form.category && form.category !== '__none__' && (
        <>
          <Separator />
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-700">Publishing Academy Access</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Tier</Label>
                <Select value={form.tier} onValueChange={v => set('tier', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student (USD 100)</SelectItem>
                    <SelectItem value="non-student">Non-Student (USD 200)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Access Level</Label>
                <Select value={form.accessType} onValueChange={v => set('accessType', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full Access</SelectItem>
                    <SelectItem value="pay_later">Pay Later (Module 1 only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.accessType === 'pay_later' && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <Icons.Clock className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  Fellow will access <strong>Module 1 only</strong> until they complete payment. They will appear in the <strong>Pay Later</strong> sub-tab and you can send them payment reminders.
                </p>
              </div>
            )}
          </div>
        </>
      )}

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

  // Paste handler  tab-separated rows: Full Name \t email \t gender \t country \t region \t track \t phone
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
                <p className="text-xs font-semibold text-amber-800">Temporary Passwords  share these with each fellow</p>
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
  const mapFellow = (f) => ({
    fullName:    f.fullName || `${f.firstName || ''} ${f.lastName || ''}`.trim(),
    email:       f.email || '',
    gender:      f.gender      || '',
    country:     f.country     || '',
    phoneNumber: f.phoneNumber || '',
    // region lives on both user.region (set via profile) and fellowData.region (set at creation)
    region:      f.region || f.fellowData?.region || '',
    track:       f.fellowData?.track || '',
    isActive:    f.isActive ?? true,
  });

  const [form, setForm] = useState(() => mapFellow(fellow));
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Fetch fresh data on open so edits reflect latest profile changes
  useEffect(() => {
    adminService.getFellowById(fellow._id)
      .then(fresh => setForm(mapFellow(fresh)))
      .catch(() => { /* keep form seeded from list row */ })
      .finally(() => setFetching(false));
  }, [fellow._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminService.updateFellow(fellow._id, { ...form });
      toast.success('Fellow updated');
      onDone?.();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icons.Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Email (read-only) */}
      <div className="space-y-1">
        <Label>Email Address</Label>
        <Input value={form.email} disabled className="bg-gray-50 text-gray-500" />
        <p className="text-xs text-gray-400">Email cannot be changed</p>
      </div>

      <div className="space-y-1">
        <Label>Full Name</Label>
        <Input value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="e.g. Amara Diallo" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1"><Label>Phone Number</Label>
          <Input value={form.phoneNumber} onChange={e => set('phoneNumber', e.target.value)} placeholder="+254 700 000 000" /></div>
        <div className="space-y-1"><Label>Gender</Label>
          <Select value={form.gender} onValueChange={v => set('gender', v)}>
            <SelectTrigger><SelectValue placeholder="Gender" /></SelectTrigger>
            <SelectContent>{GENDER_OPTIONS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1"><Label>Country</Label>
          <Input value={form.country} onChange={e => set('country', e.target.value)} placeholder="e.g. Kenya" /></div>
        <div className="space-y-1"><Label>Region</Label>
          <Input value={form.region} onChange={e => set('region', e.target.value)} placeholder="e.g. Nairobi" /></div>
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
        <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <><Icons.Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Icons.Save className="w-4 h-4" /> Save Changes</>}
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// RESET PASSWORD DIALOG
// ─────────────────────────────────────────────────────────────────
function ResetPasswordDialog({ fellow, onClose }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { email, temporaryPassword }
  const [copied, setCopied] = useState(false);

  const copyPassword = (pw) => {
    navigator.clipboard.writeText(pw).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      const res = await adminService.resetFellowPassword(fellow._id);
      setResult(res);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="space-y-5">
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <Icons.CheckCircle className="w-7 h-7 text-green-600" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-gray-900">Password Reset</h3>
            <p className="text-sm text-gray-500 mt-0.5">{result.email}</p>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Icons.KeyRound className="w-4 h-4 text-gray-600" />
            <p className="text-sm font-semibold text-gray-800">New Temporary Password</p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2.5">
            <code className="flex-1 text-sm font-mono font-bold text-gray-900 tracking-widest select-all">
              {result.temporaryPassword}
            </code>
            <Button
              variant="ghost" size="sm"
              onClick={() => copyPassword(result.temporaryPassword)}
              className="gap-1.5 text-xs h-7 flex-shrink-0"
            >
              {copied
                ? <><Icons.CheckCircle className="w-3.5 h-3.5 text-green-500" /> Copied!</>
                : <><Icons.Copy className="w-3.5 h-3.5" /> Copy</>}
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Share this with the fellow. They will be required to set a new personal password on first login.
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
      <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {(fellow.fullName?.[0] || fellow.email?.[0] || '?').toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">{fellow.fullName || fellow.email}</p>
          <p className="text-xs text-gray-500">{fellow.email}</p>
        </div>
      </div>

      <Alert className="border-amber-100 bg-amber-50 py-3">
        <Icons.TriangleAlert className="w-4 h-4 text-amber-500" />
        <AlertDescription className="text-amber-700 text-xs">
          This will generate a new temporary password and invalidate any previous one. The fellow will be required to change it on next login.
        </AlertDescription>
      </Alert>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={handleReset} disabled={loading} className="gap-2 bg-amber-600 hover:bg-amber-700 text-white">
          {loading
            ? <><Icons.Loader2 className="w-4 h-4 animate-spin" /> Resetting…</>
            : <><Icons.KeyRound className="w-4 h-4" /> Reset Password</>}
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
  const [activeTab, setActiveTab]         = useState('fellows'); // 'fellows' | 'publishing'
  const [fellows, setFellows]             = useState([]);
  const [categories, setCategories]       = useState([]);
  const [loading, setLoading]             = useState(false);
  const [search, setSearch]               = useState('');
  const [filterStatus, setFilterStatus]   = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
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
  const [resetTarget, setResetTarget]       = useState(null);
  const [deleting, setDeleting]           = useState(false);
  const [unenrollTarget, setUnenrollTarget] = useState(null); // { fellow, categoryId, categoryName }
  const [unenrolling, setUnenrolling]       = useState(false);

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

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    setDeleting(true);
    const ids = Array.from(selected);
    let failed = 0;
    for (const id of ids) {
      try {
        await adminService.deleteFellow(id);
      } catch {
        failed++;
      }
    }
    setDeleting(false);
    setModal(null);
    setSelected(new Set());
    if (failed === 0) toast.success(`${ids.length} fellow${ids.length !== 1 ? 's' : ''} deleted`);
    else toast.error(`${ids.length - failed} deleted, ${failed} failed`);
    reload();
  };

  const handleUnenroll = async () => {
    if (!unenrollTarget) return;
    setUnenrolling(true);
    try {
      await adminService.revokeUserCategoryAccess(unenrollTarget.fellow._id, unenrollTarget.categoryId);
      toast.success(`Removed from "${unenrollTarget.categoryName}"`);
      setUnenrollTarget(null);
      reload();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to unenroll fellow');
    } finally {
      setUnenrolling(false);
    }
  };

  const statusBadge = (f) => {
    const s = f.fellowData?.fellowshipStatus;
    if (s === 'active')    return <Badge className="bg-green-100 text-green-700 text-xs">Active</Badge>;
    if (s === 'completed') return <Badge className="bg-blue-100 text-blue-700 text-xs">Completed</Badge>;
    if (s === 'expired')   return <Badge className="bg-red-100 text-red-700 text-xs">Expired</Badge>;
    return <Badge variant="secondary" className="text-xs">Unknown</Badge>;
  };

  // Resolve a fellow's category names from their assignedCategories + purchasedCategories
  const getFellowCategoryNames = (f) => {
    const ids = [
      ...(f.fellowData?.assignedCategories || []),
      ...(f.purchasedCategories || []),
    ].map(id => id?.toString?.() || String(id));
    const unique = [...new Set(ids)];
    return unique.map(id => categories.find(c => c._id === id)?.name).filter(Boolean);
  };

  // Client-side filter by category
  const displayedFellows = filterCategory === 'all'
    ? fellows
    : fellows.filter(f => {
        const ids = [
          ...(f.fellowData?.assignedCategories || []),
          ...(f.purchasedCategories || []),
        ].map(id => id?.toString?.() || String(id));
        return ids.includes(filterCategory);
      });

  const [exporting, setExporting] = useState(false);

  const exportToExcel = async () => {
    setExporting(true);
    try {
      // Fetch all fellows at once (high limit to bypass pagination)
      const res = await adminService.getAllFellows({ status: 'all', page: 1, limit: 10000 });
      const allFellows = res.fellows || [];

      // Helper to get category names for a fellow using the loaded categories list
      const getCatNames = (f) => {
        const ids = [
          ...(f.fellowData?.assignedCategories || []),
          ...(f.purchasedCategories || []),
        ].map(id => id?.toString?.() || String(id));
        return [...new Set(ids)]
          .map(id => categories.find(c => c._id === id)?.name)
          .filter(Boolean);
      };

      // Exclude PRS fellows  fellows whose track or any category name contains "PRS"
      const nonPrs = allFellows.filter(f => {
        const track = (f.fellowData?.track || '').toUpperCase();
        const catNames = getCatNames(f).map(n => n.toUpperCase());
        return !track.includes('PRS') && !catNames.some(n => n.includes('PRS'));
      });

      // ── Tally by gender ──
      const byGender = {};
      nonPrs.forEach(f => {
        const g = f.gender || 'Not specified';
        byGender[g] = (byGender[g] || 0) + 1;
      });

      // ── Tally by country ──
      const byCountry = {};
      nonPrs.forEach(f => {
        const c = f.country || 'Not specified';
        byCountry[c] = (byCountry[c] || 0) + 1;
      });

      // ── Tally by category ──
      const byCategory = {};
      nonPrs.forEach(f => {
        const names = getCatNames(f);
        if (names.length === 0) {
          byCategory['Unassigned'] = (byCategory['Unassigned'] || 0) + 1;
        } else {
          names.forEach(name => { byCategory[name] = (byCategory[name] || 0) + 1; });
        }
      });

      const wb = XLSX.utils.book_new();

      // ── Sheet 1: Summary ──
      const summaryRows = [
        ['ARIN FELLOWS REPORT'],
        ['Generated on', new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })],
        [],
        ['Total Admitted Fellows (excluding PRS)', nonPrs.length],
        [],
        ['BREAKDOWN BY GENDER'],
        ['Gender', 'Count'],
        ...Object.entries(byGender).sort((a, b) => a[0].localeCompare(b[0])),
        [],
        ['BREAKDOWN BY COUNTRY'],
        ['Country', 'Count'],
        ...Object.entries(byCountry).sort((a, b) => a[0].localeCompare(b[0])),
        [],
        ['BREAKDOWN BY CATEGORY'],
        ['Category', 'Count'],
        ...Object.entries(byCategory).sort((a, b) => a[0].localeCompare(b[0])),
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
      summarySheet['!cols'] = [{ wch: 42 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

      // ── Sheet 2: Full Fellows List ──
      const listRows = [
        ['Full Name', 'Email', 'Gender', 'Country', 'Category', 'Track', 'Region', 'Status', 'Date Joined'],
        ...nonPrs.map(f => {
          const catNames = getCatNames(f);
          return [
            f.fullName || '',
            f.email || '',
            f.gender || '',
            f.country || '',
            catNames.join(', ') || 'Unassigned',
            f.fellowData?.track || '',
            f.fellowData?.region || '',
            f.fellowData?.fellowshipStatus || '',
            f.createdAt ? new Date(f.createdAt).toLocaleDateString('en-GB') : '',
          ];
        }),
      ];
      const listSheet = XLSX.utils.aoa_to_sheet(listRows);
      listSheet['!cols'] = [
        { wch: 28 }, { wch: 32 }, { wch: 14 }, { wch: 18 },
        { wch: 22 }, { wch: 24 }, { wch: 18 }, { wch: 12 }, { wch: 14 },
      ];
      XLSX.utils.book_append_sheet(wb, listSheet, 'Fellows List');

      XLSX.writeFile(wb, `fellows-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('Excel report downloaded');
    } catch (err) {
      toast.error('Failed to generate report');
    } finally {
      setExporting(false);
    }
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
        {activeTab === 'fellows' && (
          <div className="flex gap-2">
            <Button onClick={exportToExcel} disabled={exporting} variant="outline" className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50">
              {exporting
                ? <><Icons.Loader2 className="w-4 h-4 animate-spin" /> Exporting…</>
                : <><Icons.FileDown className="w-4 h-4" /> Export Excel</>}
            </Button>
            <Button onClick={() => setModal('single')} variant="outline" className="gap-2">
              <Icons.UserPlus className="w-4 h-4" /> Add Fellow
            </Button>
            <Button onClick={() => router.push('/admin/fellows/bulk')} className="gap-2 bg-green-600 hover:bg-green-700">
              <Icons.Users className="w-4 h-4" /> Bulk Add Fellows
            </Button>
          </div>
        )}
      </div>

      {/* ── Tab Bar ──────────────────────────────── */}
      <div className="bg-white border-b px-6">
        <div className="flex gap-1">
          {[
            { key: 'fellows', label: 'Fellows', icon: Icons.Users },
            { key: 'publishing', label: 'Arin Publishing Academy', icon: Icons.BookOpen },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all -mb-px ${
                activeTab === key
                  ? 'border-[#021d49] text-[#021d49]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Arin Publishing Academy Tab ──────────── */}
      {activeTab === 'publishing' && (
        <div className="max-w-7xl mx-auto px-6 py-6">
          <ArinPublishingTab categories={categories} />
        </div>
      )}

      {activeTab === 'fellows' && (<>
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* ── Stats ────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Fellows"       value={pagination.total} icon={Icons.Users}     color="blue" />
          <StatCard label="Active"              value={fellows.filter(f=>f.fellowData?.fellowshipStatus==='active').length} icon={Icons.CheckCircle} color="green" sub={`of ${fellows.length} shown`} />
          <StatCard label="Awaiting Invitation" value={fellows.filter(f=>!f.invitationEmailSent).length}    icon={Icons.MailOpen}   color="amber" sub="No email sent yet" />
          <StatCard label="Inactive"            value={fellows.filter(f=>!f.isActive).length}              icon={Icons.UserX}      color="red" />
        </div>

        {/* ── Per-category breakdown ── */}
        {categories.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map(cat => {
              const count = fellows.filter(f => {
                const ids = [
                  ...(f.fellowData?.assignedCategories || []),
                  ...(f.purchasedCategories || []),
                ].map(id => id?.toString?.() || String(id));
                return ids.includes(cat._id);
              }).length;
              return (
                <button
                  key={cat._id}
                  onClick={() => setFilterCategory(filterCategory === cat._id ? 'all' : cat._id)}
                  className={`text-left rounded-xl border-2 p-4 transition-all ${filterCategory === cat._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-0.5">Category</p>
                      <p className="font-semibold text-gray-900 text-sm">{cat.name}</p>
                    </div>
                    <div className={`text-2xl font-extrabold ${filterCategory === cat._id ? 'text-blue-600' : 'text-gray-700'}`}>
                      {count}
                    </div>
                  </div>
                  {filterCategory === cat._id && (
                    <p className="text-xs text-blue-600 mt-1">Showing filtered results · click to clear</p>
                  )}
                </button>
              );
            })}
          </div>
        )}

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

              {/* Category filter */}
              <Select value={filterCategory} onValueChange={v => { setFilterCategory(v); setSelected(new Set()); }}>
                <SelectTrigger className="w-52"><SelectValue placeholder="All categories" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                  ))}
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
                  <Button size="sm" variant="outline" onClick={() => setModal('bulkDelete')} className="gap-1.5 border-red-300 text-red-600 hover:bg-red-50">
                    <Icons.Trash2 className="w-3.5 h-3.5" /> Delete Selected
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
                  {['Fellow', 'Category', 'Track / Region', 'Country', 'Status', 'Invitation', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && fellows.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-16">
                    <Icons.Loader2 className="w-8 h-8 animate-spin text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Loading fellows…</p>
                  </td></tr>
                ) : displayedFellows.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-16">
                    <Icons.Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No fellows found</p>
                    <p className="text-gray-400 text-xs mt-1">Try adjusting your search or filters.</p>
                  </td></tr>
                ) : (
                  displayedFellows.map(f => (
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
                      {/* Category */}
                      <td className="px-3 py-3">
                        {(() => {
                          const ids = [
                            ...(f.fellowData?.assignedCategories || []),
                            ...(f.purchasedCategories || []),
                          ].map(id => id?.toString?.() || String(id));
                          const unique = [...new Set(ids)];
                          const catEntries = unique.map(id => ({ id, name: categories.find(c => c._id === id)?.name })).filter(e => e.name);
                          if (catEntries.length === 0) return <span className="text-gray-300 text-xs"></span>;
                          return (
                            <div className="flex flex-wrap gap-1">
                              {catEntries.map(({ id, name }) => (
                                <span key={id} className="group inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full">
                                  {name}
                                  <button
                                    title={`Remove from "${name}"`}
                                    onClick={(e) => { e.stopPropagation(); setUnenrollTarget({ fellow: f, categoryId: id, categoryName: name }); }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5 text-blue-400 hover:text-red-500"
                                  >
                                    <Icons.X className="w-2.5 h-2.5" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          );
                        })()}
                      </td>
                      {/* Track / Region */}
                      <td className="px-3 py-3">
                        {f.fellowData?.track && <p className="text-xs font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full inline-block">{f.fellowData.track}</p>}
                        {f.fellowData?.region && <p className="text-xs text-gray-500 mt-1">{f.fellowData.region}</p>}
                        {!f.fellowData?.track && !f.fellowData?.region && <span className="text-gray-300 text-xs"></span>}
                      </td>
                      {/* Country */}
                      <td className="px-3 py-3 text-sm text-gray-700">{f.country || <span className="text-gray-300"></span>}</td>
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
                        {f.createdAt ? new Date(f.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
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
                            variant="ghost" size="icon" className="h-8 w-8" title="Reset temporary password"
                            onClick={() => { setResetTarget(f); setModal('resetPassword'); }}
                          >
                            <Icons.KeyRound className="w-3.5 h-3.5 text-orange-500" />
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
      <Modal open={modal === 'email'} onClose={() => setModal(null)} title={`Send Custom Email  ${selected.size} Fellows`} maxWidth="max-w-2xl">
        <BulkEmailDialog
          selected={selected}
          fellows={fellows}
          isInvitation={false}
          onClose={() => setModal(null)}
          onDone={reload}
        />
      </Modal>

      {/* Send Invitations */}
      <Modal open={modal === 'invitation'} onClose={() => setModal(null)} title={`Send Fellowship Invitations  ${selected.size} Fellows`} maxWidth="max-w-xl">
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

      {/* Reset Temporary Password */}
      {resetTarget && (
        <Modal open={modal === 'resetPassword'} onClose={() => { setModal(null); setResetTarget(null); }} title="Reset Temporary Password" maxWidth="max-w-md">
          <ResetPasswordDialog
            fellow={resetTarget}
            onClose={() => { setModal(null); setResetTarget(null); }}
          />
        </Modal>
      )}

      {/* Edit Fellow */}
      {editTarget && (
        <Modal open={modal === 'edit'} onClose={() => setModal(null)} title={`Edit  ${editTarget.fullName || editTarget.email}`} maxWidth="max-w-lg">
          <EditFellowDialog
            fellow={editTarget}
            onClose={() => { setModal(null); setEditTarget(null); }}
            onDone={reload}
          />
        </Modal>
      )}

      {/* Bulk Delete Confirm */}
      {modal === 'bulkDelete' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Icons.Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Delete {selected.size} Fellow{selected.size !== 1 ? 's' : ''}?</h3>
                <p className="text-sm text-gray-500 mt-1">
                  This will permanently delete the selected {selected.size} fellow{selected.size !== 1 ? 's' : ''}. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setModal(null)} disabled={deleting}>Cancel</Button>
              <Button onClick={handleBulkDelete} disabled={deleting} className="gap-1.5 bg-red-600 hover:bg-red-700 text-white">
                {deleting ? <><Icons.Loader2 className="w-4 h-4 animate-spin" /> Deleting...</> : <><Icons.Trash2 className="w-4 h-4" /> Delete {selected.size}</>}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Unenroll from Category Confirm */}
      {unenrollTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setUnenrollTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Icons.UserMinus className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Remove from Category?</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Remove <strong>{unenrollTarget.fellow.fullName || unenrollTarget.fellow.email}</strong> from <strong>{unenrollTarget.categoryName}</strong>? Their progress in this category will be retained but they will lose access.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setUnenrollTarget(null)} disabled={unenrolling}>Cancel</Button>
              <Button onClick={handleUnenroll} disabled={unenrolling} className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white">
                {unenrolling ? <><Icons.Loader2 className="w-4 h-4 animate-spin" /> Removing…</> : <><Icons.UserMinus className="w-4 h-4" /> Remove</>}
              </Button>
            </div>
          </div>
        </div>
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
      </>)}
    </div>
  );
}
