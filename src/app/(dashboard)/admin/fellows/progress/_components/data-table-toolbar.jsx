"use client";

import { CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./data-table-view-options";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";

const STATUS_OPTIONS = [
  { label: "Completed", value: "completed" },
  { label: "In Progress", value: "inprogress" },
  { label: "Not Started", value: "notstarted" },
];

const LEVEL_OPTIONS = [
  { label: "Beginner", value: "beginner" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Advanced", value: "advanced" },
];

export function FellowsDataTableToolbar({ table }) {
  const isFiltered = table.getState().columnFilters.length > 0;

  const completedBeginnerActive =
    table.getColumn("completedBeginner")?.getFilterValue()?.includes("true") ?? false;

  const toggleCompletedBeginner = () => {
    const col = table.getColumn("completedBeginner");
    if (!col) return;
    col.setFilterValue(completedBeginnerActive ? undefined : ["true"]);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Search by name or email..."
          value={table.getColumn("fullName")?.getFilterValue() ?? ""}
          onChange={(e) => table.getColumn("fullName")?.setFilterValue(e.target.value)}
          className="h-8 w-[200px] lg:w-[280px]"
        />
      </div>

      {/* Completed Beginner toggle */}
      <Button
        variant={completedBeginnerActive ? "default" : "outline"}
        size="sm"
        className={`h-8 gap-1.5 ${completedBeginnerActive ? "bg-green-700 hover:bg-green-800 text-white border-green-700" : "text-gray-600 border-gray-200"}`}
        onClick={toggleCompletedBeginner}
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        Completed Beginner
        {completedBeginnerActive && <X className="h-3 w-3 ml-0.5" />}
      </Button>

      {table.getColumn("currentLevel") && (
        <DataTableFacetedFilter
          column={table.getColumn("currentLevel")}
          title="Level"
          options={LEVEL_OPTIONS}
        />
      )}

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
