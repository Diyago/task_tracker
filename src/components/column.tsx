"use client";

import * as React from "react";
import { AlertTriangle, MoreHorizontal, Plus } from "lucide-react";
import { Droppable, Draggable } from "@hello-pangea/dnd";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TaskCard } from "@/components/task-card";
import {
  DEFAULT_DONE_ARCHIVE_HOURS,
  isTaskOlderThan,
  useBoardStore,
  type Column as ColumnType
} from "@/lib/store";
import { cn } from "@/lib/utils";

type ColumnProps = {
  column: ColumnType;
};

const formatHours = (value: number) => {
  if (Number.isNaN(value)) return "0h";
  return Number.isInteger(value) ? `${value}h` : `${value.toFixed(1)}h`;
};

export function Column({ column }: ColumnProps) {
  const addTask = useBoardStore((state) => state.addTask);
  const doneArchiveHours = useBoardStore((state) => state.doneArchiveHours);
  const setDoneArchiveHours = useBoardStore((state) => state.setDoneArchiveHours);
  const totalHours = column.tasks.reduce((acc, task) => acc + task.timeEstimate, 0);
  const isUrgentOverloaded = column.id === "todo" && totalHours > 6;
  const now = Date.now();
  const oldStartIndex =
    column.id === "done"
      ? column.tasks.findIndex((task) => isTaskOlderThan(task, now, doneArchiveHours))
      : -1;

  return (
    <section
      className={cn(
        "flex h-full flex-col gap-4 rounded-2xl border bg-slate-900/40 p-4 shadow-[0_0_0_1px_rgba(15,23,42,0.4)] backdrop-blur",
        column.accent,
        column.softBg,
        isUrgentOverloaded && "border-rose-500/80 shadow-[0_0_24px_rgba(244,63,94,0.35)]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={cn("h-2 w-2 rounded-full", column.accentText, "bg-current")} />
            <h3 className={cn("text-base font-semibold", column.accentText)}>{column.title}</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{column.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className={cn(
              "gap-1.5 border border-transparent bg-slate-800/60 text-xs text-slate-200",
              isUrgentOverloaded && "bg-rose-500/20 text-rose-100"
            )}
          >
            {isUrgentOverloaded && <AlertTriangle className="h-3.5 w-3.5" />}
            Total {formatHours(totalHours)}
          </Badge>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="rounded-md border border-slate-700/60 bg-slate-950/50 p-2 text-slate-400 hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-600"
                title="Column options"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-48">
              <div className="flex flex-col gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => addTask(column.id)}
                  className="rounded-md px-2 py-1 text-left text-slate-100 hover:bg-slate-800"
                >
                  Add task
                </button>
                <button
                  type="button"
                  onClick={() =>
                    column.tasks.length === 0
                      ? null
                      : addTask(column.id)
                  }
                  className="rounded-md px-2 py-1 text-left text-slate-100 hover:bg-slate-800"
                >
                  Quick duplicate
                </button>
                {column.id === "done" ? (
                  <label className="flex flex-col gap-1 rounded-md border border-slate-800/70 bg-slate-900/60 px-2 py-1 text-[0.7rem] text-slate-300">
                    <span className="uppercase tracking-[0.16em] text-slate-400">
                      Порог архива
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={168}
                        value={doneArchiveHours}
                        onChange={(event) =>
                          setDoneArchiveHours(
                            event.target.value === ""
                              ? DEFAULT_DONE_ARCHIVE_HOURS
                              : Number(event.target.value)
                          )
                        }
                        className="w-16 rounded-md border border-slate-700/70 bg-slate-950/60 px-2 py-1 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-600"
                      />
                      <span className="text-xs text-slate-400">часов</span>
                    </div>
                  </label>
                ) : null}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex flex-1 flex-col gap-3 rounded-xl border border-dashed border-transparent p-1 transition",
              snapshot.isDraggingOver && "border-slate-600/60 bg-slate-900/60"
            )}
          >
            {column.tasks.map((task, index) => (
              <React.Fragment key={task.id}>
                {column.id === "done" && oldStartIndex === index ? (
                  <div className="rounded-lg border border-slate-800/70 bg-slate-900/60 px-3 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Старые выполненные
                  </div>
                ) : null}
                <Draggable draggableId={task.id} index={index}>
                  {(dragProvided) => (
                    <TaskCard
                      task={task}
                      accent={column.accentText}
                      dragRef={dragProvided.innerRef}
                      dragHandleProps={dragProvided.dragHandleProps ?? undefined}
                      dragProps={dragProvided.draggableProps}
                    />
                  )}
                </Draggable>
              </React.Fragment>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      <Button
        variant="outline"
        size="sm"
        onClick={() => addTask(column.id)}
        className="mt-auto border-slate-700/60 bg-slate-950/50 text-xs text-slate-200"
      >
        <Plus className="h-3.5 w-3.5" />
        Add task
      </Button>
    </section>
  );
}
