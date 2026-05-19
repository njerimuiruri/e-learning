"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2, Clock, RotateCcw, XCircle, MessageSquare, Send,
  Loader2, RefreshCw, Eye, ChevronDown, ChevronUp, FileText,
  Download, Trophy, Star, User, Search, Filter, AlertCircle,
  Sparkles, ThumbsUp, ThumbsDown, Pencil, CheckCheck, Info, Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/ToastProvider";
import capstoneService from "@/lib/api/capstoneService";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_REVISION_ATTEMPTS = 2;

const STATUS_META = {
  draft:                    { label: "Draft",             cls: "bg-gray-100 text-gray-600 border-gray-200" },
  submitted:                { label: "Pending Review",    cls: "bg-amber-50 text-amber-700 border-amber-200" },
  under_review:             { label: "Under Review",      cls: "bg-blue-50 text-blue-700 border-blue-200" },
  revision_requested:       { label: "Revision Requested",cls: "bg-orange-50 text-orange-700 border-orange-200" },
  approved:                 { label: "Proposal Approved", cls: "bg-green-50 text-green-700 border-green-200" },
  implementation:           { label: "Building",          cls: "bg-green-50 text-green-700 border-green-200" },
  implementation_submitted: { label: "Final Submitted",   cls: "bg-purple-50 text-purple-700 border-purple-200" },
  grading:                  { label: "Grading",           cls: "bg-purple-50 text-purple-700 border-purple-200" },
  graded:                   { label: "Graded",            cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  completed:                { label: "Completed",         cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected:                 { label: "Rejected",          cls: "bg-red-50 text-red-700 border-red-200" },
};

const STAGE_LABEL = {
  submitted:                "Proposal Review",
  under_review:             "Proposal Review",
  revision_requested:       "Awaiting Revision",
  approved:                 "Implementation",
  implementation:           "Implementation",
  implementation_submitted: "Final Grading",
  grading:                  "Final Grading",
  graded:                   "Completed",
  completed:                "Completed",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fileExt(name = "") { return name.split(".").pop().toLowerCase(); }

const EXT_COLORS = {
  pdf:  "bg-red-100 text-red-700",
  doc:  "bg-blue-100 text-blue-700",
  docx: "bg-blue-100 text-blue-700",
  csv:  "bg-emerald-100 text-emerald-700",
  xls:  "bg-emerald-100 text-emerald-700",
  xlsx: "bg-emerald-100 text-emerald-700",
  zip:  "bg-purple-100 text-purple-700",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const m = STATUS_META[status] ?? STATUS_META.draft;
  return (
    <span className={`inline-flex items-center gap-1 border rounded-full px-2.5 py-0.5 text-xs font-semibold ${m.cls}`}>
      {m.label}
    </span>
  );
}

function StudentAvatar({ name = "" }) {
  const initials = name.trim().split(" ").slice(0, 2).map((p) => p[0] || "").join("").toUpperCase() || "?";
  const colors   = ["bg-blue-600", "bg-violet-600", "bg-rose-600", "bg-amber-600", "bg-emerald-600"];
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return (
    <div className={`w-9 h-9 rounded-full ${colors[h % colors.length]} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
      {initials}
    </div>
  );
}

function AttachedFileCard({ file }) {
  if (!file) return null;
  const ext  = (file.ext || fileExt(file.fileName || file.name || "")).toUpperCase();
  const name = file.fileName || file.name || "Attached file";
  const url  = file.fileUrl  || file.url  || null;
  const cls  = EXT_COLORS[ext.toLowerCase()] || "bg-gray-100 text-gray-700";
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
      <div className={`px-2 py-0.5 rounded font-bold text-xs shrink-0 ${cls}`}>{ext}</div>
      <p className="text-sm text-gray-800 font-medium truncate flex-1">{name}</p>
      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer" download>
          <Button variant="outline" size="sm" className="h-7 px-2 gap-1 text-xs">
            <Download className="w-3 h-3" /> View
          </Button>
        </a>
      )}
    </div>
  );
}

// ─── Submission list card ─────────────────────────────────────────────────────

function SubmissionCard({ item, onReview }) {
  const studentName = item.studentName || item.student?.fullName || "Unknown Student";
  const stageLabel  = STAGE_LABEL[item.status] || "Proposal Review";
  return (
    <Card className="border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <StudentAvatar name={studentName} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
              <p className="font-semibold text-gray-900 text-sm">{studentName}</p>
              <StatusBadge status={item.status} />
            </div>
            <p className="text-sm text-gray-700 truncate font-medium">{item.title || "Untitled Project"}</p>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="text-xs text-gray-400">{fmtDate(item.submittedAt || item.createdAt)}</span>
              <span className="text-xs text-blue-600 font-medium">{stageLabel}</span>
              {(item.revisionCount > 0) && (
                <span className="text-xs text-amber-600 font-medium">
                  {item.revisionCount}/{MAX_REVISION_ATTEMPTS} revisions
                </span>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={() => onReview(item)}>
            <Eye className="w-3.5 h-3.5" /> Review
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Review sheet ─────────────────────────────────────────────────────────────

function ReviewSheet({ item, open, onClose, onAction }) {
  const { showToast } = useToast();
  const [comment,    setComment]    = useState("");
  const [grade,      setGrade]      = useState("");
  const [gradeFeedback, setGradeFeedback] = useState("");
  const [saving,        setSaving]        = useState("");
  const [gradePassed,   setGradePassed]   = useState(true);
  const [confirmAction, setConfirmAction] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    if (open) { setComment(""); setGrade(""); setGradeFeedback(""); setSaving(""); setConfirmAction(null); setDeleteConfirm(false); }
  }, [open, item?._id]);

  if (!item) return null;

  const isProposalStage = ["submitted", "under_review"].includes(item.status);
  const isFinalStage    = ["implementation_submitted", "grading"].includes(item.status);
  const studentName     = item.studentName || item.student?.fullName || "Student";
  const attemptsLeft    = MAX_REVISION_ATTEMPTS - (item.revisionCount || 0);

  const doAction = async (action) => {
    setSaving(action);
    try {
      if (action === "approve")   await capstoneService.approveProposal(item._id, comment);
      if (action === "revision")  await capstoneService.requestRevision(item._id, comment);
      if (action === "reject")    await capstoneService.rejectCapstone(item._id, comment);
      if (action === "grade") {
        const g = parseInt(grade, 10);
        if (isNaN(g) || g < 0 || g > 100) {
          showToast("Grade must be a number between 0 and 100.", { type: "warning" });
          setSaving("");
          return;
        }
        await capstoneService.gradeCapstone(item._id, {
          grade: g,
          feedback: gradeFeedback.trim(),
          passed: gradePassed,
        });
      }
      if (action === "comment")   await capstoneService.addComment(item._id, comment);

      const msgs = {
        approve:  "Proposal approved! The student can now proceed to implementation.",
        revision: "Revision requested. The student has been notified.",
        reject:   "Submission rejected.",
        grade:    "Grade submitted! The student has been notified.",
        comment:  "Comment added.",
      };
      showToast(msgs[action] || "Action completed.", { type: "success" });
      onAction?.();
      onClose?.();
    } catch (err) {
      showToast(err?.response?.data?.message || "Action failed. Please try again.", { type: "error" });
    } finally { setSaving(""); setConfirmAction(null); }
  };

  const handleDelete = async () => {
    setSaving("delete");
    try {
      await capstoneService.forceDeleteCapstone(item._id);
      showToast("Submission deleted.", { type: "success" });
      onAction?.();
      onClose?.();
    } catch (err) {
      showToast(err?.response?.data?.message || "Could not delete submission.", { type: "error" });
    } finally { setSaving(""); setDeleteConfirm(false); }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => { if (!saving && !o) onClose?.(); }}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="mb-5">
            <div className="flex items-center gap-3">
              <StudentAvatar name={studentName} />
              <div className="min-w-0">
                <SheetTitle className="truncate">{item.title || "Untitled Project"}</SheetTitle>
                <SheetDescription className="mt-0.5">{studentName}</SheetDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap mt-2">
              <StatusBadge status={item.status} />
              {item.revisionCount > 0 && (
                <span className="text-xs bg-amber-50 border border-amber-200 text-amber-700 rounded-full px-2.5 py-0.5 font-semibold">
                  {item.revisionCount}/{MAX_REVISION_ATTEMPTS} revisions used
                </span>
              )}
              <span className="text-xs text-gray-400">{fmtDate(item.submittedAt || item.createdAt)}</span>
            </div>
          </SheetHeader>

          <div className="space-y-5">
            {/* Description */}
            {item.description && item.description !== "<p><br></p>" && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Project Description</p>
                <div
                  className="prose prose-sm max-w-none text-gray-700 bg-gray-50 rounded-xl p-4 border border-gray-100"
                  dangerouslySetInnerHTML={{ __html: item.description }}
                />
              </div>
            )}

            {/* Files */}
            {item.files?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Attached Files</p>
                <div className="space-y-2">
                  {item.files.map((f, i) => <AttachedFileCard key={i} file={f} />)}
                </div>
              </div>
            )}

            {/* Implementation files */}
            {item.implementationFiles?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Implementation Files</p>
                <div className="space-y-2">
                  {item.implementationFiles.map((f, i) => <AttachedFileCard key={i} file={f} />)}
                </div>
                {item.implementationNotes && item.implementationNotes !== "<p><br></p>" && (
                  <div className="mt-3 p-3.5 bg-blue-50 border border-blue-100 rounded-xl">
                    <p className="text-xs font-semibold text-blue-700 mb-1">Student Notes</p>
                    <div
                      className="prose prose-sm max-w-none text-blue-800"
                      dangerouslySetInnerHTML={{ __html: item.implementationNotes }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Previous comments */}
            {item.comments?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Comment History</p>
                <div className="space-y-2">
                  {item.comments.map((c, i) => (
                    <div key={i} className="flex gap-2.5 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <MessageSquare className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 mb-0.5">{c.from || "Instructor"} · {fmtDate(c.createdAt)}</p>
                        <p className="text-sm text-gray-700">{c.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* ── Proposal actions ── */}
            {isProposalStage && (
              <div className="space-y-4">
                {/* No mark required at this stage */}
                <div className="flex items-start gap-2.5 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                  <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700 leading-relaxed">
                    <span className="font-semibold">Proposal review — no mark required.</span>{" "}
                    Approve to let the student proceed to implementation, request changes, or reject the submission.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="rev-comment">Comment / Feedback</Label>
                  <Textarea
                    id="rev-comment"
                    placeholder="Write your feedback, suggestions, or revision instructions…"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    maxLength={1500}
                  />
                  <p className="text-xs text-gray-400 text-right">{comment.length}/1500</p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    className="border-green-300 text-green-700 hover:bg-green-50 gap-1.5"
                    disabled={!!saving}
                    onClick={() => setConfirmAction("approve")}
                  >
                    {saving === "approve" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
                    Approve & Proceed
                  </Button>
                  <Button
                    variant="outline"
                    className={`border-amber-300 text-amber-700 hover:bg-amber-50 gap-1.5 ${attemptsLeft <= 0 ? "opacity-40 cursor-not-allowed" : ""}`}
                    disabled={!!saving || attemptsLeft <= 0}
                    onClick={() => setConfirmAction("revision")}
                  >
                    {saving === "revision" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                    Revise {attemptsLeft <= 0 ? "(0 left)" : `(${attemptsLeft} left)`}
                  </Button>
                  <Button
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-50 gap-1.5"
                    disabled={!!saving}
                    onClick={() => setConfirmAction("reject")}
                  >
                    {saving === "reject" ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                    Reject
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-gray-600"
                  disabled={!!saving || !comment.trim()}
                  onClick={() => doAction("comment")}
                >
                  {saving === "comment" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
                  Add Comment Only
                </Button>
              </div>
            )}

            {/* ── Final grading actions ── */}
            {isFinalStage && (
              <div className="space-y-4">
                <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl">
                  <p className="text-sm font-semibold text-purple-900 mb-0.5">Final Grading</p>
                  <p className="text-xs text-purple-700">Review the implementation, assign a grade (0–100), and leave feedback for the student.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="grade-score">Grade (0–100) <span className="text-red-500">*</span></Label>
                    <Input
                      id="grade-score"
                      type="number"
                      min={0}
                      max={100}
                      placeholder="e.g. 85"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Pass / Fail</Label>
                    <div className="flex gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => setGradePassed(true)}
                        className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all ${gradePassed ? "bg-green-500 border-green-500 text-white" : "bg-white border-gray-200 text-gray-600 hover:border-green-300"}`}
                      >
                        Pass
                      </button>
                      <button
                        type="button"
                        onClick={() => setGradePassed(false)}
                        className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all ${!gradePassed ? "bg-red-500 border-red-500 text-white" : "bg-white border-gray-200 text-gray-600 hover:border-red-300"}`}
                      >
                        Fail
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="grade-feedback">Final Feedback for Student <span className="text-red-500">*</span></Label>
                  <Textarea
                    id="grade-feedback"
                    placeholder="Write encouraging, constructive feedback about their project — strengths, areas to improve, and overall impressions…"
                    value={gradeFeedback}
                    onChange={(e) => setGradeFeedback(e.target.value)}
                    rows={5}
                    maxLength={2000}
                  />
                  <p className="text-xs text-gray-400 text-right">{gradeFeedback.length}/2000</p>
                </div>

                <Button
                  onClick={() => setConfirmAction("grade")}
                  disabled={!!saving || !grade}
                  className="w-full bg-[#021d49] hover:bg-[#032a66] text-white gap-2"
                >
                  {saving === "grade" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
                  Submit Grade
                </Button>
              </div>
            )}

            {/* Already graded */}
            {["graded", "completed"].includes(item.status) && (
              <div className="space-y-3">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                  <Trophy className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-bold text-emerald-900 text-sm">Grade: {item.grade ?? "—"}/100</p>
                    <p className="text-xs text-emerald-700 mt-0.5">{item.passed ? "Passed" : "Not Passed"}</p>
                  </div>
                </div>
                {item.gradeFeedback && (
                  <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-xs font-semibold text-gray-400 mb-1.5">Feedback Given</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{item.gradeFeedback}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Delete submission */}
          <div className="pt-4 border-t border-gray-100">
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-700 hover:bg-red-50 gap-1.5 text-xs"
              disabled={!!saving}
              onClick={() => setDeleteConfirm(true)}
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete This Submission
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete confirm dialog */}
      <Dialog open={deleteConfirm} onOpenChange={(o) => { if (!saving && !o) setDeleteConfirm(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Submission?</DialogTitle>
            <DialogDescription>
              This will permanently delete {studentName}'s capstone submission. The student will be able to start a new one.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(false)} disabled={!!saving}>Cancel</Button>
            <Button
              onClick={handleDelete}
              disabled={!!saving}
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
            >
              {saving === "delete" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {saving === "delete" ? "Deleting…" : "Yes, Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action confirm dialog */}
      <Dialog open={!!confirmAction} onOpenChange={(o) => { if (!saving && !o) setConfirmAction(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {confirmAction === "approve"  && "Approve & Let Student Proceed?"}
              {confirmAction === "revision" && "Request Revision?"}
              {confirmAction === "reject"   && "Reject Submission?"}
              {confirmAction === "grade"    && "Submit Final Grade?"}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === "approve"  && "The student will be notified and can proceed to the implementation stage."}
              {confirmAction === "revision" && `This will use 1 of the student's ${attemptsLeft} remaining revision attempt${attemptsLeft !== 1 ? "s" : ""}.`}
              {confirmAction === "reject"   && "The submission will be rejected. This action cannot be undone."}
              {confirmAction === "grade"    && `You are submitting a grade of ${grade}/100 (${gradePassed ? "Pass" : "Fail"}).`}
            </DialogDescription>
          </DialogHeader>
          {comment.trim() && confirmAction !== "grade" && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-700 italic">
              "{comment.trim()}"
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmAction(null)} disabled={!!saving}>Cancel</Button>
            <Button
              onClick={() => doAction(confirmAction)}
              disabled={!!saving}
              className={`gap-2 ${
                confirmAction === "approve" ? "bg-green-600 hover:bg-green-700 text-white"
                : confirmAction === "reject" ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-[#021d49] hover:bg-[#032a66] text-white"
              }`}
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {confirmAction === "approve"  && (saving ? "Approving…" : "Yes, Proceed")}
              {confirmAction === "revision" && (saving ? "Sending…"   : "Request Revision")}
              {confirmAction === "reject"   && (saving ? "Rejecting…" : "Yes, Reject")}
              {confirmAction === "grade"    && (saving ? "Submitting…": "Submit Grade")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InstructorCapstonePage() {
  const { showToast } = useToast();
  const [items,       setItems]     = useState([]);
  const [loading,     setLoading]   = useState(true);
  const [refreshing,  setRefreshing]= useState(false);
  const [search,      setSearch]    = useState("");
  const [activeTab,   setActiveTab] = useState("pending");
  const [reviewing,   setReviewing] = useState(null);
  const [sheetOpen,   setSheetOpen] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await capstoneService.getAllCapstones({ limit: 500 });
      const list = Array.isArray(res) ? res : (res?.data ?? res?.capstones ?? []);
      setItems(list);
    } catch (err) {
      if (!silent) showToast("Failed to load submissions.", { type: "error" });
      setItems([]);
    } finally { setLoading(false); setRefreshing(false); }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const handleReview = (item) => { setReviewing(item); setSheetOpen(true); };
  const handleAction = () => { setSheetOpen(false); load(true); };

  // Filtered lists
  const q = search.toLowerCase();
  const filtered = items.filter((it) =>
    !q ||
    (it.title || "").toLowerCase().includes(q) ||
    (it.studentName || it.student?.fullName || "").toLowerCase().includes(q)
  );

  const pending     = filtered.filter((it) => ["submitted", "under_review"].includes(it.status));
  const revision    = filtered.filter((it) => it.status === "revision_requested");
  const finalReview = filtered.filter((it) => ["implementation_submitted", "grading"].includes(it.status));
  const completed   = filtered.filter((it) => ["graded", "completed"].includes(it.status));
  const all         = filtered;

  const stats = {
    pending:     items.filter((it) => ["submitted", "under_review"].includes(it.status)).length,
    finalReview: items.filter((it) => ["implementation_submitted", "grading"].includes(it.status)).length,
    completed:   items.filter((it) => ["graded", "completed"].includes(it.status)).length,
    total:       items.length,
  };

  const tabList = [
    { id: "pending",     label: "Pending Review",   count: stats.pending,     list: pending     },
    { id: "finalReview", label: "Final Grading",    count: stats.finalReview, list: finalReview },
    { id: "all",         label: "All",              count: stats.total,       list: all         },
    { id: "completed",   label: "Completed",        count: stats.completed,   list: completed   },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-emerald-600" />
            Capstone Reviews
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Review, approve, and grade student capstone projects.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => load(true)} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Submissions", value: stats.total,       cls: "border-gray-200"   },
          { label: "Pending Review",    value: stats.pending,     cls: "border-amber-200 bg-amber-50"  },
          { label: "Awaiting Grade",    value: stats.finalReview, cls: "border-purple-200 bg-purple-50"},
          { label: "Completed",         value: stats.completed,   cls: "border-green-200 bg-green-50"  },
        ].map(({ label, value, cls }) => (
          <Card key={label} className={`border shadow-sm ${cls}`}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-extrabold text-gray-900">{value}</p>
              <p className="text-xs text-gray-600 mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Search ── */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          className="pl-9 bg-white"
          placeholder="Search by student or project…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ── Tabs ── */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-gray-100 shadow-sm p-1 rounded-xl flex gap-1 w-full sm:w-auto overflow-x-auto">
            {tabList.map((t) => (
              <TabsTrigger
                key={t.id}
                value={t.id}
                className="rounded-lg gap-2 data-[state=active]:bg-[#021d49] data-[state=active]:text-white whitespace-nowrap"
              >
                {t.label}
                {t.count > 0 && (
                  <Badge className="ml-0.5 h-4 px-1.5 text-[10px] bg-white/20 text-inherit border-0">
                    {t.count}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabList.map((t) => (
            <TabsContent key={t.id} value={t.id} className="mt-4">
              {t.list.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="font-semibold text-gray-700">
                    {search ? "No results match your search." : "Nothing here yet."}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {search ? "Try a different name or project title." : "Submissions will appear here when students submit."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {t.list.map((item) => (
                    <SubmissionCard key={item._id} item={item} onReview={handleReview} />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Review sheet */}
      <ReviewSheet
        item={reviewing}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onAction={handleAction}
      />
    </div>
  );
}
