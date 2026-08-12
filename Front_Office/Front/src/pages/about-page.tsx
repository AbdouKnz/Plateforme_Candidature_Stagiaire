import { motion } from "motion/react"
import { useNavigate } from "react-router-dom"
import {
  
  LightbulbIcon,
  HandshakeIcon,
  StarIcon,
  ZapIcon,
  UsersIcon,
  SparklesIcon,
  TargetIcon,
  RocketIcon,
  
} from "lucide-react"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { useTranslation } from "@/context/language-context"
import { cn } from "@/lib/utils"
import { AuroraBackground } from "@/components/ui/animated-background"

const values = [
  {
    key: "1",
    icon: ZapIcon,
    gradient: "from-amber-500/20 to-amber-500/5",
    iconColor: "text-amber-500",
  },
  {
    key: "2",
    icon: HandshakeIcon,
    gradient: "from-blue-500/20 to-blue-500/5",
    iconColor: "text-blue-500",
  },
  {
    key: "3",
    icon: StarIcon,
    gradient: "from-purple-500/20 to-purple-500/5",
    iconColor: "text-purple-500",
  },
  {
    key: "4",
    icon: LightbulbIcon,
    gradient: "from-emerald-500/20 to-emerald-500/5",
    iconColor: "text-emerald-500",
  },
]

const advantages = [
  {
    key: "1",
    icon: RocketIcon,
  },
  {
    key: "2",
    icon: TargetIcon,
  },
  {
    key: "3",
    icon: SparklesIcon,
  },
  {
    key: "4",
    icon: UsersIcon,
  },
]

const techStack = [
  "React", "TypeScript", "Node.js", "Python", "AWS",
  "Docker", "PostgreSQL", "GraphQL", "Next.js", "Tailwind CSS",
  "React Native", "Go",
]

export function AboutPage() {
  const t = useTranslation()
  const navigate = useNavigate()

  return (
    <AuroraBackground className="min-h-svh">
      <img
        src="/website.png"
        alt=""
        className="fixed left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-auto opacity-[0.08] dark:opacity-[0.06] select-none object-contain pointer-events-none"
        aria-hidden="true"
      />
        <Navbar />

        {/* ── Hero + Story Card ── */}
        <section className="relative flex min-h-[80vh] items-center px-6 pt-32 pb-20 sm:px-8">
          <div className="mx-auto max-w-6xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary"
            >
              <SparklesIcon className="size-3.5" />
              {t("about.expertise")}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl"
            >
              {t("about.welcome")}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto mt-10 max-w-2xl text-base leading-relaxed text-foreground sm:text-lg"
            >
              {t("about.expertiseDesc")}
            </motion.p>
          </div>
        </section>

        {/* ── Our Mission ── */}
        <section className="relative px-6 pb-24 sm:px-8 sm:pb-32">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mb-12 text-center"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-4">
                <TargetIcon className="size-3.5" />
                {t("about.missionBadge")}
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {t("about.missionTitle")}
              </h2>
              <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-foreground sm:text-lg">
                {t("about.missionDesc")}
              </p>
            </motion.div>
          </div>
        </section>

        {/* ── Mission & Values ── */}
        <section className="relative px-6 pb-24 sm:px-8 sm:pb-32">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mb-16 text-center"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-4">
                <StarIcon className="size-3.5" />
                {t("about.valuesTitle")}
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {t("about.valuesSubtitle")}
              </h2>
            </motion.div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {values.map((v, i) => (
                <motion.div
                  key={v.key}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 * i, ease: [0.16, 1, 0.3, 1] }}
                  className="group rounded-2xl border border-border/60 bg-card p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all"
                >
                  <div className={cn(
                    "mb-4 flex size-12 items-center justify-center rounded-xl bg-gradient-to-br",
                    v.gradient,
                    v.iconColor
                  )}>
                    <v.icon className="size-5" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    {t(`about.value${v.key}`)}
                  </h3>
                  <p className="text-sm leading-relaxed text-foreground">
                    {t(`about.value${v.key}Desc`)}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Technologies / Expertise ── */}
        <section className="relative px-6 pb-24 sm:px-8 sm:pb-32">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mb-12 text-center"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-4">
                <ZapIcon className="size-3.5" />
                {t("about.techBadge")}
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {t("about.techTitle")}
              </h2>
              <p className="mt-3 text-foreground">
                {t("about.techDesc")}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap justify-center gap-3"
            >
              {techStack.map((tech, i) => (
                <span
                  key={tech}
                  className="inline-flex items-center rounded-xl border border-border/60 bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  {tech}
                </span>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── The Asteroidea Advantage ── */}
        <section className="relative px-6 pb-24 sm:px-8 sm:pb-32">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mb-16 text-center"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-4">
                <RocketIcon className="size-3.5" />
                {t("about.advantageTitle")}
              </div>
            </motion.div>

            <div className="grid gap-6 sm:grid-cols-2">
              {advantages.map((a, i) => (
                <motion.div
                  key={a.key}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 * i, ease: [0.16, 1, 0.3, 1] }}
                  className="group rounded-2xl border border-border/60 bg-card p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <a.icon className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground mb-2">
                        {t(`about.advantage${a.key}`)}
                      </h3>
                      <p className="text-sm leading-relaxed text-foreground">
                        {t(`about.advantage${a.key}Desc`)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        

        <Footer />
    </AuroraBackground>
  )
}
