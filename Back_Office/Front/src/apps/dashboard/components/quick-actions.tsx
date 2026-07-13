import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Plus, Clock, FileSpreadsheet, FileText, Zap } from "lucide-react";

export function QuickActions() {
  const { t } = useTranslation();

  const actions = [
    { label: "Add Internship", icon: Plus, variant: "default" as const },
    { label: "View Pending", icon: Clock, variant: "outline" as const },
    { label: "Export Excel", icon: FileSpreadsheet, variant: "outline" as const },
    { label: "Export PDF", icon: FileText, variant: "outline" as const },
  ];

  return (
    <Card className="border-border/40 rounded-2xl shadow-sm fade-in">
      <CardHeader className="px-6 pt-6 pb-0">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
            <Zap className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t("quick_actions") || "Quick Actions"}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Common tasks</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant}
              className={`h-auto flex-col items-center gap-2.5 py-5 rounded-xl transition-all duration-200 hover:scale-[1.03] fade-in ${
                action.variant === "default"
                  ? "bg-violet-600 hover:bg-violet-700 text-white shadow-sm hover:shadow-md"
                  : "border-border/50 hover:border-violet-200 dark:hover:border-violet-800 hover:bg-violet-50/50 dark:hover:bg-violet-500/5"
              }`}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <action.icon className="size-5" />
              <span className="text-xs font-medium">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
