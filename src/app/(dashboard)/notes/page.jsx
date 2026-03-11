"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FileText, Search, Trash2, Star, Clock, BookOpen,
  AlertCircle, ChevronLeft, Edit3, Save, X, Calendar,
  Tag, BookMarked, Sparkles, GraduationCap, StickyNote,
  Loader2, CheckCircle2,
} from "lucide-react";
import { noteService } from "@/lib/api/noteService";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";

/* ─── helpers ─── */
const fmt = (date, opts) => new Date(date).toLocaleDateString("en-US", opts);
const fmtDate = (d) => fmt(d, { month: "short", day: "numeric", year: "numeric" });
const fmtTime = (d) =>
  new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

/* ─── Empty State ─── */
function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-5">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-6">{description}</p>
      {action}
    </div>
  );
}

/* ─── Note Card ─── */
function NoteCard({ note, onSelect, onBookmark }) {
  return (
    <Card
      onClick={() => onSelect(note)}
      className="cursor-pointer border border-border hover:border-primary/40 hover:shadow-md transition-all duration-200 group"
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-1">
              {note.lessonName}
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              {note.moduleName && (
                <Badge variant="secondary" className="text-[11px] px-2 py-0">
                  <Tag className="w-2.5 h-2.5 mr-1" />
                  {note.moduleName}
                </Badge>
              )}
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                {fmtDate(note.createdAt)}
              </span>
            </div>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-7 w-7 shrink-0 transition-opacity ${note.isBookmarked ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    }`}
                  onClick={(e) => { e.stopPropagation(); onBookmark(note._id, e); }}
                >
                  <Star
                    className={`w-4 h-4 ${note.isBookmarked ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
                      }`}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{note.isBookmarked ? "Remove bookmark" : "Bookmark"}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
          {note.content}
        </p>
      </CardContent>
    </Card>
  );
}

/* ─── Note Detail ─── */
function NoteDetail({ note, onBack, onDelete, onUpdate, onBookmark }) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(note.content);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    await onUpdate(note._id, content);
    setSaving(false);
    setEditing(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground -ml-2" onClick={onBack}>
          <ChevronLeft className="w-4 h-4" /> Back to notes
        </Button>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => onBookmark(note._id, e)}
                  className="h-8 w-8"
                >
                  <Star
                    className={`w-4 h-4 ${note.isBookmarked ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
                      }`}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{note.isBookmarked ? "Remove bookmark" : "Bookmark"}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {!editing && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setEditing(true)}
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this note?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This note will be permanently deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => onDelete(note._id)}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Title & meta */}
      <div className="mb-5">
        <h2 className="text-xl font-bold text-foreground mb-3">{note.lessonName}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1.5">
            <BookOpen className="w-3 h-3" /> {note.courseName}
          </Badge>
          {note.moduleName && (
            <Badge variant="outline" className="gap-1.5">
              <Tag className="w-3 h-3" /> {note.moduleName}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground flex items-center gap-1.5 ml-1">
            <Calendar className="w-3 h-3" />
            {fmtDate(note.createdAt)} · {fmtTime(note.createdAt)}
          </span>
        </div>
      </div>

      <Separator className="mb-5" />

      {/* Content / editor */}
      {editing ? (
        <div className="flex flex-col flex-1 gap-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 min-h-[300px] resize-none font-mono text-sm leading-relaxed"
            placeholder="Write your note here..."
          />
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => { setEditing(false); setContent(note.content); }}
            >
              <X className="w-4 h-4 mr-1.5" /> Cancel
            </Button>
            <Button
              className="flex-1 bg-[#021d49] hover:bg-[#032a66]"
              disabled={saving || !content.trim()}
              onClick={handleSave}
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Saving…</>
              ) : (
                <><Save className="w-4 h-4 mr-1.5" /> Save Changes</>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-muted/40 border border-border p-5 flex-1">
          <p className="text-sm text-foreground whitespace-pre-wrap leading-7">{note.content}</p>
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ─── */
export default function NotesPage() {
  const router = useRouter();
  const [groupedNotes, setGroupedNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [sortBy, setSortBy] = useState("recent");
  const [filterBookmarked, setFilterBookmarked] = useState(false);

  useEffect(() => { fetchNotes(); }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await noteService.getNotesGroupedByCourse();
      setGroupedNotes(data);
      if (data.length > 0) setExpandedCourse(data[0].courseId);
    } catch (err) {
      setError(err.message || "Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (kw) => {
    setSearchKeyword(kw);
    if (!kw.trim()) { setSearchResults(null); return; }
    try {
      const res = await noteService.searchNotes(kw);
      setSearchResults(res);
    } catch { /* silent */ }
  };

  const handleDelete = async (noteId) => {
    try {
      await noteService.deleteNote(noteId);
      await fetchNotes();
      setSelectedNote(null);
      toast("Note deleted successfully");
    } catch (err) { setError("Failed to delete note: " + err.message); }
  };

  const handleUpdate = async (noteId, content) => {
    try {
      await noteService.updateNote(noteId, { content });
      await fetchNotes();
      setSelectedNote((prev) => ({ ...prev, content }));
      toast("Note updated");
    } catch (err) { setError("Failed to update note: " + err.message); }
  };

  const handleBookmark = async (noteId, e) => {
    e?.stopPropagation();
    try {
      await noteService.toggleBookmark(noteId);
      await fetchNotes();
      if (selectedNote?._id === noteId) {
        setSelectedNote((prev) => ({ ...prev, isBookmarked: !prev.isBookmarked }));
      }
    } catch (err) { setError("Failed to toggle bookmark"); }
  };

  const toast = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const sortNotes = (notes) => {
    const s = [...notes];
    if (sortBy === "recent") return s.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sortBy === "oldest") return s.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    if (sortBy === "alphabetical") return s.sort((a, b) => (a.lessonName || "").localeCompare(b.lessonName || ""));
    return s;
  };

  let displayNotes =
    searchResults ||
    (expandedCourse && groupedNotes.find((g) => g.courseId === expandedCourse)?.notes) ||
    [];
  if (filterBookmarked) displayNotes = displayNotes.filter((n) => n.isBookmarked);
  displayNotes = sortNotes(displayNotes);

  const totalNotes = groupedNotes.reduce((a, c) => a + c.noteCount, 0);
  const bookmarkedCount = groupedNotes.reduce(
    (a, c) => a + c.notes.filter((n) => n.isBookmarked).length, 0
  );

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#021d49]" />
          <p className="text-sm text-muted-foreground">Loading your notes…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">

      {/* ── Success toast ── */}
      {successMsg && (
        <div className="fixed top-4 right-4 z-50">
          <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800 shadow-lg w-auto">
            <CheckCircle2 className="h-4 w-4 !text-emerald-600" />
            <AlertDescription className="font-medium">{successMsg}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* ── Error toast ── */}
      {error && (
        <div className="fixed top-4 right-4 z-50">
          <Alert variant="destructive" className="shadow-lg w-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="font-medium pr-6">{error}</AlertDescription>
            <button className="absolute top-3 right-3" onClick={() => setError("")}>
              <X className="w-3.5 h-3.5" />
            </button>
          </Alert>
        </div>
      )}

      {/* ── Header ── */}
      <div className="border-b border-border bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <StickyNote className="w-5 h-5 text-[#021d49]" />
                  My Notes
                </h1>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <FileText className="w-3 h-3" /> {totalNotes} notes
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" /> {groupedNotes.length} courses
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {bookmarkedCount} bookmarked
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Search + controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search notes…"
                value={searchKeyword}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9 h-9 text-sm border-gray-200"
              />
              {searchKeyword && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => { setSearchKeyword(""); setSearchResults(null); }}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-40 h-9 text-sm border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="alphabetical">A – Z</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={filterBookmarked ? "default" : "outline"}
              size="sm"
              className={`h-9 gap-1.5 shrink-0 ${filterBookmarked ? "bg-amber-500 hover:bg-amber-600 border-amber-500" : "border-gray-200"}`}
              onClick={() => setFilterBookmarked((f) => !f)}
            >
              <Star className={`w-3.5 h-3.5 ${filterBookmarked ? "fill-white" : ""}`} />
              Bookmarked
            </Button>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {groupedNotes.length === 0 ? (
          <Card className="border-dashed">
            <EmptyState
              icon={StickyNote}
              title="No notes yet"
              description="Start taking notes while learning lessons to keep track of important concepts."
              action={
                <Button className="bg-[#021d49] hover:bg-[#032a66]" onClick={() => router.push("/student")}>
                  Go to Dashboard
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="grid lg:grid-cols-4 gap-5">

            {/* ── Sidebar: courses ── */}
            <div className="lg:col-span-1">
              <Card className="sticky top-[108px] overflow-hidden">
                <CardHeader className="p-4 pb-3 border-b border-border">
                  <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#021d49]" />
                    Courses
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{groupedNotes.length} with notes</p>
                </CardHeader>

                <ScrollArea className="h-[420px]">
                  <div className="p-2">
                    {groupedNotes.map((course) => {
                      const active = expandedCourse === course.courseId;
                      return (
                        <button
                          key={course.courseId}
                          onClick={() => {
                            setExpandedCourse(active ? null : course.courseId);
                            setSelectedNote(null);
                            setSearchKeyword("");
                            setSearchResults(null);
                          }}
                          className={`w-full text-left rounded-lg px-3 py-2.5 mb-1 transition-all duration-150 flex items-start justify-between gap-2 group ${active
                            ? "bg-[#021d49] text-white"
                            : "hover:bg-muted text-foreground"
                            }`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-semibold truncate ${active ? "text-white" : ""}`}>
                              {course.courseName}
                            </p>
                            <p className={`text-[11px] mt-0.5 ${active ? "text-blue-200" : "text-muted-foreground"}`}>
                              {course.noteCount} note{course.noteCount !== 1 ? "s" : ""}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? "bg-white/20 text-white" : "bg-muted-foreground/10 text-muted-foreground"
                              }`}>
                              {course.noteCount}
                            </span>
                            {course.notes.some((n) => n.isBookmarked) && (
                              <Star className={`w-3 h-3 ${active ? "fill-amber-300 text-amber-300" : "fill-amber-400 text-amber-400"}`} />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </Card>
            </div>

            {/* ── Main: notes list / detail ── */}
            <div className="lg:col-span-3">
              {selectedNote ? (
                <Card className="p-6">
                  <NoteDetail
                    note={selectedNote}
                    onBack={() => setSelectedNote(null)}
                    onDelete={handleDelete}
                    onUpdate={handleUpdate}
                    onBookmark={handleBookmark}
                  />
                </Card>
              ) : displayNotes.length === 0 ? (
                <Card className="border-dashed">
                  <EmptyState
                    icon={Search}
                    title={
                      searchKeyword
                        ? "No results found"
                        : filterBookmarked
                          ? "No bookmarked notes"
                          : "No notes here yet"
                    }
                    description={
                      searchKeyword
                        ? "Try a different search term"
                        : filterBookmarked
                          ? "Star a note to bookmark it"
                          : "Take notes in your lessons and they'll appear here"
                    }
                  />
                </Card>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground px-0.5">
                    {displayNotes.length} note{displayNotes.length !== 1 ? "s" : ""}
                    {searchKeyword && ` for "${searchKeyword}"`}
                  </p>
                  {displayNotes.map((note) => (
                    <NoteCard
                      key={note._id}
                      note={note}
                      onSelect={setSelectedNote}
                      onBookmark={handleBookmark}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}