/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * CameraGestureWidget.tsx
 * ─────────────────────────────────────────────────────────────────────
 * Premium floating glassmorphism HUD for the AI gesture controller.
 * Features:
 *   • Draggable position
 *   • Collapsible / expandable
 *   • Live camera feed + hand skeleton overlay
 *   • Air cursor that follows the index finger
 *   • Directional arrows that pulse on gesture
 *   • Calibration wizard
 *   • Sensitivity slider
 *   • Gesture event log (last 5)
 *   • Settings panel
 */

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Camera, CameraOff, Hand, Move, Settings, Target,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  MousePointer2, Maximize2, Minimize2, X, Zap,
} from 'lucide-react';
import { useGestureContext } from '../context/GestureContext';

// ─── Gesture label map ────────────────────────────────────────────────────────

const GESTURE_LABELS: Record<string, string> = {
  NONE:        '—',
  POINT:       '👆 Point',
  PINCH:       '🤏 Click',
  PINCH_HOLD:  '🤌 Drag',
  OPEN_HAND:   '🖐️ Open',
  FIST:        '✊ Fist',
  TWO_FINGERS: '✌️ Two Fingers',
  THUMB_UP:    '👍 Thumb Up',
  SWIPE_LEFT:  '⬅️ Swipe Left',
  SWIPE_RIGHT: '➡️ Swipe Right',
  SWIPE_UP:    '⬆️ Swipe Up',
  SWIPE_DOWN:  '⬇️ Swipe Down',
};

const GESTURE_COLORS: Record<string, string> = {
  PINCH:       '#fb923c',
  PINCH_HOLD:  '#f97316',
  SWIPE_LEFT:  '#60a5fa',
  SWIPE_RIGHT: '#60a5fa',
  SWIPE_UP:    '#4ade80',
  SWIPE_DOWN:  '#4ade80',
  THUMB_UP:    '#a78bfa',
  FIST:        '#f472b6',
  OPEN_HAND:   '#34d399',
  POINT:       '#60a5fa',
  TWO_FINGERS: '#818cf8',
  NONE:        '#475569',
};

// ─── Calibration overlay ──────────────────────────────────────────────────────

interface CalibrationOverlayProps {
  onFinish: () => void;
  onCancel: () => void;
}

function CalibrationOverlay({ onFinish, onCancel }: CalibrationOverlayProps) {
  const [count, setCount] = useState(3);
  const { calibrate } = useGestureContext();

  useEffect(() => {
    if (count <= 0) {
      calibrate();
      onFinish();
      return;
    }
    const t = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count, calibrate, onFinish]);

  return (
    <div className="gesture-calibration-overlay">
      <div className="gesture-cal-icon">🎯</div>
      <h3>Calibrating…</h3>
      <p>Hold your index finger in the <strong>center</strong> of the camera frame</p>
      <div className="gesture-cal-countdown">{count}</div>
      <button className="gesture-cal-cancel" onClick={onCancel}>Cancel</button>
    </div>
  );
}

// ─── Main Widget ─────────────────────────────────────────────────────────────

export default function CameraGestureWidget() {
  const {
    state,
    lastEvent,
    cursorPos,
    isPinching,
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    updateSettings,
  } = useGestureContext();

  const { settings, camera, detection, isModelReady } = state;

  // ── widget UI state ────────────────────────────────────────────────────────
  const [collapsed, setCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCalibration, setShowCalibration] = useState(false);
  const [gestureLog, setGestureLog] = useState<string[]>([]);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  useEffect(() => {
    if (!lastEvent || lastEvent.gesture !== 'PINCH') return;
    const rippleId = Date.now() + Math.random();
    setRipples(prev => [...prev, { id: rippleId, x: cursorPos.x, y: cursorPos.y }]);
    const t = setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== rippleId));
    }, 600);
    return () => clearTimeout(t);
  }, [lastEvent, cursorPos]);

  const getDynamicGlow = () => {
    if (!camera.active || detection.gesture === 'NONE') return {};
    const colors: Record<string, string> = {
      PINCH: 'rgba(251, 146, 60, 0.45)',
      PINCH_HOLD: 'rgba(251, 146, 60, 0.35)',
      SWIPE_LEFT: 'rgba(96, 165, 250, 0.45)',
      SWIPE_RIGHT: 'rgba(96, 165, 250, 0.45)',
      THUMB_UP: 'rgba(74, 222, 128, 0.45)',
      FIST: 'rgba(239, 68, 68, 0.45)',
      OPEN_HAND: 'rgba(167, 139, 250, 0.45)',
    };
    const glowColor = colors[detection.gesture];
    if (!glowColor) return {};
    return {
      borderColor: glowColor,
      boxShadow: `0 24px 60px rgba(0, 0, 0, 0.6), 0 0 16px 2px ${glowColor}`,
      transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    };
  };

  // ── dragging ───────────────────────────────────────────────────────────────
  const widgetRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const [pos, setPos] = useState({ x: window.innerWidth - 300, y: window.innerHeight - 480 });

  const onDragStart = useCallback((e: React.MouseEvent) => {
    if (!widgetRef.current) return;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
    };
    e.preventDefault();
  }, [pos]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (!widgetRef.current) return;
    const touch = e.touches[0];
    dragRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      origX: pos.x,
      origY: pos.y,
    };
    e.stopPropagation();
  }, [pos]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 280, dragRef.current.origX + dx)),
        y: Math.max(0, Math.min(window.innerHeight - 100, dragRef.current.origY + dy)),
      });
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!dragRef.current) return;
      const touch = e.touches[0];
      const dx = touch.clientX - dragRef.current.startX;
      const dy = touch.clientY - dragRef.current.startY;
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 280, dragRef.current.origX + dx)),
        y: Math.max(0, Math.min(window.innerHeight - 100, dragRef.current.origY + dy)),
      });
    };
    const onMouseUp = () => { dragRef.current = null; };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onMouseUp);
    };
  }, []);

  // ── gesture log ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!lastEvent || lastEvent.gesture === 'NONE') return;
    const label = GESTURE_LABELS[lastEvent.gesture] ?? lastEvent.gesture;
    setGestureLog(prev => [label, ...prev].slice(0, 5));
  }, [lastEvent]);

  // ── sync video element to canvas shown in widget ───────────────────────────
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // sync src stream and canvas data from global refs to local display refs
  useEffect(() => {
    if (!camera.active) return;

    let frameId: number;
    const syncCanvas = () => {
      const src = canvasRef.current;
      const dst = localCanvasRef.current;
      if (src && dst) {
        dst.width = src.width;
        dst.height = src.height;
        const ctx = dst.getContext('2d');
        if (ctx) ctx.drawImage(src, 0, 0);
      }
      frameId = requestAnimationFrame(syncCanvas);
    };
    syncCanvas();
    return () => cancelAnimationFrame(frameId);
  }, [camera.active, canvasRef]);

  useEffect(() => {
    if (!camera.active) return;
    const srcVideo = videoRef.current;
    const dstVideo = localVideoRef.current;
    if (srcVideo && dstVideo && srcVideo.srcObject) {
      dstVideo.srcObject = srcVideo.srcObject;
      dstVideo.play().catch(() => {});
    }
  }, [camera.active, videoRef]);

  // ── gesture direction arrows ───────────────────────────────────────────────
  const gesture = detection.gesture;
  const arrowActive = (dir: string) => {
    if (dir === 'left')  return gesture === 'SWIPE_LEFT';
    if (dir === 'right') return gesture === 'SWIPE_RIGHT';
    if (dir === 'up')    return gesture === 'SWIPE_UP';
    if (dir === 'down')  return gesture === 'SWIPE_DOWN';
    return false;
  };

  const currentColor = GESTURE_COLORS[gesture] ?? '#475569';

  // ── toggle camera ──────────────────────────────────────────────────────────
  const handleToggle = () => {
    if (camera.active) stopCamera();
    else startCamera();
  };

  // ── status label ──────────────────────────────────────────────────────────
  const statusLabel = !isModelReady
    ? 'Loading model…'
    : camera.active
    ? 'Live'
    : 'Paused';

  return (
    <>
      {/* ── Air Cursor ─────────────────────────────────────────────────── */}
      {camera.active && (
        <div
          className={`gesture-air-cursor ${isPinching ? 'gesture-air-cursor--pinch' : ''}`}
          style={{
            left: `${cursorPos.x * window.innerWidth}px`,
            top:  `${cursorPos.y * window.innerHeight}px`,
          }}
        />
      )}

      {/* Ripple visual clicks */}
      {camera.active && ripples.map(r => (
        <div
          key={r.id}
          className="gesture-air-cursor-ripple"
          style={{
            left: `${r.x * window.innerWidth}px`,
            top:  `${r.y * window.innerHeight}px`,
          }}
        />
      ))}

      {/* ── Widget ─────────────────────────────────────────────────────── */}
      <div
        ref={widgetRef}
        className="gesture-widget"
        style={{ left: pos.x, top: pos.y, ...getDynamicGlow() }}
      >
        <div className="gesture-widget__header" onMouseDown={onDragStart} onTouchStart={onTouchStart}>
          <div className="gesture-widget__title">
            <Hand size={14} className="gesture-widget__icon" />
            <span>Gesture Control</span>
            <span
              className="gesture-widget__badge"
              style={{ color: camera.active ? '#4ade80' : '#64748b' }}
            >
              {statusLabel}
            </span>
          </div>
          <div className="gesture-widget__header-actions">
            <button
              className="gesture-widget__icon-btn"
              onClick={() => setShowSettings(s => !s)}
              title="Settings"
            >
              <Settings size={12} />
            </button>
            <button
              className="gesture-widget__icon-btn"
              onClick={() => setCollapsed(c => !c)}
              title={collapsed ? 'Expand' : 'Collapse'}
            >
              {collapsed ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
            </button>
          </div>
        </div>

        {!collapsed && (
          <>
            {/* Calibration overlay */}
            {showCalibration && (
              <CalibrationOverlay
                onFinish={() => setShowCalibration(false)}
                onCancel={() => setShowCalibration(false)}
              />
            )}

            {/* Settings panel */}
            {showSettings ? (
              <div className="gesture-widget__settings">
                <label className="gesture-setting-label">
                  Sensitivity
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={settings.sensitivity}
                    onChange={e => updateSettings({ sensitivity: parseFloat(e.target.value) })}
                  />
                  <span>{settings.sensitivity.toFixed(1)}×</span>
                </label>
                <p className="gesture-setting-hint">
                  Active Tabs: {settings.activeTabs.length} configured
                </p>
              </div>
            ) : (
              <>
                {/* Camera feed */}
                <div className="gesture-widget__video-box">
                  {camera.active ? (
                    <>
                      <video
                        ref={localVideoRef}
                        className="gesture-widget__video"
                        playsInline
                        muted
                      />
                      <canvas
                        ref={localCanvasRef}
                        className="gesture-widget__canvas"
                      />
                    </>
                  ) : (
                    <div className="gesture-widget__placeholder">
                      <CameraOff size={28} style={{ opacity: 0.4 }} />
                      <span>{isModelReady ? 'Camera off' : 'Loading AI model…'}</span>
                    </div>
                  )}

                  {/* Direction arrows overlay */}
                  {camera.active && (
                    <div className="gesture-arrows">
                      <ChevronUp
                        className={`gesture-arrow gesture-arrow--up ${arrowActive('up') ? 'gesture-arrow--active' : ''}`}
                      />
                      <ChevronDown
                        className={`gesture-arrow gesture-arrow--down ${arrowActive('down') ? 'gesture-arrow--active' : ''}`}
                      />
                      <ChevronLeft
                        className={`gesture-arrow gesture-arrow--left ${arrowActive('left') ? 'gesture-arrow--active' : ''}`}
                      />
                      <ChevronRight
                        className={`gesture-arrow gesture-arrow--right ${arrowActive('right') ? 'gesture-arrow--active' : ''}`}
                      />
                    </div>
                  )}
                </div>

                {/* Current gesture status */}
                <div className="gesture-widget__status" style={{ '--gesture-color': currentColor } as React.CSSProperties}>
                  <MousePointer2 size={13} style={{ color: currentColor }} />
                  <span className="gesture-widget__gesture-label" style={{ color: currentColor }}>
                    {GESTURE_LABELS[gesture] ?? gesture}
                  </span>
                  {detection.confidence > 0 && (
                    <span className="gesture-widget__conf">
                      {Math.round(detection.confidence * 100)}%
                    </span>
                  )}
                </div>

                {/* Gesture log */}
                {gestureLog.length > 0 && (
                  <div className="gesture-widget__log">
                    {gestureLog.map((g, i) => (
                      <span key={i} className="gesture-widget__log-item" style={{ opacity: 1 - i * 0.18 }}>
                        {g}
                      </span>
                    ))}
                  </div>
                )}

                {/* Gesture cheat-sheet */}
                <div className="gesture-widget__legend">
                  <span>👆 Point</span><span>→ Cursor</span>
                  <span>🤏 Pinch</span><span>→ Click</span>
                  <span>🤌 Hold</span><span>→ Drag</span>
                  <span>👍 Thumb</span><span>→ Confirm</span>
                  <span>✊ Fist</span><span>→ Menu</span>
                  <span>← → Swipe</span><span>→ Tab nav</span>
                  <span>↑ ↓ Swipe</span><span>→ Scroll</span>
                </div>
              </>
            )}

            {/* Control buttons */}
            <div className="gesture-widget__controls">
              <button
                className={`gesture-widget__btn ${camera.active ? 'gesture-widget__btn--danger' : 'gesture-widget__btn--primary'}`}
                onClick={handleToggle}
                disabled={!isModelReady}
              >
                {camera.active ? (
                  <><CameraOff size={13} /> Stop</>
                ) : (
                  <><Camera size={13} /> Start</>
                )}
              </button>
              <button
                className="gesture-widget__btn"
                onClick={() => setShowCalibration(true)}
                disabled={!camera.active}
              >
                <Target size={13} /> Calibrate
              </button>
            </div>

            {camera.error && (
              <p className="gesture-widget__error">{camera.error}</p>
            )}
          </>
        )}
      </div>
    </>
  );
}
