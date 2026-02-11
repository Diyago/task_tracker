"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type DatePickerProps = {
  value?: Date;
  onChange: (date?: Date) => void;
  displayLabel?: string;
  overdue?: boolean;
  placeholder?: string;
};

export function DatePicker({
  value,
  onChange,
  displayLabel,
  overdue,
  placeholder = "Pick a date"
}: DatePickerProps) {
  const label = displayLabel ?? (value ? format(value, "MMM d, yyyy") : placeholder);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-9 justify-start gap-2 border-slate-700/60 bg-slate-950/60 text-left text-xs",
            !value && "text-muted-foreground",
            overdue && "border-rose-500/60 text-rose-200"
          )}
        >
          <CalendarIcon className="h-4 w-4 opacity-70" />
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value} onSelect={onChange} initialFocus />
      </PopoverContent>
    </Popover>
  );
}
