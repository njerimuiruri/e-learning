"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3, Users, Layers, Trophy, TrendingUp, CheckCircle2,
  Clock, XCircle, RotateCcw, BookOpen, GraduationCap,
  AlertCircle, Loader2, RefreshCw, Star, Target, Award,
  MapPin, UserCheck, Globe,
} from "lucide-react";
import moduleService from "@/lib/api/moduleService";
import capstoneService from "@/lib/api/capstoneService";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pct(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function avg(arr) {
  if (!arr.length) return 0;
  return Math.round(arr.reduce((s, v) => s + v, 0) / arr.length);
}

const STATUS_META = {
  draft:                    { label: "Draft",           color: "bg-gray-400"   },
  submitted:                { label: "Pending Review",  color: "bg-amber-400"  },
  under_review:             { label: "Under Review",    color: "bg-blue-400"   },
  revision_requested:       { label: "Revision Req.",   color: "bg-orange-400" },
  approved:                 { label: "Approved",        color: "bg-green-400"  },
  implementation:           { label: "Building",        color: "bg-teal-400"   },
  implementation_submitted: { label: "Final Submitted", color: "bg-purple-400" },
  grading:                  { label: "Grading",         color: "bg-violet-400" },
  graded:                   { label: "Graded",          color: "bg-emerald-500"},
  completed:                { label: "Completed",       color: "bg-emerald-600"},
  rejected:                 { label: "Rejected",        color: "bg-red-400"    },
};

const MODULE_STATUS_META = {
  draft:      { label: "Draft",     color: "bg-gray-100 text-gray-600 border-gray-200"    },
  submitted:  { label: "Submitted", color: "bg-blue-50 text-blue-700 border-blue-200"     },
  approved:   { label: "Approved",  color: "bg-green-50 text-green-700 border-green-200"  },
  published:  { label: "Published", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected:   { label: "Rejected",  color: "bg-red-50 text-red-700 border-red-200"        },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-5 flex items-center gap-4 ${accent || "border-gray-100"}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${accent ? accent.replace("border-", "bg-").replace("-200", "-50") : "bg-gray-50"}`}>
        <Icon className={`w-6 h-6 ${accent ? accent.replace("border-", "text-").replace("-200", "-600") : "text-gray-500"}`} />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-gray-900 leading-none">{value ?? "—"}</p>
        <p className="text-sm font-medium text-gray-700 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-9 h-9 bg-[#021d49]/8 rounded-xl flex items-center justify-center">
        <Icon className="w-5 h-5 text-[#021d49]" />
      </div>
      <div>
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
    </div>
  );
}

function BarRow({ label, value, total, color, suffix = "" }) {
  const width = pct(value, total);
  return (
    <div className="flex items-center gap-3">
      <p className="text-xs text-gray-600 w-36 shrink-0 truncate">{label}</p>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${width}%` }} />
      </div>
      <p className="text-xs font-bold text-gray-700 w-12 text-right shrink-0">
        {value}{suffix}
      </p>
    </div>
  );
}

function GradeBar({ grade }) {
  const buckets = [
    { label: "0–49",  range: [0, 49],  color: "bg-red-400"     },
    { label: "50–64", range: [50, 64], color: "bg-orange-400"  },
    { label: "65–74", range: [65, 74], color: "bg-amber-400"   },
    { label: "75–84", range: [75, 84], color: "bg-blue-400"    },
    { label: "85–100",range: [85,100], color: "bg-emerald-500" },
  ];
  const counts = buckets.map((b) => ({
    ...b,
    count: grade.filter((g) => g >= b.range[0] && g <= b.range[1]).length,
  }));
  const max = Math.max(...counts.map((c) => c.count), 1);
  return (
    <div className="space-y-2.5">
      {counts.map((b) => (
        <BarRow key={b.label} label={b.label} value={b.count} total={max} color={b.color} suffix=" students" />
      ))}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function InstructorAnalyticsPage() {
  const [stats,      setStats]      = useState(null);
  const [modules,    setModules]    = useState([]);
  const [capstones,  setCapstones]  = useState([]);
  const [students,   setStudents]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");

  const load = async (silent = false) => {
    if (silent) setRefreshing(true); else setLoading(true);
    try {
      // Fetch each source independently so one failure doesn't zero-out the others
      const fetchStats = moduleService.getInstructorStats().then(setStats).catch(() => {});

      const fetchModules = moduleService.getInstructorModules()
        .then((res) => {
          const list = Array.isArray(res) ? res : res?.modules ?? [];
          setModules(list);
        })
        .catch(() => {});

      const fetchCapstones = capstoneService.getAllCapstones({ limit: 500 })
        .then((res) => {
          // Handle all possible response shapes from the backend
          let list = [];
          if (Array.isArray(res))              list = res;
          else if (Array.isArray(res?.data))   list = res.data;
          else if (Array.isArray(res?.capstones)) list = res.capstones;
          else if (Array.isArray(res?.items))  list = res.items;
          setCapstones(list);
        })
        .catch(() => {});

      const fetchStudents = moduleService.getInstructorStudents()
        .then((res) => {
          const list = Array.isArray(res?.students) ? res.students : Array.isArray(res) ? res : [];
          setStudents(list);
        })
        .catch(() => {});

      await Promise.all([fetchStats, fetchModules, fetchCapstones, fetchStudents]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Derived capstone analytics ──────────────────────────────────────────────
  const totalCapstones   = capstones.length;
  const gradedCapstones  = capstones.filter((c) => ["graded","completed"].includes(c.status));
  const passedCapstones  = gradedCapstones.filter((c) => c.passed);
  const gradesArr        = gradedCapstones.filter((c) => c.grade != null).map((c) => c.grade);
  const avgGrade         = avg(gradesArr);
  const passRate         = pct(passedCapstones.length, gradedCapstones.length);

  const capstoneStatusGroups = [
    { label: "Pending Review",  value: capstones.filter((c) => ["submitted","under_review"].includes(c.status)).length,    color: "bg-amber-400"  },
    { label: "In Progress",     value: capstones.filter((c) => ["approved","implementation","revision_requested"].includes(c.status)).length, color: "bg-blue-400" },
    { label: "Awaiting Grade",  value: capstones.filter((c) => ["implementation_submitted","grading"].includes(c.status)).length, color: "bg-purple-400" },
    { label: "Graded",          value: gradedCapstones.length,                                                             color: "bg-emerald-500"},
    { label: "Rejected",        value: capstones.filter((c) => c.status === "rejected").length,                            color: "bg-red-400"   },
  ];

  // ── Derived module analytics ────────────────────────────────────────────────
  const totalModules   = modules.length;
  const publishedMods  = modules.filter((m) => m.status === "published").length;
  const totalLessons   = modules.reduce((s, m) => s + (m.lessons?.length || 0), 0);
  const totalStudents  = stats?.totalStudents ?? 0;

  // Top modules by enrollment
  const topModules = [...modules]
    .sort((a, b) => (b.enrollmentCount || 0) - (a.enrollmentCount || 0))
    .slice(0, 6);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto" />
          <p className="text-sm text-gray-500">Loading analytics…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 space-y-8">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#021d49]" />
            Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Insights across your modules, students, and capstone projects.
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* ── Section 1: Key Metrics ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Enrolled Students"
          value={totalStudents}
          sub="Across your modules"
          accent="border-blue-200"
        />
        <StatCard
          icon={Layers}
          label="Total Modules"
          value={totalModules}
          sub={`${publishedMods} published`}
          accent="border-emerald-200"
        />
        <StatCard
          icon={BookOpen}
          label="Total Lessons"
          value={totalLessons}
          sub="Across all modules"
          accent="border-violet-200"
        />
        <StatCard
          icon={GraduationCap}
          label="Capstone Submissions"
          value={totalCapstones}
          sub={`${gradedCapstones.length} graded`}
          accent="border-amber-200"
        />
      </div>

      {/* ── Section 2: Completion & Capstone split ── */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Completion rate */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <SectionHeader icon={TrendingUp} title="Teaching Overview" subtitle="Summary of your content and reach" />
          <div className="space-y-5">
            {/* Completion rate ring */}
            <div className="flex items-center gap-6">
              <div className="relative w-20 h-20 shrink-0">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                  <circle
                    cx="40" cy="40" r="32" fill="none"
                    stroke="#10b981" strokeWidth="10"
                    strokeDasharray={`${2 * Math.PI * 32}`}
                    strokeDashoffset={`${2 * Math.PI * 32 * (1 - (stats?.completionRate ?? 0) / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-sm font-extrabold text-gray-900">{stats?.completionRate ?? 0}%</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-lg font-bold text-gray-900">{stats?.completionRate ?? 0}% Completion Rate</p>
                <p className="text-sm text-gray-500">Overall student completion across your modules.</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { label: "Modules",  value: totalModules,   icon: Layers,    color: "bg-blue-50 text-blue-700"    },
                { label: "Lessons",  value: totalLessons,   icon: BookOpen,  color: "bg-violet-50 text-violet-700"},
                { label: "Enrolled", value: totalStudents,  icon: Users,     color: "bg-emerald-50 text-emerald-700"},
              ].map(({ label, value, icon: I, color }) => (
                <div key={label} className={`rounded-xl p-3 text-center ${color.split(" ")[0]}`}>
                  <I className={`w-5 h-5 mx-auto mb-1 ${color.split(" ")[1]}`} />
                  <p className={`text-xl font-extrabold ${color.split(" ")[1]}`}>{value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Module status breakdown */}
            {stats?.modulesByStatus && Object.keys(stats.modulesByStatus).length > 0 && (
              <div className="pt-3 border-t border-gray-50 space-y-2.5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Module Statuses</p>
                {Object.entries(stats.modulesByStatus).map(([status, count]) => {
                  const meta = MODULE_STATUS_META[status] || MODULE_STATUS_META.draft;
                  const barColor = {
                    draft: "bg-gray-300", submitted: "bg-blue-400",
                    approved: "bg-green-400", published: "bg-emerald-500", rejected: "bg-red-400",
                  }[status] || "bg-gray-300";
                  return (
                    <BarRow
                      key={status}
                      label={meta.label}
                      value={count}
                      total={totalModules || 1}
                      color={barColor}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Capstone summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <SectionHeader icon={GraduationCap} title="Capstone Summary" subtitle="Submission status and grading overview" />

          {totalCapstones === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                <GraduationCap className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">No capstone submissions yet.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-extrabold text-emerald-700">{avgGrade || "—"}</p>
                  <p className="text-xs text-emerald-600 mt-0.5">Avg Grade</p>
                </div>
                <div className={`rounded-xl p-3 text-center ${passRate >= 70 ? "bg-emerald-50" : "bg-amber-50"}`}>
                  <p className={`text-2xl font-extrabold ${passRate >= 70 ? "text-emerald-700" : "text-amber-700"}`}>{passRate}%</p>
                  <p className={`text-xs mt-0.5 ${passRate >= 70 ? "text-emerald-600" : "text-amber-600"}`}>Pass Rate</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-extrabold text-purple-700">{gradedCapstones.length}</p>
                  <p className="text-xs text-purple-600 mt-0.5">Graded</p>
                </div>
              </div>

              {/* Status breakdown bars */}
              <div className="space-y-2.5 pt-2 border-t border-gray-50">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Status Breakdown</p>
                {capstoneStatusGroups.map((g) => (
                  <BarRow key={g.label} label={g.label} value={g.value} total={totalCapstones} color={g.color} />
                ))}
              </div>

              {/* Grade distribution */}
              {gradesArr.length > 0 && (
                <div className="pt-3 border-t border-gray-50">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Grade Distribution</p>
                  <GradeBar grade={gradesArr} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Section 3: Module Performance Table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-50">
          <SectionHeader icon={Layers} title="Module Performance" subtitle="Enrollment and lesson count per module" />
        </div>

        {modules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-gray-400 text-sm">No modules found.</p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="grid grid-cols-12 gap-2 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
              <div className="col-span-5">Module</div>
              <div className="col-span-2 text-center">Status</div>
              <div className="col-span-2 text-center">Lessons</div>
              <div className="col-span-3">Enrollment</div>
            </div>

            {/* Max enrollment for bar scaling */}
            {(() => {
              const maxEnroll = Math.max(...modules.map((m) => m.enrollmentCount || 0), 1);
              return (
                <div className="divide-y divide-gray-50">
                  {modules.map((mod) => {
                    const meta = MODULE_STATUS_META[mod.status] || MODULE_STATUS_META.draft;
                    const enrollment = mod.enrollmentCount || 0;
                    const barW = pct(enrollment, maxEnroll);
                    return (
                      <div key={mod._id} className="grid grid-cols-12 gap-2 px-6 py-4 items-center hover:bg-gray-50/60 transition-colors">
                        <div className="col-span-5 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{mod.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5 capitalize">{mod.level || "—"}</p>
                        </div>
                        <div className="col-span-2 flex justify-center">
                          <span className={`inline-flex items-center border rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.color}`}>
                            {meta.label}
                          </span>
                        </div>
                        <div className="col-span-2 text-center">
                          <span className="text-sm font-bold text-gray-700">{mod.lessons?.length || 0}</span>
                        </div>
                        <div className="col-span-3 flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                              style={{ width: `${barW}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-gray-600 w-6 text-right shrink-0">{enrollment}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </>
        )}
      </div>

      {/* ── Section 4: Capstone graded students table ── */}
      {gradedCapstones.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-50">
            <SectionHeader icon={Trophy} title="Graded Capstone Projects" subtitle="All graded submissions with scores" />
          </div>

          <div className="divide-y divide-gray-50">
            {gradedCapstones.map((c) => {
              const name = c.studentName || c.student?.fullName || "Student";
              const score = c.grade ?? "—";
              const passed = c.passed;
              return (
                <div key={c._id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors">
                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                    ["bg-blue-500","bg-violet-500","bg-rose-500","bg-amber-500","bg-emerald-500"][
                      name.charCodeAt(0) % 5
                    ]
                  }`}>
                    {name.slice(0,2).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{name}</p>
                    <p className="text-xs text-gray-400 truncate">{c.title || "Untitled Project"}</p>
                  </div>

                  {/* Score bar */}
                  <div className="hidden sm:flex items-center gap-2 w-36">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${score >= 75 ? "bg-emerald-500" : score >= 50 ? "bg-amber-400" : "bg-red-400"}`}
                        style={{ width: `${typeof score === "number" ? score : 0}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-700 w-10 text-right">{score}/100</span>
                  </div>

                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold shrink-0 ${
                    passed ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                  }`}>
                    {passed ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {passed ? "Pass" : "Fail"}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Footer summary */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-6 text-sm">
              <span className="text-gray-500">
                <span className="font-bold text-emerald-700">{passedCapstones.length}</span> passed ·{" "}
                <span className="font-bold text-red-600">{gradedCapstones.length - passedCapstones.length}</span> failed
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-sm font-bold text-gray-700">Average: {avgGrade}/100</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Section 5: Enrolled Students ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between gap-4 flex-wrap">
          <SectionHeader icon={Users} title="Enrolled Students" subtitle={`${students.length} student${students.length !== 1 ? "s" : ""} across your modules`} />
          {students.length > 0 && (
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" strokeWidth="2"/><path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </span>
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search student…"
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:border-emerald-400 bg-gray-50 w-44"
              />
            </div>
          )}
        </div>

        {students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-gray-400 text-sm">No enrolled students found.</p>
          </div>
        ) : (() => {
          const q = studentSearch.toLowerCase();
          const filtered = q
            ? students.filter((s) =>
                s.name?.toLowerCase().includes(q) ||
                s.email?.toLowerCase().includes(q) ||
                s.country?.toLowerCase().includes(q)
              )
            : students;

          const genderCounts = students.reduce((acc, s) => {
            const g = (s.gender || "unknown").toLowerCase();
            acc[g] = (acc[g] || 0) + 1;
            return acc;
          }, {});
          const topCountries = Object.entries(
            students.reduce((acc, s) => {
              if (s.country) acc[s.country] = (acc[s.country] || 0) + 1;
              return acc;
            }, {})
          ).sort((a, b) => b[1] - a[1]).slice(0, 4);

          return (
            <>
              {/* Summary chips */}
              <div className="px-6 py-4 flex items-center gap-3 flex-wrap border-b border-gray-50">
                {Object.entries(genderCounts).map(([g, count]) => (
                  <div key={g} className="flex items-center gap-1.5 bg-blue-50 rounded-full px-3 py-1 text-xs font-semibold text-blue-700">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span className="capitalize">{g}:</span>
                    <span>{count}</span>
                  </div>
                ))}
                {topCountries.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 ml-1 flex-wrap">
                    <Globe className="w-3.5 h-3.5" />
                    <span>Top countries:</span>
                    {topCountries.map(([c, n]) => (
                      <span key={c} className="bg-gray-100 rounded-full px-2 py-0.5 text-gray-600 font-medium">{c} ({n})</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Table header */}
              <div className="grid grid-cols-12 gap-2 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <div className="col-span-4">Student</div>
                <div className="col-span-2 text-center">Gender</div>
                <div className="col-span-2 text-center">Country</div>
                <div className="col-span-4">Progress</div>
              </div>

              <div className="divide-y divide-gray-50 max-h-[480px] overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="flex items-center justify-center py-12 text-sm text-gray-400">
                    No students match your search.
                  </div>
                ) : filtered.map((s) => {
                  const initials = s.name.trim().split(" ").slice(0, 2).map((p) => p[0] || "").join("").toUpperCase() || "?";
                  const avatarColors = ["bg-blue-500","bg-violet-500","bg-rose-500","bg-amber-500","bg-emerald-500","bg-cyan-500"];
                  const avatarColor = avatarColors[(s.name.charCodeAt(0) || 0) % avatarColors.length];
                  const progressColor = s.progress >= 75 ? "bg-emerald-500" : s.progress >= 40 ? "bg-amber-400" : "bg-blue-400";
                  return (
                    <div key={s.id} className="grid grid-cols-12 gap-2 px-6 py-3.5 items-center hover:bg-gray-50/60 transition-colors">
                      <div className="col-span-4 flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{s.name}</p>
                          <p className="text-xs text-gray-400 truncate">{s.email}</p>
                        </div>
                      </div>

                      <div className="col-span-2 flex justify-center">
                        {s.gender ? (
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-purple-50 text-purple-700 capitalize">
                            <UserCheck className="w-3 h-3" />
                            {s.gender}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </div>

                      <div className="col-span-2 flex justify-center">
                        {s.country ? (
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-teal-50 text-teal-700 max-w-[7rem]">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate">{s.country}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </div>

                      <div className="col-span-4 flex items-center gap-2.5">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${progressColor}`}
                            style={{ width: `${s.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-700 w-10 text-right shrink-0">{s.progress}%</span>
                        <span className="text-xs text-gray-400 shrink-0 hidden sm:inline">
                          {s.modulesCompleted}/{s.modulesEnrolled} mod.
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filtered.length > 0 && (
                <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                  <span>{filtered.length} student{filtered.length !== 1 ? "s" : ""}{q ? " found" : " enrolled"}</span>
                  <span>
                    Avg progress:{" "}
                    <strong className="text-gray-600">
                      {Math.round(filtered.reduce((acc, st) => acc + (st.progress || 0), 0) / (filtered.length || 1))}%
                    </strong>
                  </span>
                </div>
              )}
            </>
          );
        })()}
      </div>

    </div>
  );
}
