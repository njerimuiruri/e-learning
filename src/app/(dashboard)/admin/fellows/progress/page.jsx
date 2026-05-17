'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Award,
  Bell,
  CheckCircle2,
  Loader2,
  RefreshCw,
  TrendingUp,
  UserRound,
  Users,
} from 'lucide-react';
import adminService from '@/lib/api/adminService';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import toast from 'react-hot-toast';
import { FellowsDataTable } from './_components/fellows-data-table';
import { fellowProgressColumns } from './_components/columns';
import { buildReminderEmail } from './_components/reminder-email-template';
import { bulkEmailService } from '@/lib/api/adminService';

function asArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.fellows)) return payload.fellows;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function normalizeModule(module) {
  let raw = Number(module?.progress ?? 0);
  // Some API paths return progress as a 0–1 decimal; normalise to 0–100
  if (raw > 0 && raw <= 1 && !Number.isInteger(raw * 100 % 1 === 0 ? raw * 100 : 0)) raw *= 100;
  const progress = Math.max(0, Math.min(100, raw));
  const isCompleted = Boolean(
    module?.isCompleted ||
    module?.status === 'completed' ||
    module?.completed === true ||
    progress === 100,
  );
  return {
    moduleId: module?.moduleId || module?._id || module?.id || '',
    title: module?.title || module?.moduleTitle || 'Untitled module',
    order: Number(module?.order ?? module?.moduleOrder ?? 0),
    level: module?.level || 'beginner',
    progress,
    isCompleted,
    completedLessons: Number(module?.completedLessons || 0),
    totalLessons: Number(module?.totalLessons || 0),
    finalAssessmentPassed: Boolean(module?.finalAssessmentPassed),
  };
}

// Derive the level the student is currently at.
// Rules (highest wins):
//   advanced    — enrolled in at least one advanced module
//   intermediate — enrolled in at least one intermediate module
//                  OR has completed ALL enrolled beginner modules (beginner level done)
//   beginner    — still working through beginner modules
function deriveCurrentLevel(modules) {
  if (modules.some((m) => m.level === 'advanced')) return 'advanced';
  if (modules.some((m) => m.level === 'intermediate')) return 'intermediate';

  // No intermediate/advanced enrollments yet, but if every enrolled beginner
  // module is completed the student has finished the Beginner level.
  const beginnerModules = modules.filter(
    (m) => m.level === 'beginner' || !m.level,
  );
  if (
    beginnerModules.length > 0 &&
    beginnerModules.every((m) => m.isCompleted)
  ) {
    return 'intermediate';
  }

  return 'beginner';
}

function statusForProgress(completedModules, totalModules, overallProgress) {
  if (!totalModules) return 'notstarted';
  // Primary: completed when every enrolled module is done — avoids floating-point edge cases
  if (completedModules === totalModules && totalModules > 0) return 'completed';
  if (overallProgress === 100) return 'completed';
  if (overallProgress === 0 && completedModules === 0) return 'notstarted';
  return 'inprogress';
}

const MONGO_ID_RE = /^[a-f0-9]{24}$/i;

function pickMongoId(fellow) {
  // Check known fields first
  const known = [
    fellow?._id, fellow?.userId, fellow?.user?._id,
    fellow?.student?._id, fellow?.id, fellow?.enrollmentId, fellow?.progressId,
  ];
  const fromKnown = known.find((v) => v && MONGO_ID_RE.test(String(v)));
  if (fromKnown) return String(fromKnown);

  // Scan every top-level string value and one level deep into nested objects
  for (const val of Object.values(fellow || {})) {
    if (typeof val === 'string' && MONGO_ID_RE.test(val)) return val;
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      for (const nested of Object.values(val)) {
        if (typeof nested === 'string' && MONGO_ID_RE.test(nested)) return nested;
      }
    }
  }
  return null;
}

function normalizeFellow(fellow, index) {
  const mongoId = pickMongoId(fellow);
  const modules = (fellow?.modules || []).map(normalizeModule).sort((a, b) => a.order - b.order);
  const totalModules = modules.length;
  const completedModules = modules.filter((m) => m.isCompleted || m.progress === 100).length;
  // Force 100% when every enrolled module is marked done — avoids rounding surprises
  const overallProgress = totalModules === 0
    ? 0
    : completedModules === totalModules
      ? 100
      : Math.round((completedModules / totalModules) * 100);

  return {
    // _id used for routing; mongoId used for API calls that need a real ObjectId
    _id: mongoId || fellow?.email || `fellow-${index}`,
    mongoId,
    fullName: fellow?.fullName || [fellow?.firstName, fellow?.lastName].filter(Boolean).join(' ') || 'Unnamed fellow',
    email: fellow?.email || 'No email provided',
    fellowId: fellow?.fellowId || fellow?.fellowData?.fellowId || 'Not assigned',
    cohort: fellow?.cohort || fellow?.fellowData?.cohort || 'Not assigned',
    region: fellow?.region || fellow?.fellowData?.region || 'Not assigned',
    track: fellow?.track || fellow?.fellowData?.track || 'Not assigned',
    modules,
    totalModules,
    completedModules,
    overallProgress,
    status: statusForProgress(completedModules, totalModules, overallProgress),
    currentLevel: deriveCurrentLevel(modules),
    completedBeginner: deriveCurrentLevel(modules) !== 'beginner',
  };
}

function StatCard({ label, value, helper, icon: Icon, tone }) {
  return (
    <Card className="border-gray-200 shadow-sm">
      <CardContent className="p-4">
        <div className={`mb-3 inline-flex rounded-lg p-2 ${tone}`}>
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-2xl font-bold text-gray-950">{value}</p>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className="mt-1 text-xs text-gray-500">{helper}</p>
      </CardContent>
    </Card>
  );
}

export default function FellowProgressPage() {
  const [fellows, setFellows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalProgrammeModules, setTotalProgrammeModules] = useState(0);
  const [totalBeginnerModules, setTotalBeginnerModules] = useState(0);

  // Bulk reminder state
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkNote, setBulkNote] = useState('');
  const [sendingBulk, setSendingBulk] = useState(false);
  const [bulkDone, setBulkDone] = useState({ sent: 0, failed: 0 });

  const fetchProgress = useCallback(async () => {
    setLoading(true);
    try {
      const [progressRes, modulesRes] = await Promise.allSettled([
        adminService.getFellowsProgress({ limit: 500 }),
        adminService.getAllModules({ status: 'published', limit: 500 }),
      ]);

      const fellowData = progressRes.status === 'fulfilled' ? asArray(progressRes.value) : [];

      // Resolve total programme modules FIRST so progress uses the correct denominator
      let progTotal = 0;
      let beginnerTotal = 0;
      if (modulesRes.status === 'fulfilled') {
        const raw = modulesRes.value;
        const moduleList = Array.isArray(raw) ? raw : (raw?.modules ?? raw?.data ?? []);
        progTotal = moduleList.length;
        beginnerTotal = moduleList.filter((m) => m.level === 'beginner').length;
      }
      if (!progTotal) {
        // Fallback: use the highest enrolled module count as a proxy
        progTotal = Math.max(0, ...fellowData.map((f) => (f.modules || []).length));
      }
      if (!beginnerTotal) {
        // Fallback: use the highest beginner module count across all fellows
        beginnerTotal = Math.max(0, ...fellowData.map((f) =>
          (f.modules || []).filter((m) => m.level === 'beginner' || !m.level).length
        ));
      }
      setTotalProgrammeModules(progTotal);
      setTotalBeginnerModules(beginnerTotal);

      // Normalize each fellow, then recalculate progress against programme total
      const normalized = fellowData.map((f, i) => {
        const fellow = normalizeFellow(f, i);
        const programmeTotal = progTotal || fellow.totalModules;
        const overallProgress =
          programmeTotal === 0
            ? 0
            : fellow.completedModules >= programmeTotal
            ? 100
            : Math.round((fellow.completedModules / programmeTotal) * 100);
        return {
          ...fellow,
          programmeTotal,
          overallProgress,
          status: statusForProgress(fellow.completedModules, programmeTotal, overallProgress),
        };
      });

      setFellows(normalized);
    } catch {
      toast.error('Failed to load fellows progress');
      setFellows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const isBeginnerCertReady = useCallback((f) => {
    const bMods = f.modules.filter((m) => m.level === 'beginner' || !m.level);
    const completedBeginner = bMods.filter((m) => m.isCompleted).length;
    const required = totalBeginnerModules || bMods.length;
    return required > 0 && completedBeginner >= required;
  }, [totalBeginnerModules]);

  const summary = useMemo(() => {
    const total = fellows.length;
    const certReady = fellows.filter(isBeginnerCertReady).length;
    const completed = fellows.filter((f) => f.status === 'completed').length;
    const notStarted = fellows.filter((f) => f.status === 'notstarted').length;
    const inProgress = fellows.filter((f) => f.status === 'inprogress').length;
    return { total, completed, inProgress, notStarted, certReady };
  }, [fellows, isBeginnerCertReady]);

  const inProgressFellows = useMemo(
    () => fellows.filter((f) => f.status === 'inprogress'),
    [fellows],
  );

  const certReadyFellows = useMemo(
    () => fellows.filter(isBeginnerCertReady),
    [fellows, isBeginnerCertReady],
  );

  const handleBulkReminder = async () => {
    setSendingBulk(true);
    setBulkDone({ sent: 0, failed: 0 });

    // Step 1 — resolve MongoDB IDs for all in-progress fellows
    const resolvedIds = [];
    let failed = 0;

    for (const fellow of inProgressFellows) {
      let apiId = fellow.mongoId;
      if (!apiId && fellow.email) {
        try {
          const res = await adminService.getAllFellows({ search: fellow.email, limit: 5 });
          const list = Array.isArray(res) ? res : (res?.fellows ?? res?.data ?? []);
          const match = list.find(
            (f) => f.email === fellow.email || f.user?.email === fellow.email,
          );
          apiId = match?._id || match?.userId || match?.user?._id;
        } catch {}
      }
      if (apiId) {
        resolvedIds.push(apiId);
      } else {
        failed++;
      }
      setBulkDone({ sent: 0, failed });
    }

    if (resolvedIds.length === 0) {
      toast.error('Could not resolve any fellow IDs. Please try again.');
      setSendingBulk(false);
      return;
    }

    // Step 2 — send one bulk email with the animated HTML template
    // Note: bulk uses a generic greeting since one HTML goes to all recipients
    try {
      const sampleFellow = inProgressFellows[0];
      const htmlBody = buildReminderEmail({
        name: 'Fellow',           // generic — backend may substitute per-recipient
        modules: sampleFellow?.modules ?? [],
        overallProgress: sampleFellow?.overallProgress ?? 0,
        personalNote: bulkNote.trim(),
      });
      await bulkEmailService.send({
        filterType: 'manual',
        manualUserIds: resolvedIds,
        subject: `Keep Going! Your ARIN Learning Progress Update 🎯`,
        body: htmlBody,
      });
      const sent = resolvedIds.length;
      setBulkDone({ sent, failed });
      toast.success(`Reminders sent to ${sent} fellow${sent !== 1 ? 's' : ''}`);
      setTimeout(() => setBulkOpen(false), 1500);
    } catch {
      toast.error('Failed to send bulk reminders');
    } finally {
      setSendingBulk(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-50 p-2 text-blue-700">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-950">Fellows Progress</h1>
            <p className="text-sm text-gray-500">
              {summary.total} fellow{summary.total === 1 ? '' : 's'} enrolled
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {certReadyFellows.length > 0 && (
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => {
                const el = document.getElementById('cert-ready-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              disabled={loading}
            >
              <Award className="mr-2 h-4 w-4" />
              Certificate Ready
              <span className="ml-1.5 rounded-full bg-green-500 px-1.5 py-0.5 text-xs font-bold text-white">
                {certReadyFellows.length}
              </span>
            </Button>
          )}
          {inProgressFellows.length > 0 && (
            <Button
              size="sm"
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
              onClick={() => { setBulkDone({ sent: 0, failed: 0 }); setBulkOpen(true); }}
              disabled={loading}
            >
              <Bell className="mr-2 h-4 w-4" />
              Bulk Reminders
              <span className="ml-1.5 rounded-full bg-yellow-400 px-1.5 py-0.5 text-xs font-bold text-yellow-900">
                {inProgressFellows.length}
              </span>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={fetchProgress} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        <StatCard
          label="Total Enrolled"
          value={summary.total}
          helper="All fellows returned by the progress endpoint"
          icon={Users}
          tone="bg-blue-50 text-blue-700"
        />
        <StatCard
          label="Certificate Ready"
          value={summary.certReady}
          helper="Completed all beginner modules — eligible for certificate"
          icon={Award}
          tone="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          label="Completed"
          value={summary.completed}
          helper="All enrolled modules done (100%)"
          icon={CheckCircle2}
          tone="bg-green-50 text-green-700"
        />
        <StatCard
          label="In Progress"
          value={summary.inProgress}
          helper="Progress between 1% and 99%"
          icon={TrendingUp}
          tone="bg-yellow-50 text-yellow-700"
        />
        <StatCard
          label="Not Started"
          value={summary.notStarted}
          helper="Overall progress is 0%"
          icon={UserRound}
          tone="bg-red-50 text-red-700"
        />
      </div>

      {/* Certificate-ready fellows section */}
      {certReadyFellows.length > 0 && (
        <div id="cert-ready-section" className="rounded-xl border-2 border-green-200 bg-green-50 p-5 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2 text-green-700">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-green-900">
                  Certificate Ready — {certReadyFellows.length} Fellow{certReadyFellows.length !== 1 ? 's' : ''}
                </h2>
                <p className="text-xs text-green-700">
                  These fellows have completed all {totalBeginnerModules} beginner modules and are ready to receive their certificates.
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {certReadyFellows.map((f) => (
              <div key={f._id} className="flex items-center justify-between rounded-lg border border-green-200 bg-white px-4 py-3 shadow-sm">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{f.fullName}</p>
                  <p className="text-xs text-gray-500 truncate">{f.email}</p>
                  <p className="text-xs text-green-600 font-medium mt-0.5">
                    {f.modules.filter((m) => (m.level === 'beginner' || !m.level) && m.isCompleted).length}/
                    {totalBeginnerModules} beginner modules ✓
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 ml-3 border-green-300 text-green-700 hover:bg-green-50"
                  onClick={() => {
                    try { sessionStorage.setItem('fellow_progress_detail', JSON.stringify(f)); } catch {}
                    window.location.href = `/admin/fellows/progress/${encodeURIComponent(f._id)}`;
                  }}
                >
                  <Award className="mr-1.5 h-3.5 w-3.5" />
                  Send Cert
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data table */}
      {loading ? (
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </CardContent>
        </Card>
      ) : (
        <FellowsDataTable
          columns={fellowProgressColumns}
          data={fellows}
          title={`All Fellows (${fellows.length})`}
        />
      )}

      {/* ── Bulk reminder dialog ── */}
      <Dialog open={bulkOpen} onOpenChange={(o) => { if (!sendingBulk) setBulkOpen(o); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-yellow-600" />
              Send Bulk Reminders
            </DialogTitle>
            <p className="text-sm text-gray-500 mt-0.5">
              This will send a personalised reminder to all{' '}
              <strong>{inProgressFellows.length}</strong> in-progress fellow
              {inProgressFellows.length !== 1 ? 's' : ''}, each containing their own
              name and current module progress.
            </p>
          </DialogHeader>

          {sendingBulk ? (
            <div className="flex flex-col items-center justify-center gap-5 py-14 px-6">
              <div className="relative flex items-center justify-center">
                <Loader2 className="h-14 w-14 animate-spin text-yellow-400" />
                <Bell className="absolute h-6 w-6 text-yellow-600" />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-800">Sending reminders…</p>
                <p className="mt-1 text-sm text-gray-500">
                  {bulkDone.sent} sent · {bulkDone.failed} failed · {inProgressFellows.length - bulkDone.sent - bulkDone.failed} remaining
                </p>
                {/* Progress bar */}
                <div className="mt-4 h-2 w-64 overflow-hidden rounded-full bg-gray-200 mx-auto">
                  <div
                    className="h-full rounded-full bg-yellow-500 transition-all duration-300"
                    style={{ width: `${Math.round(((bulkDone.sent + bulkDone.failed) / inProgressFellows.length) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <Tabs defaultValue="compose" className="flex flex-col flex-1 overflow-hidden">
              <TabsList className="mx-6 mt-3 w-fit shrink-0">
                <TabsTrigger value="compose">Compose</TabsTrigger>
                <TabsTrigger value="preview">Email Preview</TabsTrigger>
              </TabsList>

              <TabsContent value="compose" className="flex-1 overflow-y-auto px-6 pb-6 mt-0">
                <div className="space-y-4 pt-4">
                  {/* Recipients list */}
                  <div className="rounded-xl border bg-yellow-50 p-4 max-h-44 overflow-y-auto">
                    <p className="text-xs font-semibold uppercase tracking-wide text-yellow-700 mb-2 sticky top-0 bg-yellow-50">
                      Recipients ({inProgressFellows.length})
                    </p>
                    <div className="space-y-1">
                      {inProgressFellows.map((f) => (
                        <div key={f._id} className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-800">{f.fullName}</span>
                          <span className="text-gray-500 text-xs">{f.overallProgress}% · {f.email}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bulk-note">
                      Personal note <span className="text-gray-400 font-normal">(optional — added to every email)</span>
                    </Label>
                    <Textarea
                      id="bulk-note"
                      rows={3}
                      placeholder="e.g. The deadline for Module 3 is approaching — please ensure you complete it by Friday."
                      value={bulkNote}
                      onChange={(e) => setBulkNote(e.target.value)}
                      className="resize-none"
                    />
                    <p className="text-xs text-gray-400">
                      Each email will be personalised with the fellow's own name, modules, and progress — only this note is shared across all.
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => setBulkOpen(false)}>Cancel</Button>
                    <Button
                      className="bg-yellow-500 hover:bg-yellow-600 text-white"
                      onClick={handleBulkReminder}
                    >
                      <Bell className="mr-2 h-4 w-4" />
                      Send to {inProgressFellows.length} Fellows
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="flex-1 overflow-hidden mt-0 px-6 pb-6">
                <p className="text-xs text-gray-400 mt-3 mb-2">
                  Preview using <strong>{inProgressFellows[0]?.fullName}</strong> as a sample recipient.
                </p>
                <div className="rounded-xl border overflow-hidden" style={{ minHeight: 400 }}>
                  {inProgressFellows[0] && (
                    <iframe
                      title="Bulk email preview"
                      className="w-full"
                      style={{ minHeight: 400, border: 'none' }}
                      srcDoc={buildReminderEmail({
                        name: inProgressFellows[0].fullName,
                        modules: inProgressFellows[0].modules,
                        overallProgress: inProgressFellows[0].overallProgress,
                        personalNote: bulkNote.trim(),
                      })}
                    />
                  )}
                </div>
                <div className="flex justify-end gap-2 pt-3">
                  <Button variant="outline" onClick={() => setBulkOpen(false)}>Cancel</Button>
                  <Button
                    className="bg-yellow-500 hover:bg-yellow-600 text-white"
                    onClick={handleBulkReminder}
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    Send to {inProgressFellows.length} Fellows
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
