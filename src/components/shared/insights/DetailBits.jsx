'use client';

import { Card, CardContent } from '@/components/ui/card';

export function clean(item) {
  return typeof item === 'string' ? item.replace(/^\d+\.\s*/, '') : item;
}

export function KPICard({ icon: Icon, label, value, sub, color = 'indigo' }) {
  const bg = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    cyan: 'bg-cyan-50 text-cyan-600',
    violet: 'bg-violet-50 text-violet-600',
    rose: 'bg-rose-50 text-rose-600',
  };
  return (
    <Card className="border border-gray-100 shadow-sm">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2.5 rounded-lg ${bg[color] ?? bg.indigo}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500 truncate">{label}</p>
          <p className="text-lg font-bold text-gray-900 leading-tight truncate">{value}</p>
          {sub && <p className="text-[11px] text-gray-400 truncate">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export function Section({ icon: Icon, title, children }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
        <Icon className="w-3.5 h-3.5" />
        {title}
      </div>
      {children}
    </div>
  );
}

export function TagList({ items, tone = 'emerald' }) {
  const list = Array.isArray(items) ? items : items ? [items] : [];
  const toneClass = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
  }[tone];
  if (!list.length) return <p className="text-sm text-gray-400"></p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {list.map((item, i) => (
        <span key={i} className={`px-2.5 py-1 rounded-full text-xs font-medium border ${toneClass}`}>
          {clean(item)}
        </span>
      ))}
    </div>
  );
}

export function NumberedList({ items }) {
  const list = Array.isArray(items) ? items : items ? [items] : [];
  if (!list.length) return <p className="text-sm text-gray-400"></p>;
  return (
    <ol className="space-y-2">
      {list.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <span className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-full bg-gray-100 text-gray-500 text-[10px] font-semibold flex items-center justify-center">
            {i + 1}
          </span>
          <span className="text-sm text-gray-700 leading-snug">{clean(item)}</span>
        </li>
      ))}
    </ol>
  );
}

export function IconList({ items, icon: Icon, colorClass }) {
  const list = Array.isArray(items) ? items : items ? [items] : [];
  if (!list.length) return <p className="text-sm text-gray-400"></p>;
  return (
    <ul className="space-y-2">
      {list.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <Icon className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${colorClass}`} />
          <span className="text-sm text-gray-700 leading-snug">{clean(item)}</span>
        </li>
      ))}
    </ul>
  );
}

export function FactBox({ icon: Icon, label, children, color = 'cyan' }) {
  const bg = {
    cyan: 'bg-cyan-50 text-cyan-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };
  return (
    <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-gray-50 border border-gray-100">
      <div className={`p-1.5 rounded-md ${bg[color] ?? bg.cyan}`}><Icon className="w-3.5 h-3.5" /></div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-gray-400">{label}</p>
        {children}
      </div>
    </div>
  );
}
