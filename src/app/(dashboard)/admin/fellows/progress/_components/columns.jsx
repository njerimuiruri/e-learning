"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Clock, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "./data-table-column-header";

function ModuleDot({ module }) {
  if (module.progress === 100 || module.isCompleted) {
    return (
      <div
        title={`${module.title}: Completed`}
        className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0"
      />
    );
  }
  if (module.progress > 0) {
    return (
      <div
        title={`${module.title}: ${module.progress}% in progress`}
        className="w-2.5 h-2.5 rounded-full bg-yellow-400 flex-shrink-0"
      />
    );
  }
  return (
    <div
      title={`${module.title}: Not started`}
      className="w-2.5 h-2.5 rounded-full bg-gray-200 border border-gray-300 flex-shrink-0"
    />
  );
}

function ProgressCell({ row }) {
  const { completedModules, totalModules, overallProgress, modules } = row.original;
  const bar =
    overallProgress === 100
      ? "bg-green-500"
      : overallProgress > 0
      ? "bg-yellow-400"
      : "bg-red-300";
  const track =
    overallProgress === 100
      ? "bg-green-100"
      : overallProgress > 0
      ? "bg-yellow-100"
      : "bg-red-50";
  const pct =
    overallProgress === 100
      ? "bg-green-100 text-green-700"
      : overallProgress > 0
      ? "bg-yellow-100 text-yellow-700"
      : "bg-red-100 text-red-600";

  return (
    <div className="min-w-[190px] space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-gray-900">
          {completedModules}{" "}
          <span className="text-gray-400 font-normal text-xs">of</span>{" "}
          {totalModules}{" "}
          <span className="text-gray-500 font-normal text-xs">modules</span>
        </span>
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${pct}`}>
          {overallProgress}%
        </span>
      </div>
      <div className={`h-1.5 w-full rounded-full overflow-hidden ${track}`}>
        <div
          className={`h-full rounded-full transition-all ${bar}`}
          style={{ width: `${overallProgress}%` }}
        />
      </div>
      {modules.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap pt-0.5">
          {modules.map((m, i) => (
            <ModuleDot key={i} module={m} />
          ))}
          <span className="text-[10px] text-gray-400 ml-0.5">
            {completedModules === totalModules && totalModules > 0
              ? "All done"
              : `${totalModules - completedModules} remaining`}
          </span>
        </div>
      )}
    </div>
  );
}

function CurrentModuleCell({ row }) {
  const modules = row.original.modules || [];
  const active = modules.find((m) => m.progress > 0 && m.progress < 100);
  const next = modules.find((m) => m.progress === 0);
  const current = active || next;

  if (!current) {
    return (
      <div className="flex items-center gap-1.5 text-green-600">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        <span className="text-xs font-medium">All modules done</span>
      </div>
    );
  }

  return (
    <div className="max-w-[180px]">
      <div className="flex items-center gap-1.5 mb-0.5">
        {active ? (
          <Clock className="w-3 h-3 text-yellow-500 shrink-0" />
        ) : (
          <Circle className="w-3 h-3 text-gray-300 shrink-0" />
        )}
        <p
          className="text-xs font-medium text-gray-900 truncate"
          title={current.title}
        >
          {current.title}
        </p>
      </div>
      <p className="text-[10px] text-gray-400 pl-4">
        {active ? `${current.progress}% complete` : "Not yet started"}
      </p>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    completed: "bg-green-50 text-green-700 border-green-200",
    inprogress: "bg-yellow-50 text-yellow-700 border-yellow-200",
    notstarted: "bg-red-50 text-red-700 border-red-200",
  };
  const label = {
    completed: "Completed",
    inprogress: "In Progress",
    notstarted: "Not Started",
  };
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
        map[status] ?? map.notstarted
      }`}
    >
      {label[status] ?? "Not Started"}
    </span>
  );
}

function ViewDetailsCell({ row }) {
  const router = useRouter();
  const handleClick = () => {
    try {
      sessionStorage.setItem(
        "fellow_progress_detail",
        JSON.stringify(row.original)
      );
    } catch {}
    router.push(
      `/admin/fellows/progress/${encodeURIComponent(row.original._id)}`
    );
  };
  return (
    <Button variant="outline" size="sm" onClick={handleClick}>
      <Eye className="mr-2 h-4 w-4" />
      Details
    </Button>
  );
}

export const fellowProgressColumns = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "fullName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Fellow" />
    ),
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-gray-900 text-sm">
          {row.getValue("fullName")}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{row.original.email}</p>
      </div>
    ),
  },
  {
    accessorKey: "cohort",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Cohort" />
    ),
    cell: ({ row }) => (
      <div>
        <p className="text-sm text-gray-700">{row.getValue("cohort")}</p>
        {row.original.track && row.original.track !== "Not assigned" && (
          <p className="text-xs text-gray-400 mt-0.5">{row.original.track}</p>
        )}
      </div>
    ),
  },
  {
    accessorKey: "overallProgress",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Module Progress" />
    ),
    cell: ({ row }) => <ProgressCell row={row} />,
  },
  {
    id: "currentModule",
    header: "Current Module",
    cell: ({ row }) => <CurrentModuleCell row={row} />,
    enableSorting: false,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <ViewDetailsCell row={row} />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
];
