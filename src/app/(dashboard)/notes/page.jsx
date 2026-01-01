"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  ChevronDown,
  Search,
  Trash2,
  Star,
  Clock,
  BookOpen,
  AlertCircle,
  ChevronLeft,
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

  // Fetch notes on mount
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
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      await noteService.deleteNote(noteId);
      await fetchNotes();
      setSelectedNote(null);
      alert("Note deleted successfully");
    } catch (err) {
      alert("Failed to delete note: " + err.message);
    }
  };

  const handleUpdateNote = async (noteId) => {
    if (!editContent.trim()) {
      alert("Note content cannot be empty");
      return;
    }

    try {
      await noteService.updateNote(noteId, { content: editContent });
      await fetchNotes();
      setEditingNote(null);
      alert("Note updated successfully");
    } catch (err) {
      alert("Failed to update note: " + err.message);
    }
  };

  const handleToggleBookmark = async (noteId) => {
    try {
      await noteService.toggleBookmark(noteId);
      await fetchNotes();
    } catch (err) {
      alert("Failed to toggle bookmark: " + err.message);
    }
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

  const displayNotes = searchResults || (expandedCourse && groupedNotes.find((g) => g.courseId === expandedCourse)?.notes) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              title="Go Back"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-8 h-8 text-orange-500" />
                My Notes
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                {groupedNotes.reduce((acc, course) => acc + course.noteCount, 0)} total notes across {groupedNotes.length} courses
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search notes by keyword..."
              value={searchKeyword}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 transition"
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {groupedNotes.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-gray-200 shadow-lg">
            <FileText className="w-20 h-20 mx-auto mb-4 text-gray-300" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Notes Yet</h3>
            <p className="text-gray-600 mb-6">
              Start taking notes while learning lessons to keep track of important concepts!
            </p>
            <button
              onClick={() => router.push("/student")}
              className="inline-block bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Courses List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden sticky top-24">
                <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 border-b border-gray-200">
                  <h2 className="font-bold text-gray-900 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-orange-500" />
                    Courses
                  </h2>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {groupedNotes.map((course) => (
                    <button
                      key={course.courseId}
                      onClick={() =>
                        setExpandedCourse(
                          expandedCourse === course.courseId ? null : course.courseId
                        )
                      }
                      className={`w-full text-left p-4 border-b border-gray-100 hover:bg-orange-50 transition ${expandedCourse === course.courseId ? "bg-orange-50" : ""
                        }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {course.courseName}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {course.noteCount} note{course.noteCount !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <div className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-semibold flex-shrink-0">
                          {course.noteCount}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Notes Display */}
            <div className="lg:col-span-2">
              {selectedNote ? (
                // Note Detail View
                <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
                  <button
                    onClick={() => setSelectedNote(null)}
                    className="mb-6 text-orange-500 hover:text-orange-600 font-semibold flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back to Notes
                  </button>

                  {editingNote === selectedNote._id ? (
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">Edit Note</h2>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 mb-4 resize-none"
                        rows="12"
                      />
                      <div className="flex gap-4">
                        <button
                          onClick={() => setEditingNote(null)}
                          className="flex-1 py-3 px-4 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleUpdateNote(selectedNote._id)}
                          className="flex-1 py-3 px-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 font-semibold transition shadow-lg"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="mb-6 pb-6 border-b border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">
                          {selectedNote.lessonName}
                        </h2>
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <span className="inline-block bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-semibold">
                            {selectedNote.courseName}
                          </span>
                          <span className="text-gray-500 flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatDate(selectedNote.createdAt)} at{" "}
                            {formatTime(selectedNote.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="mb-8">
                        <p className="text-gray-700 whitespace-pre-wrap text-lg leading-relaxed">
                          {selectedNote.content}
                        </p>
                      </div>

                      <div className="flex gap-4">
                        <button
                          onClick={() => setEditingNote(selectedNote._id)}
                          className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-semibold transition"
                        >
                          Edit Note
                        </button>
                        <button
                          onClick={() => handleDeleteNote(selectedNote._id)}
                          className="flex-1 py-3 px-4 border-2 border-red-300 text-red-600 rounded-xl hover:bg-red-50 font-semibold transition flex items-center justify-center gap-2"
                        >
                          <Trash2 className="w-5 h-5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Notes List View
                <div className="space-y-4">
                  {displayNotes.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-lg">
                      <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {searchKeyword ? "No search results" : "No notes in this course"}
                      </h3>
                      <p className="text-gray-600">
                        {searchKeyword
                          ? "Try a different search term"
                          : "Start taking notes in lessons to see them here"}
                      </p>
                    </div>
                  ) : (
                    displayNotes.map((note) => (
                      <div
                        key={note._id}
                        onClick={() => setSelectedNote(note)}
                        className="bg-white rounded-xl border border-gray-200 hover:border-orange-300 p-6 shadow-sm hover:shadow-lg transition cursor-pointer group"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 text-lg group-hover:text-orange-600 transition">
                              {note.lessonName}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {note.moduleName && `Module: ${note.moduleName} • `}
                              {formatDate(note.createdAt)}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleBookmark(note._id);
                            }}
                            className="p-2 hover:bg-orange-100 rounded-lg transition flex-shrink-0"
                          >
                            <Star
                              className={`w-5 h-5 ${note.isBookmarked
                                  ? "fill-orange-500 text-orange-500"
                                  : "text-gray-400"
                                }`}
                            />
                          </button>
                        </div>

                        <p className="text-gray-700 line-clamp-2 mb-3">
                          {note.content}
                        </p>

                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                            {note.category}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatTime(note.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))
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
