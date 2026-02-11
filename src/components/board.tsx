"use client";

import * as React from "react";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";

import { Column } from "@/components/column";
import { isTaskOlderThan, useBoardStore, type ColumnId } from "@/lib/store";

export default function Board() {
  const columns = useBoardStore((state) => state.columns);
  const columnOrder = useBoardStore((state) => state.columnOrder);
  const moveTask = useBoardStore((state) => state.moveTask);
  const doneTasks = useBoardStore((state) => state.columns.done.tasks);
  const doneArchiveHours = useBoardStore((state) => state.doneArchiveHours);
  const [hydrated, setHydrated] = React.useState(false);
  const oldDoneTasks = React.useMemo(() => {
    const now = Date.now();
    return doneTasks.filter((task) => isTaskOlderThan(task, now, doneArchiveHours));
  }, [doneTasks, doneArchiveHours]);

  const formatCompletedAt = React.useCallback((value?: string) => {
    if (!value) return "";
    return new Date(value).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "short"
    });
  }, []);

  React.useEffect(() => {
    Promise.resolve(useBoardStore.persist.rehydrate()).then(() => setHydrated(true));
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    const refresh = () => useBoardStore.getState().refreshDoneOrdering();
    refresh();
    const interval = setInterval(refresh, 60 * 1000);
    return () => clearInterval(interval);
  }, [hydrated]);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    moveTask(
      source.droppableId as ColumnId,
      destination.droppableId as ColumnId,
      source.index,
      destination.index
    );
  };

  if (!hydrated) {
    return (
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/30 p-8 text-sm text-slate-400">
        Loading board...
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {columnOrder.slice(0, 3).map((columnId) => (
          <Column key={columnId} column={columns[columnId]} />
        ))}
      </div>

      <div className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-slate-300">Backlog</h2>
        <Column column={columns.backlog} />
      </div>

      <footer className="mt-6 rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4 text-sm text-slate-300">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Старые выполненные задачи
          </h3>
          <span className="text-xs text-slate-500">{oldDoneTasks.length} шт.</span>
        </div>
        {oldDoneTasks.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500">
            Пока нет задач, ушедших в архив.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {oldDoneTasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-800/70 bg-slate-950/40 px-3 py-2"
              >
                <span className="truncate text-slate-200">{task.title}</span>
                <span className="text-[0.7rem] uppercase tracking-[0.2em] text-slate-500">
                  {formatCompletedAt(task.completedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </footer>
    </DragDropContext>
  );
}
