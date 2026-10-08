import { useState } from "react"
import { motion } from "motion/react"
import { EyeIcon, EyeOffIcon, LockIcon } from "lucide-react"
import { useTranslation } from "@/context/language-context"
import { useTheme } from "@/context/theme-context"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { AuroraBackground } from "@/components/ui/animated-background"
import { verifyAdminAccess } from "@/service/front-office"

/**
 * Admin security page behind /access/admin. The password is verified
 * server-side against the Admin_View environment value; only then is the
 * front-office preview (which bypasses the open/closed check) unlocked.
 */
export function AdminAccessPage({ onUnlock }: { onUnlock: () => void }) {
  const t = useTranslation()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [state, setState] = useState<"idle" | "loading" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password || state === "loading") return
    setState("loading")
    setErrorMsg("")
    try {
      const { authorized } = await verifyAdminAccess(password)
      if (!authorized) {
        setErrorMsg(t("admin_access.invalid"))
        setState("error")
        return
      }
      onUnlock()
    } catch (err: any) {
      if (err?.status === 401) {
        setErrorMsg(t("admin_access.invalid"))
      } else {
        setErrorMsg(t("admin_access.error"))
      }
      setState("error")
    }
  }

  return (
    <AuroraBackground className="min-h-svh">
      <div className="relative flex flex-col items-center justify-center w-full flex-1 px-6 py-16 sm:px-8">
        <div className="absolute top-6 left-6">
          <img
            src="/PC_Logo.png"
            alt="Park & Charge"
            width={200}
            height={200}
            className="h-24 w-28 object-contain -my-4 sm:h-[180px] sm:w-[200px] sm:-my-14"
          />
        </div>
        <div className="absolute top-6 right-6 flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className={`w-full max-w-md rounded-2xl border p-8 text-center shadow-xl ${isDark ? "border-white/15 bg-white/5" : "border-border bg-card"}`}
        >
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/25">
            <LockIcon className="size-5" />
          </div>
          <h1 className={`mt-4 text-2xl font-bold tracking-tight ${isDark ? "text-white" : "text-foreground"}`}>
            {t("admin_access.title")}
          </h1>
          <p className={`mt-2 text-sm ${isDark ? "text-white/60" : "text-muted-foreground"}`}>
            {t("admin_access.description")}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
            <label
              htmlFor="admin-password"
              className={`text-left text-sm font-medium ${isDark ? "text-white/80" : "text-foreground"}`}
            >
              {t("admin_access.passwordLabel")}
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                value={password}
                autoComplete="current-password"
                onChange={(e) => {
                  setPassword(e.target.value)
                  setErrorMsg("")
                  if (state === "error") setState("idle")
                }}
                placeholder={t("admin_access.passwordPlaceholder")}
                className={`h-11 w-full rounded-xl border px-4 pr-11 text-left text-sm outline-none transition-colors ${isDark ? "border-white/15 bg-white/5 text-white placeholder:text-white/40 focus:border-secondary" : "border-border bg-card text-foreground placeholder:text-muted-foreground focus:border-secondary"} ${errorMsg ? "border-destructive" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? t("admin_access.hidePassword") : t("admin_access.showPassword")}
                className={`absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer ${isDark ? "text-white/50 hover:text-white" : "text-muted-foreground hover:text-foreground"}`}
              >
                {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
              </button>
            </div>
            {errorMsg && (
              <p className="text-left text-xs text-destructive">{errorMsg}</p>
            )}
            <button
              type="submit"
              disabled={!password || state === "loading"}
              className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-gradient-to-r from-primary to-secondary px-7 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.03] active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {state === "loading" ? (
                <span className="flex items-center gap-1.5">
                  <svg
                    className="animate-spin size-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  {t("admin_access.verifying")}
                </span>
              ) : (
                t("admin_access.submit")
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AuroraBackground>
  )
}
