"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconUsers, IconBooks } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useCandidatures } from "@/hooks/use-candidatures";
import { useSubjects } from "@/hooks/use-subjects";

export function SectionCards() {
  const { t } = useTranslation();
  const { data: candidatures } = useCandidatures();
  const { data: subjects } = useSubjects();

  return (
    <>
      <Card className="card-modern fade-in">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{t("total_candidatures")}</CardTitle>
          <div className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex h-9 w-9 items-center justify-center rounded-xl shadow-sm">
            <IconUsers className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold tracking-tight">{candidatures?.length ?? "-"}</div>
        </CardContent>
      </Card>
      <Card className="card-modern fade-in" style={{ animationDelay: "0.1s" }}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{t("total_subjects")}</CardTitle>
          <div className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex h-9 w-9 items-center justify-center rounded-xl shadow-sm">
            <IconBooks className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold tracking-tight">{subjects?.length ?? "-"}</div>
        </CardContent>
      </Card>
    </>
  );
}
