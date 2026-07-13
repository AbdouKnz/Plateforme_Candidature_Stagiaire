import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { useCandidatures } from "@/hooks/use-candidatures";
import { useMemo } from "react";
import { CheckCircle2, XCircle, UserPlus, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type ActivityType = "new" | "invited" | "rejected";

const activityConfig: Record<ActivityType, { icon: typeof CheckCircle2; className: string }> = {
  invited: { icon: CheckCircle2, className: "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10" },
  rejected: { icon: XCircle, className: "text-red-500 bg-red-50 dark:bg-red-500/10" },
  new: { icon: UserPlus, className: "text-sky-500 bg-sky-50 dark:bg-sky-500/10" },
};

export function RecentActivity() {
  const { t } = useTranslation();
  const { data: candidatures } = useCandidatures();

  const activities = useMemo(() => {
    if (!candidatures) return [];
    return [...candidatures]
      .filter(c => c.status && c.status !== "pending")
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 10)
      .map(c => {
        const type: ActivityType = c.status === "invited" ? "invited" : c.status === "rejected" ? "rejected" : "new";
        const description = type === "invited"
          ? `${c.full_name} invited`
          : type === "rejected"
          ? `${c.full_name} rejected`
          : `New application from ${c.full_name}`;
        return { type, description, time: c.updated_at || c.created_at };
      });
  }, [candidatures]);

  return (
    <Card className="border-border/40 rounded-2xl shadow-sm fade-in h-full">
      <CardHeader className="px-6 pt-6 pb-0">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
            <Activity className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t("recent_activity") || "Recent Activity"}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Latest events</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {activities.length === 0 ? (
          <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
            No recent activity
          </div>
        ) : (
          <div className="space-y-1">
            {activities.map((activity, index) => {
              const Icon = activityConfig[activity.type].icon;
              return (
                <div
                  key={index}
                  className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-muted/30 fade-in"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${activityConfig[activity.type].className}`}>
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(activity.time), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
