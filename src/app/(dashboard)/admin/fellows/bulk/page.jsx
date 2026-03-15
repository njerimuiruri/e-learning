'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import adminService from '@/lib/api/adminService';
import categoryService from '@/lib/api/categoryService';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
const TRACK_OPTIONS  = ['AI & Machine Learning', 'Data Science', 'Climate Tech', 'Agri-Tech', 'Health Tech', 'FinTech', 'EdTech', 'Other'];

const BLANK_ROW = () => ({
    id: Date.now() + Math.random(),
    firstName: '', lastName: '', email: '', gender: '',
    country: '', region: '', track: '', category: '', phoneNumber: '',
});

const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

// ── Step indicator ────────────────────────────────────────────────
function Steps({ current }) {
    const steps = [
        { n: 1, label: 'Import Data',   icon: Icons.Upload },
        { n: 2, label: 'Review & Edit', icon: Icons.TableProperties },
        { n: 3, label: 'Create Fellows',icon: Icons.UserCheck },
    ];
    return (
        <div className="flex items-center gap-0">
            {steps.map((s, i) => {
                const Icon = s.icon;
                const done    = current > s.n;
                const active  = current === s.n;
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

// ── Inline cell editor ────────────────────────────────────────────
function Cell({ type = 'text', value, onChange, placeholder, error, options, wide }) {
    if (type === 'select') {
        return (
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className={`h-9 text-sm bg-white ${error ? 'border-red-300' : ''} ${wide ? 'min-w-[140px]' : 'min-w-[120px]'}`}>
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {options?.map(o => (
                        <SelectItem key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        );
    }
    return (
        <Input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className={`h-9 text-sm bg-white ${error ? 'border-red-300 ring-1 ring-red-200' : ''} ${wide ? 'min-w-[180px]' : 'min-w-[120px]'}`}
        />
    );
}

// ── Row status dot ────────────────────────────────────────────────
function RowStatus({ row }) {
    if (!row.firstName && !row.lastName && !row.email) {
        return <span className="w-2 h-2 rounded-full bg-gray-200 inline-block" title="Empty" />;
    }
    if (!row.email) {
        return <span className="w-2 h-2 rounded-full bg-red-400 inline-block" title="Email required" />;
    }
    if (!isValidEmail(row.email)) {
        return <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" title="Invalid email" />;
    }
    return <span className="w-2 h-2 rounded-full bg-green-500 inline-block" title="Valid" />;
}

// ── Main page ─────────────────────────────────────────────────────
export default function BulkAddFellowsPage() {
    const router  = useRouter();
    const fileRef = useRef(null);

    const [rows, setRows]       = useState([BLANK_ROW(), BLANK_ROW(), BLANK_ROW()]);
    const [sendEmails, setSend] = useState(true);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [categories, setCats] = useState([]);
    const [step, setStep]       = useState(1);

    useEffect(() => {
        categoryService.getAllCategories()
            .then(d => setCats(Array.isArray(d) ? d : []))
            .catch(() => {});
    }, []);

    const updateRow = (idx, field, val) =>
        setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));
    const addRow    = () => setRows(prev => [...prev, BLANK_ROW()]);
    const removeRow = (idx) => setRows(prev => prev.filter((_, i) => i !== idx));
    const clearAll  = () => { setRows([BLANK_ROW(), BLANK_ROW(), BLANK_ROW()]); setResults(null); setStep(1); };

    const validRows   = rows.filter(r => r.email?.trim() && isValidEmail(r.email));
    const invalidRows = rows.filter(r => r.email?.trim() && !isValidEmail(r.email));
    const emptyRows   = rows.filter(r => !r.email?.trim() && !r.firstName && !r.lastName);

    // ── CSV import ────────────────────────────────────────────────
    const handleCSV = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const lines   = ev.target.result.split('\n').filter(l => l.trim());
            if (lines.length < 2) return toast.error('CSV needs a header row + data rows');

            const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, ''));
            const colIdx  = (names) => names.map(n => headers.indexOf(n)).find(i => i >= 0) ?? -1;

            const fNameIdx  = colIdx(['firstname','first_name','first name']);
            const lNameIdx  = colIdx(['lastname','last_name','last name']);
            const emailIdx  = colIdx(['email']);
            const genderIdx = colIdx(['gender']);
            const cntryIdx  = colIdx(['country']);
            const regionIdx = colIdx(['region']);
            const trackIdx  = colIdx(['track']);
            const phoneIdx  = colIdx(['phone','phonenumber','phone_number']);

            if (emailIdx < 0) return toast.error('CSV needs an "email" column');

            const parsed = lines.slice(1).map(line => {
                const cols = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
                return {
                    id: Date.now() + Math.random(),
                    firstName:   fNameIdx  >= 0 ? cols[fNameIdx]  : '',
                    lastName:    lNameIdx  >= 0 ? cols[lNameIdx]  : '',
                    email:       emailIdx  >= 0 ? cols[emailIdx]  : '',
                    gender:      genderIdx >= 0 ? cols[genderIdx] : '',
                    country:     cntryIdx  >= 0 ? cols[cntryIdx]  : '',
                    region:      regionIdx >= 0 ? cols[regionIdx] : '',
                    track:       trackIdx  >= 0 ? cols[trackIdx]  : '',
                    category: '',
                    phoneNumber: phoneIdx  >= 0 ? cols[phoneIdx]  : '',
                };
            }).filter(r => r.email);

            setRows(prev => {
                const nonEmpty = prev.filter(r => r.email || r.firstName || r.lastName);
                return [...nonEmpty, ...parsed];
            });
            setStep(2);
            toast.success(`Imported ${parsed.length} row${parsed.length !== 1 ? 's' : ''}`);
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    // ── Paste handler ─────────────────────────────────────────────
    const handlePaste = (e) => {
        const text  = e.clipboardData.getData('text');
        const lines = text.trim().split('\n').filter(l => l.trim());
        if (!lines.length) return;
        const parsed = lines.map(line => {
            const cols = line.split('\t').map(s => s.trim());
            return {
                id: Date.now() + Math.random(),
                firstName: cols[0] || '', lastName: cols[1] || '', email: cols[2] || '',
                gender: cols[3] || '', country: cols[4] || '', region: cols[5] || '',
                track: cols[6] || '', category: '', phoneNumber: cols[7] || '',
            };
        });
        setRows(prev => [...prev.filter(r => r.email || r.firstName || r.lastName), ...parsed]);
        setStep(2);
        toast.success(`Pasted ${parsed.length} row${parsed.length !== 1 ? 's' : ''}`);
    };

    // ── Download template ─────────────────────────────────────────
    const downloadTemplate = () => {
        const csv = 'firstName,lastName,email,gender,country,region,track,phoneNumber\nAmara,Diallo,amara@example.com,Female,Kenya,East Africa,AI & Machine Learning,+254700000000';
        const a   = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: 'fellows-template.csv' });
        a.click();
    };

    // ── Submit ────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!validRows.length) return toast.error('No valid rows to create');
        setLoading(true);
        setResults(null);
        try {
            const res = await adminService.bulkCreateFellows(validRows.map(r => ({
                firstName:   r.firstName   || undefined,
                lastName:    r.lastName    || undefined,
                email:       r.email,
                gender:      r.gender      || undefined,
                country:     r.country     || undefined,
                region:      r.region      || undefined,
                track:       r.track       || undefined,
                category:    (r.category && r.category !== '__none__') ? r.category : undefined,
                phoneNumber: r.phoneNumber || undefined,
            })), sendEmails);
            setResults(res);
            setStep(3);
            toast.success(res.message);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Bulk creation failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Toaster position="top-right" />

            {/* ── Top bar ─────────────────────────────────────────── */}
            <div className="bg-white border-b px-6 py-4 sticky top-0 z-20">
                <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" onClick={() => router.push('/admin/fellows')} className="gap-1.5 text-gray-600">
                            <Icons.ArrowLeft className="w-4 h-4" /> Back to Fellows
                        </Button>
                        <Separator orientation="vertical" className="h-6" />
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">Bulk Add Fellows</h1>
                            <p className="text-xs text-gray-500">Import multiple fellows at once via CSV or manual entry</p>
                        </div>
                    </div>
                    <Steps current={step} />
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">

                {/* ── Step 1: Import options ───────────────────────── */}
                {step === 1 && (
                    <div className="grid md:grid-cols-3 gap-4">
                        {/* CSV upload */}
                        <Card className="border-2 border-dashed border-gray-200 hover:border-green-300 hover:bg-green-50/30 transition-colors cursor-pointer group"
                            onClick={() => fileRef.current?.click()}>
                            <CardContent className="pt-8 pb-8 flex flex-col items-center gap-3 text-center">
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                                    <Icons.FileSpreadsheet className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800">Upload CSV</p>
                                    <p className="text-sm text-gray-500 mt-1">Import a .csv file exported from Excel, Google Sheets, or any spreadsheet app</p>
                                </div>
                                <Badge variant="outline" className="text-xs mt-1">Click to browse</Badge>
                            </CardContent>
                        </Card>
                        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSV} />

                        {/* Paste from spreadsheet */}
                        <Card className="border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 transition-colors cursor-pointer group"
                            onClick={() => setStep(2)}>
                            <CardContent className="pt-8 pb-8 flex flex-col items-center gap-3 text-center">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                    <Icons.ClipboardPaste className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800">Paste from Spreadsheet</p>
                                    <p className="text-sm text-gray-500 mt-1">Copy rows from Excel or Google Sheets and paste directly into the table</p>
                                </div>
                                <Badge variant="outline" className="text-xs mt-1">Go to table</Badge>
                            </CardContent>
                        </Card>

                        {/* Manual entry */}
                        <Card className="border-2 border-dashed border-gray-200 hover:border-purple-300 hover:bg-purple-50/30 transition-colors cursor-pointer group"
                            onClick={() => setStep(2)}>
                            <CardContent className="pt-8 pb-8 flex flex-col items-center gap-3 text-center">
                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                                    <Icons.PenLine className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800">Manual Entry</p>
                                    <p className="text-sm text-gray-500 mt-1">Type each fellow's details row by row in the interactive table</p>
                                </div>
                                <Badge variant="outline" className="text-xs mt-1">Open table</Badge>
                            </CardContent>
                        </Card>

                        {/* Template download hint */}
                        <div className="md:col-span-3">
                            <Alert className="border-amber-100 bg-amber-50">
                                <Icons.Info className="w-4 h-4 text-amber-600" />
                                <AlertDescription className="text-amber-700 text-sm flex items-center gap-3 flex-wrap">
                                    <span>Need a CSV template? Download the sample file with the correct column headers.</span>
                                    <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-100 h-7">
                                        <Icons.Download className="w-3.5 h-3.5" /> Download Template
                                    </Button>
                                </AlertDescription>
                            </Alert>
                        </div>
                    </div>
                )}

                {/* ── Step 2: Table ────────────────────────────────── */}
                {step >= 2 && !results && (
                    <>
                        {/* Summary bar */}
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 text-sm">
                                <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                                <span className="text-gray-700"><strong>{validRows.length}</strong> valid</span>
                            </div>
                            {invalidRows.length > 0 && (
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                                    <span className="text-gray-700"><strong>{invalidRows.length}</strong> invalid email</span>
                                </div>
                            )}
                            {emptyRows.length > 0 && (
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="w-2.5 h-2.5 rounded-full bg-gray-200 inline-block" />
                                    <span className="text-gray-400"><strong>{emptyRows.length}</strong> empty</span>
                                </div>
                            )}
                            <div className="ml-auto flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="gap-1.5">
                                    <Icons.Upload className="w-3.5 h-3.5" /> Import CSV
                                </Button>
                                <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-1.5">
                                    <Icons.Download className="w-3.5 h-3.5" /> Template
                                </Button>
                                {rows.length > 3 && (
                                    <Button variant="ghost" size="sm" onClick={clearAll} className="gap-1.5 text-red-500 hover:text-red-700 hover:bg-red-50">
                                        <Icons.Trash2 className="w-3.5 h-3.5" /> Clear All
                                    </Button>
                                )}
                            </div>
                        </div>

                        <Alert className="border-blue-100 bg-blue-50 py-2.5">
                            <Icons.Info className="w-4 h-4 text-blue-500" />
                            <AlertDescription className="text-blue-700 text-xs">
                                <strong>Paste tip:</strong> Select any cell below and press <kbd className="px-1 py-0.5 bg-white border rounded text-xs">Ctrl+V</kbd> to paste rows copied from Excel or Google Sheets (columns: First Name, Last Name, Email, Gender, Country, Region, Track, Phone).
                            </AlertDescription>
                        </Alert>

                        {/* Table */}
                        <Card className="shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base">Fellow Details</CardTitle>
                                        <CardDescription>{rows.length} row{rows.length !== 1 ? 's' : ''} · {validRows.length} ready to create</CardDescription>
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
                                                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 min-w-[150px]">First Name</th>
                                                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 min-w-[150px]">Last Name</th>
                                                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 min-w-[200px]">
                                                    Email <span className="text-red-500">*</span>
                                                </th>
                                                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 min-w-[130px]">Phone</th>
                                                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 min-w-[130px]">Gender</th>
                                                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 min-w-[140px]">Country</th>
                                                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 min-w-[140px]">Region</th>
                                                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 min-w-[180px]">Track</th>
                                                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 min-w-[150px]">Category</th>
                                                <th className="px-3 py-3 w-10" />
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {rows.map((row, idx) => (
                                                <tr key={row.id}
                                                    className={`group transition-colors ${
                                                        !row.email && !row.firstName && !row.lastName
                                                            ? 'bg-gray-50/40 text-gray-400'
                                                            : row.email && !isValidEmail(row.email)
                                                                ? 'bg-amber-50/30'
                                                                : row.email
                                                                    ? 'bg-white hover:bg-green-50/20'
                                                                    : 'bg-white'
                                                    }`}>
                                                    <td className="px-4 py-2.5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-gray-400 font-mono w-4">{idx + 1}</span>
                                                            <RowStatus row={row} />
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <Cell value={row.firstName} onChange={v => updateRow(idx, 'firstName', v)} placeholder="First name" />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <Cell value={row.lastName} onChange={v => updateRow(idx, 'lastName', v)} placeholder="Last name" />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <Cell type="email" value={row.email} onChange={v => updateRow(idx, 'email', v)} placeholder="email@example.com"
                                                            error={row.email && !isValidEmail(row.email)} wide />
                                                        {row.email && !isValidEmail(row.email) && (
                                                            <p className="text-xs text-red-500 mt-0.5">Invalid email</p>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <Cell value={row.phoneNumber} onChange={v => updateRow(idx, 'phoneNumber', v)} placeholder="+254 700 000" />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <Cell type="select" value={row.gender} onChange={v => updateRow(idx, 'gender', v)}
                                                            placeholder="Gender"
                                                            options={GENDER_OPTIONS.map(g => ({ value: g, label: g }))} />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <Cell value={row.country} onChange={v => updateRow(idx, 'country', v)} placeholder="Country" />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <Cell value={row.region} onChange={v => updateRow(idx, 'region', v)} placeholder="Region" />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <Cell type="select" value={row.track} onChange={v => updateRow(idx, 'track', v)}
                                                            placeholder="Track" wide
                                                            options={TRACK_OPTIONS.map(t => ({ value: t, label: t }))} />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <Cell type="select" value={row.category} onChange={v => updateRow(idx, 'category', v)}
                                                            placeholder="Category"
                                                            options={[
                                                                { value: '__none__', label: 'None' },
                                                                ...categories.map(c => ({ value: c._id, label: c.name })),
                                                            ]} />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-500"
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
                                    <Button variant="outline" size="sm" onClick={addRow} className="gap-1.5 w-full border-dashed text-gray-500 hover:text-gray-700">
                                        <Icons.Plus className="w-3.5 h-3.5" /> Add Another Row
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Email option */}
                        <Card className={`border-2 transition-colors ${sendEmails ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'}`}>
                            <CardContent className="pt-5 pb-5">
                                <div className="flex items-start gap-4">
                                    <Checkbox id="sendEmails" checked={sendEmails} onCheckedChange={setSend} className="mt-0.5" />
                                    <div className="flex-1">
                                        <label htmlFor="sendEmails" className={`text-sm font-semibold cursor-pointer ${sendEmails ? 'text-blue-800' : 'text-gray-700'}`}>
                                            Send invitation emails with temporary passwords
                                        </label>
                                        <p className={`text-sm mt-1 ${sendEmails ? 'text-blue-600' : 'text-gray-500'}`}>
                                            {sendEmails
                                                ? 'Each fellow will receive a welcome email at their registered address containing their temporary password. They will be required to change it on their first login.'
                                                : 'No emails will be sent. A table of temporary passwords will be shown to you after creation, so you can share them manually.'}
                                        </p>
                                    </div>
                                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${sendEmails ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                        {sendEmails ? <Icons.Mail className="w-5 h-5 text-blue-600" /> : <Icons.MailOff className="w-5 h-5 text-gray-400" />}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Action bar */}
                        <div className="flex items-center justify-between gap-4 py-4 sticky bottom-0 bg-gray-50/95 backdrop-blur border-t -mx-6 px-6 mt-4">
                            <div className="text-sm text-gray-600">
                                <strong className="text-green-700">{validRows.length}</strong> fellow{validRows.length !== 1 ? 's' : ''} will be created
                                {invalidRows.length > 0 && <span className="ml-2 text-amber-600">({invalidRows.length} skipped — invalid email)</span>}
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={() => router.push('/admin/fellows')}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={loading || validRows.length === 0}
                                    className="gap-2 bg-green-600 hover:bg-green-700 min-w-[200px]"
                                >
                                    {loading ? (
                                        <><Icons.Loader2 className="w-4 h-4 animate-spin" /> Creating {validRows.length} fellows…</>
                                    ) : (
                                        <><Icons.Users className="w-4 h-4" /> Create {validRows.length} Fellow{validRows.length !== 1 ? 's' : ''}</>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </>
                )}

                {/* ── Step 3: Results ──────────────────────────────── */}
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

                        {/* Summary cards */}
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

                        {/* Errors */}
                        {results.errors?.length > 0 && (
                            <Card className="border-red-200 bg-red-50">
                                <CardHeader className="pb-2"><CardTitle className="text-sm text-red-700">Errors</CardTitle></CardHeader>
                                <CardContent className="space-y-1">
                                    {results.errors.map((e, i) => (
                                        <p key={i} className="text-xs text-red-600 flex items-center gap-2">
                                            <Icons.XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                            <strong>{e.email}</strong>: {e.error}
                                        </p>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* Temp passwords when no email was sent */}
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
