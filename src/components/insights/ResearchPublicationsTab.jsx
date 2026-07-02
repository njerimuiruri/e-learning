'use client';

import { useState, useMemo } from 'react';
import {
  ScrollText, Users, Calendar, Tags, Target, TrendingUp, AlertTriangle,
  Link as LinkIcon, ChevronRight, BarChart3, Search,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Section, TagList, FactBox } from '@/components/shared/insights/DetailBits';
import { Headline, InsightSection, BarRow } from '@/components/shared/insights/InsightFeed';
import records from '../../../public/data/ai-research-publications.json';

function splitDomain(val) {
  return (val || '').split(',').map((s) => s.trim()).filter(Boolean);
}

function PublicationDetailModal({ record, onClose }) {
  return (
    <Dialog open={!!record} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        {record && (
          <>
            <DialogHeader>
              <DialogDescription>{record.authors} · {record.year}</DialogDescription>
              <DialogTitle className="text-lg leading-snug">{record.title}</DialogTitle>
            </DialogHeader>

            <div className="space-y-5 pt-1">
              <Section icon={Tags} title="Research themes">
                <TagList items={splitDomain(record.domain)} tone="indigo" />
              </Section>

              <Section icon={ScrollText} title="Abstract">
                <p className="text-sm text-gray-700 leading-snug">{record.abstract || ''}</p>
              </Section>

              <Section icon={Target} title="Objectives">
                <p className="text-sm text-gray-700 leading-snug">{record.objectives || ''}</p>
              </Section>

              <Section icon={TrendingUp} title="Outcomes / findings">
                <p className="text-sm text-gray-700 leading-snug">{record.outcomes || ''}</p>
              </Section>

              <Section icon={AlertTriangle} title="Challenges / gaps">
                <p className="text-sm text-gray-700 leading-snug whitespace-pre-line">{record.challenges || ''}</p>
              </Section>

              <FactBox icon={LinkIcon} label="Link" color="indigo">
                {record.link ? (
                  <a href={record.link} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-indigo-600 hover:underline break-all">
                    View publication
                  </a>
                ) : <p className="text-sm text-gray-400"></p>}
              </FactBox>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function ResearchPublicationsTab() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.authors.toLowerCase().includes(q) ||
        (r.domain || '').toLowerCase().includes(q)
    );
  }, [search]);

  const kpis = useMemo(() => {
    const years = [...new Set(filtered.map((r) => r.year))];
    return {
      total: filtered.length,
      years: years.length === 1 ? years[0] : `${Math.min(...years)}–${Math.max(...years)}`,
    };
  }, [filtered]);

  const themeChartData = useMemo(() => {
    const counts = {};
    filtered.forEach((r) => splitDomain(r.domain).forEach((t) => (counts[t] = (counts[t] || 0) + 1)));
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filtered]);

  const topTheme = themeChartData[0]?.name || '';
  const maxTheme = Math.max(...themeChartData.map((d) => d.value), 1);

  return (
    <div>
      <p className="text-sm text-gray-500 mb-5">
        Peer-reviewed and grey-literature studies on AI for climate resilience in Africa. This sheet has no country field, so it's grouped by research theme instead.
      </p>

      <Card className="border border-gray-100 shadow-sm mb-6">
        <CardContent className="p-5">
          <Headline
            icon={ScrollText}
            value={kpis.total}
            label={`Publications tracked, spanning ${kpis.years}`}
            sub={`Leading theme: ${topTheme}`}
            color="#6366f1"
          />
          <InsightSection icon={BarChart3} title="Most common research themes">
            {themeChartData.map((d) => (
              <BarRow key={d.name} label={d.name} value={d.value} max={maxTheme} color="#8b5cf6" />
            ))}
          </InsightSection>
        </CardContent>
      </Card>

      <Card className="border border-gray-100 shadow-sm mb-4">
        <CardContent className="p-4">
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search title, author, theme..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">{filtered.length} of {records.length} shown</p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {filtered.map((r) => (
          <Card key={r.id} className="border border-gray-100 shadow-sm hover:border-indigo-200 transition-colors">
            <CardContent className="p-4">
              <button onClick={() => setSelected(r)} className="w-full flex items-start justify-between gap-3 text-left">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 leading-snug">{r.title}</p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                    <Users className="w-3 h-3" /> {r.authors}
                    <span className="text-gray-300">·</span>
                    <Calendar className="w-3 h-3" /> {r.year}
                  </p>
                  <div className="mt-2">
                    <TagList items={splitDomain(r.domain).slice(0, 3)} tone="indigo" />
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" />
              </button>
            </CardContent>
          </Card>
        ))}
      </div>

      <PublicationDetailModal record={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
