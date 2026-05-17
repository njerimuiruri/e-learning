"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "../../fellows/progress/_components/data-table-view-options";
import { DataTableFacetedFilter } from "../../fellows/progress/_components/data-table-faceted-filter";

const STATUS_OPTIONS = [
  { label: "Issued", value: "issued" },
  { label: "Pending", value: "pending" },
];

export function CertificatesDataTableToolbar({ table }) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Search by name or email…"
          value={table.getColumn("name")?.getFilterValue() ?? ""}
          onChange={(e) => table.getColumn("name")?.setFilterValue(e.target.value)}
          className="h-8 w-[200px] lg:w-[280px]"
        />
      </div>

      {table.getColumn("status") && (
        <DataTableFacetedFilter
          column={table.getColumn("status")}
          title="Status"
          options={STATUS_OPTIONS}
        />
      )}

      {isFiltered && (
        <Button
          variant="ghost"
          onClick={() => table.resetColumnFilters()}
          className="h-8 px-2 lg:px-3"
        >
          Reset
          <X className="ml-2 h-4 w-4" />
        </Button>
      )}

      <DataTableViewOptions table={table} />
    </div>
  );
}
