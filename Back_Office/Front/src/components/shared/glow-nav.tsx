"use client";

import { motion } from "motion/react";
import { Link, useLocation } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/theme-provider";
import type { LucideIcon } from "lucide-react";

export interface GlowNavItem {
  href: string;
  title: string;
  icon: LucideIcon;
  color: string;
  gradient: string;
}

interface GlowNavProps {
  items: GlowNavItem[];
  className?: string;
}

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

export function GlowNav({ items, className }: GlowNavProps) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { theme, resolvedTheme } = useTheme();
  const isDarkTheme = theme === "dark" || resolvedTheme === "dark";

  return (
    <motion.nav
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-b from-background/80 to-background/40 p-2 shadow-lg backdrop-blur-lg",
        className
      )}
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
        {items.map((item) => {
          const active = pathname === item.href;

          return (
            <motion.li
              key={item.href}
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

              <motion.div
                className={cn(
                  "relative z-10 flex w-full items-center rounded-xl text-sm font-medium transition-colors",
                  active
                    ? "bg-background/70 text-foreground shadow-sm"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
                variants={itemVariants}
                transition={sharedTransition}
                style={{ transformStyle: "preserve-3d", transformOrigin: "center bottom" }}
              >
                <Link
                  to={item.href}
                  className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5"
                >
                  <item.icon className={cn("size-5 shrink-0", item.color)} />
                  <span className="whitespace-nowrap">{t(item.title)}</span>
                </Link>
              </motion.div>

              <motion.div
                className={cn(
                  "absolute inset-0 z-10 flex w-full items-center rounded-xl text-sm font-medium transition-colors",
                  active
                    ? "bg-background/70 text-foreground shadow-sm"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
                variants={backVariants}
                transition={sharedTransition}
                style={{ transformStyle: "preserve-3d", transformOrigin: "center top", rotateX: 90 }}
              >
                <Link
                  to={item.href}
                  className="flex h-full w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5"
                >
                  <item.icon className={cn("size-5 shrink-0", item.color)} />
                  <span className="whitespace-nowrap">{t(item.title)}</span>
                </Link>
              </motion.div>
            </motion.li>
          );
        })}
      </ul>
    </motion.nav>
  );
}
