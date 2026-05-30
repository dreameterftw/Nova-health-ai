"use client";

import { Download } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { motion, AnimatePresence } from 'framer-motion';

interface InstallButtonProps {
  variant?: 'header' | 'landing' | 'dashboard';
  className?: string;
}

export function InstallButton({ variant = 'header', className = '' }: InstallButtonProps) {
  const { isInstallable, isInstalled, installApp } = usePWAInstall();

  const handleInstall = async () => {
    const accepted = await installApp();
    if (accepted && process.env.NODE_ENV === 'development') {
      console.log('App installation accepted');
    }
  };

  // Don't show button if not installable or already installed
  if (!isInstallable || isInstalled) {
    return null;
  }

  // Header variant (compact)
  if (variant === 'header') {
    return (
      <AnimatePresence>
        <motion.button
          id="install-btn"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={handleInstall}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all hover:opacity-90 ${className}`}
          style={{ 
            background: 'linear-gradient(135deg, #5B5EF4, #7E82F8)',
            color: '#FFFFFF',
            border: '1px solid rgba(255,255,255,0.2)'
          }}
        >
          <Download size={16} />
          <span className="hidden sm:inline">Install App</span>
        </motion.button>
      </AnimatePresence>
    );
  }

  // Landing page variant (prominent)
  if (variant === 'landing') {
    return (
      <AnimatePresence>
        <motion.button
          id="install-btn"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          onClick={handleInstall}
          className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl font-bold text-base transition-all hover:opacity-90 shadow-lg ${className}`}
          style={{ 
            background: 'linear-gradient(135deg, #5B5EF4, #7E82F8)',
            color: '#FFFFFF',
            border: '1px solid rgba(255,255,255,0.2)'
          }}
        >
          <Download size={20} />
          Install NOVA App
        </motion.button>
      </AnimatePresence>
    );
  }

  // Dashboard variant (subtle)
  if (variant === 'dashboard') {
    return (
      <AnimatePresence>
        <motion.button
          id="install-btn"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          onClick={handleInstall}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl font-medium text-xs transition-all hover:bg-indigo-50 ${className}`}
          style={{ 
            background: '#EEF2FF',
            color: '#5B5EF4',
            border: '1px solid #C7D2FE'
          }}
        >
          <Download size={14} />
          Install
        </motion.button>
      </AnimatePresence>
    );
  }

  return null;
}
