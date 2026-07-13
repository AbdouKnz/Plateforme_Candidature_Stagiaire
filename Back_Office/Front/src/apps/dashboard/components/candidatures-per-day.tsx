"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useCandidatures } from "@/hooks/use-candidatures";
import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";

interface DayCount {
  date: string;
  rawDate: string;
  candidatures: number;
}

export function CandidaturesPerDay() {
  const { t } = useTranslation();
  const { data: candidatures } = useCandidatures();
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  const { years, months, chartData } = useMemo(() => {
    if (!candidatures) return { years: [], months: [], chartData: [] };

    const rawCounts: Record<string, { dateLabel: string; raw: string; count: number }> = {};
    const yearSet = new Set<string>();
    const monthSet = new Set<string>();

    for (const c of candidatures) {
      const dateObj = parseISO(c.date_application);
      const rawKey = format(dateObj, "yyyy-MM-dd");
      const dateLabel = format(dateObj, "MMM dd");
      const year = format(dateObj, "yyyy");
      const month = format(dateObj, "MMM");

      yearSet.add(year);
      monthSet.add(month);

      if (!rawCounts[rawKey]) {
        rawCounts[rawKey] = { dateLabel, raw: rawKey, count: 0 };
      }
      rawCounts[rawKey].count += 1;
    }

    const allData: DayCount[] = Object.values(rawCounts)
      .map((d) => ({
        date: d.dateLabel,
        rawDate: d.raw,
        candidatures: d.count,
      }))
      .sort((a, b) => a.rawDate.localeCompare(b.rawDate));

    const filtered = allData.filter((d) => {
      if (selectedYear !== "all" && !d.rawDate.startsWith(selectedYear)) return false;
      if (selectedMonth !== "all") {
        const m = format(parseISO(d.rawDate), "MMM");
        if (m !== selectedMonth) return false;
      }
      return true;
    });

    return {
      years: Array.from(yearSet).sort(),
      months: Array.from(monthSet).sort((a, b) => {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return months.indexOf(a) - months.indexOf(b);
      }),
      chartData: filtered,
    };
  }, [candidatures, selectedYear, selectedMonth]);

  return (
    <Card className="col-span-4 card-modern fade-in" style={{ animationDelay: "0.2s" }}>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{t("candidatures_per_day")}</CardTitle>
        <div className="flex flex-wrap gap-2 mt-2">
          <div className="flex flex-wrap gap-1">
            <Button
              variant={selectedYear === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedYear("all")}
              className="h-7 px-2 text-xs"
            >
              All
            </Button>
            {years.map((year) => (
              <Button
                key={year}
                variant={selectedYear === year ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedYear(year)}
                className="h-7 px-2 text-xs"
              >
                {year}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            <Button
              variant={selectedMonth === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedMonth("all")}
              className="h-7 px-2 text-xs"
            >
              All
            </Button>
            {months.map((month) => (
              <Button
                key={month}
                variant={selectedMonth === month ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedMonth(month)}
                className="h-7 px-2 text-xs"
              >
                {month}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} margin={{ left: 0, right: 0, top: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" />
            <XAxis
              dataKey="date"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              angle={-45}
              textAnchor="end"
              tickMargin={8}
            />
            <YAxis allowDecimals={false} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ borderRadius: "0.5rem", border: "1px solid var(--border)", backgroundColor: "var(--background)", color: "var(--foreground)" }} />
            <Bar dataKey="candidatures" fill="currentColor" radius={[6, 6, 0, 0]} className="fill-primary" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
