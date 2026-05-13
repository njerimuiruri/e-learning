"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Upload, Star, Download, Search, Clock,
  CheckCircle, XCircle, FileText, Plus, X, Tag,
  Trash2, Loader2, FolderOpen,
  BookOpen, Users, AlertCircle, Eye, Edit2,
  Library, Shield, Globe, BookMarked, Mail,
  ChevronRight, ExternalLink, Layers, Sparkles,
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

// ── Unified resource card (community + admin) ─────────────────────────────────

function ResourceCard({ project, currentUserId, isAdmin = false, onView }) {
  const isOwn = !isAdmin && (project.studentId === currentUserId || project.student?._id === currentUserId);
  const existingRating = project.ratings?.find((r) => r.userId === currentUserId)?.value ?? 0;
  const [rating, setRating] = useState(existingRating);
  const [saving, setSaving] = useState(false);
  const ext = extOf(project.fileName);
  const meta = EXT_META[ext] ?? { bg: "bg-gray-100 text-gray-700", stripe: "from-gray-400 to-gray-600" };
  const author = isAdmin
    ? (project.authorName || project.studentName || "Admin Team")
    : (project.studentName || project.student?.fullName || "Anonymous");
  const avgRating = project.ratings?.length
    ? (project.ratings.reduce((s, r) => s + r.value, 0) / project.ratings.length).toFixed(1)
    : null;

  const handleRate = async (val) => {
    if (saving || isOwn || isAdmin) return;
    const prev = rating; setRating(val); setSaving(true);
    try { await projectService.rateProject(project._id, val); }
    catch { setRating(prev); }
    finally { setSaving(false); }
  };

  return (
    <Card
      className={`group border-0 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col cursor-pointer rounded-2xl
        ${isAdmin ? "ring-1 ring-violet-100 hover:ring-violet-300" : "ring-1 ring-gray-100 hover:ring-blue-200"}`}
      onClick={() => onView(project, isAdmin)}>

      {/* File-type preview banner */}
      <div className={`relative h-28 bg-gradient-to-br ${meta.stripe} flex items-center justify-center overflow-hidden shrink-0`}>
        <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full" />
        <div className="absolute -bottom-4 -left-4 w-14 h-14 bg-white/10 rounded-full" />
        <div className="relative flex flex-col items-center gap-1.5">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <span className="text-white font-bold text-xs tracking-widest uppercase">{ext}</span>
        </div>

        {/* Top-left: date */}
        <span className="absolute top-2.5 left-3 text-[9px] text-white/60 bg-black/20 px-1.5 py-0.5 rounded-full backdrop-blur-sm">
          {new Date(project.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
        </span>

        {/* Top-right: badges */}
        <div className="absolute top-2.5 right-3 flex flex-col items-end gap-1">
          {isAdmin && (
            <span className="inline-flex items-center gap-1 bg-white text-violet-700 text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
              <Shield className="w-2.5 h-2.5" /> Admin
            </span>
          )}
          {isOwn && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white text-[#021d49] shadow-sm">Yours</span>
          )}
        </div>
      </div>

      <CardContent className="p-4 flex flex-col flex-1">
        <h3 className={`font-bold text-gray-900 text-sm leading-snug line-clamp-2 mb-1.5 transition-colors
          ${isAdmin ? "group-hover:text-violet-700" : "group-hover:text-[#021d49]"}`}>
          {project.title}
        </h3>

        {project.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed flex-1">{project.description}</p>
        )}

        {project.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {project.tags.slice(0, 3).map((t) => (
              <span key={t} className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium
                ${isAdmin ? "bg-violet-50 text-violet-600" : "bg-blue-50 text-blue-600"}`}>
                #{t}
              </span>
            ))}
            {project.tags.length > 3 && <span className="text-[10px] text-gray-400">+{project.tags.length - 3}</span>}
          </div>
        )}

        <div className="h-px bg-gray-100 mb-3" />

        {/* Author + rating row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-7 h-7 rounded-full ${avatarColor(author)} flex items-center justify-center text-white text-[9px] font-bold shrink-0`}>
              {initials(author).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-700 truncate">{author}</p>
              {!isAdmin && (
                <div className="flex items-center gap-1">
                  <StarRating value={rating} onChange={handleRate} readOnly={isOwn || !currentUserId} />
                  {avgRating && <span className="text-[10px] text-gray-400">{avgRating}</span>}
                </div>
              )}
              {isAdmin && project.authorEmail && (
                <p className="text-[10px] text-gray-400 truncate">{project.authorEmail}</p>
              )}
            </div>
          </div>
          <div className={`flex items-center gap-1 shrink-0 group-hover:gap-1.5 transition-all text-[11px] font-bold px-2.5 py-1 rounded-lg
            ${isAdmin ? "bg-violet-50 text-violet-600 group-hover:bg-violet-100" : "bg-[#021d49]/8 text-[#021d49] group-hover:bg-[#021d49]/12"}`}>
            View <ChevronRight className="w-3 h-3" />
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
    <Card className="border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden rounded-2xl">
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
  const router = useRouter();
  const { showToast } = useToast();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("resources");

  const [community, setCommunity] = useState([]);
  const [communityLoading, setCommunityLoading] = useState(true);
  const [communityError, setCommunityError] = useState(null);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all"); // "all" | "community" | "admin"

  const [mine, setMine] = useState([]);
  const [mineLoading, setMineLoading] = useState(true);

  const [adminResources, setAdminResources] = useState([]);
  const [adminResLoading, setAdminResLoading] = useState(true);

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

  const handleView = (project, isAdmin = false) => {
    const type = isAdmin ? "admin" : "community";
    try { sessionStorage.setItem(`resource_detail_${project._id}`, JSON.stringify(project)); } catch {}
    router.push(`/student/projects/${project._id}?type=${type}`);
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

  // Merged + filtered resources list
  const taggedAdmin = adminResources.map((r) => ({ ...r, _source: "admin" }));
  const taggedCommunity = community.map((r) => ({ ...r, _source: "community" }));
  const allResources = [...taggedAdmin, ...taggedCommunity].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const allTags = [...new Set(allResources.flatMap((p) => p.tags ?? []))];

  const filteredResources = allResources.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.title?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
      || (p.studentName || p.authorName || "").toLowerCase().includes(q);
    const matchTag = !tagFilter || p.tags?.some((t) => t.toLowerCase() === tagFilter.toLowerCase());
    const matchSource = sourceFilter === "all" || p._source === sourceFilter;
    return matchSearch && matchTag && matchSource;
  });

  const isResourcesLoading = communityLoading || adminResLoading;
  const slotsLeft = Math.max(0, MAX_DOCS - mine.length);
  const counts = {
    all: allResources.length,
    community: community.length,
    admin: adminResources.length,
    mine: mine.length,
    pending: mine.filter((p) => p.status === "pending").length,
  };

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50/80">

        {/* ── Hero with stats inline ── */}
        <div className="relative bg-gradient-to-br from-[#021d49] via-[#0a2d6e] to-[#0f3a8a] px-4 sm:px-6 lg:px-8 pt-10 pb-0 overflow-hidden">
          {/* Decorative blobs */}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-0 left-1/2 w-56 h-56 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto relative">
            {/* Title + CTA row */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5 mb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-lg">
                    <Library className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">Resource Hub</h1>
                    <p className="text-blue-200/60 text-xs mt-0.5">Community knowledge sharing platform</p>
                  </div>
                </div>
                <p className="text-blue-100/50 text-sm mt-2 ml-[60px]">
                  Discover research, guides &amp; data files from peers and the admin team
                </p>
              </div>
              <Button onClick={openSubmitSheet}
                className="bg-white text-[#021d49] hover:bg-blue-50 font-semibold gap-2 shadow-xl shrink-0 px-6 h-11 rounded-xl border-0">
                <Plus className="w-4 h-4" /> Share Document
                {slotsLeft < MAX_DOCS && (
                  <span className="ml-1 bg-[#021d49]/10 text-[#021d49] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {slotsLeft} left
                  </span>
                )}
              </Button>
            </div>

            {/* Stat tiles — flush to bottom of hero */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-0">
              {[
                { label: "Total Resources", value: counts.all,     Icon: Layers,     bg: "bg-white/10",          border: "border-white/15" },
                { label: "Admin Resources", value: counts.admin,   Icon: Shield,     bg: "bg-violet-500/20",     border: "border-violet-300/20" },
                { label: "My Submissions",  value: counts.mine,    Icon: FolderOpen, bg: "bg-blue-400/15",       border: "border-blue-300/20" },
                { label: "Pending Review",  value: counts.pending, Icon: Clock,      bg: "bg-amber-400/15",      border: "border-amber-300/20" },
              ].map(({ label, value, Icon, bg, border }) => (
                <div key={label} className={`rounded-t-xl px-4 py-3.5 ${bg} border-t border-l border-r ${border} backdrop-blur-sm`}>
                  <Icon className="w-4 h-4 text-white/50 mb-2" />
                  <p className="text-2xl font-bold text-white leading-none">{value}</p>
                  <p className="text-[11px] text-white/50 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tabs + content ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* Tab nav */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <TabsList className="bg-white border border-gray-100 shadow-sm p-1 rounded-xl flex gap-1">
                <TabsTrigger value="resources"
                  className="rounded-lg gap-2 text-sm data-[state=active]:bg-[#021d49] data-[state=active]:text-white data-[state=active]:shadow-sm px-4">
                  <Globe className="w-3.5 h-3.5" /> All Resources
                  {counts.all > 0 && (
                    <span className="ml-1 bg-gray-100 text-gray-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full data-[state=active]:bg-white/20 data-[state=active]:text-white">
                      {counts.all}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="my"
                  className="rounded-lg gap-2 text-sm data-[state=active]:bg-[#021d49] data-[state=active]:text-white data-[state=active]:shadow-sm px-4">
                  <FolderOpen className="w-3.5 h-3.5" /> My Docs
                  {counts.mine > 0 && (
                    <span className="ml-1 bg-gray-100 text-gray-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {counts.mine}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* ── All Resources Tab ── */}
            <TabsContent value="resources">

              {/* Search + filter bar */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <Input
                      className="pl-9 bg-gray-50 border-gray-200 focus:border-[#021d49] focus:ring-[#021d49]/10 h-10"
                      placeholder="Search by title, description or author…"
                      value={search} onChange={(e) => setSearch(e.target.value)} />
                  </div>

                  {/* Source chips */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { key: "all",       label: "All",       count: counts.all       },
                      { key: "community", label: "Community", count: counts.community  },
                      { key: "admin",     label: "Admin",     count: counts.admin      },
                    ].map(({ key, label, count }) => (
                      <button key={key} onClick={() => setSourceFilter(key)}
                        className={`h-10 px-4 rounded-xl text-sm font-semibold transition-all border ${
                          sourceFilter === key
                            ? key === "admin"
                              ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                              : "bg-[#021d49] text-white border-[#021d49] shadow-sm"
                            : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-100"}`}>
                        {label}
                        {count > 0 && (
                          <span className={`ml-1.5 text-[11px] ${sourceFilter === key ? "opacity-70" : "text-gray-400"}`}>
                            {count}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tag pills */}
                {allTags.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    {allTags.slice(0, 8).map((tag) => (
                      <button key={tag} onClick={() => setTagFilter(tagFilter === tag ? "" : tag)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                          tagFilter === tag
                            ? "bg-[#021d49] text-white shadow-sm"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                        #{tag}
                      </button>
                    ))}
                    {tagFilter && (
                      <button onClick={() => setTagFilter("")}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors">
                        <X className="w-3 h-3" /> Clear
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Admin callout banner */}
              {counts.admin > 0 && sourceFilter !== "community" && (
                <div className="mb-5 flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100">
                  <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
                    <Shield className="w-4.5 h-4.5 text-violet-600" />
                  </div>
                  <p className="text-sm text-gray-700 flex-1">
                    <span className="font-semibold text-violet-700">{counts.admin} resource{counts.admin !== 1 ? "s" : ""}</span>
                    {" "}curated by the admin team are included in this list — look for the{" "}
                    <span className="inline-flex items-center gap-0.5 bg-violet-100 text-violet-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      <Shield className="w-2.5 h-2.5" /> Admin
                    </span>
                    {" "}badge.
                  </p>
                </div>
              )}

              {/* Grid */}
              {isResourcesLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-64 bg-white rounded-2xl border border-gray-100 animate-pulse" />
                  ))}
                </div>
              ) : filteredResources.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-gray-100">
                  <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-4">
                    <Globe className="w-9 h-9 text-blue-300" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-700 mb-1">
                    {search || tagFilter ? "No matching resources" : "No resources yet"}
                  </h3>
                  <p className="text-sm text-gray-400 max-w-sm mb-5">
                    {search || tagFilter
                      ? "Try different search terms or remove the filter."
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
                  {filteredResources.map((p) => (
                    <ResourceCard
                      key={`${p._source}-${p._id}`}
                      project={p}
                      currentUserId={currentUser?._id}
                      isAdmin={p._source === "admin"}
                      onView={handleView}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ── My Documents Tab ── */}
            <TabsContent value="my">
              {/* Slot usage banner */}
              <div className={`mb-5 flex items-center gap-3 p-4 rounded-2xl border ${
                slotsLeft === 0
                  ? "bg-red-50 border-red-200 text-red-700"
                  : slotsLeft <= 2
                    ? "bg-amber-50 border-amber-200 text-amber-700"
                    : "bg-blue-50 border-blue-100 text-blue-700"}`}>
                {/* Slot progress dots */}
                <div className="flex items-center gap-1 shrink-0">
                  {Array.from({ length: MAX_DOCS }).map((_, i) => (
                    <div key={i} className={`w-2.5 h-2.5 rounded-full ${i < mine.length ? "bg-current opacity-80" : "bg-current opacity-20"}`} />
                  ))}
                </div>
                <p className="text-xs font-medium flex-1">
                  {slotsLeft === 0
                    ? `Limit reached (${MAX_DOCS}/${MAX_DOCS}). Delete a pending submission to free a slot.`
                    : `${mine.length} of ${MAX_DOCS} slots used — ${slotsLeft} remaining`}
                </p>
                {slotsLeft > 0 && (
                  <Button size="sm" onClick={openSubmitSheet} className="bg-[#021d49] text-white h-8 text-xs gap-1.5 shrink-0 rounded-lg">
                    <Plus className="w-3 h-3" /> Add Document
                  </Button>
                )}
              </div>

              {mineLoading ? (
                <div className="flex items-center justify-center py-24">
                  <Loader2 className="w-8 h-8 animate-spin text-[#021d49]" />
                </div>
              ) : mine.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-gray-100">
                  <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mb-4">
                    <FolderOpen className="w-9 h-9 text-indigo-300" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-700 mb-1">No submissions yet</h3>
                  <p className="text-sm text-gray-400 max-w-sm mb-5">
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
                      onView={(proj) => handleView(proj, false)}
                      onEdit={openEdit}
                      onDelete={setDeleteConfirm} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* ── Sheets & Dialogs ─────────────────────────────────────────────────── */}

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
