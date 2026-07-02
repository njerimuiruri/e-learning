'use client';

export function Headline({ icon: Icon, value, label, sub, color = '#6366f1' }) {
  return (
    <div className="flex items-start gap-3 pb-4 mb-4 border-b border-gray-100">
      {Icon && (
        <div className="p-2.5 rounded-lg flex-shrink-0" style={{ background: `${color}1a`, color }}>
          <Icon className="w-5 h-5" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        <p className="text-sm text-gray-600 leading-snug mt-0.5">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export function BarRow({ label, value, max, color = '#6366f1', valueLabel }) {
  const pct = max ? Math.max(4, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-600 w-28 sm:w-32 flex-shrink-0 truncate" title={label}>{label}</span>
      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-10 flex-shrink-0 text-right">{valueLabel ?? value}</span>
    </div>
  );
}

export function InsightSection({ icon: Icon, title, children }) {
  return (
    <div className="mb-5 last:mb-0">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {title}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export function InsightNote({ children }) {
  return (
    <p className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg p-2.5 leading-snug">
      {children}
    </p>
  );
}
