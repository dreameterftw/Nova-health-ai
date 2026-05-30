'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to error reporting service
    if (process.env.NODE_ENV === 'development') {
      console.error('Application error:', error);
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#F8F9FC' }}>
      <div className="max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
            style={{ background: '#FEE2E2', border: '1px solid #FCA5A5' }}>
            <AlertCircle size={40} style={{ color: '#DC2626' }} />
          </div>
        </div>

        <h1 className="text-3xl font-black mb-3" style={{ fontFamily: 'var(--font-outfit, sans-serif)', color: '#0F172A' }}>
          Something went wrong
        </h1>

        <p className="text-sm mb-8" style={{ color: '#64748B' }}>
          We encountered an unexpected error. Don&apos;t worry, your data is safe.
        </p>

        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mb-6 p-4 rounded-2xl text-left" style={{ background: '#FEF2F2', border: '1px solid #FCA5A5' }}>
            <p className="text-xs font-mono" style={{ color: '#991B1B' }}>
              {error.message}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={reset}
            className="flex-1 py-3 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
            style={{ background: '#5B5EF4' }}
          >
            <RefreshCw size={16} />
            Try Again
          </button>

          <Link
            href="/"
            className="flex-1 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all hover:bg-slate-100"
            style={{ background: '#FFFFFF', color: '#334155', border: '1px solid #E2E8F0' }}
          >
            <Home size={16} />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
