"use client";
import React, { useEffect, useMemo, useState } from "react";
import { UserCircle } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  MessageCircle,
  Send,
  Loader2,
  Plus,
  RefreshCw,
  MessageSquare,
  Bell,
  Pin,
  ThumbsUp,
  Eye,
  Filter,
  SortDesc,
  CheckCircle,
  Circle,
  XCircle,
  TrendingUp,
  Clock,
  MessageCircleMore,
} from "lucide-react";
import courseService from "@/lib/api/courseService";
import { useToast } from "@/components/ui/ToastProvider";

const DiscussionPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const courseId = params.id;
  const { showToast } = useToast();

  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(0);
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [postingReplyId, setPostingReplyId] = useState(null);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [newDiscussion, setNewDiscussion] = useState({ title: "", content: "" });
  const [replyMap, setReplyMap] = useState({});
  const [sortBy, setSortBy] = useState("recent");
  const [filterByStatus, setFilterByStatus] = useState("all");
  const [userRole, setUserRole] = useState(null);

  const moduleTitle = useMemo(() => {
    if (!modules.length) return "Module";
    const mod = modules[selectedModule];
    return mod?.title || `Module ${selectedModule + 1}`;
  }, [modules, selectedModule]);

  const loadCourse = async () => {
    try {
      setLoading(true);
      const data = await courseService.getCourseById(courseId);
      setCourse(data);
      const mods = data?.modules || [];
      setModules(mods);
      setSelectedModule(0);

      // Get user role from token or enrollment
      try {
        const enrollment = await courseService.getEnrollment(courseId);
        setUserRole("student");
      } catch {
        setUserRole(null);
      }
    } catch (err) {
      console.error("Failed to load course", err);
    } finally {
      setLoading(false);
    }
  };

  const loadDiscussions = async (moduleIndex = selectedModule, sort = sortBy, filter = filterByStatus) => {
    try {
      const list = await courseService.getDiscussions(courseId, moduleIndex, { sortBy: sort, filterByStatus: filter });
      setDiscussions(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to load discussions", err);
    }
  };

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  useEffect(() => {
    if (modules.length > 0) {
      const initial = searchParams.get("module");
      if (initial !== null) {
        const idx = parseInt(initial, 10);
        if (!Number.isNaN(idx) && idx >= 0 && idx < modules.length) {
          setSelectedModule(idx);
        }
      }
      loadDiscussions(initial !== null ? parseInt(initial, 10) : selectedModule);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModule, modules.length, sortBy, filterByStatus]);

  const handleCreateDiscussion = async () => {
    if (!newDiscussion.title.trim() || !newDiscussion.content.trim()) return;
    try {
      setCreating(true);
      await courseService.createDiscussion(courseId, {
        moduleIndex: selectedModule,
        title: newDiscussion.title.trim(),
        content: newDiscussion.content.trim(),
      });
      setNewDiscussion({ title: "", content: "" });
      await loadDiscussions(selectedModule);
      setToast({ message: "Discussion started successfully!", type: "success" });
      showToast("Discussion started successfully!", { type: "success", title: "Success" });
    } catch (err) {
      console.error(err);
      setToast({ message: "Failed to start discussion", type: "error" });
      showToast("Could not create discussion. Please ensure you are enrolled or instructor.", { type: "error", title: "Action required" });
    } finally {
      setCreating(false);
      setTimeout(() => setToast({ message: "", type: "success" }), 2500);
    }
  };

  const handleReply = async (discussionId) => {
    const text = (replyMap[discussionId] || "").trim();
    if (!text) return;
    try {
      setPostingReplyId(discussionId);
      await courseService.addDiscussionReply(discussionId, { content: text });
      setReplyMap((prev) => ({ ...prev, [discussionId]: "" }));
      await loadDiscussions(selectedModule);
      setToast({ message: "Reply posted successfully!", type: "success" });
    } catch (err) {
      console.error(err);
      setToast({ message: "Failed to post reply", type: "error" });
      showToast("Could not post reply. You must be enrolled or instructor.", { type: "error", title: "Action required" });
    } finally {
      setPostingReplyId(null);
      setTimeout(() => setToast({ message: "", type: "success" }), 2500);
    }
  };

  const handleLike = async (discussionId) => {
    try {
      await courseService.likeDiscussion(discussionId);
      await loadDiscussions(selectedModule);
      setToast({ message: "Liked!", type: "success" });
      setTimeout(() => setToast({ message: "", type: "success" }), 1500);
    } catch (err) {
      console.error("Failed to like discussion", err);
    }
  };

  const handlePin = async (discussionId) => {
    try {
      await courseService.togglePinDiscussion(discussionId);
      await loadDiscussions(selectedModule);
      setToast({ message: "Pin status updated", type: "success" });
      setTimeout(() => setToast({ message: "", type: "success" }), 1500);
    } catch (err) {
      console.error("Failed to pin discussion", err);
      showToast("Only instructors can pin discussions", { type: "error", title: "Permission Denied" });
    }
  };

  const renderReplies = (replies = []) => (
    <div className="mt-4 space-y-3 pl-6 border-l-2 border-blue-200">
      {replies.length === 0 && (
        <p className="text-sm text-gray-500 italic">No replies yet. Be the first to respond!</p>
      )}
      {replies.map((r, idx) => (
        <div key={idx} className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <UserCircle className="w-5 h-5 text-blue-500" />
              <span className="font-semibold text-gray-900">{r.authorName || "Participant"}</span>
              {r.authorRole === "instructor" && (
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">Instructor</span>
              )}
            </div>
            <span className="text-gray-400 text-xs">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}</span>
          </div>
          <p className="text-gray-800 text-sm leading-relaxed">{r.content}</p>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <div className="flex items-center gap-3 text-gray-700">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-lg font-medium">Loading discussions...</span>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-700">
        Course not found.
      </div>
    );
  }

  const sortOptions = [
    { value: "recent", label: "Most Recent", icon: Clock },
    { value: "popular", label: "Most Popular", icon: TrendingUp },
    { value: "mostReplies", label: "Most Replies", icon: MessageCircleMore },
    { value: "unanswered", label: "Unanswered", icon: Circle },
  ];

  const filterOptions = [
    { value: "all", label: "All", icon: MessageSquare },
    { value: "open", label: "Open", icon: Circle },
    { value: "resolved", label: "Resolved", icon: CheckCircle },
    { value: "closed", label: "Closed", icon: XCircle },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-4 md:p-8">
      {/* Toast Notification */}
      {toast.message && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl text-sm font-medium text-white transition-all transform ${
            toast.type === "success"
              ? "bg-gradient-to-r from-emerald-500 to-green-600"
              : "bg-gradient-to-r from-red-500 to-pink-600"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Course Discussions</p>
            <h1 className="text-3xl font-bold text-gray-900 mt-1">{course.title}</h1>
          </div>
          <button
            onClick={() => router.push(`/courses/${courseId}`)}
            className="text-sm text-white bg-gradient-to-r from-[#021d49] to-blue-700 hover:from-[#032e6b] hover:to-blue-800 px-6 py-3 rounded-xl font-bold shadow-lg transition-all transform hover:scale-105"
          >
            ← Back to Course
          </button>
        </div>
      </div>

      {/* Guide Banner */}
      <div className="max-w-7xl mx-auto mb-6 p-5 bg-gradient-to-r from-orange-50 to-yellow-50 border-l-4 border-orange-400 rounded-xl shadow">
        <h2 className="font-bold text-lg text-orange-900 mb-2 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          How to Use the Discussion Forum
        </h2>
        <ul className="list-disc pl-6 text-gray-800 text-sm space-y-1">
          <li>Select a module from the sidebar to view related discussions</li>
          <li>Use filters and sorting to find specific topics</li>
          <li>Start new discussions or reply to existing ones</li>
          <li>Like discussions to show appreciation</li>
          <li>Instructors can pin important discussions</li>
        </ul>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Module Selector Sidebar */}
        <div className="lg:col-span-1 bg-white border border-gray-200 rounded-xl p-5 shadow-lg h-fit sticky top-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-orange-500" />
              Modules
            </h3>
            <button
              onClick={() => loadDiscussions(selectedModule)}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-2">
            {modules.map((m, idx) => (
              <button
                key={m._id || idx}
                onClick={() => setSelectedModule(idx)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  idx === selectedModule
                    ? "border-orange-400 bg-gradient-to-r from-orange-50 to-yellow-50 shadow-md transform scale-105"
                    : "border-gray-200 hover:border-orange-300 hover:shadow"
                }`}
              >
                <p className={`text-sm font-bold ${idx === selectedModule ? "text-orange-900" : "text-gray-900"}`}>
                  {m.title || `Module ${idx + 1}`}
                </p>
                <p className="text-xs text-gray-500 line-clamp-2 mt-1">{m.description || ""}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Discussions Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Controls Bar */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Selected Module</p>
                <h3 className="text-xl font-bold text-gray-900">{moduleTitle}</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {/* Sort Dropdown */}
                <div className="relative">
                  <label className="text-xs text-gray-500 font-semibold mb-1 block">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 pr-8 border-2 border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  >
                    {sortOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Filter Dropdown */}
                <div className="relative">
                  <label className="text-xs text-gray-500 font-semibold mb-1 block">Filter</label>
                  <select
                    value={filterByStatus}
                    onChange={(e) => setFilterByStatus(e.target.value)}
                    className="px-4 py-2 pr-8 border-2 border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  >
                    {filterOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => loadDiscussions(selectedModule)}
                  className="self-end px-4 py-2 text-sm border-2 border-gray-200 rounded-lg flex items-center gap-2 hover:border-blue-400 hover:bg-blue-50 transition font-medium"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* New Discussion Form */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg">
            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
              <Plus className="w-5 h-5 text-blue-600" />
              Start a New Discussion
            </h4>
            <input
              className="w-full mb-3 p-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base font-medium"
              placeholder="Discussion title (e.g., 'Question about Lesson 3')"
              value={newDiscussion.title}
              onChange={(e) => setNewDiscussion((d) => ({ ...d, title: e.target.value }))}
              aria-label="Discussion title"
            />
            <textarea
              className="w-full mb-3 p-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
              placeholder="Describe your question or topic in detail..."
              value={newDiscussion.content}
              onChange={(e) => setNewDiscussion((d) => ({ ...d, content: e.target.value }))}
              rows={4}
              aria-label="Discussion content"
            />
            <button
              className="bg-gradient-to-r from-[#021d49] to-blue-700 hover:from-[#032e6b] hover:to-blue-800 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-all transform hover:scale-105 w-full text-lg flex items-center justify-center gap-2"
              onClick={handleCreateDiscussion}
              disabled={creating}
            >
              {creating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Start Discussion
                </>
              )}
            </button>
          </div>

          {/* Discussions List */}
          <div className="space-y-4">
            {discussions.length === 0 && (
              <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-12 text-center shadow">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">No discussions yet</p>
                <p className="text-gray-400 text-sm">Be the first to start a conversation!</p>
              </div>
            )}
            {discussions.map((d, idx) => (
              <div
                key={d._id || idx}
                className={`border-2 rounded-xl p-6 bg-white shadow-lg hover:shadow-xl transition-all ${
                  d.isPinned
                    ? "border-purple-300 bg-gradient-to-r from-purple-50 to-pink-50"
                    : "border-gray-200 hover:border-blue-300"
                }`}
              >
                {/* Discussion Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <UserCircle className={`w-10 h-10 ${d.isPinned ? "text-purple-500" : "text-blue-500"}`} />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900 text-base">
                          {d.studentId?.firstName || d.instructorId?.firstName || "Participant"}
                        </span>
                        {d.createdByRole === "instructor" && (
                          <span className="px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full">
                            Instructor
                          </span>
                        )}
                        {d.isPinned && (
                          <span className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold rounded-full flex items-center gap-1">
                            <Pin className="w-3 h-3" />
                            Pinned
                          </span>
                        )}
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            d.status === "resolved"
                              ? "bg-green-100 text-green-700"
                              : d.status === "closed"
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {d.status === "resolved" ? "✓ Resolved" : d.status === "closed" ? "Closed" : "Open"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {d.createdAt ? new Date(d.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric"
                        }) : ""}
                      </p>
                    </div>
                  </div>
                  {userRole === "instructor" && (
                    <button
                      onClick={() => handlePin(d._id)}
                      className={`p-2 rounded-lg transition ${
                        d.isPinned
                          ? "bg-purple-100 text-purple-600 hover:bg-purple-200"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                      title={d.isPinned ? "Unpin" : "Pin"}
                    >
                      <Pin className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Discussion Content */}
                <div className="mb-4">
                  <h5 className="font-bold text-gray-900 text-xl mb-2">{d.title}</h5>
                  <p className="text-gray-700 text-base leading-relaxed">{d.content}</p>
                </div>

                {/* Metadata */}
                <div className="flex items-center gap-6 text-sm text-gray-500 mb-4 pb-4 border-b border-gray-200">
                  <button
                    onClick={() => handleLike(d._id)}
                    className="flex items-center gap-1 hover:text-blue-600 transition"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>{d.likes || 0}</span>
                  </button>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{d.views || 0} views</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    <span>{d.replies?.length || 0} replies</span>
                  </div>
                  {d.hasUnread && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                      {d.unreadCount} new
                    </span>
                  )}
                </div>

                {/* Replies */}
                {renderReplies(d.replies)}

                {/* Reply Box */}
                <div className="mt-4 flex gap-3 items-end">
                  <textarea
                    className="flex-1 p-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    placeholder="Write your reply..."
                    value={replyMap[d._id] || ""}
                    onChange={(e) => setReplyMap((prev) => ({ ...prev, [d._id]: e.target.value }))}
                    rows={2}
                    aria-label="Reply to discussion"
                  />
                  <button
                    className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
                    onClick={() => handleReply(d._id)}
                    disabled={postingReplyId === d._id}
                  >
                    {postingReplyId === d._id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Reply
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscussionPage;
