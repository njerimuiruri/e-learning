'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users, Award, DollarSign, TrendingUp, RefreshCw,
  CheckCircle, Clock, AlertTriangle, ChevronUp, ChevronDown,
  Activity, Target, BookOpen, Loader2, Search, X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import analyticsService from '@/lib/api/analyticsService';
import Navbar from '@/components/navbar/navbar';

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => Number(n ?? 0).toFixed(1);
const num = (n) => Number(n ?? 0).toLocaleString();
const date = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

function ScoreBadge({ score }) {
  const color =
    score >= 75 ? 'bg-green-100 text-green-700' :
    score >= 50 ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-600';
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>
      {score}
    </span>
  );
}

function StatusBadge({ status }) {
  const map = {
    issued:    'bg-green-100 text-green-700',
    approved:  'bg-blue-100 text-blue-700',
    pending:   'bg-amber-100 text-amber-700',
    cancelled: 'bg-red-100 text-red-600',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

function KPICard({ icon: Icon, label, value, sub, color = 'indigo' }) {
  const bg = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green:  'bg-green-50 text-green-600',
    amber:  'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
  };
  return (
    <Card className="border border-gray-100 shadow-sm">
      <CardContent className="p-4">
        <div className={`p-2 rounded-lg inline-flex ${bg[color] ?? bg.indigo}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="mt-3 text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-xs font-medium text-gray-500 mt-0.5">{label}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </CardContent>
    </Card>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────
export default function MicrograntsPage() {
  const [tab, setTab] = useState('eligible');

  // eligible tab state
  const [eligible, setEligible] = useState(null);
  const [loadingEligible, setLoadingEligible] = useState(false);
  const [errorEligible, setErrorEligible] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('compositeScore');
  const [sortDir, setSortDir] = useState('desc');
  const [selected, setSelected] = useState(new Set());

  // issue grant modal state
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [currency] = useState('KES');
  const [grantNotes, setGrantNotes] = useState('');
  const [issuing, setIssuing] = useState(false);
  const [issueResult, setIssueResult] = useState(null);

  // history tab state
  const [history, setHistory] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // ── fetch eligible ──────────────────────────────────────────────────────────
  const fetchEligible = useCallback(async () => {
    setLoadingEligible(true);
    setErrorEligible('');
    try {
      const data = await analyticsService.getMicrograntEligible(minScore);
      setEligible(data);
    } catch (err) {
      setErrorEligible(err?.response?.data?.message || 'Failed to load eligible fellows');
    } finally {
      setLoadingEligible(false);
    }
  }, [minScore]);

  // ── fetch history ───────────────────────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const data = await analyticsService.getMicrograntHistory();
      setHistory(data);
    } catch {
      // silently fail — show empty state
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => { fetchEligible(); }, [fetchEligible]);
  useEffect(() => { if (tab === 'history') fetchHistory(); }, [tab, fetchHistory]);

  // ── sorting ─────────────────────────────────────────────────────────────────
  const toggleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortIcon = ({ field }) =>
    sortField === field
      ? sortDir === 'asc' ? <ChevronUp className="w-3 h-3 inline ml-0.5" /> : <ChevronDown className="w-3 h-3 inline ml-0.5" />
      : null;

  // ── derived data ────────────────────────────────────────────────────────────
  const fellows = eligible?.fellows ?? [];
  const displayed = fellows
    .filter((f) =>
      !search ||
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.email.toLowerCase().includes(search.toLowerCase()) ||
      (f.cohort || '').toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      const v = (x) => x[sortField] ?? 0;
      return sortDir === 'asc' ? v(a) - v(b) : v(b) - v(a);
    });

  const allSelected = displayed.length > 0 && displayed.every((f) => selected.has(f.studentId));
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(displayed.map((f) => f.studentId)));
  };
  const toggleOne = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const selectedFellows = fellows.filter((f) => selected.has(f.studentId));

  // ── issue grant ─────────────────────────────────────────────────────────────
  const handleIssue = async () => {
    if (!amount || Number(amount) <= 0) return;
    setIssuing(true);
    try {
      const result = await analyticsService.issueMicrogrants({
        studentIds: [...selected],
        amount: Number(amount),
        currency,
        categoryId: eligible?.categoryId,
        notes: grantNotes,
      });
      setIssueResult(result);
      setSelected(new Set());
      fetchEligible();
      if (tab === 'history') fetchHistory();
    } catch (err) {
      setIssueResult({ error: err?.response?.data?.message || 'Failed to issue grants' });
    } finally {
      setIssuing(false);
    }
  };

  const closeModal = () => {
    setShowIssueModal(false);
    setAmount('');
    setGrantNotes('');
    setIssueResult(null);
  };

  // ── KPIs ─────────────────────────────────────────────────────────────────────
  const totalFellows = eligible?.totalFellows ?? 0;
  const avgComposite = fellows.length
    ? Math.round(fellows.reduce((s, f) => s + f.compositeScore, 0) / fellows.length)
    : 0;
  const highPerformers = fellows.filter((f) => f.compositeScore >= 75).length;
  const alreadyGranted = fellows.filter((f) => f.alreadyGranted).length;

  const historyGrants = history?.grants ?? [];
  const totalDisbursed = history?.summary?.totalAmount ?? 0;

  // ── render ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Award className="w-6 h-6 text-indigo-600" />
            Mini-Grant Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            AI for Climate Resilience — issue financial grants to fellows based on activeness, scores, and engagement.
          </p>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KPICard icon={Users}      label="Total Eligible Fellows"   value={num(totalFellows)}   color="indigo" />
          <KPICard icon={TrendingUp} label="Avg Composite Score"      value={`${avgComposite}%`}  color="violet" />
          <KPICard icon={Target}     label="High Performers (≥75%)"   value={num(highPerformers)} color="green"  sub="Recommended for grant" />
          <KPICard icon={DollarSign} label="Total Disbursed (KES)"    value={num(totalDisbursed)} color="amber"  sub="Across all grants" />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="eligible">Eligible Fellows</TabsTrigger>
            <TabsTrigger value="history">Grant History</TabsTrigger>
          </TabsList>

          {/* ── ELIGIBLE TAB ───────────────────────────────────────────────── */}
          <TabsContent value="eligible">
            <Card className="border border-gray-100 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">Fellow Eligibility Ranking</CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Scored on: Assessment (40%) + Engagement (35%) + Activity (25%)
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* min score filter */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <span>Min score:</span>
                      <select
                        value={minScore}
                        onChange={(e) => setMinScore(Number(e.target.value))}
                        className="border border-gray-200 rounded px-2 py-1 text-xs"
                      >
                        {[0, 25, 50, 60, 75].map((v) => (
                          <option key={v} value={v}>{v}%</option>
                        ))}
                      </select>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={fetchEligible}
                      disabled={loadingEligible}
                      className="text-xs h-7"
                    >
                      <RefreshCw className={`w-3 h-3 mr-1 ${loadingEligible ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    {selected.size > 0 && (
                      <Button
                        size="sm"
                        onClick={() => setShowIssueModal(true)}
                        className="text-xs h-7 bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        <Award className="w-3 h-3 mr-1" />
                        Issue Grant ({selected.size})
                      </Button>
                    )}
                  </div>
                </div>

                {/* search */}
                <div className="relative mt-2 max-w-sm">
                  <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, email or cohort…"
                    className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded w-full focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-2 top-2">
                      <X className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {loadingEligible ? (
                  <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Loading fellows…</span>
                  </div>
                ) : errorEligible ? (
                  <div className="flex items-center justify-center py-16 gap-2 text-red-500">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="text-sm">{errorEligible}</span>
                  </div>
                ) : displayed.length === 0 ? (
                  <div className="py-16 text-center text-sm text-gray-400">No fellows found.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 text-xs">
                          <TableHead className="w-10 pl-4">
                            <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded" />
                          </TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Cohort</TableHead>
                          <TableHead
                            className="cursor-pointer select-none"
                            onClick={() => toggleSort('assessmentScore')}
                          >
                            Assessment <SortIcon field="assessmentScore" />
                          </TableHead>
                          <TableHead
                            className="cursor-pointer select-none"
                            onClick={() => toggleSort('engagementScore')}
                          >
                            Engagement <SortIcon field="engagementScore" />
                          </TableHead>
                          <TableHead
                            className="cursor-pointer select-none"
                            onClick={() => toggleSort('activityScore')}
                          >
                            Activity <SortIcon field="activityScore" />
                          </TableHead>
                          <TableHead
                            className="cursor-pointer select-none"
                            onClick={() => toggleSort('compositeScore')}
                          >
                            Composite <SortIcon field="compositeScore" />
                          </TableHead>
                          <TableHead>Modules</TableHead>
                          <TableHead>Last Login</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {displayed.map((f, i) => (
                          <TableRow
                            key={f.studentId}
                            className={`text-xs ${selected.has(f.studentId) ? 'bg-indigo-50' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                          >
                            <TableCell className="pl-4">
                              <input
                                type="checkbox"
                                checked={selected.has(f.studentId)}
                                onChange={() => toggleOne(f.studentId)}
                                disabled={f.alreadyGranted}
                                className="rounded"
                              />
                            </TableCell>
                            <TableCell className="font-medium text-gray-900 whitespace-nowrap">
                              {f.name}
                              {f.compositeScore >= 75 && (
                                <span className="ml-1 text-amber-500 text-[10px]">★</span>
                              )}
                            </TableCell>
                            <TableCell className="text-gray-500">{f.email}</TableCell>
                            <TableCell>{f.cohort}</TableCell>
                            <TableCell><ScoreBadge score={f.assessmentScore} /></TableCell>
                            <TableCell><ScoreBadge score={f.engagementScore} /></TableCell>
                            <TableCell><ScoreBadge score={f.activityScore} /></TableCell>
                            <TableCell>
                              <span className="font-bold text-gray-900">{f.compositeScore}</span>
                            </TableCell>
                            <TableCell className="text-gray-500">
                              {f.completedModules}/{f.totalModules}
                            </TableCell>
                            <TableCell className="text-gray-500">
                              {f.lastLogin ? date(f.lastLogin) : '—'}
                            </TableCell>
                            <TableCell>
                              {f.alreadyGranted ? (
                                <span className="flex items-center gap-1 text-green-600 text-[10px] font-medium">
                                  <CheckCircle className="w-3 h-3" />
                                  Granted
                                </span>
                              ) : (
                                <span className="text-gray-400 text-[10px]">Eligible</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* score legend */}
            <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> ≥75 — High performer</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> 50–74 — Moderate</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> &lt;50 — Low</span>
              <span className="text-gray-300">|</span>
              <span>★ Recommended for grant</span>
            </div>
          </TabsContent>

          {/* ── HISTORY TAB ────────────────────────────────────────────────── */}
          <TabsContent value="history">
            <Card className="border border-gray-100 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Grant Disbursement History</CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      All mini-grants issued — {historyGrants.length} record{historyGrants.length !== 1 ? 's' : ''} · Total: KES {num(totalDisbursed)}
                    </CardDescription>
                  </div>
                  <Button size="sm" variant="outline" onClick={fetchHistory} disabled={loadingHistory} className="text-xs h-7">
                    <RefreshCw className={`w-3 h-3 mr-1 ${loadingHistory ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loadingHistory ? (
                  <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Loading history…</span>
                  </div>
                ) : historyGrants.length === 0 ? (
                  <div className="py-16 text-center text-sm text-gray-400">No grants issued yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 text-xs">
                          <TableHead>Fellow Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Cohort</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Assessment</TableHead>
                          <TableHead>Engagement</TableHead>
                          <TableHead>Composite</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Issued By</TableHead>
                          <TableHead>Date Issued</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {historyGrants.map((g, i) => (
                          <TableRow key={g._id} className={`text-xs ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                            <TableCell className="font-medium text-gray-900">{g.student?.name || '—'}</TableCell>
                            <TableCell className="text-gray-500">{g.student?.email || '—'}</TableCell>
                            <TableCell>{g.student?.cohort || '—'}</TableCell>
                            <TableCell className="font-semibold text-green-700">
                              {g.currency} {num(g.amount)}
                            </TableCell>
                            <TableCell><ScoreBadge score={g.criteriaSnapshot?.assessmentScore ?? 0} /></TableCell>
                            <TableCell><ScoreBadge score={g.criteriaSnapshot?.engagementScore ?? 0} /></TableCell>
                            <TableCell><span className="font-bold">{g.criteriaSnapshot?.compositeScore ?? '—'}</span></TableCell>
                            <TableCell><StatusBadge status={g.status} /></TableCell>
                            <TableCell className="text-gray-500">{g.issuedBy}</TableCell>
                            <TableCell className="text-gray-500">{date(g.issuedAt || g.createdAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── ISSUE GRANT MODAL ──────────────────────────────────────────────────── */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-600" />
                Issue Mini-Grant
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {issueResult ? (
              <div className="p-6">
                {issueResult.error ? (
                  <div className="text-center text-red-500">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                    <p className="font-medium">{issueResult.error}</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
                    <p className="font-semibold text-gray-900 text-lg">Grants Issued!</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {issueResult.issued} fellow{issueResult.issued !== 1 ? 's' : ''} successfully granted.
                      {issueResult.failed > 0 && ` ${issueResult.failed} failed.`}
                    </p>
                    <div className="mt-4 text-left space-y-1">
                      {issueResult.results?.map((r) => (
                        <div key={r.studentId} className="flex items-center gap-2 text-xs">
                          {r.success
                            ? <CheckCircle className="w-3 h-3 text-green-500" />
                            : <X className="w-3 h-3 text-red-400" />}
                          <span className={r.success ? 'text-gray-700' : 'text-red-500'}>
                            {r.name} {r.error ? `— ${r.error}` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <Button onClick={closeModal} className="w-full mt-5 text-sm">Close</Button>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                {/* selected fellows */}
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Selected Fellows ({selectedFellows.length})</p>
                  <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto space-y-1">
                    {selectedFellows.map((f) => (
                      <div key={f.studentId} className="flex items-center justify-between text-xs">
                        <span className="font-medium text-gray-800">{f.name}</span>
                        <span className="text-gray-400">{f.email}</span>
                        <span className="text-indigo-600 font-semibold">{f.compositeScore}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* amount */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Grant Amount (KES) per fellow
                  </label>
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <span className="bg-gray-50 px-3 py-2 text-xs text-gray-500 border-r border-gray-200">KES</span>
                    <input
                      type="number"
                      min={1}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="e.g. 5000"
                      className="flex-1 px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>
                  {amount && selectedFellows.length > 1 && (
                    <p className="text-xs text-gray-400 mt-1">
                      Total disbursement: KES {num(Number(amount) * selectedFellows.length)}
                    </p>
                  )}
                </div>

                {/* notes */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Notes (optional)</label>
                  <textarea
                    value={grantNotes}
                    onChange={(e) => setGrantNotes(e.target.value)}
                    rows={2}
                    placeholder="Reason for grant, cohort cycle, etc."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={closeModal} className="flex-1 text-sm" disabled={issuing}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleIssue}
                    disabled={issuing || !amount || Number(amount) <= 0}
                    className="flex-1 text-sm bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {issuing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Award className="w-4 h-4 mr-1" />}
                    {issuing ? 'Issuing…' : 'Confirm & Issue'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
