'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Award,
  Bell,
  CheckCircle2,
  Loader2,
  Mail,
  RefreshCw,
  User,
} from 'lucide-react';
import adminService, { bulkEmailService } from '@/lib/api/adminService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { buildReminderEmail } from '../_components/reminder-email-template';

function asArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.fellows)) return payload.fellows;
  if (Array.isArray(payload?.modules)) return payload.modules;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function normalizeModule(module) {
  const progress = Math.max(0, Math.min(100, Number(module?.progress || 0)));
  return {
    moduleId: module?.moduleId || module?._id || module?.id || '',
    title: module?.title || module?.moduleTitle || 'Untitled module',
    order: Number(module?.order ?? module?.moduleOrder ?? 0),
    progress,
    isCompleted: Boolean(module?.isCompleted || progress === 100),
    completedLessons: Number(module?.completedLessons || 0),
    totalLessons: Number(module?.totalLessons || 0),
    finalAssessmentPassed: Boolean(module?.finalAssessmentPassed),
  };
}

function statusForProgress(progress, totalModules = 1) {
  if (!totalModules || progress === 0) return 'notstarted';
  if (progress === 100) return 'completed';
  return 'inprogress';
}

function statusLabel(status) {
  if (status === 'completed') return 'Completed';
  if (status === 'inprogress') return 'In Progress';
  return 'Not Started';
}

function statusBadgeVariant(status) {
  if (status === 'completed') return 'bg-green-50 text-green-700 border-green-200';
  if (status === 'inprogress') return 'bg-yellow-50 text-yellow-700 border-yellow-200';
  return 'bg-red-50 text-red-700 border-red-200';
}

function ProgressBar({ value }) {
  const color = value === 100 ? 'bg-green-500' : value > 0 ? 'bg-yellow-400' : 'bg-red-400';
  const track = value === 100 ? 'bg-green-100' : value > 0 ? 'bg-yellow-100' : 'bg-red-100';
  return (
    <div className="flex items-center gap-3">
      <div className={`h-2.5 w-full overflow-hidden rounded-full ${track}`}>
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="w-11 text-right text-sm font-semibold text-gray-700">{value}%</span>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="rounded-lg border bg-gray-50 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 font-semibold text-gray-900">{value || '—'}</p>
    </div>
  );
}

export default function FellowProgressDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [fellow, setFellow] = useState(null);
  const [loading, setLoading] = useState(true);

  const [reminderOpen, setReminderOpen] = useState(false);
  const [personalNote, setPersonalNote] = useState('');
  const [sendingReminder, setSendingReminder] = useState(false);

  const [certOpen, setCertOpen] = useState(false);
  const [sendingCert, setSendingCert] = useState(false);

  const fetchFellow = useCallback(async () => {
    setLoading(true);

    // Try sessionStorage first (populated by the table's View Details click)
    try {
      const cached = sessionStorage.getItem('fellow_progress_detail');
      if (cached) {
        const parsed = JSON.parse(cached);
        // Confirm it matches this page's id (could be email or MongoDB id)
        const decodedId = decodeURIComponent(id);
        if (parsed._id === decodedId || parsed.email === decodedId) {
          setFellow(parsed);
          setLoading(false);
          return;
        }
      }
    } catch {}

    // Fall back to API — only works when _id is a real MongoDB ObjectId
    try {
      const decodedId = decodeURIComponent(id);
      const res = await adminService.getFellowProgressDetail(decodedId);
      const raw = res?.fellow || res?.data || res;
      const modules = asArray(raw?.modules || res?.modules || []).map(normalizeModule).sort((a, b) => a.order - b.order);
      const totalModules = modules.length;
      const completedModules = modules.filter((m) => m.progress === 100 || m.isCompleted).length;
      const overallProgress = totalModules
        ? Math.round((completedModules / totalModules) * 100)
        : 0;

      const MONGO_ID_RE = /^[a-f0-9]{24}$/i;
      const mongoId = [raw?._id, raw?.userId, raw?.user?._id, raw?.student?._id, raw?.id]
        .find((v) => v && MONGO_ID_RE.test(String(v))) ?? null;

      setFellow({
        _id: mongoId || raw?.email || decodedId,
        mongoId,
        fullName: raw?.fullName || [raw?.firstName, raw?.lastName].filter(Boolean).join(' ') || 'Unnamed fellow',
        email: raw?.email || '—',
        fellowId: raw?.fellowId || raw?.fellowData?.fellowId || '—',
        cohort: raw?.cohort || raw?.fellowData?.cohort || '—',
        region: raw?.region || raw?.fellowData?.region || '—',
        track: raw?.track || raw?.fellowData?.track || '—',
        modules,
        totalModules,
        completedModules,
        overallProgress,
        status: statusForProgress(overallProgress, totalModules),
      });
    } catch {
      toast.error('Failed to load fellow details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchFellow();
  }, [fetchFellow]);

  // Resolve the real MongoDB ObjectId for API calls.
  // If not cached on the fellow object, look it up via the fellows list using email.
  const resolveApiId = useCallback(async () => {
    if (fellow?.mongoId) return fellow.mongoId;
    const email = fellow?.email;
    if (!email || email === '—') return null;
    try {
      const res = await adminService.getAllFellows({ search: email, limit: 10 });
      const list = Array.isArray(res) ? res : (res?.fellows ?? res?.data ?? []);
      const match = list.find(
        (f) => f.email === email || f.user?.email === email || f.fellowData?.email === email,
      );
      const found = match?._id || match?.userId || match?.user?._id;
      if (found) {
        // Cache it so subsequent calls don't need another fetch
        setFellow((prev) => prev ? { ...prev, mongoId: found } : prev);
        return found;
      }
    } catch {}
    return null;
  }, [fellow]);

  const handleSendReminder = async () => {
    setSendingReminder(true);
    try {
      const apiId = await resolveApiId();
      if (!apiId) {
        toast.error('Could not resolve fellow ID — please try again or contact support.');
        return;
      }
      const htmlBody = buildReminderEmail({
        name: fellow.fullName,
        modules: fellow.modules,
        overallProgress: fellow.overallProgress,
        personalNote: personalNote.trim(),
      });
      await bulkEmailService.send({
        filterType: 'manual',
        manualUserIds: [apiId],
        subject: `Keep Going, ${fellow.fullName.split(' ')[0]}! Your Learning Update 🎯`,
        body: htmlBody,
      });
      toast.success('Reminder sent successfully');
      setReminderOpen(false);
      setPersonalNote('');
    } catch {
      toast.error('Failed to send reminder');
    } finally {
      setSendingReminder(false);
    }
  };

  const handleSendCertificate = async () => {
    setSendingCert(true);
    try {
      const apiId = await resolveApiId();
      if (!apiId) {
        toast.error('Could not resolve fellow ID — please try again or contact support.');
        return;
      }
      await adminService.sendBulkEmail(
        [apiId],
        'Congratulations — Your Certificate of Completion',
        `Dear ${fellow?.fullName},\n\nCongratulations on completing the programme! Please find your certificate of completion attached.\n\nBest regards,\nARIN Team`,
      );
      toast.success('Certificate email sent successfully');
      setCertOpen(false);
    } catch {
      toast.error('Failed to send certificate');
    } finally {
      setSendingCert(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!fellow) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 text-gray-500">
        <p>Fellow not found.</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  const isCompleted = fellow.status === 'completed';
  const isInProgress = fellow.status === 'inprogress';

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Back + header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-950">{fellow.fullName}</h1>
            <p className="text-sm text-gray-500">{fellow.email}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${statusBadgeVariant(fellow.status)}`}>
            {statusLabel(fellow.status)}
          </span>
          <Button variant="outline" size="sm" onClick={fetchFellow}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          {/* Reminder button — only for in-progress fellows */}
          {isInProgress && (
            <Button
              size="sm"
              variant="outline"
              className="border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
              onClick={() => setReminderOpen(true)}
            >
              <Bell className="mr-2 h-4 w-4" />
              Send Reminder
            </Button>
          )}
          {/* Certificate button — only for completed fellows */}
          {isCompleted && (
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => setCertOpen(true)}
            >
              <Award className="mr-2 h-4 w-4" />
              Send Certificate
            </Button>
          )}
        </div>
      </div>

      {/* Overall progress card */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">Overall Progress</p>
            <p className="text-sm font-bold text-gray-900">{fellow.overallProgress}%</p>
          </div>
          <ProgressBar value={fellow.overallProgress} />
          <p className="mt-2 text-xs text-gray-500">
            {fellow.completedModules} of {fellow.totalModules} modules completed
          </p>
        </CardContent>
      </Card>

      {/* Fellow info */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-gray-500" />
            Fellow Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <InfoItem label="Fellow ID" value={fellow.fellowId} />
            <InfoItem label="Cohort" value={fellow.cohort} />
            <InfoItem label="Region" value={fellow.region} />
            <InfoItem label="Track" value={fellow.track} />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <InfoItem label="Full Name" value={fellow.fullName} />
            <InfoItem label="Email" value={fellow.email} />
          </div>
        </CardContent>
      </Card>

      {/* Module progress */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Module Progress</CardTitle>
        </CardHeader>
        <CardContent>
          {fellow.modules.length ? (
            <div className="space-y-3">
              {fellow.modules.map((module) => (
                <div
                  key={`${module.moduleId || module.order}-${module.title}`}
                  className="rounded-lg border p-4"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-950">
                        Module {module.order || '—'}: {module.title}
                      </p>
                      <p className="mt-0.5 text-sm text-gray-500">
                        {module.completedLessons}/{module.totalLessons} lessons completed
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-gray-800">{module.progress}%</span>
                  </div>
                  <ProgressBar value={module.progress} />
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className={`rounded-full border px-2.5 py-1 font-semibold ${statusBadgeVariant(statusForProgress(module.progress))}`}>
                      {statusLabel(statusForProgress(module.progress))}
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-1 font-semibold ${
                        module.finalAssessmentPassed
                          ? 'border-green-200 bg-green-50 text-green-700'
                          : 'border-gray-200 bg-gray-50 text-gray-600'
                      }`}
                    >
                      Final assessment {module.finalAssessmentPassed ? 'passed' : 'not passed'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border p-8 text-center text-gray-500">
              No module enrollment records found for this fellow.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reminder dialog */}
      <Dialog open={reminderOpen} onOpenChange={(open) => { if (!sendingReminder) setReminderOpen(open); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-yellow-600" />
              Send Reminder — {fellow.fullName}
            </DialogTitle>
            <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" /> {fellow.email}
            </p>
          </DialogHeader>

          {sendingReminder ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 px-6">
              <div className="relative flex items-center justify-center">
                <Loader2 className="h-14 w-14 animate-spin text-yellow-400" />
                <Bell className="absolute h-6 w-6 text-yellow-600" />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-800">Sending reminder…</p>
                <p className="mt-1 text-sm text-gray-500">Please wait, this may take a moment.</p>
              </div>
            </div>
          ) : (
            <Tabs defaultValue="compose" className="flex flex-col flex-1 overflow-hidden">
              <TabsList className="mx-6 mt-3 w-fit shrink-0">
                <TabsTrigger value="compose">Compose</TabsTrigger>
                <TabsTrigger value="preview">Email Preview</TabsTrigger>
              </TabsList>

              {/* Compose tab */}
              <TabsContent value="compose" className="flex-1 overflow-y-auto px-6 pb-6 mt-0">
                <div className="space-y-4 pt-4">
                  {/* In-progress modules summary */}
                  {fellow.modules.filter((m) => m.progress < 100).length > 0 && (
                    <div className="rounded-xl border bg-indigo-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 mb-2">
                        Modules included in this reminder
                      </p>
                      <div className="space-y-2">
                        {fellow.modules.filter((m) => m.progress < 100).map((m) => (
                          <div key={m.moduleId || m.title} className="flex items-center justify-between gap-3">
                            <span className="text-sm font-medium text-gray-800 truncate">
                              {m.order ? `Module ${m.order}: ` : ''}{m.title}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-indigo-200">
                                <div
                                  className="h-full rounded-full bg-indigo-500"
                                  style={{ width: `${m.progress}%` }}
                                />
                              </div>
                              <span className="text-xs font-bold text-indigo-600 w-8 text-right">
                                {m.progress}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="personal-note">
                      Personal note <span className="text-gray-400 font-normal">(optional)</span>
                    </Label>
                    <Textarea
                      id="personal-note"
                      rows={3}
                      placeholder={`Add a personal message to ${fellow.fullName.split(' ')[0]}…`}
                      value={personalNote}
                      onChange={(e) => setPersonalNote(e.target.value)}
                      className="resize-none"
                    />
                    <p className="text-xs text-gray-400">
                      This note will appear highlighted in the email. The fellow's name, modules,
                      and progress are included automatically.
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => setReminderOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      className="bg-yellow-500 hover:bg-yellow-600 text-white"
                      onClick={handleSendReminder}
                    >
                      <Bell className="mr-2 h-4 w-4" />
                      Send Reminder
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Preview tab */}
              <TabsContent value="preview" className="flex-1 overflow-hidden mt-0 px-6 pb-6">
                <div className="h-full rounded-xl border overflow-hidden mt-4" style={{ minHeight: 420 }}>
                  <iframe
                    title="Email preview"
                    className="w-full h-full"
                    style={{ minHeight: 420, border: 'none' }}
                    srcDoc={buildReminderEmail({
                      name: fellow.fullName,
                      modules: fellow.modules,
                      overallProgress: fellow.overallProgress,
                      personalNote: personalNote.trim(),
                    })}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-3">
                  <Button variant="outline" onClick={() => setReminderOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    className="bg-yellow-500 hover:bg-yellow-600 text-white"
                    onClick={handleSendReminder}
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    Send Reminder
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Certificate dialog */}
      <Dialog open={certOpen} onOpenChange={(open) => { if (!sendingCert) setCertOpen(open); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-green-600" />
              Send Certificate to {fellow.fullName}
            </DialogTitle>
          </DialogHeader>

          {/* Loading overlay */}
          {sendingCert ? (
            <div className="flex flex-col items-center justify-center gap-4 py-10">
              <div className="relative flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-green-500" />
                <Award className="absolute h-5 w-5 text-green-600" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-800">Sending certificate…</p>
                <p className="mt-1 text-sm text-gray-500">Please wait, this may take a moment.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="rounded-md border bg-green-50 p-3 text-sm text-green-800">
                <p>
                  This will send a <strong>Certificate of Completion</strong> email to:
                </p>
                <p className="flex items-center gap-1 mt-1">
                  <Mail className="h-3.5 w-3.5" />
                  {fellow.email}
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-md bg-gray-50 border p-3 text-sm text-gray-700">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                <span>
                  <strong>{fellow.fullName}</strong> has completed all {fellow.totalModules} modules
                  with {fellow.overallProgress}% overall progress.
                </span>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCertOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleSendCertificate}
                >
                  <Award className="mr-2 h-4 w-4" />
                  Send Certificate
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
