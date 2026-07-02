'use client';

import { useState } from 'react';
import {
  MapPin, Rocket, GraduationCap, Users, Award, School, ScrollText,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Navbar from '@/components/navbar/navbar';
import Footer from '@/components/Footer/Footer';

import StrategiesPoliciesTab from '@/components/insights/StrategiesPoliciesTab';
import InitiativesTab from '@/components/insights/InitiativesTab';
import CurriculumTab from '@/components/insights/CurriculumTab';
import ThoughtLeadersTab from '@/components/insights/ThoughtLeadersTab';
import FellowsTab from '@/components/insights/FellowsTab';
import CapacityBuildingTab from '@/components/insights/CapacityBuildingTab';
import ResearchPublicationsTab from '@/components/insights/ResearchPublicationsTab';

const SHEETS = [
  { value: 'strategies', label: 'Strategies & Policies', icon: MapPin, Component: StrategiesPoliciesTab },
  { value: 'initiatives', label: 'Initiatives & Projects', icon: Rocket, Component: InitiativesTab },
  { value: 'curriculum', label: 'Curriculum', icon: GraduationCap, Component: CurriculumTab },
  { value: 'thought-leaders', label: 'Thought Leaders', icon: Users, Component: ThoughtLeadersTab },
  { value: 'fellows', label: 'CoP Fellows', icon: Award, Component: FellowsTab },
  { value: 'capacity-building', label: 'Capacity Building', icon: School, Component: CapacityBuildingTab },
  { value: 'publications', label: 'Research Publications', icon: ScrollText, Component: ResearchPublicationsTab },
];

export default function AIResearchInsightsPage() {
  const [tab, setTab] = useState('strategies');
  const activeSheet = SHEETS.find((s) => s.value === tab);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 pt-28 pb-12">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">AI Desktop Research Insights</h1>
          <p className="text-sm text-gray-500 mt-1">
            Interactive visualizations across all worksheets of the AI Desktop Research findings.
          </p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex flex-wrap h-auto gap-1 w-full justify-start bg-white border border-gray-100 shadow-sm p-1.5">
            {SHEETS.map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="flex items-center gap-1.5 text-xs sm:text-sm border-b-2 border-transparent rounded-b-none data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-700 data-[state=active]:bg-indigo-50 data-[state=active]:shadow-none"
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {activeSheet && (
            <p className="text-xs text-gray-400 mt-2.5 flex items-center gap-1.5">
              <activeSheet.icon className="w-3 h-3" />
              Viewing: <span className="font-medium text-gray-600">{activeSheet.label}</span>
            </p>
          )}

          {SHEETS.map(({ value, Component }) => (
            <TabsContent key={value} value={value} className="mt-6">
              <Component />
            </TabsContent>
          ))}
        </Tabs>
      </div>
      <Footer />
    </div>
  );
}
