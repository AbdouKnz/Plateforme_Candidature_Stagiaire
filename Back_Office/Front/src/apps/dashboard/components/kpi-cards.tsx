import { useTranslation } from "react-i18next";
import { useCandidatures } from "@/hooks/use-candidatures";
import { useFrontOfficeStatus } from "@/hooks/use-front-office";
import { useMemo } from "react";
import { Clock, CheckCircle2, XCircle, Calendar, PowerIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatisticCard5 } from "@/components/ui/statistics-card-5";

function pct(value: number, total: number): number {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

export function KpiCards() {
  const { t } = useTranslation();
  const { data: candidatures } = useCandidatures();
  const { data: foStatus } = useFrontOfficeStatus();

  const stats = useMemo(() => {
    if (!candidatures) return null;
    const total = candidatures.length;
    const pending = candidatures.filter(c => c.status === "pending" || !c.status).length;
    const accepted = candidatures.filter(c => c.status === "accepted" || c.status === "invited").length;
    const rejected = candidatures.filter(c => c.status === "rejected").length;
    const todayCount = candidatures.filter(c =>
      c.date_application?.startsWith(new Date().toISOString().split('T')[0])
    ).length;

    const solo = candidatures.filter(
      (c) => !c.full_name2 || c.full_name2.trim() === "",
    ).length;
    const pair = total - solo;

    const degreeCounts: Record<string, number> = {};
    const genderCounts: Record<string, number> = {};
    const subjectCounts: Record<string, number> = {};

    for (const c of candidatures) {
      const degree = (c.degree1 || t("unknown")).trim();
      degreeCounts[degree] = (degreeCounts[degree] || 0) + 1;

      const gender = (c.gender1 || t("unknown")).trim();
      genderCounts[gender] = (genderCounts[gender] || 0) + 1;

      if (c.subject_name) {
        const subjects = c.subject_name
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        for (const s of subjects) {
          subjectCounts[s] = (subjectCounts[s] || 0) + 1;
        }
      } else {
        subjectCounts[t("unknown")] = (subjectCounts[t("unknown")] || 0) + 1;
      }
    }

    const toItems = (counts: Record<string, number>) =>
      Object.entries(counts)
        .filter(([, v]) => v > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([name, value]) => ({ name, value }));

    const degreeItems = toItems(degreeCounts);
    const genderItems = toItems(genderCounts);
    const subjectItems = toItems(subjectCounts).slice(0, 6);
    const subjectTotal = Object.values(subjectCounts).reduce((s, v) => s + v, 0);

    return { total, pending, accepted, invited: accepted, rejected, todayCount, solo, pair, degreeItems, genderItems, subjectItems, subjectTotal };
  }, [candidatures, t]);

  const foEnabled = foStatus?.is_enabled ?? true;

  const cards = [
    {
      label: t("pending") || "Pending",
      value: stats?.pending ?? "-",
      icon: Clock,
      color: "amber",
    },
    {
      label: t("accepted") || "Accepted",
      value: stats?.accepted ?? stats?.invited ?? "-",
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

  const colorMap: Record<string, { bg: string; text: string; ring: string; gradient: string; bar: string; glow: string }> = {
    violet: {
      bg: "bg-violet-100 dark:bg-violet-500/15",
      text: "text-violet-600 dark:text-violet-400",
      ring: "ring-violet-500/30",
      gradient: "from-violet-500 to-purple-600",
      bar: "bg-violet-500",
      glow: "shadow-violet-500/25",
    },
    amber: {
      bg: "bg-amber-100 dark:bg-amber-500/15",
      text: "text-amber-600 dark:text-amber-400",
      ring: "ring-amber-500/30",
      gradient: "from-amber-400 to-orange-500",
      bar: "bg-amber-500",
      glow: "shadow-amber-500/25",
    },
    emerald: {
      bg: "bg-emerald-100 dark:bg-emerald-500/15",
      text: "text-emerald-600 dark:text-emerald-400",
      ring: "ring-emerald-500/30",
      gradient: "from-emerald-500 to-teal-600",
      bar: "bg-emerald-500",
      glow: "shadow-emerald-500/25",
    },
    red: {
      bg: "bg-red-100 dark:bg-red-500/15",
      text: "text-red-600 dark:text-red-400",
      ring: "ring-red-500/30",
      gradient: "from-red-500 to-rose-600",
      bar: "bg-red-500",
      glow: "shadow-red-500/25",
    },
    sky: {
      bg: "bg-sky-100 dark:bg-sky-500/15",
      text: "text-sky-600 dark:text-sky-400",
      ring: "ring-sky-500/30",
      gradient: "from-sky-500 to-blue-600",
      bar: "bg-sky-500",
      glow: "shadow-sky-500/25",
    },
    green: {
      bg: "bg-green-100 dark:bg-green-500/15",
      text: "text-green-600 dark:text-green-400",
      ring: "ring-green-500/30",
      gradient: "from-green-500 to-emerald-600",
      bar: "bg-green-500",
      glow: "shadow-green-500/25",
    },
  };

  const breakdowns = stats
    ? [
        {
          title: t("by_type") || "Pair / Solo",
          items: [
            { label: t("pair") || "Pair", count: stats.pair, percent: pct(stats.pair, stats.total) },
            { label: t("solo") || "Solo", count: stats.solo, percent: pct(stats.solo, stats.total) },
          ],
        },
        {
          title: t("by_degree_level") || "Degree Level",
          items: stats.degreeItems.map((it) => ({
            label: it.name,
            count: it.value,
            percent: pct(it.value, stats.total),
          })),
        },
        {
          title: t("by_gender") || "Gender",
          items: stats.genderItems.map((it) => ({
            label: it.name,
            count: it.value,
            percent: pct(it.value, stats.total),
          })),
        },
        {
          title: t("by_subject") || "Subject",
          items: stats.subjectItems.map((it) => ({
            label: it.name,
            count: it.value,
            percent: pct(it.value, stats.subjectTotal),
          })),
        },
      ]
    : [];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {cards.map((card, i) => {
          const colors = colorMap[card.color];
          return (
            <div
              key={i}
              className={cn(
                "group relative flex h-full flex-col overflow-hidden rounded-xl border border-border/50",
                "bg-card transition-all duration-200",
                "hover:shadow-lg hover:-translate-y-0.5 hover:border-transparent",
                "fade-in",
                colors.glow,
              )}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {/* Top accent line */}
              <div className={cn("h-0.5 w-full bg-gradient-to-r", colors.gradient)} />

              <div className="flex flex-1 flex-col p-4">
                <div className="mb-3 flex items-center gap-2.5">
                  <div className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm",
                    colors.gradient,
                  )}>
                    <card.icon className="size-4" />
                  </div>
                  <span className="truncate text-[13px] font-semibold text-foreground">
                    {card.label}
                  </span>
                </div>

                <div className="flex flex-1 items-center justify-center">
                  <p className={cn(
                    "truncate font-bold tracking-tight",
                    card.icon === PowerIcon ? colors.text : "text-foreground",
                    card.icon === PowerIcon ? "text-2xl" : "text-4xl",
                  )}>
                    {card.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <StatisticCard5
        title={t("total_candidatures") || "Total Candidatures"}
        total={stats?.total ?? 0}
        breakdowns={breakdowns}
      />
    </div>
  );
}
