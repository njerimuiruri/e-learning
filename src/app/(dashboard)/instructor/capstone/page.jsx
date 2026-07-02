"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2, Clock, Loader2, RefreshCw, Search,
  GraduationCap, Trophy, AlertCircle, FileText, Eye,
  ChevronLeft, ChevronRight, Hourglass,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/ToastProvider";
import capstoneService from "@/lib/api/capstoneService";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PAGE_SIZE = 9;

function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_META = {
  draft:                    { label: "Draft",              color: "bg-gray-100 text-gray-600 border-gray-200" },
  submitted:                { label: "Pending Review",     color: "bg-amber-50 text-amber-700 border-amber-200" },
  under_review:             { label: "Under Review",       color: "bg-blue-50 text-blue-700 border-blue-200" },
  revision_requested:       { label: "Revision Requested", color: "bg-orange-50 text-orange-700 border-orange-200" },
  approved:                 { label: "Proposal Approved",  color: "bg-green-50 text-green-700 border-green-200" },
  implementation:           { label: "Building",           color: "bg-teal-50 text-teal-700 border-teal-200" },
  implementation_submitted: { label: "Final Submitted",    color: "bg-purple-50 text-purple-700 border-purple-200" },
  grading:                  { label: "Grading",            color: "bg-purple-50 text-purple-700 border-purple-200" },
  graded:                   { label: "Graded",             color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  completed:                { label: "Completed",          color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected:                 { label: "Rejected",           color: "bg-red-50 text-red-700 border-red-200" },
};

function isMarked(status) {
  return ["graded", "completed"].includes(status);
}
function needsGrade(status) {
  return ["implementation_submitted", "grading"].includes(status);
}
function isPendingReview(status) {
  return ["submitted", "under_review"].includes(status);
}
function isInProgress(status) {
  return ["approved", "implementation", "revision_requested"].includes(status);
}

function statusPill(status) {
  if (isMarked(status))
    return { label: "Marked", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: CheckCircle2 };
  if (needsGrade(status))
    return { label: "Awaiting Grade", cls: "bg-purple-50 text-purple-700 border-purple-200", Icon: Hourglass };
  if (isPendingReview(status))
    return { label: "Needs Review", cls: "bg-amber-50 text-amber-700 border-amber-200", Icon: Clock };
  return { label: "In Progress", cls: "bg-blue-50 text-blue-600 border-blue-200", Icon: Clock };
}

function avatarInitials(name = "") {
  return name.trim().split(" ").slice(0, 2).map((p) => p[0] || "").join("").toUpperCase() || "?";
}
function avatarColor(name = "") {
  const palette = ["bg-blue-600","bg-violet-600","bg-rose-600","bg-amber-600","bg-emerald-600","bg-cyan-600"];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return palette[h % palette.length];
}

// ─── Project card ──────────────────────────────────────────────────────────────

function ProjectCard({ item, onClick }) {
  const studentName = item.studentName || item.student?.fullName || "Unknown Student";
  const title       = item.title || "Untitled Project";
  const meta        = STATUS_META[item.status] ?? STATUS_META.draft;
  const marked      = isMarked(item.status);
  const pill        = statusPill(item.status);
  const PillIcon    = pill.Icon;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer group flex flex-col overflow-hidden"
    >
      <div className="p-5 flex flex-col flex-1 gap-4">
        {/* Student row */}
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${avatarColor(studentName)}`}>
            {avatarInitials(studentName)}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{studentName}</p>
            <p className="text-xs text-gray-400">{fmtDate(item.submittedAt || item.createdAt)}</p>
          </div>
        </div>

        {/* Project title */}
        <div className="flex-1">
          <div className="flex items-start gap-2 mb-2">
            <FileText className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <p className="text-sm font-semibold text-gray-800 line-clamp-2">{title}</p>
          </div>
        </div>

        {/* Status row */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className={`inline-flex items-center border rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.color}`}>
            {meta.label}
          </span>
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${pill.cls}`}>
            <PillIcon className="w-3 h-3" /> {pill.label}
          </span>
        </div>

        {/* Grade if marked */}
        {marked && item.grade != null && (
          <div className="flex items-center gap-2 bg-emerald-50 rounded-xl px-3 py-2">
            <Trophy className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="text-sm font-bold text-emerald-800">
              {item.grade}/100  {item.passed ? "Pass" : "Fail"}
            </p>
          </div>
        )}

        {/* View button */}
        <Button
          size="sm"
          className="w-full bg-[#021d49] hover:bg-[#032a66] text-white gap-2 mt-auto group-hover:bg-emerald-600 transition-colors"
          onClick={(e) => { e.stopPropagation(); onClick(); }}
        >
          <Eye className="w-3.5 h-3.5" /> View Project
        </Button>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function InstructorCapstonePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [items,      setItems]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search,     setSearch]     = useState("");
  const [filter,     setFilter]     = useState("all");
  const [page,       setPage]       = useState(1);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const res  = await capstoneService.getAllCapstones({ limit: 500 });
      const list = Array.isArray(res) ? res : (res?.data ?? res?.capstones ?? []);
      setItems(list);
    } catch {
      if (!silent) showToast("Failed to load submissions.", { type: "error" });
      setItems([]);
    } finally { setLoading(false); setRefreshing(false); }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  // Reset to page 1 when filter/search changes
  useEffect(() => { setPage(1); }, [filter, search]);

  const q = search.toLowerCase();
  const filtered = items
    .filter((it) =>
      !q ||
      (it.title || "").toLowerCase().includes(q) ||
      (it.studentName || it.student?.fullName || "").toLowerCase().includes(q)
    )
    .filter((it) => {
      if (filter === "marked")  return isMarked(it.status);
      if (filter === "grading") return needsGrade(it.status);
      if (filter === "pending") return isPendingReview(it.status);
      if (filter === "progress") return isInProgress(it.status);
      return it.status !== "draft";
    });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = {
    all:      items.filter((i) => i.status !== "draft").length,
    pending:  items.filter((i) => isPendingReview(i.status)).length,
    progress: items.filter((i) => isInProgress(i.status)).length,
    grading:  items.filter((i) => needsGrade(i.status)).length,
    marked:   items.filter((i) => isMarked(i.status)).length,
  };

  const FILTERS = [
    { id: "all",      label: "All",            count: counts.all      },
    { id: "pending",  label: "Needs Review",   count: counts.pending  },
    { id: "progress", label: "In Progress",    count: counts.progress },
    { id: "grading",  label: "Awaiting Grade", count: counts.grading  },
    { id: "marked",   label: "Marked",         count: counts.marked   },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-[#021d49]" />
            Capstone Reviews
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Review, approve, and grade student capstone projects.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => load(true)} disabled={refreshing} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total",          value: counts.all,      cls: "border-gray-200"                        },
          { label: "Needs Review",   value: counts.pending,  cls: "border-amber-200 bg-amber-50"           },
          { label: "Awaiting Grade", value: counts.grading,  cls: "border-purple-200 bg-purple-50"         },
          { label: "Marked",         value: counts.marked,   cls: "border-emerald-200 bg-emerald-50"       },
        ].map(({ label, value, cls }) => (
          <div key={label} className={`rounded-2xl border p-4 text-center bg-white ${cls} shadow-sm`}>
            <p className="text-2xl font-extrabold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            className="pl-9 bg-white"
            placeholder="Search by student or project…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                filter === f.id
                  ? "bg-[#021d49] text-white border-[#021d49]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              }`}
            >
              {f.label}
              {f.count > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  filter === f.id ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                }`}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-gray-300" />
          </div>
          <p className="font-semibold text-gray-700">
            {search ? "No results match your search." : "No submissions yet."}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {search ? "Try a different name or title." : "Submissions will appear here when students submit."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginated.map((item) => (
              <ProjectCard
                key={item._id}
                item={item}
                onClick={() => router.push(`/instructor/capstone/${item._id}`)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3.5">
              <p className="text-sm text-gray-500">
                Showing <span className="font-semibold text-gray-800">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}</span> of <span className="font-semibold text-gray-800">{filtered.length}</span>
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold border transition-all ${
                      pg === page
                        ? "bg-[#021d49] text-white border-[#021d49]"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {pg}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
