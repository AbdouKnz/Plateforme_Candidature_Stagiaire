"use client";

import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useCandidatures } from "@/hooks/use-candidatures";
import { format, startOfWeek, endOfWeek } from "date-fns";
import {
  Bar,
  BarChart,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { CalendarDays, PieChart as PieChartIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const PIE_COLORS = [
  "#7C3AED", "#A78BFA", "#C4B5FD", "#6D28D9", "#8B5CF6",
  "#5B21B6", "#DDD6FE", "#4C1D95", "#9D8DF3", "#7C3AED",
  "#A78BFA", "#C4B5FD", "#6D28D9", "#8B5CF6", "#5B21B6",
];

type Tab = "per_day" | "par_sujet";

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
  const [tab, setTab] = useState<Tab>("per_day");
  const [range, setRange] = useState<"week" | "month" | "year">("week");

  const now = new Date();
  const weekRange = getWeekRange(now);

  const weekDays = DAYS.map((day, i) => {
    const d = new Date(weekRange.start);
    d.setDate(d.getDate() + i);
    return { date: d, label: day, fullLabel: format(d, "MMM dd") };
  });

  const monthDays = getMonthDays(now);

  const { chartData, total } = (() => {
    if (!candidatures) return { chartData: [], total: 0 };

    const countForDay = (day: Date) => {
      const key = format(day, "yyyy-MM-dd");
      return candidatures.filter((c) => {
        if (!c.date_application) return false;
        return c.date_application.startsWith(key);
      }).length;
    };

    if (range === "week") {
      const data = weekDays.map((d) => ({
        day: d.label,
        date: d.fullLabel,
        applications: countForDay(d.date),
      }));
      return { chartData: data, total: data.reduce((s, d) => s + d.applications, 0) };
    }

    if (range === "month") {
      const data = monthDays.map((d) => ({
        day: format(d.date, "EEE"),
        date: d.label,
        applications: countForDay(d.date),
      }));
      return { chartData: data, total: data.reduce((s, d) => s + d.applications, 0) };
    }

    const year = now.getFullYear();
    const data = Array.from({ length: 12 }, (_, i) => {
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
    return { chartData: data, total: data.reduce((s, d) => s + d.applications, 0) };
  })();

  const maxVal = Math.max(...chartData.map((d) => d.applications), 1);

  const subjectData = useMemo(() => {
    if (!candidatures) return [];
    const counts: Record<string, number> = {};
    for (const c of candidatures) {
      const name = (c.subject_name || "Unknown").trim();
      counts[name] = (counts[name] || 0) + 1;
    }
    return Object.entries(counts)
      .filter(([, value]) => value > 0)
      .map(([name], i) => ({
        name,
        value: counts[name],
        color: PIE_COLORS[i % PIE_COLORS.length],
      }));
  }, [candidatures]);

  const subjectTotal = subjectData.reduce((s, item) => s + item.value, 0);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between px-8 pt-8 pb-2">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            {tab === "per_day" ? (
              <CalendarDays className="size-5 text-primary" />
            ) : (
              <PieChartIcon className="size-5 text-primary" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground leading-tight">
              {tab === "per_day"
                ? (t("candidatures_per_day") || "Internship Applications Per Day")
                : (t("candidatures_par_sujets") || "Candidatures par sujets")}
            </h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              {tab === "per_day"
                ? (t("candidatures_per_day_desc") || "Number of applications received each day.")
                : (t("candidatures_par_sujets_desc") || "Number of applications per subject")}
            </p>
          </div>
        </div>

        <div className="flex gap-1.5 bg-muted/50 p-1 rounded-xl">
          <button
            onClick={() => setTab("per_day")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
              tab === "per_day"
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("per_day") || "Par jour"}
          </button>
          <button
            onClick={() => setTab("par_sujet")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
              tab === "par_sujet"
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("par_sujet") || "Par sujet"}
          </button>
        </div>
      </div>

      {tab === "per_day" && (
        <>
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
        </>
      )}

      {tab === "par_sujet" && (
        <div className="px-8 pb-8 pt-4">
          {subjectData.length === 0 ? (
            <div className="flex h-[360px] items-center justify-center text-sm text-muted-foreground">
              No data available
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="w-full lg:w-1/2 flex justify-center">
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <defs>
                      {subjectData.map((entry, index) => (
                        <filter key={index} id={`pieShadow-${index}`}>
                          <feDropShadow dx="0" dy="2" stdDeviation="6" floodColor={entry.color} floodOpacity="0.25" />
                        </filter>
                      ))}
                    </defs>
                    <Pie
                      data={subjectData}
                      cx="50%"
                      cy="50%"
                      innerRadius={72}
                      outerRadius={120}
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={0}
                      activeIndex={undefined}
                      activeShape={undefined}
                      onMouseEnter={undefined}
                      onMouseLeave={undefined}
                    >
                      {subjectData.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={entry.color}
                          filter={`url(#pieShadow-${index})`}
                          className="transition-all duration-300 ease-out"
                          style={{ cursor: "pointer" }}
                          onMouseEnter={(e) => {
                            const target = e.target as HTMLElement;
                            target.style.transform = "scale(1.04)";
                            target.style.transformOrigin = "center center";
                            target.style.filter = `url(#pieShadow-${index}) brightness(1.1)`;
                          }}
                          onMouseLeave={(e) => {
                            const target = e.target as HTMLElement;
                            target.style.transform = "scale(1)";
                            target.style.filter = `url(#pieShadow-${index})`;
                          }}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const item = payload[0].payload;
                        const pct = subjectTotal > 0 ? Math.round((item.value / subjectTotal) * 100) : 0;
                        return (
                          <div className="rounded-xl border border-border/50 bg-card px-4 py-3 shadow-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                              <span className="text-sm font-medium text-foreground">{item.name}</span>
                            </div>
                            <p className="text-lg font-bold text-foreground tracking-tight">{item.value}</p>
                            <p className="text-xs text-muted-foreground">{pct}% of total</p>
                          </div>
                        );
                      }}
                      cursor={{ fill: "transparent" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="w-full lg:w-1/2 space-y-3">
                {subjectData.map((item, index) => {
                  const pct = subjectTotal > 0 ? Math.round((item.value / subjectTotal) * 100) : 0;
                  return (
                    <div
                      key={index}
                      className="group flex items-center justify-between rounded-xl border border-transparent px-4 py-2.5 transition-all duration-200 hover:border-border/50 hover:bg-muted/30 hover:shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-3 rounded-full shrink-0 ring-2 ring-offset-1 ring-offset-background transition-all duration-200 group-hover:ring-4" style={{ backgroundColor: item.color }} />
                        <span className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors duration-200">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-sm font-semibold text-foreground tabular-nums">{item.value}</span>
                        <span className="text-xs font-medium text-muted-foreground min-w-[44px] text-right tabular-nums">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

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
