'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  School, Layers, Users, Clock, Trophy, Handshake, Link as LinkIcon,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Section, TagList, FactBox } from '@/components/shared/insights/DetailBits';
import { Headline, InsightSection, BarRow } from '@/components/shared/insights/InsightFeed';
import FilterBar from '@/components/shared/insights/FilterBar';
import CountryListModal from '@/components/shared/insights/CountryListModal';
import { buildCountryGroups } from '@/components/shared/CountryBubbleMap';
import records from '../../../public/data/ai-capacity-building.json';

const CountryBubbleMap = dynamic(() => import('@/components/shared/CountryBubbleMap'), {
  ssr: false,
  loading: () => <div className="w-full h-[470px] rounded-xl bg-gray-100 animate-pulse" />,
});

const COLOR = '#06b6d4';

// capacityBuildingType is near-unique free text per programme (e.g. "Math4CCR Initiative",
// "University Lecturer & Student Training")  group into broad buckets so the chart shows
// an actual distribution instead of ~30 bars of 1.
const TYPE_BUCKETS = [
  { label: 'Fellowship', test: (t) => /fellowship/i.test(t) },
  { label: 'Bootcamp / Accelerator', test: (t) => /bootcamp|accelerator/i.test(t) },
  { label: 'Mentorship / Internship', test: (t) => /mentorship|internship/i.test(t) },
  { label: 'School / Camp', test: (t) => /school|camp/i.test(t) },
  { label: 'Short course / Diploma', test: (t) => /short course|diploma|mini course|project course/i.test(t) },
  { label: 'Degree programme', test: (t) => /degree/i.test(t) },
  { label: 'Training / Development', test: (t) => /training|development|governance/i.test(t) },
  { label: 'Scholarship', test: (t) => /scholarship/i.test(t) },
  { label: 'Initiative / Programme', test: (t) => /initiative|program/i.test(t) },
];

function bucketType(type) {
  const match = TYPE_BUCKETS.find((b) => b.test(type || ''));
  return match ? match.label : 'Other';
}

function CapacityDetailModal({ record, onClose }) {
  return (
    <Dialog open={!!record} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        {record && (
          <>
            <DialogHeader>
              <DialogDescription>{record.region} · {record.country}</DialogDescription>
              <DialogTitle className="text-xl">{record.institutionName}</DialogTitle>
            </DialogHeader>

            <div className="space-y-5 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <FactBox icon={School} label="Institution type" color="indigo">
                  <p className="text-sm font-semibold text-gray-800">{record.institutionType || ''}</p>
                </FactBox>
                <FactBox icon={Clock} label="Duration" color="cyan">
                  <p className="text-sm font-semibold text-gray-800">{record.duration || ''}</p>
                </FactBox>
              </div>

              <Section icon={Layers} title={record.capacityBuildingType || 'Programme description'}>
                <p className="text-sm text-gray-700 leading-snug">{record.description || ''}</p>
              </Section>

              <Section icon={Layers} title="Thematic focus">
                <TagList items={record.thematicFocus} tone="indigo" />
              </Section>

              <Section icon={Users} title="Target audience">
                <p className="text-sm text-gray-700 leading-snug">{record.targetAudience || ''}</p>
              </Section>

              {record.outcome && (
                <Section icon={Trophy} title="Outcome">
                  <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg p-2.5 leading-snug">
                    {record.outcome}
                  </p>
                </Section>
              )}

              <div className="grid grid-cols-2 gap-3">
                <FactBox icon={Handshake} label="Partners" color="amber">
                  <p className="text-sm font-semibold text-gray-800">{record.partners || ''}</p>
                </FactBox>
                <FactBox icon={LinkIcon} label="Link" color="indigo">
                  {record.link ? (
                    <a href={record.link} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-indigo-600 hover:underline">
                      View source
                    </a>
                  ) : <p className="text-sm text-gray-400"></p>}
                </FactBox>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function CapacityBuildingTab() {
  const [group, setGroup] = useState(null);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('all');

  const regions = useMemo(() => [...new Set(records.map((r) => r.region))].sort(), []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      const matchesSearch =
        !q ||
        r.country.toLowerCase().includes(q) ||
        r.region.toLowerCase().includes(q) ||
        r.institutionName.toLowerCase().includes(q);
      const matchesRegion = region === 'all' || r.region === region;
      return matchesSearch && matchesRegion;
    });
  }, [search, region]);

  const groups = useMemo(() => buildCountryGroups(filtered), [filtered]);

  const kpis = useMemo(() => {
    const countries = new Set(filtered.filter((r) => !r.isRegional).map((r) => r.country));
    const regional = filtered.filter((r) => r.isRegional).length;
    return { total: filtered.length, countries: countries.size, regional };
  }, [filtered]);

  const typeChartData = useMemo(() => {
    const counts = {};
    filtered.forEach((r) => {
      const bucket = bucketType(r.capacityBuildingType);
      counts[bucket] = (counts[bucket] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filtered]);

  const maxType = Math.max(...typeChartData.map((d) => d.value), 1);

  return (
    <div>
      <p className="text-sm text-gray-500 mb-5">
        Capacity building and training programmes for AI-for-climate skills across Africa. Continent-wide and multi-country programmes are grouped as "Regional / multi-country"  click a bubble to see the list.
      </p>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search institution, country..."
        region={region}
        onRegionChange={setRegion}
        regions={regions}
        shownCount={filtered.length}
        totalCount={records.length}
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-2 border border-gray-100 shadow-sm">
          <CardContent className="p-2.5">
            <CountryBubbleMap groups={groups} selectedKey={group?.key} onSelect={setGroup} color={COLOR} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border border-gray-100 shadow-sm">
          <CardContent className="p-5">
            <Headline
              icon={School}
              value={kpis.total}
              label={`Capacity building programmes tracked across ${kpis.countries} countries`}
              sub={`${kpis.regional} are regional / multi-country`}
              color="#06b6d4"
            />

            <InsightSection icon={PieChartIcon} title="Type of capacity building">
              {typeChartData.map((d) => (
                <BarRow key={d.name} label={d.name} value={d.value} max={maxType} color={COLOR} />
              ))}
            </InsightSection>
          </CardContent>
        </Card>
      </div>

      <CountryListModal
        group={group}
        onClose={() => setGroup(null)}
        onSelectRecord={(r) => setSelected(r)}
        renderItem={(r) => (
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{r.institutionName}</p>
            <p className="text-xs text-gray-400 truncate">{r.capacityBuildingType}</p>
          </div>
        )}
      />
      <CapacityDetailModal record={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
