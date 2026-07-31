import { useTranslation } from "react-i18next";
import { useCandidatures } from "@/hooks/use-candidatures";
import { useFrontOfficeStatus } from "@/hooks/use-front-office";
import { useMemo } from "react";
import { Users, Clock, CheckCircle2, XCircle, Calendar, PowerIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function KpiCards() {
  const { t } = useTranslation();
  const { data: candidatures } = useCandidatures();
  const { data: foStatus } = useFrontOfficeStatus();

  const stats = useMemo(() => {
    if (!candidatures) return null;
    const total = candidatures.length;
    const pending = candidatures.filter(c => c.status === "pending" || !c.status).length;
    const invited = candidatures.filter(c => c.status === "invited").length;
    const rejected = candidatures.filter(c => c.status === "rejected").length;
    const todayCount = candidatures.filter(c =>
      c.date_application?.startsWith(new Date().toISOString().split('T')[0])
    ).length;
    return { total, pending, invited, rejected, todayCount };
  }, [candidatures]);

  const foEnabled = foStatus?.is_enabled ?? true;

  const cards = [
    {
      label: t("total_candidatures") || "Total",
      value: stats?.total ?? "-",
      icon: Users,
      color: "violet",
    },
    {
      label: t("pending") || "Pending",
      value: stats?.pending ?? "-",
      icon: Clock,
      color: "amber",
    },
    {
      label: t("invited") || "Invited",
      value: stats?.invited ?? "-",
      icon: CheckCircle2,
      color: "emerald",
    },
    {
      label: t("rejected") || "Rejected",
      value: stats?.rejected ?? "-",
      icon: XCircle,
      color: "red",
    },
    {
      label: t("today") || "Today",
      value: stats?.todayCount ?? "-",
      icon: Calendar,
      color: "sky",
    },
    {
      label: t("front_office_status") || "Front Office",
      value: foEnabled ? (t("enabled") || "Active") : (t("disabled") || "Closed"),
      icon: PowerIcon,
      color: foEnabled ? "green" : "red",
    },
  ];

  const colorMap: Record<string, { bg: string; text: string; ring: string }> = {
    violet: {
      bg: "bg-violet-100 dark:bg-violet-500/15",
      text: "text-violet-600 dark:text-violet-400",
      ring: "ring-violet-500/20",
    },
    amber: {
      bg: "bg-amber-100 dark:bg-amber-500/15",
      text: "text-amber-600 dark:text-amber-400",
      ring: "ring-amber-500/20",
    },
    emerald: {
      bg: "bg-emerald-100 dark:bg-emerald-500/15",
      text: "text-emerald-600 dark:text-emerald-400",
      ring: "ring-emerald-500/20",
    },
    red: {
      bg: "bg-red-100 dark:bg-red-500/15",
      text: "text-red-600 dark:text-red-400",
      ring: "ring-red-500/20",
    },
    sky: {
      bg: "bg-sky-100 dark:bg-sky-500/15",
      text: "text-sky-600 dark:text-sky-400",
      ring: "ring-sky-500/20",
    },
    green: {
      bg: "bg-green-100 dark:bg-green-500/15",
      text: "text-green-600 dark:text-green-400",
      ring: "ring-green-500/20",
    },
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card, i) => {
        const colors = colorMap[card.color];
        return (
          <div
            key={i}
            className={cn(
              "group relative overflow-hidden rounded-xl border border-border/50",
              "bg-card transition-all duration-200",
              "hover:shadow-md hover:-translate-y-0.5",
              "fade-in",
            )}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {/* Top accent line */}
            <div className={cn("h-0.5 w-full", card.color === "violet" && "bg-violet-500",
              card.color === "amber" && "bg-amber-500",
              card.color === "emerald" && "bg-emerald-500",
              card.color === "red" && "bg-red-500",
              card.color === "sky" && "bg-sky-500",
              card.color === "green" && "bg-green-500",
            )} />

            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={cn("flex size-9 items-center justify-center rounded-lg", colors.bg, colors.text)}>
                  <card.icon className="size-4.5" />
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {card.label}
                </span>
              </div>

              <p className={cn(
                  "font-bold tracking-tight leading-none",
                  card.icon === PowerIcon ? "text-base" : "text-[26px] text-foreground",
                  card.icon === PowerIcon && colors.text
                )}>
                {card.value}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
