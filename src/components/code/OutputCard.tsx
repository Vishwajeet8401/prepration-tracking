import React from 'react';

interface OutputCardProps {
  label: string;
  value: string;
  status?: 'success' | 'error' | 'warning' | 'info';
}

export default function OutputCard({ label, value, status = 'info' }: OutputCardProps) {
  const styles = {
    success: 'border-emerald-500/25 bg-emerald-500/5 text-emerald-300',
    error: 'border-rose-500/25 bg-rose-500/5 text-rose-300',
    warning: 'border-amber-500/25 bg-amber-500/5 text-amber-300',
    info: 'border-slate-800 bg-[#111827] text-slate-200',
  }[status];

  return (
    <div className="space-y-1">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
      <pre className={`rounded-xl p-3 border font-mono text-xs overflow-auto whitespace-pre-wrap ${styles}`}>
        {value || '(empty)'}
      </pre>
    </div>
  );
}
