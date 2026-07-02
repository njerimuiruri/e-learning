'use client';

import { useEffect, useState } from 'react';
import {
  DollarSign, Users, Download, Search, CheckCircle,
  Clock, XCircle, GraduationCap, Briefcase, Loader2,
  RefreshCw, Send, AlertTriangle, Filter,
} from 'lucide-react';
import paymentService from '@/lib/api/paymentService';
import categoryService from '@/lib/api/categoryService';
import adminService, { bankPaymentService } from '@/lib/api/adminService';
import * as XLSX from 'xlsx';

export default function AdminPaymentsPage() {
  const [tab, setTab] = useState('all'); // 'all' | 'installments' | 'lookup' | 'bank' | 'pay_later'
  const [payments, setPayments] = useState([]);
  const [installments, setInstallments] = useState({ overview: [], total: 0, owingInstallment2: 0, completedBoth: 0 });
  const [stats, setStats] = useState({ total: 0, totalRevenue: 0, students: 0, nonStudents: 0 });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [search, setSearch] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [academyId, setAcademyId] = useState(null);
  const [lookupEmail, setLookupEmail] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState(null);

  // Bank payments state
  const [bankRecords, setBankRecords] = useState([]);
  const [bankStats, setBankStats] = useState({ paid: 0, partial: 0, pending: 0, totalAmountDue: 0, totalAmountPaid: 0, totalBalance: 0 });
  const [bankSearch, setBankSearch] = useState('');
  const [bankFilterStatus, setBankFilterStatus] = useState('all');
  const [bankLoading, setBankLoading] = useState(false);
  // Pay-later state
  const [payLaterUsers, setPayLaterUsers] = useState([]);
  const [payLaterLoading, setPayLaterLoading] = useState(false);
  const [payLaterSearch, setPayLaterSearch] = useState('');
  const [reminderSending, setReminderSending] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const cats = await categoryService.getAllCategories();
      const academy = cats.find(c =>
        c.name?.toLowerCase().includes('publishing academy') ||
        c.name?.toLowerCase().includes('arin publishing')
      );
      if (academy?._id) {
        setAcademyId(academy._id);
        const [paymentsResult, installmentResult] = await Promise.all([
          paymentService.adminGetCategoryPayments(academy._id, 1, 200),
          paymentService.adminGetInstallmentOverview(academy._id),
        ]);
        const list = paymentsResult.payments || [];
        setPayments(list);
        setStats({
          total: paymentsResult.total || list.length,
          totalRevenue: paymentsResult.totalRevenue || 0,
          students: list.filter(p => p.userTier === 'student').length,
          nonStudents: list.filter(p => p.userTier === 'non-student').length,
        });
        setInstallments(installmentResult || { overview: [], total: 0, owingInstallment2: 0, completedBoth: 0 });
      }
    } catch (e) {
      console.error('Failed to load payments', e);
    } finally {
      setLoading(false);
    }
  };

  const loadBankPayments = async (catId) => {
    const id = catId || academyId;
    if (!id) return;
    setBankLoading(true);
    try {
      const res = await bankPaymentService.getAll({ categoryId: id, status: bankFilterStatus !== 'all' ? bankFilterStatus : undefined, search: bankSearch || undefined, limit: 500 });
      setBankRecords(res.records || []);
      setBankStats(res.stats || { paid: 0, partial: 0, pending: 0, totalAmountDue: 0, totalAmountPaid: 0, totalBalance: 0 });
    } catch (e) {
      console.error('Failed to load bank payments', e);
    } finally {
      setBankLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'bank' && academyId) loadBankPayments();
  }, [tab, academyId, bankFilterStatus, bankSearch]);

  const loadPayLaterUsers = async () => {
    if (!academyId) return;
    setPayLaterLoading(true);
    try {
      const data = await paymentService.adminGetPayLaterEnrollments(academyId);
      setPayLaterUsers(Array.isArray(data) ? data : []);
    } catch (e) { console.error('Failed to load pay-later users', e); }
    finally { setPayLaterLoading(false); }
  };

  useEffect(() => {
    if (tab === 'pay_later' && academyId) loadPayLaterUsers();
  }, [tab, academyId]);

  const sendSingleReminder = async (userId) => {
    if (!academyId) return;
    setReminderSending(userId);
    try {
      await paymentService.adminSendPayLaterReminder(academyId, userId);
      alert('Reminder sent successfully');
    } catch { alert('Failed to send reminder'); }
    finally { setReminderSending(null); }
  };

  const exportBankPaymentsExcel = () => {
    const wb = XLSX.utils.book_new();
    const filteredBank = bankRecords.filter(r => {
      const matchSearch = !bankSearch || r.fullName?.toLowerCase().includes(bankSearch.toLowerCase()) || r.email?.toLowerCase().includes(bankSearch.toLowerCase());
      const matchStatus = bankFilterStatus === 'all' || r.paymentStatus === bankFilterStatus;
      return matchSearch && matchStatus;
    });
    const rows = [
      ['Full Name', 'Email', 'Gender', 'Nationality', 'Phone', 'Institution', 'Category', 'Amount Due (USD)', 'Amount Paid (USD)', 'Balance (USD)', 'Status', 'Tranche', 'Date of Payment', 'Comments'],
      ...filteredBank.map(r => [
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
    XLSX.writeFile(wb, `bank-payments-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const lookupUser = async () => {
    const email = lookupEmail.trim();
    if (!email) return;
    try {
      setLookupLoading(true);
      setLookupError(null);
      setLookupResult(null);
      const result = await paymentService.adminLookupUserCategories(email);
      setLookupResult(result);
    } catch (e) {
      setLookupError(e?.response?.data?.message || 'Lookup failed. Please try again.');
    } finally {
      setLookupLoading(false);
    }
  };

  const sendReminders = async () => {
    if (!academyId) return;
    try {
      setSending(true);
      setSendResult(null);
      const result = await paymentService.adminSendInstallment2Reminders(academyId);
      setSendResult(result);
    } catch (e) {
      setSendResult({ error: e?.response?.data?.message || 'Failed to send reminders' });
    } finally {
      setSending(false);
    }
  };

  const filtered = payments.filter(p => {
    const name = `${p.userId?.firstName || ''} ${p.userId?.lastName || ''}`.toLowerCase();
    const email = (p.userId?.email || '').toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase()) || email.includes(search.toLowerCase());
    const matchTier = filterTier === 'all' || p.userTier === filterTier;
    return matchSearch && matchTier;
  });

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Tier', 'Amount (USD)', 'Payment Type', 'Installment #', 'Status', 'Date'];
    const rows = filtered.map(p => [
      `${p.userId?.firstName || ''} ${p.userId?.lastName || ''}`.trim(),
      p.userId?.email || '',
      p.userTier || '',
      p.amount,
      p.isInstallment ? 'Installment' : 'Full',
      p.installmentNumber || '-',
      p.status,
      new Date(p.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'academy-payments.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Academy Payments</h1>
          <p className="text-sm text-gray-500 mt-0.5">ARIN Publishing Academy  payment records and installment tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadData} className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button onClick={exportCSV} disabled={filtered.length === 0} className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-[#021d49] rounded-lg hover:bg-[#032a66] transition-colors disabled:opacity-40">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={<Users className="w-4 h-4 text-[#021d49]" />} label="Total Paid" value={stats.total} bg="bg-[#021d49]/5" />
        <StatCard icon={<DollarSign className="w-4 h-4 text-emerald-600" />} label="Total Revenue" value={`$${stats.totalRevenue.toLocaleString()}`} bg="bg-emerald-50" />
        <StatCard icon={<GraduationCap className="w-4 h-4 text-sky-600" />} label="Students" value={stats.students} bg="bg-sky-50" />
        <StatCard icon={<Briefcase className="w-4 h-4 text-orange-600" />} label="Non-Students" value={stats.nonStudents} bg="bg-orange-50" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit flex-wrap">
        {[
          { key: 'all', label: 'All Payments (Paystack)' },
          { key: 'installments', label: `Installments (${installments.owingInstallment2} owe 2nd)` },
          { key: 'bank', label: `Bank Payments (${bankStats.paid + bankStats.partial + bankStats.pending || bankRecords.length})` },
          { key: 'pay_later', label: `Pay Later (${payLaterUsers.length})` },
          { key: 'lookup', label: 'User Lookup' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── All Payments tab ── */}
      {tab === 'all' && (
        <>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#021d49] bg-white" />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select value={filterTier} onChange={e => setFilterTier(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none bg-white">
                <option value="all">All tiers</option>
                <option value="student">Student only</option>
                <option value="non-student">Non-Student only</option>
              </select>
            </div>
          </div>
          <PaymentsTable payments={filtered} loading={loading} academyId={academyId} onRevoke={loadData} />
          {filtered.length > 0 && (
            <p className="text-xs text-gray-400 text-right">Showing {filtered.length} of {stats.total} payment{stats.total !== 1 ? 's' : ''}</p>
          )}
        </>
      )}

      {/* ── Installments tab ── */}
      {tab === 'installments' && (
        <div className="space-y-5">

          {/* Installment stats */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard icon={<Users className="w-4 h-4 text-gray-600" />} label="Paid Installment 1" value={installments.total} bg="bg-gray-50" />
            <StatCard icon={<CheckCircle className="w-4 h-4 text-emerald-600" />} label="Completed Both" value={installments.completedBoth} bg="bg-emerald-50" />
            <StatCard icon={<Clock className="w-4 h-4 text-amber-600" />} label="Still Owe 2nd" value={installments.owingInstallment2} bg="bg-amber-50" />
          </div>

          {/* Send reminders */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="font-semibold text-gray-900 text-sm mb-1">Send 2nd Installment Reminders</p>
                <p className="text-xs text-gray-500">
                  Emails everyone who paid Installment 1 but has not yet paid Installment 2.
                  {installments.owingInstallment2 > 0
                    ? ` ${installments.owingInstallment2} people will receive this email.`
                    : ' Everyone has already paid both installments.'}
                </p>
              </div>
              <button
                onClick={sendReminders}
                disabled={sending || installments.owingInstallment2 === 0}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#021d49] text-white text-sm font-semibold rounded-xl hover:bg-[#032a66] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : <><Send className="w-4 h-4" /> Send Reminders</>}
              </button>
            </div>

            {sendResult && (
              <div className={`mt-4 flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${sendResult.error ? 'bg-red-50 border border-red-100 text-red-700' : 'bg-emerald-50 border border-emerald-100 text-emerald-700'}`}>
                {sendResult.error
                  ? <><AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {sendResult.error}</>
                  : <><CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> Sent to {sendResult.sent} people. {sendResult.failed > 0 ? `${sendResult.failed} failed.` : ''}</>
                }
              </div>
            )}
          </div>

          {/* Installment breakdown table */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#021d49]" /></div>
            ) : installments.overview.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No installment payments yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      {['Name', 'Email', 'Tier', 'Installment 1', 'Installment 2', 'Status'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {installments.overview.map((row, i) => {
                      const user = row.user || {};
                      const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || '';
                      const isStudent = row.userTier === 'student';
                      return (
                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-900">{name}</td>
                          <td className="px-4 py-3 text-gray-500">{user.email || ''}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${isStudent ? 'bg-sky-50 text-sky-700' : 'bg-orange-50 text-orange-700'}`}>
                              {isStudent ? <GraduationCap className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />}
                              {isStudent ? 'Student' : 'Non-Student'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                              <CheckCircle className="w-3 h-3" /> ${row.amount1} paid
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {row.hasPaidInstallment2 ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                                <CheckCircle className="w-3 h-3" /> ${row.amount1} paid
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                                <Clock className="w-3 h-3" /> ${row.amount1} pending
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {row.hasPaidInstallment2 ? (
                              <span className="text-xs font-semibold text-emerald-600">Complete</span>
                            ) : (
                              <span className="text-xs font-semibold text-amber-600">Awaiting 2nd</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      {/* ── Pay Later tab ── */}
      {tab === 'pay_later' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-sm font-bold text-gray-800">Pay Later Enrollments</h2>
              <p className="text-xs text-gray-500 mt-0.5">Self-registered users with free Module 1 teaser access  awaiting payment for full access.</p>
            </div>
            <button onClick={() => paymentService.adminSendBulkPayLaterReminders(academyId).then(() => alert('Bulk reminders sent!'))}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">
              <Send className="w-3.5 h-3.5" /> Send All Reminders
            </button>
          </div>
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search…" value={payLaterSearch} onChange={e => setPayLaterSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#021d49] bg-white" />
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  {['Name', 'Email', 'Tier', 'Enrolled', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payLaterLoading ? (
                  <tr><td colSpan={6} className="text-center py-12">
                    <Loader2 className="w-7 h-7 animate-spin text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Loading…</p>
                  </td></tr>
                ) : payLaterUsers.filter(u => {
                  const q = payLaterSearch.toLowerCase();
                  return !q || `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
                }).length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12">
                    <Clock className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                    <p className="text-gray-500 font-medium text-sm">No pay-later enrollments</p>
                  </td></tr>
                ) : payLaterUsers.filter(u => {
                  const q = payLaterSearch.toLowerCase();
                  return !q || `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
                }).map(u => (
                  <tr key={u._id} className="border-b last:border-0 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">{u.firstName} {u.lastName}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.tier === 'student' ? 'bg-sky-100 text-sky-700' : 'bg-orange-100 text-orange-700'}`}>
                        {u.tier === 'student' ? 'Student' : 'Non-Student'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {u.enrolledAt ? new Date(u.enrolledAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                    </td>
                    <td className="px-4 py-3">
                      {u.isLocked
                        ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Locked</span>
                        : <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Pay Later</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button disabled={reminderSending === u._id} onClick={() => sendSingleReminder(u._id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-50 transition-colors disabled:opacity-40">
                        {reminderSending === u._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                        Send Reminder
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── User Lookup tab ── */}
      {tab === 'lookup' && (
        <div className="space-y-5 max-w-xl">
          <div>
            <h2 className="text-sm font-bold text-gray-800 mb-1">Check user enrollment</h2>
            <p className="text-xs text-gray-500">Enter any email address to see which categories that user is associated with and whether they have paid for the ARIN Publishing Academy.</p>
          </div>

          {/* Email input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                placeholder="user@example.com"
                value={lookupEmail}
                onChange={e => { setLookupEmail(e.target.value); setLookupResult(null); setLookupError(null); }}
                onKeyDown={e => e.key === 'Enter' && lookupUser()}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#021d49] bg-white"
              />
            </div>
            <button
              onClick={lookupUser}
              disabled={lookupLoading || !lookupEmail.trim()}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-[#021d49] rounded-lg hover:bg-[#032a66] transition-colors disabled:opacity-40"
            >
              {lookupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {lookupLoading ? 'Checking…' : 'Check'}
            </button>
          </div>

          {/* Error */}
          {lookupError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {lookupError}
            </div>
          )}

          {/* Result */}
          {lookupResult && !lookupResult.found && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center shadow-sm">
              <XCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-700">No account found</p>
              <p className="text-xs text-gray-400 mt-1">No user registered with <span className="font-mono">{lookupEmail}</span></p>
            </div>
          )}

          {lookupResult?.found && (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              {/* User header */}
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#021d49]/10 flex items-center justify-center text-sm font-bold text-[#021d49]">
                  {(lookupResult.user.firstName?.[0] || lookupResult.user.email[0]).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    {lookupResult.user.firstName || ''} {lookupResult.user.lastName || ''}
                  </p>
                  <p className="text-xs text-gray-400">{lookupResult.user.email}</p>
                </div>
                <span className={`ml-auto text-xs font-semibold px-2.5 py-1 rounded-full ${lookupResult.user.userType === 'fellow' ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                  {lookupResult.user.userType || lookupResult.user.role}
                </span>
              </div>

              <div className="divide-y divide-gray-50">
                {/* Publishing Academy status */}
                {lookupResult.publishingAcademy && (
                  <div className="px-5 py-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">ARIN Publishing Academy</p>
                    {lookupResult.publishingAcademy.status === 'paid' && (
                      <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-semibold">Paid  has access</span>
                      </div>
                    )}
                    {lookupResult.publishingAcademy.status === 'assigned_free' && (
                      <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-amber-800">Assigned but not paid</p>
                          <p className="text-xs text-amber-700 mt-0.5">This user is in the Academy's assigned categories but has not completed payment. They must pay to get access.</p>
                        </div>
                      </div>
                    )}
                    {lookupResult.publishingAcademy.status === 'pending_verification' && (
                      <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-semibold">Student ID under review  awaiting payment</span>
                      </div>
                    )}
                    {lookupResult.publishingAcademy.status === 'not_enrolled' && (
                      <div className="flex items-center gap-2 text-gray-600 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                        <XCircle className="w-4 h-4 flex-shrink-0 text-gray-400" />
                        <div>
                          <p className="text-sm font-semibold">Not enrolled  payment required</p>
                          <p className="text-xs text-gray-500 mt-0.5">This user has not paid for the ARIN Publishing Academy.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Assigned categories (fellow) */}
                <div className="px-5 py-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Fellow categories assigned</p>
                  {lookupResult.assignedCategories.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">None  not a fellow in any category</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {lookupResult.assignedCategories.map(c => (
                        <span key={c.id} className="text-xs font-medium px-3 py-1 bg-purple-50 text-purple-700 border border-purple-100 rounded-full">
                          {c.name || c.id}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Purchased categories */}
                <div className="px-5 py-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Paid access to</p>
                  {lookupResult.purchasedCategories.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No paid category access</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {lookupResult.purchasedCategories.map(c => (
                        <span key={c.id} className="text-xs font-medium px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full">
                          <CheckCircle className="w-3 h-3 inline mr-1" />{c.name || c.id}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Bank Payments tab ── */}
      {tab === 'bank' && (
        <div className="space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
            <StatCard icon={<CheckCircle className="w-4 h-4 text-green-600" />} label="Paid" value={bankStats.paid} bg="bg-green-50" />
            <StatCard icon={<Clock className="w-4 h-4 text-amber-600" />} label="Partial" value={bankStats.partial} bg="bg-amber-50" />
            <StatCard icon={<Clock className="w-4 h-4 text-gray-400" />} label="Pending" value={bankStats.pending} bg="bg-gray-50" />
            <StatCard icon={<DollarSign className="w-4 h-4 text-blue-600" />} label="Total Due" value={`USD ${(bankStats.totalAmountDue || 0).toLocaleString()}`} bg="bg-blue-50" />
            <StatCard icon={<DollarSign className="w-4 h-4 text-emerald-600" />} label="Total Paid" value={`USD ${(bankStats.totalAmountPaid || 0).toLocaleString()}`} bg="bg-emerald-50" />
            <StatCard icon={<DollarSign className="w-4 h-4 text-red-500" />} label="Balance" value={`USD ${(bankStats.totalBalance || 0).toLocaleString()}`} bg="bg-red-50" />
          </div>

          {/* Search & filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search by name or email…" value={bankSearch} onChange={e => setBankSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#021d49] bg-white" />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select value={bankFilterStatus} onChange={e => setBankFilterStatus(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none bg-white">
                <option value="all">All statuses</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="pending">Pending</option>
              </select>
              <button onClick={exportBankPaymentsExcel} disabled={bankRecords.length === 0}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-[#021d49] rounded-lg hover:bg-[#032a66] transition-colors disabled:opacity-40">
                <Download className="w-3.5 h-3.5" /> Export Excel
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            {bankLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#021d49]" /></div>
            ) : bankRecords.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-gray-400">No bank payment records found</p>
                <p className="text-xs text-gray-400 mt-1">Use the Fellows Management → Arin Publishing Academy tab to add records.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      {['Full Name', 'Email', 'Category', 'Institution', 'Amount Due', 'Amount Paid', 'Balance', 'Status', 'Tranche', 'Date Paid', 'Comments'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {bankRecords
                      .filter(r => {
                        const ms = !bankSearch || r.fullName?.toLowerCase().includes(bankSearch.toLowerCase()) || r.email?.toLowerCase().includes(bankSearch.toLowerCase());
                        const mf = bankFilterStatus === 'all' || r.paymentStatus === bankFilterStatus;
                        return ms && mf;
                      })
                      .map(r => (
                        <tr key={r._id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{r.fullName}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{r.email}</td>
                          <td className="px-4 py-3 text-xs">{r.participantCategory ? <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-medium">{r.participantCategory}</span> : <span className="text-gray-300"></span>}</td>
                          <td className="px-4 py-3 text-xs text-gray-500 max-w-32 truncate">{r.institution || ''}</td>
                          <td className="px-4 py-3 text-xs font-medium text-gray-700">USD {(r.amountDue || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-xs font-medium text-green-700">USD {(r.amountPaid || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-xs font-medium text-red-600">USD {(r.balance || 0).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            {r.paymentStatus === 'paid' && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Paid</span>}
                            {r.paymentStatus === 'partial' && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Partial</span>}
                            {r.paymentStatus === 'pending' && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">Pending</span>}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">{r.tranche || ''}</td>
                          <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{r.dateOfPayment ? new Date(r.dateOfPayment).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}</td>
                          <td className="px-4 py-3 text-xs text-gray-500 max-w-40 truncate">{r.comments || ''}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

function PaymentsTable({ payments, loading, academyId, onRevoke }) {
  const STATUS_COLORS = { completed: 'bg-emerald-50 text-emerald-700', pending: 'bg-amber-50 text-amber-700', failed: 'bg-red-50 text-red-700' };
  const STATUS_ICONS = { completed: <CheckCircle className="w-3 h-3" />, pending: <Clock className="w-3 h-3" />, failed: <XCircle className="w-3 h-3" /> };
  const [revokingId, setRevokingId] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null); // { userId, name, email }

  const handleRevoke = async () => {
    if (!confirmTarget || !academyId) return;
    setRevokingId(confirmTarget.userId);
    setConfirmTarget(null);
    try {
      await adminService.revokeUserCategoryAccess(confirmTarget.userId, academyId);
      onRevoke?.();
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to revoke access');
    } finally {
      setRevokingId(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#021d49]" /></div>;
  if (payments.length === 0) return (
    <div className="text-center py-16 bg-white border border-gray-100 rounded-2xl">
      <DollarSign className="w-10 h-10 text-gray-200 mx-auto mb-3" />
      <p className="text-sm text-gray-500">No payments found</p>
    </div>
  );

  return (
    <>
      {/* Confirm revoke dialog */}
      {confirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Remove Academy Access</p>
                <p className="text-xs text-gray-500">{confirmTarget.name} · {confirmTarget.email}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              This will remove <strong>{confirmTarget.name}</strong> from the ARIN Publishing Academy. They will no longer have access and will need to pay again to re-enrol.
            </p>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setConfirmTarget(null)} className="flex-1 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleRevoke} className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors">Remove Access</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Name', 'Email', 'Tier', 'Amount', 'Payment Type', 'Status', 'Date', 'Reference', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payments.map((p, i) => {
                const name = `${p.userId?.firstName || ''} ${p.userId?.lastName || ''}`.trim() || '';
                const isStudent = p.userTier === 'student';
                const payType = p.isInstallment ? `Installment ${p.installmentNumber || 1} of 2` : 'Full payment';
                const userId = p.userId?._id || p.userId;
                const isRevoking = revokingId === userId;
                return (
                  <tr key={p._id || i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{name}</td>
                    <td className="px-4 py-3 text-gray-500">{p.userId?.email || ''}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${isStudent ? 'bg-sky-50 text-sky-700' : 'bg-orange-50 text-orange-700'}`}>
                        {isStudent ? <GraduationCap className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />}
                        {isStudent ? 'Student' : 'Non-Student'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">${p.amount}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{payType}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[p.status] || STATUS_COLORS.pending}`}>
                        {STATUS_ICONS[p.status] || STATUS_ICONS.pending}
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400 max-w-[140px] truncate">{p.paystackReference}</td>
                    <td className="px-4 py-3">
                      <button
                        disabled={isRevoking || !userId}
                        onClick={() => setConfirmTarget({ userId, name, email: p.userId?.email || '' })}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40 whitespace-nowrap"
                      >
                        {isRevoking ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                        Remove Access
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function StatCard({ icon, label, value, bg }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
      <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-3`}>{icon}</div>
      <p className="text-2xl font-extrabold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
