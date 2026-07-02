"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft, Download, MessageSquare, CheckCircle2, Clock,
  RotateCcw, XCircle, Loader2, Trophy, FileText, User,
  ThumbsUp, CheckCheck, Trash2, Info, Calendar,
  AlertCircle, Eye, ZoomIn, FileImage, FileArchive,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/ToastProvider";
import capstoneService from "@/lib/api/capstoneService";

// ─── Constants & helpers ──────────────────────────────────────────────────────

const MAX_REVISION_ATTEMPTS = 2;

const STATUS_META = {
  draft:                    { label: "Draft",              color: "bg-gray-100 text-gray-600 border-gray-200",      dot: "bg-gray-400"    },
  submitted:                { label: "Pending Review",     color: "bg-amber-50 text-amber-700 border-amber-200",    dot: "bg-amber-400"   },
  under_review:             { label: "Under Review",       color: "bg-blue-50 text-blue-700 border-blue-200",       dot: "bg-blue-500"    },
  revision_requested:       { label: "Revision Requested", color: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-400"  },
  approved:                 { label: "Proposal Approved",  color: "bg-green-50 text-green-700 border-green-200",    dot: "bg-green-500"   },
  implementation:           { label: "Building",           color: "bg-green-50 text-green-700 border-green-200",    dot: "bg-green-500"   },
  implementation_submitted: { label: "Final Submitted",    color: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-500"  },
  grading:                  { label: "Grading",            color: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-500"  },
  graded:                   { label: "Graded ✓",           color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  completed:                { label: "Completed ✓",        color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  rejected:                 { label: "Rejected",           color: "bg-red-50 text-red-700 border-red-200",          dot: "bg-red-500"     },
};

const STATUS_STEPS = [
  { key: "submitted",                label: "Submitted"    },
  { key: "under_review",             label: "Under Review" },
  { key: "approved",                 label: "Approved"     },
  { key: "implementation_submitted", label: "Final Stage"  },
  { key: "graded",                   label: "Graded"       },
];

const STATUS_ORDER = [
  "draft","submitted","under_review","revision_requested","approved",
  "implementation","implementation_submitted","grading","graded","completed","rejected",
];

function statusIndex(s) { return STATUS_ORDER.indexOf(s); }

function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function fileExt(name = "") { return (name.split(".").pop() || "").toLowerCase(); }

const IMAGE_EXTS = new Set(["jpg","jpeg","png","gif","webp","svg","bmp","avif"]);
const PDF_EXTS   = new Set(["pdf"]);
const DOC_EXTS   = new Set(["doc","docx"]);
const SHEET_EXTS = new Set(["xls","xlsx","csv"]);
const ZIP_EXTS   = new Set(["zip","rar","7z","tar","gz"]);

function avatarInitials(name = "") {
  return name.trim().split(" ").slice(0, 2).map((p) => p[0] || "").join("").toUpperCase() || "?";
}
function avatarGradient(name = "") {
  const p = [
    "from-blue-500 to-blue-700", "from-violet-500 to-violet-700",
    "from-rose-500 to-rose-700", "from-amber-500 to-amber-700",
    "from-emerald-500 to-emerald-700", "from-cyan-500 to-cyan-700",
  ];
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return p[h % p.length];
}

// ─── File display components ─────────────────────────────────────────────────

function ImagePreview({ file }) {
  const [lightbox, setLightbox] = useState(false);
  const url  = file.fileUrl || file.url || null;
  const name = file.fileName || file.name || "Image";

  return (
    <>
      <div className="group relative rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 shadow-sm">
        {url ? (
          <div className="relative cursor-pointer" onClick={() => setLightbox(true)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={name}
              className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => { e.currentTarget.parentElement.innerHTML = '<div class="h-48 flex items-center justify-center bg-gray-100 text-gray-300 text-sm">Preview unavailable</div>'; }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur px-3 py-2 rounded-xl text-xs font-semibold text-gray-800 flex items-center gap-1.5 shadow-lg">
                <ZoomIn className="w-3.5 h-3.5" /> View Full Size
              </span>
            </div>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center bg-gray-100">
            <FileImage className="w-12 h-12 text-gray-300" />
          </div>
        )}
        <div className="px-3 py-2.5 flex items-center justify-between gap-2 bg-white">
          <p className="text-xs text-gray-600 font-medium truncate flex-1">{name}</p>
          {url && (
            <a href={url} download target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
              <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                <Download className="w-3.5 h-3.5" />
              </button>
            </a>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && url && (
        <div
          className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={name}
            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 backdrop-blur text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors"
          >
            Close
          </button>
          <a
            href={url}
            download
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="absolute top-4 left-4 bg-white/20 hover:bg-white/30 backdrop-blur text-white rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4" /> Download
          </a>
        </div>
      )}
    </>
  );
}

function DocFileCard({ file }) {
  const ext  = (file.ext || fileExt(file.fileName || file.name || "")).toLowerCase();
  const name = file.fileName || file.name || "Attached file";
  const url  = file.fileUrl || file.url || null;

  const isPdf   = PDF_EXTS.has(ext);
  const isDoc   = DOC_EXTS.has(ext);
  const isSheet = SHEET_EXTS.has(ext);
  const isZip   = ZIP_EXTS.has(ext);

  const style = isPdf
    ? { bg: "bg-red-50", icon: "text-red-600", label: "PDF", ring: "border-red-100" }
    : isDoc
    ? { bg: "bg-blue-50", icon: "text-blue-600", label: ext.toUpperCase(), ring: "border-blue-100" }
    : isSheet
    ? { bg: "bg-emerald-50", icon: "text-emerald-600", label: ext.toUpperCase(), ring: "border-emerald-100" }
    : isZip
    ? { bg: "bg-purple-50", icon: "text-purple-600", label: ext.toUpperCase(), ring: "border-purple-100" }
    : { bg: "bg-gray-50", icon: "text-gray-500", label: ext.toUpperCase() || "FILE", ring: "border-gray-100" };

  const Icon = isZip ? FileArchive : FileText;

  return (
    <div className={`flex items-center gap-4 p-4 bg-white rounded-2xl border ${style.ring || "border-gray-100"} shadow-sm hover:shadow-md transition-shadow`}>
      <div className={`w-12 h-12 ${style.bg} rounded-xl flex flex-col items-center justify-center shrink-0`}>
        <Icon className={`w-5 h-5 ${style.icon}`} />
        <span className={`text-[9px] font-bold ${style.icon} mt-0.5`}>{style.label}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{name}</p>
        <p className="text-xs text-gray-400 mt-0.5">{style.label} Document</p>
      </div>
      {url && (
        <div className="flex items-center gap-2 shrink-0">
          <a href={url} target="_blank" rel="noopener noreferrer">
            <button className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-xs font-semibold border border-gray-100 transition-colors">
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
          </a>
          <a href={url} download target="_blank" rel="noopener noreferrer">
            <button className="flex items-center gap-1.5 px-3 py-2 bg-[#021d49] hover:bg-[#032a66] text-white rounded-xl text-xs font-semibold transition-colors shadow-sm">
              <Download className="w-3.5 h-3.5" /> Download
            </button>
          </a>
        </div>
      )}
    </div>
  );
}

function FilesGrid({ files }) {
  if (!files?.length) return null;
  const images = files.filter((f) => IMAGE_EXTS.has(fileExt(f.fileName || f.name || "")));
  const docs   = files.filter((f) => !IMAGE_EXTS.has(fileExt(f.fileName || f.name || "")));
  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <div className={`grid gap-3 ${images.length === 1 ? "grid-cols-1 max-w-sm" : "grid-cols-2"}`}>
          {images.map((f, i) => <ImagePreview key={i} file={f} />)}
        </div>
      )}
      {docs.length > 0 && (
        <div className="space-y-2">
          {docs.map((f, i) => <DocFileCard key={i} file={f} />)}
        </div>
      )}
    </div>
  );
}

// ─── Status Timeline ──────────────────────────────────────────────────────────

function StatusTimeline({ status }) {
  const currentIdx = statusIndex(status);

  if (status === "rejected") {
    return (
      <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
        <XCircle className="w-4 h-4 text-red-500 shrink-0" />
        <p className="text-sm font-semibold text-red-700">This submission was rejected.</p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      {STATUS_STEPS.map((step, i) => {
        const stepIdx = statusIndex(step.key);
        const done    = currentIdx >= stepIdx;
        const isLast  = i === STATUS_STEPS.length - 1;
        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                done ? "bg-emerald-500 text-white shadow-sm" : "bg-gray-100 text-gray-400"
              }`}>
                {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className={`text-[9px] font-semibold whitespace-nowrap ${done ? "text-emerald-600" : "text-gray-300"}`}>
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div className={`flex-1 h-0.5 mb-4 rounded-full ${done && currentIdx > stepIdx ? "bg-emerald-400" : "bg-gray-100"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function Section({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-50">
        {Icon && <Icon className="w-4 h-4 text-gray-400" />}
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{title}</p>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function CapstoneDetailPage() {
  const router        = useRouter();
  const { id }        = useParams();
  const { showToast } = useToast();

  const [item,          setItem]          = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [comment,       setComment]       = useState("");
  const [grade,         setGrade]         = useState("");
  const [gradeFeedback, setGradeFeedback] = useState("");
  const [gradePassed,   setGradePassed]   = useState(true);
  const [saving,        setSaving]        = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const load = async () => {
    try {
      const data = await capstoneService.getCapstoneById(id);
      setItem(data?.data ?? data);
    } catch {
      showToast("Failed to load project.", { type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) load(); }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto" />
          <p className="text-sm text-gray-500">Loading project…</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gray-50">
        <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-gray-300" />
        </div>
        <p className="text-gray-500 font-semibold">Project not found.</p>
        <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const studentName  = item.studentName || item.student?.fullName || "Student";
  const meta         = STATUS_META[item.status] ?? STATUS_META.draft;
  const isProposal   = ["submitted", "under_review"].includes(item.status);
  const isFinal      = ["implementation_submitted", "grading"].includes(item.status);
  const isMarked     = ["graded", "completed"].includes(item.status);
  const attemptsLeft = MAX_REVISION_ATTEMPTS - (item.revisionCount || 0);
  const grad         = avatarGradient(studentName);

  const doAction = async (action) => {
    setSaving(action);
    try {
      if (action === "approve")  await capstoneService.approveProposal(item._id, comment);
      if (action === "revision") await capstoneService.requestRevision(item._id, comment);
      if (action === "reject")   await capstoneService.rejectCapstone(item._id, comment);
      if (action === "comment")  await capstoneService.addComment(item._id, comment);
      if (action === "grade") {
        const g = parseInt(grade, 10);
        if (isNaN(g) || g < 0 || g > 100) {
          showToast("Grade must be between 0 and 100.", { type: "warning" });
          setSaving(""); return;
        }
        await capstoneService.gradeCapstone(item._id, { grade: g, feedback: gradeFeedback.trim(), passed: gradePassed });
      }
      const msgs = {
        approve:  "Proposal approved  student can proceed to implementation.",
        revision: "Revision requested. Student has been notified.",
        reject:   "Submission rejected.",
        grade:    "Grade submitted! Student has been notified.",
        comment:  "Comment added.",
      };
      showToast(msgs[action] || "Done.", { type: "success" });
      setComment(""); setGrade(""); setGradeFeedback(""); setConfirmAction(null);
      await load();
    } catch (err) {
      showToast(err?.response?.data?.message || "Action failed.", { type: "error" });
    } finally { setSaving(""); }
  };

  const handleDelete = async () => {
    setSaving("delete");
    try {
      await capstoneService.forceDeleteCapstone(item._id);
      showToast("Submission deleted.", { type: "success" });
      router.push("/instructor/capstone");
    } catch (err) {
      showToast(err?.response?.data?.message || "Could not delete.", { type: "error" });
      setSaving("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Sticky top bar ── */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-30 px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={() => router.push("/instructor/capstone")}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Capstone Reviews</span>
            <span className="sm:hidden">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center border rounded-full px-3 py-1 text-xs font-semibold ${meta.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${meta.dot} mr-1.5`} />
              {meta.label}
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${
              isMarked
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-gray-50 text-gray-500 border-gray-200"
            }`}>
              {isMarked ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
              {isMarked ? "Marked" : "Not Marked"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Hero section ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-white text-xl font-extrabold shrink-0 shadow-lg`}>
              {avatarInitials(studentName)}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-extrabold text-gray-900 mb-1.5 leading-tight">
                {item.title || "Untitled Project"}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                <span className="flex items-center gap-1.5 font-medium text-gray-700">
                  <User className="w-3.5 h-3.5 text-gray-400" /> {studentName}
                </span>
                <span className="text-gray-200 hidden sm:inline">|</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Submitted {fmtDate(item.submittedAt || item.createdAt)}
                </span>
                {item.revisionCount > 0 && (
                  <>
                    <span className="text-gray-200 hidden sm:inline">|</span>
                    <span className="flex items-center gap-1.5 text-amber-600 font-medium">
                      <RotateCcw className="w-3.5 h-3.5" />
                      {item.revisionCount}/{MAX_REVISION_ATTEMPTS} revisions used
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Progress timeline */}
          <div className="mt-6 pt-6 border-t border-gray-50">
            <StatusTimeline status={item.status} />
          </div>

          {/* Grade banner */}
          {isMarked && item.grade != null && (
            <div className="mt-5 flex items-center gap-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-5">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                <Trophy className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-xl font-extrabold text-emerald-900">
                  {item.grade}/100
                  <span className={`ml-2 text-sm font-bold px-2.5 py-0.5 rounded-full ${item.passed ? "bg-emerald-600 text-white" : "bg-red-500 text-white"}`}>
                    {item.passed ? "Pass" : "Fail"}
                  </span>
                </p>
                {item.gradeFeedback && (
                  <p className="text-sm text-emerald-700 mt-1 leading-relaxed">{item.gradeFeedback}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Left  project content */}
          <div className="lg:col-span-2 space-y-5">

            {item.description && item.description !== "<p><br></p>" && (
              <Section title="Project Description" icon={FileText}>
                <div
                  className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: item.description }}
                />
              </Section>
            )}

            {item.files?.length > 0 && (
              <Section title={`Proposal Files · ${item.files.length}`} icon={Layers}>
                <FilesGrid files={item.files} />
              </Section>
            )}

            {item.implementationFiles?.length > 0 && (
              <Section title={`Implementation Files · ${item.implementationFiles.length}`} icon={Layers}>
                <FilesGrid files={item.implementationFiles} />
                {item.implementationNotes && item.implementationNotes !== "<p><br></p>" && (
                  <div className="mt-5 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Student Notes</p>
                    <div
                      className="prose prose-sm max-w-none text-blue-800"
                      dangerouslySetInnerHTML={{ __html: item.implementationNotes }}
                    />
                  </div>
                )}
              </Section>
            )}

            {item.comments?.length > 0 && (
              <Section title={`Comment History · ${item.comments.length}`} icon={MessageSquare}>
                <div className="space-y-3">
                  {item.comments.map((c, i) => (
                    <div key={i} className="flex gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="w-7 h-7 rounded-full bg-[#021d49] flex items-center justify-center shrink-0">
                        <MessageSquare className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1 font-medium">
                          {c.from || "Instructor"} · {fmtDate(c.createdAt)}
                        </p>
                        <p className="text-sm text-gray-700 leading-relaxed">{c.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>

          {/* Right  actions */}
          <div className="space-y-4">

            {/* Proposal stage */}
            {isProposal && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 px-5 py-4">
                  <p className="font-bold text-gray-900 text-sm">Proposal Review</p>
                  <p className="text-xs text-gray-500 mt-0.5">No grade at this stage  approve to let the student proceed.</p>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                    <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 leading-relaxed">
                      Approve → Implementation · Request Revision ({attemptsLeft} left) · Reject
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Comment / Feedback</Label>
                    <Textarea
                      placeholder="Write your feedback or revision instructions…"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={4}
                      maxLength={1500}
                    />
                    <p className="text-xs text-gray-400 text-right">{comment.length}/1500</p>
                  </div>
                  <div className="space-y-2">
                    <Button
                      onClick={() => setConfirmAction("approve")}
                      disabled={!!saving}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                    >
                      {saving === "approve" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
                      Approve & Proceed
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setConfirmAction("revision")}
                      disabled={!!saving || attemptsLeft <= 0}
                      className="w-full border-amber-300 text-amber-700 hover:bg-amber-50 gap-2"
                    >
                      {saving === "revision" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                      Request Revision {attemptsLeft <= 0 ? "(0 left)" : `(${attemptsLeft} left)`}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setConfirmAction("reject")}
                      disabled={!!saving}
                      className="w-full border-red-300 text-red-700 hover:bg-red-50 gap-2"
                    >
                      {saving === "reject" ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                      Reject Submission
                    </Button>
                    <button
                      type="button"
                      className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
                      disabled={!!saving || !comment.trim()}
                      onClick={() => doAction("comment")}
                    >
                      {saving === "comment" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
                      Add Comment Only
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Final grading */}
            {isFinal && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100 px-5 py-4">
                  <p className="font-bold text-gray-900 text-sm">Final Grading</p>
                  <p className="text-xs text-gray-500 mt-0.5">Assign a grade (0–100) and write feedback.</p>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Grade (0–100) <span className="text-red-500">*</span></Label>
                      <Input
                        type="number" min={0} max={100} placeholder="e.g. 85"
                        value={grade} onChange={(e) => setGrade(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Result</Label>
                      <div className="flex gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() => setGradePassed(true)}
                          className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${gradePassed ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-gray-200 text-gray-500"}`}
                        >Pass</button>
                        <button
                          type="button"
                          onClick={() => setGradePassed(false)}
                          className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${!gradePassed ? "bg-red-500 border-red-500 text-white" : "bg-white border-gray-200 text-gray-500"}`}
                        >Fail</button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Final Feedback <span className="text-red-500">*</span></Label>
                    <Textarea
                      placeholder="Write constructive feedback  strengths, areas to improve, overall impressions…"
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
              </div>
            )}

            {/* Already marked */}
            {isMarked && (
              <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 px-5 py-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Project Graded</p>
                    <p className="text-xs text-gray-500">This project has been marked.</p>
                  </div>
                </div>
                <div className="p-5">
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 text-center border border-emerald-100">
                    <p className="text-4xl font-extrabold text-emerald-900 leading-none">
                      {item.grade ?? ""}
                      <span className="text-xl text-emerald-500">/100</span>
                    </p>
                    <span className={`inline-block mt-3 px-4 py-1 rounded-full text-sm font-bold ${item.passed ? "bg-emerald-600 text-white" : "bg-red-500 text-white"}`}>
                      {item.passed ? "Pass" : "Fail"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Danger zone */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Danger Zone</p>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-red-200 text-red-600 hover:bg-red-50 gap-2"
                disabled={!!saving}
                onClick={() => setDeleteConfirm(true)}
              >
                <Trash2 className="w-4 h-4" /> Delete Submission
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Delete confirm ── */}
      <Dialog open={deleteConfirm} onOpenChange={(o) => { if (!saving && !o) setDeleteConfirm(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Submission?</DialogTitle>
            <DialogDescription>
              This permanently deletes {studentName}'s capstone. The student will be able to start a new one.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(false)} disabled={!!saving}>Cancel</Button>
            <Button onClick={handleDelete} disabled={!!saving} className="bg-red-600 hover:bg-red-700 text-white gap-2">
              {saving === "delete" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {saving === "delete" ? "Deleting…" : "Yes, Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Action confirm ── */}
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
              {confirmAction === "approve"  && "The student will be notified and can start the implementation stage."}
              {confirmAction === "revision" && `This uses 1 of the student's ${attemptsLeft} remaining revision attempt${attemptsLeft !== 1 ? "s" : ""}.`}
              {confirmAction === "reject"   && "This cannot be undone."}
              {confirmAction === "grade"    && `You are submitting ${grade}/100 (${gradePassed ? "Pass" : "Fail"}).`}
            </DialogDescription>
          </DialogHeader>
          {comment.trim() && confirmAction !== "grade" && (
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm text-gray-700 italic">
              "{comment.trim()}"
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmAction(null)} disabled={!!saving}>Cancel</Button>
            <Button
              onClick={() => doAction(confirmAction)}
              disabled={!!saving}
              className={`gap-2 ${
                confirmAction === "approve" ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : confirmAction === "reject" ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-[#021d49] hover:bg-[#032a66] text-white"
              }`}
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {confirmAction === "approve"  && (saving ? "Approving…"  : "Yes, Approve")}
              {confirmAction === "revision" && (saving ? "Sending…"    : "Request Revision")}
              {confirmAction === "reject"   && (saving ? "Rejecting…"  : "Yes, Reject")}
              {confirmAction === "grade"    && (saving ? "Submitting…" : "Submit Grade")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
