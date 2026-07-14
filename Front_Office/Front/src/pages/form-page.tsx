import { motion } from "motion/react"
import { ChevronLeftIcon, FileTextIcon } from "lucide-react"
import { ApplicationForm } from "@/components/application-form"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { useTranslation } from "@/context/language-context"
import { Link } from "react-router-dom"

export function FormPage() {
  const t = useTranslation()

  return (
    <div className="relative min-h-svh bg-background">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 h-[400px] w-[400px] rounded-full bg-gradient-to-br from-primary/8 to-secondary/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-[350px] w-[350px] rounded-full bg-gradient-to-tr from-accent/8 to-primary/5 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(109,40,217,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(109,40,217,0.04)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="relative z-10 flex min-h-svh flex-col">
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
    </div>
  )
}
