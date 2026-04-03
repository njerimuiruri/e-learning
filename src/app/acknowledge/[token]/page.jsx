'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://api.elearning.arin-africa.org';

export default function AcknowledgePage({ params }) {
  const { token } = params;
  const [state, setState] = useState('loading'); // 'loading' | 'success' | 'already' | 'error'
  const [name, setName] = useState('');

  useEffect(() => {
    if (!token) { setState('error'); return; }

    fetch(`${API_URL}/api/admission-letters/acknowledge/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.alreadyDone) {
          setState('already');
        } else if (data.success) {
          setState('success');
          if (data.recipientName) setName(data.recipientName);
        } else {
          setState('error');
        }
      })
      .catch(() => setState('error'));
  }, [token]);

  const content = {
    loading: {
      icon: <Loader2 className="animate-spin text-blue-500" size={48} />,
      title: 'Processing…',
      message: 'Please wait while we record your acknowledgement.',
      color: 'text-blue-600',
    },
    success: {
      icon: <CheckCircle className="text-green-500" size={48} />,
      title: `Thank you${name ? `, ${name.split(' ')[0]}` : ''}!`,
      message: 'Your receipt of the admission letter has been successfully acknowledged. Welcome to the Arin Fellowship Program!',
      color: 'text-green-600',
    },
    already: {
      icon: <CheckCircle className="text-blue-400" size={48} />,
      title: 'Already Acknowledged',
      message: 'You have already confirmed receipt of this admission letter. No further action is needed.',
      color: 'text-blue-600',
    },
    error: {
      icon: <XCircle className="text-red-400" size={48} />,
      title: 'Link Not Found',
      message: 'This acknowledgement link is invalid or has expired. Please contact the fellowship team for assistance.',
      color: 'text-red-600',
    },
  }[state];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-10 max-w-md w-full text-center">
        {/* Logo placeholder */}
        <div className="mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-600 mx-auto flex items-center justify-center mb-2">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Arin Fellowship</p>
        </div>

        <div className="flex justify-center mb-4">{content.icon}</div>
        <h1 className={`text-xl font-bold mb-3 ${content.color}`}>{content.title}</h1>
        <p className="text-gray-500 text-sm leading-relaxed">{content.message}</p>

        {state === 'success' && (
          <div className="mt-8 bg-green-50 rounded-xl px-5 py-4 text-left">
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Next Steps</p>
            <p className="text-sm text-green-800">
              Log in to the Arin Learning Platform to access your fellowship materials and begin your learning journey.
            </p>
          </div>
        )}

        <p className="text-xs text-gray-300 mt-8">
          Arin Fellowship Programme &middot; Official Communication
        </p>
      </div>
    </div>
  );
}
