'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import authService from '@/lib/api/authService';

export default function SetInitialPasswordPage() {
  const router = useRouter();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow] = useState({ current: false, newPw: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Redirect if not logged in or doesn't need to set password
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!user.mustSetPassword) {
      // Already set password — redirect to their dashboard
      if (user.role === 'admin') router.replace('/admin/dashboard');
      else if (user.role === 'instructor') router.replace('/instructor/dashboard');
      else router.replace('/student/dashboard');
    }
  }, [router]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const getStrength = (pw) => {
    if (!pw) return { level: 0, label: '', color: '' };
    let score = 0;
    if (pw.length >= 8)  score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { level: 1, label: 'Weak',   color: 'bg-red-400' };
    if (score === 2) return { level: 2, label: 'Fair',   color: 'bg-amber-400' };
    if (score === 3) return { level: 3, label: 'Good',   color: 'bg-blue-400' };
    return              { level: 4, label: 'Strong', color: 'bg-green-500' };
  };

  const strength = getStrength(form.newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.currentPassword) return setError('Please enter your temporary password');
    if (form.newPassword.length < 8) return setError('New password must be at least 8 characters');
    if (form.newPassword !== form.confirmPassword) return setError('New passwords do not match');
    if (form.newPassword === form.currentPassword) return setError('New password must be different from the temporary password');

    setLoading(true);
    try {
      await authService.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setSuccess(true);
      // Log out and redirect to login after 2 seconds
      setTimeout(() => {
        authService.logout();
        router.replace('/login');
      }, 2500);
    } catch (err) {
      setError(err.message || 'Failed to set password. Please check your temporary password and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-sm w-full text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-9 h-9 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Password Set!</h2>
          <p className="text-sm text-gray-500">
            Your password has been updated successfully. Redirecting you to the login page…
          </p>
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-green-500 h-1.5 rounded-full animate-[grow_2.5s_linear_forwards]" style={{ width: '100%', animation: 'none', transition: 'none' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">

        {/* Logo / Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Set Your Password</h1>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">
            Your account was created by an administrator. Please set a personal password to secure your account.
          </p>
        </div>

        {/* Info box */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700 flex gap-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-500" />
          <span>
            Enter the <strong>temporary password</strong> from your welcome email, then choose a new personal password.
          </span>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Current (temp) password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Temporary Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={show.current ? 'text' : 'password'}
                  value={form.currentPassword}
                  onChange={e => set('currentPassword', e.target.value)}
                  placeholder="From your welcome email"
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShow(s => ({ ...s, current: !s.current }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {show.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={show.newPw ? 'text' : 'password'}
                  value={form.newPassword}
                  onChange={e => set('newPassword', e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShow(s => ({ ...s, newPw: !s.newPw }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {show.newPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Strength meter */}
              {form.newPassword && (
                <div className="space-y-1 pt-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all ${i <= strength.level ? strength.color : 'bg-gray-100'}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">Strength: <span className="font-medium">{strength.label}</span></p>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={show.confirm ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={e => set('confirmPassword', e.target.value)}
                  placeholder="Repeat your new password"
                  className={`w-full pl-10 pr-10 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300 ${
                    form.confirmPassword && form.confirmPassword !== form.newPassword
                      ? 'border-red-300 focus:border-red-400'
                      : 'border-gray-200 focus:border-green-400'
                  }`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShow(s => ({ ...s, confirm: !s.confirm }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {show.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.confirmPassword && form.confirmPassword !== form.newPassword && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="flex gap-2 items-start p-3 bg-red-50 border border-red-100 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Requirements list */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
              <p className="text-xs font-semibold text-gray-600">Password requirements:</p>
              {[
                { test: form.newPassword.length >= 8, label: 'At least 8 characters' },
                { test: /[A-Z]/.test(form.newPassword), label: 'One uppercase letter' },
                { test: /[0-9]/.test(form.newPassword), label: 'One number' },
              ].map(({ test, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 ${test ? 'bg-green-500' : 'bg-gray-200'}`}>
                    {test && <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </div>
                  <span className={`text-xs ${test ? 'text-green-700' : 'text-gray-400'}`}>{label}</span>
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || !form.currentPassword || form.newPassword.length < 8 || form.newPassword !== form.confirmPassword}
              className="w-full py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold text-sm hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Setting Password…
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Set My Password
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400">
          Didn&apos;t receive your welcome email?{' '}
          <a href="mailto:support@arin-africa.org" className="text-green-600 hover:underline font-medium">
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}
