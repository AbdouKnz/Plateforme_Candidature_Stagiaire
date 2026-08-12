import { motion } from "motion/react"
import { ChevronLeftIcon, FileTextIcon } from "lucide-react"
import { ApplicationForm } from "@/components/application-form"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { useTranslation } from "@/context/language-context"
import { Link } from "react-router-dom"
import { AuroraBackground } from "@/components/ui/animated-background"

export function FormPage() {
  const t = useTranslation()

  return (
    <AuroraBackground className="min-h-svh">
      <div className="flex min-h-svh flex-col">
        <Navbar />

        <main className="flex-1">
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="px-6 pt-24 sm:px-8"
          >
            <div className="mx-auto max-w-6xl">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground/70 hover:text-foreground transition-colors"
              >
                <ChevronLeftIcon className="size-4" />
                {t("form.backToHome")}
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="px-6 pt-8 pb-6 sm:px-8"
          >
            <div className="mx-auto max-w-6xl text-center">
              <div className="inline-flex items-center justify-center size-12 rounded-2xl bg-primary/10 text-primary mb-4">
                <FileTextIcon className="size-6" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {t("page.title")}
              </h1>
              <p className="mt-2 text-muted-foreground">
                {t("page.description")}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="px-6 pb-16 sm:px-8"
          >
            <div className="mx-auto max-w-6xl">
              <ApplicationForm />
            </div>
          </motion.div>

        </main>

        <Footer />
      </div>
    </AuroraBackground>
  )
}
