import Board from "@/components/board";
import { TomatoTimer } from "@/components/tomato-timer";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/3 h-96 w-96 rounded-full bg-violet-500/20 blur-[140px]" />
        <div className="absolute top-1/2 right-0 h-80 w-80 rounded-full bg-sky-500/20 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-rose-500/20 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(15,23,42,0.4),rgba(2,6,23,0.9))]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-12">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold md:text-4xl">Задачи</h1>
            <p className="text-sm text-slate-400">
              Фокус-сессии и задачи в одном рабочем пространстве.
            </p>
          </div>
          <TomatoTimer />
        </header>

        <Board />
      </div>
    </main>
  );
}
