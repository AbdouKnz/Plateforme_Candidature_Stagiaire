"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useCandidatures } from "@/hooks/use-candidatures";
import { format, startOfWeek, endOfWeek } from "date-fns";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { CalendarDays } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getWeekRange(date: Date) {
  const monday = startOfWeek(date, { weekStartsOn: 1 });
  const sunday = endOfWeek(date, { weekStartsOn: 1 });
  return { start: monday, end: sunday };
}

function getMonthDays(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const count = new Date(year, month + 1, 0).getDate();
  const days: { date: Date; label: string }[] = [];
  for (let i = 1; i <= count; i++) {
    const d = new Date(year, month, i);
    days.push({ date: d, label: format(d, "MMM dd") });
  }
  return days;
}

export function DashboardChartsCard() {
  const { t } = useTranslation();
  const { data: candidatures } = useCandidatures();
  const [range, setRange] = useState<"week" | "month" | "year">("week");

  const now = new Date();
  const weekRange = getWeekRange(now);

  const weekDays = DAYS.map((day, i) => {
    const d = new Date(weekRange.start);
    d.setDate(d.getDate() + i);
    return { date: d, label: day, fullLabel: format(d, "MMM dd") };
  });

  const monthDays = getMonthDays(now);

  const chartData = (() => {
    if (!candidatures) return [];

    const countForDay = (day: Date) => {
      const key = format(day, "yyyy-MM-dd");
      return candidatures.filter((c) => {
        if (!c.date_application) return false;
        return c.date_application.startsWith(key);
      }).length;
    };

    if (range === "week") {
      return weekDays.map((d) => ({
        day: d.label,
        date: d.fullLabel,
        applications: countForDay(d.date),
      }));
    }

    if (range === "month") {
      return monthDays.map((d) => ({
        day: format(d.date, "EEE"),
        date: d.label,
        applications: countForDay(d.date),
      }));
    }

    const year = now.getFullYear();
    return Array.from({ length: 12 }, (_, i) => {
      const month = String(i + 1).padStart(2, "0");
      const prefix = `${year}-${month}`;
      return {
        day: format(new Date(year, i, 1), "MMM"),
        date: format(new Date(year, i, 1), "MMM"),
        applications: candidatures.filter((c) => {
          if (!c.date_application) return false;
          return c.date_application.startsWith(prefix);
        }).length,
      };
    });
  })();

  const maxVal = Math.max(...chartData.map((d) => d.applications), 1);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between px-8 pt-8 pb-2">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <CalendarDays className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground leading-tight">
              {t("candidatures_per_day") || "Internship Applications Per Day"}
            </h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              {t("candidatures_per_day_desc") || "Number of applications received each day."}
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end px-8 pt-2 pb-2">
        <Select value={range} onValueChange={(v) => setRange(v as "week" | "month" | "year")}>
          <SelectTrigger className="h-7 w-[130px] text-xs font-medium px-2.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="px-8 pb-8 pt-4">
        <div className="rounded-xl border border-border/50 overflow-hidden">
          <ResponsiveContainer width="100%" height={360}>
            <BarChart
              key={range}
              data={chartData}
              margin={{ top: 24, right: 16, left: 0, bottom: 8 }}
              barCategoryGap={range === "week" ? "45%" : range === "year" ? "55%" : "25%"}
            >
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#A78BFA" />
                  <stop offset="100%" stopColor="#7C3AED" />
                </linearGradient>
                <filter id="barShadow">
                  <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#7C3AED" floodOpacity="0.18" />
                </filter>
              </defs>

              <CartesianGrid horizontal={true} vertical={false} strokeDasharray="4 4" className="stroke-border/50" />

              <XAxis
                dataKey={range === "week" ? "day" : "date"}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)", fontWeight: 400 }}
                tickMargin={8}
                interval={range === "month" ? Math.ceil(chartData.length / 12) : range === "year" ? 0 : 0}
              />

              <YAxis hide={true} domain={[0, maxVal + Math.ceil(maxVal * 0.2)]} allowDecimals={false} />

              <Tooltip
                cursor={{ fill: "transparent" }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const val = payload[0].value as number;
                  const dayData = chartData.find((d) => d.day === label || d.date === label);
                  return (
                    <div className="rounded-lg border border-border bg-card px-3 py-2.5 shadow-lg min-w-[90px]">
                      <p className="text-[11px] font-medium text-muted-foreground">{dayData?.date || label}</p>
                      <p className="text-lg font-bold text-foreground tracking-tight mt-0.5">{val}</p>
                    </div>
                  );
                }}
              />

              <Bar
                dataKey="applications"
                fill="url(#barGradient)"
                radius={[6, 6, 0, 0]}
                maxBarSize={36}
                filter="url(#barShadow)"
                animationBegin={100}
                animationDuration={800}
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <style>{`
        .recharts-bar-rectangle {
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          transform-origin: bottom center;
        }
        .recharts-bar-rectangle:hover {
          filter: brightness(1.15) drop-shadow(0 4px 12px rgba(124,58,237,0.25));
          transform: scaleY(1.04);
        }
      `}</style>
    </div>
  );
}
