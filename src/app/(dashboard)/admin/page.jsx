'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Users,
    BookOpen,
    TrendingUp,
    Shield,
    CheckCircle,
    XCircle,
    Clock,
    ChevronRight,
    Menu,
    X,
    Settings,
    LogOut,
    Bell,
    UserCheck,
    AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function AdminDashboard() {
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => {
        router.push('/login');
    };

    const goToLogin = () => {
        router.push('/login');
    };

    const goToRegister = () => {
        router.push('/register');
    };

    const stats = [
        { title: 'Total Users', value: '2,847', icon: Users, color: 'from-blue-400 to-indigo-500' },
        { title: 'Active Courses', value: '156', icon: BookOpen, color: 'from-indigo-400 to-purple-500' },
        { title: 'Pending Approvals', value: '8', icon: Clock, color: 'from-purple-400 to-pink-500' },
        { title: 'Platform Revenue', value: '$45.2K', icon: TrendingUp, color: 'from-pink-400 to-blue-500' },
    ];

    const pendingInstructors = [
        { name: 'John Doe', email: 'john@example.com', date: '2 days ago', courses: 3 },
        { name: 'Sarah Smith', email: 'sarah@example.com', date: '5 days ago', courses: 2 },
        { name: 'Mike Johnson', email: 'mike@example.com', date: '1 week ago', courses: 4 },
    ];

    const recentActivity = [
        { action: 'New user registration', user: 'Alice Cooper', time: '5 min ago', type: 'user' },
        { action: 'Course published', user: 'David Lee', time: '1 hour ago', type: 'course' },
        { action: 'Instructor approved', user: 'Emma Watson', time: '3 hours ago', type: 'approval' },
        { action: 'Payment processed', user: 'System', time: '5 hours ago', type: 'payment' },
    ];

    const handleApprove = (name) => {
        alert(`Approved instructor: ${name}`);
    };

    const handleReject = (name) => {
        alert(`Rejected instructor: ${name}`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div className="p-6 border-b">
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Admin Portal
                        </h2>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-2">
                        <Button variant="ghost" className="w-full justify-start text-blue-600 bg-blue-50">
                            <Shield className="mr-3 h-5 w-5" />
                            Dashboard
                        </Button>
                        <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-blue-600 hover:bg-blue-50">
                            <Users className="mr-3 h-5 w-5" />
                            User Management
                        </Button>
                        <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-blue-600 hover:bg-blue-50">
                            <BookOpen className="mr-3 h-5 w-5" />
                            Course Management
                        </Button>
                        <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-blue-600 hover:bg-blue-50">
                            <UserCheck className="mr-3 h-5 w-5" />
                            Approvals
                        </Button>
                        <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-blue-600 hover:bg-blue-50">
                            <TrendingUp className="mr-3 h-5 w-5" />
                            Analytics
                        </Button>
                        <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-blue-600 hover:bg-blue-50">
                            <Settings className="mr-3 h-5 w-5" />
                            Settings
                        </Button>
                    </nav>

                    {/* User Profile */}
                    <div className="p-4 border-t">
                        <div className="flex items-center space-x-3 mb-3">
                            <Avatar className="h-10 w-10 bg-gradient-to-br from-blue-400 to-purple-500">
                                <AvatarFallback className="text-white font-semibold">AD</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-800">Admin User</p>
                                <p className="text-xs text-gray-500">admin@example.com</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={handleLogout}
                        >
                            <LogOut className="mr-3 h-5 w-5" />
                            Logout
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="lg:ml-64">
                {/* Top Bar */}
                <header className="bg-white shadow-sm border-b sticky top-0 z-40">
                    <div className="flex items-center justify-between p-4">
                        <div className="flex items-center space-x-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="lg:hidden"
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                            >
                                {sidebarOpen ? <X /> : <Menu />}
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard 🛡️</h1>
                                <p className="text-sm text-gray-500">Manage your platform</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Button variant="ghost" size="icon" className="relative">
                                <Bell className="h-5 w-5" />
                                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
                            </Button>
                            <Button variant="ghost" onClick={goToLogin} className="text-gray-700 hover:text-blue-600">
                                Login
                            </Button>
                            <Button onClick={goToRegister} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                                Sign Up
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Dashboard Content */}
                <main className="p-6 space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {stats.map((stat, index) => (
                            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                                            <stat.icon className="h-6 w-6 text-white" />
                                        </div>
                                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                                            <TrendingUp className="h-3 w-3 mr-1" />
                                            Live
                                        </Badge>
                                    </div>
                                    <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.title}</h3>
                                    <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Pending Instructor Approvals */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="border-b bg-gradient-to-r from-amber-50 to-orange-50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <AlertCircle className="h-5 w-5 text-amber-600" />
                                    <CardTitle className="text-xl font-bold text-gray-800">Pending Instructor Approvals</CardTitle>
                                </div>
                                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                                    {pendingInstructors.length} Pending
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                {pendingInstructors.map((instructor, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 rounded-xl border-2 border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all">
                                        <div className="flex items-center space-x-4">
                                            <Avatar className="h-12 w-12 bg-gradient-to-br from-blue-400 to-purple-500">
                                                <AvatarFallback className="text-white font-semibold">
                                                    {instructor.name.split(' ').map(n => n[0]).join('')}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <h4 className="font-semibold text-gray-800">{instructor.name}</h4>
                                                <p className="text-sm text-gray-500">{instructor.email}</p>
                                                <div className="flex items-center space-x-3 mt-1">
                                                    <span className="text-xs text-gray-500">{instructor.date}</span>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {instructor.courses} courses proposed
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Button
                                                size="sm"
                                                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                                                onClick={() => handleApprove(instructor.name)}
                                            >
                                                <CheckCircle className="h-4 w-4 mr-1" />
                                                Approve
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="border-red-200 text-red-600 hover:bg-red-50"
                                                onClick={() => handleReject(instructor.name)}
                                            >
                                                <XCircle className="h-4 w-4 mr-1" />
                                                Reject
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Platform Overview & Recent Activity */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Platform Stats */}
                        <Card className="border-0 shadow-lg">
                            <CardHeader className="border-b">
                                <CardTitle className="text-lg font-bold text-gray-800">Platform Overview</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="font-medium text-gray-700">User Growth</span>
                                            <span className="font-semibold text-blue-600">+24%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div className="bg-gradient-to-r from-blue-400 to-indigo-500 h-3 rounded-full" style={{ width: '75%' }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="font-medium text-gray-700">Course Completion</span>
                                            <span className="font-semibold text-purple-600">68%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div className="bg-gradient-to-r from-indigo-400 to-purple-500 h-3 rounded-full" style={{ width: '68%' }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="font-medium text-gray-700">Platform Health</span>
                                            <span className="font-semibold text-green-600">98%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-3 rounded-full" style={{ width: '98%' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Activity */}
                        <Card className="border-0 shadow-lg">
                            <CardHeader className="border-b">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg font-bold text-gray-800">Recent Activity</CardTitle>
                                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                        View All <ChevronRight className="ml-1 h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    {recentActivity.map((activity, index) => (
                                        <div key={index} className="flex items-start space-x-3">
                                            <div className={`w-2 h-2 rounded-full mt-2 ${activity.type === 'user' ? 'bg-blue-500' :
                                                activity.type === 'course' ? 'bg-purple-500' :
                                                    activity.type === 'approval' ? 'bg-green-500' :
                                                        'bg-orange-500'
                                                }`}></div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-800">{activity.action}</p>
                                                <p className="text-xs text-gray-500">{activity.user} • {activity.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* User Distribution */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="border-b">
                            <CardTitle className="text-lg font-bold text-gray-800">User Distribution</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="text-center p-6 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50">
                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                                        <Users className="h-8 w-8 text-white" />
                                    </div>
                                    <p className="text-3xl font-bold text-gray-800 mb-1">2,245</p>
                                    <p className="text-sm text-gray-600">Students</p>
                                </div>
                                <div className="text-center p-6 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50">
                                    <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                                        <UserCheck className="h-8 w-8 text-white" />
                                    </div>
                                    <p className="text-3xl font-bold text-gray-800 mb-1">145</p>
                                    <p className="text-sm text-gray-600">Instructors</p>
                                </div>
                                <div className="text-center p-6 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50">
                                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                                        <Shield className="h-8 w-8 text-white" />
                                    </div>
                                    <p className="text-3xl font-bold text-gray-800 mb-1">12</p>
                                    <p className="text-sm text-gray-600">Admins</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </div>

            {/* Overlay for mobile sidebar */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}
        </div>
    );
}