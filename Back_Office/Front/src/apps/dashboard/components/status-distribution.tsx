import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useTranslation } from "react-i18next";
import { useCandidatures } from "@/hooks/use-candidatures";
import { useMemo } from "react";
import { PieChart as PieChartIcon } from "lucide-react";

const COLORS = ["#f59e0b", "#6D5EF5", "#ef4444"];
const LABELS = ["Pending", "Invited", "Rejected"];

export function StatusDistribution() {
  const { t } = useTranslation();
  const { data: candidatures } = useCandidatures();

  const data = useMemo(() => {
    if (!candidatures) return [];
    const pending = candidatures.filter(c => c.status === "pending" || !c.status).length;
    const invited = candidatures.filter(c => c.status === "invited").length;
    const rejected = candidatures.filter(c => c.status === "rejected").length;
    const total = pending + invited + rejected;
    if (total === 0) return [];
    return [
      { name: "Pending", value: pending, color: COLORS[0] },
      { name: "Invited", value: invited, color: COLORS[1] },
      { name: "Rejected", value: rejected, color: COLORS[2] },
    ].filter(item => item.value > 0);
  }, [candidatures]);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="border-border/40 rounded-2xl shadow-sm fade-in h-full">
      <CardHeader className="px-6 pt-6 pb-0">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
            <PieChartIcon className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t("status_distribution") || "Status Distribution"}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Application status breakdown</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {data.length === 0 ? (
          <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
            No data available
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {data.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 w-full space-y-2.5">
              {data.map((item, index) => {
                const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="size-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-muted-foreground">{LABELS[index] || item.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-foreground">{item.value}</span>
                      <span className="text-xs text-muted-foreground min-w-[40px] text-right">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
