"use client";

import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#F8F9FC' }}>
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <h1 className="text-9xl font-black mb-2" style={{ fontFamily: 'var(--font-outfit, sans-serif)', color: '#5B5EF4' }}>
            404
          </h1>
          <h2 className="text-2xl font-bold mb-3" style={{ color: '#0F172A' }}>
            Page Not Found
          </h2>
          <p className="text-sm mb-8" style={{ color: '#64748B' }}>
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/"
            className="flex-1 py-3 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
            style={{ background: '#5B5EF4' }}
          >
            <Home size={16} />
            Go Home
          </Link>

          <button
            onClick={() => window.history.back()}
            className="flex-1 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all hover:bg-slate-100"
            style={{ background: '#FFFFFF', color: '#334155', border: '1px solid #E2E8F0' }}
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
