import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { useRecentCandidatures } from "@/hooks/use-candidatures";
import { useCandidaturesStore } from "@/stores/candidatures-store";
import { DialogEnum } from "@/models/alert-model";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Eye, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  pending: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10",
  invited: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10",
  rejected: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10",
};

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
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="size-4" />
          {t("recent_applications")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            Loading...
          </div>
        ) : !candidatures || candidatures.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            {t("recent_applications_empty")}
          </div>
        ) : (
          <div className="divide-y">
            {candidatures.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  <UserRound className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.full_name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {c.subject_name && <span className="truncate">{c.subject_name}</span>}
                    {c.date_application && (
                      <>
                        <span className="shrink-0">·</span>
                        <span className="shrink-0">{c.date_application}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize",
                      statusColors[c.status ?? "pending"] ?? statusColors.pending,
                    )}
                  >
                    {c.status || "pending"}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => handleView(c.id)}
                    title={t("view")}
                  >
                    <Eye className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
