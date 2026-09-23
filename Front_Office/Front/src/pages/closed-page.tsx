import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useTranslation } from "@/context/language-context";
import { useTheme } from "@/context/theme-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { AuroraBackground } from "@/components/ui/animated-background";
import { subscribeWaitlist } from "@/service/front-office";
import { z } from "zod";

interface ClosedPageProps {
  reopeningDate?: string;
  closedMessage?: string;
  internshipTitle?: string;
}

const emailSchema = z.string().email();

type SubscribeState = "idle" | "loading" | "success" | "already" | "error";

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const [datePart, timePart] = dateStr.split(" ");
  const parts = datePart.split("-");
  if (parts.length !== 3) return dateStr;
  const formatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
  return timePart ? `${formatted} ${timePart.slice(0, 5)}` : formatted;
}

const TOTAL = { days: 365, hours: 24, minutes: 60, seconds: 60 };

function CountdownCircle({
  value,
  label,
  max,
  isDark,
}: {
  value: number;
  label: string;
  max: number;
  isDark: boolean;
}) {
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(value / max, 1));
  const offset = circumference * (1 - progress);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center"
    >
      <div className="relative flex items-center justify-center">
        <svg width={164} height={164} className="transform -rotate-90 shrink-0">
          <circle
            cx={82}
            cy={82}
            r={radius}
            fill="none"
            stroke={isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}
            strokeWidth={2}
          />
          <motion.circle
            cx={82}
            cy={82}
            r={radius}
            fill="none"
            stroke="url(#brandGrad)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{ filter: "drop-shadow(0 0 6px rgba(18,185,218,0.3))" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            key={value}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`text-4xl font-bold tabular-nums sm:text-5xl ${isDark ? "text-white" : "text-foreground"}`}
          >
            {String(value).padStart(2, "0")}
          </motion.span>
        </div>
      </div>
      <span
        className={`mt-3 text-xs font-bold tracking-[0.15em] uppercase ${isDark ? "text-white/50" : "text-muted-foreground"}`}
      >
        {label}
      </span>
    </motion.div>
  );
}

export function ClosedPage({ reopeningDate, internshipTitle }: ClosedPageProps) {
  const t = useTranslation();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [email, setEmail] = useState("");
  const [subscribeState, setSubscribeState] = useState<SubscribeState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [hasReopeningDate, setHasReopeningDate] = useState(false);

  useEffect(() => {
    if (!reopeningDate) return;
    setHasReopeningDate(true);
    const targetDate = new Date(reopeningDate);
    if (isNaN(targetDate.getTime())) return;

    function updateCountdown() {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [reopeningDate]);

  const items = [
    { value: timeLeft.days, label: t("closed.days"), max: TOTAL.days },
    { value: timeLeft.hours, label: t("closed.hours"), max: TOTAL.hours },
    { value: timeLeft.minutes, label: t("closed.mins"), max: TOTAL.minutes },
    { value: timeLeft.seconds, label: t("closed.seconds"), max: TOTAL.seconds },
  ];

  // Configurable in Back Office (Settings → Front Office → internship title).
  // Empty value keeps the default closed UI untouched. When set, the title
  // becomes the hero heading and the generic closed message is demoted.
  const trimmedTitle = internshipTitle?.trim() ?? "";
  const showTitle = trimmedTitle.length > 0;

  const handleSubscribe = async () => {
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setErrorMsg(t("closed.invalidEmail"));
      setSubscribeState("error");
      return;
    }
    setSubscribeState("loading");
    setErrorMsg("");
    try {
      await subscribeWaitlist(parsed.data);
      setSubscribeState("success");
    } catch (err: any) {
      const msg = err?.message ?? "";
      if (
        msg.includes("already subscribed") ||
        msg.includes("duplicate") ||
        msg.includes("already exists")
      ) {
        setSubscribeState("already");
      } else {
        setErrorMsg(t("closed.subscribeError"));
        setSubscribeState("error");
      }
    }
  };

  return (
    <AuroraBackground className="min-h-svh">
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#12B9DA" />
            <stop offset="100%" stopColor="#1D7CC7" />
          </linearGradient>
        </defs>
      </svg>

      <div className="relative flex flex-col items-center justify-center w-full min-h-svh px-6 py-16 sm:px-8">
        <div className="absolute top-6 right-6 flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className={`mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium tracking-wider ${isDark ? "border-white/10 bg-white/5 text-white/60" : "border-primary/20 bg-primary/10 text-primary"}`}
        >
          {reopeningDate
            ? `${t("closed.reopeningDate")} ${formatDate(reopeningDate)}`
            : t("closed.title")}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className={`mx-auto max-w-3xl text-center text-4xl font-bold leading-[1.08] tracking-tight break-words sm:text-5xl lg:text-6xl ${showTitle ? "" : isDark ? "text-white" : "text-foreground"}`}
        >
          {showTitle ? (
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              {trimmedTitle}
            </span>
          ) : (
            t("closed.title")
          )}
        </motion.h1>

        {showTitle && (
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className={`mt-4 text-center text-base sm:text-lg ${isDark ? "text-white/60" : "text-muted-foreground"}`}
          >
            {t("closed.title")}
          </motion.p>
        )}

        {hasReopeningDate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-8 lg:gap-12"
          >
            {items.map((item) => (
              <CountdownCircle
                key={item.label}
                value={item.value}
                label={item.label}
                max={item.max}
                isDark={isDark}
              />
            ))}
          </motion.div>
        )}

        {!hasReopeningDate && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className={`mt-10 text-sm text-center max-w-md ${isDark ? "text-white/40" : "text-muted-foreground"}`}
          >
            {t("closed.noDate")}
          </motion.p>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 text-center"
        >
          {subscribeState === "success" ? (
            <p
              className={`text-sm font-bold ${isDark ? "text-accent" : "text-primary"}`}
            >
              {t("closed.subscribeSuccess")}
            </p>
          ) : subscribeState === "already" ? (
            <p
              className={`text-sm font-bold ${isDark ? "text-accent" : "text-accent"}`}
            >
              {t("closed.subscribeSuccess")}
            </p>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="flex w-full max-w-md flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value.replace(/:/g, ""));
                    setErrorMsg("");
                  }}
                  placeholder={t("closed.emailPlaceholder")}
                  className={`h-11 w-full max-w-64 rounded-xl border px-4 text-sm outline-none transition-colors ${isDark ? "border-white/15 bg-white/5 text-white placeholder:text-white/40 focus:border-secondary" : "border-border bg-card text-foreground placeholder:text-muted-foreground focus:border-secondary"} ${errorMsg ? "border-destructive" : ""}`}
                />
                <button
                  onClick={handleSubscribe}
                  disabled={!email || subscribeState === "loading"}
                  className="inline-flex h-11 cursor-pointer items-center gap-2 whitespace-nowrap rounded-xl bg-gradient-to-r from-primary to-secondary px-7 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.03] active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {subscribeState === "loading" ? (
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
                      {t("closed.sending")}
                    </span>
                  ) : (
                    t("closed.notifyButton")
                  )}
                </button>
              </div>
              {errorMsg && (
                <p className="text-xs text-destructive">{errorMsg}</p>
              )}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6"
        ></motion.div>
      </div>
    </AuroraBackground>
  );
}
