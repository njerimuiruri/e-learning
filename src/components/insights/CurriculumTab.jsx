'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  GraduationCap, Building2, Layers, Mail, Handshake, PieChart as PieChartIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Section, TagList, FactBox } from '@/components/shared/insights/DetailBits';
import { Headline, InsightSection, BarRow } from '@/components/shared/insights/InsightFeed';
import FilterBar from '@/components/shared/insights/FilterBar';
import CountryListModal from '@/components/shared/insights/CountryListModal';
import { buildCountryGroups } from '@/components/shared/CountryBubbleMap';
import records from '../../../public/data/ai-curriculum.json';

const CountryBubbleMap = dynamic(() => import('@/components/shared/CountryBubbleMap'), {
  ssr: false,
  loading: () => <div className="w-full h-[470px] rounded-xl bg-gray-100 animate-pulse" />,
});

const COLOR = '#22c55e';

function CurriculumDetailModal({ record, onClose }) {
  return (
    <Dialog open={!!record} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        {record && (
          <>
            <DialogHeader>
              <DialogDescription>{record.region} · {record.country}</DialogDescription>
              <DialogTitle className="text-xl">{record.institution}</DialogTitle>
            </DialogHeader>

            <div className="space-y-5 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <FactBox icon={Building2} label="Institution type" color="indigo">
                  <p className="text-sm font-semibold text-gray-800">{record.institutionType || ''}</p>
                </FactBox>
                <FactBox icon={GraduationCap} label="Department" color="emerald">
                  <p className="text-sm font-semibold text-gray-800">{record.department || ''}</p>
                </FactBox>
              </div>

              <Section icon={Layers} title="Course type">
                <TagList items={record.courseType} tone="indigo" />
              </Section>

              <Section icon={GraduationCap} title="Levels / programmes offered">
                <TagList items={record.levelOfStudy} />
              </Section>

              {record.collaborationOpportunities && (
                <Section icon={Handshake} title="Collaboration opportunities">
                  <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg p-2.5 leading-snug whitespace-pre-line">
                    {record.collaborationOpportunities}
                  </p>
                </Section>
              )}

              <Section icon={Mail} title="Contact">
                <p className="text-sm text-gray-700 whitespace-pre-line">{record.contactDetails || ''}</p>
              </Section>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function CurriculumTab() {
  const [group, setGroup] = useState(null);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('all');

  const regions = useMemo(() => [...new Set(records.map((r) => r.region))].sort(), []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      const matchesSearch =
        !q || r.country.toLowerCase().includes(q) || r.region.toLowerCase().includes(q) || r.institution.toLowerCase().includes(q);
      const matchesRegion = region === 'all' || r.region === region;
      return matchesSearch && matchesRegion;
    });
  }, [search, region]);

  const groups = useMemo(() => buildCountryGroups(filtered), [filtered]);

  const kpis = useMemo(() => {
    const countries = new Set(filtered.filter((r) => !r.isRegional).map((r) => r.country));
    const universities = filtered.filter((r) => r.institutionType === 'University').length;
    return {
      total: filtered.length,
      countries: countries.size,
      universities,
    };
  }, [filtered]);

  const institutionTypeData = useMemo(() => {
    const counts = {};
    filtered.forEach((r) => (counts[r.institutionType || 'Other'] = (counts[r.institutionType || 'Other'] || 0) + 1));
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filtered]);

  const courseTypeData = useMemo(() => {
    const counts = {};
    filtered.forEach((r) => (r.courseType || []).forEach((t) => (counts[t] = (counts[t] || 0) + 1)));
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filtered]);

  const maxInstitutionType = Math.max(...institutionTypeData.map((d) => d.value), 1);
  const maxCourseType = Math.max(...courseTypeData.map((d) => d.value), 1);

  return (
    <div>
      <p className="text-sm text-gray-500 mb-5">
        Universities, think tanks and training providers offering AI-related curriculum across Africa. Click a country bubble to see its institutions.
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
              icon={GraduationCap}
              value={kpis.total}
              label={`Institutions offering AI curriculum across ${kpis.countries} countries`}
              sub={`${kpis.universities} are universities`}
              color="#22c55e"
            />

            <InsightSection icon={PieChartIcon} title="Institution types">
              {institutionTypeData.map((d) => (
                <BarRow key={d.name} label={d.name} value={d.value} max={maxInstitutionType} color="#6366f1" />
              ))}
            </InsightSection>

            <InsightSection icon={Layers} title="Course types on offer">
              {courseTypeData.map((d) => (
                <BarRow key={d.name} label={d.name} value={d.value} max={maxCourseType} color="#f59e0b" />
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
            <p className="text-sm font-medium text-gray-800 truncate">{r.institution}</p>
            <p className="text-xs text-gray-400 truncate">{r.institutionType} · {r.department}</p>
          </div>
        )}
      />
      <CurriculumDetailModal record={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
