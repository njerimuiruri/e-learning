'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  Rocket, Building2, MapPin, Layers, Landmark, Users, AlertTriangle,
  Handshake, Mail, Link as LinkIcon, Globe2, BarChart3,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Section, TagList, FactBox, IconList } from '@/components/shared/insights/DetailBits';
import { Headline, InsightSection, BarRow } from '@/components/shared/insights/InsightFeed';
import FilterBar from '@/components/shared/insights/FilterBar';
import CountryListModal from '@/components/shared/insights/CountryListModal';
import { buildCountryGroups } from '@/components/shared/CountryBubbleMap';
import records from '../../../public/data/ai-initiatives-projects.json';

const CountryBubbleMap = dynamic(() => import('@/components/shared/CountryBubbleMap'), {
  ssr: false,
  loading: () => <div className="w-full h-[470px] rounded-xl bg-gray-100 animate-pulse" />,
});

const COLOR = '#6366f1';

function InitiativeDetailModal({ record, onClose }) {
  return (
    <Dialog open={!!record} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        {record && (
          <>
            <DialogHeader>
              <DialogDescription>{record.region}{record.isRegional ? '' : ` · ${record.country}`}</DialogDescription>
              <DialogTitle className="text-xl">{record.initiativeTitle}</DialogTitle>
            </DialogHeader>

            <div className="space-y-5 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <FactBox icon={Building2} label="Institution" color="indigo">
                  <p className="text-sm font-semibold text-gray-800">{record.institution || ''}</p>
                </FactBox>
                <FactBox icon={MapPin} label="Location" color="cyan">
                  <p className="text-sm font-semibold text-gray-800">{record.location || ''}</p>
                </FactBox>
              </div>

              <Section icon={Rocket} title="Objectives">
                <p className="text-sm text-gray-700 leading-snug">{record.objectives || ''}</p>
              </Section>

              <Section icon={Layers} title="Thematic focus">
                <TagList items={record.thematicFocus} tone="indigo" />
              </Section>

              <Section icon={Landmark} title="Donor">
                <p className="text-sm text-gray-700 leading-snug whitespace-pre-line">{record.donor || ''}</p>
              </Section>

              <Section icon={Handshake} title="Collaborators & partners">
                <TagList items={record.collaborators} />
              </Section>

              <Section icon={Users} title="Beneficiaries">
                <p className="text-sm text-gray-700 leading-snug">{record.beneficiaries || ''}</p>
              </Section>

              <Section icon={AlertTriangle} title="Challenges">
                <IconList items={record.challenges} icon={AlertTriangle} colorClass="text-amber-500" />
              </Section>

              {record.collaborationOpportunities && (
                <Section icon={Handshake} title="Collaboration opportunity">
                  <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg p-2.5 leading-snug">
                    {record.collaborationOpportunities}
                  </p>
                </Section>
              )}

              <div className="grid grid-cols-2 gap-3">
                <FactBox icon={Mail} label="Contact" color="cyan">
                  {record.contactDetails ? (
                    <p className="text-sm font-semibold text-gray-800 break-all">{record.contactDetails}</p>
                  ) : <p className="text-sm text-gray-400"></p>}
                </FactBox>
                <FactBox icon={LinkIcon} label="Source" color="indigo">
                  <p className="text-sm text-gray-700">{record.source || ''}</p>
                </FactBox>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function InitiativesTab() {
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
        r.initiativeTitle.toLowerCase().includes(q) ||
        r.institution.toLowerCase().includes(q);
      const matchesRegion = region === 'all' || r.region === region;
      return matchesSearch && matchesRegion;
    });
  }, [search, region]);

  const groups = useMemo(() => buildCountryGroups(filtered), [filtered]);

  const kpis = useMemo(() => {
    const countries = new Set(filtered.filter((r) => !r.isRegional).map((r) => r.country));
    const crossBorder = filtered.filter((r) => r.isRegional).length;
    const themeCounts = {};
    filtered.forEach((r) => (r.thematicFocus || []).forEach((t) => (themeCounts[t] = (themeCounts[t] || 0) + 1)));
    const topTheme = Object.entries(themeCounts).sort((a, b) => b[1] - a[1])[0];
    return {
      total: filtered.length,
      countries: countries.size,
      crossBorder,
      topTheme: topTheme ? topTheme[0] : '',
    };
  }, [filtered]);

  const themeChartData = useMemo(() => {
    const counts = {};
    filtered.forEach((r) => (r.thematicFocus || []).forEach((t) => (counts[t] = (counts[t] || 0) + 1)));
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filtered]);

  const regionChartData = useMemo(() => {
    const counts = {};
    filtered.forEach((r) => (counts[r.region] = (counts[r.region] || 0) + 1));
    return Object.entries(counts).map(([region, value]) => ({ region, value })).sort((a, b) => b.value - a.value);
  }, [filtered]);

  const maxTheme = Math.max(...themeChartData.map((t) => t.value), 1);
  const maxRegion = Math.max(...regionChartData.map((r) => r.value), 1);

  return (
    <div>
      <p className="text-sm text-gray-500 mb-5">
        AI initiatives and climate-action projects across Africa. Bubble size shows how many initiatives are tracked per country  click one to see the list.
      </p>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search initiative, institution, country..."
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
              icon={Rocket}
              value={kpis.total}
              label={`Initiatives tracked across ${kpis.countries} countries`}
              sub={`${kpis.crossBorder} are cross-border · leading theme: ${kpis.topTheme}`}
              color="#6366f1"
            />

            <InsightSection icon={Layers} title="Leading thematic focus areas">
              {themeChartData.map((t) => (
                <BarRow key={t.name} label={t.name} value={t.value} max={maxTheme} color="#8b5cf6" />
              ))}
            </InsightSection>

            <InsightSection icon={BarChart3} title="Initiatives by region">
              {regionChartData.map((r) => (
                <BarRow key={r.region} label={r.region} value={r.value} max={maxRegion} color="#6366f1" />
              ))}
            </InsightSection>
          </CardContent>
        </Card>
      </div>

      <CountryListModal
        group={group}
        onClose={() => setGroup(null)}
        onSelectRecord={(r) => { setSelected(r); }}
        renderItem={(r) => (
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{r.initiativeTitle}</p>
            <p className="text-xs text-gray-400 truncate">{r.institution}</p>
          </div>
        )}
      />
      <InitiativeDetailModal record={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
