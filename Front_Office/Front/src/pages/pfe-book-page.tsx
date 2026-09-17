import * as React from "react"
import { motion } from "motion/react"
import { useLocation, useNavigate } from "react-router-dom"
import { fetchSubjects, fetchFrontOfficeStatus } from "@/service/front-office"
import type { Subject } from "@/models/api"
import { Button } from "@/components/ui/button"
import { WhoAreWeContent } from "@/components/about/who-are-we"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useTheme } from "@/context/theme-context"
import MoltenMetal from "@/components/ui/molten-metal"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BookmarkIcon,
  BookmarkCheckIcon,
  GraduationCapIcon,
  UsersIcon,
  LightbulbIcon,
  HeartHandshakeIcon,
  BuildingIcon,
  MailIcon,
  QuoteIcon,
  CheckIcon,
  SparklesIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  RocketIcon,
  ScaleIcon,
  ClockIcon,
  HandshakeIcon,
  UserIcon,
  CalendarIcon,
  GlobeIcon,
  LayersIcon,
} from "lucide-react"

function LinkedinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
}

const WHY_STEPS = [
  { n: "01", title: "Hands-On Experience", desc: "Gain practical skills through direct involvement in real product features not shadowing, building.", icon: BuildingIcon },
  { n: "02", title: "Real Projects", desc: "Work on production systems that serve cities and thousands of users from day one.", icon: RocketIcon },
  { n: "03", title: "Mentorship", desc: "Guidance from senior engineers, designers, and product leaders invested in your growth.", icon: GraduationCapIcon },
  { n: "04", title: "Paid Internship", desc: "You work, you get paid as simple as that. Fair compensation and recognition.", icon: HeartHandshakeIcon },
]

const MINDSET_STEPS = [
  { n: "01", title: "We will challenge you", desc: "We are different, join us to know how.", icon: ScaleIcon },
  { n: "02", title: "We will push you", desc: "Some say we are defined by our limitations, get ready for self awareness.", icon: LightbulbIcon },
  { n: "03", title: "Even if you fail, you will succeed", desc: "The road to success is paved by stepstones of failures.", icon: HeartHandshakeIcon },
]

const STORAGE_KEY = "pfe-book-shortlist"

function useShortlist() {
  const [ids, setIds] = React.useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })
  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  }, [ids])
  const toggle = React.useCallback((code: string) => {
    setIds((prev) => (prev.includes(code) ? [] : [code]))
  }, [])
  const clear = React.useCallback(() => setIds([]), [])
  return { ids, toggle, clear, has: (code: string) => ids.includes(code) }
}

function subjectImageUrl(s: Subject, _index: number) {
  const path = s.image_path?.trim()
  if (path) {
    if (path.startsWith("http") || path.startsWith("/")) return path
    return `/api/${path}`
  }
  return null
}

function AuroraLayer({ dark = false }: { dark?: boolean }) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  return (
    <div aria-hidden className="absolute inset-0 -z-10 bg-background">
      <div className="absolute inset-0">
        <MoltenMetal
          color1={isDark ? "#0F5C9E" : "#1D7CC7"}
          color2={isDark ? "#1D7CC7" : "#12B9DA"}
          color3={isDark ? "#B3E8F2" : "#12B9DA"}
          speed={0.35}
          scale={4}
          detail={3}
          glow={1.6}
          coreSize={0.1}
          swirl={1}
          fold={-0.2}
          blackPoint={isDark ? 0.1 : 0.14}
          brightness={isDark ? 1.35 : 1.28}
          colorMode="molten"
          grain
          grainIntensity={0.04}
          mouseInteraction
          mouseStrength={0.3}
          opacity={isDark ? 0.68 : 0.58}
        />
      </div>
      {dark && <div className="absolute inset-0 bg-white dark:bg-black/55" />}
    </div>
  )
}

function BrandLogo({ className = "" }: { className?: string }) {
  return <img src="/PC_Logo.png" alt="Asteroidea" className={className} />
}

export function PfeBookPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [subjects, setSubjects] = React.useState<Subject[]>([])
  const [loading, setLoading] = React.useState(true)
  const { ids: shortlist, toggle, clear, has } = useShortlist()
  const [year, setYear] = React.useState("2027")
  const [internshipTitle, setInternshipTitle] = React.useState("Internship Program 2027")
  const [notice, setNotice] = React.useState<string | null>(
    () => (location.state as { notice?: string } | null)?.notice ?? null
  )

  // Keep the banner in sync when the catalog is reached via a router-state notice
  // while the page is already mounted.
  React.useEffect(() => {
    setNotice((location.state as { notice?: string } | null)?.notice ?? null)
  }, [location.state])

  const containerRef = React.useRef<HTMLDivElement>(null)
  const [activePage, setActivePage] = React.useState(0)

  const totalPages = React.useMemo(() => 9 + subjects.length, [subjects.length])

  React.useEffect(() => {
    fetchSubjects()
      .then(setSubjects)
      .catch(() => setSubjects([]))
      .finally(() => setLoading(false))
  }, [])

  React.useEffect(() => {
    fetchFrontOfficeStatus()
      .then((status) => {
        if (status.year) setYear(status.year)
        if (status.internship_title) setInternshipTitle(status.internship_title)
      })
      .catch(() => {})
  }, [])

  const titleParts = React.useMemo(() => {
    const parts = internshipTitle.trim().split(/\s+/)
    if (parts.length <= 1) return { top: internshipTitle.trim(), bottom: "" }
    return { top: parts.slice(0, -1).join(" "), bottom: parts[parts.length - 1] }
  }, [internshipTitle])

  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const sections = Array.from(container.querySelectorAll<HTMLElement>("[data-page]"))
    if (sections.length === 0) return
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) {
          const idx = Number((visible.target as HTMLElement).dataset.page)
          setActivePage(idx)
        }
      },
      { root: container, threshold: [0.5, 0.7] }
    )
    sections.forEach((s) => obs.observe(s))
    return () => obs.disconnect()
  }, [subjects.length, loading])

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault()
        goTo(activePage + 1)
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault()
        goTo(activePage - 1)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage, totalPages])

  const goTo = React.useCallback(
    (idx: number) => {
      const clamped = Math.max(0, Math.min(totalPages - 1, idx))
      const container = containerRef.current
      if (!container) return
      const target = container.querySelector<HTMLElement>(`[data-page="${clamped}"]`)
      if (!target) return
      const prevSnap = container.style.scrollSnapType
      container.style.scrollSnapType = "none"
      // offsetLeft is relative to offsetParent — subtract container's own offset for exact position
      const left = target.offsetLeft - container.offsetLeft
      const onEnd = () => {
        container.style.scrollSnapType = prevSnap
        container.removeEventListener("scrollend", onEnd)
      }
      container.addEventListener("scrollend", onEnd, { once: true } as any)
      container.scrollTo({ left, behavior: "smooth" })
      window.setTimeout(() => {
        container.style.scrollSnapType = prevSnap
        container.removeEventListener("scrollend", onEnd as any)
      }, 500)
    },
    [totalPages]
  )

  const scrollToSubject = (code: string) => {
    const idx = subjects.findIndex((s) => s.code === code)
    if (idx === -1) return
    goTo(5 + idx)
  }

  // Pre-selected subject resolved against the loaded catalog — used by the shortlist page.
  const shortlistedSubject = React.useMemo(
    () => subjects.find((s) => s.code === shortlist[0]) ?? null,
    [subjects, shortlist]
  )

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#FFFFFF]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1D7CC7] border-t-transparent" />
      </div>
    )
  }

  const progress = ((activePage + 1) / totalPages) * 100

  const showSubjectNotFound = notice === "sujet-introuvable"

  return (
    <div className="pfe-book flex h-[100dvh] w-screen flex-col overflow-hidden bg-[#FFFFFF] text-[#24243C] selection:bg-primary/20">
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, #1D7CC7 1px, transparent 0)`, backgroundSize: "24px 24px" }} />

      {showSubjectNotFound && (
        <div className="relative z-50 flex items-center justify-center gap-3 border-b border-[#1D7CC7]/20 bg-[#F1F4F8] px-4 py-2.5 text-sm text-[#24243C]">
          <span className="font-medium">Subject not found — explore the available subjects below.</span>
          <button
            type="button"
            onClick={() => {
              setNotice(null)
              navigate("/pfe-book", { replace: true, state: {} })
            }}
            className="inline-flex size-6 items-center justify-center rounded-full text-[#24243C]/60 transition-colors fine-hover:bg-[#1D7CC7]/10 fine-hover:text-[#24243C]"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── horizontally scrollable book ── */}
      <div
        ref={containerRef}
        className="pfe-book-scroller flex min-h-0 w-full flex-1 overflow-x-auto overflow-y-hidden snap-x snap-proximity scroll-smooth scrollbar-hide"
      >
        {/* ── COVER: PFE BOOK 2027 ── REDESIGNED CENTERED LAYOUT */}
        <section
          data-page={0}
          className="relative flex h-full w-screen shrink-0 snap-start flex-col isolate overflow-hidden bg-[#FFFFFF] text-[#24243C] dark:text-[#24243C]"
        >
          {/* Background layers — colors unchanged */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1D7CC7]/10 via-[#FFFFFF] to-[#1D7CC7]/10" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, #1D7CC7 1px, transparent 0)`, backgroundSize: "24px 24px" }} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1D7CC7]/10 via-transparent to-transparent" />



          {/* Ghost year watermark */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center select-none">
            <span className="text-[22vw] font-black text-[#1D7CC7]/[0.05] tracking-tighter leading-none">{year}</span>
          </div>

          {/* Top bar: logo */}
          <div className="relative z-10 flex shrink-0 items-center justify-between px-6 sm:px-8 lg:px-12 py-2">
            <BrandLogo className="h-24 w-28 object-contain -my-4 sm:h-[180px] sm:w-[200px] sm:-my-14 drop-shadow-xl" />
          </div>

          {/* ── Main centered hero ── */}
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 sm:px-10 lg:px-16 gap-0">

            {/* Live badge */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-[#1D7CC7]/40 bg-[#1D7CC7]/10 backdrop-blur px-4 py-1.5">
                <span className="size-1.5 rounded-full bg-accent animate-pulse" />
                <span className="text-[12px] font-bold tracking-[0.18em] text-[#24243C] uppercase">Internship Program 2027</span>
              </div>
            </motion.div>

            {/* Title block */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="mt-7 text-center"
            >
              <h1 className="text-[clamp(3.5rem,9vw,7.5rem)] font-black tracking-tight text-[#24243C] leading-[0.9]">
                <span className="block">{titleParts.top}</span>
                {titleParts.bottom && (
                  <span className="block font-extralight text-[#24243C]/80 tracking-[0.18em]">{titleParts.bottom}</span>
                )}
              </h1>
              {/* Decorative accent line + year */}
              <div className="mt-4 flex items-center justify-center gap-4">
                <div className="h-px flex-1 max-w-[80px] bg-gradient-to-r from-transparent to-[#1D7CC7]/60" />
                <span className="text-2xl sm:text-3xl font-light tracking-[0.35em] text-[#12B9DA]">{year}</span>
                <div className="h-px flex-1 max-w-[80px] bg-gradient-to-l from-transparent to-[#1D7CC7]/60" />
              </div>
            </motion.div>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.6 }}
              className="mt-7 max-w-lg text-center text-sm sm:text-[15px] leading-relaxed text-[#24243C]/60"
            >
              Shape the future with us ,{" "}
              <span className="text-[#24243C] font-semibold">your path begins here.</span>{" "}
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 flex flex-col sm:flex-row items-center gap-3"
            >
              <Button
                onClick={() => goTo(1)}
                size="lg"
                className="rounded-2xl bg-[#1D7CC7] text-[#FFFFFF] fine-hover:bg-[#0F5C9E] px-9 h-12 text-sm font-bold tracking-wide shadow-xl shadow-[#1D7CC7]/25 fine-hover:shadow-2xl fine-hover:-translate-y-0.5 transition-all"
              >
                Explore Book <ArrowRightIcon className="size-4" />
              </Button>
              <Button
                onClick={() => goTo(4)}
                variant="outline"
                size="lg"
                className="rounded-2xl border border-[#1D7CC7]/40 bg-white text-[#24243C] dark:bg-white dark:text-[#24243C] dark:border-[#1D7CC7]/40 fine-hover:bg-[#1D7CC7]/5 fine-hover:text-[#24243C] px-9 h-12 text-sm font-bold"
              >
                View Subjects ({subjects.length})
              </Button>
            </motion.div>


          </div>

          {/* Bottom thin accent bar */}
          <div className="relative z-10 shrink-0 h-[3px] bg-gradient-to-r from-transparent via-[#1D7CC7]/50 to-transparent" />
        </section>

        {/* ── WHO ARE WE - PDF 01 ── DARK DESIGN COPY */}
        <section
          data-page={1}
          className="relative flex h-full w-screen shrink-0 snap-start flex-col isolate bg-[#FFFFFF] text-[#24243C] overflow-hidden"
        >
          <PageHeader number={1} total={totalPages} />
          <div className="relative z-10 flex flex-1 min-h-0 flex-col overflow-hidden bg-[#FCFDFE]">
            {/* Who are we? — reference About layout, fitted to the slide (no inner scrollbar on desktop) */}
            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin lg:overflow-hidden">
              <WhoAreWeContent compact />
            </div>
          </div>
        </section>

        {/* ── OUR CULTURE - PDF 02 ── VERTICAL CARDS (photo layout + your dark template colors) */}
        <section
          data-page={2}
          className="relative flex h-full w-screen shrink-0 snap-start flex-col isolate bg-[#FFFFFF] text-[#24243C] overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#1D7CC7]/10 via-[#FFFFFF] to-[#1D7CC7]/10" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, #1D7CC7 1px, transparent 0)`, backgroundSize: "24px 24px" }} />
          <PageHeader number={2} total={totalPages} />
          <div className="relative z-10 flex flex-1 min-h-0 flex-col px-3 sm:px-4 lg:px-8 xl:px-10 py-2 sm:py-3 overflow-hidden">
            {/* header - keep your template typography/colors but follow photo layout (centered title + subtitle) */}
            <div className="text-center shrink-0">
              <span className="inline-flex items-center rounded-full bg-[#1D7CC7] px-3.5 py-1 text-[12px] font-bold tracking-widest text-[#FFFFFF] uppercase shadow">The Heart of Our Team</span>
              <h2 className="mt-3 text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight leading-none"><span className="text-[#24243C]">Our </span><span className="text-[#12B9DA]">Culture</span></h2>
              <div className="mx-auto mt-3 h-px w-12 bg-[#F1F4F8]" />
            </div>

            {/* vertical cards - SPREAD ACROSS FULL PAGE WIDTH */}
            <div className="mt-5 sm:mt-6 flex-1 min-h-0 flex flex-col justify-center">
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-6 xl:gap-8 w-full">
                {[
                  {
                    title: "Company Culture",
                    desc: "Our company culture is designed to be unique and supportive, specifically aimed at attracting and nurturing new talent.",
                    customIcon: "company",
                  },
                  {
                    title: "Inclusivity",
                    desc: "We prioritize inclusivity, ensuring that all employees feel valued and included in the team.",
                    customIcon: "inclusivity",
                  },
                  {
                    title: "Innovation",
                    desc: "Innovation is at the core of our culture, encouraging creativity and new ideas from all team members.",
                    customIcon: "innovation",
                  },
                  {
                    title: "Work-Life Balance",
                    desc: "We emphasize work-life balance, promoting a healthy separation between professional and personal life.",
                    customIcon: "worklife",
                  },
                  {
                    title: "Collaboration",
                    desc: "Collaboration is key in our workplace, fostering team work and open communication among all staff.",
                    customIcon: "collab",
                  },
                ].map((c) => (
                  <div
                    key={c.title}
                    className="group relative flex flex-col rounded-2xl border border-[#1D7CC7]/40 bg-[#F1F4F8] backdrop-blur p-5 sm:p-5 lg:px-5 lg:py-6 min-h-[310px] sm:min-h-[340px] lg:min-h-[440px] lg:h-[440px] shadow-sm fine-hover:bg-[#1D7CC7]/5 fine-hover:border-[#1D7CC7]/35 transition-all"
                  >
                    {/* title - enlarged again */}
                    <h3 className="text-center text-lg sm:text-xl lg:text-[22px] font-bold leading-tight tracking-tight text-[#24243C] min-h-[50px] flex items-center justify-center text-balance">{c.title}</h3>

                    {/* icon - CLEAN LUCIDE icons, larger & better readable */}
                    <div className="flex h-[110px] sm:h-[118px] items-center justify-center shrink-0 py-2">
                      <div className="flex size-[90px] sm:size-[94px] lg:size-[98px] items-center justify-center rounded-2xl bg-gradient-to-br from-[#1D7CC7] to-[#0F5C9E] text-[#FFFFFF] shadow-lg shadow-[#1D7CC7]/20">
                        {c.customIcon === "company" && <BuildingIcon className="size-[46px]" strokeWidth={1.7} />}
                        {c.customIcon === "inclusivity" && <UsersIcon className="size-[46px]" strokeWidth={1.7} />}
                        {c.customIcon === "innovation" && (
                          <div className="relative flex items-center justify-center">
                            <LightbulbIcon className="size-[46px]" strokeWidth={1.7} />
                            <SparklesIcon className="absolute -top-1 -right-1 size-4 text-[#24243C]/90" strokeWidth={2} />
                          </div>
                        )}
                        {c.customIcon === "worklife" && <ScaleIcon className="size-[46px]" strokeWidth={1.7} />}
                        {c.customIcon === "collab" && <HandshakeIcon className="size-[46px]" strokeWidth={1.7} />}
                      </div>
                    </div>

                    {/* desc - enlarged to fill empty space */}
                    <p className="text-center text-[15.5px] sm:text-base lg:text-lg leading-[1.5] text-[#24243C]/80 font-medium flex-1 flex items-start justify-center pt-1.5">{c.desc}</p>
                    <div className="mt-3 h-1 w-10 self-center rounded-full bg-[#F1F4F8] group-hover:w-14 group-hover:bg-[#1D7CC7] transition-all" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── WHY INTERN - PDF 03 ── GLASS */}
        <section
          data-page={3}
          className="relative flex h-full w-screen shrink-0 snap-start flex-col isolate bg-[#FFFFFF] text-[#24243C] overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#1D7CC7]/10 via-[#FFFFFF] to-[#1D7CC7]/10" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, #1D7CC7 1px, transparent 0)`, backgroundSize: "24px 24px" }} />
          <PageHeader number={3} total={totalPages} />
          <div className="relative z-10 flex flex-1 min-h-0 flex-col px-4 sm:px-6 lg:px-8 xl:px-10 py-3 overflow-hidden">
            <div className="flex flex-1 flex-col justify-center w-full">
              <div className="text-center max-w-3xl mx-auto shrink-0">
                <span className="inline-flex items-center rounded-full bg-[#1D7CC7] px-3.5 py-1 text-[12px] font-bold tracking-widest text-[#FFFFFF] uppercase shadow">WHY US</span>
                <h2 className="mt-3 text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight leading-none">
                  <span className="text-[#24243C]">Why</span> <span className="text-[#12B9DA]">Intern</span> <span className="text-[#24243C]">With Us?</span>
                </h2>
              </div>

              {/* ── WHY US TIMELINE — horizontal connected 4-step timeline ── */}
              <div className="relative w-full max-w-[1440px] mx-auto mt-10 lg:mt-12 flex-1 min-h-0 flex flex-col justify-center">
                {/* tablet & desktop — horizontal timeline: 4 circles on one line, content below, arrow at the end */}
                <div className="relative hidden md:grid grid-cols-4 gap-x-8 lg:gap-x-10 xl:gap-x-14">
                  {WHY_STEPS.map((c) => (
                    <div key={c.n} className="relative flex flex-col items-center text-center">
                      <div className="relative z-10 flex size-20 xl:size-28 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1D7CC7] to-[#0F5C9E] border border-[#1D7CC7]/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_0_45px_rgba(29,124,199,0.4)]">
                        <c.icon className="size-9 xl:size-12 text-[#FFFFFF]" strokeWidth={1.6} />
                      </div>
                      <span className="relative mt-4 xl:mt-5 text-xs xl:text-sm font-bold text-[#12B9DA]">{c.n}</span>
                      <h3 className="relative mt-1.5 text-lg sm:text-xl lg:text-[22px] font-bold leading-tight tracking-tight text-[#24243C] text-balance">{c.title}</h3>
                      <div className="relative mt-2.5 h-[3px] w-10 rounded-full bg-gradient-to-r from-[#1D7CC7] to-[#12B9DA]" />
                      <p className="relative mt-2.5 text-[15.5px] sm:text-base lg:text-lg leading-[1.5] text-[#24243C]/80 font-medium max-w-[clamp(220px,22vw,300px)]">{c.desc}</p>
                    </div>
                  ))}
                </div>

                {/* mobile — vertical stack */}
                <div className="relative flex-1 min-h-0 overflow-y-auto scrollbar-thin md:hidden">
                  <div className="flex flex-col gap-14">
                    {WHY_STEPS.map((c) => (
                      <div key={c.n} className="relative flex flex-col items-center text-center">
                        <div className="relative z-10 flex size-24 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1D7CC7] to-[#0F5C9E] border border-[#1D7CC7]/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_0_30px_rgba(29,124,199,0.4)]">
                          <c.icon className="size-11 text-[#FFFFFF]" strokeWidth={1.6} />
                        </div>
                        <span className="relative mt-4 text-xs font-bold text-[#12B9DA]">{c.n}</span>
                        <h3 className="relative mt-1.5 text-lg sm:text-xl font-bold leading-tight tracking-tight text-[#24243C] text-balance">{c.title}</h3>
                        <div className="relative mt-2.5 h-[3px] w-10 rounded-full bg-gradient-to-r from-[#1D7CC7] to-[#12B9DA]" />
                        <p className="relative mt-2.5 max-w-md text-[15.5px] sm:text-base leading-[1.5] text-[#24243C]/80 font-medium">{c.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── INDEX - PDF 05 ── GLASS */}
        <section
          data-page={4}
          className="relative flex h-full w-screen shrink-0 snap-start flex-col isolate bg-[#FFFFFF] text-[#24243C] overflow-hidden"
        >
          {/* navy/charcoal base + subtle radial blue glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1D7CC7]/10 via-[#FFFFFF] to-[#1D7CC7]/10" />
          <div className="absolute -top-1/3 left-1/2 h-[70vh] w-[110vw] -translate-x-1/2 rounded-full bg-[#1D7CC7]/20 blur-[160px]" />
          <div className="absolute -right-[10%] bottom-0 h-[50vh] w-[60vw] rounded-full bg-[#0F5C9E]/15 blur-[140px]" />
          <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, #1D7CC7 1px, transparent 0)`, backgroundSize: "24px 24px" }} />
          <PageHeader number={4} total={totalPages} />
          <div className="relative z-10 flex flex-1 min-h-0 flex-col py-4 overflow-hidden">
            <div className="flex w-full flex-1 min-h-0 flex-col">
              <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#24243C] tracking-tight">Internship Opportunities</h2>
                </div>
              </div>

              <div className="mt-5 flex flex-1 min-h-0 flex-col overflow-hidden px-4 sm:px-6 lg:px-10">
                <div className="flex-1 min-h-0 overflow-auto scrollbar-thin">
                  <table className="w-full min-w-[900px] text-left text-sm xl:text-[15px] border-collapse">
                    <thead className="sticky top-0 z-10">
                      <tr className="border-b border-[#DCE3EA] bg-[#F1F4F8] backdrop-blur-xl">
                        <th scope="col" className="px-4 py-5 font-bold uppercase tracking-[0.14em] text-[#24243C] whitespace-nowrap w-[11%] min-w-[130px] text-sm text-center">REFERENCE</th>
                        <th scope="col" className="px-4 py-5 w-[38%] min-w-[340px] font-bold uppercase tracking-[0.14em] text-[#24243C] text-sm text-center">PROJECT TITLE</th>
                        <th scope="col" className="px-4 py-5 w-[16%] min-w-[160px] font-bold uppercase tracking-[0.14em] text-[#24243C] text-sm text-center">PROFILE</th>
                        <th scope="col" className="px-4 py-5 w-[25%] min-w-[260px] font-bold uppercase tracking-[0.14em] text-[#24243C] text-sm text-center">TECHNOLOGIES</th>
                        <th scope="col" className="px-4 py-5 w-[10%] min-w-[110px] font-bold uppercase tracking-[0.14em] text-[#24243C] text-sm text-center">PAGE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DCE3EA]">
                      {subjects.map((s, idx) => {
                        const pageNum = 6 + idx
                        const profile = s.profiles && s.profiles.length > 0 ? s.profiles.map((p) => p.name).join(" / ") : "—"
                        return (
                          <tr key={s.id} onClick={() => scrollToSubject(s.code)} className="cursor-pointer group transition-colors fine-hover:bg-[#1D7CC7]/5 h-[100px]">
                            <td className="px-4 py-3 whitespace-nowrap text-[15px] font-mono font-bold tracking-wide text-[#24243C]/90 h-[100px] align-middle text-center">
                              <div className="flex h-full items-center justify-center">{s.code}</div>
                            </td>
                            <td className="px-4 py-3 text-base font-semibold leading-snug text-[#24243C] h-[100px] align-middle text-center">
                              <div className="flex h-full items-center justify-center">{s.name}</div>
                            </td>
                            <td className="px-4 py-3 text-base font-semibold leading-snug text-[#24243C] h-[100px] align-middle text-center">
                              <div className="flex h-full items-center justify-center">{profile}</div>
                            </td>
                            <td className="px-4 py-3 h-[100px] align-middle text-center">
                              <div className="flex h-full flex-wrap items-center content-center justify-center gap-2">
                                {s.technologies?.length ? (
                                  <>
                                    {s.technologies.slice(0, 5).map((t) => (
                                        <span key={t.id} className="inline-flex items-center rounded-full bg-[#F1F4F8] border border-[#1D7CC7]/30 px-4 py-2 text-sm font-semibold text-[#24243C] whitespace-nowrap shadow-sm">
                                        {t.name}
                                      </span>
                                    ))}
                                    {(s.technologies.length > 5) && (
                                      <span className="inline-flex items-center rounded-full bg-[#F1F4F8] border border-[#DCE3EA] px-3 py-1.5 text-[12px] font-bold text-[#24243C]/60">
                                        +{s.technologies.length - 5}
                                      </span>
                                    )}
                                  </>
                                ) : <span className="text-[#24243C]/40 text-sm">—</span>}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-base font-bold text-center tabular-nums text-[#24243C] h-[100px] align-middle">
                              <div className="flex h-full items-center justify-center">{String(pageNum).padStart(2, "0")}</div>
                            </td>
                          </tr>
                        )
                      })}
                      {subjects.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-16 text-center text-base text-[#24243C]/60">No subjects available yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SUBJECT PAGES ── FULL-PAGE LAYOUT */}
        {subjects.map((s, idx) => {
          const isSelected = has(s.code)
          const pageNo = 6 + idx
          return (
            <section
              key={s.id}
              data-page={5 + idx}
              className="relative flex h-full w-screen shrink-0 snap-start flex-col isolate bg-[#FFFFFF] text-[#24243C] overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#1D7CC7]/10 via-[#FFFFFF] to-[#1D7CC7]/10" />
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, #1D7CC7 1px, transparent 0)`, backgroundSize: "24px 24px" }} />

              {/* ── Full-height content grid ── */}
              <div className="relative z-10 flex flex-1 min-h-0 flex-col">

                {/* ── TOP: page indicator + subject header ── */}
                <div className="shrink-0 flex items-start justify-between gap-4 px-6 sm:px-8 lg:px-10 pt-4 pb-3">
                  {/* subject code + title */}
                  <div className="flex gap-3 min-w-0 flex-1">
                    <div className="hidden sm:block w-[3px] shrink-0 self-stretch rounded-full bg-[#12B9DA] mt-1" />
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#12B9DA]/30 bg-[#12B9DA]/10 px-3 py-1 text-[12px] font-bold tracking-wide text-[#12B9DA]">
                        <span className="size-2 rounded-full bg-[#12B9DA] shadow-[0_0_6px_rgba(18,185,218,0.6)]" />
                        {s.code}
                      </span>
                      <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-[2rem] font-black leading-tight tracking-tight text-[#24243C]">
                        {s.name}
                      </h2>
                    </div>
                  </div>
                  {/* page number */}
                  <span className="shrink-0 inline-flex items-center gap-2 rounded-full bg-[#F1F4F8] backdrop-blur border border-[#1D7CC7]/40 px-3 py-1.5 text-[12px] font-mono tracking-[0.18em] text-[#24243C]/50">
                    {String(pageNo).padStart(2, "0")} / {String(totalPages).padStart(2, "0")}
                  </span>
                </div>

                {/* ── MIDDLE: photo left + description+technologies right ── */}
                <div className="flex flex-1 min-h-0 flex-col gap-5 overflow-y-auto px-4 sm:px-8 lg:flex-row lg:gap-8 lg:overflow-hidden lg:px-10">

                  {/* LEFT — large photo container filling card completely */}
                  <div className="h-[220px] w-full shrink-0 flex flex-col sm:h-[280px] lg:h-auto lg:w-[48%] lg:min-h-0">
                    <div className="relative flex-1 min-h-0 rounded-2xl border border-[#DCE3EA] overflow-hidden shadow-2xl bg-[#F1F4F8]">
                      {subjectImageUrl(s, idx) ? (
                        <img
                          src={subjectImageUrl(s, idx)!}
                          alt={s.name}
                          className="h-full w-full object-cover"
                          loading="eager"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm text-[#24243C]/60">
                          No Image Available
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RIGHT — description + technologies stacked */}
                  <div className="flex min-w-0 flex-1 flex-col gap-5 lg:min-h-0">

                    {/* Description — grows to fill available space */}
                    <div className="flex flex-col flex-1 min-h-0">
                      <div className="flex items-center gap-2 shrink-0 mb-4">
                        <span className="w-0.5 h-4 rounded-full bg-[#12B9DA]" />
                        <p className="text-[13px] font-bold tracking-widest text-[#12B9DA] uppercase">Description</p>
                      </div>
                      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin pr-1">
                        <div className="space-y-4 text-[17px] sm:text-[18px] lg:text-[19px] xl:text-[20px] leading-[1.8] text-[#24243C]/90 whitespace-pre-wrap">
                          {s.description ? (
                            s.description.split("\n\n").map((para, i) => (
                              <p key={i}>{para}</p>
                            ))
                          ) : (
                            <p className="text-[#24243C]/50">No description provided for this subject — contact us for details.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Technologies — below description */}
                    <div className="shrink-0">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-0.5 h-5 rounded-full bg-[#12B9DA]" />
                        <p className="text-[13px] font-bold tracking-widest text-[#12B9DA] uppercase">Technologies</p>
                      </div>
                      <div className="flex flex-wrap gap-2.5">
                        {s.technologies && s.technologies.length > 0 ? (
                          s.technologies.map((t) => (
                            <span key={t.id} className="inline-flex items-center rounded-full bg-[#F1F4F8] border border-[#1D7CC7]/40 text-[#24243C] px-4 py-2 text-sm font-semibold shadow-sm shrink-0">
                              {t.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-base text-[#24243C]/40">—</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── BOTTOM BAR: profile + period | preselect button ── */}
                <div className="shrink-0 flex flex-wrap items-center gap-x-6 gap-y-4 px-4 sm:px-8 lg:flex-nowrap lg:gap-10 lg:px-10 pt-5 pb-6 border-t border-[#DCE3EA] mt-3">

                  {/* Profile — with icon */}
                  <div className="flex min-w-0 gap-3 items-center">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#F1F4F8] border border-[#DCE3EA]">
                      <UserIcon className="size-5 text-[#24243C]/80" strokeWidth={1.8} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-0.5 h-4 rounded-full bg-[#12B9DA]" />
                        <p className="text-[13px] font-bold tracking-widest text-[#12B9DA] uppercase">Profile</p>
                      </div>
                      <p className="mt-1 text-base font-bold text-[#24243C]">
                        {s.profiles && s.profiles.length > 0 ? s.profiles.map((p) => p.name).join(" / ") : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Period — with icon */}
                  <div className="flex min-w-0 gap-3 items-center">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#F1F4F8] border border-[#DCE3EA]">
                      <CalendarIcon className="size-5 text-[#24243C]/80" strokeWidth={1.8} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-0.5 h-4 rounded-full bg-[#12B9DA]" />
                        <p className="text-[13px] font-bold tracking-widest text-[#12B9DA] uppercase">Period</p>
                      </div>
                      <p className="mt-1 text-base font-bold text-[#24243C]">{s.period || s.duration?.name || "6 Months"}</p>
                    </div>
                  </div>

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* Preselect button — far right */}
                  <Button
                    onClick={() => toggle(s.code)}
                    className={`w-full rounded-xl px-7 py-5 text-sm font-bold shadow-[0_0_20px_rgba(29,124,199,0.4)] border transition-all sm:w-auto lg:ml-auto ${
                      isSelected
                        ? "bg-white border-[#1D7CC7] text-[#1D7CC7] fine-hover:bg-white/90"
                        : "bg-[#1D7CC7] border-[#1D7CC7] text-[#FFFFFF] fine-hover:bg-[#0F5C9E] fine-hover:shadow-[0_0_28px_rgba(29,124,199,0.55)]"
                    }`}
                  >
                    {isSelected ? "Selected ✓" : "Pre-select this subject"}
                  </Button>
                </div>
              </div>
            </section>
          )
        })}

        {/* ── WE WILL CHALLENGE YOU - PDF 13 ── GLASS */}
        <section
          data-page={5 + subjects.length}
          className="relative flex h-full w-screen shrink-0 snap-start flex-col isolate bg-[#FFFFFF] text-[#24243C] overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#1D7CC7]/10 via-[#FFFFFF] to-[#1D7CC7]/10" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, #1D7CC7 1px, transparent 0)`, backgroundSize: "24px 24px" }} />
          <PageHeader number={6 + subjects.length} total={totalPages} />
          {/* stepped cards — same content/colors, layout like Why Intern With Us */}
          <div className="relative z-10 flex flex-1 min-h-0 flex-col px-4 sm:px-6 lg:px-8 xl:px-10 py-3 overflow-hidden">
            <div className="flex flex-1 flex-col justify-center w-full">
              <div className="text-center max-w-3xl mx-auto shrink-0">
                <span className="inline-flex items-center rounded-full bg-[#1D7CC7] px-3.5 py-1 text-[12px] font-bold tracking-widest text-[#FFFFFF] uppercase shadow">OUR MINDSET</span>
                <h2 className="mt-3 text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight leading-none">
                  <span className="text-[#24243C]">We will </span><span className="text-[#12B9DA]">challenge</span><span className="text-[#24243C]"> you</span>
                </h2>
              </div>

              <div className="relative w-full max-w-[1440px] mx-auto mt-10 lg:mt-12 flex-1 min-h-0 flex flex-col justify-center">
                {/* desktop — same as Why Intern: 3 centered items */}
                <div className="relative hidden md:grid grid-cols-3 gap-x-8 lg:gap-x-10 xl:gap-x-14">
                  {MINDSET_STEPS.map((c) => (
                    <div key={c.n} className="relative flex flex-col items-center text-center">
                      <div className="relative z-10 flex size-20 xl:size-28 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1D7CC7] to-[#0F5C9E] border border-[#1D7CC7]/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_0_45px_rgba(29,124,199,0.4)]">
                        <c.icon className="size-9 xl:size-12 text-[#FFFFFF]" strokeWidth={1.6} />
                      </div>
                      <span className="relative mt-4 xl:mt-5 text-xs xl:text-sm font-bold text-[#12B9DA]">{c.n}</span>
                      <h3 className="relative mt-1.5 text-lg sm:text-xl lg:text-[22px] font-bold leading-tight tracking-tight text-[#24243C] text-balance">{c.title}</h3>
                      <div className="relative mt-2.5 h-[3px] w-10 rounded-full bg-gradient-to-r from-[#1D7CC7] to-[#12B9DA]" />
                      <p className="relative mt-2.5 text-[15.5px] sm:text-base lg:text-lg leading-[1.5] text-[#24243C]/80 font-medium max-w-[clamp(220px,22vw,300px)]">{c.desc}</p>
                    </div>
                  ))}
                </div>

                {/* mobile — same as Why Intern */}
                <div className="relative flex-1 min-h-0 overflow-y-auto scrollbar-thin md:hidden">
                  <div className="flex flex-col gap-14">
                    {MINDSET_STEPS.map((c) => (
                      <div key={c.n} className="relative flex flex-col items-center text-center">
                        <div className="relative z-10 flex size-24 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1D7CC7] to-[#0F5C9E] border border-[#1D7CC7]/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_0_30px_rgba(29,124,199,0.4)]">
                          <c.icon className="size-11 text-[#FFFFFF]" strokeWidth={1.6} />
                        </div>
                        <span className="relative mt-4 text-xs font-bold text-[#12B9DA]">{c.n}</span>
                        <h3 className="relative mt-1.5 text-lg sm:text-xl font-bold leading-tight tracking-tight text-[#24243C] text-balance">{c.title}</h3>
                        <div className="relative mt-2.5 h-[3px] w-10 rounded-full bg-gradient-to-r from-[#1D7CC7] to-[#12B9DA]" />
                        <p className="relative mt-2.5 max-w-md text-[15.5px] sm:text-base leading-[1.5] text-[#24243C]/80 font-medium">{c.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── RECRUITMENT PROCESS - PDF 15 ── GLASS */}
        <section
          data-page={6 + subjects.length}
          className="relative flex h-full w-screen shrink-0 snap-start flex-col isolate bg-[#FFFFFF] text-[#24243C] overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#1D7CC7]/10 via-[#FFFFFF] to-[#1D7CC7]/10" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, #1D7CC7 1px, transparent 0)`, backgroundSize: "24px 24px" }} />
          <PageHeader number={7 + subjects.length} total={totalPages} />
          <div className="relative z-10 flex flex-1 min-h-0 flex-col px-4 sm:px-6 lg:px-8 xl:px-10 py-3 overflow-hidden">
            <div className="flex flex-1 flex-col justify-center w-full">
              <div className="text-center max-w-3xl mx-auto shrink-0">
                <span className="inline-flex items-center rounded-full bg-[#1D7CC7] px-3.5 py-1 text-[12px] font-bold tracking-widest text-[#FFFFFF] uppercase shadow">JOIN US</span>
                <h2 className="mt-3 text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight leading-none">
                  <span className="text-[#24243C]">Recruitment </span><span className="text-[#12B9DA]">Process</span>
                </h2>
              </div>

              <div className="relative w-full max-w-[1440px] mx-auto mt-10 lg:mt-14 flex-1 min-h-0 flex flex-col justify-center">
                <div className="relative hidden md:grid grid-cols-3 gap-x-12 lg:gap-x-16 xl:gap-x-20">
                  {/* horizontal connectors with arrows — step 1→2 and 2→3 */}
                  <div aria-hidden className="absolute left-[16.66%] right-[16.66%] top-[64px] xl:top-[80px] flex items-center pointer-events-none">
                    <div className="flex-1 flex items-center">
                      <div className="flex-1 h-[2px] bg-[#1D7CC7]/70" />
                      <ArrowRightIcon className="size-4 xl:size-5 text-[#1D7CC7] -ml-1 shrink-0" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 flex items-center">
                      <div className="flex-1 h-[2px] bg-[#1D7CC7]/70" />
                      <ArrowRightIcon className="size-4 xl:size-5 text-[#1D7CC7] -ml-1 shrink-0" strokeWidth={2.5} />
                    </div>
                  </div>
                  <div aria-hidden className="absolute left-[16.66%] right-[16.66%] top-[64px] xl:top-[80px] h-[10px] -translate-y-[4px] flex pointer-events-none">
                    <div className="flex-1 mx-2 h-[10px] bg-[#1D7CC7]/15 blur-[6px] rounded-full" />
                    <div className="flex-1 mx-2 h-[10px] bg-[#1D7CC7]/15 blur-[6px] rounded-full" />
                  </div>
                  {[
                    { step: "01", title: "CV Screening", desc: "We review your application and CV to understand your profile and aspirations.", img: "/CV_Screening.jpg", pos: "object-[38%_50%]" },
                    { step: "02", title: "Online Assessment", desc: "A hands-on task or technical assessment to showcase your skills.", img: "/Online_Assesement.jpg", pos: "object-center" },
                    { step: "03", title: "On-Site Evaluation", desc: "Final interview with the team to align on project and culture.", img: "/OnSite_Evaluation.jpg", pos: "object-center" },
                  ].map((s) => (
                    <div key={s.step} className="relative flex flex-col items-center text-center">
                      <div className="relative z-10 shrink-0">
                        <div className="flex size-32 xl:size-40 items-center justify-center overflow-hidden rounded-2xl border-2 border-[#1D7CC7]/60 bg-[#FFFFFF] shadow-[0_0_45px_rgba(29,124,199,0.4)]">
                          <img src={s.img} alt={s.title} className={`size-full object-cover ${s.pos}`} loading="lazy" />
                        </div>
                        <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-[#1D7CC7]/40 bg-gradient-to-br from-[#1D7CC7] to-[#0F5C9E] px-3 py-1 text-xs xl:text-sm font-black tracking-wide text-[#FFFFFF] shadow">Step {Number(s.step)}</span>
                      </div>
                      <h3 className="relative mt-7 xl:mt-8 text-lg sm:text-xl lg:text-[22px] font-bold leading-tight tracking-tight text-[#24243C] text-balance">{s.title}</h3>
                      <div className="relative mt-2.5 h-[3px] w-10 rounded-full bg-gradient-to-r from-[#1D7CC7] to-[#12B9DA]" />
                      <p className="relative mt-2.5 text-[15.5px] sm:text-base lg:text-lg leading-[1.5] text-[#24243C]/80 font-medium max-w-[clamp(220px,22vw,300px)]">{s.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="relative flex-1 min-h-0 overflow-y-auto scrollbar-thin md:hidden">
                  {/* vertical connectors with arrows */}
                  <div aria-hidden className="absolute left-1/2 top-[72px] bottom-[72px] w-0.5 -translate-x-1/2 flex flex-col pointer-events-none">
                    <div className="flex-1 flex flex-col items-center">
                      <div className="flex-1 w-[2px] bg-[#1D7CC7]/70" />
                      <ArrowRightIcon className="size-4 text-[#1D7CC7] rotate-90 -mt-1 shrink-0" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 flex flex-col items-center">
                      <div className="flex-1 w-[2px] bg-[#1D7CC7]/70" />
                      <ArrowRightIcon className="size-4 text-[#1D7CC7] rotate-90 -mt-1 shrink-0" strokeWidth={2.5} />
                    </div>
                  </div>
                  <div aria-hidden className="absolute left-1/2 top-[72px] bottom-[72px] w-2 -translate-x-1/2 flex flex-col pointer-events-none">
                    <div className="flex-1 mx-auto w-2 bg-[#1D7CC7]/10 blur-[6px] rounded-full my-2" />
                    <div className="flex-1 mx-auto w-2 bg-[#1D7CC7]/10 blur-[6px] rounded-full my-2" />
                  </div>
                  <div className="flex flex-col gap-14">
                    {[
                      { step: "01", title: "CV Screening", desc: "We review your application and CV to understand your profile and aspirations.", img: "/CV_Screening.jpg", pos: "object-[38%_50%]" },
                      { step: "02", title: "Online Assessment", desc: "A hands-on task or technical assessment to showcase your skills.", img: "/Online_Assesement.jpg", pos: "object-center" },
                      { step: "03", title: "On-Site Evaluation", desc: "Final interview with the team to align on project and culture.", img: "/OnSite_Evaluation.jpg", pos: "object-center" },
                    ].map((s) => (
                      <div key={s.step} className="relative flex flex-col items-center text-center">
                        <div className="relative z-10 shrink-0">
                          <div className="flex size-36 items-center justify-center overflow-hidden rounded-2xl border-2 border-[#1D7CC7]/60 bg-[#FFFFFF] shadow-[0_0_30px_rgba(29,124,199,0.4)]">
                            <img src={s.img} alt={s.title} className={`size-full object-cover ${s.pos}`} loading="lazy" />
                          </div>
                          <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-[#1D7CC7]/40 bg-gradient-to-br from-[#1D7CC7] to-[#0F5C9E] px-3 py-1 text-xs font-black tracking-wide text-[#FFFFFF] shadow">Step {Number(s.step)}</span>
                        </div>
                        <h3 className="relative mt-7 text-lg sm:text-xl font-bold leading-tight tracking-tight text-[#24243C] text-balance">{s.title}</h3>
                        <div className="relative mt-2.5 h-[3px] w-10 rounded-full bg-gradient-to-r from-[#1D7CC7] to-[#12B9DA]" />
                        <p className="relative mt-2.5 max-w-md text-[15.5px] sm:text-base leading-[1.5] text-[#24243C]/80 font-medium">{s.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CLOSING - PDF 16 ── GLASS */}
        <section
          data-page={7 + subjects.length}
          className="relative flex h-full w-screen shrink-0 snap-start flex-col isolate bg-[#FFFFFF] text-[#24243C] overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#1D7CC7]/10 via-[#FFFFFF] to-[#1D7CC7]/10" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, #1D7CC7 1px, transparent 0)`, backgroundSize: "24px 24px" }} />
          <div className="relative z-10 flex shrink-0 items-center justify-between px-6 sm:px-8 lg:px-12 py-2 bg-transparent">
            <BrandLogo className="h-24 w-28 object-contain -my-4 sm:h-[180px] sm:w-[200px] sm:-my-14 drop-shadow-sm" />
            <span className="inline-flex items-center gap-2 rounded-full bg-[#F1F4F8] backdrop-blur border border-[#1D7CC7]/40 px-3 py-1.5 text-[12px] font-mono tracking-[0.2em] text-[#24243C]/70">
              {String(8 + subjects.length).padStart(2, "0")} / {String(totalPages).padStart(2, "0")}
            </span>
          </div>
          <div className="relative z-10 flex flex-1 flex-col px-4 sm:px-6 lg:px-8 xl:px-10 py-6 overflow-hidden">
            <div className="flex-1 flex flex-col justify-center w-full max-w-[1000px] mx-auto">
              {/* Centered quote card — photo removed, quote only */}
              <div className="relative rounded-2xl border border-[#1D7CC7]/40 bg-[#F1F4F8] backdrop-blur px-6 py-10 sm:p-12 lg:p-14 flex flex-col items-center text-center shadow-[0_0_40px_rgba(29,124,199,0.15)] overflow-hidden">
                <div className="relative flex size-14 items-center justify-center rounded-full bg-[#1D7CC7] text-[#FFFFFF] shadow">
                  <QuoteIcon className="size-6" strokeWidth={2.2} />
                </div>
                <div className="relative mt-6 space-y-2">
                  <p className="text-xl sm:text-2xl lg:text-[28px] xl:text-[32px] font-medium leading-relaxed text-[#24243C]">“If you&apos;re offered a seat on a rocket ship,</p>
                  <p className="text-xl sm:text-2xl lg:text-[28px] xl:text-[32px] font-medium leading-relaxed text-[#24243C]">don’t ask what seat. Just get on.”</p>
                </div>
                <div className="relative mt-8 h-px w-12 bg-[#1D7CC7]/50" />
                <p className="relative mt-6 text-xs font-bold tracking-widest text-[#12B9DA] uppercase">— SHERYL SANDBERG, FORMER COO OF FACEBOOK</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── SHORTLIST ── GLASS */}
        <section
          data-page={8 + subjects.length}
          className="relative flex h-full w-screen shrink-0 snap-start flex-col isolate bg-[#FFFFFF] text-[#24243C] overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#1D7CC7]/10 via-[#FFFFFF] to-[#1D7CC7]/10" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, #1D7CC7 1px, transparent 0)`, backgroundSize: "24px 24px" }} />
          <PageHeader number={9 + subjects.length} total={totalPages} />
          <div className="relative z-10 flex flex-1 min-h-0 flex-col px-4 sm:px-6 lg:px-8 xl:px-10 py-4 overflow-hidden">
            <div className="mx-auto flex w-full max-w-[900px] flex-1 min-h-0 flex-col justify-center">
              <div className="text-center max-w-2xl mx-auto shrink-0">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1D7CC7] px-3.5 py-1 text-[12px] font-bold tracking-widest text-[#FFFFFF] uppercase shadow">
                  <BookmarkCheckIcon className="size-3" /> Your choice
                </span>
                <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-[#24243C] leading-none">
                  This is the <span className="text-[#12B9DA]">subject</span> you selected
                </h2>
              </div>

              <div className="mt-8 flex flex-1 min-h-0 flex-col items-center justify-center">
                {subjects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-10 text-center px-6">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-[#F1F4F8] border border-[#DCE3EA] text-[#24243C]/40">
                      <BookmarkIcon className="size-5" />
                    </div>
                    <p className="text-sm font-semibold text-[#24243C]">No subjects available</p>
                  </div>
                ) : !shortlistedSubject ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-10 text-center px-6">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-[#F1F4F8] border border-[#DCE3EA] text-[#24243C]/40">
                      <BookmarkIcon className="size-5" />
                    </div>
                    <p className="text-sm font-semibold text-[#24243C]">No subject selected.</p>
                    <p className="text-xs text-[#24243C]/55 max-w-sm leading-relaxed">Go back to the subjects list and pre-select the one you want.</p>
                    <Button variant="outline" size="lg" onClick={() => goTo(4)} className="rounded-full mt-2 h-11 px-6 text-sm border-[#DCE3EA] bg-[#F1F4F8] text-[#24243C] fine-hover:bg-[#1D7CC7]/10">Back to subjects list</Button>
                  </div>
                ) : (
                  <div className="w-full max-w-2xl rounded-2xl border border-[#1D7CC7]/40 bg-[#F1F4F8] backdrop-blur p-6 sm:p-8 text-center shadow-lg">
                    <span className="inline-flex items-center rounded-full bg-[#F1F4F8] border border-[#DCE3EA] px-3 py-1 font-mono text-xs font-bold tracking-widest text-[#24243C]/80">{shortlistedSubject.code}</span>
                    <h3 className="mt-4 text-xl sm:text-2xl font-bold tracking-tight text-[#24243C]">{shortlistedSubject.name}</h3>
                    <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                      <Button size="lg" className="w-full sm:w-auto gap-2 rounded-xl px-8 h-11 font-bold shadow-lg bg-[#1D7CC7] text-[#FFFFFF] fine-hover:bg-[#0F5C9E] text-sm" onClick={() => navigate("/form")}>
                        <CheckIcon className="size-4" /> Apply now
                      </Button>
                      <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-xl px-8 h-11 text-sm border-[#DCE3EA] bg-[#F1F4F8] text-[#24243C] fine-hover:bg-[#1D7CC7]/10" onClick={() => goTo(4)}>Choose another subject</Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile CTA */}
              <div className="mt-4 hidden md:hidden flex-col items-center gap-2">
                <Button disabled={shortlist.length === 0} size="lg" className="w-full gap-2 rounded-xl px-8 h-11 font-bold shadow bg-[#1D7CC7] text-[#FFFFFF] fine-hover:bg-[#0F5C9E] disabled:bg-[#F1F4F8] disabled:text-[#24243C]/40 text-sm" onClick={() => navigate("/form")}>
                  <CheckIcon className="size-4" /> Apply now
                </Button>
                <Button variant="ghost" size="sm" className="rounded-full text-[#24243C]/60 fine-hover:text-[#24243C] fine-hover:bg-[#1D7CC7]/10" onClick={() => goTo(4)}>Back to index</Button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ── NEW BOTTOM NAV : non-overlay, progress + dots + controls — GLASS */}
      <footer className="relative z-20 shrink-0 border-t border-[#1D7CC7]/40 bg-[#FFFFFF]/90 backdrop-blur-xl">
        {/* progress line */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-[#F1F4F8]">
          <div className="h-full bg-[#1D7CC7] transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>

        <div className="flex items-center gap-2 px-2 sm:px-4 py-2.5">
          {/* left: nav */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <Button
              variant="outline"
              size="icon"
              className="size-8 sm:size-9 rounded-full border-[#C9D4DF] bg-[#DCE3EA] text-[#647988] dark:border-[#C9D4DF] dark:bg-[#DCE3EA] dark:text-[#647988] dark:hover:bg-[#1D7CC7]/10 dark:hover:text-[#24243C] fine-hover:bg-[#1D7CC7]/10 fine-hover:text-[#24243C]"
              onClick={() => goTo(activePage - 1)}
              disabled={activePage === 0}
              aria-label="Previous page"
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8 sm:size-9 rounded-full border-[#C9D4DF] bg-[#DCE3EA] text-[#647988] dark:border-[#C9D4DF] dark:bg-[#DCE3EA] dark:text-[#647988] dark:hover:bg-[#1D7CC7]/10 dark:hover:text-[#24243C] fine-hover:bg-[#1D7CC7]/10 fine-hover:text-[#24243C]"
              onClick={() => goTo(activePage + 1)}
              disabled={activePage === totalPages - 1}
              aria-label="Next page"
            >
              <ChevronRightIcon className="size-4" />
            </Button>
            <span className="hidden lg:inline-flex items-center gap-1 ml-1 text-xs text-[#24243C]/60">
              <span className="hidden xl:inline">Use</span> <kbd className="rounded border border-[#1D7CC7]/40 bg-[#F1F4F8] px-1.5 py-0.5 font-mono text-[12px] text-[#24243C]/60">←</kbd><kbd className="rounded border border-[#1D7CC7]/40 bg-[#F1F4F8] px-1.5 py-0.5 font-mono text-[12px] text-[#24243C]/60">→</kbd> <span className="hidden xl:inline">to navigate</span>
            </span>
          </div>

          {/* center: dots + page label - scrollable */}
          <div className="flex flex-1 min-w-0 items-center justify-center gap-1 sm:gap-1.5 overflow-hidden">
            <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto scrollbar-hide px-2 py-1">
              {Array.from({ length: totalPages }).map((_, i) => {
                const isActive = i === activePage
                const isSubjectPage = i >= 5 && i < 5 + subjects.length
                return (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    aria-label={`Go to page ${i + 1}`}
                    title={isSubjectPage ? subjects[i - 5]?.code ?? `Page ${i + 1}` : `Page ${i + 1}`}
                    className={`shrink-0 rounded-full transition-all duration-300 ${
                      isActive
                        ? "w-8 h-2 bg-[#1D7CC7] shadow"
                        : isSubjectPage
                          ? "size-2 bg-[#1D7CC7]/40 fine-hover:bg-[#1D7CC7]/70"
                          : "size-2 bg-[#24243C]/25 fine-hover:bg-[#24243C]/45"
                    }`}
                  />
                )
              })}
            </div>
            {/* mobile dots - limited */}
            <div className="flex sm:hidden items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 9) }).map((_, i) => {
                // for mobile, show window around active
                const windowSize = 9
                let start = Math.max(0, Math.min(totalPages - windowSize, activePage - 4))
                const idx = start + i
                if (idx >= totalPages) return null
                const isActive = idx === activePage
                return (
                  <button
                    key={idx}
                    onClick={() => goTo(idx)}
                    className={`rounded-full transition-all ${isActive ? "w-6 h-1.5 bg-[#1D7CC7]" : "size-1.5 bg-[#24243C]/25"}`}
                    aria-label={`Go to page ${idx + 1}`}
                  />
                )
              })}
              {totalPages > 9 && <span className="text-[12px] text-[#24243C]/60 ml-1">+{totalPages - 9}</span>}
            </div>
          </div>

          {/* right: actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => goTo(totalPages - 1)}
              className={`inline-flex items-center gap-1 sm:gap-1.5 rounded-full px-2.5 sm:px-3 py-1.5 text-xs font-semibold shadow-sm border transition-colors ${shortlist.length > 0 ? "bg-[#1D7CC7] text-[#FFFFFF] border-[#1D7CC7]" : "bg-[#F1F4F8] border-[#1D7CC7]/40 text-[#24243C] fine-hover:border-[#1D7CC7]/40 fine-hover:bg-[#1D7CC7]/10"}`}
            >
              <BookmarkCheckIcon className="size-3.5" />
              <span className="hidden sm:inline">Shortlist</span>
              <span className={`inline-flex size-5 items-center justify-center rounded-full text-[12px] font-bold ${shortlist.length > 0 ? "bg-white text-[#1D7CC7]" : "bg-[#1D7CC7] text-[#FFFFFF]"}`}>{shortlist.length}</span>
            </button>
            <div className="hidden sm:flex items-center gap-1 ml-1 border-l border-[#1D7CC7]/40 pl-2">
              <Button variant="ghost" size="sm" className="h-8 rounded-full text-xs text-[#24243C]/60 fine-hover:text-[#24243C] fine-hover:bg-[#1D7CC7]/10" onClick={() => goTo(0)}>Cover</Button>
              <Button variant="ghost" size="sm" className="h-8 rounded-full text-xs text-[#24243C]/60 fine-hover:text-[#24243C] fine-hover:bg-[#1D7CC7]/10" onClick={() => navigate("/")}>Home</Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function AwardIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v9a6 6 0 0 0 12 0V2Z" />
    </svg>
  )
}

function PageHeader({ number, total }: { number: number; total: number }) {
  return (
    <div className="relative z-10 flex shrink-0 items-center justify-between px-6 sm:px-8 lg:px-12 py-2 bg-transparent">
      <BrandLogo className="h-24 w-28 object-contain -my-4 sm:h-[180px] sm:w-[200px] sm:-my-14 drop-shadow-sm" />
      <span className="inline-flex items-center gap-2 rounded-full bg-[#F1F4F8] backdrop-blur border border-[#1D7CC7]/40 px-3 py-1.5 text-[12px] font-mono tracking-[0.2em] text-[#24243C]/70">
          {String(number).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
    </div>
  )
}

