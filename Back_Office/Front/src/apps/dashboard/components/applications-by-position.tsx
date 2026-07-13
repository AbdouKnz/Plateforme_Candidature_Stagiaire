import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useTranslation } from "react-i18next";
import { useCandidatures } from "@/hooks/use-candidatures";
import { useSubjects } from "@/hooks/use-subjects";
import { useMemo } from "react";
import { Briefcase } from "lucide-react";

export function ApplicationsByPosition() {
  const { t } = useTranslation();
  const { data: candidatures } = useCandidatures();
  const { data: subjects } = useSubjects();

  const chartData = useMemo(() => {
    if (!candidatures || !subjects) return [];
    const appCounts: Record<string, number> = {};
    for (const c of candidatures) {
      const name = c.subject_name || "Unknown";
      appCounts[name] = (appCounts[name] || 0) + 1;
    }
    return subjects
      .map(s => ({ position: s.name, applications: appCounts[s.name] || 0 }))
      .sort((a, b) => b.applications - a.applications);
  }, [candidatures, subjects]);

  return (
    <Card className="border-border/40 rounded-2xl shadow-sm fade-in h-full">
      <CardHeader className="px-6 pt-6 pb-0">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
            <Briefcase className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t("applications_by_position") || "Applications by Position"}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Per internship offer</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {chartData.length === 0 ? (
          <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
            No position data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(280, chartData.length * 40)}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" horizontal={false} />
              <XAxis type="number" allowDecimals={false} className="text-xs text-muted-foreground" tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="position"
                className="text-xs text-muted-foreground"
                tickLine={false}
                axisLine={false}
                width={160}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="rounded-xl border border-border/50 bg-card px-4 py-3 shadow-lg text-sm">
                      <p className="font-medium text-foreground mb-1">{label}</p>
                      <p className="text-muted-foreground">{payload[0].value} application{payload[0].value !== 1 ? "s" : ""}</p>
                    </div>
                  );
                }}
                cursor={{ fill: "var(--muted)" }}
              />
              <Bar
                dataKey="applications"
                fill="currentColor"
                radius={[0, 6, 6, 0]}
                className="fill-violet-500 dark:fill-violet-400"
                maxBarSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
