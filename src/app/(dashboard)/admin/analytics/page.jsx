'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Progress
} from "@/components/ui/progress";
import analyticsService from "@/lib/api/analyticsService";
import reminderService from "@/lib/api/reminderService";
import {
    Users,
    BookOpen,
    TrendingUp,
    Award,
    BarChart3,
    UserCheck,
    Target,
    Trash2,
    AlertTriangle
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function AnalyticsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [overview, setOverview] = useState(null);
    const [studentProgress, setStudentProgress] = useState(null);
    const [instructorActivity, setInstructorActivity] = useState(null);
    const [courseCompletion, setCourseCompletion] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");
    const [studentStatus, setStudentStatus] = useState("all");
    const [deleteDialog, setDeleteDialog] = useState({ open: false, instructor: null });
    const [deleting, setDeleting] = useState(false);
    const [triggering, setTriggering] = useState(false);
    const [sendingReminderId, setSendingReminderId] = useState(null);

    useEffect(() => {
        loadAnalytics();
    }, [studentStatus]);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            const [overviewData, progressData, activityData, completionData] = await Promise.all([
                analyticsService.getOverview(),
                analyticsService.getStudentProgress(50, studentStatus),
                analyticsService.getInstructorActivity(),
                analyticsService.getCourseCompletion(),
            ]);

            setOverview(overviewData);
            setStudentProgress(progressData);
            setInstructorActivity(activityData);
            setCourseCompletion(completionData);
        } catch (error) {
            console.error("Error loading analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleTriggerAndGo = async () => {
        try {
            setTriggering(true);
            // Trigger automatic reminder check, then navigate to reminders
            await reminderService.triggerAutomaticReminders();
        } catch (e) {
            // Even if it fails, still route to Reminders for manual actions
            console.error("Trigger error:", e);
        } finally {
            setTriggering(false);
            router.push("/admin/reminders?triggered=1");
        }
    };

    const handleSendReminder = async (enrollmentId) => {
        if (!enrollmentId) return;
        try {
            setSendingReminderId(enrollmentId);
            await reminderService.sendManualReminder(enrollmentId);
            await loadAnalytics();
        } catch (e) {
            console.error("Reminder send failed", e);
            alert("Failed to send reminder");
        } finally {
            setSendingReminderId(null);
        }
    };

    const handleDeleteInstructor = async () => {
        if (!deleteDialog.instructor) return;

        try {
            setDeleting(true);
            await analyticsService.deleteInstructor(deleteDialog.instructor.instructorId);
            setDeleteDialog({ open: false, instructor: null });
            loadAnalytics();
        } catch (error) {
            console.error("Error deleting instructor:", error);
            alert("Failed to delete instructor. Please try again.");
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold">Analytics & Reports</h1>
                    <p className="text-gray-600 mt-2">Track platform performance and user activity</p>
                    <p className="text-sm text-gray-500 mt-1">
                        Tip: Need to test reminder emails? Trigger a run and review details on the Reminders page.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={() => router.push('/admin/reminders')}>
                        Go to Reminders
                    </Button>
                    <Button variant="default" onClick={handleTriggerAndGo} disabled={triggering}>
                        {triggering ? 'Triggering…' : 'Trigger Automatic'}
                    </Button>
                </div>
            </div>

            <div className="flex gap-2 border-b">
                <button
                    onClick={() => setActiveTab("overview")}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === "overview"
                        ? "border-b-2 border-blue-600 text-blue-600"
                        : "text-gray-600 hover:text-gray-900"
                        }`}
                >
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab("students")}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === "students"
                        ? "border-b-2 border-blue-600 text-blue-600"
                        : "text-gray-600 hover:text-gray-900"
                        }`}
                >
                    Student Progress
                </button>
                <button
                    onClick={() => setActiveTab("instructors")}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === "instructors"
                        ? "border-b-2 border-blue-600 text-blue-600"
                        : "text-gray-600 hover:text-gray-900"
                        }`}
                >
                    Instructor Activity
                </button>
                <button
                    onClick={() => setActiveTab("courses")}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === "courses"
                        ? "border-b-2 border-blue-600 text-blue-600"
                        : "text-gray-600 hover:text-gray-900"
                        }`}
                >
                    Course Completion
                </button>
            </div>

            {activeTab === "overview" && overview && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{overview.enrollments?.total || 0}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {overview.enrollments?.active || 0} active students
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Completions</CardTitle>
                                <Award className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{overview.enrollments?.completed || 0}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Completion rate: {overview.enrollments?.completionRate || "0%"}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{overview.courses?.total || 0}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {overview.courses?.published || 0} published
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Learners & Instructors</CardTitle>
                                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{overview.users?.students || 0}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {overview.users?.instructors || 0} active instructors
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Platform Health</CardTitle>
                            <CardDescription>Quick overview of platform status</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Target className="h-5 w-5 text-blue-600" />
                                    <span className="font-medium">Enrollment Status</span>
                                </div>
                                <Badge variant="default">Healthy</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-green-600" />
                                    <span className="font-medium">Course Quality</span>
                                </div>
                                <Badge variant="default">Good</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <UserCheck className="h-5 w-5 text-purple-600" />
                                    <span className="font-medium">Instructor Activity</span>
                                </div>
                                <Badge variant="default">Active</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {activeTab === "students" && studentProgress && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <select
                            className="border rounded-md px-3 py-2 text-sm"
                            value={studentStatus}
                            onChange={(e) => setStudentStatus(e.target.value)}
                        >
                            <option value="all">All students</option>
                            <option value="in-progress">In progress</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Student Progress Overview</CardTitle>
                            <CardDescription>
                                Showing {studentProgress.students?.length || 0} active students |
                                Average Progress: {studentProgress.summary?.averageProgress || 0}%
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Student</TableHead>
                                        <TableHead>Course</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Progress</TableHead>
                                        <TableHead>Last Accessed</TableHead>
                                        <TableHead>Days Enrolled</TableHead>
                                        <TableHead>Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {studentProgress.students?.map((student, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{student.studentName}</div>
                                                    <div className="text-xs text-gray-500">{student.studentEmail}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{student.courseName}</TableCell>
                                            <TableCell>
                                                <Badge variant={student.status === "completed" ? "default" : "secondary"}>
                                                    {student.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <Progress value={student.progress} className="w-20" />
                                                        <span className="text-sm">{student.progress}%</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {student.lastAccessed
                                                    ? new Date(student.lastAccessed).toLocaleDateString()
                                                    : "Never"
                                                }
                                            </TableCell>
                                            <TableCell>{student.daysEnrolled} days</TableCell>
                                            <TableCell>
                                                {student.status === "in-progress" ? (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleSendReminder(student.enrollmentId)}
                                                        disabled={sendingReminderId === student.enrollmentId}
                                                    >
                                                        {sendingReminderId === student.enrollmentId ? "Sending..." : "Send Reminder"}
                                                    </Button>
                                                ) : (
                                                    <span className="text-xs text-gray-500">Completed</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            )}

            {activeTab === "instructors" && instructorActivity && (
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Instructor Activity</CardTitle>
                            <CardDescription>
                                Total: {instructorActivity.summary?.total || 0} |
                                Approved: {instructorActivity.summary?.approved || 0} |
                                Pending: {instructorActivity.summary?.pending || 0}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Instructor</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Courses</TableHead>
                                        <TableHead>Students</TableHead>
                                        <TableHead>Last Login</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {instructorActivity.instructors?.map((instructor, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{instructor.name}</div>
                                                    <div className="text-xs text-gray-500">{instructor.email}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={instructor.status === "approved" ? "default" : "secondary"}>
                                                    {instructor.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="text-sm">{instructor.coursesCreated} total</div>
                                                    <div className="text-xs text-gray-500">
                                                        {instructor.publishedCourses} published
                                                        {instructor.pendingApproval > 0 && `, ${instructor.pendingApproval} pending`}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{instructor.totalStudents}</TableCell>
                                            <TableCell>
                                                {instructor.lastLogin
                                                    ? new Date(instructor.lastLogin).toLocaleDateString()
                                                    : "Never"
                                                }
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => setDeleteDialog({ open: true, instructor })}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-1" />
                                                    Delete
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            )}

            {activeTab === "courses" && courseCompletion && (
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Course Completion Statistics</CardTitle>
                            <CardDescription>
                                Overall Rate: {courseCompletion.overall?.completionRate || "0%"} |
                                Average Progress: {courseCompletion.overall?.averageProgress || 0}%
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Course</TableHead>
                                        <TableHead>Enrollments</TableHead>
                                        <TableHead>Completed</TableHead>
                                        <TableHead>Completion Rate</TableHead>
                                        <TableHead>Avg Progress</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {courseCompletion.courses?.map((course, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">{course.courseName}</TableCell>
                                            <TableCell>{course.totalEnrollments}</TableCell>
                                            <TableCell>{course.completedCount}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Progress value={course.completionRate} className="w-20" />
                                                    <span className="text-sm">{course.completionRate.toFixed(1)}%</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{course.avgProgress}%</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, instructor: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Delete Instructor
                        </DialogTitle>
                        <DialogDescription className="space-y-2">
                            <p>
                                Are you sure you want to delete <strong>{deleteDialog.instructor?.name}</strong>?
                            </p>
                            <p className="text-red-600 font-medium">
                                This will permanently delete:
                            </p>
                            <ul className="list-disc list-inside text-sm space-y-1">
                                <li>{deleteDialog.instructor?.coursesCreated || 0} courses created by this instructor</li>
                                <li>All enrollments for those courses</li>
                                <li>All questions and certificates associated with those courses</li>
                                <li>The instructor's account</li>
                            </ul>
                            <p className="font-bold text-red-600">This action cannot be undone!</p>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialog({ open: false, instructor: null })}
                            disabled={deleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteInstructor}
                            disabled={deleting}
                        >
                            {deleting ? "Deleting..." : "Yes, Delete Instructor"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
