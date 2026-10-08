"use client";

import { useMemo } from "react";
import {
  LayoutGrid,
  FileText,
  ClipboardList,
  Video,
  Users,
  BadgeCheck,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Tabs, type VercelTab } from "@/components/ui/vercel-tabs";

interface PipelineNavProps {
  value: string;
  counts: Record<string, number>;
  onValueChange: (value: string) => void;
}

interface NavItemMeta {
  value: string;
  icon: LucideIcon;
  labelKey: string;
  color: string;
}

const NAV_ITEMS: NavItemMeta[] = [
  {
    value: "all",
    icon: LayoutGrid,
    labelKey: "all",
    color: "text-blue-500",
  },
  {
    value: "cv_screening",
    icon: FileText,
    labelKey: "pipeline_step_cv_screening",
    color: "text-indigo-500",
  },
  {
    value: "online_quiz",
    icon: ClipboardList,
    labelKey: "pipeline_step_online_quiz",
    color: "text-sky-500",
  },
  {
    value: "online_meeting",
    icon: Video,
    labelKey: "pipeline_step_online_meeting",
    color: "text-[#1d7cc7]",
  },
  {
    value: "f2f_meeting",
    icon: Users,
    labelKey: "pipeline_step_f2f_meeting",
    color: "text-orange-500",
  },
  {
    value: "final_decision",
    icon: BadgeCheck,
    labelKey: "pipeline_step_final_decision",
    color: "text-teal-500",
  },
];

export function PipelineNav({ value, counts, onValueChange }: PipelineNavProps) {
  const { t } = useTranslation();

  const tabs: VercelTab[] = useMemo(
    () =>
      NAV_ITEMS.map((item) => {
        const active = value === item.value;
        return {
          id: item.value,
          label: t(item.labelKey),
          icon: <item.icon className={cn("size-[18px] shrink-0", item.color)} />,
          badge: (
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-xs tabular-nums",
                active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}
            >
              {counts[item.value] ?? 0}
            </span>
          ),
        };
      }),
    [t, value, counts]
  );

  return (
    <Tabs
      tabs={tabs}
      activeTab={value}
      onTabChange={onValueChange}
      fill
      large
      className="no-scrollbar w-full overflow-x-auto"
    />
  );
}
