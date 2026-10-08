import { ShieldCheckIcon, XIcon } from "lucide-react"
import { useTranslation } from "@/context/language-context"

/**
 * Persistent banner shown on every route while the admin preview is
 * unlocked. Makes it unmistakable that the public site is closed and this
 * is a privileged view — with a one-click exit that re-locks preview.
 */
export function AdminPreviewBanner({ onExit }: { onExit: () => void }) {
  const t = useTranslation()
  return (
    <div className="sticky top-0 z-50 flex w-full items-center justify-center gap-2 border-b border-primary/25 bg-primary/10 px-4 py-2">
      <ShieldCheckIcon className="size-4 shrink-0 text-primary" />
      <p className="truncate text-xs font-semibold text-primary">
        {t("admin_access.banner")}
      </p>
      <button
        type="button"
        onClick={onExit}
        className="ml-2 inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-full border border-primary/30 px-3 py-1 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-white"
      >
        <XIcon className="size-3" />
        {t("admin_access.exit")}
      </button>
    </div>
  )
}
