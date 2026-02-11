import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { addDays, format } from "date-fns";

export type ColumnId = "todo" | "in-progress" | "done" | "backlog";
export const DEFAULT_COLUMN_ORDER: ColumnId[] = ["todo", "in-progress", "done", "backlog"];

export type Task = {
  id: string;
  title: string;
  dueDate?: string;
  timeEstimate: number;
  complexity?: string;
  tags: string[];
  jiraLink?: string;
  notes?: string;
  columnId: ColumnId;
  completedAt?: string;
};

export type Column = {
  id: ColumnId;
  title: string;
  description: string;
  accent: string;
  accentText: string;
  softBg: string;
  tasks: Task[];
};

type BoardState = {
  columnOrder: ColumnId[];
  columns: Record<ColumnId, Column>;
  doneArchiveHours: number;
  addTask: (columnId: ColumnId) => void;
  updateTask: (taskId: string, patch: Partial<Task>) => void;
  moveTask: (
    sourceColumnId: ColumnId,
    destinationColumnId: ColumnId,
    sourceIndex: number,
    destinationIndex: number
  ) => void;
  refreshDoneOrdering: () => void;
  setDoneArchiveHours: (hours: number) => void;
  resetBoard: () => void;
};

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const formatDate = (date: Date) => format(date, "yyyy-MM-dd");

export const DEFAULT_DONE_ARCHIVE_HOURS = 24;
const hoursToMs = (hours: number) => hours * 60 * 60 * 1000;
export const isTaskOlderThan = (task: Task, now: number, hours: number) =>
  Boolean(task.completedAt) && now - new Date(task.completedAt!).getTime() >= hoursToMs(hours);

const reorderDoneTasks = (tasks: Task[], now: number, hours: number) => {
  const normalized = tasks.map((task) =>
    task.completedAt ? task : { ...task, completedAt: new Date(now).toISOString() }
  );
  const recent: Task[] = [];
  const old: Task[] = [];
  for (const task of normalized) {
    if (isTaskOlderThan(task, now, hours)) {
      old.push(task);
    } else {
      recent.push(task);
    }
  }
  return [...recent, ...old];
};

export const createInitialColumns = (): Record<ColumnId, Column> => {
  const today = new Date();

  return {
    todo: {
      id: "todo",
      title: "To Do",
      description: "Queued for today",
      accent: "border-sky-500/60",
      accentText: "text-sky-200",
      softBg: "bg-sky-500/10",
      tasks: [
        {
          id: createId(),
          title: "Plan daily priorities",
          dueDate: formatDate(today),
          timeEstimate: 0.25,
          tags: ["planning"],
          columnId: "todo"
        }
      ]
    },
    "in-progress": {
      id: "in-progress",
      title: "In Progress",
      description: "Currently being worked",
      accent: "border-amber-400/60",
      accentText: "text-amber-200",
      softBg: "bg-amber-400/10",
      tasks: [
        {
          id: createId(),
          title: "Debug churn feature lag",
          dueDate: formatDate(addDays(today, 1)),
          timeEstimate: 1.5,
          tags: ["bug"],
          columnId: "in-progress"
        }
      ]
    },
    done: {
      id: "done",
      title: "Done",
      description: "Completed today",
      accent: "border-emerald-500/60",
      accentText: "text-emerald-200",
      softBg: "bg-emerald-500/10",
      tasks: []
    },
    backlog: {
      id: "backlog",
      title: "Backlog",
      description: "Parking lot for later",
      accent: "border-slate-500/50",
      accentText: "text-slate-200",
      softBg: "bg-slate-500/10",
      tasks: [
        {
          id: createId(),
          title: "Refine model monitoring roadmap",
          dueDate: formatDate(addDays(today, 7)),
          timeEstimate: 2,
          tags: ["strategy"],
          columnId: "backlog"
        }
      ]
    }
  };
};

export const useBoardStore = create<BoardState>()(
  persist(
    (set, get) => ({
      columnOrder: DEFAULT_COLUMN_ORDER,
      columns: createInitialColumns(),
      doneArchiveHours: DEFAULT_DONE_ARCHIVE_HOURS,
      addTask: (columnId) =>
        set((state) => {
          const column = state.columns[columnId];
          if (!column) return state;
          const now = Date.now();
          const doneArchiveHours = get().doneArchiveHours;
          const newTask: Task = {
            id: createId(),
            title: "New task",
            dueDate: formatDate(addDays(new Date(), 2)),
            timeEstimate: 1,
            tags: [],
            columnId,
            completedAt: columnId === "done" ? new Date(now).toISOString() : undefined
          };
          const nextTasks =
            columnId === "done"
              ? reorderDoneTasks([...column.tasks, newTask], now, doneArchiveHours)
              : [...column.tasks, newTask];
          return {
            columns: {
              ...state.columns,
              [columnId]: {
                ...column,
                tasks: nextTasks
              }
            }
          };
        }),
      updateTask: (taskId, patch) =>
        set((state) => {
          const nextColumns = { ...state.columns };
          for (const columnId of state.columnOrder) {
            const column = nextColumns[columnId];
            const taskIndex = column.tasks.findIndex((task) => task.id === taskId);
            if (taskIndex === -1) continue;
            const updated = {
              ...column.tasks[taskIndex],
              ...patch
            };
            const nextTasks = [...column.tasks];
            nextTasks[taskIndex] = updated;
            nextColumns[columnId] = { ...column, tasks: nextTasks };
            return { columns: nextColumns };
          }
          return state;
        }),
      moveTask: (sourceColumnId, destinationColumnId, sourceIndex, destinationIndex) =>
        set((state) => {
          const sourceColumn = state.columns[sourceColumnId];
          const destinationColumn = state.columns[destinationColumnId];
          if (!sourceColumn || !destinationColumn) return state;

          const sourceTasks = [...sourceColumn.tasks];
          const [moved] = sourceTasks.splice(sourceIndex, 1);
          if (!moved) return state;
          const now = Date.now();
          const doneArchiveHours = get().doneArchiveHours;

          if (sourceColumnId === destinationColumnId) {
            sourceTasks.splice(destinationIndex, 0, moved);
            const nextSourceTasks =
              sourceColumnId === "done"
                ? reorderDoneTasks(sourceTasks, now, doneArchiveHours)
                : sourceTasks;
            return {
              columns: {
                ...state.columns,
                [sourceColumnId]: { ...sourceColumn, tasks: nextSourceTasks }
              }
            };
          }

          const movedToDone =
            destinationColumnId === "done"
              ? {
                  ...moved,
                  columnId: destinationColumnId,
                  completedAt: moved.completedAt ?? new Date(now).toISOString()
                }
              : { ...moved, columnId: destinationColumnId, completedAt: undefined };

          const destinationTasks = [...destinationColumn.tasks];
          destinationTasks.splice(destinationIndex, 0, movedToDone);

          const nextSourceTasks =
            sourceColumnId === "done"
              ? reorderDoneTasks(sourceTasks, now, doneArchiveHours)
              : sourceTasks;
          const nextDestinationTasks =
            destinationColumnId === "done"
              ? reorderDoneTasks(destinationTasks, now, doneArchiveHours)
              : destinationTasks;

          return {
            columns: {
              ...state.columns,
              [sourceColumnId]: { ...sourceColumn, tasks: nextSourceTasks },
              [destinationColumnId]: { ...destinationColumn, tasks: nextDestinationTasks }
            }
          };
        }),
      refreshDoneOrdering: () =>
        set((state) => {
          const doneColumn = state.columns.done;
          if (!doneColumn || doneColumn.tasks.length === 0) return state;
          const now = Date.now();
          const nextTasks = reorderDoneTasks(doneColumn.tasks, now, state.doneArchiveHours);
          const isSame =
            nextTasks.length === doneColumn.tasks.length &&
            nextTasks.every((task, index) => task.id === doneColumn.tasks[index]?.id);
          if (isSame) return state;
          return {
            columns: {
              ...state.columns,
              done: { ...doneColumn, tasks: nextTasks }
            }
          };
        }),
      setDoneArchiveHours: (hours) =>
        set((state) => {
          const nextHours = Number.isFinite(hours)
            ? Math.max(1, Math.round(hours))
            : state.doneArchiveHours;
          if (nextHours === state.doneArchiveHours) return state;
          const doneColumn = state.columns.done;
          const now = Date.now();
          const nextTasks =
            doneColumn.tasks.length > 0
              ? reorderDoneTasks(doneColumn.tasks, now, nextHours)
              : doneColumn.tasks;
          return {
            doneArchiveHours: nextHours,
            columns: {
              ...state.columns,
              done: { ...doneColumn, tasks: nextTasks }
            }
          };
        }),
      resetBoard: () =>
        set(() => ({
          columns: createInitialColumns(),
          columnOrder: DEFAULT_COLUMN_ORDER
        }))
    }),
    {
      name: "manager-hybrid-kanban",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ columns: state.columns, doneArchiveHours: state.doneArchiveHours }),
      version: 1,
      migrate: (persistedState) => {
        const maybe = persistedState as Partial<BoardState> & {
          columns?: Record<string, Column>;
          doneArchiveHours?: number;
        };
        const columns = maybe.columns;
        const hasAll = DEFAULT_COLUMN_ORDER.every((id) => columns?.[id as ColumnId]);
        if (!columns || !hasAll) {
          return {
            columns: createInitialColumns(),
            columnOrder: DEFAULT_COLUMN_ORDER,
            doneArchiveHours: DEFAULT_DONE_ARCHIVE_HOURS
          } satisfies Partial<BoardState>;
        }
        return {
          columns: columns as Record<ColumnId, Column>,
          columnOrder: DEFAULT_COLUMN_ORDER,
          doneArchiveHours: Number.isFinite(maybe.doneArchiveHours)
            ? Math.max(1, Math.round(maybe.doneArchiveHours as number))
            : DEFAULT_DONE_ARCHIVE_HOURS
        } satisfies Partial<BoardState>;
      },
      skipHydration: true
    }
  )
);
