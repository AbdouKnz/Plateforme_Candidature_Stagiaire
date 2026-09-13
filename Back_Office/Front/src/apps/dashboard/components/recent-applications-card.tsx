import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { useRecentCandidatures } from "@/hooks/use-candidatures";
import { useCandidaturesStore } from "@/stores/candidatures-store";
import { DialogEnum } from "@/models/alert-model";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, CalendarDays, Clock, Eye, FolderKanban } from "lucide-react";
import { cn } from "@/lib/utils";

const avatarColors = [
  "from-[#1d7cc7] to-[#12b9da]",
  "from-sky-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-pink-500 to-rose-600",
  "from-indigo-500 to-blue-600",
];

const statusStyles: Record<string, { variant: "success" | "warning" | "destructive" | "blue" | "login"; dot: string; labelKey: string }> = {
  pending: { variant: "warning", dot: "bg-[#FFA559]", labelKey: "candidature_status_pending" },
  accepted: { variant: "success", dot: "bg-[#6BCF9D]", labelKey: "candidature_status_accepted" },
  invited: { variant: "success", dot: "bg-[#6BCF9D]", labelKey: "candidature_status_accepted" },
  rejected: { variant: "destructive", dot: "bg-red-500", labelKey: "candidature_status_rejected" },
  on_hold: { variant: "blue", dot: "bg-[#3B82F6]", labelKey: "candidature_status_on_hold" },
};

function statusLabelKey(status: string, gender?: string): string {
  if (status === "accepted" || status === "invited") {
    return gender === "Female" ? "candidature_status_accepted_f" : "candidature_status_accepted_m";
  }
  return statusStyles[status]?.labelKey ?? "candidature_status_pending";
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

export function RecentApplicationsCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: candidatures, isLoading } = useRecentCandidatures();
  const setCurrentCandidatureId = useCandidaturesStore((s) => s.setCurrentCandidatureId);
  const setOpenCandidature = useCandidaturesStore((s) => s.setOpenCandidature);

  const handleView = (id: number) => {
    setCurrentCandidatureId(id);
    setOpenCandidature(DialogEnum.VIEW);
    navigate({ to: "/candidatures" });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#1d7cc7]/10 text-[#1d7cc7] dark:bg-[#1d7cc7]/15 dark:text-[#5aa3d8]">
              <Clock className="size-4" />
            </div>
            {t("recent_applications")}
          </CardTitle>
          <button
            type="button"
            onClick={() => navigate({ to: "/candidatures" })}
            className="group inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            {t("view_all")}
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="size-9 rounded-full bg-muted" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-1/3 rounded bg-muted" />
                  <div className="h-2.5 w-1/2 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : !candidatures || candidatures.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <FolderKanban className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">{t("recent_applications_empty")}</p>
          </div>
        ) : (
          <div className="divide-y">
            {candidatures.map((c, i) => {
              const status = c.status ?? "pending";
              const style = statusStyles[status] ?? statusStyles.pending;
              return (
                <div
                  key={c.id}
                  className="group flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white shadow-sm",
                      avatarColors[i % avatarColors.length],
                    )}
                  >
                    {getInitials(c.full_name) || "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {c.full_name}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                      {c.subject_name && (
                        <span className="flex items-center gap-1 truncate">
                          <FolderKanban className="size-3 shrink-0" />
                          <span className="truncate">{c.subject_name}</span>
                        </span>
                      )}
                      {c.date_application && (
                        <span className="flex shrink-0 items-center gap-1">
                          <span className="text-muted-foreground/40">·</span>
                          <CalendarDays className="size-3" />
                          <span>{c.date_application}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant={style.variant} className="w-24 justify-start pl-2.5">
                      <span className={cn("size-1.5 rounded-full", style.dot)} />
                      {t(statusLabelKey(status, c.gender1))}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => handleView(c.id)}
                      title={t("view")}
                      className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                    >
                      <Eye className="size-4" />
                    </button>
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
