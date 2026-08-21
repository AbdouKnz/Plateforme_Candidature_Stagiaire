"use client";

import { motion } from "motion/react";
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
import { useTheme } from "@/context/theme-provider";

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
  gradient: string;
}

const NAV_ITEMS: NavItemMeta[] = [
  {
    value: "all",
    icon: LayoutGrid,
    labelKey: "all",
    color: "text-blue-500",
    gradient:
      "radial-gradient(circle, rgba(59,130,246,0.18) 0%, rgba(37,99,235,0.08) 50%, rgba(29,78,216,0) 100%)",
  },
  {
    value: "cv_screening",
    icon: FileText,
    labelKey: "pipeline_step_cv_screening",
    color: "text-indigo-500",
    gradient:
      "radial-gradient(circle, rgba(99,102,241,0.18) 0%, rgba(79,70,229,0.08) 50%, rgba(67,56,202,0) 100%)",
  },
  {
    value: "online_quiz",
    icon: ClipboardList,
    labelKey: "pipeline_step_online_quiz",
    color: "text-sky-500",
    gradient:
      "radial-gradient(circle, rgba(14,165,233,0.18) 0%, rgba(2,132,199,0.08) 50%, rgba(3,105,161,0) 100%)",
  },
  {
    value: "online_meeting",
    icon: Video,
    labelKey: "pipeline_step_online_meeting",
    color: "text-purple-500",
    gradient:
      "radial-gradient(circle, rgba(168,85,247,0.18) 0%, rgba(147,51,234,0.08) 50%, rgba(126,34,206,0) 100%)",
  },
  {
    value: "f2f_meeting",
    icon: Users,
    labelKey: "pipeline_step_f2f_meeting",
    color: "text-orange-500",
    gradient:
      "radial-gradient(circle, rgba(249,115,22,0.18) 0%, rgba(234,88,12,0.08) 50%, rgba(194,65,12,0) 100%)",
  },
  {
    value: "final_decision",
    icon: BadgeCheck,
    labelKey: "pipeline_step_final_decision",
    color: "text-teal-500",
    gradient:
      "radial-gradient(circle, rgba(20,184,166,0.18) 0%, rgba(13,148,136,0.08) 50%, rgba(15,118,110,0) 100%)",
  },
];

const itemVariants = {
  initial: { rotateX: 0, opacity: 1 },
  hover: { rotateX: -90, opacity: 0 },
};

const backVariants = {
  initial: { rotateX: 90, opacity: 0 },
  hover: { rotateX: 0, opacity: 1 },
};

const navGlowVariants = {
  initial: { opacity: 0 },
  hover: {
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  },
};

const sharedTransition = {
  type: "spring" as const,
  stiffness: 100,
  damping: 20,
  duration: 0.5,
};

export function PipelineNav({ value, counts, onValueChange }: PipelineNavProps) {
  const { t } = useTranslation();
  const { theme, resolvedTheme } = useTheme();
  const isDarkTheme = theme === "dark" || resolvedTheme === "dark";

  return (
    <motion.nav
      className="relative w-full overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-b from-background/80 to-background/40 p-2 shadow-lg backdrop-blur-lg"
      initial="initial"
      whileHover="hover"
    >
      <motion.div
        className="pointer-events-none absolute -inset-2 z-0 rounded-3xl"
        variants={navGlowVariants}
        style={{
          background: isDarkTheme
            ? "radial-gradient(circle at 50% 0%, rgba(96,165,250,0.12) 0%, rgba(168,85,247,0.08) 45%, rgba(248,113,113,0.06) 100%)"
            : "radial-gradient(circle at 50% 0%, rgba(96,165,250,0.25) 0%, rgba(168,85,247,0.18) 45%, rgba(248,113,113,0.12) 100%)",
        }}
      />

      <ul className="no-scrollbar relative z-10 flex items-center gap-1 overflow-x-auto">
        {NAV_ITEMS.map((item) => {
          const active = value === item.value;
          const count = counts[item.value] ?? 0;

          return (
            <motion.li
              key={item.value}
              className="group relative flex-1"
              initial="initial"
              whileHover="hover"
            >
              <div
                aria-hidden
                className={cn(
                  "pointer-events-none absolute inset-0 rounded-xl transition-all duration-500",
                  active
                    ? "scale-110 opacity-70"
                    : "scale-90 opacity-0 group-hover:scale-110 group-hover:opacity-100"
                )}
                style={{ background: item.gradient, borderRadius: "16px" }}
              />

              <motion.button
                type="button"
                onClick={() => onValueChange(item.value)}
                aria-current={active ? "step" : undefined}
                title={t(item.labelKey)}
                className={cn(
                  "relative z-10 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-background/70 text-foreground shadow-sm"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
                variants={itemVariants}
                transition={sharedTransition}
                style={{ transformStyle: "preserve-3d", transformOrigin: "center bottom" }}
              >
                <item.icon className={cn("size-5 shrink-0", item.color)} />
                <span className="whitespace-nowrap">{t(item.labelKey)}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-xs tabular-nums",
                    active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}
                >
                  {count}
                </span>
              </motion.button>

              <motion.button
                type="button"
                onClick={() => onValueChange(item.value)}
                className={cn(
                  "absolute inset-0 z-10 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-background/70 text-foreground shadow-sm"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
                variants={backVariants}
                transition={sharedTransition}
                style={{ transformStyle: "preserve-3d", transformOrigin: "center top", rotateX: 90 }}
              >
                <item.icon className={cn("size-5 shrink-0", item.color)} />
                <span className="whitespace-nowrap">{t(item.labelKey)}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-xs tabular-nums",
                    active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}
                >
                  {count}
                </span>
              </motion.button>
            </motion.li>
          );
        })}
      </ul>
    </motion.nav>
  );
}
