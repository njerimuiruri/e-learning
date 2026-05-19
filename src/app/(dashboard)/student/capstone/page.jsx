"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  FileText, CheckCircle2, Clock, Send,
  X, Loader2, RotateCcw, GraduationCap, Trophy,
  Star, Rocket, Eye, Download, RefreshCw,
  Info, Plus, Pencil, Trash2,
  Image as ImageIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/ToastProvider";
import capstoneService from "@/lib/api/capstoneService";
import Navbar from "@/components/navbar/navbar";

// ─── Dynamic Quill import (no SSR) ────────────────────────────────────────────
const ReactQuill = dynamic(
  () => import("react-quill-new"),
  { ssr: false, loading: () => <div className="h-48 bg-gray-50 rounded-xl border border-gray-200 animate-pulse" /> }
);

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_FILE_SIZE     = 50 * 1024 * 1024; // 50 MB
const MAX_FILES         = 3;
const MAX_REVISIONS     = 2;
const ALLOWED_TYPES     = ".pdf,.doc,.docx,.csv,.xls,.xlsx,.zip";
const ALLOWED_EXTS      = ["pdf", "doc", "docx", "csv", "xls", "xlsx", "zip"];

const STAGES = [
  { id: "proposal",       label: "Proposal",    step: 1 },
  { id: "review",         label: "Review",      step: 2 },
  { id: "implementation", label: "Build",        step: 3 },
  { id: "grading",        label: "Final Grade", step: 4 },
];

const STATUS_TO_STAGE = {
  draft: 0, submitted: 1, under_review: 1, revision_requested: 1,
  approved: 2, implementation: 2, implementation_submitted: 3,
  grading: 3, graded: 3, completed: 3,
};

const EXT_META = {
  pdf:  { bg: "bg-red-100 text-red-700",     icon: "📄" },
  doc:  { bg: "bg-blue-100 text-blue-700",   icon: "📝" },
  docx: { bg: "bg-blue-100 text-blue-700",   icon: "📝" },
  csv:  { bg: "bg-emerald-100 text-emerald-700", icon: "📊" },
  xls:  { bg: "bg-emerald-100 text-emerald-700", icon: "📊" },
  xlsx: { bg: "bg-emerald-100 text-emerald-700", icon: "📊" },
  zip:  { bg: "bg-purple-100 text-purple-700",   icon: "📦" },
};

// ─── Quill config ─────────────────────────────────────────────────────────────
const QUILL_FORMATS = [
  "header", "bold", "italic", "underline", "strike", "blockquote",
  "list", "indent", "link", "image", "align", "color", "background",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const extOf     = (name = "") => name.split(".").pop().toLowerCase();
const extMeta   = (name)      => EXT_META[extOf(name)] ?? { bg: "bg-gray-100 text-gray-600", icon: "📎" };
const sizeLabel = (b) => b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;
const validateFile = (f) => {
  if (!f) return "Select a file.";
  if (f.size > MAX_FILE_SIZE) return `Max size is ${sizeLabel(MAX_FILE_SIZE)}.`;
  if (!ALLOWED_EXTS.includes(extOf(f.name))) return "Allowed: PDF, DOC, DOCX, CSV, XLS, XLSX, ZIP";
  return null;
};

// ─── Step Indicator ───────────────────────────────────────────────────────────
function StepIndicator({ currentStage }) {
  return (
    <div className="flex items-center justify-center gap-0 py-2">
      {STAGES.map((s, idx) => {
        const done   = idx < currentStage;
        const active = idx === currentStage;
        return (
          <React.Fragment key={s.id}>
            <div className="flex flex-col items-center gap-1.5 min-w-[80px] z-10">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center border-2 font-bold text-sm transition-all duration-300 ${
                done   ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200"
                : active ? "bg-[#021d49] border-[#021d49] text-white shadow-xl shadow-blue-200 scale-110"
                : "bg-white border-gray-200 text-gray-400"
              }`}>
                {done ? <CheckCircle2 className="w-5 h-5" /> : s.step}
              </div>
              <span className={`text-[11px] font-semibold text-center ${
                active ? "text-[#021d49]" : done ? "text-emerald-600" : "text-gray-400"
              }`}>{s.label}</span>
            </div>
            {idx < STAGES.length - 1 && (
              <div className={`flex-1 h-1 mb-5 mx-1 rounded-full transition-all duration-700 ${
                idx < currentStage ? "bg-emerald-400" : "bg-gray-100"
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Multi-file upload zone ────────────────────────────────────────────────────
function MultiFileUpload({ files, onChange, disabled = false }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const addFile = (f) => {
    const err = validateFile(f);
    if (err) return;
    if (files.length >= MAX_FILES) return;
    const isDup = files.some((x) => x.file.name === f.name && x.file.size === f.size);
    if (!isDup) onChange([...files, { file: f, id: Math.random().toString(36).slice(2) }]);
  };

  const removeFile = (id) => onChange(files.filter((f) => f.id !== id));

  const onDrop = (e) => {
    e.preventDefault(); setDragging(false);
    if (disabled) return;
    Array.from(e.dataTransfer.files).forEach(addFile);
  };

  const canAdd = !disabled && files.length < MAX_FILES;

  return (
    <div className="space-y-3">
      {/* Existing files */}
      {files.map(({ file, id }) => {
        const meta = extMeta(file.name);
        const ext  = extOf(file.name).toUpperCase();
        return (
          <div key={id} className="flex items-center gap-3 p-3.5 bg-white border border-gray-100 rounded-2xl shadow-sm group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${meta.bg} shrink-0`}>
              {meta.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{file.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{ext} · {sizeLabel(file.size)}</p>
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={() => removeFile(id)}
                className="w-7 h-7 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      })}

      {/* Drop zone (shown when < max files) */}
      {canAdd && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all select-none ${
            dragging ? "border-[#021d49] bg-blue-50 scale-[1.01]" : "border-gray-200 hover:border-[#021d49]/40 hover:bg-gray-50"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ALLOWED_TYPES}
            multiple
            className="hidden"
            onChange={(e) => Array.from(e.target.files || []).forEach(addFile)}
          />
          <div className="w-10 h-10 bg-[#021d49]/8 rounded-xl flex items-center justify-center mx-auto mb-2">
            <Plus className="w-5 h-5 text-[#021d49]/60" />
          </div>
          <p className="text-sm font-medium text-gray-600">
            Add document {files.length + 1} of {MAX_FILES}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">PDF, DOC, DOCX, CSV, XLS, XLSX, ZIP — max 50 MB</p>
        </div>
      )}

      {files.length >= MAX_FILES && (
        <p className="text-xs text-emerald-600 font-medium text-center flex items-center justify-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" /> {MAX_FILES} files attached — limit reached
        </p>
      )}
    </div>
  );
}

// ─── Preview Sheet ─────────────────────────────────────────────────────────────
function PreviewSheet({ open, onClose, title, descriptionHtml, files, onConfirm, submitting }) {
  return (
    <Sheet open={open} onOpenChange={(o) => { if (!submitting && !o) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-0">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 z-10">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-lg">
              <Eye className="w-5 h-5 text-[#021d49]" /> Proposal Preview
            </SheetTitle>
          </SheetHeader>
          <p className="text-xs text-gray-400 mt-1">Review your submission before sending it to the instructor.</p>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Title */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Project Title</p>
            <h2 className="text-xl font-bold text-gray-900 leading-snug">
              {title || <span className="text-gray-300 italic">No title entered</span>}
            </h2>
          </div>

          <Separator />

          {/* Description */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Project Description</p>
            {descriptionHtml && descriptionHtml !== "<p><br></p>" ? (
              <div
                className="prose prose-sm max-w-none text-gray-700 bg-gray-50/80 rounded-2xl p-4 border border-gray-100"
                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
              />
            ) : (
              <p className="text-sm text-gray-300 italic">No description entered</p>
            )}
          </div>

          {/* Files */}
          {files.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Supporting Documents ({files.length})
                </p>
                <div className="space-y-2">
                  {files.map(({ file, id }) => {
                    const meta = extMeta(file.name);
                    return (
                      <div key={id} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-base ${meta.bg}`}>
                          {meta.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                          <p className="text-xs text-gray-400">{sizeLabel(file.size)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Confirmation note */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-800 flex gap-3">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
            <p>Once submitted, your instructor will review this proposal. You may be asked to revise it (up to {MAX_REVISIONS} times).</p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3">
          <Button variant="outline" onClick={onClose} disabled={submitting} className="flex-1">
            <Pencil className="w-4 h-4 mr-2" /> Edit
          </Button>
          <Button
            onClick={onConfirm}
            disabled={submitting}
            className="flex-1 bg-[#021d49] hover:bg-[#032a66] text-white gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {submitting ? "Submitting…" : "Confirm & Submit"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Status callout ────────────────────────────────────────────────────────────
function StatusCallout({ status, instructorComment, grade, gradeFeedback, revisionCount }) {
  const attemptsLeft = MAX_REVISIONS - (revisionCount || 0);
  const map = {
    submitted: {
      bg: "from-blue-50 to-indigo-50 border-blue-200",
      icon: <Clock className="w-5 h-5 text-blue-500" />,
      title: "Proposal Submitted",
      body: "Your proposal is waiting for the instructor to review. We'll notify you when there's an update.",
    },
    under_review: {
      bg: "from-blue-50 to-indigo-50 border-blue-200",
      icon: <Clock className="w-5 h-5 text-blue-500" />,
      title: "Under Review",
      body: "Your instructor is actively reviewing your submission. Hang tight — you're almost there!",
    },
    revision_requested: {
      bg: "from-amber-50 to-orange-50 border-amber-200",
      icon: <RotateCcw className="w-5 h-5 text-amber-500" />,
      title: "Revision Requested",
      body: instructorComment || "Your instructor has requested changes. Review the comments and resubmit your proposal.",
      extra: attemptsLeft > 0
        ? `You have ${attemptsLeft} revision attempt${attemptsLeft !== 1 ? "s" : ""} remaining.`
        : "No more revision attempts remaining — please contact your instructor.",
      extraCls: attemptsLeft > 0 ? "text-amber-700" : "text-red-600",
    },
    approved: {
      bg: "from-emerald-50 to-green-50 border-emerald-200",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
      title: "Proposal Approved! 🎉",
      body: "Congratulations — your proposal has been approved! You can now work on your project implementation below.",
    },
    implementation: {
      bg: "from-emerald-50 to-green-50 border-emerald-200",
      icon: <Rocket className="w-5 h-5 text-emerald-500" />,
      title: "Build Phase Active",
      body: "Your proposal is approved. Upload your project implementation when ready.",
    },
    implementation_submitted: {
      bg: "from-purple-50 to-indigo-50 border-purple-200",
      icon: <Clock className="w-5 h-5 text-purple-500" />,
      title: "Final Submission Received",
      body: "Your implementation has been submitted. Your instructor will grade it soon — well done for making it this far!",
    },
    grading: {
      bg: "from-purple-50 to-indigo-50 border-purple-200",
      icon: <Star className="w-5 h-5 text-purple-500" />,
      title: "Being Graded",
      body: "Your instructor is evaluating your final work. Results will appear here shortly.",
    },
    graded: {
      bg: "from-emerald-50 to-teal-50 border-emerald-200",
      icon: <Trophy className="w-5 h-5 text-emerald-600" />,
      title: `Graded: ${grade ?? "—"} / 100`,
      body: gradeFeedback || "Your capstone has been graded! Check your result below.",
    },
    completed: {
      bg: "from-emerald-50 to-teal-50 border-emerald-200",
      icon: <Trophy className="w-5 h-5 text-emerald-600" />,
      title: "Capstone Complete! 🏆",
      body: "You've successfully completed your capstone project. Excellent work!",
    },
  };
  const v = map[status];
  if (!v) return null;
  return (
    <div className={`bg-gradient-to-r ${v.bg} border rounded-2xl p-5 flex gap-4`}>
      <div className="mt-0.5 shrink-0">{v.icon}</div>
      <div>
        <p className="font-bold text-gray-900 text-sm">{v.title}</p>
        <p className="text-sm text-gray-600 mt-1 leading-relaxed">{v.body}</p>
        {v.extra && <p className={`text-xs font-semibold mt-2 ${v.extraCls}`}>{v.extra}</p>}
      </div>
    </div>
  );
}

// ─── Proposal Panel ────────────────────────────────────────────────────────────
function ProposalPanel({ capstone, onSubmitted }) {
  const { showToast } = useToast();
  const quillRef   = useRef(null);
  const [title,           setTitle]           = useState(capstone?.title || "");
  const [description,     setDescription]     = useState(capstone?.description || "");
  const [files,           setFiles]           = useState([]);
  const [previewOpen,     setPreviewOpen]     = useState(false);
  const [submitting,      setSubmitting]      = useState(false);
  const [withdrawConfirm, setWithdrawConfirm] = useState(false);
  const [withdrawing,     setWithdrawing]     = useState(false);

  const isRevision       = capstone?.status === "revision_requested";
  const alreadySubmitted = ["submitted", "under_review"].includes(capstone?.status);
  const attemptsLeft     = MAX_REVISIONS - (capstone?.revisionCount || 0);
  const isBlocked        = isRevision && attemptsLeft <= 0;

  // Quill image handler — insert as base64 preview
  const imageHandler = useCallback(() => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        const editor = quillRef.current?.getEditor?.();
        if (editor) {
          const range = editor.getSelection(true);
          editor.insertEmbed(range.index, "image", reader.result, "user");
          editor.setSelection(range.index + 1);
        }
      };
      reader.readAsDataURL(file);
    };
  }, []);

  const quillModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        ["blockquote"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ align: [] }],
        ["link", "image"],
        [{ color: [] }, { background: [] }],
        ["clean"],
      ],
      handlers: { image: imageHandler },
    },
  }), [imageHandler]);

  const handlePreview = () => {
    if (!title.trim()) { showToast("Please enter a project title.", { type: "warning" }); return; }
    if (!description || description === "<p><br></p>") {
      showToast("Please add a project description.", { type: "warning" }); return;
    }
    if (files.length === 0 && !capstone?.files?.length) {
      showToast("Please attach at least one supporting document.", { type: "warning" }); return;
    }
    setPreviewOpen(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("description", description);
      files.forEach(({ file }) => fd.append("files", file));
      if (isRevision && capstone?._id) {
        await capstoneService.resubmitRevision(capstone._id, fd);
        showToast("Revision submitted! Your instructor will review it.", { type: "success" });
      } else {
        await capstoneService.submitProposal(fd);
        showToast("Proposal submitted successfully!", { type: "success" });
      }
      setPreviewOpen(false);
      onSubmitted?.();
    } catch (err) {
      showToast(err?.response?.data?.message || "Submission failed. Please try again.", { type: "error" });
    } finally { setSubmitting(false); }
  };

  const handleWithdraw = async () => {
    setWithdrawing(true);
    try {
      await capstoneService.withdrawCapstone(capstone._id);
      showToast("Submission withdrawn. You can now start a new proposal.", { type: "success" });
      setWithdrawConfirm(false);
      onSubmitted?.();
    } catch (err) {
      showToast(err?.response?.data?.message || "Could not withdraw submission.", { type: "error" });
    } finally { setWithdrawing(false); }
  };

  const WithdrawDialog = () => (
    <Dialog open={withdrawConfirm} onOpenChange={(o) => { if (!withdrawing) setWithdrawConfirm(o); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Withdraw Submission?</DialogTitle>
          <DialogDescription>
            Your proposal will be deleted and you can start a fresh one. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 mt-2">
          <Button variant="outline" onClick={() => setWithdrawConfirm(false)} disabled={withdrawing}>Cancel</Button>
          <Button
            onClick={handleWithdraw}
            disabled={withdrawing}
            className="bg-red-600 hover:bg-red-700 text-white gap-2"
          >
            {withdrawing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {withdrawing ? "Withdrawing…" : "Yes, Withdraw"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (alreadySubmitted) {
    return (
      <>
      <WithdrawDialog />
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
          <Clock className="w-5 h-5 text-blue-500 shrink-0" />
          <div>
            <p className="font-semibold text-gray-900 text-sm">Proposal Submitted — Awaiting Review</p>
            <p className="text-xs text-gray-500 mt-0.5">Your instructor will review this and get back to you.</p>
          </div>
        </div>
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Your Title</p>
          <p className="font-semibold text-gray-900 text-base">{capstone.title}</p>
        </div>
        {capstone.description && (
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Description</p>
            <div
              className="prose prose-sm max-w-none text-gray-700 bg-gray-50 rounded-xl p-4 border border-gray-100"
              dangerouslySetInnerHTML={{ __html: capstone.description }}
            />
          </div>
        )}
        {capstone.files?.map((f, i) => {
          const meta = extMeta(f.fileName || f.name || "");
          return (
            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-base ${meta.bg}`}>{meta.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{f.fileName || f.name}</p>
              </div>
              {(f.fileUrl || f.url) && (
                <a href={f.fileUrl || f.url} target="_blank" rel="noopener noreferrer" download>
                  <Button variant="outline" size="sm" className="h-7 px-2 gap-1 text-xs">
                    <Download className="w-3 h-3" />
                  </Button>
                </a>
              )}
            </div>
          );
        })}

        {/* Withdraw option */}
        <div className="pt-2 border-t border-gray-100">
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-700 hover:bg-red-50 gap-1.5 text-xs"
            onClick={() => setWithdrawConfirm(true)}
          >
            <Trash2 className="w-3.5 h-3.5" /> Withdraw & Delete Submission
          </Button>
          <p className="text-xs text-gray-400 mt-1">You can start a new proposal after withdrawing.</p>
        </div>
      </div>
      </>
    );
  }

  return (
    <>
      {/* CSS for quill */}
      <style>{`
        .ql-editor { min-height: 200px; font-size: 14px; line-height: 1.7; }
        .ql-toolbar { border-radius: 12px 12px 0 0 !important; border-color: #e5e7eb !important; background: #f9fafb; }
        .ql-container { border-radius: 0 0 12px 12px !important; border-color: #e5e7eb !important; }
        .ql-editor img { max-width: 100%; border-radius: 8px; margin: 8px 0; }
        .ql-editor.ql-blank::before { color: #9ca3af; font-style: normal; }
      `}</style>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Revision notice */}
        {isRevision && (
          <div className={`px-6 py-4 flex gap-3 ${isBlocked ? "bg-red-50 border-b border-red-100" : "bg-amber-50 border-b border-amber-100"}`}>
            <RotateCcw className={`w-4 h-4 mt-0.5 shrink-0 ${isBlocked ? "text-red-500" : "text-amber-500"}`} />
            <div>
              <p className={`text-sm font-semibold ${isBlocked ? "text-red-900" : "text-amber-900"}`}>
                {isBlocked ? "No more revision attempts" : "Revision Required"}
              </p>
              <p className={`text-sm mt-0.5 ${isBlocked ? "text-red-700" : "text-amber-700"}`}>
                {isBlocked
                  ? "You have used all revision attempts. Please contact your instructor."
                  : capstone?.instructorComment || "Please review the instructor's comments and resubmit."}
              </p>
              {!isBlocked && (
                <p className="text-xs text-amber-600 font-semibold mt-1">
                  {attemptsLeft} revision attempt{attemptsLeft !== 1 ? "s" : ""} remaining
                </p>
              )}
            </div>
          </div>
        )}

        <div className="p-6 space-y-7">
          {/* Title */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-800">
              Project Title <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="e.g. AI-Driven Climate Resilience Framework for Sub-Saharan Africa"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={150}
              disabled={isBlocked}
              className="h-12 rounded-xl border-gray-200 text-base focus-visible:ring-[#021d49]/30"
            />
            <div className="flex justify-between">
              <p className="text-xs text-gray-400">Make it descriptive and specific to your project goals.</p>
              <p className="text-xs text-gray-400">{title.length}/150</p>
            </div>
          </div>

          {/* Description — WYSIWYG */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-semibold text-gray-800">
                Project Description <span className="text-red-500">*</span>
              </Label>
              <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                <ImageIcon className="w-2.5 h-2.5" /> Images supported
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Describe your objectives, methodology, expected outcomes, and why this project matters.
              You can also embed images directly in the editor.
            </p>
            {!isBlocked && (
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={description}
                onChange={setDescription}
                modules={quillModules}
                formats={QUILL_FORMATS}
                placeholder="Write your project description here…"
              />
            )}
            {isBlocked && description && (
              <div
                className="prose prose-sm max-w-none text-gray-700 bg-gray-50 rounded-xl p-4 border border-gray-100"
                dangerouslySetInnerHTML={{ __html: description }}
              />
            )}
          </div>

          {/* Supporting Documents */}
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-semibold text-gray-800">
                Supporting Documents <span className="text-red-500">*</span>
              </Label>
              <p className="text-xs text-gray-400 mt-0.5">
                Upload up to {MAX_FILES} documents. PDF, DOC, DOCX, CSV, XLS, XLSX, or ZIP — max 50 MB each.
              </p>
            </div>

            {/* Previous files when revising */}
            {isRevision && capstone?.files?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Previously submitted files</p>
                {capstone.files.map((f, i) => {
                  const meta = extMeta(f.fileName || "");
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-dashed border-gray-200 mb-2">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-base ${meta.bg}`}>{meta.icon}</div>
                      <p className="text-sm text-gray-600 truncate flex-1">{f.fileName || f.name}</p>
                      <span className="text-[10px] text-gray-400">Previous version</span>
                    </div>
                  );
                })}
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <Info className="w-3 h-3" /> Upload new files to replace the previous ones.
                </p>
              </div>
            )}

            <MultiFileUpload files={files} onChange={setFiles} disabled={isBlocked} />
          </div>

          {/* Actions */}
          {!isBlocked && (
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Button
                type="button"
                onClick={handlePreview}
                variant="outline"
                className="w-full sm:w-auto gap-2 h-12 px-6 rounded-xl border-[#021d49] text-[#021d49] hover:bg-[#021d49]/5"
              >
                <Eye className="w-4 h-4" />
                Preview Before Submitting
              </Button>
              <div className="text-xs text-gray-400 hidden sm:block">or</div>
              <Button
                type="button"
                onClick={handlePreview}
                className="w-full sm:flex-1 gap-2 h-12 bg-[#021d49] hover:bg-[#032a66] text-white rounded-xl font-semibold"
              >
                <Send className="w-4 h-4" />
                {isRevision ? "Review & Submit Revision" : "Review & Submit Proposal"}
              </Button>
            </div>
          )}

          {/* Withdraw option — available for submitted & revision_requested */}
          {capstone?._id && (
            <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700 hover:bg-red-50 gap-1.5 text-xs"
                onClick={() => setWithdrawConfirm(true)}
              >
                <Trash2 className="w-3.5 h-3.5" /> Withdraw & Delete Submission
              </Button>
              <p className="text-xs text-gray-400">You can start a new proposal after withdrawing.</p>
            </div>
          )}
        </div>
      </div>

      <WithdrawDialog />

      <PreviewSheet
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={title}
        descriptionHtml={description}
        files={files}
        onConfirm={handleSubmit}
        submitting={submitting}
      />
    </>
  );
}

// ─── Implementation Panel ──────────────────────────────────────────────────────
function ImplementationPanel({ capstone, onSubmitted }) {
  const { showToast } = useToast();
  const quillRef     = useRef(null);
  const [files,       setFiles]       = useState([]);
  const [notes,       setNotes]       = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [submitting,  setSubmitting]  = useState(false);

  const alreadyDone = ["implementation_submitted", "grading", "graded", "completed"].includes(capstone?.status);

  const imageHandler = useCallback(() => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        const editor = quillRef.current?.getEditor?.();
        if (editor) {
          const range = editor.getSelection(true);
          editor.insertEmbed(range.index, "image", reader.result, "user");
        }
      };
      reader.readAsDataURL(file);
    };
  }, []);

  const quillModules = useMemo(() => ({
    toolbar: {
      container: [
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "image"],
        ["clean"],
      ],
      handlers: { image: imageHandler },
    },
  }), [imageHandler]);

  const handlePreview = () => {
    if (files.length === 0) { showToast("Please attach your implementation file(s).", { type: "warning" }); return; }
    setPreviewOpen(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      files.forEach(({ file }) => fd.append("files", file));
      if (notes) fd.append("notes", notes);
      await capstoneService.submitImplementation(capstone._id, fd);
      showToast("Final implementation submitted! Your instructor will grade it.", { type: "success" });
      setPreviewOpen(false);
      onSubmitted?.();
    } catch (err) {
      showToast(err?.response?.data?.message || "Submission failed.", { type: "error" });
    } finally { setSubmitting(false); }
  };

  if (alreadyDone) {
    return (
      <div className="flex items-center gap-4 p-5 bg-white border border-gray-100 rounded-2xl shadow-sm">
        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <p className="font-semibold text-gray-900">Implementation Submitted</p>
          <p className="text-sm text-gray-500 mt-0.5">Your final work is with the instructor for grading.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .ql-editor { min-height: 120px; font-size: 14px; line-height: 1.7; }
        .ql-toolbar { border-radius: 12px 12px 0 0 !important; border-color: #e5e7eb !important; background: #f9fafb; }
        .ql-container { border-radius: 0 0 12px 12px !important; border-color: #e5e7eb !important; }
      `}</style>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex gap-3">
          <Rocket className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-900">Build Phase — Upload Your Final Work</p>
            <p className="text-sm text-emerald-700 mt-0.5">
              Upload your implementation files — code, reports, data, presentations, or any project deliverables.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-800">
            Implementation Files <span className="text-red-500">*</span>
          </Label>
          <MultiFileUpload files={files} onChange={setFiles} />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-800">
            Notes for Instructor <span className="text-gray-400 font-normal">(optional)</span>
          </Label>
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={notes}
            onChange={setNotes}
            modules={quillModules}
            formats={QUILL_FORMATS}
            placeholder="Highlight key decisions, challenges, or instructions for running your project…"
          />
        </div>

        <Button
          onClick={handlePreview}
          disabled={submitting}
          className="w-full h-12 bg-[#021d49] hover:bg-[#032a66] text-white rounded-xl font-semibold gap-2"
        >
          <Eye className="w-4 h-4" /> Review & Submit Implementation
        </Button>
      </div>

      {/* Preview */}
      <Sheet open={previewOpen} onOpenChange={(o) => { if (!submitting && !o) setPreviewOpen(false); }}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-0">
          <div className="sticky top-0 bg-white border-b px-6 py-4">
            <SheetTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" /> Implementation Preview
            </SheetTitle>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Files to Submit</p>
              <div className="space-y-2">
                {files.map(({ file, id }) => {
                  const meta = extMeta(file.name);
                  return (
                    <div key={id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-base ${meta.bg}`}>{meta.icon}</div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                        <p className="text-xs text-gray-400">{sizeLabel(file.size)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {notes && notes !== "<p><br></p>" && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Your Notes</p>
                <div className="prose prose-sm max-w-none bg-gray-50 rounded-xl p-4 border border-gray-100" dangerouslySetInnerHTML={{ __html: notes }} />
              </div>
            )}
          </div>
          <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex gap-3">
            <Button variant="outline" onClick={() => setPreviewOpen(false)} disabled={submitting} className="flex-1">
              <Pencil className="w-4 h-4 mr-2" /> Edit
            </Button>
            <Button onClick={handleSubmit} disabled={submitting} className="flex-1 bg-[#021d49] text-white gap-2">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {submitting ? "Submitting…" : "Confirm & Submit"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

// ─── Grading Panel ─────────────────────────────────────────────────────────────
function GradingPanel({ capstone }) {
  const { status, grade, gradeFeedback, passed } = capstone || {};
  const waiting = ["implementation_submitted", "grading"].includes(status);

  if (waiting) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col items-center text-center gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
            <Clock className="w-8 h-8 text-purple-400 animate-pulse" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
            <Star className="w-3 h-3 text-white fill-white" />
          </div>
        </div>
        <div>
          <p className="font-bold text-gray-900 text-lg">Awaiting Your Grade</p>
          <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto leading-relaxed">
            Your instructor is reviewing your final implementation. You'll be notified as soon as it's graded.
          </p>
        </div>
        <div className="w-full max-w-xs">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
            <span>Almost there…</span>
            <span>Final review</span>
          </div>
          <Progress value={85} className="h-2" />
        </div>
      </div>
    );
  }

  if (["graded", "completed"].includes(status)) {
    const pct   = Math.max(0, Math.min(100, Number(grade) || 0));
    const isPass = passed !== undefined ? passed : pct >= 50;
    return (
      <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${isPass ? "border-emerald-200" : "border-red-200"}`}>
        {/* Top stripe */}
        <div className={`h-2 ${isPass ? "bg-gradient-to-r from-emerald-400 to-teal-500" : "bg-gradient-to-r from-red-400 to-orange-500"}`} />
        <div className="p-6 space-y-5">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Grade circle */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className={`w-28 h-28 rounded-full flex items-center justify-center border-4 ${
                isPass ? "border-emerald-300 bg-emerald-50" : "border-red-300 bg-red-50"
              }`}>
                <div className="text-center">
                  <p className={`text-3xl font-extrabold leading-none ${isPass ? "text-emerald-600" : "text-red-500"}`}>{pct}</p>
                  <p className="text-xs text-gray-400 font-medium">/100</p>
                </div>
              </div>
              <Badge className={`${isPass
                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                : "bg-red-100 text-red-700 border-red-200"} border font-bold text-xs`}>
                {isPass ? "PASSED ✓" : "NOT PASSED"}
              </Badge>
            </div>

            {/* Feedback */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Instructor Feedback</p>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {gradeFeedback || "No written feedback was provided."}
                </p>
              </div>
            </div>
          </div>

          {isPass && (
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
              <Trophy className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-emerald-900 text-sm">Congratulations on completing your Capstone!</p>
                <p className="text-xs text-emerald-700 mt-0.5">Your certificate will be issued shortly.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function StudentCapstonePage() {
  const { showToast } = useToast();
  const [capstone,   setCapstone]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const status       = capstone?.status || "draft";
  const currentStage = STATUS_TO_STAGE[status] ?? 0;
  const revisionCount = capstone?.revisionCount || 0;
  const attemptsLeft  = MAX_REVISIONS - revisionCount;

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await capstoneService.getMyCapstone();
      setCapstone(res?.data ?? res ?? null);
    } catch (err) {
      if (err?.response?.status !== 404) {
        if (!silent) showToast("Could not load capstone data.", { type: "error" });
      }
      setCapstone(null);
    } finally { setLoading(false); setRefreshing(false); }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const isSubmitted = ["submitted", "under_review"].includes(status);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">

        {/* ── Compact page header ── */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <GraduationCap className="w-5 h-5 text-[#021d49]" />
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Capstone Project</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-tight">Your Final Project</h1>
                <p className="text-gray-400 mt-0.5 text-sm">
                  A step-by-step journey from proposal to implementation.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {capstone && status !== "draft" && (
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 font-medium mb-1">Revisions used</p>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: MAX_REVISIONS }).map((_, i) => (
                        <div key={i} className={`w-4 h-4 rounded-full border-2 ${
                          i < revisionCount ? "bg-amber-400 border-amber-400" : "bg-gray-100 border-gray-200"
                        }`} />
                      ))}
                      <span className="text-xs text-gray-400 ml-1">{revisionCount}/{MAX_REVISIONS}</span>
                    </div>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => load(true)}
                  disabled={refreshing}
                  className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 h-8 w-8 p-0"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Step progress bar ── */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <StepIndicator currentStage={currentStage} />
          </div>
        </div>

        {/* ── Main content — only the active stage is shown ── */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-7 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-[#021d49]" />
              <p className="text-sm text-gray-400">Loading your capstone…</p>
            </div>
          ) : (
            <>
              {/* Status callout — shown on every stage except draft */}
              {capstone && status !== "draft" && (
                <StatusCallout
                  status={status}
                  instructorComment={capstone.instructorComment}
                  grade={capstone.grade}
                  gradeFeedback={capstone.gradeFeedback}
                  revisionCount={revisionCount}
                />
              )}

              {/* ── Stage 0 & 1: Proposal (draft / submitted / under_review / revision_requested) ── */}
              {currentStage <= 1 && (
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      currentStage > 0 ? "bg-emerald-500 text-white" : "bg-[#021d49] text-white"
                    }`}>
                      {currentStage > 0 ? <CheckCircle2 className="w-4 h-4" /> : "1"}
                    </div>
                    <div>
                      <h2 className="font-bold text-gray-900 text-lg">
                        {status === "revision_requested" ? "Revise & Resubmit" : "Submit Your Proposal"}
                      </h2>
                      <p className="text-xs text-gray-500">
                        {status === "revision_requested"
                          ? "Update your proposal based on the instructor's feedback."
                          : "Describe your project and attach supporting documents."}
                      </p>
                    </div>
                    {isSubmitted && (
                      <Badge className="ml-auto bg-blue-100 text-blue-700 border-blue-200 border">
                        <Clock className="w-3 h-3 mr-1" /> Under Review
                      </Badge>
                    )}
                  </div>
                  <ProposalPanel capstone={capstone} onSubmitted={() => load(true)} />
                </section>
              )}

              {/* ── Stage 2: Implementation (approved / implementation) ── */}
              {currentStage === 2 && (
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 bg-[#021d49] text-white">
                      2
                    </div>
                    <div>
                      <h2 className="font-bold text-gray-900 text-lg">Project Implementation</h2>
                      <p className="text-xs text-gray-500">Upload your final project work — code, reports, and deliverables.</p>
                    </div>
                    <Badge className="ml-auto bg-emerald-100 text-emerald-700 border-emerald-200 border">
                      <Rocket className="w-3 h-3 mr-1" /> Unlocked
                    </Badge>
                  </div>
                  <ImplementationPanel capstone={capstone} onSubmitted={() => load(true)} />
                </section>
              )}

              {/* ── Stage 3: Grading (implementation_submitted / grading / graded / completed) ── */}
              {currentStage === 3 && (
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      ["graded", "completed"].includes(status) ? "bg-emerald-500 text-white" : "bg-[#021d49] text-white"
                    }`}>
                      {["graded", "completed"].includes(status) ? <CheckCircle2 className="w-4 h-4" /> : "3"}
                    </div>
                    <div>
                      <h2 className="font-bold text-gray-900 text-lg">Final Grade</h2>
                      <p className="text-xs text-gray-500">Your instructor's evaluation of your completed project.</p>
                    </div>
                  </div>
                  <GradingPanel capstone={capstone} />
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
