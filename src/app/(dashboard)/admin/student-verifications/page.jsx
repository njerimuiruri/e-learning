'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import studentVerificationService from '@/lib/api/studentVerificationService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  color: 'bg-amber-100 text-amber-700 border-amber-200' },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700 border-green-200' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700 border-red-200' },
};

export default function StudentVerificationsPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal, setRejectModal] = useState(null); // userId
  const [rejectReason, setRejectReason] = useState('');
  const [viewModal, setViewModal] = useState(null); // user object
  const [toast, setToast] = useState(null);

  const LIMIT = 20;

  useEffect(() => { fetchData(); }, [page, statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await studentVerificationService.adminGetAll(page, LIMIT, statusFilter || undefined);
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch {
      showToast('Failed to load verifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleApprove = async (userId) => {
    try {
      setActionLoading(userId + '_approve');
      await studentVerificationService.adminApprove(userId);
      showToast('Student verified and access granted!');
      fetchData();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Approval failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { showToast('Please enter a rejection reason', 'error'); return; }
    try {
      setActionLoading(rejectModal + '_reject');
      await studentVerificationService.adminReject(rejectModal, rejectReason);
      showToast('Verification rejected.');
      setRejectModal(null);
      setRejectReason('');
      fetchData();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Rejection failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = Math.ceil(total / LIMIT) || 1;

  return (
    <div className="min-h-screen bg-gray-50/80">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Student ID Verifications</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Review and approve student ID submissions for Arin Publishing Academy
            </p>
          </div>
          <Button variant="ghost" size="sm" className="text-gray-500 gap-1.5"
            onClick={() => router.push('/admin')}>
            <Icons.LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <Select value={statusFilter || '__all__'}
            onValueChange={(v) => { setStatusFilter(v === '__all__' ? '' : v); setPage(1); }}>
            <SelectTrigger className="w-40 h-9 text-sm border-gray-200 bg-white">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 text-sm text-gray-500 ml-auto">
            <Icons.Users className="w-4 h-4" />
            {total} submission{total !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Icons.Loader2 className="w-8 h-8 animate-spin text-[#021d49]" />
          </div>
        ) : users.length === 0 ? (
          <Card className="border-gray-100">
            <CardContent className="py-16 text-center">
              <Icons.CheckSquare className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-500">
                {statusFilter === 'pending' ? 'No pending verifications' : 'No submissions found'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {users.map((user) => {
              const sv = user.studentVerification || {};
              const statusCfg = STATUS_CONFIG[sv.status] || STATUS_CONFIG.pending;
              const catName = user.pendingStudentCategoryId?.name || 'Arin Publishing Academy';
              return (
                <Card key={user._id} className="border-gray-100 hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4 flex-wrap">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-xl bg-[#021d49]/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-[#021d49]">
                          {(user.firstName?.[0] || '?').toUpperCase()}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900 text-sm">
                            {user.firstName} {user.lastName}
                          </p>
                          <Badge variant="outline" className={`text-[10px] border ${statusCfg.color}`}>
                            {statusCfg.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
                        <div className="flex items-center gap-4 mt-1.5 text-[11px] text-gray-400 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Icons.Layers className="w-3 h-3" /> {catName}
                          </span>
                          {sv.submittedAt && (
                            <span className="flex items-center gap-1">
                              <Icons.Clock className="w-3 h-3" />
                              Submitted {new Date(sv.submittedAt).toLocaleDateString()}
                            </span>
                          )}
                          {sv.reviewedAt && (
                            <span className="flex items-center gap-1">
                              <Icons.CheckCircle className="w-3 h-3" />
                              Reviewed {new Date(sv.reviewedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        {sv.status === 'rejected' && sv.rejectionReason && (
                          <p className="text-[11px] text-red-600 mt-1">
                            Reason: {sv.rejectionReason}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        {sv.idUploadUrl && (
                          <Button variant="outline" size="sm" className="h-8 text-xs border-gray-200 gap-1.5"
                            onClick={() => setViewModal(user)}>
                            <Icons.Eye className="w-3.5 h-3.5" /> View ID
                          </Button>
                        )}
                        {sv.status === 'pending' && (
                          <>
                            <Button size="sm"
                              className="h-8 text-xs bg-green-600 hover:bg-green-700 text-white gap-1.5"
                              disabled={actionLoading === user._id + '_approve'}
                              onClick={() => handleApprove(user._id)}>
                              {actionLoading === user._id + '_approve'
                                ? <Icons.Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <Icons.CheckCircle className="w-3.5 h-3.5" />}
                              Approve
                            </Button>
                            <Button size="sm" variant="outline"
                              className="h-8 text-xs border-red-200 text-red-600 hover:bg-red-50 gap-1.5"
                              disabled={actionLoading === user._id + '_reject'}
                              onClick={() => { setRejectModal(user._id); setRejectReason(''); }}>
                              <Icons.XCircle className="w-3.5 h-3.5" /> Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-gray-200"
              disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
              <Icons.ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-gray-200"
              disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
              <Icons.ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* View ID Modal */}
      {viewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setViewModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-[#021d49] to-blue-700 px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-white font-bold text-sm">{viewModal.firstName} {viewModal.lastName}</p>
                <p className="text-blue-200 text-xs">{viewModal.email}</p>
              </div>
              <button onClick={() => setViewModal(null)} className="text-white/60 hover:text-white">
                <Icons.X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              {viewModal.studentVerification?.idUploadUrl?.match(/\.(jpg|jpeg|png)$/i) ||
               viewModal.studentVerification?.idUploadUrl?.includes('cloudinary.com') ? (
                <img
                  src={viewModal.studentVerification.idUploadUrl}
                  alt="Student ID"
                  className="w-full rounded-xl border border-gray-200 object-contain max-h-80"
                />
              ) : (
                <a
                  href={viewModal.studentVerification?.idUploadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 hover:bg-gray-100 transition"
                >
                  <Icons.FileText className="w-6 h-6 text-red-500" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">View Student ID (PDF)</p>
                    <p className="text-xs text-gray-400">Click to open in new tab</p>
                  </div>
                  <Icons.ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
                </a>
              )}

              {viewModal.studentVerification?.status === 'pending' && (
                <div className="flex gap-3 mt-5">
                  <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm gap-1.5"
                    disabled={actionLoading === viewModal._id + '_approve'}
                    onClick={() => { setViewModal(null); handleApprove(viewModal._id); }}>
                    <Icons.CheckCircle className="w-4 h-4" /> Approve
                  </Button>
                  <Button variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50 text-sm gap-1.5"
                    onClick={() => { setViewModal(null); setRejectModal(viewModal._id); setRejectReason(''); }}>
                    <Icons.XCircle className="w-4 h-4" /> Reject
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-base font-bold text-gray-900 mb-1">Reject Verification</h2>
            <p className="text-sm text-gray-500 mb-4">
              The student will be notified with this reason and can re-upload.
            </p>
            <Input
              placeholder="e.g. ID is expired, unclear photo, wrong document..."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="mb-4 text-sm"
            />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 border-gray-200 text-gray-600"
                onClick={() => { setRejectModal(null); setRejectReason(''); }}>
                Cancel
              </Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white gap-1.5 text-sm"
                disabled={actionLoading === rejectModal + '_reject'}
                onClick={handleReject}>
                {actionLoading === rejectModal + '_reject'
                  ? <Icons.Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Icons.XCircle className="w-3.5 h-3.5" />}
                Confirm Reject
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === 'error'
            ? 'bg-red-600 text-white'
            : 'bg-green-600 text-white'
        }`}>
          {toast.type === 'error'
            ? <Icons.AlertTriangle className="w-4 h-4" />
            : <Icons.CheckCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
