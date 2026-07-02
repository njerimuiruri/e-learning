'use client';

import { Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

export default function FilterBar({
  search, onSearchChange, searchPlaceholder = 'Search country or region...',
  region, onRegionChange, regions = [],
  shownCount, totalCount,
  children,
}) {
  return (
    <Card className="border border-gray-100 shadow-sm mb-6">
      <CardContent className="p-4 flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="relative w-full lg:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {onRegionChange && (
          <div className="w-full lg:w-56">
            <Select value={region} onValueChange={onRegionChange}>
              <SelectTrigger>
                <SelectValue placeholder="All regions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All regions</SelectItem>
                {regions.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {children && <div className="flex-1">{children}</div>}

        <p className="text-xs text-gray-400 whitespace-nowrap lg:ml-auto">{shownCount} of {totalCount} shown</p>
      </CardContent>
    </Card>
  );
}
