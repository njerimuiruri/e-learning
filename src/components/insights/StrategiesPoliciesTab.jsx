'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  MapPin, Calendar, Leaf, BookOpen, AlertTriangle, CheckCircle2,
  Link as LinkIcon, PieChart as PieChartIcon, Mail, Target,
  BarChart3, LayoutGrid, Globe2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Section, TagList, NumberedList, IconList, FactBox } from '@/components/shared/insights/DetailBits';
import { Headline, InsightSection, BarRow, InsightNote } from '@/components/shared/insights/InsightFeed';
import FilterBar from '@/components/shared/insights/FilterBar';
import policyData from '../../../public/data/ai-strategies-policies.json';
import { STATUS_COLORS } from '@/components/shared/PolicyMap';

const PolicyMap = dynamic(() => import('@/components/shared/PolicyMap'), {
  ssr: false,
  loading: () => <div className="w-full h-[470px] rounded-xl bg-gray-100 animate-pulse" />,
});

const STATUS_ORDER = ['Published', 'Implemented', 'Approved', 'Draft'];

const STATUS_BADGE_CLASS = {
  Published: 'bg-green-100 text-green-700',
  Implemented: 'bg-indigo-100 text-indigo-700',
  Approved: 'bg-cyan-100 text-cyan-700',
  Draft: 'bg-amber-100 text-amber-700',
};

function StatusBadge({ status }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE_CLASS[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

function CountryDetailModal({ record, onClose }) {
  return (
    <Dialog open={!!record} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        {record && (
          <>
            <DialogHeader>
              <DialogDescription className="flex items-center gap-1.5">
                {record.region}{record.isRegional ? '' : ` · ${record.country}`}
              </DialogDescription>
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: `${STATUS_COLORS[record.policyStatus] || '#9ca3af'}1a` }}
                >
                  <Globe2 className="w-4.5 h-4.5" style={{ color: STATUS_COLORS[record.policyStatus] || '#9ca3af' }} />
                </div>
                <DialogTitle className="text-xl">
                  {record.isRegional ? 'Africa (Pan-African)' : record.country}
                </DialogTitle>
                <StatusBadge status={record.policyStatus} />
              </div>
            </DialogHeader>

            <div className="space-y-5 pt-1">
              <Section icon={MapPin} title="Strategy / Policy">
                <p className="text-sm text-gray-800 font-medium">{record.strategyTitle || ''}</p>
              </Section>

              <div className="grid grid-cols-2 gap-3">
                <FactBox icon={Calendar} label="Year updated" color="cyan">
                  <p className="text-sm font-semibold text-gray-800">{record.yearLastUpdated || ''}</p>
                </FactBox>
                <FactBox icon={LinkIcon} label="Source" color="indigo">
                  {record.sourcesReferences ? (
                    <a
                      href={record.sourcesReferences}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-indigo-600 hover:underline"
                    >
                      View reference
                    </a>
                  ) : (
                    <p className="text-sm text-gray-400"></p>
                  )}
                </FactBox>
              </div>

              {record.keyContactDetails && (
                <Section icon={Mail} title="Key contact">
                  <p className="text-sm text-gray-700 leading-snug whitespace-pre-line">{record.keyContactDetails}</p>
                </Section>
              )}

              {record.objectives && (
                <Section icon={Target} title="Objectives">
                  <p className="text-sm text-gray-700 leading-snug">{record.objectives}</p>
                </Section>
              )}

              <Section icon={Leaf} title="Climate resilience priorities">
                <TagList items={record.climateResiliencePriorities} />
              </Section>

              <Section icon={BookOpen} title="Research publications">
                <NumberedList items={record.researchPublications} />
              </Section>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Section icon={AlertTriangle} title="Challenges / gaps">
                  <IconList items={record.challengesGaps} icon={AlertTriangle} colorClass="text-amber-500" />
                </Section>
                <Section icon={CheckCircle2} title="Recommended actions">
                  <IconList items={record.recommendedActionPoints} icon={CheckCircle2} colorClass="text-green-600" />
                </Section>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StatusFilterChips({ active, onToggle }) {
  return (
    <div className="flex flex-wrap gap-2">
      {STATUS_ORDER.map((status) => {
        const isActive = active.includes(status);
        const color = STATUS_COLORS[status];
        return (
          <button
            key={status}
            onClick={() => onToggle(status)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
              isActive ? 'text-white border-transparent' : 'text-gray-500 border-gray-200 bg-white'
            }`}
            style={isActive ? { background: color } : {}}
          >
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: isActive ? 'white' : color }} />
            {status}
          </button>
        );
      })}
    </div>
  );
}

export default function StrategiesPoliciesTab() {
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('all');
  const [activeStatuses, setActiveStatuses] = useState(STATUS_ORDER);

  const records = policyData;

  const regions = useMemo(() => [...new Set(records.map((r) => r.region))].sort(), [records]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      const matchesSearch = !q || r.country.toLowerCase().includes(q) || r.region.toLowerCase().includes(q);
      const matchesRegion = region === 'all' || r.region === region;
      const matchesStatus = activeStatuses.includes(r.policyStatus);
      return matchesSearch && matchesRegion && matchesStatus;
    });
  }, [records, search, region, activeStatuses]);

  const kpis = useMemo(() => {
    const total = filtered.length;
    const published = filtered.filter((r) => r.policyStatus === 'Published').length;
    const draft = filtered.filter((r) => r.policyStatus === 'Draft').length;
    const years = filtered.map((r) => r.yearLastUpdated).filter(Boolean);
    const latestYear = years.length ? Math.max(...years) : '';
    return {
      total,
      published,
      publishedPct: total ? Math.round((published / total) * 100) : 0,
      draft,
      latestYear,
    };
  }, [filtered]);

  const statusChartData = useMemo(
    () =>
      STATUS_ORDER.map((status) => ({
        name: status,
        value: filtered.filter((r) => r.policyStatus === status).length,
        color: STATUS_COLORS[status],
      })).filter((d) => d.value > 0),
    [filtered]
  );

  const yearChartData = useMemo(() => {
    const map = {};
    filtered.forEach((r) => {
      if (!r.yearLastUpdated) return;
      map[r.yearLastUpdated] = (map[r.yearLastUpdated] || 0) + 1;
    });
    return Object.entries(map).map(([year, count]) => ({ year, count })).sort((a, b) => Number(b.year) - Number(a.year));
  }, [filtered]);

  const regionStatusData = useMemo(() => {
    const regionsInData = [...new Set(filtered.map((r) => r.region))];
    return regionsInData
      .map((rgn) => ({ region: rgn, total: filtered.filter((r) => r.region === rgn).length }))
      .sort((a, b) => b.total - a.total);
  }, [filtered]);

  const maxRegionTotal = Math.max(...regionStatusData.map((r) => r.total), 1);
  const maxYearCount = Math.max(...yearChartData.map((y) => y.count), 1);

  const toggleStatus = (status) => {
    setActiveStatuses((prev) => (prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]));
  };

  return (
    <div>
      <p className="text-sm text-gray-500 mb-5">
        Click a marker to view that country's AI strategy, climate resilience priorities, publications, challenges and recommended actions.
      </p>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        region={region}
        onRegionChange={setRegion}
        regions={regions}
        shownCount={filtered.length}
        totalCount={records.length}
      >
        <StatusFilterChips active={activeStatuses} onToggle={toggleStatus} />
      </FilterBar>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-2 border border-gray-100 shadow-sm">
          <CardContent className="p-2.5">
            <PolicyMap records={filtered} selectedId={selected?.id} onSelect={setSelected} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border border-gray-100 shadow-sm">
          <CardContent className="p-5">
            <Headline
              icon={CheckCircle2}
              value={`${kpis.publishedPct}%`}
              label={`Published  ${kpis.published} of ${kpis.total} tracked countries have a published AI strategy`}
              sub={`${kpis.draft} still in draft · most recent update ${kpis.latestYear}`}
              color="#22c55e"
            />

            <InsightSection icon={PieChartIcon} title="By status">
              {statusChartData.map((d) => (
                <BarRow key={d.name} label={d.name} value={d.value} max={kpis.total} color={d.color} />
              ))}
            </InsightSection>

            <InsightSection icon={LayoutGrid} title="By region">
              {regionStatusData.map((r) => (
                <BarRow key={r.region} label={r.region} value={r.total} max={maxRegionTotal} color="#6366f1" />
              ))}
            </InsightSection>

            <InsightSection icon={BarChart3} title="By year updated">
              {yearChartData.map((y) => (
                <BarRow key={y.year} label={y.year} value={y.count} max={maxYearCount} color="#f59e0b" />
              ))}
            </InsightSection>

            {regionStatusData[0] && yearChartData[0] && (
              <InsightNote>
                {regionStatusData[0].region} leads with {regionStatusData[0].total} tracked {regionStatusData[0].total === 1 ? 'policy' : 'policies'}.
                {' '}{yearChartData[0].year} saw the most activity ({yearChartData[0].count} {yearChartData[0].count === 1 ? 'country' : 'countries'} updated that year).
              </InsightNote>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-gray-400 mt-6">{records.length} entries · Map data © OpenStreetMap contributors</p>

      <CountryDetailModal record={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
