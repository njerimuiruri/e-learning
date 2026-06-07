'use client';

import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

function SortIcon({ sorted }) {
  if (sorted === 'asc')  return <ChevronUp   className="w-3 h-3 text-indigo-600 ml-1 inline" />;
  if (sorted === 'desc') return <ChevronDown className="w-3 h-3 text-indigo-600 ml-1 inline" />;
  return <ChevronsUpDown className="w-3 h-3 text-gray-300 ml-1 inline" />;
}

export function DataTable({ columns, data, searchPlaceholder = 'Search…', pageSize = 10, showSearch = true }) {
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize });

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter, sorting, pagination },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-3">
      {showSearch && (
        <div className="flex items-center justify-between gap-3">
          <input
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-8 px-3 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 w-56"
          />
          <span className="text-xs text-gray-400">
            {table.getFilteredRowModel().rows.length} result{table.getFilteredRowModel().rows.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      <div className="rounded-lg border border-gray-100 overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(hg => (
              <TableRow key={hg.id} className="bg-gray-50 border-gray-100">
                {hg.headers.map(header => (
                  <TableHead
                    key={header.id}
                    className="text-xs font-semibold text-gray-500 select-none py-2.5"
                    style={{ width: header.column.getSize() !== 150 ? header.column.getSize() : undefined }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <span className={header.column.getCanSort() ? 'cursor-pointer hover:text-gray-800 transition-colors' : ''}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && <SortIcon sorted={header.column.getIsSorted()} />}
                    </span>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row, idx) => (
                <TableRow key={row.id} className={`border-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'} hover:bg-indigo-50/30 transition-colors`}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id} className="text-xs py-2.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-xs text-gray-400 py-10">
                  No data found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            {Array.from({ length: Math.min(table.getPageCount(), 5) }, (_, i) => {
              const page = i;
              return (
                <Button key={page} variant={table.getState().pagination.pageIndex === page ? 'default' : 'outline'}
                  size="sm" className={`h-7 w-7 p-0 text-xs ${table.getState().pagination.pageIndex === page ? 'bg-indigo-600 text-white' : ''}`}
                  onClick={() => table.setPageIndex(page)}>
                  {page + 1}
                </Button>
              );
            })}
            <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
