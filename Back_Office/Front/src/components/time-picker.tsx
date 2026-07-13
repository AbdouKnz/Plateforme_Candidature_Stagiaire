"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, "0"));

export function TimePicker({ value, onChange, disabled, placeholder }: TimePickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [pendingHour, setPendingHour] = useState("");
  const [pendingMinute, setPendingMinute] = useState("");

  useEffect(() => {
    if (open) {
      if (!value) {
        setPendingHour("08");
        setPendingMinute("00");
      } else {
        const [h, m] = value.split(":");
        setPendingHour(h);
        setPendingMinute(m);
      }
    }
  }, [open, value]);

  const handleValidate = () => {
    onChange(`${pendingHour || "08"}:${pendingMinute || "00"}`);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <Clock className="mr-2 size-4 shrink-0" />
          {value || placeholder || t("select_time")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex flex-col">
          <div className="flex divide-x">
            <ScrollArea className="h-60 w-16 overflow-y-auto">
              <div className="p-1">
                {hours.map((h) => (
                  <button
                    key={h}
                    onClick={() => setPendingHour(h)}
                    className={cn(
                      "flex w-full items-center justify-center rounded-md py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                      pendingHour === h && "bg-primary text-primary-foreground"
                    )}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </ScrollArea>
            <ScrollArea className="h-60 w-16 overflow-y-auto">
              <div className="p-1">
                {minutes.map((m) => (
                  <button
                    key={m}
                    onClick={() => setPendingMinute(m)}
                    className={cn(
                      "flex w-full items-center justify-center rounded-md py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                      pendingMinute === m && "bg-primary text-primary-foreground"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
          <div className="border-t p-2">
            <Button
              size="sm"
              className="w-full"
              onClick={handleValidate}
            >
              {t("validate")}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
