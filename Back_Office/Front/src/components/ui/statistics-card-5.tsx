import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-1';
import { cn } from '@/lib/utils';

const STAT_COLORS = [
  { bar: 'bg-[#1d7cc7]', text: 'text-[#1d7cc7] dark:text-[#5aa3d8]', chip: 'bg-[#1d7cc7]/15 text-[#155a8a] dark:text-[#8fc3e5]' },
  { bar: 'bg-sky-500', text: 'text-sky-600 dark:text-sky-400', chip: 'bg-sky-500/15 text-sky-700 dark:text-sky-300' },
  { bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', chip: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
  { bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', chip: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
  { bar: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400', chip: 'bg-rose-500/15 text-rose-700 dark:text-rose-300' },
  { bar: 'bg-indigo-500', text: 'text-indigo-600 dark:text-indigo-400', chip: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300' },
  { bar: 'bg-teal-500', text: 'text-teal-600 dark:text-teal-400', chip: 'bg-teal-500/15 text-teal-700 dark:text-teal-300' },
  { bar: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400', chip: 'bg-orange-500/15 text-orange-700 dark:text-orange-300' },
  { bar: 'bg-pink-500', text: 'text-pink-600 dark:text-pink-400', chip: 'bg-pink-500/15 text-pink-700 dark:text-pink-300' },
  { bar: 'bg-cyan-500', text: 'text-cyan-600 dark:text-cyan-400', chip: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300' },
];

export interface StatisticBreakdownItem {
  label: string;
  count: number;
  percent: number;
}

export interface StatisticBreakdown {
  title: string;
  items: StatisticBreakdownItem[];
}

export interface StatisticCard5Props {
  title?: string;
  total: number;
  breakdowns?: StatisticBreakdown[];
}

function BreakdownSection({
  title,
  items,
  colors,
}: {
  title: string;
  items: StatisticBreakdownItem[];
  colors: { bar: string; text: string; chip: string }[];
}) {
  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold text-foreground">{title}</h4>
      <div className="space-y-2.5">
        {items.map((item, i) => (
          <div key={item.label} className="flex items-center gap-2.5 text-sm">
            <span className={cn('size-2 shrink-0 rounded-full', colors[i].bar)} />
            <span className="min-w-0 flex-1 truncate font-medium text-muted-foreground" title={item.label}>
              {item.label}
            </span>
            <div className="h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-muted sm:w-36">
              <div
                className={cn('h-full rounded-full transition-all', colors[i].bar)}
                style={{ width: `${item.percent}%` }}
              />
            </div>
            <span className={cn('w-10 shrink-0 text-right font-semibold tabular-nums', colors[i].text)}>
              {item.count}
            </span>
            <span className="flex w-16 shrink-0 justify-end">
              <span
                className={cn('rounded-md px-1.5 py-0.5 text-sm font-bold tabular-nums', colors[i].chip)}
              >
                {item.percent}%
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatisticCard5({
  title = 'Total Candidatures',
  total,
  breakdowns = [],
}: StatisticCard5Props) {
  // Assign every stat a distinct color across all sections
  const colorIndex = new Map<string, number>();
  let next = 0;
  for (const section of breakdowns) {
    for (const item of section.items) {
      if (!colorIndex.has(item.label)) {
        colorIndex.set(item.label, next++);
      }
    }
  }

  const visibleSections = breakdowns
    .filter((section) => section.items.length > 0)
    .map((section) => ({
      ...section,
      items: [...section.items].sort((a, b) => b.percent - a.percent),
    }));
  const hasBreakdowns = visibleSections.length > 0;

  return (
    <Card className="w-full rounded-xl border-border/50 shadow-lg transition-all hover:shadow-xl">
      <div className="h-0.5 w-full bg-gradient-to-r from-[#1d7cc7] via-[#12b9da] to-[#647988]" />

      <CardHeader className="border-0 pb-2 pt-5">
        <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="mb-5 flex items-end gap-2">
          <span className="text-4xl font-bold tracking-tight text-foreground">{total.toLocaleString()}</span>
        </div>

        <div className="mb-6 border-b border-border/40" />

        {!hasBreakdowns ? (
          <p className="py-4 text-center text-xs text-muted-foreground">—</p>
        ) : (
          <div className={cn('grid gap-x-6 gap-y-6', visibleSections.length > 1 && 'md:grid-cols-2')}>
            {visibleSections.map((section) => (
              <BreakdownSection
                key={section.title}
                title={section.title}
                items={section.items}
                colors={section.items.map(
                  (item) => STAT_COLORS[(colorIndex.get(item.label) ?? 0) % STAT_COLORS.length],
                )}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
