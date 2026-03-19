'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import adminService from '@/lib/api/adminService';
import categoryService from '@/lib/api/categoryService';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
const TRACK_OPTIONS  = ['AI & Machine Learning', 'Data Science', 'Climate Tech', 'Agri-Tech', 'Health Tech', 'FinTech', 'EdTech', 'Other'];
const DRAFT_KEY      = 'fellows_bulk_draft';

const BLANK_ROW = () => ({
    id: Date.now() + Math.random(),
    fullName: '', email: '', gender: '',
    country: '', region: '', track: '', category: '', phoneNumber: '',
});

const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || ''));


// ── Step indicator ─────────────────────────────────────────────────────────
function Steps({ current }) {
    const steps = [
        { n: 1, label: 'Import Data',      icon: Icons.Upload },
        { n: 2, label: 'Review & Edit',    icon: Icons.TableProperties },
        { n: 3, label: 'Assign Category',  icon: Icons.FolderOpen },
        { n: 4, label: 'Done',             icon: Icons.UserCheck },
    ];
    return (
        <div className="flex items-center gap-0">
            {steps.map((s, i) => {
                const Icon  = s.icon;
                const done  = current > s.n;
                const active = current === s.n;
                return (
                    <div key={s.n} className="flex items-center">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                            ${done   ? 'bg-green-100 text-green-700'
                            : active ? 'bg-blue-100 text-blue-700'
                            :          'bg-gray-100 text-gray-400'}`}>
                            {done
                                ? <Icons.CheckCircle className="w-4 h-4" />
                                : <Icon className="w-4 h-4" />}
                            <span className="hidden sm:inline">{s.label}</span>
                            <span className="sm:hidden">{s.n}</span>
                        </div>
                        {i < steps.length - 1 && (
                            <div className={`h-px w-8 mx-1 ${done ? 'bg-green-400' : 'bg-gray-200'}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ── Row status dot ─────────────────────────────────────────────────────────
function RowStatus({ row }) {
    if (!row.fullName && !row.email)
        return <span className="w-2.5 h-2.5 rounded-full bg-gray-200 inline-block shrink-0" title="Empty" />;
    if (!row.email)
        return <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block shrink-0" title="Email required" />;
    if (!isValidEmail(row.email))
        return <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shrink-0" title="Invalid email" />;
    return <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block shrink-0" title="Valid" />;
}

// ── Fellow card (large, user-friendly per-row form) ────────────────────────
function FellowCard({ row, idx, onUpdate, onRemove, categories }) {
    const isEmpty   = !row.fullName && !row.email;
    const hasError  = row.email && !isValidEmail(row.email);
    const isValid   = row.email && isValidEmail(row.email);

    const borderColor = isValid  ? 'border-green-200 bg-white'
                      : hasError ? 'border-amber-200 bg-amber-50/30'
                      : isEmpty  ? 'border-gray-200 bg-gray-50/30'
                      :            'border-red-200 bg-red-50/20';

    return (
        <Card className={`border-2 transition-all ${borderColor}`}>
            <CardHeader className="pb-3 pt-4 px-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0 ${
                            isValid ? 'bg-green-500' : hasError ? 'bg-amber-400' : 'bg-gray-300'
                        }`}>
                            {idx + 1}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <RowStatus row={row} />
                            <span className="text-sm font-semibold text-gray-700">
                                {row.fullName?.trim()
                                    ? row.fullName.trim()
                                    : <span className="text-gray-400 font-normal">Fellow {idx + 1}</span>}
                            </span>
                            {row.email && isValid && (
                                <span className="text-xs text-gray-400">· {row.email}</span>
                            )}
                        </div>
                    </div>
                    <Button
                        type="button" variant="ghost" size="icon"
                        className="h-8 w-8 text-gray-300 hover:text-red-500 hover:bg-red-50"
                        onClick={onRemove}
                    >
                        <Icons.Trash2 className="w-4 h-4" />
                    </Button>
                </div>
                {hasError && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1 ml-9">
                        <Icons.AlertCircle className="w-3.5 h-3.5" /> Invalid email address
                    </p>
                )}
                {row.email === '' && !isEmpty && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1 ml-9">
                        <Icons.AlertCircle className="w-3.5 h-3.5" /> Email is required
                    </p>
                )}
            </CardHeader>

            <CardContent className="px-5 pb-5">
                <div className="grid grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-gray-600">Full Name</Label>
                        <Input
                            value={row.fullName}
                            onChange={e => onUpdate('fullName', e.target.value)}
                            placeholder="e.g. Amara Diallo"
                            className="h-11 text-sm"
                        />
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-gray-600">
                            Email Address <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            type="email"
                            value={row.email}
                            onChange={e => onUpdate('email', e.target.value)}
                            placeholder="fellow@example.com"
                            className={`h-11 text-sm ${hasError ? 'border-amber-400 ring-1 ring-amber-200' : ''}`}
                        />
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-gray-600">Phone Number</Label>
                        <Input
                            value={row.phoneNumber}
                            onChange={e => onUpdate('phoneNumber', e.target.value)}
                            placeholder="+254 700 000 000"
                            className="h-11 text-sm"
                        />
                    </div>

                    {/* Gender */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-gray-600">Gender</Label>
                        <Select value={row.gender} onValueChange={v => onUpdate('gender', v)}>
                            <SelectTrigger className="h-11 text-sm">
                                <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                                {GENDER_OPTIONS.map(g => (
                                    <SelectItem key={g} value={g}>{g}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Country */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-gray-600">Country</Label>
                        <Input
                            value={row.country}
                            onChange={e => onUpdate('country', e.target.value)}
                            placeholder="e.g. Kenya"
                            className="h-11 text-sm"
                        />
                    </div>

                    {/* Region */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-gray-600">Region</Label>
                        <Input
                            value={row.region}
                            onChange={e => onUpdate('region', e.target.value)}
                            placeholder="e.g. East Africa"
                            className="h-11 text-sm"
                        />
                    </div>

                    {/* Track */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-gray-600">Track</Label>
                        <Select value={row.track} onValueChange={v => onUpdate('track', v)}>
                            <SelectTrigger className="h-11 text-sm">
                                <SelectValue placeholder="Select track" />
                            </SelectTrigger>
                            <SelectContent>
                                {TRACK_OPTIONS.map(t => (
                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function BulkAddFellowsPage() {
    const router  = useRouter();
    const fileRef = useRef(null);

    const [rows, setRows]               = useState([BLANK_ROW(), BLANK_ROW(), BLANK_ROW()]);
    const [sendEmails, setSend]         = useState(true);
    const [loading, setLoading]         = useState(false);
    const [results, setResults]         = useState(null);
    const [categories, setCats]         = useState([]);
    const [step, setStep]               = useState(1);
    const [hasDraft, setHasDraft]       = useState(false);
    const [draftCount, setDraftCount]   = useState(0);
    // 'cards' | 'table' — view mode for step 2
    const [viewMode, setViewMode]       = useState('cards');
    // File upload preview state
    const [previewData, setPreviewData] = useState(null); // { rows: [], fileName: '' }
    // Single category applied to all fellows at submit time
    const [bulkCategory, setBulkCategory] = useState('__none__');

    // Load categories
    useEffect(() => {
        categoryService.getAllCategories()
            .then(d => setCats(Array.isArray(d) ? d : []))
            .catch(() => {});
    }, []);

    // Check for existing draft on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(DRAFT_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    const nonEmpty = parsed.filter(r => r.email || r.fullName);
                    if (nonEmpty.length > 0) {
                        setHasDraft(true);
                        setDraftCount(nonEmpty.length);
                    }
                }
            }
        } catch {}
    }, []);

    const saveDraft = useCallback(() => {
        const nonEmpty = rows.filter(r => r.email || r.fullName?.trim());
        if (nonEmpty.length === 0) return toast.error('Nothing to save — add at least one fellow first');
        try {
            localStorage.setItem(DRAFT_KEY, JSON.stringify(rows));
            setHasDraft(true);
            setDraftCount(nonEmpty.length);
            toast.success(`Draft saved — ${nonEmpty.length} fellow${nonEmpty.length !== 1 ? 's' : ''} stored`);
        } catch {
            toast.error('Failed to save draft');
        }
    }, [rows]);

    const restoreDraft = () => {
        try {
            const saved = localStorage.getItem(DRAFT_KEY);
            if (!saved) return;
            const parsed = JSON.parse(saved);
            // Regenerate ids to avoid key collisions
            setRows(parsed.map(r => ({ ...r, id: Date.now() + Math.random() })));
            setStep(2);
            toast.success('Draft restored!');
        } catch {
            toast.error('Failed to restore draft');
        }
    };

    const clearDraft = () => {
        localStorage.removeItem(DRAFT_KEY);
        setHasDraft(false);
        setDraftCount(0);
    };

    const updateRow = (idx, field, val) =>
        setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));
    const addRow    = () => setRows(prev => [...prev, BLANK_ROW()]);
    const removeRow = (idx) => setRows(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);
    const clearAll  = () => { setRows([BLANK_ROW(), BLANK_ROW(), BLANK_ROW()]); setResults(null); setStep(1); };

    const validRows   = rows.filter(r => r.email?.trim() && isValidEmail(r.email));
    const invalidRows = rows.filter(r => r.email?.trim() && !isValidEmail(r.email));
    const emptyRows   = rows.filter(r => !r.email?.trim() && !r.fullName?.trim());

    // ── CSV import ───────────────────────────────────────────────────────────
    const parseCSVText = (text) => {
        const lines   = text.split('\n').filter(l => l.trim());
        if (lines.length < 2) { toast.error('File needs a header row + data rows'); return []; }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '').replace(/['"]/g, ''));
        const colIdx  = (names) => names.map(n => headers.indexOf(n)).find(i => i >= 0) ?? -1;

        const fullNameIdx = colIdx(['fullname','full_name','name']);
        const fNameIdx    = colIdx(['firstname','first_name']);
        const lNameIdx    = colIdx(['lastname','last_name']);
        const emailIdx    = colIdx(['email']);
        const genderIdx   = colIdx(['gender']);
        const cntryIdx    = colIdx(['country']);
        const regionIdx   = colIdx(['region']);
        const trackIdx    = colIdx(['track']);
        const phoneIdx    = colIdx(['phone','phonenumber','phone_number','phoneno']);

        if (emailIdx < 0) { toast.error('File must have an "email" column'); return []; }

        return lines.slice(1).map(line => {
            const cols = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
            const fn = fNameIdx >= 0 ? cols[fNameIdx] : '';
            const ln = lNameIdx >= 0 ? cols[lNameIdx] : '';
            const resolvedFullName = fullNameIdx >= 0 ? cols[fullNameIdx] : [fn, ln].filter(Boolean).join(' ');
            return {
                id: Date.now() + Math.random(),
                fullName:    resolvedFullName,
                email:       emailIdx  >= 0 ? cols[emailIdx]  : '',
                gender:      genderIdx >= 0 ? cols[genderIdx] : '',
                country:     cntryIdx  >= 0 ? cols[cntryIdx]  : '',
                region:      regionIdx >= 0 ? cols[regionIdx] : '',
                track:       trackIdx  >= 0 ? cols[trackIdx]  : '',
                category: '',
                phoneNumber: phoneIdx  >= 0 ? cols[phoneIdx]  : '',
            };
        }).filter(r => r.email);
    };

    // ── XLSX import ──────────────────────────────────────────────────────────
    const parseXLSX = async (file) => {
        const XLSX = await import('xlsx');
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const wb = XLSX.read(new Uint8Array(ev.target.result), { type: 'array' });
                    const ws = wb.Sheets[wb.SheetNames[0]];
                    const raw = XLSX.utils.sheet_to_json(ws, { header: 1 });
                    if (raw.length < 2) { toast.error('File needs a header row + data rows'); resolve([]); return; }

                    const headers = raw[0].map(h => String(h || '').trim().toLowerCase().replace(/\s+/g, '').replace(/['"]/g, ''));
                    const colIdx  = (names) => names.map(n => headers.indexOf(n)).find(i => i >= 0) ?? -1;

                    const fullNameIdx = colIdx(['fullname','full_name','name']);
                    const fNameIdx    = colIdx(['firstname','first_name']);
                    const lNameIdx    = colIdx(['lastname','last_name']);
                    const emailIdx    = colIdx(['email']);
                    const genderIdx   = colIdx(['gender']);
                    const cntryIdx    = colIdx(['country']);
                    const regionIdx   = colIdx(['region']);
                    const trackIdx    = colIdx(['track']);
                    const phoneIdx    = colIdx(['phone','phonenumber','phone_number','phoneno']);

                    if (emailIdx < 0) { toast.error('File must have an "email" column'); resolve([]); return; }

                    const parsed = raw.slice(1).map(row => {
                        const fn = fNameIdx >= 0 ? String(row[fNameIdx] || '') : '';
                        const ln = lNameIdx >= 0 ? String(row[lNameIdx] || '') : '';
                        const resolvedFullName = fullNameIdx >= 0
                            ? String(row[fullNameIdx] || '')
                            : [fn, ln].filter(Boolean).join(' ');
                        return {
                            id: Date.now() + Math.random(),
                            fullName:    resolvedFullName,
                            email:       emailIdx  >= 0 ? String(row[emailIdx]  || '') : '',
                            gender:      genderIdx >= 0 ? String(row[genderIdx] || '') : '',
                            country:     cntryIdx  >= 0 ? String(row[cntryIdx]  || '') : '',
                            region:      regionIdx >= 0 ? String(row[regionIdx] || '') : '',
                            track:       trackIdx  >= 0 ? String(row[trackIdx]  || '') : '',
                            category: '',
                            phoneNumber: phoneIdx  >= 0 ? String(row[phoneIdx]  || '') : '',
                        };
                    }).filter(r => r.email);

                    resolve(parsed);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    };

    // ── File upload handler (CSV + XLSX) ─────────────────────────────────────
    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';

        const isXLSX = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
        const isCSV  = file.name.endsWith('.csv');

        if (!isXLSX && !isCSV) {
            toast.error('Please upload a .csv or .xlsx file');
            return;
        }

        try {
            let parsed = [];
            if (isCSV) {
                const text = await file.text();
                parsed = parseCSVText(text);
            } else {
                parsed = await parseXLSX(file);
            }

            if (!parsed.length) return;

            // Show preview modal instead of adding directly
            setPreviewData({ rows: parsed, fileName: file.name });
        } catch {
            toast.error('Failed to parse file. Please check the format.');
        }
    };

    // ── Paste handler ────────────────────────────────────────────────────────
    const handlePaste = (e) => {
        const text  = e.clipboardData.getData('text');
        const lines = text.trim().split('\n').filter(l => l.trim());
        if (!lines.length) return;
        const parsed = lines.map(line => {
            const cols = line.split('\t').map(s => s.trim());
            return {
                id: Date.now() + Math.random(),
                fullName: cols[0] || '', email: cols[1] || '',
                gender: cols[2] || '', country: cols[3] || '', region: cols[4] || '',
                track: cols[5] || '', category: '', phoneNumber: cols[6] || '',
            };
        });
        setRows(prev => [...prev.filter(r => r.email || r.fullName?.trim()), ...parsed]);
        setStep(2);
        toast.success(`Pasted ${parsed.length} row${parsed.length !== 1 ? 's' : ''}`);
    };

    // ── Download template ────────────────────────────────────────────────────
    const downloadTemplate = () => {
        const csv = 'fullName,email,gender,country,region,track,phoneNumber\nAmara Diallo,amara@example.com,Female,Kenya,East Africa,AI & Machine Learning,+254700000000\nKofi Mensah,kofi@example.com,Male,Ghana,West Africa,Data Science,+233200000000';
        const a   = Object.assign(document.createElement('a'), {
            href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
            download: 'fellows-template.csv',
        });
        a.click();
    };

    // ── Submit ───────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!validRows.length) return toast.error('No valid rows to create');
        setLoading(true);
        setResults(null);
        try {
            const categoryForAll = (bulkCategory && bulkCategory !== '__none__') ? bulkCategory : undefined;
            const res = await adminService.bulkCreateFellows(validRows.map(r => ({
                fullName:    r.fullName,
                email:       r.email,
                gender:      r.gender      || undefined,
                country:     r.country     || undefined,
                region:      r.region      || undefined,
                track:       r.track       || undefined,
                category:    categoryForAll,
                phoneNumber: r.phoneNumber || undefined,
            })), sendEmails);
            setResults(res);
            setStep(4);
            clearDraft();
            toast.success(res.message);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Bulk creation failed');
        } finally {
            setLoading(false);
        }
    };

    // ── Preview modal actions ────────────────────────────────────────────────
    const acceptPreview = () => {
        if (!previewData) return;
        setRows(prev => {
            const nonEmpty = prev.filter(r => r.email || r.fullName?.trim());
            return nonEmpty.length ? [...nonEmpty, ...previewData.rows] : previewData.rows;
        });
        setPreviewData(null);
        setStep(2);
        toast.success(`Added ${previewData.rows.length} row${previewData.rows.length !== 1 ? 's' : ''} to editor`);
    };

    const saveDraftFromPreview = () => {
        if (!previewData) return;
        try {
            localStorage.setItem(DRAFT_KEY, JSON.stringify(previewData.rows));
            const nonEmpty = previewData.rows.filter(r => r.email || r.fullName?.trim());
            setHasDraft(true);
            setDraftCount(nonEmpty.length);
            setPreviewData(null);
            toast.success(`Draft saved — ${nonEmpty.length} fellow${nonEmpty.length !== 1 ? 's' : ''} stored`);
        } catch {
            toast.error('Failed to save draft');
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gray-50">
            <Toaster position="top-right" />

            {/* ── File Upload Preview Modal ─────────────────────────────── */}
            {previewData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center">
                                    <Icons.FileSpreadsheet className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-gray-900">File Preview</h2>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {previewData.fileName} · {previewData.rows.length} row{previewData.rows.length !== 1 ? 's' : ''} found
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setPreviewData(null)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                                <Icons.X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Summary badges */}
                        <div className="px-6 py-3 border-b bg-gray-50/50 flex items-center gap-4 flex-wrap">
                            {(() => {
                                const valid   = previewData.rows.filter(r => r.email && isValidEmail(r.email)).length;
                                const invalid = previewData.rows.filter(r => r.email && !isValidEmail(r.email)).length;
                                const noEmail = previewData.rows.filter(r => !r.email).length;
                                return (
                                    <>
                                        <span className="flex items-center gap-1.5 text-sm">
                                            <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                                            <strong className="text-green-700">{valid}</strong>
                                            <span className="text-gray-600">valid</span>
                                        </span>
                                        {invalid > 0 && (
                                            <span className="flex items-center gap-1.5 text-sm">
                                                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                                                <strong className="text-amber-700">{invalid}</strong>
                                                <span className="text-gray-600">invalid email</span>
                                            </span>
                                        )}
                                        {noEmail > 0 && (
                                            <span className="flex items-center gap-1.5 text-sm">
                                                <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
                                                <strong className="text-red-600">{noEmail}</strong>
                                                <span className="text-gray-600">missing email</span>
                                            </span>
                                        )}
                                    </>
                                );
                            })()}
                            <span className="ml-auto text-xs text-gray-400 italic">Review the data below before adding to the editor</span>
                        </div>

                        {/* Table */}
                        <div className="overflow-auto flex-1">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-gray-50 border-b z-10">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 w-10">#</th>
                                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500">Full Name</th>
                                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500">Email</th>
                                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500">Gender</th>
                                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500">Country</th>
                                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500">Region</th>
                                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500">Track</th>
                                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500">Phone</th>
                                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 w-20">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {previewData.rows.map((row, i) => {
                                        const valid   = row.email && isValidEmail(row.email);
                                        const invalid = row.email && !isValidEmail(row.email);
                                        const noEmail = !row.email;
                                        return (
                                            <tr key={i} className={`${invalid ? 'bg-amber-50/40' : noEmail ? 'bg-red-50/30' : 'hover:bg-gray-50'}`}>
                                                <td className="px-4 py-2.5 text-xs text-gray-400 font-mono">{i + 1}</td>
                                                <td className="px-3 py-2.5 font-medium text-gray-800">{row.fullName || <span className="text-gray-300 italic">—</span>}</td>
                                                <td className="px-3 py-2.5">
                                                    {row.email ? (
                                                        <span className={valid ? 'text-gray-700' : 'text-amber-700 font-medium'}>
                                                            {row.email}
                                                        </span>
                                                    ) : (
                                                        <span className="text-red-500 italic text-xs">Missing</span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2.5 text-gray-600">{row.gender || '—'}</td>
                                                <td className="px-3 py-2.5 text-gray-600">{row.country || '—'}</td>
                                                <td className="px-3 py-2.5 text-gray-600">{row.region || '—'}</td>
                                                <td className="px-3 py-2.5 text-gray-600 text-xs">{row.track || '—'}</td>
                                                <td className="px-3 py-2.5 text-gray-600">{row.phoneNumber || '—'}</td>
                                                <td className="px-3 py-2.5">
                                                    {valid && <span className="inline-flex items-center gap-1 text-xs text-green-700 font-medium"><Icons.CheckCircle className="w-3.5 h-3.5" /> Valid</span>}
                                                    {invalid && <span className="inline-flex items-center gap-1 text-xs text-amber-700 font-medium"><Icons.AlertCircle className="w-3.5 h-3.5" /> Bad email</span>}
                                                    {noEmail && <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium"><Icons.XCircle className="w-3.5 h-3.5" /> No email</span>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer actions */}
                        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between gap-4 flex-wrap">
                            <p className="text-sm text-gray-500">
                                You can edit any details after adding to the editor.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setPreviewData(null)}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveDraftFromPreview}
                                    className="px-4 py-2 text-sm font-medium text-amber-700 border border-amber-300 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors flex items-center gap-1.5"
                                >
                                    <Icons.Save className="w-4 h-4" /> Save as Draft
                                </button>
                                <button
                                    onClick={acceptPreview}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5"
                                >
                                    <Icons.PenLine className="w-4 h-4" /> Add to Editor
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Top bar ──────────────────────────────────────────────────── */}
            <div className="bg-white border-b px-6 py-4 sticky top-0 z-20">
                <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" onClick={() => router.push('/admin/fellows')} className="gap-1.5 text-gray-600">
                            <Icons.ArrowLeft className="w-4 h-4" /> Back
                        </Button>
                        <Separator orientation="vertical" className="h-6" />
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">Bulk Add Fellows</h1>
                            <p className="text-xs text-gray-500">Import multiple fellows via CSV, Excel, or manual entry</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        {step === 2 && !results && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={saveDraft}
                                className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50"
                            >
                                <Icons.Save className="w-3.5 h-3.5" /> Save Draft
                            </Button>
                        )}
                        <Steps current={step} />
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

                {/* ── Draft restore banner ─────────────────────────────────── */}
                {hasDraft && step === 1 && (
                    <Alert className="border-amber-200 bg-amber-50">
                        <Icons.Clock className="w-4 h-4 text-amber-600" />
                        <AlertDescription className="text-amber-800 text-sm flex items-center justify-between flex-wrap gap-3">
                            <span>
                                You have an unsaved draft with <strong>{draftCount} fellow{draftCount !== 1 ? 's' : ''}</strong>. Continue where you left off?
                            </span>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => { clearDraft(); setHasDraft(false); }}
                                    className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-100">
                                    Discard
                                </Button>
                                <Button size="sm" onClick={restoreDraft}
                                    className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white gap-1">
                                    <Icons.RotateCcw className="w-3 h-3" /> Restore Draft
                                </Button>
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                {/* ── Step 1: Import options ─────────────────────────────── */}
                {step === 1 && (
                    <div className="space-y-6">
                        <div className="grid sm:grid-cols-3 gap-4">
                            {/* CSV / XLSX upload */}
                            <Card
                                className="border-2 border-dashed border-gray-200 hover:border-green-300 hover:bg-green-50/30 transition-colors cursor-pointer group"
                                onClick={() => fileRef.current?.click()}
                            >
                                <CardContent className="pt-8 pb-8 flex flex-col items-center gap-3 text-center">
                                    <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                                        <Icons.FileSpreadsheet className="w-7 h-7 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">Upload File</p>
                                        <p className="text-sm text-gray-500 mt-1">Import a .csv or .xlsx file from Excel, Google Sheets, or any spreadsheet app</p>
                                    </div>
                                    <div className="flex gap-1.5">
                                        <Badge variant="outline" className="text-xs bg-green-50 border-green-200 text-green-700">.csv</Badge>
                                        <Badge variant="outline" className="text-xs bg-green-50 border-green-200 text-green-700">.xlsx</Badge>
                                    </div>
                                </CardContent>
                            </Card>
                            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileUpload} />

                            {/* Paste from spreadsheet */}
                            <Card
                                className="border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 transition-colors cursor-pointer group"
                                onClick={() => setStep(2)}
                            >
                                <CardContent className="pt-8 pb-8 flex flex-col items-center gap-3 text-center">
                                    <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                        <Icons.ClipboardPaste className="w-7 h-7 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">Paste from Spreadsheet</p>
                                        <p className="text-sm text-gray-500 mt-1">Copy rows from Excel or Google Sheets and paste directly into the editor</p>
                                    </div>
                                    <Badge variant="outline" className="text-xs">Open editor</Badge>
                                </CardContent>
                            </Card>

                            {/* Manual entry */}
                            <Card
                                className="border-2 border-dashed border-gray-200 hover:border-purple-300 hover:bg-purple-50/30 transition-colors cursor-pointer group"
                                onClick={() => setStep(2)}
                            >
                                <CardContent className="pt-8 pb-8 flex flex-col items-center gap-3 text-center">
                                    <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                                        <Icons.PenLine className="w-7 h-7 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">Manual Entry</p>
                                        <p className="text-sm text-gray-500 mt-1">Fill in each fellow's details directly in the form editor</p>
                                    </div>
                                    <Badge variant="outline" className="text-xs">Open editor</Badge>
                                </CardContent>
                            </Card>
                        </div>

                        <Alert className="border-amber-100 bg-amber-50">
                            <Icons.Info className="w-4 h-4 text-amber-600 shrink-0" />
                            <AlertDescription className="text-amber-700 text-sm flex items-center gap-3 flex-wrap">
                                <span>Need a template? Download the CSV sample with the correct column headers.</span>
                                <Button variant="outline" size="sm" onClick={downloadTemplate}
                                    className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-100 h-7 shrink-0">
                                    <Icons.Download className="w-3.5 h-3.5" /> Download CSV Template
                                </Button>
                            </AlertDescription>
                        </Alert>
                    </div>
                )}

                {/* ── Step 2: Review & Edit ──────────────────────────────── */}
                {step === 2 && !results && (
                    <>
                        {/* Toolbar */}
                        <div className="flex items-center gap-3 flex-wrap">
                            {/* Stats */}
                            <div className="flex items-center gap-4 text-sm">
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                                    <strong className="text-green-700">{validRows.length}</strong>
                                    <span className="text-gray-600">valid</span>
                                </span>
                                {invalidRows.length > 0 && (
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                                        <strong className="text-amber-700">{invalidRows.length}</strong>
                                        <span className="text-gray-600">invalid</span>
                                    </span>
                                )}
                                {emptyRows.length > 0 && (
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block" />
                                        <strong className="text-gray-500">{emptyRows.length}</strong>
                                        <span className="text-gray-400">empty</span>
                                    </span>
                                )}
                            </div>

                            <div className="ml-auto flex items-center gap-2">
                                {/* View toggle */}
                                <div className="flex items-center border rounded-lg overflow-hidden">
                                    <button
                                        onClick={() => setViewMode('cards')}
                                        className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors ${
                                            viewMode === 'cards' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                                        }`}
                                    >
                                        <Icons.LayoutGrid className="w-3.5 h-3.5" /> Cards
                                    </button>
                                    <button
                                        onClick={() => setViewMode('table')}
                                        className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors ${
                                            viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                                        }`}
                                    >
                                        <Icons.Table className="w-3.5 h-3.5" /> Table
                                    </button>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="gap-1.5">
                                    <Icons.Upload className="w-3.5 h-3.5" /> Import File
                                </Button>
                                <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-1.5">
                                    <Icons.Download className="w-3.5 h-3.5" /> Template
                                </Button>
                                {rows.some(r => r.email || r.fullName) && (
                                    <Button variant="ghost" size="sm" onClick={clearAll} className="gap-1.5 text-red-400 hover:text-red-600 hover:bg-red-50">
                                        <Icons.Trash2 className="w-3.5 h-3.5" /> Clear All
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Paste tip (only in table mode) */}
                        {viewMode === 'table' && (
                            <Alert className="border-blue-100 bg-blue-50 py-2.5">
                                <Icons.Info className="w-4 h-4 text-blue-500 shrink-0" />
                                <AlertDescription className="text-blue-700 text-xs">
                                    <strong>Paste tip:</strong> Click inside the table and press{' '}
                                    <kbd className="px-1 py-0.5 bg-white border rounded text-xs">Ctrl+V</kbd> to paste rows from Excel or Google Sheets
                                    (columns: First Name, Last Name, Email, Gender, Country, Region, Track, Phone).
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* ── CARDS VIEW ── */}
                        {viewMode === 'cards' && (
                            <div className="space-y-4">
                                {rows.map((row, idx) => (
                                    <FellowCard
                                        key={row.id}
                                        row={row}
                                        idx={idx}
                                        categories={categories}
                                        onUpdate={(field, val) => updateRow(idx, field, val)}
                                        onRemove={() => removeRow(idx)}
                                    />
                                ))}
                                <button
                                    type="button"
                                    onClick={addRow}
                                    className="w-full border-2 border-dashed border-gray-200 rounded-xl py-5 flex items-center justify-center gap-2 text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/30 transition-colors"
                                >
                                    <Icons.Plus className="w-4 h-4" /> Add Another Fellow
                                </button>
                            </div>
                        )}

                        {/* ── TABLE VIEW ── */}
                        {viewMode === 'table' && (
                            <Card className="shadow-sm">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-base">Fellow Details</CardTitle>
                                            <CardDescription>
                                                {rows.length} row{rows.length !== 1 ? 's' : ''} · {validRows.length} ready to create
                                            </CardDescription>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={addRow} className="gap-1.5">
                                            <Icons.Plus className="w-3.5 h-3.5" /> Add Row
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto" onPaste={handlePaste}>
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-gray-50 border-b border-t">
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 w-12">#</th>
                                                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 min-w-[200px]">Full Name</th>
                                                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 min-w-[210px]">
                                                        Email <span className="text-red-500">*</span>
                                                    </th>
                                                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 min-w-[150px]">Phone</th>
                                                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 min-w-[140px]">Gender</th>
                                                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 min-w-[150px]">Country</th>
                                                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 min-w-[150px]">Region</th>
                                                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 min-w-[190px]">Track</th>
                                                    <th className="px-3 py-3 w-10" />
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {rows.map((row, idx) => (
                                                    <tr
                                                        key={row.id}
                                                        className={`group transition-colors ${
                                                            !row.email && !row.fullName
                                                                ? 'bg-gray-50/40'
                                                                : row.email && !isValidEmail(row.email)
                                                                    ? 'bg-amber-50/40'
                                                                    : row.email
                                                                        ? 'bg-white hover:bg-green-50/20'
                                                                        : 'bg-white'
                                                        }`}
                                                    >
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs text-gray-400 font-mono w-4">{idx + 1}</span>
                                                                <RowStatus row={row} />
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-2.5">
                                                            <Input value={row.fullName} onChange={e => updateRow(idx, 'fullName', e.target.value)} placeholder="Full name" className="h-10 text-sm" />
                                                        </td>
                                                        <td className="px-3 py-2.5">
                                                            <Input
                                                                type="email"
                                                                value={row.email}
                                                                onChange={e => updateRow(idx, 'email', e.target.value)}
                                                                placeholder="email@example.com"
                                                                className={`h-10 text-sm ${row.email && !isValidEmail(row.email) ? 'border-amber-400 ring-1 ring-amber-200' : ''}`}
                                                            />
                                                            {row.email && !isValidEmail(row.email) && (
                                                                <p className="text-xs text-red-500 mt-0.5">Invalid email</p>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2.5">
                                                            <Input value={row.phoneNumber} onChange={e => updateRow(idx, 'phoneNumber', e.target.value)} placeholder="+254 700…" className="h-10 text-sm" />
                                                        </td>
                                                        <td className="px-3 py-2.5">
                                                            <Select value={row.gender} onValueChange={v => updateRow(idx, 'gender', v)}>
                                                                <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Gender" /></SelectTrigger>
                                                                <SelectContent>
                                                                    {GENDER_OPTIONS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                                                                </SelectContent>
                                                            </Select>
                                                        </td>
                                                        <td className="px-3 py-2.5">
                                                            <Input value={row.country} onChange={e => updateRow(idx, 'country', e.target.value)} placeholder="Country" className="h-10 text-sm" />
                                                        </td>
                                                        <td className="px-3 py-2.5">
                                                            <Input value={row.region} onChange={e => updateRow(idx, 'region', e.target.value)} placeholder="Region" className="h-10 text-sm" />
                                                        </td>
                                                        <td className="px-3 py-2.5">
                                                            <Select value={row.track} onValueChange={v => updateRow(idx, 'track', v)}>
                                                                <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Track" /></SelectTrigger>
                                                                <SelectContent>
                                                                    {TRACK_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                                                </SelectContent>
                                                            </Select>
                                                        </td>
                                                        <td className="px-3 py-2.5">
                                                            <Button type="button" variant="ghost" size="icon"
                                                                className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-500"
                                                                onClick={() => removeRow(idx)}>
                                                                <Icons.Trash2 className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="p-4 border-t">
                                        <Button variant="outline" size="sm" onClick={addRow} className="gap-1.5 w-full border-dashed text-gray-500 hover:text-gray-700 h-10">
                                            <Icons.Plus className="w-3.5 h-3.5" /> Add Another Row
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* ── Sticky action bar (step 2) ───────────────────── */}
                        <div className="flex items-center justify-between gap-4 py-4 sticky bottom-0 bg-gray-50/95 backdrop-blur border-t -mx-6 px-6 mt-4">
                            <div className="text-sm text-gray-600">
                                <strong className="text-green-700">{validRows.length}</strong>{' '}
                                fellow{validRows.length !== 1 ? 's' : ''} ready
                                {invalidRows.length > 0 && (
                                    <span className="ml-2 text-amber-600">· {invalidRows.length} invalid</span>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={saveDraft} className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50">
                                    <Icons.Save className="w-4 h-4" /> Save Draft
                                </Button>
                                <Button variant="outline" onClick={() => router.push('/admin/fellows')}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => setStep(3)}
                                    disabled={validRows.length === 0}
                                    className="gap-2 bg-blue-600 hover:bg-blue-700 min-w-[180px]"
                                >
                                    <Icons.FolderOpen className="w-4 h-4" /> Next: Assign Category
                                    <Icons.ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </>
                )}

                {/* ── Step 3: Assign Category ───────────────────────────── */}
                {step === 3 && !results && (
                    <div className="space-y-6 max-w-2xl mx-auto">
                        {/* Summary banner */}
                        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                            <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                <Icons.Users className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-green-800">
                                    {validRows.length} fellow{validRows.length !== 1 ? 's' : ''} ready to be created
                                </p>
                                <p className="text-xs text-green-600 mt-0.5">
                                    Now assign a category to all of them before submitting.
                                </p>
                            </div>
                        </div>

                        {/* Category selector */}
                        <Card className="border-2 border-indigo-200">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                        <Icons.FolderOpen className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base text-indigo-900">Assign Category</CardTitle>
                                        <CardDescription className="text-indigo-600 text-xs">
                                            This category will be applied to all {validRows.length} fellow{validRows.length !== 1 ? 's' : ''}.
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Select value={bulkCategory} onValueChange={setBulkCategory}>
                                    <SelectTrigger className="h-12 text-sm">
                                        <SelectValue placeholder="Select a category (optional — can be set later)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">No category — assign later</SelectItem>
                                        {categories.map(c => (
                                            <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {bulkCategory && bulkCategory !== '__none__' && (
                                    <p className="text-xs text-indigo-700 mt-2 flex items-center gap-1">
                                        <Icons.CheckCircle className="w-3.5 h-3.5" />
                                        <strong>{categories.find(c => c._id === bulkCategory)?.name}</strong> will be assigned to all fellows
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Email option */}
                        <Card className={`border-2 transition-colors ${sendEmails ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'}`}>
                            <CardContent className="pt-5 pb-5">
                                <div className="flex items-start gap-4">
                                    <Checkbox id="sendEmails" checked={sendEmails} onCheckedChange={setSend} className="mt-1" />
                                    <div className="flex-1">
                                        <label htmlFor="sendEmails" className={`text-sm font-semibold cursor-pointer ${sendEmails ? 'text-blue-800' : 'text-gray-700'}`}>
                                            Send invitation emails with temporary passwords
                                        </label>
                                        <p className={`text-sm mt-1 ${sendEmails ? 'text-blue-600' : 'text-gray-500'}`}>
                                            {sendEmails
                                                ? 'Each fellow will receive a welcome email with their temporary password.'
                                                : 'No emails will be sent. Temporary passwords will be shown after creation.'}
                                        </p>
                                    </div>
                                    <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${sendEmails ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                        {sendEmails
                                            ? <Icons.Mail className="w-5 h-5 text-blue-600" />
                                            : <Icons.MailX className="w-5 h-5 text-gray-400" />}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Action buttons */}
                        <div className="flex items-center justify-between gap-4 pt-2">
                            <Button variant="outline" onClick={() => setStep(2)} className="gap-1.5">
                                <Icons.ChevronLeft className="w-4 h-4" /> Back to Review
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={loading || validRows.length === 0}
                                className="gap-2 bg-green-600 hover:bg-green-700 min-w-[220px]"
                            >
                                {loading ? (
                                    <><Icons.Loader2 className="w-4 h-4 animate-spin" /> Creating {validRows.length} fellows…</>
                                ) : (
                                    <><Icons.Users className="w-4 h-4" /> Create {validRows.length} Fellow{validRows.length !== 1 ? 's' : ''}</>
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                {/* ── Step 4: Results ───────────────────────────────────── */}
                {results && (
                    <div className="space-y-6 max-w-2xl mx-auto">
                        <div className="text-center py-6">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${results.failed === 0 ? 'bg-green-100' : 'bg-amber-100'}`}>
                                {results.failed === 0
                                    ? <Icons.CheckCircle className="w-9 h-9 text-green-600" />
                                    : <Icons.AlertCircle className="w-9 h-9 text-amber-600" />}
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">{results.message}</h2>
                            <p className="text-gray-500 text-sm mt-1">
                                {results.created} created · {results.failed} failed · {results.skipped ?? 0} skipped
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <Card className="text-center border-green-200 bg-green-50">
                                <CardContent className="pt-5 pb-4">
                                    <p className="text-3xl font-bold text-green-700">{results.created}</p>
                                    <p className="text-xs text-green-600 mt-1 font-medium">Created</p>
                                </CardContent>
                            </Card>
                            <Card className="text-center border-red-200 bg-red-50">
                                <CardContent className="pt-5 pb-4">
                                    <p className="text-3xl font-bold text-red-600">{results.failed}</p>
                                    <p className="text-xs text-red-500 mt-1 font-medium">Failed</p>
                                </CardContent>
                            </Card>
                            <Card className="text-center border-gray-200">
                                <CardContent className="pt-5 pb-4">
                                    <p className="text-3xl font-bold text-gray-700">{results.skipped ?? 0}</p>
                                    <p className="text-xs text-gray-500 mt-1 font-medium">Skipped</p>
                                </CardContent>
                            </Card>
                        </div>

                        {results.errors?.length > 0 && (
                            <Card className="border-red-200 bg-red-50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm text-red-700">Errors</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-1">
                                    {results.errors.map((e, i) => (
                                        <p key={i} className="text-xs text-red-600 flex items-center gap-2">
                                            <Icons.XCircle className="w-3.5 h-3.5 shrink-0" />
                                            <strong>{e.email}</strong>: {e.error}
                                        </p>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {!sendEmails && results.fellows?.some(f => f.temporaryPassword) && (
                            <Card className="border-amber-200 bg-amber-50">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center gap-2">
                                        <Icons.KeyRound className="w-4 h-4 text-amber-600" />
                                        <CardTitle className="text-sm text-amber-800">Temporary Passwords</CardTitle>
                                    </div>
                                    <CardDescription className="text-amber-600 text-xs">
                                        Share these with each fellow — they must change their password on first login.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="rounded-lg border border-amber-200 bg-white divide-y divide-amber-100 max-h-64 overflow-y-auto">
                                        {results.fellows.filter(f => f.temporaryPassword).map((f, i) => (
                                            <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-800 truncate">{f.email}</p>
                                                </div>
                                                <code className="text-sm font-mono font-bold text-gray-900 tracking-wide bg-gray-100 px-2 py-1 rounded">
                                                    {f.temporaryPassword}
                                                </code>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <div className="flex gap-3 justify-center">
                            <Button variant="outline" onClick={clearAll} className="gap-2">
                                <Icons.Plus className="w-4 h-4" /> Add More Fellows
                            </Button>
                            <Button onClick={() => router.push('/admin/fellows')} className="gap-2 bg-green-600 hover:bg-green-700">
                                <Icons.Users className="w-4 h-4" /> View All Fellows
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
