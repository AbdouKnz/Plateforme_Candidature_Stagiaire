import { useNavigate } from "react-router-dom"
import {
  ArrowRightIcon,
  SparklesIcon,
} from "lucide-react"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { useTranslation } from "@/context/language-context"
import { AuroraBackground } from "@/components/ui/animated-background"

export function HomePage() {
  const t = useTranslation()
  const navigate = useNavigate()

  return (
    <AuroraBackground className="min-h-svh">
        <Navbar />

        {/* ── Hero ── */}
        <section className="relative flex min-h-[90vh] items-center px-6 pt-32 pb-20 sm:px-8">
          <div className="mx-auto w-full max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
              <SparklesIcon className="size-3.5" />
              {t("home.badge")}
            </div>

            <h1 className="text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {t("home.heroTitle1")}<br />
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                {t("home.heroTitle2")}
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("home.description")}
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => navigate("/form")}
                className="group inline-flex h-12 cursor-pointer items-center gap-2.5 rounded-xl bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0"
              >
                {t("home.cta")}
                <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <button
                onClick={() => navigate("/about")}
                className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-xl border border-border bg-card dark:bg-white/5 px-6 text-sm font-semibold text-foreground shadow-sm transition-all hover:bg-card dark:hover:bg-white/10 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
              >
                {t("home.ctaSecondary")}
              </button>
            </div>

            <p className="mt-5 text-xs text-muted-foreground/60">
              {t("home.noCommitment")}
            </p>
          </div>
        </section>

        <Footer />
    </AuroraBackground>
  )
}