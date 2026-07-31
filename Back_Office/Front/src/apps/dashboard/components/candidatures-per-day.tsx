"use client";

import { useEffect, useRef } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useTranslation } from "react-i18next";
import { useCandidatures } from "@/hooks/use-candidatures";
import { format, parseISO, subDays, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { cn } from "@/lib/utils";
import { useState } from "react";

type Range = "week" | "month" | "custom";

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

export function CandidaturesPerDay() {
  const { t } = useTranslation();
  const { data: candidatures } = useCandidatures();
  const [range, setRange] = useState<Range>("week");

  const now = new Date();

  const weekRange = getWeekRange(now);

  const weekDays = DAYS.map((day, i) => {
    const d = new Date(weekRange.start);
    d.setDate(d.getDate() + i);
    return { date: d, label: day, fullLabel: format(d, "MMM dd") };
  });

  const monthDays = getMonthDays(now);

  const { chartData, total, lastWeekTotal } = (() => {
    if (!candidatures) return { chartData: [], total: 0, lastWeekTotal: 0 };

    const lastWeek = getWeekRange(subDays(now, 7));

    const countForDay = (day: Date) => {
      const key = format(day, "yyyy-MM-dd");
      return candidatures.filter((c) => {
        if (!c.date_application) return false;
        return c.date_application.startsWith(key);
      }).length;
    };

    const countInRange = (start: Date, end: Date) =>
      candidatures.filter((c) => {
        if (!c.date_application) return false;
        const d = parseISO(c.date_application);
        return isWithinInterval(d, { start, end });
      }).length;

    if (range === "week") {
      const data = weekDays.map((d) => ({
        day: d.label,
        date: d.fullLabel,
        applications: countForDay(d.date),
      }));
      const t = data.reduce((s, d) => s + d.applications, 0);
      const lwt = countInRange(lastWeek.start, lastWeek.end);
      return { chartData: data, total: t, lastWeekTotal: lwt };
    }

    const data = monthDays.map((d) => ({
      day: format(d.date, "EEE"),
      date: d.label,
      applications: countForDay(d.date),
    }));
    const t = data.reduce((s, d) => s + d.applications, 0);
    const lwt = countInRange(subDays(now, 60), subDays(now, 30));
    return { chartData: data, total: t, lastWeekTotal: lwt };
  })();

  const maxVal = Math.max(...chartData.map((d) => d.applications), 1);

  const percentChange =
    lastWeekTotal > 0
      ? Math.round(((total - lastWeekTotal) / lastWeekTotal) * 100)
      : total > 0 ? 100 : 0;

  const ranges: { label: string; value: Range }[] = [
    { label: "This Week", value: "week" },
    { label: "This Month", value: "month" },
  ];

  return (
    <div
      className={cn(
        "col-span-4 overflow-hidden rounded-2xl border",
        "border-border bg-card dark:bg-card",
        "shadow-sm",
      )}
    >
      <div className="flex items-center justify-between px-8 pt-8 pb-2">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18" />
              <path d="M9 21V9" />
            </svg>
          </div>
          <div>
            <h1 className="text-[28px] font-bold tracking-tight text-foreground leading-tight">
              {t("candidatures_per_day") || "Internship Applications Per Day"}
            </h1>
            <p className="text-[15px] text-muted-foreground mt-0.5">
              Number of applications received each day.
            </p>
          </div>
        </div>

        <div className="flex gap-1 rounded-xl border border-border bg-muted/50 p-1">
          {ranges.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={cn(
                "px-4 py-1.5 text-[13px] font-medium rounded-lg transition-all duration-200",
                range === r.value
                  ? "bg-card text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-8 pt-4 pb-2">
        <div className="inline-flex items-center gap-4 rounded-xl bg-accent/50 px-5 py-3">
          <div>
            <p className="text-[13px] font-medium text-muted-foreground">
              Total Applications
            </p>
            <p className="text-[32px] font-bold text-foreground tracking-tight leading-none">
              {total}
            </p>
          </div>
          <div className="w-px h-10 bg-border" />
          <div>
            <p className="text-[13px] font-medium text-muted-foreground">
              vs Last {range === "month" ? "Month" : "Week"}
            </p>
            <div className="flex items-center gap-1.5">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={percentChange >= 0 ? "text-emerald-500" : "text-red-500"}
              >
                {percentChange >= 0 ? (
                  <path d="M18 15l-6-6-6 6" />
                ) : (
                  <path d="M6 9l6 6 6-6" />
                )}
              </svg>
              <span
                className={cn(
                  "text-[20px] font-bold tracking-tight",
                  percentChange >= 0 ? "text-emerald-500" : "text-red-500",
                )}
              >
                {percentChange > 0 ? "+" : ""}
                {percentChange}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 pb-8 pt-4">
        <div className="rounded-xl border border-border/50 overflow-hidden">
          <ResponsiveContainer width="100%" height={360}>
            <BarChart
              data={chartData}
              margin={{ top: 24, right: 16, left: 0, bottom: 8 }}
              barCategoryGap={range === "week" ? "30%" : "10%"}
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

              <CartesianGrid
                horizontal={true}
                vertical={false}
                strokeDasharray="4 4"
                className="stroke-border/50"
              />

              <XAxis
                dataKey={range === "week" ? "day" : "date"}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 13, fill: "var(--muted-foreground)", fontWeight: 500 }}
                tickMargin={8}
                interval={range === "month" ? Math.ceil(chartData.length / 12) : 0}
              />

              <YAxis
                hide={true}
                domain={[0, maxVal + Math.ceil(maxVal * 0.2)]}
                allowDecimals={false}
              />

              <Tooltip
                cursor={{ fill: "transparent" }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const val = payload[0].value as number;
                  const pct = total > 0 ? ((val / total) * 100).toFixed(1) : "0";
                  const dayData = chartData.find((d) => d.day === label || d.date === label);
                  return (
                    <div className="rounded-xl border border-border bg-card px-5 py-4 shadow-lg min-w-[160px]">
                      <p className="text-[13px] font-semibold text-muted-foreground mb-1">
                        {dayData?.date || label}
                      </p>
                      <p className="text-2xl font-bold text-foreground tracking-tight">
                        {val}
                      </p>
                      <div className="mt-1 h-0.5 w-full rounded-full bg-muted relative overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {pct}% of total
                      </p>
                    </div>
                  );
                }}
              />

              <Bar
                dataKey="applications"
                fill="url(#barGradient)"
                radius={[18, 18, 0, 0]}
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
