"use client";

import * as React from "react";
import { addDays, format, isBefore, isSameDay, parseISO, startOfDay } from "date-fns";
import type { DraggableProvidedDragHandleProps, DraggableProvidedDraggableProps } from "@hello-pangea/dnd";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useBoardStore, type Task } from "@/lib/store";
import { cn } from "@/lib/utils";

type TaskCardProps = {
  task: Task;
  accent: string;
  dragRef?: (element: HTMLElement | null) => void;
  dragProps?: DraggableProvidedDraggableProps;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
};

const getDueLabel = (dateValue?: string) => {
  if (!dateValue) {
    return { label: "No date", overdue: false };
  }
  const parsed = parseISO(dateValue);
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);

  if (isSameDay(parsed, today)) {
    return { label: "Today", overdue: false };
  }
  if (isSameDay(parsed, tomorrow)) {
    return { label: "Tomorrow", overdue: false };
  }

  return {
    label: format(parsed, "MMM d, yyyy"),
    overdue: isBefore(parsed, today)
  };
};

export function TaskCard({ task, accent, dragRef, dragProps, dragHandleProps }: TaskCardProps) {
  const updateTask = useBoardStore((state) => state.updateTask);
  const { label, overdue } = getDueLabel(task.dueDate);
  const dateValue = task.dueDate ? parseISO(task.dueDate) : undefined;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div
          ref={dragRef}
          {...(dragProps ?? {})}
          {...(dragHandleProps ?? {})}
          className={cn(
            "w-full cursor-grab rounded-lg border border-slate-800/70 bg-slate-950/60 px-3 py-2 text-left text-sm hover:border-slate-600 active:cursor-grabbing",
            accent
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="truncate font-medium text-slate-100">{task.title || "Untitled"}</span>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              {label && <span>{label}</span>}
              {task.timeEstimate ? <span>{task.timeEstimate}h</span> : null}
            </div>
          </div>
          {task.tags.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {task.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[0.65rem]">
                  {tag}
                </Badge>
              ))}
              {task.tags.length > 3 && (
                <span className="text-[0.65rem] text-slate-400">+{task.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit task</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-3">
          <Input
            value={task.title}
            onChange={(event) => updateTask(task.id, { title: event.target.value })}
            placeholder="Task title"
            className={cn("h-10 border-slate-700/60 bg-slate-950/40 text-sm", accent)}
          />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <DatePicker
              value={dateValue}
              onChange={(nextDate) =>
                updateTask(task.id, {
                  dueDate: nextDate ? format(nextDate, "yyyy-MM-dd") : undefined
                })
              }
              displayLabel={label}
              overdue={overdue}
            />
            <div className="flex items-center gap-2">
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                step={0.25}
                value={Number.isNaN(task.timeEstimate) ? "" : task.timeEstimate}
                onChange={(event) =>
                  updateTask(task.id, {
                    timeEstimate: Math.max(0, Number(event.target.value))
                  })
                }
                className="h-10 w-24 border-slate-700/60 bg-slate-950/40 text-sm"
              />
              <span className="text-xs text-muted-foreground">h</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Input
              value={task.complexity ?? ""}
              onChange={(event) => updateTask(task.id, { complexity: event.target.value })}
              placeholder="Complexity (S/M/L)"
              className="h-10 border-slate-700/60 bg-slate-950/40 text-xs"
            />
            <Input
              value={task.jiraLink ?? ""}
              onChange={(event) => updateTask(task.id, { jiraLink: event.target.value })}
              placeholder="Jira link"
              className="h-10 border-slate-700/60 bg-slate-950/40 text-xs"
            />
          </div>

          <Input
            value={task.tags.join(", ")}
            onChange={(event) => {
              const tags = event.target.value
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean);
              updateTask(task.id, { tags });
            }}
            placeholder="Tags (comma separated)"
            className="h-10 border-slate-700/60 bg-slate-950/40 text-xs"
          />

          <Textarea
            value={task.notes ?? ""}
            onChange={(event) => updateTask(task.id, { notes: event.target.value })}
            placeholder="Notes / details"
            className="min-h-[120px] border-slate-700/60 bg-slate-950/40 text-xs"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
