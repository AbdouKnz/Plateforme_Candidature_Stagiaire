"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { IconNotebook, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card-1";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useSubjects } from "@/hooks/use-subjects";
import { useCandidatures } from "@/hooks/use-candidatures";

// Maximally distinct categorical palette so every data item gets its own color.
const STAT_COLORS = [
  "bg-[#1d7cc7]",
  "bg-orange-500",
  "bg-emerald-500",
  "bg-rose-500",
  "bg-[#12b9da]",
  "bg-amber-500",
  "bg-teal-500",
  "bg-sky-500",
  "bg-cyan-500",
  "bg-lime-600",
  "bg-indigo-500",
  "bg-pink-500",
  "bg-red-500",
  "bg-yellow-500",
];

interface BreakdownItem {
  label: string;
  count: number;
  percent: number;
  color?: string;
}

interface RawStat {
  code: string;
  subjectName: string;
  total: number;
  pair: number;
  solo: number;
  degreeCounts: Record<string, number>;
  genderCounts: Record<string, number>;
}

interface Section {
  title: string;
  items: BreakdownItem[];
}

interface SubjectRow {
  subjectName: string;
  code: string;
  total: number;
  type: Section;
  degrees: Section;
  genders: Section;
}

function pct(value: number, total: number): number {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function toBreakdown(counts: Record<string, number>, total: number): BreakdownItem[] {
  return Object.entries(counts)
    .map(([label, count]) => ({ label, count, percent: pct(count, total) }))
    .sort((a, b) => b.count - a.count);
}

function BreakdownRow({
  label,
  count,
  percent,
  color,
}: {
  label: string;
  count: number;
  percent: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <span className={cn("size-2 shrink-0 rounded-full", color)} />
      <span className="min-w-0 flex-1 truncate font-medium text-muted-foreground" title={label}>
        {label}
      </span>
      <div className="h-1.5 w-full max-w-32 shrink-0 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${percent}%` }} />
      </div>
      <span className="w-10 shrink-0 text-right font-semibold tabular-nums">{count}</span>
      <span className={cn("min-w-12 shrink-0 rounded-md px-1.5 py-0.5 text-right text-sm font-bold tabular-nums", color)}>
        {percent}%
      </span>
    </div>
  );
}

function BreakdownSection({
  title,
  items,
  colorOffset = 0,
}: {
  title: string;
  items: BreakdownItem[];
  colorOffset?: number;
}) {
  if (items.length === 0) return null;
  return (
    <div className="min-w-0">
      <h4 className="mb-3 text-sm font-semibold text-foreground">{title}</h4>
      <div className="space-y-2.5">
        {items.map((item, i) => (
          <BreakdownRow
            key={item.label}
            label={item.label}
            count={item.count}
            percent={item.percent}
            color={item.color ?? STAT_COLORS[(i + colorOffset) % STAT_COLORS.length]}
          />
        ))}
      </div>
    </div>
  );
}

export function SubjectKpis() {
  const { t } = useTranslation();
  const { data: subjects, isLoading: subjectsLoading } = useSubjects();
  const { data: candidatures, isLoading: candidaturesLoading } = useCandidatures();

  const isLoading = subjectsLoading || candidaturesLoading;

  const rows = useMemo<SubjectRow[]>(() => {
    // Subject names are matched TRIMMED on both sides: stored candidature
    // rows and subject rows can drift by whitespace (e.g. "Projet 1" vs
    // "Projet 1 "), which would otherwise silently drop rows from the KPIs.
    const activeSubjects = (subjects ?? []).filter((s) => !!s.status);
    const allCandidatures = candidatures ?? [];
    const knownNames = new Set(activeSubjects.map((s) => s.name.trim()));

    // Collect all unique degrees and genders globally from all candidatures
    const globalDegrees = new Set<string>();
    const globalGenders = new Set<string>();
    for (const c of allCandidatures) {
      const d1 = (c.degree1 || "").trim();
      if (d1) globalDegrees.add(d1);
      const d2 = (c.degree2 || "").trim();
      if (d2) globalDegrees.add(d2);
      const g1 = (c.gender1 || "").trim();
      if (g1) globalGenders.add(g1);
      const g2 = (c.gender2 || "").trim();
      if (g2) globalGenders.add(g2);
    }

    const statsMap = new Map<string, RawStat>();
    for (const subject of activeSubjects) {
      statsMap.set(subject.name.trim(), {
        code: subject.code,
        subjectName: subject.name.trim(),
        total: 0,
        pair: 0,
        solo: 0,
        degreeCounts: {},
        genderCounts: {},
      });
    }

    for (const c of allCandidatures) {
      const subjectNames = (c.subject_name || "")
        .split(",")
        .map((s) => s.trim())
        .filter((s) => knownNames.has(s));

      if (subjectNames.length === 0) continue;

      const isSolo = !c.full_name2 || c.full_name2.trim() === "";
      const degree = (c.degree1 || t("unknown")).trim();
      const gender = (c.gender1 || t("unknown")).trim();

      for (const name of subjectNames) {
        const stat = statsMap.get(name);
        if (!stat) continue;
        stat.total += 1;
        if (isSolo) stat.solo += 1;
        else stat.pair += 1;
        stat.degreeCounts[degree] = (stat.degreeCounts[degree] || 0) + 1;
        stat.genderCounts[gender] = (stat.genderCounts[gender] || 0) + 1;
      }
    }

    // Ensure every subject has all global degrees/genders with at least 0
    for (const stat of statsMap.values()) {
      for (const deg of globalDegrees) {
        if (!(deg in stat.degreeCounts)) stat.degreeCounts[deg] = 0;
      }
      for (const g of globalGenders) {
        if (!(g in stat.genderCounts)) stat.genderCounts[g] = 0;
      }
    }

    return Array.from(statsMap.values())
      .map((s) => ({
        subjectName: s.subjectName,
        code: s.code,
        total: s.total,
        type: {
          title: t("application_type"),
          items: [
            { label: t("pair"), count: s.pair, percent: pct(s.pair, s.total), color: "bg-blue-600" },
            { label: t("solo"), count: s.solo, percent: pct(s.solo, s.total), color: "bg-orange-500" },
          ],
        },
        degrees: { title: t("by_degree_level"), items: toBreakdown(s.degreeCounts, s.total) },
        genders: { title: t("by_gender"), items: toBreakdown(s.genderCounts, s.total) },
      }))
      .sort((a, b) => b.total - a.total || a.subjectName.localeCompare(b.subjectName));
  }, [subjects, candidatures, t]);

  const [activeIndex, setActiveIndex] = useState(0);
  const safeIndex = rows.length === 0 ? 0 : Math.min(activeIndex, rows.length - 1);
  const active = rows[safeIndex];

  const goPrev = () => {
    if (rows.length === 0) return;
    setActiveIndex((safeIndex - 1 + rows.length) % rows.length);
  };

  const goNext = () => {
    if (rows.length === 0) return;
    setActiveIndex((safeIndex + 1) % rows.length);
  };

  interface SectionConfig {
    section: Section;
    colorOffset: number;
  }

  // Each section starts at a different point of the palette so its items get
  // their own colors instead of every section reusing the same first colors.
  const sections: SectionConfig[] = active
    ? [
        { section: active.type, colorOffset: 0 },
        { section: active.degrees, colorOffset: 2 },
        { section: active.genders, colorOffset: 5 },
      ]
    : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <IconNotebook className="size-5 text-primary" />
        <h2 className="text-lg font-semibold tracking-tight">{t("subject_kpis")}</h2>
        {!isLoading && rows.length > 0 && (
          <Badge
            variant="secondary"
            className="px-2.5 py-1 text-sm font-bold tabular-nums"
          >
            {rows.length} {t("total_subjects")}
          </Badge>
        )}
      </div>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{t("loading")}</p>
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t("subject_kpis_empty")}
        </p>
      ) : (
        <Card className="relative w-full overflow-hidden rounded-xl border-border/50 shadow-lg transition-all hover:shadow-xl">
          <div className="h-0.5 w-full bg-gradient-to-r from-[#1d7cc7] via-[#12b9da] to-[#647988]" />

          <CardHeader className="border-b border-border/40 py-3 pr-52">
            <div className="flex min-w-0 items-center gap-2.5">
              <IconNotebook className="size-6 shrink-0 text-primary" />
              <CardTitle className="truncate text-xl font-bold tracking-tight">
                {active.subjectName}
              </CardTitle>
            </div>
          </CardHeader>

          {/* Switch controls pinned to the top-right corner of the card */}
          <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={goPrev}
              aria-label={t("previous")}
            >
              <IconChevronLeft className="size-4" />
            </Button>
            <Select
              value={String(safeIndex)}
              onValueChange={(v) => setActiveIndex(Number(v))}
            >
              <SelectTrigger size="sm" className="max-w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {rows.map((row, i) => (
                  <SelectItem key={row.subjectName} value={String(i)}>
                    <span className="min-w-0 truncate">{row.subjectName}</span>
                    <span className="ml-1 text-muted-foreground">
                      {row.total}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={goNext}
              aria-label={t("next")}
            >
              <IconChevronRight className="size-4" />
            </Button>
            <span className="min-w-12 text-center text-xs font-medium tabular-nums text-muted-foreground">
              {safeIndex + 1} / {rows.length}
            </span>
          </div>

          <CardContent>
            <div className="mb-5 flex items-end gap-2">
              <span className="text-4xl font-bold tracking-tight text-foreground">
                {active.total.toLocaleString()}
              </span>
              <span className="mb-1 text-sm font-medium text-muted-foreground">
                {t("total_candidatures")}
              </span>
            </div>

            <div className="mb-6 border-b border-border/40" />

            <div
              className={cn(
                "grid gap-x-8 gap-y-6",
                sections.filter((s) => s.section.items.length > 0).length > 1 && "md:grid-cols-2",
              )}
            >
              {sections.map(({ section, colorOffset }) => (
                <BreakdownSection
                  key={section.title}
                  title={section.title}
                  items={section.items}
                  colorOffset={colorOffset}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}