import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { NavItem, SidebarData, NavGroup } from "@/models/sidebar-model";
import { useEffect, useState } from "react";
import { usePermissions } from '@/hooks/use-permissions'
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sleep(ms: number = 1000) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Generates page numbers for pagination with ellipsis
 * @param currentPage - Current page number (1-based)
 * @param totalPages - Total number of pages
 * @returns Array of page numbers and ellipsis strings
 *
 * Examples:
 * - Small dataset (≤5 pages): [1, 2, 3, 4, 5]
 * - Near beginning: [1, 2, 3, 4, '...', 10]
 * - In middle: [1, '...', 4, 5, 6, '...', 10]
 * - Near end: [1, '...', 7, 8, 9, 10]
 */
export function useDebounce(value: string | undefined, delay: number) {
  // State and setters for debounced value
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(
    () => {
      // Update debounced value after delay
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);
      // Cancel the timeout if value changes (also on delay change or unmount)
      // This is how we prevent debounced value from updating if value is changed ...
      // .. within the delay period. Timeout gets cleared and restarted.
      return () => {
        clearTimeout(handler);
      };
    },
    [value, delay], // Only re-call effect if value or delay changes
  );
  return debouncedValue;
}

export const createDownloadLink = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export function getDateRange(form: any) {
  const earlySale = form.watch("early_sale");
  const lastExit = form.watch("last_exit");
  const minDate = earlySale ? new Date(earlySale) : undefined;
  const maxDate = lastExit ? new Date(lastExit) : undefined;

  return { minDate, maxDate };
}

export const getDefaultPopupValue = (form: any, isShortEvent: boolean) => {
  const startTime = form.watch("start_time");
  if (isShortEvent && startTime) return new Date(startTime);
  return new Date(new Date().setHours(0, 0, 0, 0));
};

// filter-settings.ts
export function filterSettingsByGroup(settings: any[] = [], group: string) {
  return settings?.filter((item) => item.group === group);
}

// format.ts (or any utils file)
export function formatLabel(key: string): string {
  return key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Format a number into Kuwaiti Dinar (KWD) currency
/* export function formatKWD(
  amount?: number | null,
  withFormatting: boolean = true,
): string {
  const settings = useAuthStore((state) => state.user?.settings);
  const currency = settings?.currency;
  const denominator = settings?.denominator;
  const denominatorNum = Number(denominator)
  if (amount == null || isNaN(amount)) return "-";

  const dinarAmount = !withFormatting ? amount : amount / denominatorNum;

  const formatted = new Intl.NumberFormat("en-KW", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(dinarAmount);

  return `${formatted} ${currency}`;
} */


export function getPageNumbers(currentPage: number, totalPages: number) {
  const maxVisiblePages = 5 // Maximum number of page buttons to show
  const rangeWithDots = []

  if (totalPages <= maxVisiblePages) {
    // If total pages is 5 or less, show all pages
    for (let i = 1; i <= totalPages; i++) {
      rangeWithDots.push(i)
    }
  } else {
    // Always show first page
    rangeWithDots.push(1)

    if (currentPage <= 3) {
      // Near the beginning: [1] [2] [3] [4] ... [10]
      for (let i = 2; i <= 4; i++) {
        rangeWithDots.push(i)
      }
      rangeWithDots.push('...', totalPages)
    } else if (currentPage >= totalPages - 2) {
      // Near the end: [1] ... [7] [8] [9] [10]
      rangeWithDots.push('...')
      for (let i = totalPages - 3; i <= totalPages; i++) {
        rangeWithDots.push(i)
      }
    } else {
      // In the middle: [1] ... [4] [5] [6] ... [10]
      rangeWithDots.push('...')
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        rangeWithDots.push(i)
      }
      rangeWithDots.push('...', totalPages)
    }
  }

  return rangeWithDots
}

export function useFilteredSidebarData(sidebarData: SidebarData): SidebarData {
  const { canAccess } = usePermissions()

  const filterNavItems = (items: NavItem[]): NavItem[] => {
    return items
      .filter((item) => {
        // If item has a module, check permission
        if (item.module) {
          return canAccess(item.module)
        }
        // If no module specified, allow access (e.g., Dashboard, Auth pages)
        return true
      })
      .map((item) => {
        // If item has nested items, recursively filter them
        if (item.items) {
          const filteredSubItems = filterNavItems(item.items)
          // Only include parent if it has accessible children
          if (filteredSubItems.length > 0) {
            return { ...item, items: filteredSubItems }
          }
          // If parent has module permission but no children, still show it
          if (item.module && canAccess(item.module)) {
            return item
          }
          return null
        }
        return item
      })
      .filter((item): item is NavItem => item !== null)
  }

  const filterNavGroups = (navGroups: NavGroup[]): NavGroup[] => {
    return navGroups
      .map((group) => ({
        ...group,
        items: filterNavItems(group.items),
      }))
      .filter((group) => group.items.length > 0) // Remove empty groups
  }

  return {
    ...sidebarData,
    navGroups: filterNavGroups(sidebarData.navGroups),
  }
}