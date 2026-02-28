"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Search,
  Trash2,
  Star,
  Clock,
  BookOpen,
  AlertCircle,
  ChevronLeft,
  Edit3,
  Save,
  X,
  Filter,
  SortAsc,
  Calendar,
  Tag,
  BookMarked,
  Sparkles,
  Archive,
} from "lucide-react";
import { noteService } from "@/lib/api/noteService";

const NotesPage = () => {
  const router = useRouter();
  const [groupedNotes, setGroupedNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [filterBookmarked, setFilterBookmarked] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await noteService.getNotesGroupedByCourse();
      setGroupedNotes(data);
      if (data.length > 0) {
        setExpandedCourse(data[0].courseId);
      }
    } catch (err) {
      setError(err.message || "Failed to load notes");
      console.error("Error fetching notes:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (keyword) => {
    setSearchKeyword(keyword);
    if (!keyword.trim()) {
      setSearchResults(null);
      return;
    }

    try {
      const results = await noteService.searchNotes(keyword);
      setSearchResults(results);
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!confirm("Are you sure you want to delete this note? This action cannot be undone.")) return;

    try {
      await noteService.deleteNote(noteId);
      await fetchNotes();
      setSelectedNote(null);
      showSuccess("Note deleted successfully");
    } catch (err) {
      setError("Failed to delete note: " + err.message);
    }
  };

  const handleUpdateNote = async (noteId) => {
    if (!editContent.trim()) {
      setError("Note content cannot be empty");
      return;
    }

    try {
      await noteService.updateNote(noteId, { content: editContent });
      await fetchNotes();
      setEditingNote(null);
      setSelectedNote({ ...selectedNote, content: editContent });
      showSuccess("Note updated successfully");
    } catch (err) {
      setError("Failed to update note: " + err.message);
    }
  };

  const handleToggleBookmark = async (noteId, e) => {
    e?.stopPropagation();
    try {
      await noteService.toggleBookmark(noteId);
      await fetchNotes();
      if (selectedNote?._id === noteId) {
        setSelectedNote({ ...selectedNote, isBookmarked: !selectedNote.isBookmarked });
      }
      showSuccess(selectedNote?.isBookmarked ? "Removed from bookmarks" : "Added to bookmarks");
    } catch (err) {
      setError("Failed to toggle bookmark: " + err.message);
    }
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const sortNotes = (notes) => {
    const sorted = [...notes];
    switch (sortBy) {
      case "recent":
        return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case "oldest":
        return sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case "alphabetical":
        return sorted.sort((a, b) => (a.lessonName || "").localeCompare(b.lessonName || ""));
      default:
        return sorted;
    }
  };

  const filterNotes = (notes) => {
    if (filterBookmarked) {
      return notes.filter((note) => note.isBookmarked);
    }
    return notes;
  };

  let displayNotes = searchResults || (expandedCourse && groupedNotes.find((g) => g.courseId === expandedCourse)?.notes) || [];
  displayNotes = sortNotes(filterNotes(displayNotes));

  const totalNotes = groupedNotes.reduce((acc, course) => acc + course.noteCount, 0);
  const bookmarkedCount = groupedNotes.reduce((acc, course) =>
    acc + course.notes.filter(n => n.isBookmarked).length, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Success Toast */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in">
          <Sparkles className="w-5 h-5" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-red-500 to-pink-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">{error}</span>
          <button onClick={() => setError("")} className="ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-xl transition"
                title="Go Back"
              >
                <ChevronLeft className="w-6 h-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  My Learning Notes
                </h1>
                <p className="text-gray-600 text-sm mt-2 flex items-center gap-4">
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    {totalNotes} total notes
                  </span>
                  <span className="flex items-center gap-2">
                    <BookMarked className="w-4 h-4" />
                    {groupedNotes.length} courses
                  </span>
                  <span className="flex items-center gap-2">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    {bookmarkedCount} bookmarked
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Search & Controls */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search notes by keyword, topic, or content..."
                value={searchKeyword}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
              />
            </div>

            <div className="flex gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium text-sm"
              >
                <option value="recent">Most Recent</option>
                <option value="oldest">Oldest First</option>
                <option value="alphabetical">A-Z</option>
              </select>

              <button
                onClick={() => setFilterBookmarked(!filterBookmarked)}
                className={`px-4 py-3 rounded-xl font-medium text-sm transition flex items-center gap-2 ${
                  filterBookmarked
                    ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-white"
                    : "border-2 border-gray-200 text-gray-700 hover:border-yellow-400"
                }`}
              >
                <Star className={`w-4 h-4 ${filterBookmarked ? "fill-white" : ""}`} />
                Bookmarked
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {groupedNotes.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border-2 border-dashed border-gray-300 shadow-lg">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
              <FileText className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Notes Yet</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Start taking notes while learning lessons to keep track of important concepts and ideas!
            </p>
            <button
              onClick={() => router.push("/student")}
              className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition shadow-lg transform hover:scale-105"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Courses Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg overflow-hidden sticky top-32">
                <div className="p-5 bg-gradient-to-r from-blue-50 to-purple-50 border-b-2 border-gray-200">
                  <h2 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    Your Courses
                  </h2>
                  <p className="text-xs text-gray-600 mt-1">{groupedNotes.length} courses with notes</p>
                </div>

                <div className="max-h-[500px] overflow-y-auto">
                  {groupedNotes.map((course) => (
                    <button
                      key={course.courseId}
                      onClick={() => setExpandedCourse(expandedCourse === course.courseId ? null : course.courseId)}
                      className={`w-full text-left p-4 border-b border-gray-100 hover:bg-blue-50 transition-all ${
                        expandedCourse === course.courseId ? "bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-600" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-semibold truncate ${expandedCourse === course.courseId ? "text-blue-900" : "text-gray-900"}`}>
                            {course.courseName}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                            <FileText className="w-3 h-3" />
                            {course.noteCount} note{course.noteCount !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                          <div className={`text-xs px-2 py-1 rounded-full font-bold ${
                            expandedCourse === course.courseId
                              ? "bg-blue-600 text-white"
                              : "bg-gray-200 text-gray-700"
                          }`}>
                            {course.noteCount}
                          </div>
                          {course.notes.some(n => n.isBookmarked) && (
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Notes Display */}
            <div className="lg:col-span-3">
              {selectedNote ? (
                // Note Detail View
                <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-8">
                  <button
                    onClick={() => setSelectedNote(null)}
                    className="mb-6 text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2 transition"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Back to Notes
                  </button>

                  {editingNote === selectedNote._id ? (
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <Edit3 className="w-6 h-6 text-blue-600" />
                        Edit Note
                      </h2>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full p-5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 mb-6 resize-none font-mono text-sm"
                        rows="16"
                        placeholder="Write your notes here..."
                      />
                      <div className="flex gap-4">
                        <button
                          onClick={() => {
                            setEditingNote(null);
                            setEditContent("");
                          }}
                          className="flex-1 py-4 px-6 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-bold transition flex items-center justify-center gap-2"
                        >
                          <X className="w-5 h-5" />
                          Cancel
                        </button>
                        <button
                          onClick={() => handleUpdateNote(selectedNote._id)}
                          className="flex-1 py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 font-bold transition shadow-lg flex items-center justify-center gap-2"
                        >
                          <Save className="w-5 h-5" />
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="mb-8 pb-6 border-b-2 border-gray-200">
                        <div className="flex items-start justify-between mb-4">
                          <h2 className="text-3xl font-bold text-gray-900">
                            {selectedNote.lessonName}
                          </h2>
                          <button
                            onClick={(e) => handleToggleBookmark(selectedNote._id, e)}
                            className={`p-3 rounded-xl transition ${
                              selectedNote.isBookmarked
                                ? "bg-yellow-100 text-yellow-600 hover:bg-yellow-200"
                                : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                            }`}
                            title={selectedNote.isBookmarked ? "Remove bookmark" : "Add bookmark"}
                          >
                            <Star className={`w-6 h-6 ${selectedNote.isBookmarked ? "fill-yellow-400" : ""}`} />
                          </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <span className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-bold">
                            <BookOpen className="w-4 h-4" />
                            {selectedNote.courseName}
                          </span>
                          {selectedNote.moduleName && (
                            <span className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full font-semibold">
                              <Tag className="w-4 h-4" />
                              {selectedNote.moduleName}
                            </span>
                          )}
                          <span className="text-gray-500 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {formatDate(selectedNote.createdAt)} at {formatTime(selectedNote.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="mb-8 bg-gradient-to-br from-gray-50 to-blue-50 p-6 rounded-xl border-2 border-gray-200">
                        <p className="text-gray-800 whitespace-pre-wrap text-base leading-relaxed font-serif">
                          {selectedNote.content}
                        </p>
                      </div>

                      <div className="flex gap-4">
                        <button
                          onClick={() => {
                            setEditingNote(selectedNote._id);
                            setEditContent(selectedNote.content);
                          }}
                          className="flex-1 py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-bold transition shadow-lg flex items-center justify-center gap-2"
                        >
                          <Edit3 className="w-5 h-5" />
                          Edit Note
                        </button>
                        <button
                          onClick={() => handleDeleteNote(selectedNote._id)}
                          className="flex-1 py-4 px-6 border-2 border-red-300 text-red-600 rounded-xl hover:bg-red-50 font-bold transition flex items-center justify-center gap-2"
                        >
                          <Trash2 className="w-5 h-5" />
                          Delete Note
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Notes List View
                <div className="space-y-4">
                  {displayNotes.length === 0 ? (
                    <div className="bg-white rounded-2xl p-16 text-center border-2 border-dashed border-gray-300 shadow-lg">
                      <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-blue-100 rounded-full flex items-center justify-center">
                        <Search className="w-10 h-10 text-gray-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        {searchKeyword ? "No search results" : filterBookmarked ? "No bookmarked notes" : "No notes in this course"}
                      </h3>
                      <p className="text-gray-600 max-w-md mx-auto">
                        {searchKeyword
                          ? "Try a different search term or check your spelling"
                          : filterBookmarked
                          ? "Bookmark notes by clicking the star icon"
                          : "Start taking notes in lessons to see them here"}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4 text-sm text-gray-600 font-medium">
                        Showing {displayNotes.length} note{displayNotes.length !== 1 ? "s" : ""}
                      </div>
                      {displayNotes.map((note) => (
                        <div
                          key={note._id}
                          onClick={() => setSelectedNote(note)}
                          className="bg-white rounded-xl border-2 border-gray-200 hover:border-blue-400 p-6 shadow-md hover:shadow-xl transition-all cursor-pointer group transform hover:-translate-y-1"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="font-bold text-gray-900 text-xl group-hover:text-blue-600 transition mb-2">
                                {note.lessonName}
                              </h3>
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                {note.moduleName && (
                                  <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-semibold">
                                    {note.moduleName}
                                  </span>
                                )}
                                <span className="text-gray-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDate(note.createdAt)}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={(e) => handleToggleBookmark(note._id, e)}
                              className={`p-2 rounded-lg transition ${
                                note.isBookmarked
                                  ? "bg-yellow-100 text-yellow-600"
                                  : "bg-gray-100 text-gray-400 opacity-0 group-hover:opacity-100"
                              }`}
                            >
                              <Star className={`w-5 h-5 ${note.isBookmarked ? "fill-yellow-400" : ""}`} />
                            </button>
                          </div>
                          <p className="text-gray-700 line-clamp-3 leading-relaxed">
                            {note.content}
                          </p>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesPage;
