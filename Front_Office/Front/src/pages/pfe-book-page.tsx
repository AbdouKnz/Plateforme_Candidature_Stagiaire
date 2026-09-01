import * as React from "react"
import { useNavigate } from "react-router-dom"
import { fetchSubjects } from "@/service/front-office"
import type { Subject } from "@/models/api"
import { Button } from "@/components/ui/button"
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
  ZapIcon,
  BuildingIcon,
  MapPinIcon,
  MailIcon,
  GlobeIcon,
  QuoteIcon,
  CheckIcon,
  SparklesIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  RocketIcon,
  ScaleIcon,
  ClockIcon,
  HandshakeIcon,
  MessageSquareQuoteIcon,
  UserIcon,
  CalendarIcon,
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
  { n: "01", title: "Hands-On Experience", desc: "Gain practical skills through direct involvement in real product features — not shadowing, building.", icon: BuildingIcon },
  { n: "02", title: "Real Projects", desc: "Work on production systems that serve cities and thousands of users from day one.", icon: RocketIcon },
  { n: "03", title: "Mentorship", desc: "Guidance from senior engineers, designers, and product leaders invested in your growth.", icon: GraduationCapIcon },
  { n: "04", title: "Paid Internship", desc: "You work, you get paid — as simple as that. Fair compensation and recognition.", icon: HeartHandshakeIcon },
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
    setIds((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]))
  }, [])
  const clear = React.useCallback(() => setIds([]), [])
  return { ids, toggle, clear, has: (code: string) => ids.includes(code) }
}

const SUBJECT_IMAGES = [
  "/world-map-dotted.png",
  "/AstroLogo.png",
  "/website.png",
  "/DarkMode.png",
  "/LightMode.png",
  "/adress.png",
]

function subjectImage(index: number) {
  return SUBJECT_IMAGES[index % SUBJECT_IMAGES.length]
}

function AuroraLayer({ dark = false }: { dark?: boolean }) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  return (
    <div aria-hidden className="absolute inset-0 -z-10 bg-background">
      <div className="absolute inset-0">
        <MoltenMetal
          color1={isDark ? "#4C1D95" : "#7C3AED"}
          color2={isDark ? "#7C3AED" : "#8B5CF6"}
          color3={isDark ? "#DDD6FE" : "#C4B5FD"}
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
      {dark && <div className="absolute inset-0 bg-black/55" />}
    </div>
  )
}

function BrandLogo({ dark = false, className = "" }: { dark?: boolean; className?: string }) {
  const { resolvedTheme } = useTheme()
  const src = dark || resolvedTheme === "dark" ? "/DarkMode.png" : "/LightMode.png"
  return <img src={src} alt="Asteroidea" className={className} />
}

export function PfeBookPage() {
  const navigate = useNavigate()
  const [subjects, setSubjects] = React.useState<Subject[]>([])
  const [loading, setLoading] = React.useState(true)
  const { ids: shortlist, toggle, clear, has } = useShortlist()

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
      const target = container?.querySelector<HTMLElement>(`[data-page="${clamped}"]`)
      target?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" })
    },
    [totalPages]
  )

  const scrollToSubject = (code: string) => {
    const idx = subjects.findIndex((s) => s.code === code)
    if (idx === -1) return
    goTo(5 + idx)
  }

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const progress = ((activePage + 1) / totalPages) * 100

  return (
    <div className="flex h-[100dvh] w-screen flex-col overflow-hidden bg-[#0a0a1f] text-white selection:bg-primary/20">
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: "24px 24px" }} />

      {/* ── horizontally scrollable book ── */}
      <div
        ref={containerRef}
        className="flex min-h-0 w-full flex-1 overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth scrollbar-hide"
      >
        {/* ── COVER: PFE BOOK 2026 ── GLASS */}
        <section
          data-page={0}
          className="relative flex h-full w-screen shrink-0 snap-start snap-always flex-col isolate overflow-hidden bg-[#0a0a1f] text-white"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a2e] via-[#0f0a1a] to-[#150a2e]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: "24px 24px" }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

          <div className="relative z-10 flex items-center justify-between px-6 sm:px-8 lg:px-12 py-2">
            <BrandLogo dark className="h-[180px] w-[200px] object-contain -my-14 drop-shadow-xl" />
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur border border-white/15 px-3 py-1.5 text-[11px] font-mono tracking-[0.2em] text-white/70">
              01 / {String(totalPages).padStart(2, "0")}
            </span>
          </div>

          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center py-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur border border-white/15 px-4 py-1.5 shadow-sm">
              <span className="size-1.5 rounded-full bg-white animate-pulse" />
              <span className="text-[11px] font-bold tracking-[0.2em] text-white uppercase">Internship Program</span>
              <span className="hidden sm:inline text-[10px] font-mono text-white/60">• 2026 Edition</span>
            </div>

            <h1 className="mt-6 text-5xl sm:text-7xl lg:text-[6.5rem] font-extralight tracking-[0.14em] text-white leading-[0.9] drop-shadow-2xl">
              PFE BOOK
            </h1>
            <div className="mt-3 text-4xl sm:text-6xl lg:text-[5rem] font-black tracking-[0.16em] leading-none">
              <span className="bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">2026</span>
            </div>

            <div className="mt-6 h-px w-20 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <p className="mt-6 max-w-2xl text-xs sm:text-sm font-medium tracking-[0.14em] leading-relaxed text-white/80 uppercase">
              Shape the future with us
              <br className="hidden sm:block" />
              <span className="text-white font-bold tracking-[0.12em]">Your path begins here</span>
            </p>

            <a href="mailto:careers@asteroidea.co" className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur border border-white/20 px-4 py-2 text-xs font-mono tracking-wide text-white/80 hover:bg-white/15 hover:text-white transition-colors">
              <MailIcon className="size-3.5" /> careers@asteroidea.co
            </a>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md">
              <Button onClick={() => goTo(1)} size="lg" className="w-full sm:w-auto rounded-full bg-white text-primary hover:bg-white/90 px-8 py-6 text-sm font-bold tracking-wide shadow-xl">
                Explore Book <ArrowRightIcon className="size-4" />
              </Button>
              <Button onClick={() => goTo(4)} variant="outline" size="lg" className="w-full sm:w-auto rounded-full bg-transparent backdrop-blur border-white/30 text-white hover:bg-white/10 hover:text-white px-8 py-6 text-sm font-semibold">
                View Subjects ({subjects.length})
              </Button>
            </div>

          </div>
        </section>

        {/* ── WHO ARE WE - PDF 01 ── DARK DESIGN COPY */}
        <section
          data-page={1}
          className="relative flex h-full w-screen shrink-0 snap-start snap-always flex-col isolate bg-[#0a0a1f] text-white overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a2e] via-[#0f0a1a] to-[#150a2e]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: "24px 24px" }} />
          <div className="relative z-10 flex shrink-0 items-center justify-between px-6 sm:px-8 lg:px-12 py-2 bg-transparent">
            <BrandLogo dark className="h-[180px] w-[200px] object-contain -my-14 drop-shadow-sm" />
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur border border-white/10 px-3 py-1.5 text-[11px] font-mono tracking-[0.2em] text-white/70">
              01 / {String(totalPages).padStart(2, "0")}
            </span>
          </div>
          <div className="relative z-10 flex flex-1 min-h-0 flex-col lg:flex-row overflow-hidden">
            {/* left - dark cards */}
            <div className="flex w-full lg:w-[46%] flex-col justify-center px-5 sm:px-7 lg:px-8 xl:px-10 py-4 gap-3 overflow-hidden">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/30 px-3 py-1 text-[10px] font-bold tracking-[0.16em] text-[#C4B5FD] uppercase">
                  <BuildingIcon className="size-3" /> 01 — Introduction
                </div>
                <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-white leading-none">Who are we?</h2>
                <p className="mt-1.5 text-xs tracking-[0.16em] text-[#C4B5FD] uppercase font-medium">Introduction to our company</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur p-4 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] text-white shadow-sm">
                    <BuildingIcon className="size-4" />
                  </div>
                  <h3 className="text-sm font-bold tracking-tight text-white">Company Overview</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-white/80">
                  Asteroidea is a <span className="font-semibold text-white">global company</span> that creates smart digital solutions for urban mobility and parking. We help cities, governments, and private companies make urban mobility smoother, more efficient, and ready for the future. By digitizing parking systems, connecting EV charging, and using <span className="font-semibold text-white">AI and data</span>, we design solutions that improve operations, enhance user experience, and make urban mobility smarter and more sustainable.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur p-4 shadow-sm flex flex-col">
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] text-white shadow-sm">
                      <AwardIcon className="size-3.5" />
                    </div>
                    <h4 className="text-sm font-bold text-white">Key Achievements</h4>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-white/70 flex-1">
                    More than <span className="font-bold text-white">30 projects</span> in <span className="font-bold text-white">12 countries</span>. Trusted by governments and enterprises across EMEA.
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] border border-[#7C3AED]/50 p-3 text-center text-white shadow-sm">
                      <div className="text-xl font-bold leading-none tracking-tight">30+</div>
                      <div className="mt-1 text-[10px] font-semibold tracking-widest uppercase opacity-80">Projects</div>
                    </div>
                    <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
                      <div className="text-xl font-bold leading-none tracking-tight text-white">12</div>
                      <div className="mt-1 text-[10px] font-semibold tracking-widest text-white/60 uppercase">Countries</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur p-4 shadow-sm flex flex-col">
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] text-white shadow-sm">
                      <HeartHandshakeIcon className="size-3.5" />
                    </div>
                    <h4 className="text-sm font-bold text-white">Core Values</h4>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-white/70 flex-1">
                    Innovation, integrity, and teamwork drive every line of code and every city we serve.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#7C3AED] text-white px-3 py-1.5 text-xs font-bold shadow-sm">
                      <LightbulbIcon className="size-3" /> Innovation
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#7C3AED] text-white px-3 py-1.5 text-xs font-bold shadow-sm">
                      <HeartHandshakeIcon className="size-3" /> Integrity
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 text-white px-3 py-1.5 text-xs font-bold">
                      <UsersIcon className="size-3" /> Teamwork
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold tracking-widest text-white uppercase">Trusted & Backed By</p>
                  <span className="rounded-full bg-white/10 border border-white/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white/60">6 partners</span>
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-5 lg:gap-6">
                  {[
                    { name: "OVHcloud", icon: "/OVHCloud_Logo.png", size: "h-14 lg:h-16 max-w-[160px]" },
                    { name: "NVIDIA", icon: "/NVIDIA_Logo.png", size: "h-11 lg:h-12 max-w-[135px]" },
                    { name: "EIT Urban Mobility", icon: "/EIT_Logo.png", size: "h-22 lg:h-24 max-w-[200px]" },
                    { name: "British Parking", icon: "/BPA_Logo.png", size: "h-22 lg:h-24 max-w-[200px]" },
                    { name: "Terna", icon: "/Terna_Logo.png", size: "h-22 lg:h-24 max-w-[190px]" },
                    { name: "EPA", icon: "/EPA_Logo.png", size: "h-9 lg:h-10 max-w-[120px]" },
                  ].map((p) => (
                    <img key={p.name} src={p.icon} alt={p.name} className={`${p.size} w-auto object-contain`} loading="lazy" />
                  ))}
                </div>
              </div>
            </div>

            {/* right map - dark card */}
            <div className="w-full lg:w-[54%] relative overflow-hidden shrink-0 h-[280px] sm:h-[320px] lg:h-auto p-3 sm:p-4 lg:p-6 flex items-center justify-center">
              <div className="relative w-full h-full rounded-2xl border border-white/10 bg-black shadow-2xl overflow-hidden">
                <img
                  src="/world-map-dotted.png?v=black"
                  alt="Asteroidea global footprint - dotted world map with 12 countries and 30+ projects"
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/10 shadow-inner" />
                <div className="absolute bottom-3 left-3 right-3 flex justify-between gap-2 text-[11px] font-mono font-bold">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white px-3 py-1.5 shadow-md text-slate-900">
                    <span className="size-1.5 rounded-full bg-[#7C3AED]" /> 12 countries
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white px-3 py-1.5 shadow-md text-slate-900">
                    <span className="size-1.5 rounded-full bg-[#7C3AED]" /> 30+ projects
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white px-3 py-1.5 shadow-md text-slate-900">EMEA coverage</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── OUR CULTURE - PDF 02 ── VERTICAL CARDS (photo layout + your dark template colors) */}
        <section
          data-page={2}
          className="relative flex h-full w-screen shrink-0 snap-start snap-always flex-col isolate bg-[#0a0a1f] text-white overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a2e] via-[#0f0a1a] to-[#150a2e]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: "24px 24px" }} />
          <PageHeader number={2} total={totalPages} />
          <div className="relative z-10 flex flex-1 min-h-0 flex-col px-3 sm:px-4 lg:px-8 xl:px-10 py-2 sm:py-3 overflow-hidden">
            {/* header - keep your template typography/colors but follow photo layout (centered title + subtitle) */}
            <div className="text-center shrink-0">
              <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-bold tracking-tight text-white leading-none">Our Culture</h2>
              <p className="mt-2 text-sm sm:text-[15px] font-light tracking-wide text-white/70">The Heart of Our Team: Culture That Inspires</p>
              <div className="mx-auto mt-3 h-px w-12 bg-white/10" />
            </div>

            {/* vertical cards - SPREAD ACROSS FULL PAGE WIDTH */}
            <div className="mt-5 sm:mt-6 flex-1 min-h-0 flex flex-col justify-center">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 lg:gap-6 xl:gap-8 w-full">
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
                  {
                    title: "Employee Voices",
                    desc: "We include quotes from employees that express what they love about working here, showcasing the positive impact of our culture.",
                    customIcon: "voices",
                  },
                ].map((c) => (
                  <div
                    key={c.title}
                    className="group relative flex flex-col rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur p-5 sm:p-5 lg:px-5 lg:py-6 min-h-[310px] sm:min-h-[340px] lg:min-h-[440px] lg:h-[440px] shadow-sm hover:bg-white/[0.09] hover:border-white/15 transition-all"
                  >
                    {/* title - enlarged again */}
                    <h3 className="text-center text-[16px] sm:text-[17px] lg:text-[17.5px] font-bold leading-tight tracking-tight text-white min-h-[50px] flex items-center justify-center text-balance">{c.title}</h3>

                    {/* icon - CLEAN LUCIDE icons, larger & better readable */}
                    <div className="flex h-[110px] sm:h-[118px] items-center justify-center shrink-0 py-2">
                      <div className="flex size-[90px] sm:size-[94px] lg:size-[98px] items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] text-white shadow-lg shadow-[#7C3AED]/20">
                        {c.customIcon === "company" && <BuildingIcon className="size-[46px]" strokeWidth={1.7} />}
                        {c.customIcon === "inclusivity" && <UsersIcon className="size-[46px]" strokeWidth={1.7} />}
                        {c.customIcon === "innovation" && (
                          <div className="relative flex items-center justify-center">
                            <LightbulbIcon className="size-[46px]" strokeWidth={1.7} />
                            <SparklesIcon className="absolute -top-1 -right-1 size-4 text-white/90" strokeWidth={2} />
                          </div>
                        )}
                        {c.customIcon === "worklife" && <ScaleIcon className="size-[46px]" strokeWidth={1.7} />}
                        {c.customIcon === "collab" && <HandshakeIcon className="size-[46px]" strokeWidth={1.7} />}
                        {c.customIcon === "voices" && <MessageSquareQuoteIcon className="size-[46px]" strokeWidth={1.7} />}
                      </div>
                    </div>

                    {/* desc - enlarged to fill empty space */}
                    <p className="text-center text-[14.5px] sm:text-[15px] lg:text-[15.5px] leading-[1.5] text-white/80 font-medium flex-1 flex items-start justify-center pt-1.5">{c.desc}</p>
                    <div className="mt-3 h-1 w-10 self-center rounded-full bg-white/10 group-hover:w-14 group-hover:bg-[#7C3AED] transition-all" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── WHY INTERN - PDF 03 ── GLASS */}
        <section
          data-page={3}
          className="relative flex h-full w-screen shrink-0 snap-start snap-always flex-col isolate bg-[#0a0a1f] text-white overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a2e] via-[#0f0a1a] to-[#150a2e]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: "24px 24px" }} />
          <PageHeader number={3} total={totalPages} />
          <div className="relative z-10 flex flex-1 min-h-0 flex-col px-4 sm:px-6 lg:px-8 xl:px-10 py-3 overflow-hidden">
            <div className="flex flex-1 flex-col justify-center w-full">
              <div className="text-center max-w-3xl mx-auto shrink-0">
                <span className="inline-flex items-center rounded-full bg-[#7C3AED] px-3.5 py-1 text-[10px] font-bold tracking-widest text-white uppercase shadow">WHY US</span>
                <h2 className="mt-3 text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight leading-none">
                  <span className="text-white">Why</span> <span className="text-[#8B5CF6]">Intern</span> <span className="text-white">With Us?</span>
                </h2>
                <p className="mt-2.5 text-sm sm:text-[13.5px] font-light tracking-wide text-white/60 max-w-xl mx-auto">Four reasons to launch your career with a team that invests in you — modern, human, and impact-driven.</p>
              </div>

              {/* ── WHY US TIMELINE — horizontal connected 4-step timeline ── */}
              <div className="relative w-full max-w-[1440px] mx-auto mt-10 lg:mt-12 flex-1 min-h-0 flex flex-col justify-center">
                {/* tablet & desktop — horizontal timeline: 4 circles on one line, content below, arrow at the end */}
                <div className="relative hidden md:grid grid-cols-4 gap-x-8 lg:gap-x-10 xl:gap-x-14">
                  {WHY_STEPS.map((c) => (
                    <div key={c.n} className="relative flex flex-col items-center text-center">
                      <div className="relative z-10 flex size-20 xl:size-28 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#4F1BB8] border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_0_45px_rgba(124,58,237,0.4)]">
                        <c.icon className="size-9 xl:size-12 text-white" strokeWidth={1.6} />
                      </div>
                      <span className="relative mt-4 xl:mt-5 text-[13.5px] xl:text-[14px] font-bold text-[#8B5CF6]">{c.n}</span>
                      <h3 className="relative mt-1.5 text-[16px] sm:text-[17px] lg:text-[17.5px] font-bold leading-tight tracking-tight text-white text-balance">{c.title}</h3>
                      <div className="relative mt-2.5 h-[3px] w-10 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#A78BFA]" />
                      <p className="relative mt-2.5 text-[14.5px] sm:text-[15px] lg:text-[15.5px] leading-[1.5] text-white/80 font-medium max-w-[clamp(220px,22vw,300px)]">{c.desc}</p>
                    </div>
                  ))}
                </div>

                {/* mobile — vertical stack */}
                <div className="relative flex-1 min-h-0 overflow-y-auto scrollbar-thin md:hidden">
                  <div className="flex flex-col gap-14">
                    {WHY_STEPS.map((c) => (
                      <div key={c.n} className="relative flex flex-col items-center text-center">
                        <div className="relative z-10 flex size-24 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#4F1BB8] border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_0_30px_rgba(124,58,237,0.4)]">
                          <c.icon className="size-11 text-white" strokeWidth={1.6} />
                        </div>
                        <span className="relative mt-4 text-[14px] sm:text-[15px] font-bold text-[#8B5CF6]">{c.n}</span>
                        <h3 className="relative mt-1.5 text-[16px] sm:text-[17px] font-bold leading-tight tracking-tight text-white text-balance">{c.title}</h3>
                        <div className="relative mt-2.5 h-[3px] w-10 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#A78BFA]" />
                        <p className="relative mt-2.5 max-w-md text-[14.5px] sm:text-[15px] leading-[1.5] text-white/80 font-medium">{c.desc}</p>
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
          className="relative flex h-full w-screen shrink-0 snap-start snap-always flex-col isolate bg-[#0a0a1f] text-white overflow-hidden"
        >
          {/* plum/charcoal base + subtle radial violet glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#180a26] via-[#0d0a14] to-[#13091f]" />
          <div className="absolute -top-1/3 left-1/2 h-[70vh] w-[110vw] -translate-x-1/2 rounded-full bg-[#7C3AED]/20 blur-[160px]" />
          <div className="absolute -right-[10%] bottom-0 h-[50vh] w-[60vw] rounded-full bg-[#4C1D95]/15 blur-[140px]" />
          <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: "24px 24px" }} />
          <PageHeader number={4} total={totalPages} />
          <div className="relative z-10 flex flex-1 min-h-0 flex-col px-4 sm:px-6 lg:px-10 py-4 overflow-hidden">
            <div className="mx-auto flex w-full max-w-[1640px] flex-1 min-h-0 flex-col">
              <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 px-1">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Internship Opportunities</h2>
                </div>
              </div>

              <div className="mt-5 flex flex-1 min-h-0 flex-col overflow-hidden">
                <div className="flex-1 min-h-0 overflow-auto scrollbar-thin">
                  <table className="w-full min-w-[900px] text-left text-sm xl:text-[15px] border-collapse">
                    <thead className="sticky top-0 z-10">
                      <tr className="border-b border-white/10 bg-[#0d0b14]/95 backdrop-blur-xl">
                        <th scope="col" className="px-4 py-4 font-bold uppercase tracking-[0.14em] text-white whitespace-nowrap w-[11%] min-w-[130px] text-sm">REFERENCE</th>
                        <th scope="col" className="px-4 py-4 w-[38%] min-w-[340px] font-bold uppercase tracking-[0.14em] text-white text-sm text-center">PROJECT TITLE</th>
                        <th scope="col" className="px-4 py-4 w-[16%] min-w-[160px] font-bold uppercase tracking-[0.14em] text-white text-sm text-center">PROFILE</th>
                        <th scope="col" className="px-4 py-4 w-[25%] min-w-[260px] font-bold uppercase tracking-[0.14em] text-white text-sm text-center">TECHNOLOGIES</th>
                        <th scope="col" className="px-4 py-4 w-[10%] min-w-[110px] font-bold uppercase tracking-[0.14em] text-white text-sm text-center">PAGE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.08]">
                      {subjects.map((s, idx) => {
                        const pageNum = 6 + idx
                        const profile = s.profiles && s.profiles.length > 0 ? s.profiles.map((p) => p.name).join(" / ") : "—"
                        return (
                          <tr key={s.id} onClick={() => scrollToSubject(s.code)} className="cursor-pointer group transition-colors hover:bg-white/[0.04]">
                            <td className="px-4 py-5 whitespace-nowrap text-sm font-mono font-bold tracking-wide text-white/90">
                              {s.code}
                            </td>
                            <td className="px-4 py-5 text-[15px] font-semibold leading-snug text-white group-hover:text-white">
                              {s.name}
                            </td>
                            <td className="px-4 py-5 text-[15px] font-semibold leading-snug text-white">
                              {profile}
                            </td>
                            <td className="px-4 py-5">
                              <div className="flex flex-wrap items-center justify-start gap-2">
                                {s.technologies?.length ? (
                                  <>
                                    {s.technologies.slice(0, 5).map((t) => (
                                      <span key={t.id} className="inline-flex items-center rounded-full bg-[#1a0a2e] border border-[#7C3AED]/30 px-3 py-1.5 text-[13px] font-semibold text-white whitespace-nowrap shadow-sm">
                                        {t.name}
                                      </span>
                                    ))}
                                    {(s.technologies.length > 5) && (
                                      <span className="inline-flex items-center rounded-full bg-white/[0.06] border border-white/10 px-3 py-1.5 text-[12px] font-bold text-white/60">
                                        +{s.technologies.length - 5}
                                      </span>
                                    )}
                                  </>
                                ) : <span className="text-white/40 text-sm">—</span>}
                              </div>
                            </td>
                            <td className="px-4 py-5 text-[15px] font-bold text-center tabular-nums text-white">
                              {String(pageNum).padStart(2, "0")}
                            </td>
                          </tr>
                        )
                      })}
                      {subjects.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-16 text-center text-base text-white/60">No subjects available yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SUBJECT PAGES - PDF 06-11 ── copied design from reference image, data unchanged */}
        {subjects.map((s, idx) => {
          const isSelected = has(s.code)
          const pageNo = 6 + idx
          return (
            <section
              key={s.id}
              data-page={5 + idx}
              className="relative flex h-full w-screen shrink-0 snap-start snap-always flex-col isolate bg-[#0a0a1f] text-white overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a2e] via-[#0f0a1a] to-[#150a2e]" />

              {/* page indicator — top right like before but muted to match image */}
              <div className="relative z-10 flex shrink-0 items-center justify-end px-6 sm:px-8 lg:px-10 py-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] backdrop-blur border border-white/10 px-3 py-1.5 text-[11px] font-mono tracking-[0.18em] text-white/50">
                  {String(pageNo).padStart(2, "0")} / {String(totalPages).padStart(2, "0")}
                </span>
              </div>

              <div className="relative z-10 flex flex-1 min-h-0 flex-col overflow-y-auto scrollbar-thin">
                <div className="w-full px-6 sm:px-8 lg:px-10 pb-6">
                  {/* header — yellow left line + pill + title like image */}
                  <div className="flex gap-4">
                    <div className="hidden sm:block w-[3px] shrink-0 self-stretch rounded-full bg-[#D4E157] mt-1" />
                    <div className="flex flex-col gap-2.5 min-w-0 flex-1">
                      <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#D4E157]/30 bg-[#D4E157]/10 px-3 py-1 text-[11px] font-bold tracking-wide text-[#D4E157]">
                        <span className="size-2 rounded-full bg-[#D4E157] shadow-[0_0_6px_rgba(212,225,87,0.6)]" />
                        {s.code}
                      </span>
                      <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-black leading-tight tracking-tight text-white">
                        {s.name}
                      </h2>
                      <p className="text-sm font-medium tracking-wide text-[#A78BFA]">{s.profiles && s.profiles.length > 0 ? s.profiles.map((p) => p.name).join(" • ") : "PFE • 2026"}</p>
                    </div>
                  </div>

                  <div className="mt-6 grid lg:grid-cols-[1.05fr_1.35fr] gap-8 lg:gap-10 lg:items-start">
                    {/* left: world map + Profile/Period under photo — no cards */}
                    <div className="flex flex-col gap-6">
                      <div className="rounded-2xl overflow-hidden flex items-center justify-center">
                        <img
                          src={subjectImage(idx)}
                          alt={s.name}
                          className="h-[420px] lg:h-[500px] xl:h-[540px] w-full object-cover rounded-2xl"
                          loading="eager"
                          onError={(e) => {
                            const t = e.currentTarget as HTMLImageElement
                            if (!t.dataset.fallback) {
                              t.dataset.fallback = "1"
                              t.src = "/world-map-dotted.png"
                            }
                          }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="relative py-1">
                          <div className="flex items-center gap-2">
                            <span className="w-0.5 h-4 rounded-full bg-[#D4E157]" />
                            <p className="text-[11px] font-bold tracking-widest text-[#A78BFA] uppercase">Profile</p>
                          </div>
                          <p className="mt-3 text-sm font-bold text-white">{s.profiles && s.profiles.length > 0 ? s.profiles.map((p) => p.name).join(" / ") : "—"}</p>
                          <UserIcon className="absolute bottom-1 right-2 size-9 text-white" strokeWidth={1.6} />
                        </div>
                        <div className="relative py-1">
                          <div className="flex items-center gap-2">
                            <span className="w-0.5 h-4 rounded-full bg-[#D4E157]" />
                            <p className="text-[11px] font-bold tracking-widest text-[#A78BFA] uppercase">Period</p>
                          </div>
                          <p className="mt-3 text-sm font-bold text-white">{s.duration?.name || "6 Mois"}</p>
                          <CalendarIcon className="absolute bottom-1 right-2 size-9 text-white" strokeWidth={1.6} />
                        </div>
                      </div>
                    </div>

                    {/* right: description + Technologies under description — no cards */}
                    <div className="flex flex-col gap-6">
                      <div className="py-1 flex flex-col flex-1">
                        <div className="flex items-center gap-2">
                          <span className="w-0.5 h-4 rounded-full bg-[#D4E157]" />
                          <p className="text-[11px] font-bold tracking-widest text-[#A78BFA] uppercase">Description</p>
                        </div>
                        <div className="mt-4 space-y-4 text-[17px] lg:text-[18px] leading-[1.75] text-white/90 whitespace-pre-wrap flex-1">
                          {s.description ? (
                            s.description.split("\n\n").map((para, i) => (
                              <p key={i}>{para}</p>
                            ))
                          ) : (
                            <p>No description provided for this subject — contact us for details.</p>
                          )}
                        </div>
                      </div>
                      <div className="py-1">
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="w-0.5 h-4 rounded-full bg-[#D4E157]" />
                          <p className="text-[11px] font-bold tracking-widest text-[#A78BFA] uppercase">Technologies</p>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 content-start max-h-[140px] overflow-y-auto pr-1 scrollbar-thin">
                          {s.technologies && s.technologies.length > 0 ? (
                            s.technologies.map((t) => (
                              <span key={t.id} className="inline-flex items-center rounded-full bg-[#2B1B6B] border border-[#7C3AED]/30 text-white px-3.5 py-1.5 text-xs font-semibold shadow-sm shrink-0">
                                {t.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-white/50">—</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* button — bottom right of page */}
                  <div className="mt-6 flex justify-end">
                    <Button
                      onClick={() => toggle(s.code)}
                      className={`rounded-xl px-7 py-5 text-sm font-bold shadow-[0_0_20px_rgba(124,58,237,0.4)] border transition-all ${isSelected ? "bg-white border-[#7C3AED] text-[#7C3AED] hover:bg-white/90" : "bg-[#7C3AED] border-[#7C3AED] text-white hover:bg-[#6D28D9] hover:shadow-[0_0_28px_rgba(124,58,237,0.55)]"}`}
                    >
                      {isSelected ? "Selected ✓" : "Pre-select this subject"}
                    </Button>
                  </div>
                </div>
              </div>

            </section>
          )
        })}

        {/* ── WE WILL CHALLENGE YOU - PDF 13 ── GLASS */}
        <section
          data-page={5 + subjects.length}
          className="relative flex h-full w-screen shrink-0 snap-start snap-always flex-col isolate bg-[#0a0a1f] text-white overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a2e] via-[#0f0a1a] to-[#150a2e]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: "24px 24px" }} />
          <PageHeader number={6 + subjects.length} total={totalPages} />
          {/* stepped cards — same content/colors, layout like Why Intern With Us */}
          <div className="relative z-10 flex flex-1 min-h-0 flex-col px-4 sm:px-6 lg:px-8 xl:px-10 py-3 overflow-hidden">
            <div className="flex flex-1 flex-col justify-center w-full">
              <div className="text-center max-w-3xl mx-auto shrink-0">
                <span className="inline-flex items-center rounded-full bg-[#7C3AED] px-3.5 py-1 text-[10px] font-bold tracking-widest text-white uppercase shadow">OUR MINDSET</span>
                <h2 className="mt-3 text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight leading-none">
                  <span className="text-white">We will </span><span className="text-[#8B5CF6]">challenge</span><span className="text-white"> you</span>
                </h2>
                <p className="mt-2.5 text-sm sm:text-[13.5px] font-light tracking-wide text-white/60 max-w-xl mx-auto">Growth begins outside your comfort zone — our mindset in three principles.</p>
              </div>

              <div className="relative w-full max-w-[1440px] mx-auto mt-10 lg:mt-12 flex-1 min-h-0 flex flex-col justify-center">
                {/* desktop — same as Why Intern: 3 centered items */}
                <div className="relative hidden md:grid grid-cols-3 gap-x-8 lg:gap-x-10 xl:gap-x-14">
                  {MINDSET_STEPS.map((c) => (
                    <div key={c.n} className="relative flex flex-col items-center text-center">
                      <div className="relative z-10 flex size-20 xl:size-28 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#4F1BB8] border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_0_45px_rgba(124,58,237,0.4)]">
                        <c.icon className="size-9 xl:size-12 text-white" strokeWidth={1.6} />
                      </div>
                      <span className="relative mt-4 xl:mt-5 text-[13.5px] xl:text-[14px] font-bold text-[#8B5CF6]">{c.n}</span>
                      <h3 className="relative mt-1.5 text-[16px] sm:text-[17px] lg:text-[17.5px] font-bold leading-tight tracking-tight text-white text-balance">{c.title}</h3>
                      <div className="relative mt-2.5 h-[3px] w-10 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#A78BFA]" />
                      <p className="relative mt-2.5 text-[14.5px] sm:text-[15px] lg:text-[15.5px] leading-[1.5] text-white/80 font-medium max-w-[clamp(220px,22vw,300px)]">{c.desc}</p>
                    </div>
                  ))}
                </div>

                {/* mobile — same as Why Intern */}
                <div className="relative flex-1 min-h-0 overflow-y-auto scrollbar-thin md:hidden">
                  <div className="flex flex-col gap-14">
                    {MINDSET_STEPS.map((c) => (
                      <div key={c.n} className="relative flex flex-col items-center text-center">
                        <div className="relative z-10 flex size-24 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#4F1BB8] border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_0_30px_rgba(124,58,237,0.4)]">
                          <c.icon className="size-11 text-white" strokeWidth={1.6} />
                        </div>
                        <span className="relative mt-4 text-[14px] sm:text-[15px] font-bold text-[#8B5CF6]">{c.n}</span>
                        <h3 className="relative mt-1.5 text-[16px] sm:text-[17px] font-bold leading-tight tracking-tight text-white text-balance">{c.title}</h3>
                        <div className="relative mt-2.5 h-[3px] w-10 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#A78BFA]" />
                        <p className="relative mt-2.5 max-w-md text-[14.5px] sm:text-[15px] leading-[1.5] text-white/80 font-medium">{c.desc}</p>
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
          className="relative flex h-full w-screen shrink-0 snap-start snap-always flex-col isolate bg-[#0a0a1f] text-white overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a2e] via-[#0f0a1a] to-[#150a2e]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: "24px 24px" }} />
          <PageHeader number={7 + subjects.length} total={totalPages} />
          <div className="relative z-10 flex flex-1 min-h-0 flex-col px-4 sm:px-6 lg:px-8 xl:px-10 py-3 overflow-hidden">
            <div className="flex flex-1 flex-col justify-center w-full">
              <div className="text-center max-w-3xl mx-auto shrink-0">
                <span className="inline-flex items-center rounded-full bg-[#7C3AED] px-3.5 py-1 text-[10px] font-bold tracking-widest text-white uppercase shadow">JOIN US</span>
                <h2 className="mt-3 text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight leading-none">
                  <span className="text-white">Recruitment </span><span className="text-[#8B5CF6]">Process</span>
                </h2>
                <p className="mt-2.5 text-sm sm:text-[13.5px] font-light tracking-wide text-white/60 max-w-xl mx-auto">Three steps to join our team — transparent, fair, and fast.</p>
              </div>

              <div className="relative w-full max-w-[1440px] mx-auto mt-10 lg:mt-14 flex-1 min-h-0 flex flex-col justify-center">
                <div className="relative hidden md:grid grid-cols-3 gap-x-12 lg:gap-x-16 xl:gap-x-20">
                  {/* horizontal connectors with arrows — step 1→2 and 2→3 */}
                  <div aria-hidden className="absolute left-[16.66%] right-[16.66%] top-[40px] xl:top-[56px] flex items-center pointer-events-none">
                    <div className="flex-1 flex items-center">
                      <div className="flex-1 h-[2px] bg-[#7C3AED]/70" />
                      <ArrowRightIcon className="size-4 xl:size-5 text-[#7C3AED] -ml-1 shrink-0" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 flex items-center">
                      <div className="flex-1 h-[2px] bg-[#7C3AED]/70" />
                      <ArrowRightIcon className="size-4 xl:size-5 text-[#7C3AED] -ml-1 shrink-0" strokeWidth={2.5} />
                    </div>
                  </div>
                  <div aria-hidden className="absolute left-[16.66%] right-[16.66%] top-[40px] xl:top-[56px] h-[10px] -translate-y-[4px] flex pointer-events-none">
                    <div className="flex-1 mx-2 h-[10px] bg-[#7C3AED]/15 blur-[6px] rounded-full" />
                    <div className="flex-1 mx-2 h-[10px] bg-[#7C3AED]/15 blur-[6px] rounded-full" />
                  </div>
                  {[
                    { step: "01", title: "CV Screening", desc: "We review your application and CV to understand your profile and aspirations." },
                    { step: "02", title: "Online Assessment", desc: "A hands-on task or technical assessment to showcase your skills." },
                    { step: "03", title: "On-Site Evaluation", desc: "Final interview with the team to align on project and culture." },
                  ].map((s) => (
                    <div key={s.step} className="relative flex flex-col items-center text-center">
                      <div className="relative z-10 flex size-20 xl:size-28 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#4F1BB8] border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_0_45px_rgba(124,58,237,0.4)]">
                        <span className="text-sm xl:text-base font-black tracking-wide text-white">Step {Number(s.step)}</span>
                      </div>
                      <h3 className="relative mt-4 xl:mt-5 text-[16px] sm:text-[17px] lg:text-[17.5px] font-bold leading-tight tracking-tight text-white text-balance">{s.title}</h3>
                      <div className="relative mt-2.5 h-[3px] w-10 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#A78BFA]" />
                      <p className="relative mt-2.5 text-[14.5px] sm:text-[15px] lg:text-[15.5px] leading-[1.5] text-white/80 font-medium max-w-[clamp(220px,22vw,300px)]">{s.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="relative flex-1 min-h-0 overflow-y-auto scrollbar-thin md:hidden">
                  {/* vertical connectors with arrows */}
                  <div aria-hidden className="absolute left-1/2 top-[48px] bottom-[48px] w-0.5 -translate-x-1/2 flex flex-col pointer-events-none">
                    <div className="flex-1 flex flex-col items-center">
                      <div className="flex-1 w-[2px] bg-[#7C3AED]/70" />
                      <ArrowRightIcon className="size-4 text-[#7C3AED] rotate-90 -mt-1 shrink-0" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 flex flex-col items-center">
                      <div className="flex-1 w-[2px] bg-[#7C3AED]/70" />
                      <ArrowRightIcon className="size-4 text-[#7C3AED] rotate-90 -mt-1 shrink-0" strokeWidth={2.5} />
                    </div>
                  </div>
                  <div aria-hidden className="absolute left-1/2 top-[48px] bottom-[48px] w-2 -translate-x-1/2 flex flex-col pointer-events-none">
                    <div className="flex-1 mx-auto w-2 bg-[#7C3AED]/10 blur-[6px] rounded-full my-2" />
                    <div className="flex-1 mx-auto w-2 bg-[#7C3AED]/10 blur-[6px] rounded-full my-2" />
                  </div>
                  <div className="flex flex-col gap-14">
                    {[
                      { step: "01", title: "CV Screening", desc: "We review your application and CV to understand your profile and aspirations." },
                      { step: "02", title: "Online Assessment", desc: "A hands-on task or technical assessment to showcase your skills." },
                      { step: "03", title: "On-Site Evaluation", desc: "Final interview with the team to align on project and culture." },
                    ].map((s) => (
                      <div key={s.step} className="relative flex flex-col items-center text-center">
                        <div className="relative z-10 flex size-24 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#4F1BB8] border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_0_30px_rgba(124,58,237,0.4)]">
                          <span className="text-sm font-black tracking-wide text-white">Step {Number(s.step)}</span>
                        </div>
                        <h3 className="relative mt-4 text-[16px] sm:text-[17px] font-bold leading-tight tracking-tight text-white text-balance">{s.title}</h3>
                        <div className="relative mt-2.5 h-[3px] w-10 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#A78BFA]" />
                        <p className="relative mt-2.5 max-w-md text-[14.5px] sm:text-[15px] leading-[1.5] text-white/80 font-medium">{s.desc}</p>
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
          className="relative flex h-full w-screen shrink-0 snap-start snap-always flex-col isolate bg-[#0a0a1f] text-white overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a2e] via-[#0f0a1a] to-[#150a2e]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: "24px 24px" }} />
          <div className="relative z-10 flex shrink-0 items-center justify-between px-6 sm:px-8 lg:px-12 py-2 bg-transparent">
            <BrandLogo dark className="h-[180px] w-[200px] object-contain -my-14 drop-shadow-sm" />
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur border border-white/10 px-3 py-1.5 text-[11px] font-mono tracking-[0.2em] text-white/70">
              {String(8 + subjects.length).padStart(2, "0")} / {String(totalPages).padStart(2, "0")}
            </span>
          </div>
          <div className="relative z-10 flex flex-1 flex-col px-4 sm:px-6 lg:px-8 xl:px-10 py-4 overflow-hidden">
            <div className="flex-1 flex flex-col justify-center w-full max-w-[1400px] mx-auto">
              <div className="flex flex-col lg:flex-row gap-6 lg:gap-6 items-stretch">
                {/* Photo — left */}
                <div className="lg:w-[30%] relative rounded-2xl overflow-hidden border border-white/10 bg-black shrink-0">
                  <img src="/Sheryl.png" alt="Sheryl Sandberg" className="w-full h-[380px] sm:h-[420px] lg:h-full min-h-[380px] object-cover object-top" loading="lazy" />
                </div>
                {/* Quote — center */}
                <div className="lg:w-[42%] relative rounded-2xl border border-[#7C3AED]/30 bg-[#0f0a1f]/50 backdrop-blur p-7 sm:p-8 lg:p-8 xl:p-10 flex flex-col justify-center">
                  <QuoteIcon className="absolute top-5 left-6 size-8 text-[#7C3AED]/60" />
                  <div className="hidden lg:block absolute top-1/2 -right-2 -translate-y-1/2 size-3.5 rotate-45 border-t border-r border-[#7C3AED]/30 bg-[#0f0a1f]" />
                  <div className="hidden lg:block absolute -right-[9px] top-1/2 -translate-y-1/2 size-2 rotate-45 bg-[#7C3AED]/60" />
                  <div className="space-y-2.5 mt-2">
                    <p className="inline-block rounded-lg bg-[#7C3AED]/25 border border-[#7C3AED]/20 px-3 py-1.5 text-lg sm:text-xl lg:text-[20px] font-medium leading-relaxed text-white">“If you&apos;re offered a seat</p>
                    <p className="inline-block rounded-lg bg-[#7C3AED]/25 border border-[#7C3AED]/20 px-3 py-1.5 text-lg sm:text-xl lg:text-[20px] font-medium leading-relaxed text-white">on a rocket ship, don’t ask</p>
                    <p className="inline-block rounded-lg bg-[#7C3AED]/25 border border-[#7C3AED]/20 px-3 py-1.5 text-lg sm:text-xl lg:text-[20px] font-medium leading-relaxed text-white">what seat. Just get on.”</p>
                  </div>
                  <p className="mt-6 text-xs font-bold tracking-widest text-[#8B5CF6] uppercase">— SHERYL SANDBERG, FORMER COO OF FACEBOOK</p>
                  {/* speech bubble tail bottom right */}
                  <div className="hidden lg:block absolute -bottom-1 -right-1 size-3 rotate-45 border-b border-r border-[#7C3AED]/30 bg-[#0f0a1f]" />
                </div>
                {/* Contact — right */}
                <div className="lg:w-[28%] flex flex-col justify-center gap-5 lg:border-l lg:border-white/10 lg:pl-6 xl:pl-8 py-2">
                  <div className="flex items-start gap-2.5">
                    <MapPinIcon className="size-5 text-[#7C3AED] mt-0.5 shrink-0" />
                    <p className="text-sm leading-relaxed text-white/80">87 rue de la république,<br/>Mégrine - 2033, Ben Arous,<br/>Tunisia</p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <a href="mailto:careers@asteroidea.co" className="inline-flex items-center gap-2.5 rounded-xl border border-[#7C3AED]/30 bg-[#0f0a1f]/40 px-4 py-2.5 text-sm text-white/90 hover:bg-white/[0.06] transition-colors">
                      <MailIcon className="size-4 text-[#7C3AED]" />
                      careers@asteroidea.co
                    </a>
                    <a href="https://asteroidea.co" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2.5 rounded-xl border border-[#7C3AED]/30 bg-[#0f0a1f]/40 px-4 py-2.5 text-sm text-white/90 hover:bg-white/[0.06] transition-colors">
                      <GlobeIcon className="size-4 text-[#7C3AED]" />
                      asteroidea.<span className="text-[#EF4444]">co</span>
                    </a>
                    <a href="https://www.linkedin.com/company/asteroidea-co" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2.5 rounded-xl border border-[#7C3AED]/30 bg-[#0f0a1f]/40 px-4 py-2.5 text-sm text-white/90 hover:bg-white/[0.06] transition-colors">
                      <LinkedinIcon className="size-4 text-[#7C3AED]" />
                      Asteroidea
                    </a>
                  </div>
                </div>
              </div>
              {/* Navigation buttons — below, centered */}
              <div className="mt-8 flex items-center justify-center gap-3">
                <Button variant="outline" onClick={() => goTo(0)} className="rounded-xl border border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white h-10 px-6 text-sm font-medium">Back to cover</Button>
                <Button onClick={() => goTo(4)} className="rounded-xl bg-[#7C3AED] text-white hover:bg-[#6D28D9] h-10 px-6 text-sm font-medium shadow-[0_4px_20px_rgba(124,58,237,0.3)]">Browse subjects</Button>
              </div>
            </div>
          </div>
        </section>

        {/* ── SHORTLIST ── GLASS */}
        <section
          data-page={8 + subjects.length}
          className="relative flex h-full w-screen shrink-0 snap-start snap-always flex-col isolate bg-[#0a0a1f] text-white overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a2e] via-[#0f0a1a] to-[#150a2e]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: "24px 24px" }} />
          <PageHeader number={9 + subjects.length} total={totalPages} />
          <div className="relative z-10 flex flex-1 min-h-0 flex-col overflow-y-auto px-4 sm:px-8 lg:px-12 py-6 scrollbar-thin">
            <div className="mx-auto flex w-full max-w-4xl flex-1 min-h-0 flex-col">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] text-white shadow">
                  <BookmarkCheckIcon className="size-5" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Your Shortlist</h2>
                  <p className="text-sm text-white/60">{shortlist.length === 0 ? "No subjects pre-selected yet — bookmark your favorites." : `${shortlist.length} subject${shortlist.length > 1 ? "s" : ""} pre-selected • Ready to apply`}</p>
                </div>
                {shortlist.length > 0 && <Button variant="outline" size="sm" className="ml-auto rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white" onClick={clear}>Clear all</Button>}
              </div>

              <div className="mt-6 flex flex-1 min-h-[200px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur shadow-sm">
                <div className="flex-1 overflow-auto scrollbar-thin">
                  {shortlist.length === 0 ? (
                    <div className="flex h-full min-h-[260px] flex-col items-center justify-center gap-3 py-12 text-center px-6">
                      <div className="flex size-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white/40">
                        <BookmarkIcon className="size-6" />
                      </div>
                      <p className="text-sm font-medium text-white">Your shortlist is empty.</p>
                      <p className="text-xs text-white/60 max-w-sm">Tap the bookmark on any subject page or in the index to save it here. You can apply with your selection in one click.</p>
                      <Button variant="outline" size="sm" onClick={() => goTo(4)} className="rounded-full mt-2 border-white/20 bg-white/5 text-white hover:bg-white/10">Browse subjects</Button>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/10">
                      {shortlist.map((code) => subjects.find((s) => s.code === code)).filter(Boolean).map((s) => (
                        <div key={s!.code} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors">
                          <span className="hidden sm:inline-flex font-mono text-xs font-bold tracking-widest text-white bg-white/10 border border-white/10 px-2 py-1 rounded-full">{s!.code}</span>
                          <span className="sm:hidden font-mono text-[11px] font-bold text-white">{s!.code}</span>
                          <span className="flex-1 text-sm font-medium truncate pr-2 text-white">{s!.name}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Button variant="outline" size="sm" className="h-7 text-xs rounded-full hidden sm:inline-flex border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={() => scrollToSubject(s!.code)}>View</Button>
                            <Button variant="ghost" size="sm" className="h-7 text-xs rounded-full text-white/70 hover:text-white hover:bg-white/10" onClick={() => toggle(s!.code)}>Remove</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {shortlist.length > 0 && (
                  <div className="border-t border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-white/60 flex items-center gap-2">
                    <CheckIcon className="size-3.5 text-[#C4B5FD]" /> You can modify your selection on the application form as well.
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
                <Button disabled={shortlist.length === 0} size="lg" className="w-full sm:w-auto gap-2 rounded-xl px-8 font-semibold shadow bg-[#7C3AED] text-white hover:bg-[#6D28D9] disabled:bg-white/10 disabled:text-white/40" onClick={() => navigate("/form")}>
                  <CheckIcon className="size-4" /> Apply with {shortlist.length || "selection"}
                </Button>
                <span className="text-xs text-white/60 text-center">You’ll confirm subjects and fill details on the next step.</span>
                <Button variant="ghost" size="sm" className="sm:ml-auto rounded-full text-white/70 hover:text-white hover:bg-white/10" onClick={() => goTo(4)}>Back to index</Button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ── NEW BOTTOM NAV : non-overlay, progress + dots + controls — GLASS */}
      <footer className="relative z-20 shrink-0 border-t border-white/10 bg-[#0a0a1f]/90 backdrop-blur-xl">
        {/* progress line */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-white/10">
          <div className="h-full bg-[#7C3AED] transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>

        <div className="flex items-center gap-2 px-2 sm:px-4 py-2.5">
          {/* left: nav */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <Button
              variant="outline"
              size="icon"
              className="size-8 sm:size-9 rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              onClick={() => goTo(activePage - 1)}
              disabled={activePage === 0}
              aria-label="Previous page"
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8 sm:size-9 rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              onClick={() => goTo(activePage + 1)}
              disabled={activePage === totalPages - 1}
              aria-label="Next page"
            >
              <ChevronRightIcon className="size-4" />
            </Button>
            <span className="hidden lg:inline-flex items-center gap-1 ml-1 text-xs text-white/60">
              <span className="hidden xl:inline">Use</span> <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-white/60">←</kbd><kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-white/60">→</kbd> <span className="hidden xl:inline">to navigate</span>
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
                        ? "w-8 h-2 bg-[#7C3AED] shadow"
                        : isSubjectPage
                          ? "size-2 bg-[#7C3AED]/40 hover:bg-[#7C3AED]/70"
                          : "size-2 bg-white/20 hover:bg-white/30"
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
                    className={`rounded-full transition-all ${isActive ? "w-6 h-1.5 bg-[#7C3AED]" : "size-1.5 bg-white/20"}`}
                    aria-label={`Go to page ${idx + 1}`}
                  />
                )
              })}
              {totalPages > 9 && <span className="text-[10px] text-white/60 ml-1">+{totalPages - 9}</span>}
            </div>
          </div>

          {/* right: actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span className="hidden sm:inline-flex text-xs font-mono tracking-wide text-white/60 tabular-nums">
              {String(activePage + 1).padStart(2, "0")} / {String(totalPages).padStart(2, "0")}
            </span>
            <span className="sm:hidden text-[11px] font-mono text-white/60 tabular-nums">
              {activePage + 1}/{totalPages}
            </span>
            <button
              onClick={() => goTo(totalPages - 1)}
              className={`inline-flex items-center gap-1 sm:gap-1.5 rounded-full px-2.5 sm:px-3 py-1.5 text-xs font-semibold shadow-sm border transition-colors ${shortlist.length > 0 ? "bg-[#7C3AED] text-white border-[#7C3AED]" : "bg-white/5 border-white/10 text-white hover:border-white/20 hover:bg-white/10"}`}
            >
              <BookmarkCheckIcon className="size-3.5" />
              <span className="hidden sm:inline">Shortlist</span>
              <span className={`inline-flex size-5 items-center justify-center rounded-full text-[11px] font-bold ${shortlist.length > 0 ? "bg-white text-[#7C3AED]" : "bg-[#7C3AED] text-white"}`}>{shortlist.length}</span>
            </button>
            <div className="hidden sm:flex items-center gap-1 ml-1 border-l border-white/10 pl-2">
              <Button variant="ghost" size="sm" className="h-8 rounded-full text-xs text-white/60 hover:text-white hover:bg-white/10" onClick={() => goTo(0)}>Cover</Button>
              <Button variant="ghost" size="sm" className="h-8 rounded-full text-xs text-white/60 hover:text-white hover:bg-white/10" onClick={() => navigate("/")}>Home</Button>
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
      <BrandLogo dark className="h-[180px] w-[200px] object-contain -my-14 drop-shadow-sm" />
      <span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur border border-white/10 px-3 py-1.5 text-[11px] font-mono tracking-[0.2em] text-white/70">
        {String(number).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </span>
    </div>
  )
}

