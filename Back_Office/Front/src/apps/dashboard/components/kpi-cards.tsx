import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { useCandidatures } from "@/hooks/use-candidatures";
import { useFrontOfficeStatus } from "@/hooks/use-front-office";
import { useMemo } from "react";
import { Users, Clock, CheckCircle2, XCircle, Calendar, PowerIcon } from "lucide-react";

export function KpiCards() {
  const { t } = useTranslation();
  const { data: candidatures } = useCandidatures();
  const { data: foStatus } = useFrontOfficeStatus();

  const stats = useMemo(() => {
    if (!candidatures) return null;
    const total = candidatures.length;
    const pending = candidatures.filter(c => c.status === "pending" || !c.status).length;
    const invited = candidatures.filter(c => c.status === "invited").length;
    const todayCount = candidatures.filter(c =>
      c.date_application?.startsWith(new Date().toISOString().split('T')[0])
    ).length;
    return { total, pending, invited, todayCount };
  }, [candidatures]);

  const foEnabled = foStatus?.is_enabled ?? true;

  const cards = [
    { label: t("total_candidatures") || "Total", value: stats?.total ?? "-", icon: Users, accent: "text-violet-500 bg-violet-100 dark:bg-violet-500/15" },
    { label: t("pending") || "Pending", value: stats?.pending ?? "-", icon: Clock, accent: "text-amber-500 bg-amber-100 dark:bg-amber-500/15" },
    { label: t("invited") || "Invited", value: stats?.invited ?? "-", icon: CheckCircle2, accent: "text-emerald-500 bg-emerald-100 dark:bg-emerald-500/15" },
    { label: t("rejected") || "Rejected", value: (stats ? stats.total - stats.pending - stats.invited : "-") as any, icon: XCircle, accent: "text-red-500 bg-red-100 dark:bg-red-500/15" },
    { label: t("today") || "Today", value: stats?.todayCount ?? "-", icon: Calendar, accent: "text-sky-500 bg-sky-100 dark:bg-sky-500/15" },
    { label: t("front_office_status") || "Front Office", value: foEnabled ? t("enabled") || "ON" : t("disabled") || "OFF", icon: PowerIcon, accent: foEnabled ? "text-green-600 bg-green-100 dark:bg-green-500/15" : "text-red-500 bg-red-100 dark:bg-red-500/15" },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card, i) => (
        <Card
          key={i}
          className="border-border/30 rounded-xl shadow-none hover:shadow-sm transition-all duration-200 fade-in"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${card.accent}`}>
                <card.icon className="size-5.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted-foreground truncate">{card.label}</p>
                <p className="text-2xl font-bold tracking-tight">{card.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
