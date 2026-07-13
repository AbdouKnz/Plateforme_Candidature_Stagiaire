import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import { useNavigate } from "react-router-dom"
import {
  ArrowRightIcon,
  CodeIcon,
  UsersIcon,
  TrendingUpIcon,
  SparklesIcon,
  TargetIcon,
} from "lucide-react"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { useTranslation } from "@/context/language-context"
import { cn } from "@/lib/utils"

function FloatingShapes() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-24 -right-24 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-primary/8 to-secondary/5 blur-3xl animate-pulse-glow" />
      <div className="absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-accent/8 to-primary/5 blur-3xl animate-float" />
      <div className="absolute top-1/3 left-1/4 h-64 w-64 rounded-full bg-gradient-to-r from-primary/5 to-secondary/5 blur-3xl animate-float-delayed" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(109,40,217,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(109,40,217,0.04)_1px,transparent_1px)] bg-[size:64px_64px]" />
    </div>
  )
}

export function HomePage() {
  const t = useTranslation()
  const navigate = useNavigate()
  const [page, setPage] = useState(0)

  const whyJoinItems = [
    { icon: CodeIcon, title: t("home.why.realProjects"), desc: t("home.why.realProjectsDesc"), gradient: "from-primary/20 to-primary/5", iconColor: "text-primary" },
    { icon: UsersIcon, title: t("home.why.expertMentorship"), desc: t("home.why.expertMentorshipDesc"), gradient: "from-secondary/20 to-secondary/5", iconColor: "text-secondary" },
    { icon: TargetIcon, title: t("home.why.learningOpp"), desc: t("home.why.learningOppDesc"), gradient: "from-accent/20 to-accent/5", iconColor: "text-accent" },
    { icon: TrendingUpIcon, title: t("home.why.careerGrowth"), desc: t("home.why.careerGrowthDesc"), gradient: "from-primary/20 to-secondary/5", iconColor: "text-primary" },
  ]

  const processSteps = [
    { step: "01", title: t("home.process.application"), icon: "📝", desc: t("home.process.applicationDesc") },
    { step: "02", title: t("home.process.review"), icon: "🔍", desc: t("home.process.reviewDesc") },
    { step: "03", title: t("home.process.interview"), icon: "💬", desc: t("home.process.interviewDesc") },
    { step: "04", title: t("home.process.selection"), icon: "✅", desc: t("home.process.selectionDesc") },
    { step: "05", title: t("home.process.internship"), icon: "🚀", desc: t("home.process.internshipDesc") },
  ]

  const nextPage = useCallback(() => setPage((p) => (p + 1) % 2), [])

  useEffect(() => {
    const timer = setInterval(nextPage, 5000)
    return () => clearInterval(timer)
  }, [nextPage])

  return (
    <div className="relative min-h-svh bg-background">
      <FloatingShapes />

      <div className="relative z-10">
        <Navbar />

        {/* ── Hero + Right Card ── */}
        <section className="relative flex min-h-[90vh] items-center px-6 pt-32 pb-20 sm:px-8">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left Column - Text */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
                <SparklesIcon className="size-3.5" />
                {t("home.badge")}
              </div>

              <h1 className="text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Build Your Future<br />
                <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  With Us
                </span>
              </h1>

              <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
                {t("home.description")}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => navigate("/form")}
                  className="group inline-flex h-12 cursor-pointer items-center gap-2.5 rounded-xl bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0"
                >
                  {t("home.cta")}
                  <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
                </button>
                <button
                  onClick={() => navigate("/about")}
                  className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-xl border border-border bg-white/70 dark:bg-white/5 px-6 text-sm font-semibold text-foreground shadow-sm transition-all hover:bg-white dark:hover:bg-white/10 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                >
                  {t("home.ctaSecondary")}
                </button>
              </div>

              <p className="mt-5 text-xs text-muted-foreground/60">
                {t("home.noCommitment")}
              </p>
            </motion.div>

            {/* Right Column - Auto-switching card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
                {/* Tab header */}
                <div className="flex border-b border-border/50">
                  <button
                    onClick={() => setPage(0)}
                    className={cn(
                      "flex-1 px-4 py-3 text-xs font-semibold tracking-wide transition-colors relative",
                      page === 0
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t("form.whyApply")}
                    {page === 0 && (
                      <motion.div
                        layoutId="card-tab"
                        className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full"
                      />
                    )}
                  </button>
                  <button
                    onClick={() => setPage(1)}
                    className={cn(
                      "flex-1 px-4 py-3 text-xs font-semibold tracking-wide transition-colors relative",
                      page === 1
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t("form.stepsTitle")}
                    {page === 1 && (
                      <motion.div
                        layoutId="card-tab"
                        className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full"
                      />
                    )}
                  </button>
                </div>

                <div className="relative min-h-[520px] sm:min-h-[580px]">
                  <AnimatePresence mode="wait">
                    {page === 0 ? (
                      <motion.div
                        key="why"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="absolute inset-0 p-5 sm:p-6"
                      >
                        <div className="grid h-full grid-cols-2 gap-3">
                          {whyJoinItems.map((item, i) => (
                            <div
                              key={i}
                              className="flex flex-col justify-center rounded-xl border border-border/60 bg-muted/40 p-5"
                            >
                              <div className={cn(
                                "mb-3 flex size-10 items-center justify-center rounded-xl bg-gradient-to-br",
                                item.gradient,
                                item.iconColor
                              )}>
                                <item.icon className="size-5" />
                              </div>
                              <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="process"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="absolute inset-0 p-5 sm:p-6"
                      >
                        <div className="relative flex h-full flex-col">
                          {processSteps.map((step, i) => (
                            <div key={i} className="relative flex flex-1 items-start gap-4 pl-10">
                              {i < processSteps.length - 1 && (
                                <div className="absolute left-[13px] top-[32px] bottom-0 w-0.5 bg-gradient-to-b from-primary/25 to-primary/5" />
                              )}
                              <div className="absolute left-0 top-3 flex size-7 items-center justify-center rounded-full border-2 border-primary/30 bg-card text-xs font-bold text-primary shadow-sm">
                                {step.step}
                              </div>
                              <div className="flex flex-1 items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 min-h-[56px]">
                                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-base">
                                  {step.icon}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm font-semibold text-foreground sm:text-base">{step.title}</span>
                                  <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{step.desc}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Dots */}
                <div className="flex items-center justify-center gap-2 pb-4">
                  {[0, 1].map((i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i)}
                      className={cn(
                        "size-2 rounded-full transition-all duration-300",
                        page === i ? "bg-primary w-5" : "bg-muted-foreground/20 hover:bg-muted-foreground/40",
                      )}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>



        <Footer />
      </div>
    </div>
  )
}
