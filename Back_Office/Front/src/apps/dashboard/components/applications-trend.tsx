import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useTranslation } from "react-i18next";
import { useCandidatures } from "@/hooks/use-candidatures";
import { useMemo, useState } from "react";
import { format, parseISO, subDays, startOfMonth, startOfYear, isWithinInterval } from "date-fns";
import { CalendarDays } from "lucide-react";

type FilterType = "7days" | "30days" | "month" | "year";

export function ApplicationsTrend() {
  const { t } = useTranslation();
  const { data: candidatures } = useCandidatures();
  const [filter, setFilter] = useState<FilterType>("30days");

  const chartData = useMemo(() => {
    if (!candidatures) return [];
    const now = new Date();
    let startDate: Date;
    switch (filter) {
      case "7days": startDate = subDays(now, 7); break;
      case "30days": startDate = subDays(now, 30); break;
      case "month": startDate = startOfMonth(now); break;
      case "year": startDate = startOfYear(now); break;
      default: startDate = subDays(now, 30);
    }
    const counts: Record<string, number> = {};
    for (const c of candidatures) {
      if (!c.date_application) continue;
      const date = parseISO(c.date_application);
      if (!isWithinInterval(date, { start: startDate, end: now })) continue;
      const key = format(date, filter === "year" ? "MMM" : "MMM dd");
      counts[key] = (counts[key] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([date, count]) => ({ date, applications: count }))
      .sort((a, b) => {
        const [da, db] = [parseISO(a.date), parseISO(b.date)];
        return da.getTime() - db.getTime();
      });
  }, [candidatures, filter]);

  const filters: { label: string; value: FilterType }[] = [
    { label: "7 days", value: "7days" },
    { label: "30 days", value: "30days" },
    { label: "This Month", value: "month" },
    { label: "This Year", value: "year" },
  ];

  return (
    <Card className="border-border/40 rounded-2xl shadow-sm fade-in">
      <CardHeader className="px-6 pt-6 pb-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
              <CalendarDays className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{t("candidatures_per_day") || "Applications Trend"}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Daily application volume</p>
            </div>
          </div>
          <div className="flex gap-1.5 bg-muted/50 p-1 rounded-xl">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                  filter === f.value
                    ? "bg-white dark:bg-foreground/10 text-foreground shadow-sm border border-border/40"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
            <XAxis
              dataKey="date"
              className="text-xs text-muted-foreground"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              allowDecimals={false}
              className="text-xs text-muted-foreground"
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="rounded-xl border border-border/50 bg-card px-4 py-3 shadow-lg text-sm">
                    <p className="text-muted-foreground mb-1">{label}</p>
                    <p className="font-semibold text-foreground">
                      {payload[0].value} application{payload[0].value !== 1 ? "s" : ""}
                    </p>
                  </div>
                );
              }}
              cursor={{ stroke: "var(--muted)", strokeWidth: 1, strokeDasharray: "4 4" }}
            />
            <Line
              type="monotone"
              dataKey="applications"
              stroke="currentColor"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "currentColor", className: "fill-violet-500 dark:fill-violet-400" }}
              activeDot={{ r: 5, className: "fill-violet-500 dark:fill-violet-400 stroke-background stroke-2" }}
              className="stroke-violet-500 dark:stroke-violet-400"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
