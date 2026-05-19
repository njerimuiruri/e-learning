"use client";

import { Award, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "../../fellows/progress/_components/data-table-column-header";

const LEVEL_THEME = {
  beginner:     { btn: "bg-blue-600 hover:bg-blue-700 text-white",  badge: "bg-blue-50 text-blue-700 border-blue-200",  bar: "bg-blue-500"  },
  intermediate: { btn: "bg-amber-500 hover:bg-amber-600 text-white", badge: "bg-amber-50 text-amber-700 border-amber-200", bar: "bg-amber-500" },
  advanced:     { btn: "bg-rose-600 hover:bg-rose-700 text-white",  badge: "bg-rose-50 text-rose-700 border-rose-200",  bar: "bg-rose-500"  },
};

const LEVEL_LABEL = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

function StatusBadge({ status, level }) {
  if (status === "issued") {
    const levelLabel = level
      ? `${level.charAt(0).toUpperCase() + level.slice(1)} Certificate Issued`
      : "Certificate Issued";
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-green-300 bg-green-100 px-2.5 py-1 text-xs font-bold text-green-800">
        <CheckCircle2 className="h-3 w-3" /> {levelLabel}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-yellow-200 bg-yellow-50 px-2.5 py-1 text-xs font-semibold text-yellow-700">
      <Clock className="h-3 w-3" /> Pending
    </span>
  );
}

export function buildCertificateColumns({ onIssue, level = "beginner" }) {
  const theme = LEVEL_THEME[level] || LEVEL_THEME.beginner;

  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Student" />,
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900 text-sm truncate">{row.getValue("name")}</p>
            <span className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${theme.badge}`}>
              {LEVEL_LABEL[level]}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{row.original.email}</p>
        </div>
      ),
    },
    {
      accessorKey: "completedModules",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Modules" />,
      cell: ({ row }) => {
        const { completedModules, totalModules } = row.original;
        return (
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {completedModules}
              <span className="text-gray-400 font-normal text-xs"> / {totalModules}</span>
            </p>
            <div className="mt-1 h-1.5 w-20 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full rounded-full ${theme.bar}`}
                style={{ width: `${(completedModules / totalModules) * 100}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "completedDate",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Completed" />,
      cell: ({ row }) => {
        const date = row.getValue("completedDate");
        if (!date) return <span className="text-gray-400 text-xs">—</span>;
        return (
          <p className="text-sm text-gray-700">
            {new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
          </p>
        );
      },
    },
    {
      accessorKey: "issuedDate",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Issued On" />,
      cell: ({ row }) => {
        const date = row.getValue("issuedDate");
        if (!date) return <span className="text-gray-400 text-xs">—</span>;
        return (
          <p className="text-sm text-green-700">
            {new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
          </p>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => <StatusBadge status={row.getValue("status")} level={level} />,
      filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },
    {
      id: "actions",
      header: () => <div className="text-right pr-2">Actions</div>,
      cell: ({ row }) => {
        const student = row.original;
        return (
          <div className="flex justify-end">
            <Button
              size="sm"
              variant={student.status === "pending" ? "default" : "outline"}
              className={student.status === "pending"
                ? theme.btn
                : "border-gray-200 text-gray-600"}
              onClick={() => onIssue(student)}
            >
              <Award className="mr-1.5 h-3.5 w-3.5" />
              {student.status === "pending" ? "Issue Certificate" : "View Certificate"}
            </Button>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
  ];
}
