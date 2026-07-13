import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useCandidatures } from "@/hooks/use-candidatures";
import { useMemo } from "react";
import { Eye, FileText } from "lucide-react";
import { format } from "date-fns";

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-800" },
  invited: { label: "Invited", className: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-800" },
  rejected: { label: "Rejected", className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-800" },
};

export function LatestApplications() {
  const { t } = useTranslation();
  const { data: candidatures } = useCandidatures();

  const latest = useMemo(() => {
    if (!candidatures) return [];
    return [...candidatures]
      .sort((a, b) => new Date(b.date_application).getTime() - new Date(a.date_application).getTime())
      .slice(0, 10);
  }, [candidatures]);

  return (
    <Card className="border-border/40 rounded-2xl shadow-sm fade-in">
      <CardHeader className="px-6 pt-6 pb-0">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
            <FileText className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t("latest_applications") || "Latest Applications"}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Most recent 10 submissions</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {latest.length === 0 ? (
          <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
            No applications yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left font-medium text-muted-foreground pb-3 pr-4 whitespace-nowrap">Candidate</th>
                  <th className="text-left font-medium text-muted-foreground pb-3 pr-4 whitespace-nowrap">Internship</th>
                  <th className="text-left font-medium text-muted-foreground pb-3 pr-4 whitespace-nowrap">Date</th>
                  <th className="text-left font-medium text-muted-foreground pb-3 pr-4 whitespace-nowrap">Status</th>
                  <th className="text-right font-medium text-muted-foreground pb-3 whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody>
                {latest.map((c, i) => {
                  const statusKey = c.status || "pending";
                  const cfg = statusConfig[statusKey] || statusConfig.pending;
                  return (
                    <tr
                      key={c.id}
                      className="border-b border-border/30 transition-colors hover:bg-muted/30 fade-in"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <td className="py-3 pr-4">
                        <span className="font-medium text-foreground">{c.full_name}</span>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">{c.subject_name || "-"}</td>
                      <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap">
                        {c.date_application ? format(new Date(c.date_application), "MMM dd, yyyy") : "-"}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="outline" className={`text-xs font-medium px-2.5 py-0.5 ${cfg.className}`}>
                          {cfg.label}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
                          <Eye className="size-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
