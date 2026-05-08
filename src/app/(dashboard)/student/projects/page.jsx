"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Upload, Star, Download, Search, Clock,
  CheckCircle, XCircle, FileText, Plus, X, Tag,
  Trash2, Loader2, FolderOpen,
  BookOpen, Users, AlertCircle, Eye, Edit2,
  Library, Shield, Globe, BookMarked, Mail,
  ChevronRight, ExternalLink,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/ToastProvider";
import Navbar from "@/components/navbar/navbar";
import authService from "@/lib/api/authService";
import projectService from "@/lib/api/projectService";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_DOCS = 5;

// ── helpers ───────────────────────────────────────────────────────────────────

function validateFile(file) {
  if (!file) return null;
  if (file.size > MAX_FILE_SIZE) return "File must be under 10 MB";
  const ext = file.name.split(".").pop().toLowerCase();
  if (!["pdf", "doc", "docx", "csv", "xls", "xlsx"].includes(ext))
    return "Allowed: PDF, DOC, DOCX, CSV, XLS, XLSX";
  return null;
}

const EXT_META = {
  PDF:  { bg: "bg-red-100 text-red-700",     stripe: "from-red-400 to-red-600"     },
  DOC:  { bg: "bg-blue-100 text-blue-700",   stripe: "from-blue-400 to-blue-600"   },
  DOCX: { bg: "bg-blue-100 text-blue-700",   stripe: "from-blue-400 to-blue-600"   },
  CSV:  { bg: "bg-emerald-100 text-emerald-700", stripe: "from-emerald-400 to-emerald-600" },
  XLS:  { bg: "bg-emerald-100 text-emerald-700", stripe: "from-emerald-400 to-emerald-600" },
  XLSX: { bg: "bg-emerald-100 text-emerald-700", stripe: "from-emerald-400 to-emerald-600" },
};

function extOf(fileName) {
  return fileName?.split(".").pop()?.toUpperCase() || "FILE";
}

function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
}

function avatarColor(name = "") {
  const colors = [
    "bg-blue-600", "bg-violet-600", "bg-rose-600",
    "bg-amber-600", "bg-emerald-600", "bg-cyan-600",
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return colors[h % colors.length];
}

// ── sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const map = {
    pending:  { cls: "bg-amber-50 text-amber-700 border-amber-200", label: "Pending Review", Icon: Clock },
    approved: { cls: "bg-green-50 text-green-700 border-green-200",  label: "Approved",       Icon: CheckCircle },
    rejected: { cls: "bg-red-50 text-red-700 border-red-200",        label: "Rejected",       Icon: XCircle },
  };
  const s = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${s.cls}`}>
      <s.Icon className="w-3 h-3" />{s.label}
    </span>
  );
}

function StarRating({ value = 0, onChange, readOnly = false, size = "sm" }) {
  const [hovered, setHovered] = useState(0);
  const sz = size === "lg" ? "w-5 h-5" : "w-4 h-4";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" disabled={readOnly}
          onClick={() => !readOnly && onChange?.(star)}
          onMouseEnter={() => !readOnly && setHovered(star)}
          onMouseLeave={() => !readOnly && setHovered(0)}
          className={`transition-transform ${readOnly ? "cursor-default" : "cursor-pointer hover:scale-110"}`}>
          <Star className={`${sz} ${(hovered || value) >= star ? "fill-amber-400 text-amber-400" : "text-gray-200 fill-gray-200"}`} />
        </button>
      ))}
    </div>
  );
}

function FileDropzone({ file, onFile, onClear, error }) {
  const inputRef = useRef(null);
  const handle = (f) => { if (!f) return; onFile(f, validateFile(f)); };
  const [dragging, setDragging] = useState(false);
  return (
    <div>
      <div onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files[0]); }}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all select-none
          ${dragging ? "border-[#021d49] bg-blue-50" : "border-gray-200 hover:border-[#021d49]/50 hover:bg-blue-50/30"}
          ${error ? "border-red-400 bg-red-50/40" : ""}`}>
        <input ref={inputRef} type="file" accept=".pdf,.doc,.docx,.csv,.xls,.xlsx" className="hidden"
          onChange={(e) => handle(e.target.files[0])} />
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 bg-[#021d49]/10 rounded-lg flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-[#021d49]" />
            </div>
            <div className="text-left min-w-0">
              <p className="font-medium text-gray-900 text-sm truncate">{file.name}</p>
              <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB</p>
            </div>
            <button type="button" onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="ml-2 text-gray-400 hover:text-red-500 transition-colors shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div>
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Upload className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-700 mb-0.5">Drop file here or click to browse</p>
            <p className="text-xs text-gray-400">PDF, DOC, DOCX, CSV, XLS, XLSX — max 10 MB</p>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
    </div>
  );
}

// ── PDF / document viewer dialog ──────────────────────────────────────────────

function DocViewerDialog({ project, currentUserId, onClose, onRated, isAdminResource = false }) {
  if (!project) return null;
  const ext = extOf(project.fileName);
  const isPdf = ext === "PDF";
  const isOwn = !isAdminResource && (
    project.studentId === currentUserId || project.student?._id === currentUserId
  );
  const existingRating = project.ratings?.find((r) => r.userId === currentUserId)?.value ?? 0;
  const [rating, setRating] = useState(existingRating);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(isPdf);
  const meta = EXT_META[ext] ?? { bg: "bg-gray-100 text-gray-700", stripe: "from-gray-400 to-gray-600" };

  const avgRating = project.ratings?.length
    ? (project.ratings.reduce((s, r) => s + r.value, 0) / project.ratings.length).toFixed(1)
    : null;

  const authorName = isAdminResource
    ? (project.authorName || project.studentName || "Admin")
    : (project.studentName || project.student?.fullName || "Anonymous");

  const handleRate = async (val) => {
    if (saving || isOwn) return;
    const prev = rating; setRating(val); setSaving(true);
    try { await projectService.rateProject(project._id, val); onRated?.(); }
    catch { setRating(prev); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={!!project} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0">
        {/* Coloured top stripe */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${meta.stripe} rounded-t-xl`} />

        <div className="p-6">
          <DialogHeader className="mb-4">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.bg}`}>{ext}</span>
              {project.status && !isAdminResource && <StatusBadge status={project.status} />}
              {isAdminResource && (
                <span className="inline-flex items-center gap-1 bg-violet-100 text-violet-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  <Shield className="w-2.5 h-2.5" /> Admin Resource
                </span>
              )}
            </div>
            <DialogTitle className="text-lg leading-snug pr-8">{project.title}</DialogTitle>
            <DialogDescription asChild>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-6 h-6 rounded-full ${avatarColor(authorName)} flex items-center justify-center text-white text-[9px] font-bold shrink-0`}>
                  {initials(authorName).toUpperCase()}
                </div>
                <span className="text-sm text-gray-600 font-medium">{authorName}</span>
                {isAdminResource && project.authorEmail && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Mail className="w-3 h-3" />{project.authorEmail}
                  </span>
                )}
                <span className="text-gray-300">·</span>
                <span className="text-xs text-gray-400">
                  {new Date(project.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {project.description && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">About this document</p>
                <p className="text-sm text-gray-700 leading-relaxed">{project.description}</p>
              </div>
            )}

            {project.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {project.tags.map((t) => (
                  <span key={t} className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-xs font-medium">#{t}</span>
                ))}
              </div>
            )}

            {/* PDF inline preview */}
            {project.fileUrl && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Document Preview</p>
                  {isPdf && (
                    <button onClick={() => setShowPreview((v) => !v)}
                      className="text-xs text-[#021d49] font-medium hover:underline">
                      {showPreview ? "Hide preview" : "Show preview"}
                    </button>
                  )}
                </div>
                {isPdf && showPreview ? (
                  <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
                    <iframe
                      src={`${project.fileUrl}#toolbar=0`}
                      className="w-full"
                      style={{ height: "420px" }}
                      title={project.title}
                    />
                  </div>
                ) : (
                  <div className={`flex items-center gap-3 p-3.5 rounded-xl border ${meta.bg.replace("text-", "border-").replace(/\d+$/, "200")} bg-opacity-30`}>
                    <div className={`w-10 h-10 rounded-lg ${meta.bg} flex items-center justify-center shrink-0`}>
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{project.fileName}</p>
                      <p className="text-xs text-gray-500">{ext} document · click below to open</p>
                    </div>
                    <a href={project.fileUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 text-gray-400 hover:text-[#021d49]" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Rating */}
            {!isOwn && !isAdminResource && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 mb-2">Rate this document</p>
                <div className="flex items-center gap-3">
                  <StarRating value={rating} onChange={handleRate} readOnly={!currentUserId} size="lg" />
                  {avgRating && (
                    <span className="text-sm text-gray-500 font-medium">{avgRating} avg · {project.ratings?.length} rating{project.ratings?.length !== 1 ? "s" : ""}</span>
                  )}
                </div>
              </div>
            )}
            {isOwn && avgRating && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-center gap-3">
                <StarRating value={Math.round(parseFloat(avgRating))} readOnly size="lg" />
                <span className="text-sm font-semibold text-amber-700">{avgRating} avg · {project.ratings?.length} rating{project.ratings?.length !== 1 ? "s" : ""}</span>
              </div>
            )}

            {/* Admin feedback */}
            {project.adminFeedback && (
              <div className={`p-3.5 rounded-xl text-sm leading-relaxed ${project.status === "rejected"
                ? "bg-red-50 text-red-700 border border-red-100"
                : "bg-green-50 text-green-700 border border-green-100"}`}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span className="font-semibold text-xs uppercase tracking-wide">Admin Feedback</span>
                </div>
                {project.adminFeedback}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 mt-6">
            {project.fileUrl && (
              <a href={project.fileUrl} target="_blank" rel="noopener noreferrer" download>
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" /> Download
                </Button>
              </a>
            )}
            <Button variant="outline" onClick={onClose}>Close</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Community card ─────────────────────────────────────────────────────────────

function CommunityCard({ project, currentUserId, onRated, onView }) {
  const isOwn = project.studentId === currentUserId || project.student?._id === currentUserId;
  const existingRating = project.ratings?.find((r) => r.userId === currentUserId)?.value ?? 0;
  const [rating, setRating] = useState(existingRating);
  const [saving, setSaving] = useState(false);
  const ext = extOf(project.fileName);
  const meta = EXT_META[ext] ?? { bg: "bg-gray-100 text-gray-700", stripe: "from-gray-400 to-gray-600" };
  const author = project.studentName || project.student?.fullName || "Anonymous";
  const avgRating = project.ratings?.length
    ? (project.ratings.reduce((s, r) => s + r.value, 0) / project.ratings.length).toFixed(1)
    : null;

  const handleRate = async (val) => {
    if (saving || isOwn) return;
    const prev = rating; setRating(val); setSaving(true);
    try { await projectService.rateProject(project._id, val); onRated?.(); }
    catch { setRating(prev); }
    finally { setSaving(false); }
  };

  return (
    <Card className="group border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col cursor-pointer"
      onClick={() => onView(project)}>
      {/* Top colour stripe */}
      <div className={`h-1 bg-gradient-to-r ${meta.stripe}`} />

      {/* File type banner */}
      <div className="px-4 pt-4 pb-0 flex items-center justify-between">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.bg}`}>{ext}</span>
        <div className="flex items-center gap-1.5">
          {isOwn && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#021d49]/10 text-[#021d49]">Yours</span>}
          <span className="text-[10px] text-gray-400">
            {new Date(project.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
          </span>
        </div>
      </div>

      <CardContent className="p-4 flex flex-col flex-1">
        {/* Title */}
        <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 mb-1.5 group-hover:text-[#021d49] transition-colors">
          {project.title}
        </h3>

        {project.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed flex-1">{project.description}</p>
        )}

        {project.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {project.tags.slice(0, 3).map((t) => (
              <span key={t} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-medium border border-blue-100">#{t}</span>
            ))}
            {project.tags.length > 3 && <span className="text-[10px] text-gray-400">+{project.tags.length - 3}</span>}
          </div>
        )}

        <Separator className="mb-3" />

        {/* Author + rating row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-7 h-7 rounded-full ${avatarColor(author)} flex items-center justify-center text-white text-[9px] font-bold shrink-0`}>
              {initials(author).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-700 truncate">{author}</p>
              <div className="flex items-center gap-1">
                <StarRating value={rating} onChange={handleRate} readOnly={isOwn || !currentUserId} />
                {avgRating && <span className="text-[10px] text-gray-400">{avgRating}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[#021d49] shrink-0 group-hover:gap-2 transition-all text-xs font-semibold">
            View <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Admin resource card ────────────────────────────────────────────────────────

function AdminResourceCard({ project, onView }) {
  const ext = extOf(project.fileName);
  const meta = EXT_META[ext] ?? { bg: "bg-gray-100 text-gray-700", stripe: "from-gray-400 to-gray-600" };
  const author = project.authorName || project.studentName || "Admin";

  return (
    <Card className="group border-violet-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col cursor-pointer"
      onClick={() => onView(project)}>
      <div className={`h-1 bg-gradient-to-r ${meta.stripe}`} />

      <div className="px-4 pt-4 pb-0 flex items-center justify-between">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.bg}`}>{ext}</span>
        <span className="inline-flex items-center gap-1 bg-violet-100 text-violet-700 text-[9px] font-bold px-2 py-0.5 rounded-full">
          <Shield className="w-2.5 h-2.5" /> Admin
        </span>
      </div>

      <CardContent className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 mb-1.5 group-hover:text-violet-700 transition-colors">
          {project.title}
        </h3>
        {project.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed flex-1">{project.description}</p>
        )}
        {project.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {project.tags.slice(0, 3).map((t) => (
              <span key={t} className="px-1.5 py-0.5 bg-violet-50 text-violet-600 rounded text-[10px] font-medium border border-violet-100">#{t}</span>
            ))}
          </div>
        )}
        <Separator className="mb-3" />
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-7 h-7 rounded-full ${avatarColor(author)} flex items-center justify-center text-white text-[9px] font-bold shrink-0`}>
              {initials(author).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-700 truncate">{author}</p>
              {project.authorEmail && (
                <p className="text-[10px] text-gray-400 truncate">{project.authorEmail}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 text-violet-600 shrink-0 text-xs font-semibold">
            View <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── My submission row ──────────────────────────────────────────────────────────

function MySubmissionCard({ project, onView, onEdit, onDelete }) {
  const ext = extOf(project.fileName);
  const meta = EXT_META[ext] ?? { bg: "bg-gray-100 text-gray-700", stripe: "from-gray-400 to-gray-600" };
  return (
    <Card className="border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className={`h-0.5 bg-gradient-to-r ${meta.stripe}`} />
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.bg}`}>
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm truncate">{project.title}</h3>
                {project.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{project.description}</p>}
              </div>
              <StatusBadge status={project.status} />
            </div>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="text-xs text-gray-400">
                {new Date(project.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </span>
              {project.tags?.slice(0, 2).map((t) => (
                <span key={t} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px]">#{t}</span>
              ))}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${meta.bg}`}>{ext}</span>
            </div>
            {project.adminFeedback && (
              <div className={`mt-2.5 p-2.5 rounded-lg text-xs leading-relaxed ${
                project.status === "rejected" ? "bg-red-50 text-red-700 border border-red-100" : "bg-green-50 text-green-700 border border-green-100"}`}>
                <span className="font-semibold">Admin: </span>{project.adminFeedback}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0 flex-col sm:flex-row">
            <Button variant="outline" size="sm" className="h-8 px-2.5 gap-1.5 text-xs" onClick={() => onView(project)}>
              <Eye className="w-3.5 h-3.5" /> View
            </Button>
            {project.status === "pending" && (
              <>
                <Button variant="outline" size="sm" className="h-8 px-2.5 gap-1.5 text-xs text-blue-600 hover:bg-blue-50 border-blue-200"
                  onClick={() => onEdit(project)}>
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </Button>
                <Button variant="outline" size="sm" className="h-8 px-2.5 text-red-500 hover:bg-red-50 border-red-200"
                  onClick={() => onDelete(project._id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
            {project.fileUrl && (
              <a href={project.fileUrl} target="_blank" rel="noopener noreferrer" download>
                <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs gap-1.5">
                  <Download className="w-3.5 h-3.5" />
                </Button>
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── submit/edit form ───────────────────────────────────────────────────────────

function DocumentForm({ form, setForm, file, setFile, fileError, setFileError, isEdit = false }) {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="doc-title">Title <span className="text-red-500">*</span></Label>
        <Input id="doc-title" placeholder="e.g. Research on Impact of AI in Healthcare"
          value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} maxLength={120} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="doc-desc">Description <span className="text-red-500">*</span></Label>
        <Textarea id="doc-desc" placeholder="Briefly describe your document — purpose, findings, methodology…"
          value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={4} maxLength={1000} />
        <p className="text-xs text-gray-400 text-right">{form.description.length}/1000</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="doc-tags">Tags <span className="text-gray-400 font-normal text-xs">(optional, comma-separated)</span></Label>
        <Input id="doc-tags" placeholder="e.g. research, data-science, health"
          value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} />
        {form.tags.trim() && (
          <div className="flex flex-wrap gap-1 mt-1">
            {form.tags.split(",").map((t) => t.trim()).filter(Boolean).map((t) => (
              <span key={t} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">#{t}</span>
            ))}
          </div>
        )}
      </div>
      {!isEdit && (
        <div className="space-y-1.5">
          <Label>File <span className="text-red-500">*</span></Label>
          <FileDropzone file={file} onFile={(f, err) => { setFile(f); setFileError(err); }}
            onClear={() => { setFile(null); setFileError(null); }} error={fileError} />
        </div>
      )}
    </div>
  );
}

// ── main page ──────────────────────────────────────────────────────────────────

export default function ResourceHubPage() {
  const { showToast } = useToast();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("community");

  const [community, setCommunity] = useState([]);
  const [communityLoading, setCommunityLoading] = useState(true);
  const [communityError, setCommunityError] = useState(null);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("");

  const [mine, setMine] = useState([]);
  const [mineLoading, setMineLoading] = useState(true);

  const [adminResources, setAdminResources] = useState([]);
  const [adminResLoading, setAdminResLoading] = useState(true);

  const [viewProject, setViewProject] = useState(null);
  const [viewIsAdmin, setViewIsAdmin] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [submitSheetOpen, setSubmitSheetOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [editSheet, setEditSheet] = useState(null);

  const EMPTY_FORM = { title: "", description: "", tags: "" };
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const openView = (project, isAdmin = false) => {
    setViewProject(project);
    setViewIsAdmin(isAdmin);
  };

  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    fetchCommunity();
    fetchMine();
    fetchAdminResources();
  }, []);

  const fetchCommunity = async () => {
    setCommunityLoading(true); setCommunityError(null);
    try {
      const res = await projectService.getCommunityProjects();
      setCommunity(Array.isArray(res) ? res : (res?.data ?? []));
    } catch (err) {
      if (err?.response?.status !== 404) {
        setCommunityError(err?.response?.data?.message || "Could not load community documents");
      }
    } finally { setCommunityLoading(false); }
  };

  const fetchMine = async () => {
    setMineLoading(true);
    try {
      const res = await projectService.getMySubmissions();
      setMine(Array.isArray(res) ? res : (res?.data ?? []));
    } catch { setMine([]); }
    finally { setMineLoading(false); }
  };

  const fetchAdminResources = async () => {
    setAdminResLoading(true);
    try {
      const res = await projectService.getAdminResources();
      setAdminResources(Array.isArray(res) ? res : (res?.data ?? []));
    } catch { setAdminResources([]); }
    finally { setAdminResLoading(false); }
  };

  const openSubmitSheet = () => {
    if (mine.length >= MAX_DOCS) {
      showToast(`You've reached the ${MAX_DOCS}-document limit. Delete a pending submission to free a slot.`, { type: "warning" });
      return;
    }
    setSubmitSheetOpen(true);
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) { showToast("Title is required", { type: "warning" }); return; }
    if (!form.description.trim()) { showToast("Description is required", { type: "warning" }); return; }
    if (!file) { showToast("Please attach a file", { type: "warning" }); return; }
    if (fileError) { showToast(fileError, { type: "warning" }); return; }
    setConfirmDialogOpen(true);
  };

  const handleConfirmedSubmit = async () => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title.trim());
      fd.append("description", form.description.trim());
      form.tags.split(",").map((t) => t.trim()).filter(Boolean).forEach((t) => fd.append("tags[]", t));
      fd.append("file", file);
      await projectService.submitProject(fd);
      showToast("Document submitted for review!", { type: "success" });
      setForm(EMPTY_FORM); setFile(null); setFileError(null);
      setSubmitSheetOpen(false); setConfirmDialogOpen(false);
      fetchMine(); setActiveTab("my");
    } catch (err) {
      showToast(err?.response?.data?.message || "Submission failed. Please try again.", { type: "error" });
      setConfirmDialogOpen(false);
    } finally { setSubmitting(false); }
  };

  const handleEditSave = async () => {
    if (!editForm.title.trim()) { showToast("Title is required", { type: "warning" }); return; }
    if (!editForm.description.trim()) { showToast("Description is required", { type: "warning" }); return; }
    setEditSubmitting(true);
    try {
      const tags = editForm.tags.split(",").map((t) => t.trim()).filter(Boolean);
      await projectService.updateSubmission(editSheet._id, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        tags,
      });
      showToast("Document updated!", { type: "success" });
      setEditSheet(null); fetchMine();
    } catch (err) {
      showToast(err?.response?.data?.message || "Update failed", { type: "error" });
      setEditSheet(null);
    } finally { setEditSubmitting(false); }
  };

  const handleDelete = async (id) => {
    try {
      await projectService.deleteSubmission(id);
      showToast("Submission deleted", { type: "success" });
      setMine((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to delete", { type: "error" });
    } finally { setDeleteConfirm(null); }
  };

  const openEdit = (project) => {
    setEditForm({ title: project.title || "", description: project.description || "", tags: project.tags?.join(", ") || "" });
    setEditSheet(project);
  };

  const allTags = [...new Set(community.flatMap((p) => p.tags ?? []))];
  const filteredCommunity = community.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.title?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
      || (p.studentName || "").toLowerCase().includes(q);
    const matchTag = !tagFilter || p.tags?.some((t) => t.toLowerCase() === tagFilter.toLowerCase());
    return matchSearch && matchTag;
  });

  const slotsLeft = Math.max(0, MAX_DOCS - mine.length);
  const counts = {
    community: community.length,
    mine: mine.length,
    adminRes: adminResources.length,
    approved: mine.filter((p) => p.status === "approved").length,
    pending: mine.filter((p) => p.status === "pending").length,
  };

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50/80">

        {/* Hero */}
        <div className="bg-gradient-to-br from-[#021d49] via-[#0a2d6e] to-[#0f3a8a] px-4 sm:px-6 lg:px-8 py-10">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
                  <Library className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white leading-none">Resource Hub</h1>
                  <p className="text-blue-200/70 text-xs mt-0.5">Community knowledge sharing platform</p>
                </div>
              </div>
              <p className="text-blue-100/60 text-sm mt-1">
                Share research, reports &amp; data files · {slotsLeft} of {MAX_DOCS} slots available
              </p>
            </div>
            <Button onClick={openSubmitSheet}
              className="bg-white text-[#021d49] hover:bg-blue-50 font-semibold gap-2 shadow-lg shrink-0 px-5">
              <Plus className="w-4 h-4" /> Share Document
              {slotsLeft < MAX_DOCS && (
                <span className="ml-1 bg-[#021d49]/10 text-[#021d49] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {slotsLeft} left
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="border-b border-gray-100 bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100">
              {[
                { label: "Community Docs",    value: counts.community, Icon: Globe,       color: "text-blue-600"   },
                { label: "Admin Resources",   value: counts.adminRes,  Icon: BookMarked,  color: "text-violet-600" },
                { label: "My Submissions",    value: counts.mine,      Icon: FolderOpen,  color: "text-indigo-600" },
                { label: "Pending Review",    value: counts.pending,   Icon: Clock,       color: "text-amber-600"  },
              ].map(({ label, value, Icon, color }) => (
                <div key={label} className="flex items-center gap-3 px-4 py-3 sm:py-4">
                  <Icon className={`w-5 h-5 shrink-0 ${color}`} />
                  <div>
                    <p className="text-xl font-bold text-gray-900 leading-none">{value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-white border border-gray-100 shadow-sm p-1 rounded-xl mb-6 flex gap-1 w-full sm:w-auto">
              <TabsTrigger value="community" className="rounded-lg gap-2 data-[state=active]:bg-[#021d49] data-[state=active]:text-white flex-1 sm:flex-none">
                <Globe className="w-3.5 h-3.5" /> Community
                {counts.community > 0 && <Badge className="ml-1 h-4 px-1.5 text-[10px] bg-blue-100 text-blue-700 border-0">{counts.community}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="admin" className="rounded-lg gap-2 data-[state=active]:bg-violet-700 data-[state=active]:text-white flex-1 sm:flex-none">
                <BookMarked className="w-3.5 h-3.5" /> From Admin
                {counts.adminRes > 0 && <Badge className="ml-1 h-4 px-1.5 text-[10px] bg-violet-100 text-violet-700 border-0">{counts.adminRes}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="my" className="rounded-lg gap-2 data-[state=active]:bg-[#021d49] data-[state=active]:text-white flex-1 sm:flex-none">
                <FolderOpen className="w-3.5 h-3.5" /> My Docs
                {counts.mine > 0 && <Badge className="ml-1 h-4 px-1.5 text-[10px] bg-indigo-100 text-indigo-700 border-0">{counts.mine}</Badge>}
              </TabsTrigger>
            </TabsList>

            {/* ── Community Tab ── */}
            <TabsContent value="community">
              <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input className="pl-9 bg-white" placeholder="Search documents…"
                    value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                {allTags.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    {allTags.slice(0, 7).map((tag) => (
                      <button key={tag} onClick={() => setTagFilter(tagFilter === tag ? "" : tag)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                          tagFilter === tag ? "bg-[#021d49] text-white shadow-sm" : "bg-white border border-gray-200 text-gray-600 hover:border-[#021d49]/40 hover:text-[#021d49]"}`}>
                        #{tag}
                      </button>
                    ))}
                    {tagFilter && (
                      <button onClick={() => setTagFilter("")} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700">
                        <X className="w-3 h-3" /> Clear
                      </button>
                    )}
                  </div>
                )}
              </div>

              {communityLoading ? (
                <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-[#021d49]" /></div>
              ) : communityError ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <AlertCircle className="w-12 h-12 text-gray-200 mb-3" />
                  <p className="text-gray-500 text-sm">{communityError}</p>
                  <Button variant="outline" size="sm" onClick={fetchCommunity} className="mt-4">Retry</Button>
                </div>
              ) : filteredCommunity.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-4 shadow-inner">
                    <Globe className="w-9 h-9 text-blue-300" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-700 mb-1">
                    {search || tagFilter ? "No matching documents" : "No community documents yet"}
                  </h3>
                  <p className="text-sm text-gray-400 max-w-sm mb-4">
                    {search || tagFilter ? "Try different search terms or remove the tag filter."
                      : "Be the first to share your research with the community!"}
                  </p>
                  {!search && !tagFilter && (
                    <Button onClick={openSubmitSheet} className="bg-[#021d49] text-white gap-2">
                      <Plus className="w-4 h-4" /> Share Document
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredCommunity.map((p) => (
                    <CommunityCard key={p._id} project={p} currentUserId={currentUser?._id}
                      onRated={fetchCommunity} onView={(proj) => openView(proj, false)} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ── Admin Resources Tab ── */}
            <TabsContent value="admin">
              {adminResLoading ? (
                <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-violet-600" /></div>
              ) : adminResources.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-20 h-20 bg-violet-50 rounded-3xl flex items-center justify-center mb-4 shadow-inner">
                    <BookMarked className="w-9 h-9 text-violet-300" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-700 mb-1">No resources yet</h3>
                  <p className="text-sm text-gray-400 max-w-sm">
                    Resources shared by the admin team will appear here — documents, guides, and curated reading materials.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-5 px-1">
                    <div className="w-7 h-7 bg-violet-100 rounded-lg flex items-center justify-center">
                      <Shield className="w-3.5 h-3.5 text-violet-600" />
                    </div>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold text-gray-900">{adminResources.length} resource{adminResources.length !== 1 ? "s" : ""}</span> shared by the admin team
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {adminResources.map((p) => (
                      <AdminResourceCard key={p._id} project={p} onView={(proj) => openView(proj, true)} />
                    ))}
                  </div>
                </>
              )}
            </TabsContent>

            {/* ── My Documents Tab ── */}
            <TabsContent value="my">
              <div className={`mb-5 flex items-center gap-3 p-3.5 rounded-xl border ${
                slotsLeft === 0 ? "bg-red-50 border-red-200 text-red-700"
                  : slotsLeft <= 2 ? "bg-amber-50 border-amber-200 text-amber-700"
                  : "bg-blue-50 border-blue-200 text-blue-700"}`}>
                <FolderOpen className="w-4 h-4 shrink-0" />
                <p className="text-xs font-medium flex-1">
                  {slotsLeft === 0
                    ? `Document limit reached (${MAX_DOCS}/${MAX_DOCS}). Delete a pending submission to free a slot.`
                    : `${mine.length} of ${MAX_DOCS} documents used — ${slotsLeft} slot${slotsLeft !== 1 ? "s" : ""} remaining`}
                </p>
                {slotsLeft > 0 && (
                  <Button size="sm" onClick={openSubmitSheet} className="bg-[#021d49] text-white h-7 text-xs gap-1.5 shrink-0">
                    <Plus className="w-3 h-3" /> Add
                  </Button>
                )}
              </div>

              {mineLoading ? (
                <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-[#021d49]" /></div>
              ) : mine.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mb-4 shadow-inner">
                    <FolderOpen className="w-9 h-9 text-indigo-300" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-700 mb-1">No submissions yet</h3>
                  <p className="text-sm text-gray-400 max-w-sm mb-4">
                    Share your research, reports, or data files. Approved documents appear in the community showcase.
                  </p>
                  <Button onClick={openSubmitSheet} className="bg-[#021d49] text-white gap-2">
                    <Plus className="w-4 h-4" /> Share Your First Document
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {mine.map((project) => (
                    <MySubmissionCard key={project._id} project={project}
                      onView={(proj) => openView(proj, false)} onEdit={openEdit} onDelete={setDeleteConfirm} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* ── Dialogs & Sheets ─────────────────────────────────────────────────── */}

      {/* PDF / Document viewer */}
      <DocViewerDialog
        project={viewProject}
        currentUserId={currentUser?._id}
        onClose={() => setViewProject(null)}
        onRated={fetchCommunity}
        isAdminResource={viewIsAdmin}
      />

      {/* Submit sheet */}
      <Sheet open={submitSheetOpen} onOpenChange={(o) => { if (!submitting) { setSubmitSheetOpen(o); if (!o) { setForm(EMPTY_FORM); setFile(null); setFileError(null); } } }}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-2">
              <Library className="w-5 h-5 text-[#021d49]" /> Share a Document
            </SheetTitle>
            <SheetDescription>Fill in the details and upload your file. An admin will review it before it appears in the community showcase.</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleReviewSubmit} className="space-y-5">
            <DocumentForm form={form} setForm={setForm} file={file} setFile={setFile} fileError={fileError} setFileError={setFileError} />
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button type="button" variant="outline" disabled={submitting}
                onClick={() => { setSubmitSheetOpen(false); setForm(EMPTY_FORM); setFile(null); setFileError(null); }}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-[#021d49] hover:bg-[#032a66] text-white gap-2">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Review &amp; Submit
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Confirm publish dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={(o) => { if (!submitting) setConfirmDialogOpen(o); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Submission</DialogTitle>
            <DialogDescription>Your document will be submitted for admin review. Once approved, it will be visible to all students in the community showcase.</DialogDescription>
          </DialogHeader>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-blue-800 space-y-1">
            <p className="font-semibold">{form.title}</p>
            {file && <p className="text-xs text-blue-600">{file.name} · {(file.size / 1024).toFixed(0)} KB</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)} disabled={submitting}>Back</Button>
            <Button onClick={handleConfirmedSubmit} disabled={submitting} className="bg-[#021d49] hover:bg-[#032a66] text-white gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? "Submitting…" : "Confirm & Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit sheet */}
      <Sheet open={!!editSheet} onOpenChange={(o) => { if (!editSubmitting && !o) setEditSheet(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-blue-600" /> Edit Document
            </SheetTitle>
            <SheetDescription>Update the title, description, or tags. The file cannot be replaced once submitted.</SheetDescription>
          </SheetHeader>
          <div className="space-y-5">
            <DocumentForm form={editForm} setForm={setEditForm} isEdit />
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button variant="outline" disabled={editSubmitting} onClick={() => setEditSheet(null)}>Cancel</Button>
              <Button disabled={editSubmitting} onClick={handleEditSave} className="bg-[#021d49] hover:bg-[#032a66] text-white gap-2">
                {editSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Submission</DialogTitle>
            <DialogDescription>Are you sure you want to delete this pending submission? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => handleDelete(deleteConfirm)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
