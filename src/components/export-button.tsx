"use client";

import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useBoardStore } from "@/lib/store";

export function ExportButton() {
  const columns = useBoardStore((state) => state.columns);

  const handleExport = () => {
    const tasks = Object.values(columns).flatMap((column) =>
      column.tasks.map((task) => ({
        Title: task.title,
        Status: column.title,
        ColumnId: column.id,
        DueDate: task.dueDate ?? "",
        TimeEstimateHours: task.timeEstimate,
        Complexity: task.complexity ?? "",
        Tags: task.tags.join(", "),
        Jira: task.jiraLink ?? "",
        Notes: task.notes ?? ""
      }))
    );

    const worksheet = XLSX.utils.json_to_sheet(tasks);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tasks");
    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    const stamp = new Date().toISOString().slice(0, 10);
    saveAs(blob, `tasks-${stamp}.xlsx`);
  };

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={handleExport}
      className="gap-2 border-slate-700/60 bg-slate-900/60 text-slate-100"
    >
      <Download className="h-4 w-4" /> Export to Excel
    </Button>
  );
}
