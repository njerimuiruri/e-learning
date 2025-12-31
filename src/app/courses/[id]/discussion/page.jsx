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
  CornerDownRight,
  Bell,
} from "lucide-react";
import courseService from "@/lib/api/courseService";

const DiscussionPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const courseId = params.id;

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
    } catch (err) {
      console.error("Failed to load course", err);
    } finally {
      setLoading(false);
    }
  };

  const loadDiscussions = async (moduleIndex = selectedModule) => {
    try {
      const list = await courseService.getDiscussions(courseId, moduleIndex);
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
  }, [selectedModule, modules.length]);

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
      setToast({ message: "Discussion started", type: "success" });
    } catch (err) {
      alert("Could not create discussion. Please ensure you are enrolled or instructor.");
      console.error(err);
      setToast({ message: "Failed to start discussion", type: "error" });
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
      setToast({ message: "Reply posted", type: "success" });
    } catch (err) {
      alert("Could not post reply. You must be enrolled or instructor.");
      console.error(err);
      setToast({ message: "Failed to post reply", type: "error" });
    } finally {
      setPostingReplyId(null);
      setTimeout(() => setToast({ message: "", type: "success" }), 2500);
    }
  };

  const handleMarkRead = async (discussionId) => {
    try {
      await courseService.markDiscussionRead(discussionId);
      await loadDiscussions(selectedModule);
      setToast({ message: "Marked as read", type: "success" });
    } catch (err) {
      console.error("Failed to mark as read", err);
      setToast({ message: "Could not mark as read", type: "error" });
    } finally {
      setTimeout(() => setToast({ message: "", type: "success" }), 2500);
    }
  };

  const renderReplies = (replies = []) => (
    <div className="mt-3 space-y-2 pl-4 border-l border-gray-200">
      {replies.length === 0 && (
        <p className="text-sm text-gray-500">No replies yet.</p>
      )}
      {replies.map((r, idx) => (
        <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
            <span className="font-semibold text-gray-800">{r.authorName || "Participant"}</span>
            <span className="text-gray-500 text-xs">{r.authorRole || ""}</span>
          </div>
          <p className="text-gray-800 text-sm leading-relaxed">{r.content}</p>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-700">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading course...
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50 p-4 md:p-8">
      {/* Guide Banner */}
      <div className="max-w-3xl mx-auto mb-6 p-4 bg-orange-100 border-l-4 border-orange-400 rounded shadow">
        <h2 className="font-bold text-lg text-orange-900 mb-1">How to Use Discussions</h2>
        <ul className="list-disc pl-5 text-gray-800 text-sm">
          <li>Choose a module on the left to view or start discussions.</li>
          <li>Click <span className="font-semibold">Start a New Discussion</span> to ask a question or share an idea.</li>
          <li>Reply to others by typing in the reply box and clicking <span className="font-semibold">Reply</span>.</li>
          <li>Look for colored icons and labels to see which discussions are answered.</li>
        </ul>
      </div>

      {toast.message && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm text-white ${toast.type === "success" ? "bg-emerald-600" : "bg-red-600"}`}
        >
          {toast.message}
        </div>
      )}
      <div className="max-w-6xl mx-auto flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-500">Module discussions</p>
          <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
        </div>
        <button
          onClick={() => router.push(`/courses/${courseId}`)}
          className="text-sm text-white bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg shadow transition"
        >
          Back to course
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Module Selector */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-orange-500" /> Modules
            </h3>
            <button
              onClick={() => loadDiscussions(selectedModule)}
              className="p-2 text-gray-500 hover:text-gray-900"
              title="Refresh module list"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-2">
            {modules.map((m, idx) => (
              <button
                key={m._id || idx}
                onClick={() => setSelectedModule(idx)}
                className={`w-full text-left p-3 rounded-lg border transition ${idx === selectedModule
                    ? "border-orange-400 bg-orange-50 text-orange-900 font-bold"
                    : "border-gray-200 hover:border-orange-300"
                  }`}
                title={`View discussions for ${m.title || `Module ${idx + 1}`}`}
              >
                <p className="text-base font-semibold">{m.title || `Module ${idx + 1}`}</p>
                <p className="text-xs text-gray-500 line-clamp-2">{m.description || ""}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Discussions and New Discussion */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Selected module</p>
                <h3 className="text-lg font-bold text-gray-900">{moduleTitle}</h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => loadDiscussions(selectedModule)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg flex items-center gap-2 hover:border-orange-300"
                  title="Refresh discussions"
                >
                  <RefreshCw className="w-4 h-4" /> Refresh
                </button>
              </div>
            </div>

            {/* Start New Discussion */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-2">Start a New Discussion</h4>
              <input
                className="w-full mb-2 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-base"
                placeholder="Discussion title (e.g. 'Help with Module 2')"
                value={newDiscussion.title}
                onChange={e => setNewDiscussion(d => ({ ...d, title: e.target.value }))}
                aria-label="Discussion title"
              />
              <textarea
                className="w-full mb-2 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-base"
                placeholder="Type your question or topic here..."
                value={newDiscussion.content}
                onChange={e => setNewDiscussion(d => ({ ...d, content: e.target.value }))}
                rows={3}
                aria-label="Discussion content"
              />
              <button
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-bold shadow transition w-full text-lg"
                onClick={handleCreateDiscussion}
                disabled={creating}
                title="Start discussion"
              >
                {creating ? <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> : <Plus className="w-5 h-5 inline mr-2" />}
                Start Discussion
              </button>
            </div>

            {/* List of Discussions */}
            <div className="space-y-4">
              {discussions.length === 0 && (
                <div className="text-center text-gray-500 py-8">No discussions yet. Be the first to start one!</div>
              )}
              {discussions.map((d, idx) => (
                <div key={d._id || idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-3 mb-2">
                    <UserCircle className="w-8 h-8 text-orange-400" title="Participant avatar" />
                    <div>
                      <span className="font-bold text-gray-900 text-base">{d.authorName || "Participant"}</span>
                      <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${d.answered ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"}`}>{d.answered ? "Answered" : "Unanswered"}</span>
                    </div>
                  </div>
                  <div className="mb-1">
                    <h5 className="font-semibold text-gray-900 text-lg">{d.title}</h5>
                    <p className="text-gray-800 text-base mb-1">{d.content}</p>
                  </div>
                  <div className="flex items-center text-xs text-gray-500 mb-2 gap-4">
                    <span>{d.timestamp || ""}</span>
                    <span>{d.replies?.length || 0} replies</span>
                  </div>
                  {/* Replies */}
                  {renderReplies(d.replies)}
                  {/* Reply Box */}
                  <div className="mt-3 flex gap-2 items-end">
                    <textarea
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-base"
                      placeholder="Write a reply..."
                      value={replyMap[d._id] || ""}
                      onChange={e => setReplyMap(prev => ({ ...prev, [d._id]: e.target.value }))}
                      rows={2}
                      aria-label="Reply to discussion"
                    />
                    <button
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold shadow transition"
                      onClick={() => handleReply(d._id)}
                      disabled={postingReplyId === d._id}
                      title="Reply"
                    >
                      {postingReplyId === d._id ? <Loader2 className="w-4 h-4 animate-spin inline" /> : <Send className="w-4 h-4 inline" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
                type = "text"
  placeholder = "Discussion title"
  value = { newDiscussion.title }
  onChange = {(e) => setNewDiscussion((p) => ({ ...p, title: e.target.value }))}
className = "w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-400"
  />
              <textarea
                placeholder="Ask a question or start a discussion for this module..."
                value={newDiscussion.content}
                onChange={(e) => setNewDiscussion((p) => ({ ...p, content: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-400 min-h-[120px]"
              />
              <button
                onClick={handleCreateDiscussion}
                disabled={creating || !newDiscussion.title.trim() || !newDiscussion.content.trim()}
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg disabled:opacity-60"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Start discussion
              </button>
            </div >
          </div >

  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
    <div className="flex items-center gap-2 mb-4">
      <MessageCircle className="w-5 h-5 text-orange-500" />
      <h3 className="font-semibold text-gray-900">Discussions for this module</h3>
    </div>
    {discussions.length === 0 && (
      <p className="text-sm text-gray-500">No discussions yet. Be the first to start one.</p>
    )}
    <div className="space-y-4">
      {discussions.map((d) => (
        <div key={d._id} className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-gray-500">{d.createdByRole || "participant"}</p>
              <h4 className="text-lg font-semibold text-gray-900">{d.title}</h4>
              <p className="text-gray-700 mt-1 whitespace-pre-line">{d.content}</p>
            </div>
            <div className="flex items-center gap-2">
              {d.hasUnread && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">
                  <Bell className="w-3 h-3" /> {d.unreadCount || 0}
                </span>
              )}
              <span className="text-xs text-gray-500">{d.replies?.length || 0} replies</span>
              <button
                onClick={() => handleMarkRead(d._id)}
                className="text-xs text-gray-500 hover:text-gray-900 underline"
              >
                Mark read
              </button>
            </div>
          </div>

          {renderReplies(d.replies)}

          <div className="mt-3 flex items-start gap-2">
            <CornerDownRight className="w-4 h-4 text-gray-400 mt-2" />
            <div className="flex-1 space-y-2">
              <textarea
                rows={2}
                placeholder="Reply to this discussion..."
                value={replyMap[d._id] || ""}
                onChange={(e) => setReplyMap((prev) => ({ ...prev, [d._id]: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-400"
              />
              <button
                onClick={() => handleReply(d._id)}
                disabled={postingReplyId === d._id || !(replyMap[d._id] || "").trim()}
                className="inline-flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-3 py-2 rounded-lg disabled:opacity-60"
              >
                {postingReplyId === d._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send reply
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
        </div >
      </div >
    </div >
  );
};

export default DiscussionPage;
