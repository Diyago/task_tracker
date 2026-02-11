"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type TimerMode = "focus" | "break" | "longBreak";

type TimerSettings = {
  focusMinutes: number;
  breakMinutes: number;
  longBreakMinutes: number;
  longBreakEvery: number;
};

const STORAGE_KEY = "tomato-timer-settings";

const DEFAULT_SETTINGS: TimerSettings = {
  focusMinutes: 25,
  breakMinutes: 5,
  longBreakMinutes: 15,
  longBreakEvery: 4
};

const MODE_LABELS: Record<TimerMode, string> = {
  focus: "Фокус",
  break: "Перерыв",
  longBreak: "Длинный перерыв"
};

const clampMinutes = (value: number, fallback: number) => {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(90, Math.max(1, Math.round(value)));
};

const clampEvery = (value: number, fallback: number) => {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(8, Math.max(2, Math.round(value)));
};

const formatTime = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

const getModeDuration = (mode: TimerMode, settings: TimerSettings) => {
  if (mode === "focus") return settings.focusMinutes;
  if (mode === "break") return settings.breakMinutes;
  return settings.longBreakMinutes;
};

export function TomatoTimer() {
  const [mode, setMode] = React.useState<TimerMode>("focus");
  const [settings, setSettings] = React.useState<TimerSettings>(DEFAULT_SETTINGS);
  const [remainingSeconds, setRemainingSeconds] = React.useState(
    DEFAULT_SETTINGS.focusMinutes * 60
  );
  const [isRunning, setIsRunning] = React.useState(false);
  const [sessions, setSessions] = React.useState(0);
  const endAtRef = React.useRef<number | null>(null);
  const intervalRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Partial<TimerSettings>;
      const nextSettings: TimerSettings = {
        focusMinutes: clampMinutes(parsed.focusMinutes ?? DEFAULT_SETTINGS.focusMinutes, DEFAULT_SETTINGS.focusMinutes),
        breakMinutes: clampMinutes(parsed.breakMinutes ?? DEFAULT_SETTINGS.breakMinutes, DEFAULT_SETTINGS.breakMinutes),
        longBreakMinutes: clampMinutes(
          parsed.longBreakMinutes ?? DEFAULT_SETTINGS.longBreakMinutes,
          DEFAULT_SETTINGS.longBreakMinutes
        ),
        longBreakEvery: clampEvery(parsed.longBreakEvery ?? DEFAULT_SETTINGS.longBreakEvery, DEFAULT_SETTINGS.longBreakEvery)
      };
      setSettings(nextSettings);
      setRemainingSeconds(getModeDuration(mode, nextSettings) * 60);
    } catch {
      // ignore invalid storage
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  React.useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = window.setInterval(() => {
      if (!endAtRef.current) return;
      const next = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000));
      setRemainingSeconds(next);
    }, 250);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  React.useEffect(() => {
    if (!isRunning || remainingSeconds > 0) return;
    setIsRunning(false);

    if (mode === "focus") {
      setSessions((prev) => {
        const next = prev + 1;
        const nextMode = next % settings.longBreakEvery === 0 ? "longBreak" : "break";
        setMode(nextMode);
        setRemainingSeconds(getModeDuration(nextMode, settings) * 60);
        return next;
      });
    } else {
      setMode("focus");
      setRemainingSeconds(settings.focusMinutes * 60);
    }
  }, [isRunning, remainingSeconds, mode, settings]);

  const totalSeconds = getModeDuration(mode, settings) * 60;
  const progress = totalSeconds === 0 ? 0 : (totalSeconds - remainingSeconds) / totalSeconds;

  const handleStart = () => {
    if (isRunning) return;
    endAtRef.current = Date.now() + remainingSeconds * 1000;
    setIsRunning(true);
  };

  const handlePause = () => {
    if (!isRunning) return;
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setRemainingSeconds(getModeDuration(mode, settings) * 60);
  };

  const handleSkip = () => {
    setIsRunning(false);
    if (mode === "focus") {
      setSessions((prev) => {
        const next = prev + 1;
        const nextMode = next % settings.longBreakEvery === 0 ? "longBreak" : "break";
        setMode(nextMode);
        setRemainingSeconds(getModeDuration(nextMode, settings) * 60);
        return next;
      });
    } else {
      setMode("focus");
      setRemainingSeconds(settings.focusMinutes * 60);
    }
  };

  const handleSettingChange = (
    key: keyof TimerSettings,
    value: number,
    clamp: (value: number, fallback: number) => number
  ) => {
    setSettings((prev) => {
      const nextValue = clamp(value, prev[key]);
      const next = { ...prev, [key]: nextValue } as TimerSettings;
      if (!isRunning && (key === "focusMinutes" || key === "breakMinutes" || key === "longBreakMinutes")) {
        setRemainingSeconds(getModeDuration(mode, next) * 60);
      }
      return next;
    });
  };

  return (
    <Card className="w-full max-w-xl border-slate-800/60 bg-slate-900/40 text-slate-100 shadow-[0_0_0_1px_rgba(15,23,42,0.4)]">
      <CardHeader className="gap-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Томато таймер</CardTitle>
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.2em]",
              mode === "focus" && "border-rose-400/60 bg-rose-500/15 text-rose-200",
              mode === "break" && "border-sky-400/60 bg-sky-500/15 text-sky-200",
              mode === "longBreak" && "border-emerald-400/60 bg-emerald-500/15 text-emerald-200"
            )}
          >
            {MODE_LABELS[mode]}
          </span>
        </div>
        <div className="flex items-end justify-between gap-4">
          <div className="text-4xl font-semibold tabular-nums text-slate-50">
            {formatTime(remainingSeconds)}
          </div>
          <div className="text-right text-xs text-slate-400">
            <div>Сессии: {sessions}</div>
            <div>{settings.longBreakEvery} фокуса до длинного</div>
          </div>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              mode === "focus" && "bg-rose-400",
              mode === "break" && "bg-sky-400",
              mode === "longBreak" && "bg-emerald-400"
            )}
            style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <label className="flex flex-col gap-1 text-xs text-slate-400">
            Фокус
            <Input
              type="number"
              min={1}
              max={90}
              value={settings.focusMinutes}
              onChange={(event) =>
                handleSettingChange("focusMinutes", Number(event.target.value), clampMinutes)
              }
              className="h-9 border-slate-700/60 bg-slate-950/40 text-xs text-slate-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-400">
            Перерыв
            <Input
              type="number"
              min={1}
              max={90}
              value={settings.breakMinutes}
              onChange={(event) =>
                handleSettingChange("breakMinutes", Number(event.target.value), clampMinutes)
              }
              className="h-9 border-slate-700/60 bg-slate-950/40 text-xs text-slate-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-400">
            Длинный
            <Input
              type="number"
              min={1}
              max={90}
              value={settings.longBreakMinutes}
              onChange={(event) =>
                handleSettingChange("longBreakMinutes", Number(event.target.value), clampMinutes)
              }
              className="h-9 border-slate-700/60 bg-slate-950/40 text-xs text-slate-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-400">
            Каждые
            <Input
              type="number"
              min={2}
              max={8}
              value={settings.longBreakEvery}
              onChange={(event) =>
                handleSettingChange("longBreakEvery", Number(event.target.value), clampEvery)
              }
              className="h-9 border-slate-700/60 bg-slate-950/40 text-xs text-slate-100"
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={handleStart} className="bg-rose-500/80 text-slate-50 hover:bg-rose-500">
            Старт
          </Button>
          <Button size="sm" variant="outline" onClick={handlePause} className="border-slate-700/70 bg-slate-950/40">
            Пауза
          </Button>
          <Button size="sm" variant="outline" onClick={handleReset} className="border-slate-700/70 bg-slate-950/40">
            Сброс
          </Button>
          <Button size="sm" variant="outline" onClick={handleSkip} className="border-slate-700/70 bg-slate-950/40">
            Пропустить
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
