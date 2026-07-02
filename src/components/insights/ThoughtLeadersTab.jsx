'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  Users, Building2, Sparkles, Mail, Phone, BarChart3,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Section, TagList, FactBox } from '@/components/shared/insights/DetailBits';
import { Headline, InsightSection, BarRow } from '@/components/shared/insights/InsightFeed';
import FilterBar from '@/components/shared/insights/FilterBar';
import CountryListModal from '@/components/shared/insights/CountryListModal';
import { buildCountryGroups } from '@/components/shared/CountryBubbleMap';
import records from '../../../public/data/ai-thought-leaders.json';

const CountryBubbleMap = dynamic(() => import('@/components/shared/CountryBubbleMap'), {
  ssr: false,
  loading: () => <div className="w-full h-[470px] rounded-xl bg-gray-100 animate-pulse" />,
});

const COLOR = '#8b5cf6';

function splitSpecialization(val) {
  return (val || '').split(';').map((s) => s.trim()).filter(Boolean);
}

function ExpertDetailModal({ record, onClose }) {
  return (
    <Dialog open={!!record} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        {record && (
          <>
            <DialogHeader>
              <DialogDescription>{record.region} · {record.country}</DialogDescription>
              <DialogTitle className="text-xl">{record.name}</DialogTitle>
            </DialogHeader>

            <div className="space-y-5 pt-1">
              <div className="grid grid-cols-1 gap-3">
                <FactBox icon={Users} label="Designation" color="indigo">
                  <p className="text-sm font-semibold text-gray-800">{record.designation || ''}</p>
                </FactBox>
                <FactBox icon={Building2} label="Affiliation" color="cyan">
                  <p className="text-sm font-semibold text-gray-800">{record.affiliation || ''}</p>
                </FactBox>
              </div>

              <Section icon={Sparkles} title="Specialization">
                <TagList items={splitSpecialization(record.specialization)} tone="indigo" />
              </Section>

              <div className="grid grid-cols-2 gap-3">
                <FactBox icon={Mail} label="Email" color="emerald">
                  {record.email ? (
                    <a href={`mailto:${record.email}`} className="text-sm font-semibold text-indigo-600 hover:underline break-all">
                      {record.email}
                    </a>
                  ) : <p className="text-sm text-gray-400"></p>}
                </FactBox>
                <FactBox icon={Phone} label="Phone" color="amber">
                  <p className="text-sm font-semibold text-gray-800">{record.phone || ''}</p>
                </FactBox>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function ThoughtLeadersTab() {
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
        r.name.toLowerCase().includes(q) ||
        (r.affiliation || '').toLowerCase().includes(q);
      const matchesRegion = region === 'all' || r.region === region;
      return matchesSearch && matchesRegion;
    });
  }, [search, region]);

  const groups = useMemo(() => buildCountryGroups(filtered), [filtered]);

  const kpis = useMemo(() => {
    const countries = new Set(filtered.filter((r) => !r.isRegional).map((r) => r.country));
    const affiliations = new Set(filtered.map((r) => r.affiliation).filter(Boolean));
    return { total: filtered.length, countries: countries.size, affiliations: affiliations.size };
  }, [filtered]);

  const countryChartData = useMemo(() => {
    return groups
      .filter((g) => !g.isRegional)
      .map((g) => ({ country: g.country, value: g.records.length }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [groups]);

  const maxCountry = Math.max(...countryChartData.map((d) => d.value), 1);

  return (
    <div>
      <p className="text-sm text-gray-500 mb-5">
        AI thought leaders and experts working on climate resilience across Africa. Click a country bubble to browse its experts.
      </p>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name, affiliation, country..."
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
              icon={Users}
              value={kpis.total}
              label={`Thought leaders tracked across ${kpis.countries} countries`}
              sub={`${kpis.affiliations} affiliated institutions`}
              color="#8b5cf6"
            />

            <InsightSection icon={BarChart3} title="Top countries by expert count">
              {countryChartData.map((d) => (
                <BarRow key={d.country} label={d.country} value={d.value} max={maxCountry} color={COLOR} />
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
            <p className="text-sm font-medium text-gray-800 truncate">{r.name}</p>
            <p className="text-xs text-gray-400 truncate">{r.designation} · {r.affiliation}</p>
          </div>
        )}
      />
      <ExpertDetailModal record={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
