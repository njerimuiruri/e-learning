'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, TrendingUp, AlertTriangle, CheckCircle2, Clock,
  Search, Send, UserX, UserCheck, ChevronRight,
  RefreshCw, Loader2, Calendar,
  Flame, XCircle, Activity, PauseCircle, PlayCircle,
  BarChart2, MapPin, Brain,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import adminService from '@/lib/api/adminService';
import categoryService from '@/lib/api/categoryService';
import toast from 'react-hot-toast';

// ─── Constants ────────────────────────────────────────────────────────────────

const RISK_CONFIG = {
  COMPLETED:  { label: 'Completed',  color: 'bg-blue-100 text-blue-800',    icon: CheckCircle2,  dot: 'bg-blue-500'   },
  ON_TRACK:   { label: 'On Track',   color: 'bg-green-100 text-green-800',  icon: TrendingUp,    dot: 'bg-green-500'  },
  AT_RISK:    { label: 'At Risk',    color: 'bg-yellow-100 text-yellow-800',icon: AlertTriangle, dot: 'bg-yellow-500' },
  CRITICAL:   { label: 'Critical',   color: 'bg-red-100 text-red-800',      icon: Flame,         dot: 'bg-red-500'    },
  INACTIVE:   { label: 'Inactive',   color: 'bg-gray-100 text-gray-700',    icon: XCircle,       dot: 'bg-gray-400'   },
};

const ACTION_OPTIONS = [
  { value: 'suspend',        label: 'Suspend Fellow',           icon: PauseCircle,  color: 'text-orange-600', showWhen: (f) => !f.isSuspended },
  { value: 'unsuspend',      label: 'Restore Access',           icon: PlayCircle,   color: 'text-green-600',  showWhen: (f) => f.isSuspended  },
  { value: 'allow_proceed',  label: 'Mark Eligible to Proceed', icon: UserCheck,    color: 'text-blue-600',   showWhen: () => true },
  { value: 'mark_completed', label: 'Mark as Completed',        icon: CheckCircle2, color: 'text-blue-600',   showWhen: () => true },
  { value: 'deactivate',     label: 'Deactivate Fellow',        icon: UserX,        color: 'text-red-600',    showWhen: () => true },
];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 14) return `${diff}d ago`;
  return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
}

function daysLabel(daysLeft) {
  if (daysLeft === null) return '—';
  if (daysLeft < 0) return `${Math.abs(daysLeft)}d overdue`;
  if (daysLeft === 0) return 'Due today';
  return `${daysLeft}d left`;
}

function daysColor(daysLeft) {
  if (daysLeft === null) return 'text-gray-400';
  if (daysLeft < 0) return 'text-red-600 font-semibold';
  if (daysLeft <= 14) return 'text-red-500 font-semibold';
  if (daysLeft <= 30) return 'text-yellow-600 font-medium';
  return 'text-gray-600';
}

function ProgressBar({ pct, riskLevel, size = 'normal' }) {
  const fill = riskLevel === 'CRITICAL' ? 'bg-red-500'
    : riskLevel === 'AT_RISK' ? 'bg-yellow-500'
    : riskLevel === 'COMPLETED' ? 'bg-blue-500'
    : riskLevel === 'INACTIVE' ? 'bg-gray-400'
    : 'bg-green-500';
  const h = size === 'sm' ? 'h-1.5' : 'h-2';
  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 ${h} bg-gray-100 rounded-full overflow-hidden`}>
        <div className={`h-full rounded-full transition-all ${fill}`} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-600 w-8 text-right">{pct}%</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FellowProgressPage() {
  const [stats, setStats] = useState(null);
  const [fellows, setFellows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 30, total: 0, pages: 1 });
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsCategory, setAnalyticsCategory] = useState('all');

  // Filters
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterCohort, setFilterCohort] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Detail dialog
  const [detailFellow, setDetailFellow] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Action dialog
  const [actionFellow, setActionFellow] = useState(null);
  const [actionOpen, setActionOpen] = useState(false);
  const [actionType, setActionType] = useState('');
  const [actionNote, setActionNote] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  // Reminder dialog
  const [reminderFellow, setReminderFellow] = useState(null);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderMsg, setReminderMsg] = useState('');
  const [reminderSending, setReminderSending] = useState(false);

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const [statsRes, fellowsRes, catsRes] = await Promise.all([
        adminService.getFellowProgressStats(),
        adminService.getFellowsProgress({
          risk: filterRisk !== 'all' ? filterRisk : undefined,
          categoryId: filterCategory !== 'all' ? filterCategory : undefined,
          cohort: filterCohort !== 'all' ? filterCohort : undefined,
          status: filterStatus !== 'all' ? filterStatus : undefined,
          search: search || undefined,
          page, limit: 30,
        }),
        categoryService.getAllCategories(),
      ]);
      setStats(statsRes);
      setFellows(fellowsRes.fellows || []);
      setPagination(fellowsRes.pagination || { page: 1, limit: 30, total: 0, pages: 1 });
      setSummary(fellowsRes.stats || null);
      setCategories(catsRes || []);
      setCohorts(statsRes.cohorts || []);
    } catch {
      toast.error('Failed to load progress data');
    } finally {
      setLoading(false);
    }
  }, [filterRisk, filterCategory, filterCohort, filterStatus, search]);

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const res = await adminService.getLearningAnalytics({
        categoryId: analyticsCategory !== 'all' ? analyticsCategory : undefined,
        days: 90,
      });
      setAnalytics(res);
    } catch {
      toast.error('Failed to load analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  }, [analyticsCategory]);

  useEffect(() => { fetchData(1); }, [fetchData]);

  const openDetail = async (fellow) => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const res = await adminService.getFellowProgressDetail(fellow._id);
      setDetailFellow(res);
    } catch {
      toast.error('Failed to load fellow details');
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const openAction = (fellow, action) => {
    setActionFellow(fellow);
    setActionType(action);
    setActionNote('');
    setActionOpen(true);
  };

  const handleAction = async () => {
    if (!actionFellow || !actionType) return;
    setActionSubmitting(true);
    try {
      const res = await adminService.updateFellowProgressAction(actionFellow._id, actionType, actionNote);
      toast.success(res.message || 'Action applied');
      setActionOpen(false);
      fetchData(pagination.page);
    } catch {
      toast.error('Failed to apply action');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleSendReminder = async () => {
    if (!reminderFellow || !reminderMsg.trim()) { toast.error('Please enter a reminder message'); return; }
    setReminderSending(true);
    try {
      await adminService.sendFellowReminder(reminderFellow._id, reminderMsg);
      toast.success('Reminder sent');
      setReminderOpen(false);
      setReminderMsg('');
    } catch {
      toast.error('Failed to send reminder');
    } finally {
      setReminderSending(false);
    }
  };

  const selectedAction = ACTION_OPTIONS.find((a) => a.value === actionType);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Activity className="h-6 w-6 text-blue-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fellow Progress Tracker</h1>
            <p className="text-sm text-gray-500">Monitor module completion, take action on fellows, and analyse learning patterns</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchData(1)} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Stats */}
      <StatsGrid stats={stats} summary={summary} />

      {/* Main tabs */}
      <Tabs defaultValue="fellows">
        <TabsList className="mb-4">
          <TabsTrigger value="fellows" className="gap-1.5">
            <Users className="h-4 w-4" /> Fellows
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5" onClick={fetchAnalytics}>
            <Brain className="h-4 w-4" /> Learning Analytics
          </TabsTrigger>
        </TabsList>

        {/* ── Fellows Tab ─────────────────────────────────────────── */}
        <TabsContent value="fellows" className="space-y-4 mt-0">
          {/* Filters */}
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, email, track…" className="pl-9" />
                </div>

                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterRisk} onValueChange={setFilterRisk}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Risk Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    {Object.entries(RISK_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {cohorts.length > 0 && (
                  <Select value={filterCohort} onValueChange={setFilterCohort}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Cohort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Cohorts</SelectItem>
                      {cohorts.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Fellows Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                Fellows
                {summary && (
                  <span className="text-sm font-normal text-gray-500">
                    — {summary.total} result{summary.total !== 1 ? 's' : ''}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-gray-300" /></div>
              ) : fellows.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p>No fellows match the selected filters.</p>
                </div>
              ) : (
                <>
                  {/* Table header */}
                  <div className="hidden lg:grid grid-cols-[2.5fr_1.5fr_1.5fr_1fr_1fr_auto] gap-4 px-6 py-2 border-b bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <span>Fellow</span>
                    <span>Progress</span>
                    <span>Currently On</span>
                    <span>Last Active</span>
                    <span>Deadline</span>
                    <span />
                  </div>

                  <div className="divide-y">
                    {fellows.map((fellow) => (
                      <FellowRow
                        key={fellow._id}
                        fellow={fellow}
                        onDetail={() => openDetail(fellow)}
                        onReminder={() => { setReminderFellow(fellow); setReminderMsg(''); setReminderOpen(true); }}
                        onAction={(action) => openAction(fellow, action)}
                      />
                    ))}
                  </div>

                  {pagination.pages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t">
                      <span className="text-sm text-gray-500">
                        Page {pagination.page} of {pagination.pages} ({pagination.total} total)
                      </span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={pagination.page <= 1}
                          onClick={() => fetchData(pagination.page - 1)}>← Prev</Button>
                        <Button variant="outline" size="sm" disabled={pagination.page >= pagination.pages}
                          onClick={() => fetchData(pagination.page + 1)}>Next →</Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Analytics Tab ────────────────────────────────────────── */}
        <TabsContent value="analytics" className="mt-0">
          <AnalyticsTab
            analytics={analytics}
            loading={analyticsLoading}
            categories={categories}
            selectedCategory={analyticsCategory}
            onCategoryChange={(v) => { setAnalyticsCategory(v); }}
            onRefresh={fetchAnalytics}
          />
        </TabsContent>
      </Tabs>

      {/* ── Detail Dialog ───────────────────────────────────────────── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fellow Progress Detail</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-300" /></div>
          ) : detailFellow ? (
            <FellowDetailView detail={detailFellow} />
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ── Action Dialog ───────────────────────────────────────────── */}
      <Dialog open={actionOpen} onOpenChange={setActionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className={selectedAction?.color}>{selectedAction?.label}</DialogTitle>
          </DialogHeader>
          {actionFellow && (
            <div className="space-y-4">
              {actionType === 'suspend' && (
                <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <PauseCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-orange-800">
                    This will <strong>pause the fellow's access</strong> to all modules. They can be restored at any time via "Restore Access".
                  </p>
                </div>
              )}
              {actionType === 'unsuspend' && (
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <PlayCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-800">
                    This will <strong>restore full access</strong> for the fellow to continue their modules.
                  </p>
                </div>
              )}
              <p className="text-sm text-gray-600">
                Apply this action to <strong>{actionFellow.firstName} {actionFellow.lastName}</strong>?
                An email notification will be sent to them automatically.
              </p>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  Note / Reason <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add a note included in the email to the fellow…"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionOpen(false)}>Cancel</Button>
            <Button
              onClick={handleAction}
              disabled={actionSubmitting}
              className={
                actionType === 'deactivate' ? 'bg-red-600 hover:bg-red-700 text-white'
                : actionType === 'suspend'    ? 'bg-orange-500 hover:bg-orange-600 text-white'
                : actionType === 'unsuspend'  ? 'bg-green-600 hover:bg-green-700 text-white'
                : actionType === 'mark_completed' ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
              }
            >
              {actionSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reminder Dialog ─────────────────────────────────────────── */}
      <Dialog open={reminderOpen} onOpenChange={setReminderOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Reminder</DialogTitle>
          </DialogHeader>
          {reminderFellow && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                To: <strong>{reminderFellow.firstName} {reminderFellow.lastName}</strong> ({reminderFellow.email})
              </p>
              <textarea
                value={reminderMsg}
                onChange={(e) => setReminderMsg(e.target.value)}
                rows={5}
                className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`Please ensure you complete your pending modules…`}
              />
              <p className="text-xs text-gray-400">"Dear {reminderFellow.firstName}," will be prepended automatically.</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReminderOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSendReminder}
              disabled={reminderSending || !reminderMsg.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {reminderSending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
              Send Reminder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Stats Grid ───────────────────────────────────────────────────────────────

function StatsGrid({ stats, summary }) {
  const cards = [
    { label: 'Total Fellows',      value: stats?.totalFellows ?? '—',         sub: `${stats?.activeFellows ?? 0} active`,     icon: Users,        color: 'text-blue-600',   bg: 'bg-blue-50'   },
    { label: 'On Track',           value: summary?.onTrack ?? '—',             sub: summary ? `${Math.round((summary.onTrack / Math.max(summary.total, 1)) * 100)}% of visible` : '', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'At Risk / Critical', value: summary ? (summary.atRisk + summary.critical) : '—', sub: summary ? `${summary.atRisk} at risk · ${summary.critical} critical` : '', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Inactive',           value: summary?.inactive ?? '—',            sub: 'No activity 14+ days',                    icon: Clock,        color: 'text-gray-500',   bg: 'bg-gray-100'  },
    { label: 'Completed',          value: stats?.completedFellows ?? '—',      sub: `${stats?.completedModuleEnrollments ?? 0} modules done`, icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Deadline Soon',      value: stats?.approachingDeadline ?? '—',   sub: 'Within 30 days',                          icon: Calendar,     color: 'text-orange-600', bg: 'bg-orange-50' },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Card key={c.label} className="overflow-hidden">
            <CardContent className="p-4">
              <div className={`inline-flex p-2 rounded-lg ${c.bg} mb-3`}>
                <Icon className={`h-4 w-4 ${c.color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{c.value}</p>
              <p className="text-xs font-medium text-gray-600 mt-0.5">{c.label}</p>
              {c.sub && <p className="text-xs text-gray-400 mt-0.5">{c.sub}</p>}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Fellow Row ───────────────────────────────────────────────────────────────

function FellowRow({ fellow, onDetail, onReminder, onAction }) {
  const risk = RISK_CONFIG[fellow.riskLevel] || RISK_CONFIG.ON_TRACK;
  const RiskIcon = risk.icon;
  const [menuOpen, setMenuOpen] = useState(false);
  const suspended = fellow.isSuspended;

  const visibleActions = ACTION_OPTIONS.filter((a) => a.showWhen(fellow));

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-[2.5fr_1.5fr_1.5fr_1fr_1fr_auto] gap-4 px-6 py-4 transition-colors items-center ${suspended ? 'bg-orange-50/40' : 'hover:bg-gray-50'}`}>
      {/* Name + badges */}
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${suspended ? 'bg-orange-400' : 'bg-gradient-to-br from-blue-400 to-blue-600'}`}>
          {fellow.firstName?.[0]}{fellow.lastName?.[0]}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-gray-900 truncate">{fellow.firstName} {fellow.lastName}</p>
            {suspended && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                <PauseCircle className="h-3 w-3" /> Suspended
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 truncate">{fellow.email}</p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${risk.color}`}>
              <RiskIcon className="h-3 w-3" /> {risk.label}
            </span>
            {fellow.fellowData?.track && (
              <span className="text-xs text-gray-400 truncate max-w-[100px]">{fellow.fellowData.track}</span>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar + module counts */}
      <div className="hidden lg:block space-y-1">
        <ProgressBar pct={fellow.overallProgressPct} riskLevel={fellow.riskLevel} />
        <p className="text-xs text-gray-400">
          {fellow.completedModules}/{fellow.totalModules} modules
          {fellow.inProgressModules > 0 && ` · ${fellow.inProgressModules} in progress`}
        </p>
      </div>

      {/* Currently on */}
      <div className="hidden lg:flex items-start gap-1.5 min-w-0">
        <MapPin className="h-3.5 w-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="min-w-0">
          {fellow.currentModuleTitle ? (
            <>
              <p className="text-xs font-medium text-gray-700 truncate">{fellow.currentModuleTitle}</p>
              <p className="text-xs text-gray-400">Lesson {fellow.currentLessonIndex || '—'} · {fellow.currentModuleProgress || 0}%</p>
            </>
          ) : fellow.completedModules > 0 && fellow.completedModules === fellow.totalModules ? (
            <p className="text-xs text-blue-600 font-medium">All modules done</p>
          ) : (
            <p className="text-xs text-gray-400 italic">Not started</p>
          )}
        </div>
      </div>

      {/* Last active */}
      <div className="hidden lg:block text-sm text-gray-600">{fmtDate(fellow.lastAccessedAt)}</div>

      {/* Deadline */}
      <div className={`hidden lg:block text-sm ${daysColor(fellow.daysLeft)}`}>{daysLabel(fellow.daysLeft)}</div>

      {/* Actions */}
      <div className="flex items-center gap-1 justify-end relative">
        <Button variant="ghost" size="sm" onClick={onDetail} title="View details">
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="relative">
          <Button variant="outline" size="sm" className="text-xs" onClick={() => setMenuOpen((p) => !p)}>
            Actions
          </Button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-20 bg-white border rounded-lg shadow-lg w-52 py-1 text-sm">
                <button
                  className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 text-gray-700"
                  onClick={() => { setMenuOpen(false); onReminder(); }}
                >
                  <Send className="h-4 w-4 text-blue-500" /> Send Reminder
                </button>
                <hr className="my-1" />
                {visibleActions.map((a) => {
                  const AIcon = a.icon;
                  return (
                    <button
                      key={a.value}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 ${a.color}`}
                      onClick={() => { setMenuOpen(false); onAction(a.value); }}
                    >
                      <AIcon className="h-4 w-4" /> {a.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Fellow Detail View ───────────────────────────────────────────────────────

const STATUS_STYLE = {
  completed:   { label: 'Completed',   color: 'text-green-600',  dot: 'bg-green-500',  badge: 'bg-green-100 text-green-700'  },
  in_progress: { label: 'In Progress', color: 'text-blue-600',   dot: 'bg-blue-500',   badge: 'bg-blue-100 text-blue-700'    },
  enrolled:    { label: 'Enrolled',    color: 'text-gray-500',   dot: 'bg-gray-400',   badge: 'bg-gray-100 text-gray-600'    },
  not_started: { label: 'Not Started', color: 'text-gray-400',   dot: 'bg-gray-200',   badge: 'bg-gray-50 text-gray-400'     },
};

function FellowDetailView({ detail }) {
  const risk = RISK_CONFIG[detail.riskLevel] || RISK_CONFIG.ON_TRACK;
  const RiskIcon = risk.icon;

  return (
    <div className="space-y-5 text-sm">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-lg text-gray-900">{detail.fellow.firstName} {detail.fellow.lastName}</h3>
          <p className="text-gray-500">{detail.fellow.email}</p>
          {detail.fellow.fellowData?.track && (
            <p className="text-gray-400 text-xs mt-0.5">{detail.fellow.fellowData.track}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium ${risk.color}`}>
            <RiskIcon className="h-3.5 w-3.5" /> {risk.label}
          </span>
          {detail.isSuspended && (
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 font-medium border border-orange-200">
              <PauseCircle className="h-3.5 w-3.5" /> Suspended
            </span>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Overall',     value: `${detail.overallProgressPct}%` },
          { label: 'Completed',   value: detail.completedModules },
          { label: 'In Progress', value: detail.inProgressModules },
          { label: 'Not Started', value: detail.notStartedModules ?? (detail.totalModules - detail.enrolledModules) },
        ].map((s) => (
          <div key={s.label} className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <ProgressBar pct={detail.overallProgressPct} riskLevel={detail.riskLevel} />

      {/* Current position */}
      {detail.currentModuleTitle && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <MapPin className="h-4 w-4 text-blue-500 flex-shrink-0" />
          <div>
            <p className="text-xs text-blue-500 font-medium uppercase tracking-wide">Currently working on</p>
            <p className="font-semibold text-blue-800">{detail.currentModuleTitle}</p>
            <p className="text-xs text-blue-600">Lesson {detail.currentLessonIndex} · {detail.currentModuleProgress}% through this module</p>
          </div>
        </div>
      )}

      {/* Metadata row */}
      <div className="flex items-center gap-6 bg-gray-50 rounded-lg p-3 flex-wrap">
        <div>
          <p className="text-gray-500 text-xs">Deadline</p>
          <p className={`font-medium ${daysColor(detail.daysLeft)}`}>
            {detail.fellow.fellowData?.deadline
              ? new Date(detail.fellow.fellowData.deadline).toLocaleDateString('en-KE', { dateStyle: 'medium' })
              : '—'}
          </p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Days Left</p>
          <p className={`font-medium ${daysColor(detail.daysLeft)}`}>{daysLabel(detail.daysLeft)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Last Active</p>
          <p className="font-medium text-gray-700">{fmtDate(detail.lastAccessedAt)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Cohort</p>
          <p className="font-medium text-gray-700">{detail.fellow.fellowData?.cohort || '—'}</p>
        </div>
      </div>

      {/* Per-category module breakdown */}
      {detail.categories?.length > 0 ? (
        <div className="space-y-4">
          {detail.categories.map((cat) => (
            <div key={cat.categoryId} className="border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
                <div>
                  <p className="font-semibold text-gray-800">{cat.categoryName}</p>
                  <p className="text-xs text-gray-500">{cat.completedModules}/{cat.totalModules} modules completed</p>
                </div>
                <ProgressBar pct={cat.progressPct} riskLevel="ON_TRACK" />
              </div>
              <div className="divide-y">
                {cat.modules.map((mod) => {
                  const s = STATUS_STYLE[mod.status] || STATUS_STYLE.not_started;
                  return (
                    <div key={mod.moduleId} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{mod.title}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-xs text-gray-400 uppercase">{mod.level}</span>
                            {mod.status !== 'not_started' && (
                              <span className="text-xs text-gray-400">{mod.completedLessons}/{mod.totalLessons} lessons</span>
                            )}
                            {mod.completedAt && (
                              <span className="text-xs text-green-600">Completed {fmtDate(mod.completedAt)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                        {mod.status !== 'not_started' && (
                          <div className="w-24">
                            <ProgressBar pct={mod.progress} riskLevel="ON_TRACK" size="sm" />
                          </div>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.badge}`}>{s.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 text-center py-6">No categories assigned to this fellow.</p>
      )}
    </div>
  );
}

// ─── Analytics Tab ────────────────────────────────────────────────────────────

function AnalyticsTab({ analytics, loading, categories, selectedCategory, onCategoryChange, onRefresh }) {
  // Trigger load on first render of this tab
  useEffect(() => { if (!analytics && !loading) onRefresh(); }, []); // eslint-disable-line

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Learning Activity Patterns</h2>
          <p className="text-sm text-gray-500">Based on the last 90 days of module access activity</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedCategory} onValueChange={(v) => { onCategoryChange(v); onRefresh(); }}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!analytics ? (
        <div className="text-center py-16 text-gray-400">
          <Brain className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p>No analytics data available yet.</p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Sessions', value: analytics.totalSessions, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Active Fellows', value: analytics.activeFellows, icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Peak Hour',   value: analytics.peakHour?.label || '—', icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
              { label: 'Peak Day',    value: analytics.peakDay?.label  || '—', icon: Calendar, color: 'text-orange-600', bg: 'bg-orange-50' },
            ].map((c) => {
              const Icon = c.icon;
              return (
                <Card key={c.label}>
                  <CardContent className="p-4">
                    <div className={`inline-flex p-2 rounded-lg ${c.bg} mb-3`}>
                      <Icon className={`h-4 w-4 ${c.color}`} />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{c.value}</p>
                    <p className="text-xs font-medium text-gray-500 mt-0.5">{c.label}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Hour-of-day chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-blue-500" />
                Activity by Hour of Day
              </CardTitle>
            </CardHeader>
            <CardContent>
              <HourChart data={analytics.hourOfDay} />
            </CardContent>
          </Card>

          {/* Day-of-week chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-green-500" />
                Activity by Day of Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DayChart data={analytics.dayOfWeek} />
            </CardContent>
          </Card>

          {/* 30-day trend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                Daily Activity (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DailyTrend data={analytics.dailySeries} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// ─── Chart Helpers (no external deps — pure CSS bars) ─────────────────────────

function HourChart({ data }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="space-y-1">
      <div className="flex items-end gap-1 h-32">
        {data.map((d) => {
          const pct = Math.round((d.count / max) * 100);
          const isPeak = d.count === max;
          return (
            <div key={d.hour} className="flex-1 flex flex-col items-center gap-0.5" title={`${d.label}: ${d.count} sessions`}>
              <div className="w-full flex flex-col justify-end" style={{ height: '100px' }}>
                <div
                  className={`w-full rounded-t transition-all ${isPeak ? 'bg-blue-500' : 'bg-blue-200 hover:bg-blue-400'}`}
                  style={{ height: `${Math.max(pct, 2)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-1">
        {data.filter((_, i) => i % 3 === 0).map((d) => (
          <span key={d.hour} className="flex-1 text-[9px] text-gray-400 text-center">{d.label}</span>
        ))}
      </div>
      <p className="text-xs text-gray-400 text-center mt-1">
        Peak learning time: <strong className="text-gray-600">{data.find((d) => d.count === max)?.label}</strong> ({max} sessions)
      </p>
    </div>
  );
}

function DayChart({ data }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-3 h-32 px-2">
      {data.map((d) => {
        const pct = Math.round((d.count / max) * 100);
        const isPeak = d.count === max;
        return (
          <div key={d.day} className="flex-1 flex flex-col items-center gap-1" title={`${d.label}: ${d.count} sessions`}>
            <span className="text-xs text-gray-500 font-medium">{d.count || ''}</span>
            <div className="w-full flex flex-col justify-end" style={{ height: '80px' }}>
              <div
                className={`w-full rounded-t transition-all ${isPeak ? 'bg-green-500' : 'bg-green-200 hover:bg-green-400'}`}
                style={{ height: `${Math.max(pct, 2)}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 font-medium">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function DailyTrend({ data }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="space-y-2">
      <div className="flex items-end gap-0.5 h-20">
        {data.map((d, i) => {
          const pct = Math.round((d.count / max) * 100);
          return (
            <div key={i} className="flex-1 flex flex-col justify-end" title={`${d.date}: ${d.count}`} style={{ height: '80px' }}>
              <div
                className={`w-full rounded-sm transition-all ${d.count > 0 ? 'bg-purple-400 hover:bg-purple-600' : 'bg-gray-100'}`}
                style={{ height: `${Math.max(d.count > 0 ? pct : 2, 2)}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}
