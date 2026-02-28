'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    Bell,
    Send,
    Settings,
    RefreshCw,
    Clock,
    TrendingUp,
    Users,
    Mail,
    CheckCircle,
    AlertCircle,
    Loader2,
    Filter,
    X,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import reminderService from '@/lib/api/reminderService';

export default function AdminRemindersPage() {
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState([]);
    const [stats, setStats] = useState(null);
    const [settings, setSettings] = useState(null);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [sending, setSending] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [filterDays, setFilterDays] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [toast, setToast] = useState(null);
    const [triggering, setTriggering] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const t = searchParams?.get('triggered');
        if (t === '1') {
            showToast('Automatic reminders triggered. Review updated stats below.', 'success');
        }
    }, [searchParams]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [studentsData, statsData, settingsData] = await Promise.all([
                reminderService.getStudentsNeedingReminders(100),
                reminderService.getReminderStats(),
                reminderService.getReminderSettings(),
            ]);

            setStudents(studentsData);
            setStats(statsData);
            setSettings(settingsData);
        } catch (error) {
            console.error('Error fetching data:', error);
            showToast(error.message || 'Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };

    const handleTriggerAutomatic = async () => {
        try {
            setTriggering(true);
            await reminderService.triggerAutomaticReminders();
            showToast('Automatic reminder check triggered.', 'success');
            await fetchData();
        } catch (error) {
            showToast(error.message || 'Failed to trigger automatic reminders', 'error');
        } finally {
            setTriggering(false);
        }
    };

    const handleSendReminder = async (enrollmentId) => {
        try {
            setSending(true);
            await reminderService.sendManualReminder(enrollmentId);
            showToast('Reminder sent successfully!', 'success');
            await fetchData(); // Refresh data
        } catch (error) {
            showToast(error.message || 'Failed to send reminder', 'error');
        } finally {
            setSending(false);
        }
    };

    const handleSendBulkReminders = async () => {
        if (selectedStudents.length === 0) {
            showToast('Please select at least one student', 'error');
            return;
        }

        const confirmed = confirm(
            `Are you sure you want to send reminders to ${selectedStudents.length} student(s)?`
        );
        if (!confirmed) return;

        try {
            setSending(true);
            const result = await reminderService.sendBulkReminders(selectedStudents);
            showToast(
                `Reminders sent! Successful: ${result.successful.length}, Failed: ${result.failed.length}`,
                'success'
            );
            setSelectedStudents([]);
            await fetchData();
        } catch (error) {
            showToast(error.message || 'Failed to send bulk reminders', 'error');
        } finally {
            setSending(false);
        }
    };

    const handleUpdateSettings = async (newSettings) => {
        try {
            await reminderService.updateReminderSettings(newSettings);
            setSettings(newSettings);
            showToast('Settings updated successfully!', 'success');
            setSettingsOpen(false);
        } catch (error) {
            showToast(error.message || 'Failed to update settings', 'error');
        }
    };

    const handleSelectAll = () => {
        if (selectedStudents.length === filteredStudents.length) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(filteredStudents.map((s) => s.enrollmentId));
        }
    };

    const handleSelectStudent = (enrollmentId) => {
        setSelectedStudents((prev) =>
            prev.includes(enrollmentId)
                ? prev.filter((id) => id !== enrollmentId)
                : [...prev, enrollmentId]
        );
    };

    // Filter students
    const filteredStudents = students.filter((student) => {
        const matchesDays =
            filterDays === 'all' ||
            (filterDays === '7' && student.daysSinceLastAccess >= 7 && student.daysSinceLastAccess < 14) ||
            (filterDays === '14' && student.daysSinceLastAccess >= 14 && student.daysSinceLastAccess < 30) ||
            (filterDays === '30' && student.daysSinceLastAccess >= 30);

        const matchesSearch =
            searchQuery === '' ||
            student.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.course.title.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesDays && matchesSearch;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading reminder data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6 lg:p-8 pt-24">
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 ${toast.type === 'success' ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'} border-l-4 rounded-lg shadow-2xl p-4 min-w-[320px] max-w-md animate-slideIn`}>
                    <div className="flex items-start gap-3">
                        {toast.type === 'success' ? (
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                            <p className={`${toast.type === 'success' ? 'text-green-800' : 'text-red-800'} font-medium text-sm`}>{toast.message}</p>
                        </div>
                        <button onClick={() => setToast(null)} className="text-gray-400 hover:text-gray-600">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Bell className="w-8 h-8 text-blue-600" />
                            Student Reminders
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Send reminders to students who haven't completed their courses
                        </p>
                    </div>
                    <div className="flex gap-3 mt-4 md:mt-0">
                        <Button onClick={handleTriggerAutomatic} size="sm" disabled={triggering}>
                            <Clock className="w-4 h-4 mr-2" />
                            {triggering ? 'Triggering...' : 'Trigger Automatic'}
                        </Button>
                        <Button onClick={fetchData} variant="outline" size="sm">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </Button>
                        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Settings className="w-4 h-4 mr-2" />
                                    Settings
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Reminder Settings</DialogTitle>
                                    <DialogDescription>
                                        Configure automatic reminder system
                                    </DialogDescription>
                                </DialogHeader>
                                {settings && (
                                    <div className="space-y-6 py-4">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>Automatic Reminders</Label>
                                                <p className="text-sm text-gray-500">
                                                    Send reminders automatically every day at 9 AM
                                                </p>
                                            </div>
                                            <Switch
                                                checked={settings.autoRemindersEnabled}
                                                onCheckedChange={(checked) =>
                                                    setSettings({ ...settings, autoRemindersEnabled: checked })
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Inactivity Period (Days)</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={settings.reminderDelayDays}
                                                onChange={(e) =>
                                                    setSettings({
                                                        ...settings,
                                                        reminderDelayDays: parseInt(e.target.value),
                                                    })
                                                }
                                            />
                                            <p className="text-sm text-gray-500">
                                                Send reminder after student is inactive for this many days
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setSettingsOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={() => handleUpdateSettings(settings)}>
                                        Save Changes
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Stats Grid */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-600">
                                    Total Reminders Sent
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <span className="text-3xl font-bold">{stats.totalRemindersSent}</span>
                                    <Mail className="w-8 h-8 text-blue-500" />
                                </div>
                                <p className="text-sm text-gray-500 mt-1">All time</p>
                                {stats.lastAutomaticRunAt && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Last automatic run: {new Date(stats.lastAutomaticRunAt).toLocaleString()}
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-600">
                                    Last 30 Days
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <span className="text-3xl font-bold">{stats.remindersLast30Days}</span>
                                    <TrendingUp className="w-8 h-8 text-green-500" />
                                </div>
                                <p className="text-sm text-gray-500 mt-1">Recent activity</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-600">
                                    Active Enrollments
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <span className="text-3xl font-bold">{stats.activeEnrollments}</span>
                                    <Users className="w-8 h-8 text-purple-500" />
                                </div>
                                <p className="text-sm text-gray-500 mt-1">In progress</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-600">
                                    Needs Reminder
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <span className="text-3xl font-bold text-orange-600">
                                        {stats.inactiveEnrollments}
                                    </span>
                                    <AlertCircle className="w-8 h-8 text-orange-500" />
                                </div>
                                <p className="text-sm text-gray-500 mt-1">Inactive students</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Filters and Actions */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="text-lg">Filter & Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <Input
                                    placeholder="Search by student name, email, or course..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full"
                                />
                            </div>
                            <Select value={filterDays} onValueChange={setFilterDays}>
                                <SelectTrigger className="w-full md:w-48">
                                    <SelectValue placeholder="Filter by days" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Students</SelectItem>
                                    <SelectItem value="7">7-14 days</SelectItem>
                                    <SelectItem value="14">14-30 days</SelectItem>
                                    <SelectItem value="30">30+ days</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                onClick={handleSendBulkReminders}
                                disabled={selectedStudents.length === 0 || sending}
                                className="whitespace-nowrap"
                            >
                                {sending ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4 mr-2" />
                                )}
                                Send to Selected ({selectedStudents.length})
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Students Table */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Students Needing Reminders</CardTitle>
                                <CardDescription>
                                    {filteredStudents.length} student(s) found
                                </CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={handleSelectAll}>
                                {selectedStudents.length === filteredStudents.length
                                    ? 'Deselect All'
                                    : 'Select All'}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {filteredStudents.length === 0 ? (
                            <div className="text-center py-12">
                                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    No Students Need Reminders
                                </h3>
                                <p className="text-gray-600">
                                    All students are actively engaged with their courses!
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Select
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Student
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Course
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Progress
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Last Access
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Reminders
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredStudents.map((student) => (
                                            <tr
                                                key={student.enrollmentId}
                                                className="hover:bg-gray-50 transition-colors"
                                            >
                                                <td className="px-4 py-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedStudents.includes(student.enrollmentId)}
                                                        onChange={() => handleSelectStudent(student.enrollmentId)}
                                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                    />
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {student.student.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {student.student.email}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="text-sm text-gray-900">
                                                        {student.course.title}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-24 bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className="bg-blue-600 h-2 rounded-full"
                                                                style={{ width: `${student.progress}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-sm text-gray-600">
                                                            {Math.round(student.progress)}%
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <Badge
                                                        variant={
                                                            student.daysSinceLastAccess >= 30
                                                                ? 'destructive'
                                                                : student.daysSinceLastAccess >= 14
                                                                    ? 'warning'
                                                                    : 'default'
                                                        }
                                                        className="text-xs"
                                                    >
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        {student.daysSinceLastAccess} days ago
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="text-sm text-gray-600">
                                                        {student.reminderCount === 0 ? (
                                                            <span className="text-gray-400">None sent</span>
                                                        ) : (
                                                            <span>
                                                                {student.reminderCount} sent
                                                                {student.lastReminderSent && (
                                                                    <div className="text-xs text-gray-400">
                                                                        Last: {new Date(student.lastReminderSent).toLocaleDateString()}
                                                                    </div>
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleSendReminder(student.enrollmentId)}
                                                        disabled={sending}
                                                    >
                                                        {sending ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <Send className="w-4 h-4 mr-1" />
                                                                Send
                                                            </>
                                                        )}
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
