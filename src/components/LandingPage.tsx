/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * LandingPage.tsx
 * ─────────────────────────────────────────────────────────────────────
 * Premium, immersive landing page for Preparation Tracker.
 * Inspired by Apple, Stripe, Linear, and Vercel design language.
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'motion/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
import {
  Sparkles, Brain, Mic, Hand, BarChart3, BookOpen, Target, TrendingUp,
  Zap, Wifi, WifiOff, Cloud, ChevronDown, ArrowRight, Github,
  ExternalLink, Play, CheckCircle2, Star, Plus, Menu, X,
  Layers, Flame, Award, Calendar, Gamepad2, BookMarked,
  MousePointer2, Volume2, Activity, Clock, Shield, Smartphone,
  Repeat, NotebookPen, Languages, Rocket, LineChart, Trophy, Flag,
  Bell, Briefcase, Cpu, Database
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════════ */

interface LandingPageProps {
  onGetStarted: () => void;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   PARTICLE CANVAS — GPU-accelerated interactive background
   ═══════════════════════════════════════════════════════════════════════════════ */

interface Particle {
  x: number; y: number; vx: number; vy: number;
  radius: number; alpha: number; color: string;
}

function useParticleCanvas(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colors = ['rgba(99,102,241,', 'rgba(168,85,247,', 'rgba(14,165,233,', 'rgba(236,72,153,'];
    const PARTICLE_COUNT = Math.min(80, Math.floor(window.innerWidth / 18));

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Initialize particles
    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 2 + 0.8,
      alpha: Math.random() * 0.5 + 0.15,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    const handleMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouse);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const ps = particlesRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (let i = 0; i < ps.length; i++) {
        const p = ps[i];

        // Mouse attraction
        const dx = mx - p.x;
        const dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) {
          const force = (200 - dist) / 200 * 0.015;
          p.vx += dx * force;
          p.vy += dy * force;
        }

        // Apply velocity with damping
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.x += p.vx;
        p.y += p.vy;

        // Wrap boundaries
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color + p.alpha + ')';
        ctx.fill();

        // Draw connections
        for (let j = i + 1; j < ps.length; j++) {
          const p2 = ps[j];
          const cdx = p.x - p2.x;
          const cdy = p.y - p2.y;
          const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
          if (cdist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(148,163,184,${0.08 * (1 - cdist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouse);
    };
  }, [canvasRef]);
}

/* ═══════════════════════════════════════════════════════════════════════════════
   CUSTOM CURSOR
   ═══════════════════════════════════════════════════════════════════════════════ */

function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    const move = (e: MouseEvent) => {
      target.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', move);

    const over = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('a, button, [role="button"], .lp-interactive')) {
        setHovering(true);
      }
    };
    const out = () => setHovering(false);
    document.addEventListener('mouseover', over);
    document.addEventListener('mouseout', out);

    let raf: number;
    const tick = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.12;
      pos.current.y += (target.current.y - pos.current.y) * 0.12;

      if (cursorRef.current) {
        const s = hovering ? 52 : 20;
        cursorRef.current.style.transform = `translate(${pos.current.x - s / 2}px, ${pos.current.y - s / 2}px)`;
      }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${target.current.x - 2.5}px, ${target.current.y - 2.5}px)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', move);
      document.removeEventListener('mouseover', over);
      document.removeEventListener('mouseout', out);
    };
  }, [hovering]);

  return (
    <>
      <div ref={cursorRef} className={`lp-cursor ${hovering ? 'is-hovering' : ''}`} />
      <div ref={dotRef} className="lp-cursor-dot" />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SCROLL REVEAL HOOK
   ═══════════════════════════════════════════════════════════════════════════════ */

function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.lp-reveal');
    if (!els.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    els.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

/* ═══════════════════════════════════════════════════════════════════════════════
   ANIMATED COUNTER
   ═══════════════════════════════════════════════════════════════════════════════ */

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const duration = 1800;
        const startTime = performance.now();
        const step = (now: number) => {
          const progress = Math.min((now - startTime) / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 4);
          setCount(Math.floor(ease * target));
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        obs.disconnect();
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);

  return <span ref={ref}>{count}{suffix}</span>;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   PROGRESS RING
   ═══════════════════════════════════════════════════════════════════════════════ */

function ProgressRing({ percent, size = 80, stroke = 6, color = '#818cf8' }: {
  percent: number; size?: number; stroke?: number; color?: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const ref = useRef<SVGCircleElement>(null);
  const [offset, setOffset] = useState(circ);

  useEffect(() => {
    const el = ref.current?.closest('svg');
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setOffset(circ - (percent / 100) * circ);
        obs.disconnect();
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [percent, circ]);

  return (
    <svg width={size} height={size} className="lp-ring">
      <circle className="lp-ring__track" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} />
      <circle
        ref={ref} className="lp-ring__fill"
        cx={size / 2} cy={size / 2} r={r}
        strokeWidth={stroke} stroke={color}
        strokeDasharray={circ} strokeDashoffset={offset}
      />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   TILT CARD
   ═══════════════════════════════════════════════════════════════════════════════ */

function TiltCard({ children, className = '' }: { children: React.ReactNode; className?: string; key?: React.Key }) {
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 150, damping: 20 });
  const springY = useSpring(rotateY, { stiffness: 150, damping: 20 });

  const handleMouse = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    rotateX.set((y - rect.height / 2) / rect.height * -12);
    rotateY.set((x - rect.width / 2) / rect.width * 12);
  };
  const reset = () => { rotateX.set(0); rotateY.set(0); };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      style={{ rotateX: springX, rotateY: springY, transformPerspective: 800 }}
      className={`lp-interactive ${className}`}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   FAQ ITEM
   ═══════════════════════════════════════════════════════════════════════════════ */

function FaqItem({ q, a }: { q: string; a: string; key?: React.Key }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lp-faq-item">
      <button
        className="lp-faq-btn" onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span>{q}</span>
        <Plus size={18} className="text-slate-500 flex-shrink-0" />
      </button>
      <div className={`lp-faq-content ${open ? 'is-open' : ''}`}>
        <p className="pb-5 text-sm text-slate-400 leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   DASHBOARD SHOWCASE — GSAP ScrollTrigger Pinned
   ═══════════════════════════════════════════════════════════════════════════════ */

const FLY_CARDS = [
  { icon: Mic, label: 'Mock Session', value: 'Live', color: '#00F0FF', pos: 'left-[-6%] top-[12%]', from: { x: -180, y: -40, r: -12 } },
  { icon: TrendingUp, label: 'Confidence', value: '+38%', color: '#7000FF', pos: 'right-[-4%] top-[8%]', from: { x: 180, y: -30, r: 10 } },
  { icon: Target, label: 'Accuracy', value: '94%', color: '#FF0055', pos: 'left-[-4%] bottom-[16%]', from: { x: -160, y: 60, r: 12 } },
  { icon: Calendar, label: 'Streak', value: '42d', color: '#00F0FF', pos: 'right-[-6%] bottom-[10%]', from: { x: 170, y: 50, r: -10 } },
];

function DashboardShowcase() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const dashRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!wrapRef.current || !dashRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapRef.current,
          start: 'top top',
          end: '+=1400',
          pin: true,
          scrub: 1,
        },
      });

      // Dashboard 3D rotation entrance
      tl.fromTo(
        dashRef.current,
        { rotateX: 28, scale: 0.8, y: 80 },
        { rotateX: 6, scale: 1, y: 0, ease: 'power2.out' },
        0
      );

      // Fly-out stat cards
      const flyEls = gsap.utils.toArray<HTMLElement>('.fly-card');
      flyEls.forEach((el, i) => {
        const data = FLY_CARDS[i]?.from;
        if (!data) return;
        tl.fromTo(
          el,
          { x: data.x, y: data.y, rotate: data.r, opacity: 0 },
          { x: 0, y: 0, rotate: 0, opacity: 1, ease: 'power3.out' },
          0.15 + i * 0.12
        );
      });

      // Bar chart growth
      const barEls = gsap.utils.toArray<HTMLElement>('.bar-grow');
      barEls.forEach((el, i) => {
        tl.fromTo(
          el,
          { scaleY: 0 },
          { scaleY: 1, ease: 'power2.out', transformOrigin: 'bottom' },
          0.4 + i * 0.05
        );
      });
    }, wrapRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={wrapRef}
      className="relative z-10 flex min-h-[100svh] items-center justify-center px-6"
      style={{
        WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 120px, black calc(100% - 120px), transparent)',
        maskImage: 'linear-gradient(to bottom, transparent, black 120px, black calc(100% - 120px), transparent)'
      }}
    >
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7000FF]/20 blur-[120px]" />

      <div className="relative w-full max-w-5xl" style={{ perspective: '1600px' }}>
        <p className="mb-2 text-center text-xs font-bold uppercase tracking-[0.3em] text-[#00F0FF]">
          Command Center
        </p>
        <h2 className="mb-12 text-center font-display text-4xl font-bold tracking-tight text-white md:text-6xl">
          PrepFlow keeps your prep <span className="lp-gradient-text-cyan">alive</span>.
        </h2>

        {/* Dashboard card */}
        <div
          ref={dashRef}
          className="relative mx-auto w-full rounded-[28px] lp-glass-strong p-5 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)] md:p-8"
        >
          {/* Browser dots */}
          <div className="mb-6 flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#FF0055]/70" />
            <span className="h-3 w-3 rounded-full bg-[#00F0FF]/70" />
            <span className="h-3 w-3 rounded-full bg-[#7000FF]/70" />
            <span className="ml-3 font-mono text-xs text-white/40">preparation-tracker / dashboard</span>
          </div>

          {/* Dashboard grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Weekly Readiness bars */}
            <div className="rounded-2xl bg-white/[0.03] p-5">
              <div className="flex items-center gap-2 text-white/50">
                <Activity className="h-4 w-4 text-[#00F0FF]" />
                <span className="text-xs">Weekly readiness</span>
              </div>
              <div className="mt-3 flex h-28 items-end gap-1.5">
                {[45, 62, 38, 78, 90, 55, 96].map((h, i) => (
                  <div
                    key={i}
                    className="bar-grow flex-1 rounded-md bg-gradient-to-t from-[#00F0FF]/40 to-[#00F0FF]"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>

            {/* Skill radar */}
            <div className="rounded-2xl bg-white/[0.03] p-5">
              <div className="flex items-center gap-2 text-white/50">
                <Award className="h-4 w-4 text-[#7000FF]" />
                <span className="text-xs">Skill radar</span>
              </div>
              <div className="mt-3 flex h-28 items-center justify-center">
                <div className="relative h-24 w-24">
                  <div className="absolute inset-0 rounded-full border border-white/10" />
                  <div className="absolute inset-3 rounded-full border border-white/10" />
                  <div className="absolute inset-6 rounded-full border border-white/10" />
                  <div
                    className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#7000FF]/40 to-[#00F0FF]/20 blur-sm"
                    style={{ clipPath: 'polygon(50% 8%, 88% 40%, 72% 88%, 20% 72%, 12% 34%)' }}
                  />
                </div>
              </div>
            </div>

            {/* Today's tasks */}
            <div className="rounded-2xl bg-white/[0.03] p-5">
              <div className="flex items-center gap-2 text-white/50">
                <Target className="h-4 w-4 text-[#FF0055]" />
                <span className="text-xs">Today</span>
              </div>
              <div className="mt-4 space-y-3">
                {['Behavioral drill', 'System design', 'Vocabulary review'].map((t, i) => (
                  <div key={i} className="flex items-center justify-between text-sm text-white/70">
                    <span>{t}</span>
                    <span className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                      <span
                        className="block h-full rounded-full bg-gradient-to-r from-[#00F0FF] to-[#7000FF]"
                        style={{ width: `${70 - i * 18}%` }}
                      />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Flying stat cards */}
        {FLY_CARDS.map((c) => (
          <div
            key={c.label}
            className={`fly-card absolute ${c.pos} hidden w-40 rounded-2xl lp-glass-strong p-4 md:block`}
          >
            <c.icon className="h-5 w-5" style={{ color: c.color }} />
            <div className="mt-3 font-display text-2xl font-bold text-white">{c.value}</div>
            <div className="text-xs text-white/50">{c.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MOCK INTERVIEW SHOWCASE — Auto-cycling chat demo
   ═══════════════════════════════════════════════════════════════════════════════ */

const INTERVIEW_SCRIPT = [
  { role: 'ai', text: 'Tell me about a time you handled conflict on a team.' },
  { role: 'you', text: 'At Stripe, two engineers disagreed on our caching layer...' },
  { role: 'ai', text: 'Great STAR structure. Watch your filler words — 6 \'um\'s detected.' },
];

function MockInterviewShowcase() {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setVisible((v) => (v + 1) % (INTERVIEW_SCRIPT.length + 2)), 1600);
    return () => clearInterval(t);
  }, []);

  return (
    <section id="interview" className="relative z-10 mx-auto w-full max-w-7xl px-6 py-28 md:py-36">
      <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2">
        {/* Left: description */}
        <div className="lp-reveal">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#00F0FF]">AI Mock Interview Coaching</p>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight text-white md:text-6xl">
            Rehearse with an interviewer that <span className="lp-gradient-text-cyan">never sleeps</span>.
          </h2>
          <p className="mt-5 max-w-lg text-base text-white/55">
            PrepFlow's AI Mock Interviewer lets you speak naturally. Our engine transcribes your response, scores clarity, pace and confidence, then coaches you line-by-line using leading AI models (Gemini, Cerebras, and Groq).
          </p>
          <div className="mt-8 flex flex-wrap gap-8">
            <div>
              <div className="font-display text-3xl font-bold text-white">
                <AnimatedCounter target={98} suffix="%" />
              </div>
              <div className="text-xs uppercase tracking-widest text-white/40">Transcription accuracy</div>
            </div>
            <div>
              <div className="font-display text-3xl font-bold text-white">
                <AnimatedCounter target={1200} suffix="+" />
              </div>
              <div className="text-xs uppercase tracking-widest text-white/40">Question bank</div>
            </div>
          </div>
        </div>

        {/* Right: interactive demo */}
        <div className="lp-reveal" style={{ transitionDelay: '150ms' }}>
          <div className="relative rounded-3xl lp-glass-strong p-6 md:p-8">
            {/* Gradient border overlay */}
            <div className="pointer-events-none absolute -inset-px rounded-3xl bg-gradient-to-br from-[#00F0FF]/20 to-transparent opacity-60" />

            <div className="relative">
              {/* Recording header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#FF0055]" /> Recording
                </div>
                <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs text-[#00F0FF]">
                  <Sparkles className="h-3 w-3" /> AI listening
                </div>
              </div>

              {/* Audio waveform */}
              <div className="my-7 flex h-20 items-center justify-center gap-1">
                {[...Array(40)].map((_, i) => (
                  <motion.span
                    key={i}
                    className="w-1 rounded-full bg-gradient-to-t from-[#7000FF] to-[#00F0FF]"
                    animate={{ height: [8, 10 + Math.random() * 52, 8] }}
                    transition={{ duration: 0.7 + Math.random() * 0.6, repeat: Infinity, ease: 'easeInOut', delay: i * 0.02 }}
                  />
                ))}
              </div>

              {/* Chat transcript */}
              <div className="space-y-3">
                {INTERVIEW_SCRIPT.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: visible > i ? 1 : 0.15, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                      m.role === 'ai'
                        ? 'bg-white/[0.04] text-white/80'
                        : 'ml-auto bg-gradient-to-r from-[#00F0FF]/15 to-[#7000FF]/15 text-white'
                    }`}
                  >
                    {m.text}
                  </motion.div>
                ))}
                {visible >= INTERVIEW_SCRIPT.length && (
                  <div className="flex items-center gap-1.5 px-2 text-white/40">
                    {[0, 1, 2].map((d) => (
                      <motion.span
                        key={d}
                        className="h-1.5 w-1.5 rounded-full bg-[#00F0FF]"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: d * 0.2 }}
                      />
                    ))}
                    <span className="ml-1 text-xs">AI scoring your answer</span>
                  </div>
                )}
              </div>

              {/* Live score */}
              <div className="mt-6 flex items-center justify-between rounded-2xl bg-white/[0.03] px-5 py-4">
                <span className="text-xs uppercase tracking-widest text-white/40">Live score</span>
                <span className="font-display text-2xl font-bold lp-gradient-text-cyan">
                  <AnimatedCounter target={87} suffix="/100" />
                </span>
              </div>

              {/* CTA button */}
              <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#00F0FF] to-[#7000FF] py-3 text-sm font-semibold text-[#03040a] lp-interactive">
                <Mic className="h-4 w-4" /> Answer next question
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   GLOW CARD — Hover-reactive border glow
   ═══════════════════════════════════════════════════════════════════════════════ */

function GlowCard({ children, className = '' }: { children: React.ReactNode; className?: string; key?: React.Key }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const handleMouse = (e: React.MouseEvent) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect || !glowRef.current) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    glowRef.current.style.background = `radial-gradient(400px circle at ${x}px ${y}px, rgba(0,240,255,0.08), transparent 60%)`;
  };

  const handleLeave = () => {
    if (glowRef.current) glowRef.current.style.background = 'transparent';
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      className={`relative rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-md transition-colors hover:border-white/[0.12] lp-interactive ${className}`}
    >
      <div ref={glowRef} className="pointer-events-none absolute inset-0 rounded-2xl transition-[background] duration-300" />
      <div className="relative">{children}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   FEATURES GRID — 12-column asymmetric layout
   ═══════════════════════════════════════════════════════════════════════════════ */

const FEATURES_GRID = [
  { icon: Mic, title: 'AI Mock Interview Practice', desc: 'Technical and behavioral study drills and simulations powered by Gemini, Cerebras, and Groq with live spoken response scoring.', span: 'md:col-span-7', accent: '#00F0FF' },
  { icon: Hand, title: 'Hands-Free Gesture Navigation', desc: 'Navigate your study modules and practice flashcard decks hands-free via real-time MediaPipe web-camera hand tracking.', span: 'md:col-span-5', accent: '#FF0055' },
  { icon: Calendar, title: 'Interactive Study Planner & Prep Calendar', desc: 'Map your preparation calendar, design targeted study sessions, and check off granular coding tasks as you make progress.', span: 'md:col-span-5', accent: '#F59E0B' },
  { icon: Layers, title: 'Curated Coding Study Roadmaps', desc: 'Follow structured, linear study guides built for mastering core tech subjects, from System Design to Data Structures.', span: 'md:col-span-7', accent: '#7000FF' },
  { icon: Sparkles, title: 'AI Coding Study Companion', desc: 'An active LLM tutor that recommends revision topics, generates custom practice questions, and clarifies complex topics.', span: 'md:col-span-4', accent: '#00F0FF' },
  { icon: BookMarked, title: 'Technical Subject & Topic Study Hub', desc: 'Organize your tech prep into core subjects and track recall confidence ratings across individual concepts.', span: 'md:col-span-4', accent: '#10B981' },
  { icon: Repeat, title: 'Spaced Repetition Practice Engine', desc: 'SM-2 algorithm calculates optimal intervals for cards, surface-drilling topics right before they slip your mind.', span: 'md:col-span-4', accent: '#7000FF' },
  { icon: Briefcase, title: 'Interview Preparation & Application Tracker', desc: 'Track target companies, active job application stages, interview schedules, and post-interview key takeaways.', span: 'md:col-span-6', accent: '#10B981' },
  { icon: BarChart3, title: 'AI Study Analytics & Telemetry', desc: 'Get feedback on verbal filler words, speaking pace telemetry, radar concept metrics, and diagnostic mock performance charts.', span: 'md:col-span-6', accent: '#FF0055' },
  { icon: NotebookPen, title: 'STAR Behavioral Preparation Constructor', desc: 'Structure impact-driven behavioral stories using Situation-Task-Action-Result, refined dynamically by AI models.', span: 'md:col-span-4', accent: '#7000FF' },
  { icon: Languages, title: 'Tech Vocabulary Study & Practice Drills', desc: 'Master senior engineering vocabulary and tech jargon through targeted contextual drills and usage evaluations.', span: 'md:col-span-4', accent: '#00F0FF' },
  { icon: Trophy, title: 'Study Streaks & Milestones', desc: 'Stay motivated with gamified milestone badges, weekly targets, and persistent streak-tracking indicators.', span: 'md:col-span-4', accent: '#F59E0B' },
];

const FEATURES_BOTTOM = [
  { icon: Cloud, title: 'Offline-First Cloud Sync', desc: 'Your progress is saved locally first for zero-latency response, then automatically backed up to Firebase once online.', accent: '#00F0FF' },
  { icon: BookOpen, title: 'Daily Notes & Mistake Journal', desc: 'Keep an interview diary, write down tech notes, and log mistakes to turn failures into structured knowledge.', accent: '#FF0055' },
  { icon: Bell, title: 'Reminders & Habit Drills', desc: 'Schedule automated local reminders and recurring study habit prompts to keep yourself consistently on track.', accent: '#F59E0B' },
  { icon: Database, title: 'Bulk Data Portability', desc: 'Configure Cerebras, Gemini, or Groq API keys, choose custom themes, and import/export your data in bulk JSON.', accent: '#7000FF' },
];

function FeaturesGrid() {
  return (
    <section id="features" className="relative z-10 mx-auto w-full max-w-7xl px-6 py-28 md:py-36">
      <div className="lp-reveal">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#00F0FF]">PrepFlow (Preparation Tracker)</p>
        <h2 className="mt-4 max-w-3xl font-display text-4xl font-bold tracking-tight text-white md:text-6xl">
          A full preparation stack, <span className="lp-gradient-text-cyan">engineered</span> for outcomes.
        </h2>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-12">
        {FEATURES_GRID.map((f, i) => (
          <div key={f.title} className={`lp-reveal ${f.span}`} style={{ transitionDelay: `${i * 50}ms` }}>
            <GlowCard className="h-full p-7 md:p-9">
              <span
                className="inline-flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ background: `${f.accent}1a`, boxShadow: `0 0 24px ${f.accent}30` }}
              >
                <f.icon className="h-6 w-6" style={{ color: f.accent }} />
              </span>
              <h3 className="mt-6 font-display text-xl font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{f.desc}</p>
            </GlowCard>
          </div>
        ))}

        {/* Bottom row: Offline + Cloud Sync side-by-side */}
        <div className="lp-reveal md:col-span-12" style={{ transitionDelay: '350ms' }}>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES_BOTTOM.map((f) => (
              <GlowCard key={f.title} className="flex items-start gap-5 p-7">
                <span
                  className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                  style={{ background: `${f.accent}1a` }}
                >
                  <f.icon className="h-6 w-6" style={{ color: f.accent }} />
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold text-white">{f.title}</h3>
                  <p className="mt-1 text-sm text-white/55">{f.desc}</p>
                </div>
              </GlowCard>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


const TESTIMONIALS = [
  { name: 'Priya S.', role: 'SDE @ Amazon', text: 'The AI mock interviews completely changed my prep. I practiced speaking every day and cracked 3 interviews in a month.' },
  { name: 'Rahul K.', role: 'Full Stack Dev', text: 'Gesture control is the future. I can scroll through questions hands-free while eating lunch. Mind-blowing.' },
  { name: 'Ananya M.', role: 'CS Student', text: 'The spaced repetition finally made concepts stick. I went from forgetting everything to mastering topics in weeks.' },
  { name: 'Vikram T.', role: 'DevOps Engineer', text: 'The mistake journal is underrated. Logging my failures and reviewing them made me unstoppable in interviews.' },
  { name: 'Sara J.', role: 'Backend Developer', text: 'Beautiful UI, works offline, and the analytics dashboard shows exactly what I need to improve. 10/10.' },
  { name: 'Aditya P.', role: 'ML Engineer', text: 'The STAR story builder helped me structure behavioral answers perfectly. Got selected at my dream company.' },
];

const FAQ_DATA = [
  { q: 'Is Preparation Tracker really free?', a: 'Yes, completely free and open-source under the Apache-2.0 license. No hidden fees, no premium tiers, no ads. Fork it, customize it, deploy it yourself.' },
  { q: 'Do I need to create an account?', a: 'No. The app works entirely offline with local storage. Firebase authentication is optional — only needed if you want cloud sync across devices.' },
  { q: 'How does the AI Mock Interview work?', a: 'It uses the Gemini API to generate interview questions, records your spoken answers via microphone, transcribes them, and evaluates keyword accuracy, filler words, clarity, and depth in real-time.' },
  { q: 'What is the gesture control feature?', a: 'Using MediaPipe\'s hand tracking on your webcam, you can navigate the app hands-free. Swipe to change tabs, pinch to click, and point to scroll — perfect for practicing without touching the keyboard.' },
  { q: 'Can I use this on my phone?', a: 'Yes. The app includes a Capacitor build for Android with native speech-to-text, text-to-speech, and push notification support. The web version is also fully responsive.' },
  { q: 'How does spaced repetition work?', a: 'We implement the SM-2 algorithm which calculates optimal review intervals based on your confidence ratings. Topics you struggle with appear more frequently, while mastered topics fade to longer intervals.' },
  { q: 'How can PrepFlow help me study and practice for coding interviews?', a: 'PrepFlow provides structured coding roadmaps, spaced repetition flashcards for active recall practice, and an AI mock interviewer that transcribes your speech and grades your answers. It is the ultimate workspace to organize your interview preparation.' },
  { q: 'What is the best way to structure my tech interview preparation?', a: 'An effective preparation strategy involves mapping your target subjects, using spaced repetition to practice key concepts daily, tracking mistakes in a mistake journal, and conducting realistic AI mock interviews to practice verbal delivery. PrepFlow bundles all of these tools into a single free workspace.' },
];

const TIMELINE_STEPS = [
  { icon: Flag, week: 'Day 1', title: 'Baseline assessment', desc: 'A diagnostic mock maps your strengths and gaps into a personalized roadmap.', color: '#00F0FF' },
  { icon: Mic, week: 'Week 1', title: 'Daily mock drills', desc: 'Adaptive interviews sharpen behavioral and technical answers with live scoring.', color: '#7000FF' },
  { icon: LineChart, week: 'Week 3', title: 'Data-driven tuning', desc: 'Analytics surface filler words and pacing so you fix what actually matters.', color: '#FF0055' },
  { icon: Rocket, week: 'Week 6', title: 'Peak readiness', desc: 'Spaced repetition locks in stories; confidence scores climb past 90%.', color: '#00F0FF' },
  { icon: Trophy, week: 'Offer day', title: 'You get hired', desc: 'Walk in calm, structured and rehearsed. Sign the offer.', color: '#7000FF' },
];

function Timeline() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current || !trackRef.current) return;

    const ctx = gsap.context(() => {
      const trackEl = trackRef.current!;
      
      gsap.to(trackEl, {
        x: () => -(trackEl.scrollWidth - window.innerWidth),
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: () => `+=${trackEl.scrollWidth - window.innerWidth}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
    }, sectionRef);

    const handleRefresh = () => {
      ScrollTrigger.refresh();
    };

    window.addEventListener('resize', handleRefresh);
    document.fonts?.ready?.then(handleRefresh);

    return () => {
      ctx.revert();
      window.removeEventListener('resize', handleRefresh);
    };
  }, []);

  return (
    <section id="journey" ref={sectionRef} className="relative h-[100svh] overflow-hidden z-10">
      {/* Background glow */}
      <div className="pointer-events-none absolute right-0 top-1/3 h-[400px] w-[400px] rounded-full bg-[#7000FF]/15 blur-[100px]" />
      
      <div ref={trackRef} className="flex h-full items-center gap-10 px-[8vw] will-change-transform">
        {/* Intro Slide */}
        <div className="w-[85vw] shrink-0 sm:w-[65vw] md:w-[36vw] lp-reveal is-visible">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#00F0FF]">The journey</p>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight text-white md:text-6xl">
            From nervous to <span className="lp-gradient-text-cyan">unstoppable</span>.
          </h2>
          <p className="mt-5 text-white/55 text-sm">
            Scroll to walk the preparation path candidates take to land their dream roles.
          </p>
        </div>

        {/* Milestone Steps */}
        {TIMELINE_STEPS.map((s, i) => (
          <div key={i} className="relative w-[85vw] shrink-0 sm:w-[60vw] md:w-[30vw]">
            <div className="mb-6 flex items-center gap-4">
              <span
                className="flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ background: `${s.color}1a`, boxShadow: `0 0 30px ${s.color}30` }}
              >
                <s.icon className="h-6 w-6" style={{ color: s.color }} />
              </span>
              <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${s.color}, transparent)` }} />
            </div>
            
            <div className="rounded-3xl lp-glass p-6 md:p-8">
              <span className="font-mono text-xs uppercase tracking-widest" style={{ color: s.color }}>
                {s.week}
              </span>
              <h3 className="mt-3 font-display text-2xl font-semibold text-white">{s.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/55">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   ANALYTICS SHOWCASE — Deep insights & telemetry metrics
   ═══════════════════════════════════════════════════════════════════════════════ */

function AnalyticsShowcase() {
  const metrics = [
    {
      title: 'Study Hours',
      value: 247,
      suffix: 'h',
      desc: 'Focused study & revision time',
      color: '#00F0FF',
      percent: 82,
      subtext: 'Weekly goal: 20h (108% met)',
    },
    {
      title: 'Topics Mastered',
      value: 34,
      suffix: '/50',
      desc: 'Core topics with >80% accuracy',
      color: '#7000FF',
      percent: 68,
      subtext: 'Next milestone: System Design',
    },
    {
      title: 'Mock Score Avg',
      value: 86,
      suffix: '%',
      desc: 'Gemini feedback readiness rating',
      color: '#FF0055',
      percent: 86,
      subtext: 'Top 5% of candidate baseline',
    },
    {
      title: 'Consistency Streak',
      value: 42,
      suffix: 'd',
      desc: 'Consecutive learning days',
      color: '#00F0FF',
      percent: 95,
      subtext: 'Personal record: 60 days',
    },
  ];

  return (
    <section className="relative z-10 py-28 px-6 md:px-8 bg-gradient-to-b from-transparent to-[#080d20]/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 lp-reveal">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#00F0FF]">Data-Driven Insights</p>
          <h2 className="mt-4 font-display font-bold text-4xl md:text-6xl tracking-tight text-white">
            Know exactly <span className="lp-gradient-text-cyan">where you stand</span>.
          </h2>
          <p className="mt-5 text-white/55 text-base max-w-xl mx-auto">
            Deep analytics quantify your progress. Watch your scores climb as you review cards, polish answers, and simulate drills.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lp-reveal">
          {metrics.map((s) => (
            <GlowCard key={s.title} className="p-6 md:p-8 flex flex-col justify-between h-full hover:-translate-y-1 transition-transform duration-300">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">{s.title}</span>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color, boxShadow: `0 0 10px ${s.color}` }} />
                </div>
                
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl md:text-5xl font-black tracking-tight text-white">
                    <AnimatedCounter target={s.value} />
                  </span>
                  <span className="text-2xl font-bold text-white/60">{s.suffix}</span>
                </div>
                
                <p className="mt-2 text-xs text-white/55 leading-relaxed">{s.desc}</p>
              </div>

              <div className="mt-8 pt-6 border-t border-white/[0.04]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-white/40 font-medium">{s.subtext}</span>
                  <span className="text-[10px] font-bold" style={{ color: s.color }}>{s.percent}%</span>
                </div>
                <div className="h-1 w-full bg-white/[0.06] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${s.percent}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${s.color}, #00F0FF)`
                    }}
                  />
                </div>
              </div>
            </GlowCard>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════════ */

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const lastScrollY = useRef(0);

  useParticleCanvas(canvasRef);
  useScrollReveal();

  // Navbar auto-hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setNavVisible(y < 80 || y < lastScrollY.current);
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#060918] text-white overflow-x-hidden" style={{ cursor: 'none' }}>
      <CustomCursor />

      {/* Aurora Background */}
      <div className="lp-aurora">
        <div className="lp-aurora__orb lp-aurora__orb--1" />
        <div className="lp-aurora__orb lp-aurora__orb--2" />
        <div className="lp-aurora__orb lp-aurora__orb--3" />
      </div>

      {/* Noise Overlay */}
      <div className="lp-noise" />

      {/* Particle Canvas */}
      <canvas ref={canvasRef} className="fixed inset-0 z-[2] pointer-events-none" />

      {/* ─── NAVBAR ─────────────────────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: 0 }}
        animate={{ y: navVisible ? 0 : -100 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 inset-x-0 z-50"
      >
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="lp-glass-strong flex items-center justify-between px-6 py-3">
            {/* Logo & Creator Badge */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <Sparkles size={18} className="text-white" />
                </div>
                <span className="font-bold text-[15px] tracking-tight">PrepFlow</span>
              </div>
              <a
                href="https://vishwajeetkalokhe-dev-portfolio.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/30 transition-all duration-300 group lp-interactive text-[11px] font-semibold text-indigo-300 hover:text-white"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>by Vishwajeet</span>
              </a>
            </div>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
              <a href="#features" className="hover:text-white transition-colors lp-interactive">Features</a>
              <a href="#journey" className="hover:text-white transition-colors lp-interactive">Journey</a>
              <a href="#faq" className="hover:text-white transition-colors lp-interactive">FAQ</a>
            </div>

            {/* CTAs */}
            <div className="hidden md:flex items-center gap-3">
              <a
                href="https://github.com/Vishwajeet8401/prepration-tracking"
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:text-white border border-white/10 hover:border-white/20 transition lp-interactive"
              >
                <Github size={16} />
                <span>GitHub</span>
              </a>
              <button
                onClick={onGetStarted}
                className="lp-btn-primary !py-2.5 !px-5 !text-[13px] lp-interactive"
              >
                Launch Dashboard
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-white/10 rounded-xl transition"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden mx-6 overflow-hidden"
            >
              <div className="lp-glass p-5 flex flex-col gap-3 mt-2">
                <a href="#features" className="text-sm text-slate-300 hover:text-white py-2" onClick={() => setMobileMenuOpen(false)}>Features</a>
                <a href="#journey" className="text-sm text-slate-300 hover:text-white py-2" onClick={() => setMobileMenuOpen(false)}>Journey</a>
                <a href="#faq" className="text-sm text-slate-300 hover:text-white py-2" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
                <hr className="border-white/10" />
                <button onClick={onGetStarted} className="lp-btn-primary w-full justify-center !text-sm">
                  Launch Dashboard <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ─── HERO ───────────────────────────────────────────────────────────── */}
      <section className="relative z-10 pt-36 pb-20 px-6 md:px-8 min-h-screen flex flex-col items-center justify-center text-center overflow-hidden">
        {/* Interactive Grid Background */}
        <div className="absolute inset-0 lp-grid-bg pointer-events-none z-0" />

        {/* Floating Award Winning Panels (Desktop only) */}
        <div className="absolute inset-0 pointer-events-none hidden xl:block select-none z-10">
          {/* Panel 1: Mock Simulator telemetry */}
          <div className="absolute left-[5%] top-[24%] w-68 lp-glass p-5 text-left lp-float-1 border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#00F0FF] font-black">AI Mock Simulator</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#10B981]" />
            </div>
            <div className="space-y-2 text-xs">
              <div className="text-white font-semibold flex justify-between">
                <span>Rate Limiter (System Design)</span>
              </div>
              <div className="text-slate-400 flex justify-between text-[11px]">
                <span>Speaking Pace</span>
                <span className="text-[#00F0FF] font-mono">120 WPM</span>
              </div>
              <div className="text-slate-400 flex justify-between text-[11px] mt-0.5">
                <span>Filler Words (um/uh)</span>
                <span className="text-emerald-400 font-mono">0 detected</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 w-[95%]" />
              </div>
            </div>
          </div>

          {/* Panel 2: Spaced Revisions */}
          <div className="absolute right-[5%] top-[26%] w-60 lp-glass p-5 text-left lp-float-2 border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#FF0055] font-black">Spaced Revisions</span>
              <span className="text-[9px] bg-pink-500/20 text-pink-400 font-bold px-1.5 py-0.5 rounded font-mono">SM-2 Engine</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Collections Framework</span>
                <span className="text-pink-400 font-black font-mono">Overdue</span>
              </div>
              <div className="text-[10px] text-slate-500 leading-normal border-t border-white/5 pt-2 mt-1">
                Next up: JVM memory models, G1GC, and concurrent collections.
              </div>
            </div>
          </div>

          {/* Panel 3: Prep Readiness */}
          <div className="absolute left-[6%] bottom-[18%] w-56 lp-glass p-5 text-left lp-float-2 border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#7000FF] font-black">Prep Readiness</span>
              <span className="text-emerald-400 font-bold font-mono text-[10px]">+8.4% this wk</span>
            </div>
            <div className="text-3xl font-black text-white font-display tracking-tight leading-none mb-1">82.4%</div>
            <span className="text-[10px] text-slate-500">Java Core & Streams verified ready</span>
          </div>

          {/* Panel 4: Achievements */}
          <div className="absolute right-[6%] bottom-[16%] w-64 lp-glass p-5 text-left lp-float-1 border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-2 mb-2.5">
              <Award size={15} className="text-amber-400 animate-bounce" />
              <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-black">My Achievements</span>
            </div>
            <div className="text-xs text-white font-bold leading-normal">Active Streak: 7 Days</div>
            <div className="text-[10px] text-slate-400 mt-1 leading-normal">
              Mock simulator and flashcards practice targets successfully met.
            </div>
          </div>
        </div>
        {/* Dynamic Premium Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="relative inline-flex items-center gap-2.5 px-4.5 py-2.5 rounded-full border border-indigo-500/30 bg-indigo-950/40 text-indigo-300 text-[11px] font-semibold tracking-wider uppercase mb-8 shadow-[0_0_30px_rgba(99,102,241,0.15)] lp-interactive group overflow-hidden"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out" />
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          <span className="text-slate-300 font-mono">v1.0.0 released</span>
          <span className="h-3 w-px bg-indigo-500/30" />
          <span className="text-indigo-400 flex items-center gap-1">
            <Sparkles size={11} className="animate-pulse" /> Free & Open Source
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="font-display font-black text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight leading-[0.9] max-w-6xl text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-slate-500/80 drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)]"
        >
          Master Your
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-[#7000FF] to-[#FF0055] animate-gradient bg-[length:200%_auto] filter drop-shadow-[0_0_30px_rgba(0,240,255,0.2)]">
            Tech Interviews,
          </span>
          <br />
          AI-Powered.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.7 }}
          className="mt-8 text-base md:text-xl text-slate-400 max-w-3xl leading-relaxed font-sans"
        >
          PrepFlow is the ultimate free study, practice, and preparation tracker for software engineering interviews. Build daily coding habits, track study topics with spaced repetition, and practice with our interactive AI mock interviewer.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.7 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-5 relative z-10"
        >
          {/* Primary CTA with extra glow */}
          <div className="relative group">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#00F0FF] via-[#7000FF] to-[#FF0055] opacity-50 blur-lg group-hover:opacity-85 transition-opacity duration-300" />
            <button
              onClick={onGetStarted}
              className="relative lp-btn-primary !px-9 !py-4.5 !text-[16px] lp-interactive flex items-center gap-2.5 rounded-2xl cursor-pointer"
            >
              <Play size={18} fill="white" className="text-white" />
              <span>Enter Workspace — Free</span>
            </button>
          </div>

          {/* Secondary CTA */}
          <a
            href="https://github.com/Vishwajeet8401/prepration-tracking"
            target="_blank" rel="noopener noreferrer"
            className="lp-btn-ghost !px-9 !py-4.5 !text-[16px] lp-interactive flex items-center gap-2.5 rounded-2xl hover:bg-white/10"
          >
            <Github size={18} />
            <span>Star on GitHub</span>
          </a>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.7 }}
          className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto w-full"
        >
          {[
            { label: 'Smart Prep Modules', value: 16, icon: Layers, color: '#00F0FF', desc: 'Covering calendar, planner & story building' },
            { label: 'Active LLM Models', value: 3, icon: Sparkles, color: '#7000FF', desc: 'Gemini, Cerebras, and Groq engines' },
            { label: 'Interactive Topics', value: 500, suffix: '+', icon: Target, color: '#FF0055', desc: 'Concepts tracked with confidence rating' },
          ].map((s) => (
            <div
              key={s.label}
              className="lp-glass p-6 flex flex-col items-center text-center relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.2)] lp-interactive"
            >
              {/* Card accent glow */}
              <div
                className="absolute -right-6 -bottom-6 w-20 h-20 rounded-full blur-2xl opacity-15 group-hover:opacity-30 transition-opacity duration-300"
                style={{ backgroundColor: s.color }}
              />
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl mb-4"
                style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}
              >
                <s.icon className="h-5 w-5" style={{ color: s.color }} />
              </span>
              <span className="text-3xl font-black text-white font-display tracking-tight flex items-center justify-center">
                <AnimatedCounter target={s.value} suffix={s.suffix} />
              </span>
              <span className="text-sm font-semibold text-slate-200 mt-2">{s.label}</span>
              <span className="text-[11px] text-slate-500 mt-1 max-w-[200px] leading-normal">{s.desc}</span>
            </div>
          ))}
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 lp-scroll-indicator"
        >
          <ChevronDown size={24} className="text-slate-500" />
        </motion.div>
      </section>

      {/* ─── DASHBOARD SHOWCASE — GSAP ScrollTrigger Pinned ──────────────── */}
      <DashboardShowcase />

      {/* ─── FEATURES GRID ──────────────────────────────────────────────────── */}
      <FeaturesGrid />

      {/* ─── AI MOCK INTERVIEW SHOWCASE ─────────────────────────────────────── */}
      <MockInterviewShowcase />

      {/* ─── GESTURE CONTROL SHOWCASE ───────────────────────────────────────── */}
      <section className="relative z-10 py-28 px-6 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            {/* Left: Hand tracking visual */}
            <div className="lp-reveal order-2 lg:order-1">
              <TiltCard className="lp-glass p-8 flex items-center justify-center relative overflow-hidden">
                {/* Simulated hand skeleton */}
                <svg viewBox="0 0 300 300" className="w-full max-w-xs" style={{ filter: 'drop-shadow(0 0 20px rgba(167,139,250,0.3))' }}>
                  {/* Palm connections */}
                  {[
                    [150, 250, 150, 180], [150, 180, 100, 130], [150, 180, 130, 110],
                    [150, 180, 160, 100], [150, 180, 185, 115], [150, 180, 200, 140],
                    [100, 130, 80, 80], [130, 110, 120, 60], [160, 100, 155, 45],
                    [185, 115, 190, 70], [200, 140, 220, 105],
                    [80, 80, 65, 45], [120, 60, 115, 25], [155, 45, 150, 10],
                    [190, 70, 195, 35], [220, 105, 235, 75],
                  ].map(([x1, y1, x2, y2], i) => (
                    <motion.line
                      key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke="rgba(167,139,250,0.6)" strokeWidth="2" strokeLinecap="round"
                      initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }}
                      transition={{ duration: 0.6, delay: i * 0.05 }}
                    />
                  ))}
                  {/* Joint dots */}
                  {[
                    [150, 250], [150, 180], [100, 130], [130, 110], [160, 100],
                    [185, 115], [200, 140], [80, 80], [120, 60], [155, 45],
                    [190, 70], [220, 105], [65, 45], [115, 25], [150, 10],
                    [195, 35], [235, 75],
                  ].map(([cx, cy], i) => (
                    <motion.circle
                      key={i} cx={cx} cy={cy} r="5"
                      fill="rgba(167,139,250,0.8)" stroke="rgba(167,139,250,0.4)" strokeWidth="2"
                      initial={{ scale: 0 }} whileInView={{ scale: 1 }}
                      transition={{ type: 'spring', delay: i * 0.04 }}
                    />
                  ))}
                  {/* Index fingertip glow */}
                  <motion.circle
                    cx="150" cy="10" r="12" fill="none"
                    stroke="rgba(167,139,250,0.5)" strokeWidth="2"
                    animate={{ r: [12, 18, 12], opacity: [0.5, 0.2, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </svg>

                {/* Gesture labels */}
                <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-2">
                  {['👆 Point', '🤏 Pinch', '🖐️ Open', '✊ Fist'].map((g) => (
                    <span key={g} className="text-[10px] px-2 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 font-semibold">
                      {g}
                    </span>
                  ))}
                </div>
              </TiltCard>
            </div>

            {/* Right: Description */}
            <div className="lp-reveal order-1 lg:order-2">
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-violet-400">Futuristic Gesture Control</span>
              <h2 className="mt-4 font-display font-black text-3xl md:text-4xl tracking-tight">
                <span className="text-white">Navigate with</span>
                <br />
                <span className="lp-gradient-text">Your Hands.</span>
              </h2>
              <p className="mt-5 text-slate-400 text-base leading-relaxed">
                PrepFlow supports webcam gesture control powered by MediaPipe's real-time hand tracking. Swipe through questions, reveal hints, and scroll pages — all by waving your hand in the air. No keyboard. No mouse. Just your gestures.
              </p>
              <div className="mt-8 space-y-3">
                {[
                  { gesture: 'Swipe Left/Right', action: 'Switch tabs & questions' },
                  { gesture: 'Pinch', action: 'Click buttons & select options' },
                  { gesture: 'Point & Move', action: 'Control the cursor' },
                  { gesture: 'Open Hand', action: 'Scroll through content' },
                ].map((g) => (
                  <div key={g.gesture} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 size={14} className="text-violet-400 flex-shrink-0" />
                    <span className="text-slate-300 font-medium">{g.gesture}</span>
                    <span className="text-slate-600">→</span>
                    <span className="text-slate-400">{g.action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── ANALYTICS SECTION ──────────────────────────────────────────────── */}
      <AnalyticsShowcase />

      {/* ─── PREPARATION JOURNEY TIMELINE ───────────────────────────────────── */}
      <Timeline />



      {/* ─── TESTIMONIALS MARQUEE ───────────────────────────────────────────── */}
      <section className="relative z-10 py-28 overflow-hidden">
        <div className="text-center mb-12 px-6 lp-reveal">
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-pink-400">Community</span>
          <h2 className="mt-4 font-display font-black text-3xl md:text-4xl tracking-tight text-white">
            Loved by Developers
          </h2>
        </div>

        <div className="lp-marquee">
          <div className="lp-marquee__track">
            {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
              <div key={i} className="lp-glass p-6 w-[340px] flex-shrink-0 lp-interactive">
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} size={12} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-300 leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{t.name}</div>
                    <div className="text-[10px] text-slate-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ────────────────────────────────────────────────────────────── */}
      <section id="faq" className="relative z-10 py-28 px-6 md:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12 lp-reveal">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">FAQ</span>
            <h2 className="mt-4 font-display font-black text-3xl md:text-4xl tracking-tight text-white">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="lp-reveal">
            {FAQ_DATA.map((f) => (
              <FaqItem key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ──────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-28 px-6 md:px-8">
        <div className="max-w-4xl mx-auto text-center lp-reveal">
          <h2 className="font-display font-black text-4xl md:text-6xl tracking-tight leading-[0.95]">
            <span className="text-white">Ready to</span>
            <br />
            <span className="lp-gradient-text">Crack Your Next Interview?</span>
          </h2>
          <p className="mt-6 text-slate-400 text-base max-w-xl mx-auto">
            Join thousands of developers who transformed their interview prep. 
            Free forever. No strings attached.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button onClick={onGetStarted} className="lp-btn-primary lp-interactive text-base px-8 py-4">
              <Sparkles size={18} />
              Start Preparing Now
            </button>
            <a
              href="https://github.com/Vishwajeet8401/prepration-tracking"
              target="_blank" rel="noopener noreferrer"
              className="lp-btn-ghost lp-interactive text-base"
            >
              <Github size={18} />
              View Source Code
            </a>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/5 py-8 px-6 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-indigo-400" />
            <span className="text-sm text-slate-500">
              PrepFlow — Open Source & Free. Created with ❤️ by{' '}
              <a
                href="https://vishwajeetkalokhe-dev-portfolio.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-indigo-400 font-medium transition duration-300 underline underline-offset-4 decoration-white/10 hover:decoration-indigo-400/50 lp-interactive"
              >
                Vishwajeet Kalokhe
              </a>
            </span>
          </div>
          <div className="flex items-center gap-6 text-xs text-slate-600">
            <a href="https://github.com/Vishwajeet8401/prepration-tracking" target="_blank" rel="noopener noreferrer" className="hover:text-white transition lp-interactive">GitHub</a>
            <a href="https://tracking-prep.web.app" target="_blank" rel="noopener noreferrer" className="hover:text-white transition lp-interactive">Live App</a>
            <a href="https://vishwajeetkalokhe-dev-portfolio.vercel.app/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition lp-interactive">Portfolio</a>
            <span>Apache-2.0 License</span>
          </div>
        </div>
      </footer>

      {/* ─── FLOATING CREATOR BADGE ─────────────────────────────────────────── */}
      <div className="fixed bottom-6 left-6 z-50">
        <a
          href="https://vishwajeetkalokhe-dev-portfolio.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 hover:border-indigo-500/50 shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-300 hover:shadow-[0_8px_32px_rgba(99,102,241,0.2)] group lp-interactive text-xs font-semibold text-slate-300 hover:text-white"
        >
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black text-[10px]">
            V
          </span>
          <span className="max-w-0 overflow-hidden group-hover:max-w-[120px] transition-all duration-500 ease-in-out whitespace-nowrap">
            Meet the Creator
          </span>
          <span className="text-indigo-400 group-hover:translate-x-0.5 transition-transform duration-300">
            ⚡ Portfolio
          </span>
        </a>
      </div>
    </div>
  );
}
