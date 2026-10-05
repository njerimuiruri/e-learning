"use client";

import * as React from "react";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const LEVEL_OPTIONS = [
  { label: "Beginner", value: "beginner" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Advanced", value: "advanced" },
];

const LEVEL_LABEL = Object.fromEntries(LEVEL_OPTIONS.map((o) => [o.value, o.label]));

const HEADERS = ["#", "Name", "Email", "Level", "Status"];

function buildRows(fellows, level) {
  return fellows
    .filter((f) => f.completedLevels?.[level])
    .sort((a, b) => a.fullName.localeCompare(b.fullName))
    .map((f, i) => [
      i + 1,
      f.fullName,
      f.email,
      LEVEL_LABEL[level],
      level === "beginner" && f.certIssued ? "Completed (Certificate Issued)" : "Completed",
    ]);
}

function fileBase(level) {
  return `fellows-completed-${level}-${new Date().toISOString().slice(0, 10)}`;
}

async function exportXlsx(rows, level) {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...rows]);
  ws["!cols"] = [{ wch: 5 }, { wch: 30 }, { wch: 36 }, { wch: 14 }, { wch: 30 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `${LEVEL_LABEL[level]} Completed`);
  XLSX.writeFile(wb, `${fileBase(level)}.xlsx`);
}

async function exportPdf(rows, level) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const widths = [10, 48, 62, 24, 38];
  const rowH = 8;

  const fit = (text, w) => {
    let t = String(text ?? "");
    if (doc.getTextWidth(t) <= w) return t;
    while (t.length && doc.getTextWidth(`${t}…`) > w) t = t.slice(0, -1);
    return `${t}…`;
  };

  const drawRow = (cells, y, { header = false, shade = false } = {}) => {
    if (header || shade) {
      doc.setFillColor(...(header ? [2, 29, 73] : [243, 244, 246]));
      doc.rect(margin, y, pageW - margin * 2, rowH, "F");
    }
    doc.setFont("helvetica", header ? "bold" : "normal");
    doc.setTextColor(...(header ? [255, 255, 255] : [31, 41, 55]));
    let x = margin;
    cells.forEach((c, i) => {
      doc.text(fit(c, widths[i] - 3), x + 1.5, y + 5.5);
      x += widths[i];
    });
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(2, 29, 73);
  doc.text(`Fellows Who Completed ${LEVEL_LABEL[level]} Level`, margin, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(
    `${rows.length} fellow${rows.length === 1 ? "" : "s"} · Generated ${new Date().toLocaleString()}`,
    margin,
    24,
  );

  doc.setFontSize(9);
  let y = 30;
  drawRow(HEADERS, y, { header: true });
  y += rowH;
  rows.forEach((r, i) => {
    if (y + rowH > pageH - margin) {
      doc.addPage();
      y = margin;
      drawRow(HEADERS, y, { header: true });
      y += rowH;
    }
    drawRow(r, y, { shade: i % 2 === 1 });
    y += rowH;
  });

  doc.save(`${fileBase(level)}.pdf`);
}

export function ExportCompletedDialog({ table }) {
  const [open, setOpen] = React.useState(false);
  const [level, setLevel] = React.useState("beginner");
  const [busy, setBusy] = React.useState(null);

  const fellows = table.getCoreRowModel().rows.map((r) => r.original);

  const counts = React.useMemo(
    () =>
      Object.fromEntries(
        LEVEL_OPTIONS.map(({ value }) => [
          value,
          fellows.filter((f) => f.completedLevels?.[value]).length,
        ]),
      ),
    [fellows],
  );

  const handleOpen = () => {
    // Pre-select the level the table is currently filtered by (if exactly one)
    const active = table.getColumn("currentLevel")?.getFilterValue();
    if (Array.isArray(active) && active.length === 1) setLevel(active[0]);
    setOpen(true);
  };

  const runExport = async (format) => {
    const rows = buildRows(fellows, level);
    if (!rows.length) {
      toast.error(`No fellows have completed the ${LEVEL_LABEL[level]} level yet`);
      return;
    }
    setBusy(format);
    try {
      await (format === "pdf" ? exportPdf(rows, level) : exportXlsx(rows, level));
      toast.success(`Exported ${rows.length} fellow${rows.length === 1 ? "" : "s"}`);
    } catch {
      toast.error("Export failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={handleOpen}>
        <Download className="h-3.5 w-3.5" />
        Export Completed
      </Button>

      <Dialog open={open} onOpenChange={(o) => !busy && setOpen(o)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-[#021d49]" />
              Export Completed Fellows
            </DialogTitle>
            <p className="text-sm text-gray-500">
              Exports the name, email, level and status of fellows who completed
              every module of the selected level.
            </p>
          </DialogHeader>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Level</p>
            <div className="grid grid-cols-3 gap-2">
              {LEVEL_OPTIONS.map(({ label, value }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setLevel(value)}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-all ${
                    level === value
                      ? "border-[#021d49] bg-[#021d49] text-white"
                      : "border-gray-200 text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {label}
                  <span className={`block text-xs font-normal ${level === value ? "text-white/80" : "text-gray-400"}`}>
                    {counts[value]} completed
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              disabled={!!busy || !counts[level]}
              onClick={() => runExport("xlsx")}
            >
              {busy === "xlsx" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
              )}
              Excel (.xlsx)
            </Button>
            <Button
              className="bg-[#021d49] hover:bg-[#03306f] text-white"
              disabled={!!busy || !counts[level]}
              onClick={() => runExport("pdf")}
            >
              {busy === "pdf" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}
              PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
