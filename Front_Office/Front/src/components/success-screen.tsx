

import { motion } from "motion/react"
import { CheckIcon, MailIcon, RotateCcwIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslation } from "@/context/language-context"

interface SuccessScreenProps {
  fullName: string
  email: string
  onReset: () => void
}

function SuccessIllustration() {
  return (
    <svg
      viewBox="0 0 120 120"
      className="size-28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <motion.circle
        cx="60"
        cy="60"
        r="54"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-primary/20"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
      <motion.circle
        cx="60"
        cy="60"
        r="42"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-primary/10"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
      />
      <motion.circle
        cx="60"
        cy="60"
        r="28"
        fill="currentColor"
        className="text-primary/[0.08]"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.35 }}
      />
      <motion.circle
        cx="60"
        cy="60"
        r="16"
        fill="currentColor"
        className="text-primary"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut", delay: 0.5, type: "spring", stiffness: 200, damping: 14 }}
      />
      <motion.path
        d="M52 60l5.5 5.5 10.5-11"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, ease: "easeOut", delay: 0.7 }}
      />
    </svg>
  )
}

export function SuccessScreen({ fullName, email, onReset }: SuccessScreenProps) {
  const t = useTranslation()
  const firstName = fullName.trim().split(" ")[0] || "there"

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Card className="overflow-hidden border-border shadow-xs">
        <CardContent className="flex flex-col items-center gap-6 px-6 py-12 text-center sm:px-12">
          <div className="text-primary">
            <SuccessIllustration />
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-balance text-foreground">
              {t("success.thanks", { name: firstName })}
            </h2>
            <p className="max-w-sm text-pretty leading-relaxed text-muted-foreground">
              {t("success.submitted")}
            </p>
          </div>

          <div className="flex w-full max-w-sm items-center gap-3.5 rounded-xl border border-border bg-muted/30 p-3.5 text-left shadow-xs">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/[0.08] text-primary">
              <MailIcon className="size-4" />
            </div>
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("success.confirmationSentTo")}
              </span>
              <span className="truncate text-sm font-semibold text-foreground">
                {email}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onReset}
              className="mx-auto gap-1.5"
            >
              <RotateCcwIcon className="size-3.5" />
              {t("success.submitAnother")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
