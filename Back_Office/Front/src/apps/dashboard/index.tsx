import { Main } from "@/components/layout/main";
import { KpiCards } from "./components/kpi-cards";
import { DashboardChartsCard } from "./components/dashboard-charts-card";
import { IconLayoutDashboard } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

export function Dashboard() {
    const { t } = useTranslation();

  return (
    <Main>
      <div className="mb-2 flex items-center space-x-2">
        <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
          <IconLayoutDashboard className="size-5" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{t('dashboard')}</h1>
      </div>
      <div className="mt-6 space-y-6">
        <KpiCards />
        <DashboardChartsCard />
      </div>
    </Main>
  );
}