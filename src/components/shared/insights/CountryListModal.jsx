'use client';

import { ChevronRight } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';

// Shows every record for a country bubble the user clicked on the map;
// clicking a row hands the record up to open its full detail dialog.
export default function CountryListModal({ group, onClose, onSelectRecord, renderItem }) {
  return (
    <Dialog open={!!group} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[75vh] overflow-y-auto">
        {group && (
          <>
            <DialogHeader>
              <DialogDescription>{group.region}</DialogDescription>
              <DialogTitle className="text-xl">{group.country}</DialogTitle>
            </DialogHeader>
            <p className="text-xs text-gray-400 -mt-2">
              {group.records.length} {group.records.length === 1 ? 'entry' : 'entries'}
            </p>
            <ul className="divide-y divide-gray-100">
              {group.records.map((record, i) => (
                <li key={i}>
                  <button
                    onClick={() => onSelectRecord(record)}
                    className="w-full flex items-center justify-between gap-3 py-3 text-left hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors"
                  >
                    {renderItem(record)}
                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
