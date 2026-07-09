/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coffee, Copy, Check, QrCode, X, Heart, ExternalLink } from 'lucide-react';

interface BuyMeCoffeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  upiId?: string;
  creatorName?: string;
}

// Global configuration
const DEFAULT_UPI_ID = 'vishwajeetkalokhe8401-1@okaxis';
const PORTFOLIO_URL = 'https://vishwajeetkalokhe-dev-portfolio.vercel.app/';

/**
 * 1. Professional Scanner Grid Box / QR Frame
 */
export function QRDisplayFrame({ size = 200, className = '' }: { size?: number; className?: string }) {
  const [imgSrc, setImgSrc] = useState('/qr-money.png');
  const [imgError, setImgError] = useState(false);

  const handleImgError = () => {
    if (imgSrc === '/qr-money.png') {
      setImgSrc('/coffee-qr.png');
    } else {
      setImgError(true);
    }
  };

  return (
    <div className={`relative flex flex-col items-center justify-center rounded-2xl bg-slate-950/80 p-5 border border-white/10 shadow-[inset_0_2px_12px_rgba(0,0,0,0.8)] overflow-hidden group ${className}`} style={{ width: size + 40, height: size + 40 }}>
      {/* Target Corners */}
      <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-indigo-400 rounded-tl-sm pointer-events-none" />
      <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-indigo-400 rounded-tr-sm pointer-events-none" />
      <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-indigo-400 rounded-bl-sm pointer-events-none" />
      <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-indigo-400 rounded-br-sm pointer-events-none" />

      {/* Laser Scanning Animation */}
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-[0_0_8px_rgba(99,102,241,0.8)] animate-[scan_3s_ease-in-out_infinite] z-20 pointer-events-none" />

      {/* QR Code Container */}
      <div className="relative w-full h-full flex items-center justify-center">
        {!imgError ? (
          <img
            src={imgSrc}
            alt="Payment QR Code"
            onError={handleImgError}
            className="w-full h-full object-contain rounded-lg transition-transform duration-500 group-hover:scale-105 select-none"
            style={{ maxWidth: size, maxHeight: size }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-2 text-slate-500">
            <QrCode className="w-12 h-12 text-slate-700 mb-2 animate-pulse" />
            <span className="text-[10px] font-mono leading-normal max-w-[160px]">
              Replace placeholder by adding <code className="text-indigo-300">qr-money.png</code> to the public/ folder.
            </span>
            {/* Elegant Vector SVG QR Code Placeholder */}
            <div className="mt-3 opacity-20 hover:opacity-30 transition-opacity">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="2" width="6" height="6" rx="1" />
                <rect x="16" y="2" width="6" height="6" rx="1" />
                <rect x="2" y="16" width="6" height="6" rx="1" />
                <path d="M9 5h6M5 9h4M19 9h-3M9 15h3M15 15h4M9 19h6M19 19v-3" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Scan Label */}
      <div className="absolute bottom-2 bg-slate-900/90 border border-white/5 rounded-full px-2 py-0.5 text-[9px] font-mono tracking-wider text-slate-400 uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        UPI Scan & Pay
      </div>
    </div>
  );
}

/**
 * 2. Copyable UPI Block
 */
export function CopyableUPIBlock({ upiId = DEFAULT_UPI_ID }: { upiId?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="w-full flex items-center justify-between gap-2 p-1.5 pl-3 rounded-xl bg-slate-950/60 border border-white/10 hover:border-white/15 transition-all">
      <div className="flex flex-col text-left">
        <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500 font-bold leading-none">UPI address</span>
        <span className="text-xs font-mono text-slate-350 select-all font-semibold mt-0.5">{upiId}</span>
      </div>
      <button
        onClick={handleCopy}
        className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer select-none ${
          copied 
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
            : 'bg-indigo-650 hover:bg-indigo-500 text-white border border-indigo-400/20'
        }`}
      >
        {copied ? (
          <>
            <Check size={13} className="animate-scale" />
            <span>Copied</span>
          </>
        ) : (
          <>
            <Copy size={13} />
            <span>Copy</span>
          </>
        )}
      </button>
    </div>
  );
}

/**
 * 3. Global Buy Me a Coffee Slide-over / Modal Overlay
 */
export function BuyMeCoffeeModal({ isOpen, onClose, upiId = DEFAULT_UPI_ID, creatorName = 'Vishwajeet Kalokhe' }: BuyMeCoffeeModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
            className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl shadow-[0_24px_50px_-12px_rgba(0,0,0,0.7)] p-6 z-10 overflow-hidden"
          >
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/5 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <Coffee size={16} className="text-indigo-400" />
                </div>
                <span className="font-semibold text-slate-100 text-sm">Buy Me a Coffee</span>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex flex-col items-center text-center mt-5 space-y-4 relative z-10">
              <div className="w-12 h-12 rounded-full bg-indigo-650/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-md">
                <Heart size={22} className="fill-indigo-550/20 animate-pulse text-indigo-400" />
              </div>

              <div>
                <h3 className="text-base font-bold text-white">Support Vishwajeet</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm font-sans leading-relaxed">
                  If PrepFlow helped you track revision schedules and prepare for interviews, support my journey to keep building open-source projects!
                </p>
              </div>

              {/* QR Container */}
              <div className="py-2">
                <QRDisplayFrame size={180} />
              </div>

              {/* UPI Copy Box */}
              <CopyableUPIBlock upiId={upiId} />

              {/* Support Links */}
              <div className="w-full grid grid-cols-2 gap-2 text-xs pt-1.5">
                <a
                  href={PORTFOLIO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-950/40 border border-white/5 hover:border-indigo-500/30 hover:text-white text-slate-400 font-semibold transition"
                >
                  <span>Creator Portfolio</span>
                  <ExternalLink size={12} />
                </a>
                <button
                  onClick={onClose}
                  className="flex items-center justify-center py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-white/5 text-slate-200 font-semibold transition cursor-pointer"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/**
 * 4. Beautiful Bento-style Landing Page Section
 */
export function BuyMeCoffeeSection({ onOpenModal, upiId = DEFAULT_UPI_ID }: { onOpenModal?: () => void; upiId?: string }) {
  const [showSectionModal, setShowSectionModal] = useState(false);

  return (
    <section className="relative z-10 py-16 px-6 md:px-8 border-t border-white/5 bg-slate-950/20 overflow-hidden">
      {/* Background radial elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto">
        <div className="glass-card rounded-3xl p-6 md:p-10 border border-white/10 bg-slate-900/60 backdrop-blur-md shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center gap-8 md:gap-12">
          
          {/* Accent corners */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/10 to-transparent pointer-events-none" />
          
          {/* Copy Column */}
          <div className="flex-1 text-left space-y-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-300">
              <Coffee size={13} />
              <span>Buy Me a Coffee</span>
            </div>
            
            <h2 className="font-display font-black text-2xl md:text-3xl text-white tracking-tight leading-tight">
              Support the Creator &amp; <br />
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Keep PrepFlow Ad-Free</span>
            </h2>
            
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-sans font-medium">
              Hi, I'm <strong>Vishwajeet Kalokhe</strong>. I built PrepFlow to empower developers with advanced tools to structure, practice, and conquer their technical interviews.
            </p>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-sans">
              The project is free, open-source, and runs entirely without tracking or ads. If this app helped you build confidence and get hired, consider showing some love to support hosting costs and new developer features!
            </p>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <CopyableUPIBlock upiId={upiId} />
              <button
                onClick={() => {
                  if (onOpenModal) {
                    onOpenModal();
                  } else {
                    setShowSectionModal(true);
                  }
                }}
                className="px-5 py-3 rounded-xl bg-indigo-650 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/35 transition flex items-center justify-center gap-2 border border-indigo-400/20 whitespace-nowrap"
              >
                <QrCode size={14} />
                <span>Show QR Code</span>
              </button>
            </div>
          </div>

          {/* QR Scan Column */}
          <div className="shrink-0 flex flex-col items-center justify-center gap-3">
            <QRDisplayFrame size={170} />
            <span className="text-[10px] font-mono text-slate-500">Scan QR to support via UPI</span>
          </div>

        </div>
      </div>

      <BuyMeCoffeeModal
        isOpen={showSectionModal}
        onClose={() => setShowSectionModal(false)}
        upiId={upiId}
      />
    </section>
  );
}
