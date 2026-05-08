"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  CheckCircle, XCircle, Clock, Eye, MessageSquare,
  Search, Download, Loader2, AlertCircle, ThumbsUp, ThumbsDown,
  FolderOpen, Upload, X, BookMarked, RefreshCw, FileText,
  ChevronLeft, ChevronRight, Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/ToastProvider";
import projectService from "@/lib/api/projectService";
import adminService from "@/lib/api/adminService";

// ── helpers ────────────────────────────────────────────────────────────────

function fmt(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const STATUS = {
  pending:  { cls: "bg-amber-50 text-amber-700 border-amber-200",  label: "Pending",  Icon: Clock        },
  approved: { cls: "bg-green-50 text-green-700 border-green-200",  label: "Approved", Icon: CheckCircle  },
  rejected: { cls: "bg-red-50 text-red-700 border-red-200",        label: "Rejected", Icon: XCircle      },
};

function StatusBadge({ status }) {
  const s = STATUS[status] ?? STATUS.pending;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${s.cls}`}>
      <s.Icon className="w-3 h-3" />{s.label}
    </span>
  );
}

const PAGE_SIZE = 10;

// ── main page ──────────────────────────────────────────────────────────────

export default function AdminProjectsPage() {
  const { showToast } = useToast();

  // data
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  // filters + pagination
  const [tab, setTab]           = useState("all");
  const [search, setSearch]     = useState("");
  const [page, setPage]         = useState(1);

  // view dialog
  const [viewing, setViewing]   = useState(null);

  // action dialog  (approve / reject / feedback)
  const [action, setAction]     = useState(null); // { project, type }
  const [feedback, setFeedback] = useState("");
  const [actLoading, setActLoading] = useState(false);

  // delete confirm
  const [deleting, setDeleting]     = useState(null); // project to delete
  const [delLoading, setDelLoading] = useState(false);

  // ── upload dialog ──────────────────────────────────────────────────────
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadDrag, setUploadDrag] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: "", description: "", tags: "",
    authorName: "", authorEmail: "", targetEmail: "",
  });
  const fileRef = useRef(null);

  // fellow search inside upload dialog (target fellow)
  const [fellowQuery, setFellowQuery]     = useState("");
  const [fellowResults, setFellowResults] = useState([]);
  const [fellowSearching, setFellowSearching] = useState(false);
  const [fellowDropOpen, setFellowDropOpen]   = useState(false);
  const debounceRef = useRef(null);

  // author email combobox
  const [authorQuery, setAuthorQuery]         = useState("");
  const [authorResults, setAuthorResults]     = useState([]);
  const [authorSearching, setAuthorSearching] = useState(false);
  const [authorDropOpen, setAuthorDropOpen]   = useState(false);
  const authorDebounceRef = useRef(null);

  // ── data fetching ──────────────────────────────────────────────────────

  const fetchProjects = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res  = await projectService.getAdminSubmissions();
      const list = Array.isArray(res) ? res : (res?.projects ?? res?.data ?? []);
      setProjects(list);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to load submissions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  // ── filtering + pagination ─────────────────────────────────────────────

  const filtered = projects.filter((p) => {
    if (tab !== "all" && p.status !== tab) return false;
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      p.title?.toLowerCase().includes(q) ||
      p.studentName?.toLowerCase().includes(q) ||
      p.studentEmail?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageRows   = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const counts = {
    all:      projects.length,
    pending:  projects.filter(p => p.status === "pending").length,
    approved: projects.filter(p => p.status === "approved").length,
    rejected: projects.filter(p => p.status === "rejected").length,
  };

  // reset to page 1 on filter change
  useEffect(() => { setPage(1); }, [tab, search]);

  // ── actions ────────────────────────────────────────────────────────────

  const submitAction = async () => {
    if (!action) return;
    const { project, type } = action;
    if ((type === "reject" || type === "feedback") && !feedback.trim()) {
      showToast(type === "reject" ? "Rejection reason is required" : "Feedback is required", { type: "warning" });
      return;
    }
    setActLoading(true);
    try {
      if      (type === "approve")  await projectService.approveProject(project._id, feedback);
      else if (type === "reject")   await projectService.rejectProject(project._id, feedback);
      else                          await projectService.addFeedback(project._id, feedback);

      showToast(
        type === "approve" ? "Project approved and published!" :
        type === "reject"  ? "Project rejected." : "Feedback sent!",
        { type: type === "reject" ? "info" : "success" }
      );

      setProjects(prev => prev.map(p =>
        p._id === project._id
          ? { ...p, status: type === "approve" ? "approved" : type === "reject" ? "rejected" : p.status,
              adminFeedback: feedback || p.adminFeedback }
          : p
      ));
      setAction(null); setFeedback("");
    } catch (e) {
      showToast(e?.response?.data?.message || "Action failed", { type: "error" });
    } finally {
      setActLoading(false);
    }
  };

  // ── delete ─────────────────────────────────────────────────────────────

  const confirmDelete = async () => {
    if (!deleting) return;
    setDelLoading(true);
    try {
      await projectService.adminDeleteResource(deleting._id);
      showToast("Project deleted.", { type: "info" });
      setProjects(prev => prev.filter(p => p._id !== deleting._id));
      setDeleting(null);
    } catch (e) {
      showToast(e?.response?.data?.message || "Delete failed", { type: "error" });
    } finally {
      setDelLoading(false);
    }
  };

  // ── fellow search ──────────────────────────────────────────────────────

  const onFellowChange = (val) => {
    setFellowQuery(val);
    setUploadForm(f => ({ ...f, targetEmail: val }));
    clearTimeout(debounceRef.current);
    if (!val.trim()) { setFellowResults([]); setFellowDropOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      setFellowSearching(true);
      try {
        const res  = await adminService.getAllFellows({ search: val.trim(), limit: 8 });
        const list = Array.isArray(res) ? res : (res?.fellows ?? res?.data ?? []);
        setFellowResults(list);
        setFellowDropOpen(list.length > 0);
      } catch { /* silent */ }
      finally { setFellowSearching(false); }
    }, 300);
  };

  const onAuthorEmailChange = (val) => {
    setAuthorQuery(val);
    setUploadForm(f => ({ ...f, authorEmail: val }));
    clearTimeout(authorDebounceRef.current);
    if (!val.trim()) { setAuthorResults([]); setAuthorDropOpen(false); return; }
    authorDebounceRef.current = setTimeout(async () => {
      setAuthorSearching(true);
      try {
        const res  = await adminService.getAllFellows({ search: val.trim(), limit: 8 });
        const list = Array.isArray(res) ? res : (res?.fellows ?? res?.data ?? []);
        setAuthorResults(list);
        setAuthorDropOpen(list.length > 0);
      } catch { /* silent */ }
      finally { setAuthorSearching(false); }
    }, 300);
  };

  // ── upload ─────────────────────────────────────────────────────────────

  const resetUpload = () => {
    setUploadForm({ title: "", description: "", tags: "", authorName: "", authorEmail: "", targetEmail: "" });
    setUploadFile(null); setUploadDrag(false);
    setFellowQuery(""); setFellowResults([]); setFellowDropOpen(false);
    setAuthorQuery(""); setAuthorResults([]); setAuthorDropOpen(false);
    setUploadOpen(false);
  };

  const submitUpload = async () => {
    const { title, authorName, authorEmail } = uploadForm;
    if (!title.trim() || !authorName.trim() || !authorEmail.trim()) {
      showToast("Title, author name and email are required", { type: "warning" });
      return;
    }
    if (!uploadFile) { showToast("Please select a file", { type: "warning" }); return; }
    setUploadLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", uploadFile);
      fd.append("title", title.trim());
      fd.append("description", uploadForm.description.trim() || " ");
      fd.append("authorName", authorName.trim());
      fd.append("authorEmail", authorEmail.trim());
      if (uploadForm.targetEmail.trim()) fd.append("targetEmail", uploadForm.targetEmail.trim());
      uploadForm.tags.split(",").map(t => t.trim()).filter(Boolean).forEach(t => fd.append("tags[]", t));
      await projectService.adminUploadResource(fd);
      showToast("Resource uploaded and published to fellows!", { type: "success" });
      resetUpload();
      fetchProjects();
    } catch (e) {
      showToast(e?.response?.data?.message || "Upload failed", { type: "error" });
    } finally {
      setUploadLoading(false);
    }
  };

  // ── render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50/50 pt-20 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Projects</h1>
            <p className="text-sm text-gray-500 mt-0.5">Review, approve, and manage community project submissions</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchProjects} className="gap-2">
              <RefreshCw className="w-4 h-4" /> Refresh
            </Button>
            <button
              type="button"
              onClick={() => setUploadOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload Resource for Fellows
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { key: "all",      label: "Total",          Icon: FolderOpen,  color: "bg-blue-50 text-blue-600"   },
            { key: "pending",  label: "Pending Review", Icon: Clock,       color: "bg-amber-50 text-amber-600"  },
            { key: "approved", label: "Approved",       Icon: CheckCircle, color: "bg-green-50 text-green-600"  },
            { key: "rejected", label: "Rejected",       Icon: XCircle,     color: "bg-red-50 text-red-600"      },
          ].map(({ key, label, Icon, color }) => (
            <Card key={key} className={`border-0 shadow-sm cursor-pointer transition-all ${tab === key ? "ring-2 ring-violet-500" : ""}`}
              onClick={() => setTab(key)}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 leading-none">{counts[key]}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table Card */}
        <Card className="border-0 shadow-sm">
          {/* Toolbar */}
          <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input className="pl-9 text-sm" placeholder="Search title, student, email…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {["all","pending","approved","rejected"].map(s => (
                <button key={s} onClick={() => setTab(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    tab === s ? "bg-[#021d49] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}>
                  {s.charAt(0).toUpperCase() + s.slice(1)} ({counts[s]})
                </button>
              ))}
            </div>
          </div>

          {/* Body */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-[#021d49]" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
              <AlertCircle className="w-10 h-10 text-gray-300" />
              <p className="text-sm text-gray-500">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchProjects}>Retry</Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
              <FolderOpen className="w-10 h-10 text-gray-300" />
              <p className="text-sm text-gray-500">No submissions found.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {["Project", "Student", "Tags", "Status", "Submitted", "Actions"].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {pageRows.map(p => (
                      <tr key={p._id} className="hover:bg-gray-50/60 transition-colors">

                        {/* Project */}
                        <td className="px-5 py-3.5 max-w-[220px]">
                          <p className="font-medium text-gray-900 truncate">{p.title}</p>
                          <p className="text-xs text-gray-400 truncate">{p.description}</p>
                        </td>

                        {/* Student */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <p className="font-medium text-gray-900">{p.studentName || "—"}</p>
                          <p className="text-xs text-gray-400">{p.studentEmail || ""}</p>
                        </td>

                        {/* Tags */}
                        <td className="px-5 py-3.5">
                          <div className="flex flex-wrap gap-1">
                            {(p.tags ?? []).slice(0, 2).map(t => (
                              <span key={t} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-medium">#{t}</span>
                            ))}
                            {(p.tags ?? []).length > 2 && (
                              <span className="text-[10px] text-gray-400">+{p.tags.length - 2}</span>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <StatusBadge status={p.status} />
                        </td>

                        {/* Submitted */}
                        <td className="px-5 py-3.5 whitespace-nowrap text-xs text-gray-500">{fmt(p.createdAt)}</td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setViewing(p)}
                              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-500 transition-colors"
                              title="View details">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {p.fileUrl && (
                              <a href={p.fileUrl} target="_blank" rel="noopener noreferrer" download
                                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-500 transition-colors"
                                title="Download">
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {p.status !== "approved" && (
                              <button onClick={() => { setAction({ project: p, type: "approve" }); setFeedback(""); }}
                                className="p-1.5 rounded-lg border border-green-200 hover:bg-green-50 text-green-600 transition-colors"
                                title="Approve">
                                <ThumbsUp className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {p.status !== "rejected" && (
                              <button onClick={() => { setAction({ project: p, type: "reject" }); setFeedback(""); }}
                                className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-500 transition-colors"
                                title="Reject">
                                <ThumbsDown className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button onClick={() => { setAction({ project: p, type: "feedback" }); setFeedback(p.adminFeedback ?? ""); }}
                              className="p-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 text-blue-600 transition-colors"
                              title="Feedback">
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setDeleting(p)}
                              className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-500 transition-colors"
                              title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                      className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pg;
                      if (totalPages <= 5) pg = i + 1;
                      else if (safePage <= 3) pg = i + 1;
                      else if (safePage >= totalPages - 2) pg = totalPages - 4 + i;
                      else pg = safePage - 2 + i;
                      return (
                        <button key={pg} onClick={() => setPage(pg)}
                          className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                            pg === safePage ? "bg-[#021d49] text-white" : "border border-gray-200 hover:bg-gray-50 text-gray-600"
                          }`}>
                          {pg}
                        </button>
                      );
                    })}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                      className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      {/* ── View Dialog ────────────────────────────────────────────────────── */}
      <Dialog open={!!viewing} onOpenChange={() => setViewing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Project Details</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <h3 className="font-semibold text-gray-900">{viewing.title}</h3>
                <StatusBadge status={viewing.status} />
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{viewing.description}</p>
              <Separator />
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: "Student",   value: viewing.studentName  || "—" },
                  { label: "Email",     value: viewing.studentEmail || "—" },
                  { label: "Submitted", value: fmt(viewing.createdAt) },
                  { label: "File",      value: viewing.fileName || "—" },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                    <p className="font-medium text-gray-800 truncate">{value}</p>
                  </div>
                ))}
              </div>
              {viewing.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {viewing.tags.map(t => (
                    <span key={t} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">#{t}</span>
                  ))}
                </div>
              )}
              {viewing.adminFeedback && (
                <div className={`p-3 rounded-lg text-sm leading-relaxed ${
                  viewing.status === "rejected" ? "bg-red-50 text-red-700 border border-red-100" : "bg-green-50 text-green-700 border border-green-100"
                }`}>
                  <p className="font-semibold text-xs uppercase tracking-wide mb-1">Admin Feedback</p>
                  {viewing.adminFeedback}
                </div>
              )}
              {viewing.fileUrl && (
                <a href={viewing.fileUrl} target="_blank" rel="noopener noreferrer" download>
                  <Button className="w-full gap-2 bg-[#021d49] hover:bg-[#032a66] text-white">
                    <Download className="w-4 h-4" /> Download File
                  </Button>
                </a>
              )}
              <div className="flex gap-2">
                {viewing.status !== "approved" && (
                  <Button className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => { setAction({ project: viewing, type: "approve" }); setFeedback(""); setViewing(null); }}>
                    <ThumbsUp className="w-4 h-4" /> Approve
                  </Button>
                )}
                {viewing.status !== "rejected" && (
                  <Button className="flex-1 gap-2 bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => { setAction({ project: viewing, type: "reject" }); setFeedback(""); setViewing(null); }}>
                    <ThumbsDown className="w-4 h-4" /> Reject
                  </Button>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewing(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Action Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={!!action} onOpenChange={() => { setAction(null); setFeedback(""); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {action?.type === "approve" ? "Approve Project" :
               action?.type === "reject"  ? "Reject Project"  : "Send Feedback"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-700">{action?.project?.title}</p>
            {action?.type === "approve" && (
              <div className="p-3 bg-green-50 border border-green-100 rounded-lg text-sm text-green-700">
                This will publish the project to the community showcase and notify the student.
              </div>
            )}
            {action?.type === "reject" && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
                The student will be notified with the reason you provide.
              </div>
            )}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                {action?.type === "approve"  ? "Message to student (optional)" :
                 action?.type === "reject"   ? "Rejection reason *" : "Feedback *"}
              </label>
              <Textarea rows={4} value={feedback} onChange={e => setFeedback(e.target.value)}
                placeholder={
                  action?.type === "approve" ? "Great work! Your project has been published…" :
                  action?.type === "reject"  ? "Please provide a clear reason for rejection…" :
                  "Write your feedback for the student…"
                } />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setAction(null); setFeedback(""); }}>Cancel</Button>
            <Button onClick={submitAction} disabled={actLoading}
              className={`gap-2 text-white ${
                action?.type === "approve" ? "bg-green-600 hover:bg-green-700" :
                action?.type === "reject"  ? "bg-red-600 hover:bg-red-700" :
                "bg-[#021d49] hover:bg-[#032a66]"
              }`}>
              {actLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {action?.type === "approve" ? "Approve & Publish" :
               action?.type === "reject"  ? "Reject Project" : "Send Feedback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm Dialog ─────────────────────────────────────────── */}
      <Dialog open={!!deleting} onOpenChange={v => { if (!v && !delLoading) setDeleting(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
              This action is permanent and cannot be undone.
            </div>
            <p className="text-sm text-gray-700">
              Are you sure you want to delete <span className="font-semibold">{deleting?.title}</span>?
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleting(null)} disabled={delLoading}>Cancel</Button>
            <Button onClick={confirmDelete} disabled={delLoading}
              className="gap-2 bg-red-600 hover:bg-red-700 text-white">
              {delLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {delLoading ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Upload Resource Dialog ─────────────────────────────────────────── */}
      <Dialog open={uploadOpen} onOpenChange={v => { if (!v && !uploadLoading) resetUpload(); }}>
        <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-5 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                <BookMarked className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <DialogTitle className="text-base">Upload Resource for Fellows</DialogTitle>
                <p className="text-xs text-gray-500 mt-0.5">Published immediately · visible to all fellows or a specific one</p>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[70vh]">
            <div className="px-6 py-5 space-y-4">

              {/* File picker */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1.5">File <span className="text-red-500">*</span></p>
                <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.csv,.xls,.xlsx"
                  className="hidden" id="dlg-file-input"
                  onChange={e => setUploadFile(e.target.files[0] || null)} />

                {uploadFile ? (
                  <div className="flex items-center gap-3 p-4 border-2 border-violet-200 bg-violet-50 rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{uploadFile.name}</p>
                      <p className="text-xs text-gray-500">{(uploadFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button type="button" onClick={() => setUploadFile(null)}
                      className="p-1.5 rounded-lg hover:bg-violet-100 text-gray-400 hover:text-gray-600 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onDragOver={e => { e.preventDefault(); setUploadDrag(true); }}
                    onDragLeave={() => setUploadDrag(false)}
                    onDrop={e => { e.preventDefault(); setUploadDrag(false); const f = e.dataTransfer.files[0]; if (f) setUploadFile(f); }}
                    onClick={() => fileRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                      uploadDrag ? "border-violet-400 bg-violet-50" : "border-gray-200 hover:border-violet-300 hover:bg-violet-50/40"
                    }`}>
                    <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-600">Click to browse or drag & drop</p>
                    <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX, CSV, XLS, XLSX · max 10 MB</p>
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label htmlFor="up-title" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Title <span className="text-red-500">*</span>
                </label>
                <Input id="up-title" placeholder="e.g. Python Fundamentals Cheat Sheet"
                  value={uploadForm.title}
                  onChange={e => setUploadForm(f => ({ ...f, title: e.target.value }))} />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="up-desc" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description <span className="text-gray-400 font-normal text-xs">(optional)</span>
                </label>
                <Textarea id="up-desc" rows={3} placeholder="Brief description of this resource…"
                  value={uploadForm.description}
                  onChange={e => setUploadForm(f => ({ ...f, description: e.target.value }))} />
              </div>

              {/* Author Email combobox → auto-fills Author Name */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Author Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  <Input
                    className="pl-9 pr-8"
                    type="email"
                    placeholder="Search by email…"
                    value={authorQuery}
                    autoComplete="off"
                    onChange={e => onAuthorEmailChange(e.target.value)}
                    onFocus={() => authorQuery.trim() && authorResults.length > 0 && setAuthorDropOpen(true)}
                  />
                  {authorSearching ? (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 animate-spin" />
                  ) : authorQuery ? (
                    <button type="button"
                      onClick={() => { setAuthorQuery(""); setUploadForm(f => ({ ...f, authorEmail: "", authorName: "" })); setAuthorResults([]); setAuthorDropOpen(false); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : null}
                </div>

                {authorDropOpen && authorResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    <ul className="max-h-48 overflow-y-auto divide-y divide-gray-50">
                      {authorResults.map(u => {
                        const name = `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.fullName || "—";
                        return (
                          <li key={u._id || u.email}>
                            <button type="button"
                              onMouseDown={e => {
                                e.preventDefault();
                                setAuthorQuery(u.email || "");
                                setUploadForm(fm => ({ ...fm, authorEmail: u.email || "", authorName: name }));
                                setAuthorDropOpen(false);
                              }}
                              className="w-full text-left px-4 py-2.5 hover:bg-violet-50 transition-colors">
                              <p className="text-sm font-medium text-gray-900">{name}</p>
                              <p className="text-xs text-gray-500">{u.email}</p>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>

              {/* Author Name (auto-filled, still editable) */}
              <div>
                <label htmlFor="up-aname" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Author Name <span className="text-red-500">*</span>
                </label>
                <Input id="up-aname" placeholder="Auto-filled from email selection"
                  value={uploadForm.authorName}
                  onChange={e => setUploadForm(f => ({ ...f, authorName: e.target.value }))} />
              </div>

              {/* Tags */}
              <div>
                <label htmlFor="up-tags" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tags <span className="text-gray-400 font-normal text-xs">(comma-separated, optional)</span>
                </label>
                <Input id="up-tags" placeholder="python, data science, beginner"
                  value={uploadForm.tags}
                  onChange={e => setUploadForm(f => ({ ...f, tags: e.target.value }))} />
              </div>

              {/* Target fellow */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Target Fellow <span className="text-gray-400 font-normal text-xs">(leave blank for all fellows)</span>
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  <Input className="pl-9 pr-8" placeholder="Search by name or email…"
                    value={fellowQuery} autoComplete="off"
                    onChange={e => onFellowChange(e.target.value)}
                    onFocus={() => fellowQuery.trim() && fellowResults.length > 0 && setFellowDropOpen(true)} />
                  {fellowSearching ? (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 animate-spin" />
                  ) : fellowQuery ? (
                    <button type="button" onClick={() => { setFellowQuery(""); setUploadForm(f => ({ ...f, targetEmail: "" })); setFellowResults([]); setFellowDropOpen(false); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : null}
                </div>

                {fellowDropOpen && fellowResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    <ul className="max-h-48 overflow-y-auto divide-y divide-gray-50">
                      {fellowResults.map(f => {
                        const name = `${f.firstName || ""} ${f.lastName || ""}`.trim() || f.fullName || "—";
                        return (
                          <li key={f._id || f.email}>
                            <button type="button"
                              onMouseDown={e => { e.preventDefault(); setFellowQuery(f.email || ""); setUploadForm(fm => ({ ...fm, targetEmail: f.email || "" })); setFellowDropOpen(false); }}
                              className="w-full text-left px-4 py-2.5 hover:bg-violet-50 transition-colors">
                              <p className="text-sm font-medium text-gray-900">{name}</p>
                              <p className="text-xs text-gray-500">{f.email}</p>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                <p className={`text-xs mt-1 ${uploadForm.targetEmail.trim() ? "text-green-600" : "text-violet-500"}`}>
                  {uploadForm.targetEmail.trim() ? `Targeted to: ${uploadForm.targetEmail}` : "Visible to all enrolled fellows."}
                </p>
              </div>
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <Button variant="outline" onClick={resetUpload} disabled={uploadLoading}>Cancel</Button>
            <Button onClick={submitUpload} disabled={uploadLoading}
              className="gap-2 bg-violet-600 hover:bg-violet-700 text-white">
              {uploadLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploadLoading ? "Uploading…" : "Upload & Publish"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
