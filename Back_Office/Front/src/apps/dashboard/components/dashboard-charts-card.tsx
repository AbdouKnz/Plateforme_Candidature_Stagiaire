import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Bar, BarChart, Legend } from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { useCandidatures } from "@/hooks/use-candidatures";
import { useSubjects } from "@/hooks/use-subjects";
import { useMemo, useState, useEffect, useRef } from "react";
import { format, parseISO } from "date-fns";
import { CalendarDays, PieChart as PieChartIcon } from "lucide-react";

const STATUS_COLORS = ["#f59e0b", "#22c55e", "#ef4444"];
const CYCLE_MS = 15000;

type Tab = "trend" | "combined";

const tabs: { key: Tab; icon: typeof CalendarDays; title: string; desc: string }[] = [
  { key: "trend", icon: CalendarDays, title: "candidatures_per_day", desc: "Daily application volume" },
  { key: "combined", icon: PieChartIcon, title: "status_distribution", desc: "Status & positions" },
];

export function DashboardChartsCard() {
  const { t } = useTranslation();
  const { data: candidatures } = useCandidatures();
  const { data: subjects } = useSubjects();
  const [activeTab, setActiveTab] = useState<Tab>("trend");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const timer = useRef<ReturnType<typeof setInterval>>();

  const goTo = (tab: Tab) => {
    setActiveTab(tab);
    clearInterval(timer.current);
    timer.current = setInterval(() => setActiveTab(prev => tabs[(tabs.findIndex(t => t.key === prev) + 1) % tabs.length].key), CYCLE_MS);
  };

  useEffect(() => {
    timer.current = setInterval(() => setActiveTab(prev => tabs[(tabs.findIndex(t => t.key === prev) + 1) % tabs.length].key), CYCLE_MS);
    return () => clearInterval(timer.current);
  }, []);

  const { trendData, years, months } = useMemo(() => {
    if (!candidatures) return { trendData: [], years: [], months: [] };
    const counts: Record<string, { dateLabel: string; raw: string; count: number }> = {};
    const yearSet = new Set<string>();
    const monthSet = new Set<string>();
    for (const c of candidatures) {
      if (!c.date_application) continue;
      const date = parseISO(c.date_application);
      const rawKey = format(date, "yyyy-MM-dd");
      const dateLabel = format(date, "MMM dd");
      const year = format(date, "yyyy");
      const month = format(date, "MMM");
      yearSet.add(year);
      monthSet.add(month);
      if (!counts[rawKey]) counts[rawKey] = { dateLabel, raw: rawKey, count: 0 };
      counts[rawKey].count += 1;
    }
    const allData = Object.values(counts)
      .map(d => ({ date: d.dateLabel, rawDate: d.raw, applications: d.count }))
      .sort((a, b) => a.rawDate.localeCompare(b.rawDate));
    const filtered = allData.filter(d => {
      if (selectedYear !== "all" && !d.rawDate.startsWith(selectedYear)) return false;
      if (selectedMonth !== "all") {
        const m = format(parseISO(d.rawDate), "MMM");
        if (m !== selectedMonth) return false;
      }
      return true;
    });
    return {
      trendData: filtered,
      years: Array.from(yearSet).sort(),
      months: Array.from(monthSet).sort((a, b) => {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return months.indexOf(a) - months.indexOf(b);
      }),
    };
  }, [candidatures, selectedYear, selectedMonth]);

  const groupedPositionsData = useMemo(() => {
    if (!candidatures || !subjects) return [];
    const bySubject: Record<string, { pending: number; invited: number; rejected: number }> = {};
    for (const c of candidatures) {
      const key = c.subject_name;
      if (!key) continue;
      if (!bySubject[key]) bySubject[key] = { pending: 0, invited: 0, rejected: 0 };
      if (c.status === "invited") bySubject[key].invited++;
      else if (c.status === "rejected") bySubject[key].rejected++;
      else bySubject[key].pending++;
    }
    return subjects
      .map(s => ({ position: s.name, ...(bySubject[s.name] || { pending: 0, invited: 0, rejected: 0 }) }))
      .sort((a, b) => (b.pending + b.invited + b.rejected) - (a.pending + a.invited + a.rejected));
  }, [candidatures, subjects]);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {activeTab === "trend" && (
        <Card className="border-border/40 rounded-2xl shadow-sm fade-in lg:col-span-3">
          <CardHeader className="px-6 pt-6 pb-0">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400"><CalendarDays className="size-5" /></div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{t("candidatures_per_day") || "Applications Trend"}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Daily application volume</p>
                </div>
              </div>
              <div className="flex gap-1.5 bg-muted/50 p-1 rounded-xl">
                {tabs.map(({ key, icon: TabIcon }) => (
                  <button key={key} onClick={() => goTo(key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${activeTab === key ? "bg-white dark:bg-foreground/10 text-foreground shadow-sm border border-border/40" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <TabIcon className="size-3.5" />
                    {key === "trend" ? (t("candidatures_per_day") || "Trend") : (t("applications_by_position") || "By Project")}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-3">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[110px] h-8 text-xs">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {years.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[110px] h-8 text-xs">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {months.map(month => (
                    <SelectItem key={month} value={month}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {trendData.length === 0 ? <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">No data available</div> : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData} margin={{ top: 8, right: 8, left: -16, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
                  <XAxis dataKey="date" className="text-xs text-muted-foreground" tickLine={false} axisLine={false} angle={-45} textAnchor="end" tickMargin={8} padding={{ left: 30 }} />
                  <YAxis allowDecimals={false} className="text-xs text-muted-foreground" tickLine={false} axisLine={false} />
                  <Tooltip content={({ active, payload, label }) => !active || !payload?.length ? null : (
                    <div className="rounded-xl border border-border/50 bg-card px-4 py-3 shadow-lg text-sm"><p className="text-muted-foreground mb-1">{label}</p><p className="font-semibold text-foreground">{payload[0].value} application{payload[0].value !== 1 ? "s" : ""}</p></div>
                  )} cursor={{ stroke: "var(--muted)", strokeWidth: 1, strokeDasharray: "4 4" }} />
                  <Line type="monotone" dataKey="applications" stroke="#6D5EF5" strokeWidth={2.5} dot={{ r: 3, fill: "#6D5EF5", className: "fill-violet-500 dark:fill-violet-400" }} activeDot={{ r: 5, fill: "#6D5EF5", className: "fill-violet-500 dark:fill-violet-400 stroke-background stroke-2" }} className="stroke-violet-500 dark:stroke-violet-400" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "combined" && (
        <Card className="border-border/40 rounded-2xl shadow-sm fade-in lg:col-span-3">
          <CardHeader className="px-6 pt-6 pb-0">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400"><PieChartIcon className="size-5" /></div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{t("applications_by_position") || "Applications by Project"}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Status breakdown per project</p>
                </div>
              </div>
              <div className="flex gap-1.5 bg-muted/50 p-1 rounded-xl">
                {tabs.map(({ key, icon: TabIcon }) => (
                  <button key={key} onClick={() => goTo(key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${activeTab === key ? "bg-white dark:bg-foreground/10 text-foreground shadow-sm border border-border/40" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <TabIcon className="size-3.5" />
                    {key === "trend" ? (t("candidatures_per_day") || "Trend") : (t("applications_by_position") || "By Project")}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Positions grouped bar */}
            <div className="flex flex-col justify-center">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t("applications_by_position") || "Per Project"}</h4>
                {groupedPositionsData.length === 0 ? (
                  <div className="flex items-center justify-center h-[240px] text-sm text-muted-foreground">No data</div>
                ) : (
                  <ResponsiveContainer width="100%" height={Math.max(260, groupedPositionsData.length * 50)}>
                    <BarChart data={groupedPositionsData} margin={{ top: 4, right: 8, left: -12, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
                      <XAxis dataKey="position" className="text-xs text-muted-foreground" tickLine={false} axisLine={false}
                        tick={({ x, y, payload }) => {
                          const label = payload.value as string;
                          const display = label.length > 14 ? label.slice(0, 14) + "..." : label;
                          return <text x={x} y={y + 10} textAnchor="middle" fontSize={10} fill="currentColor">{display}</text>;
                        }}
                      />
                      <YAxis allowDecimals={false} className="text-xs text-muted-foreground" tickLine={false} axisLine={false} />
                      <Tooltip content={({ active, payload, label }) => !active || !payload?.length ? null : (
                        <div className="rounded-xl border border-border/50 bg-card px-4 py-3 shadow-lg text-sm">
                          <p className="font-medium text-foreground mb-2">{label}</p>
                          {payload.map((entry, i) => (
                            <p key={i} className="text-sm" style={{ color: entry.color }}>
                              {entry.name}: {entry.value}
                            </p>
                          ))}
                        </div>
                      )} cursor={{ fill: "var(--muted)" }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                        formatter={(value: string) => <span className="text-muted-foreground">{value}</span>}
                      />
                      <Bar dataKey="pending" name={t("pending") || "Pending"} fill={STATUS_COLORS[0]} radius={[4, 4, 0, 0]} maxBarSize={12} />
                      <Bar dataKey="invited" name={t("invited") || "Invited"} fill={STATUS_COLORS[1]} radius={[4, 4, 0, 0]} maxBarSize={12} />
                      <Bar dataKey="rejected" name={t("rejected") || "Rejected"} fill={STATUS_COLORS[2]} radius={[4, 4, 0, 0]} maxBarSize={12} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
