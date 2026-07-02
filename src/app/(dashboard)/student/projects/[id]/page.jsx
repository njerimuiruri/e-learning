"use client";

import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Download, Star, Shield, Mail,
  FileText, ExternalLink, Calendar, Tag, Eye, EyeOff,
  ChevronRight, Globe, Loader2, AlertCircle, BookMarked,
  Users, Clock, CheckCircle, Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/navbar/navbar";
import authService from "@/lib/api/authService";
import projectService from "@/lib/api/projectService";

// ── helpers ───────────────────────────────────────────────────────────────────

const EXT_META = {
  PDF:  { bg: "bg-red-100 text-red-700",     stripe: "from-red-500 to-red-700",   icon: "bg-red-500"  },
  DOC:  { bg: "bg-blue-100 text-blue-700",   stripe: "from-blue-500 to-blue-700", icon: "bg-blue-500" },
  DOCX: { bg: "bg-blue-100 text-blue-700",   stripe: "from-blue-500 to-blue-700", icon: "bg-blue-500" },
  CSV:  { bg: "bg-emerald-100 text-emerald-700", stripe: "from-emerald-500 to-emerald-700", icon: "bg-emerald-500" },
  XLS:  { bg: "bg-emerald-100 text-emerald-700", stripe: "from-emerald-500 to-emerald-700", icon: "bg-emerald-500" },
  XLSX: { bg: "bg-emerald-100 text-emerald-700", stripe: "from-emerald-500 to-emerald-700", icon: "bg-emerald-500" },
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
  const colors = ["bg-blue-600", "bg-violet-600", "bg-rose-600", "bg-amber-600", "bg-emerald-600", "bg-cyan-600"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return colors[h % colors.length];
}

function formatDate(str) {
  if (!str) return "";
  return new Date(str).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

// ── Star Rating ───────────────────────────────────────────────────────────────

function StarRating({ value = 0, onChange, readOnly = false }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" disabled={readOnly}
          onClick={() => !readOnly && onChange?.(star)}
          onMouseEnter={() => !readOnly && setHovered(star)}
          onMouseLeave={() => !readOnly && setHovered(0)}
          className={`transition-transform ${readOnly ? "cursor-default" : "cursor-pointer hover:scale-110"}`}>
          <Star className={`w-6 h-6 transition-colors ${(hovered || value) >= star ? "fill-amber-400 text-amber-400" : "text-gray-200 fill-gray-200"}`} />
        </button>
      ))}
    </div>
  );
}

// ── main page ──────────────────────────────────────────────────────────────────

export default function ResourceDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const id = params?.id;
  const type = searchParams?.get("type") || "community";
  const isAdmin = type === "admin";

  const [currentUser, setCurrentUser] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPreview, setShowPreview] = useState(true);
  const [rating, setRating] = useState(0);
  const [ratingSaving, setRatingSaving] = useState(false);
  const [ratingDone, setRatingDone] = useState(false);

  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    fetchProject(user);
  }, [id, type]);

  const fetchProject = async (user) => {
    if (!id) return;
    setLoading(true); setError(null);
    try {
      // Try sessionStorage first  avoids calling the non-existent /admin-resources/:id endpoint
      try {
        const cached = sessionStorage.getItem(`resource_detail_${id}`);
        if (cached) {
          const doc = JSON.parse(cached);
          setProject(doc);
          const uid = user?._id;
          const existing = doc?.ratings?.find((r) => r.userId === uid)?.value ?? 0;
          setRating(existing);
          if (existing > 0) setRatingDone(true);
          setLoading(false);
          return;
        }
      } catch {}

      // Fallback: only community resources have a reliable by-ID endpoint
      const res = await projectService.getProjectById(id);
      const doc = res?.data ?? res;
      setProject(doc);
      const uid = user?._id;
      const existing = doc?.ratings?.find((r) => r.userId === uid)?.value ?? 0;
      setRating(existing);
      if (existing > 0) setRatingDone(true);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not load resource");
    } finally { setLoading(false); }
  };

  const handleRate = async (val) => {
    if (ratingSaving || isOwn || isAdmin) return;
    const prev = rating;
    setRating(val);
    setRatingSaving(true);
    try {
      await projectService.rateProject(id, val);
      setRatingDone(true);
    } catch {
      setRating(prev);
    } finally { setRatingSaving(false); }
  };

  const isOwn = !isAdmin && project && (
    project.studentId === currentUser?._id || project.student?._id === currentUser?._id
  );

  const ext = extOf(project?.fileName);
  const meta = EXT_META[ext] ?? { bg: "bg-gray-100 text-gray-700", stripe: "from-gray-500 to-gray-700", icon: "bg-gray-500" };

  const author = isAdmin
    ? (project?.authorName || project?.studentName || "Admin Team")
    : (project?.studentName || project?.student?.fullName || "Anonymous");

  const avgRating = project?.ratings?.length
    ? (project.ratings.reduce((s, r) => s + r.value, 0) / project.ratings.length).toFixed(1)
    : null;

  const isPdf = ext === "PDF";

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-[#021d49] mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Loading resource…</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !project) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Resource not found</h2>
            <p className="text-gray-500 text-sm mb-6">{error || "This resource may have been removed or is unavailable."}</p>
            <Button onClick={() => router.push("/student/projects")}
              className="bg-[#021d49] text-white gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Resource Hub
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">

        {/* ── Hero banner ── */}
        <div className={`bg-gradient-to-br ${isAdmin ? "from-[#2d1065] via-[#4c1d95] to-[#6d28d9]" : "from-[#021d49] via-[#0a2d6e] to-[#0f3a8a]"} pb-0`}>

          {/* Breadcrumb */}
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-5">
            <nav className="flex items-center gap-1.5 text-xs text-white/50">
              <button onClick={() => router.push("/student/projects")} className="hover:text-white transition-colors">
                Resource Hub
              </button>
              <ChevronRight className="w-3 h-3" />
              <button onClick={() => router.push("/student/projects")} className="hover:text-white transition-colors">
                {isAdmin ? "Admin Resources" : "Community"}
              </button>
              <ChevronRight className="w-3 h-3" />
              <span className="text-white/80 truncate max-w-[200px]">{project.title}</span>
            </nav>
          </div>

          {/* Back button */}
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
            <button onClick={() => router.back()}
              className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Back
            </button>
          </div>

          {/* Document header */}
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-12">
            <div className="flex flex-col sm:flex-row sm:items-start gap-5">

              {/* File type icon */}
              <div className={`w-16 h-16 rounded-2xl ${meta.icon} flex items-center justify-center shrink-0 shadow-lg`}>
                <FileText className="w-8 h-8 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                {/* Badges row */}
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${meta.bg}`}>{ext}</span>
                  {isAdmin && (
                    <span className="inline-flex items-center gap-1 bg-violet-200/30 text-violet-100 text-xs font-semibold px-2.5 py-1 rounded-full border border-violet-400/30">
                      <Shield className="w-3 h-3" /> Admin Resource
                    </span>
                  )}
                  {isOwn && (
                    <span className="inline-flex items-center gap-1 bg-white/15 text-white/80 text-xs font-semibold px-2.5 py-1 rounded-full border border-white/20">
                      Your Submission
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight mb-3">
                  {project.title}
                </h1>

                {/* Author + date */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full ${avatarColor(author)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                      {initials(author).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white leading-none">{author}</p>
                      {isAdmin && project.authorEmail && (
                        <p className="text-xs text-white/60 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3" />{project.authorEmail}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="h-4 w-px bg-white/20" />
                  <div className="flex items-center gap-1.5 text-white/60 text-xs">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(project.createdAt)}
                  </div>
                  {avgRating && (
                    <>
                      <div className="h-4 w-px bg-white/20" />
                      <div className="flex items-center gap-1.5 text-white/60 text-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-white/80 font-semibold">{avgRating}</span>
                        <span>({project.ratings?.length} rating{project.ratings?.length !== 1 ? "s" : ""})</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 shrink-0 sm:self-start mt-1">
                {project.fileUrl && (
                  <a href={project.fileUrl} target="_blank" rel="noopener noreferrer" download>
                    <Button className="bg-white text-[#021d49] hover:bg-blue-50 gap-2 shadow-lg font-semibold">
                      <Download className="w-4 h-4" /> Download
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Wave transition */}
          <div className="h-6 bg-gray-50 rounded-t-[2rem]" />
        </div>

        {/* ── Content ── */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-0 pb-16 space-y-6">

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Main column */}
            <div className="lg:col-span-2 space-y-6">

              {/* Document preview */}
              {project.fileUrl && (
                <Card className="border-gray-100 shadow-sm rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-white">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-semibold text-gray-700">Document Preview</span>
                    </div>
                    {isPdf && (
                      <button onClick={() => setShowPreview((v) => !v)}
                        className="flex items-center gap-1.5 text-xs text-[#021d49] font-medium hover:underline">
                        {showPreview ? <><EyeOff className="w-3.5 h-3.5" /> Hide</> : <><Eye className="w-3.5 h-3.5" /> Show</>}
                      </button>
                    )}
                  </div>

                  {isPdf && showPreview ? (
                    <div className="bg-gray-50">
                      <iframe
                        src={`${project.fileUrl}#toolbar=0`}
                        className="w-full"
                        style={{ height: "520px" }}
                        title={project.title}
                      />
                    </div>
                  ) : (
                    <CardContent className="p-5">
                      <div className={`flex items-center gap-4 p-4 rounded-xl border ${
                        isAdmin ? "bg-violet-50 border-violet-100" : "bg-blue-50 border-blue-100"}`}>
                        <div className={`w-12 h-12 rounded-xl ${meta.icon} flex items-center justify-center shrink-0`}>
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{project.fileName}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{ext} document</p>
                        </div>
                        <a href={project.fileUrl} target="_blank" rel="noopener noreferrer"
                          className={`flex items-center gap-1.5 text-xs font-semibold shrink-0
                            ${isAdmin ? "text-violet-700 hover:text-violet-900" : "text-[#021d49] hover:text-[#032a66]"}`}>
                          Open <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </CardContent>
                  )}
                </Card>
              )}

              {/* Description */}
              {project.description && (
                <Card className="border-gray-100 shadow-sm rounded-2xl">
                  <CardContent className="p-5">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">About this Document</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{project.description}</p>
                  </CardContent>
                </Card>
              )}

              {/* Tags */}
              {project.tags?.length > 0 && (
                <Card className="border-gray-100 shadow-sm rounded-2xl">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Tag className="w-4 h-4 text-gray-400" />
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tags</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((t) => (
                        <span key={t} className={`px-3 py-1 rounded-full text-xs font-semibold border
                          ${isAdmin ? "bg-violet-50 text-violet-700 border-violet-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                          #{t}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Admin feedback */}
              {project.adminFeedback && (
                <Card className={`shadow-sm rounded-2xl border ${
                  project.status === "rejected" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className={`w-4 h-4 ${project.status === "rejected" ? "text-red-600" : "text-green-600"}`} />
                      <p className={`text-xs font-semibold uppercase tracking-wider ${
                        project.status === "rejected" ? "text-red-600" : "text-green-600"}`}>
                        Admin Feedback
                      </p>
                    </div>
                    <p className={`text-sm leading-relaxed ${
                      project.status === "rejected" ? "text-red-700" : "text-green-700"}`}>
                      {project.adminFeedback}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">

              {/* Quick actions */}
              <Card className="border-gray-100 shadow-sm rounded-2xl">
                <CardContent className="p-5 space-y-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</p>
                  {project.fileUrl && (
                    <a href={project.fileUrl} target="_blank" rel="noopener noreferrer" download className="block">
                      <Button className={`w-full gap-2 font-semibold ${isAdmin ? "bg-violet-700 hover:bg-violet-800" : "bg-[#021d49] hover:bg-[#032a66]"} text-white`}>
                        <Download className="w-4 h-4" /> Download File
                      </Button>
                    </a>
                  )}
                  {project.fileUrl && (
                    <a href={project.fileUrl} target="_blank" rel="noopener noreferrer" className="block">
                      <Button variant="outline" className="w-full gap-2">
                        <ExternalLink className="w-4 h-4" /> Open in New Tab
                      </Button>
                    </a>
                  )}
                  <Button variant="outline" className="w-full gap-2" onClick={() => router.push("/student/projects")}>
                    <ArrowLeft className="w-4 h-4" /> Back to Hub
                  </Button>
                </CardContent>
              </Card>

              {/* Rating widget */}
              {!isAdmin && !isOwn && (
                <Card className="border-gray-100 shadow-sm rounded-2xl">
                  <CardContent className="p-5">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Rate this Document</p>

                    {ratingDone ? (
                      <div className="text-center py-2">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Heart className="w-5 h-5 text-amber-600 fill-amber-600" />
                        </div>
                        <p className="text-sm font-semibold text-gray-700">Thanks for rating!</p>
                        <div className="flex items-center justify-center gap-1 mt-2">
                          <StarRating value={rating} readOnly />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-3">How useful was this document?</p>
                        <div className="flex justify-center mb-2">
                          <StarRating value={rating} onChange={handleRate} readOnly={!currentUser || ratingSaving} />
                        </div>
                        {ratingSaving && (
                          <p className="text-xs text-gray-400 flex items-center justify-center gap-1.5">
                            <Loader2 className="w-3 h-3 animate-spin" /> Saving…
                          </p>
                        )}
                        {!currentUser && (
                          <p className="text-xs text-gray-400 mt-2">Sign in to rate</p>
                        )}
                      </div>
                    )}

                    {avgRating && (
                      <>
                        <Separator className="my-3" />
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Community rating</span>
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span className="font-semibold text-gray-700">{avgRating}</span>
                            <span className="text-gray-400">/ 5</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Based on {project.ratings.length} rating{project.ratings.length !== 1 ? "s" : ""}
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Own doc rating display */}
              {isOwn && avgRating && (
                <Card className="border-amber-200 bg-amber-50 shadow-sm rounded-2xl">
                  <CardContent className="p-5">
                    <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-3">Your Document's Rating</p>
                    <div className="flex items-center gap-2 mb-1">
                      <StarRating value={Math.round(parseFloat(avgRating))} readOnly />
                      <span className="text-lg font-bold text-amber-700">{avgRating}</span>
                    </div>
                    <p className="text-xs text-amber-600">
                      {project.ratings.length} rating{project.ratings.length !== 1 ? "s" : ""} from the community
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Document info */}
              <Card className="border-gray-100 shadow-sm rounded-2xl">
                <CardContent className="p-5 space-y-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Document Info</p>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Type</span>
                      <span className={`font-bold px-2 py-0.5 rounded-full ${meta.bg}`}>{ext}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Source</span>
                      {isAdmin ? (
                        <span className="flex items-center gap-1 font-semibold text-violet-700">
                          <Shield className="w-3 h-3" /> Admin
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 font-semibold text-blue-700">
                          <Globe className="w-3 h-3" /> Community
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Author</span>
                      <span className="font-semibold text-gray-700 truncate max-w-[130px] text-right">{author}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Published</span>
                      <span className="font-semibold text-gray-700">{formatDate(project.createdAt)}</span>
                    </div>
                    {project.tags?.length > 0 && (
                      <div className="flex items-start justify-between text-xs gap-2">
                        <span className="text-gray-500 shrink-0">Tags</span>
                        <div className="flex flex-wrap gap-1 justify-end">
                          {project.tags.slice(0, 4).map((t) => (
                            <span key={t} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px]">#{t}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
