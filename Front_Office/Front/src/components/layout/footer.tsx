import { useTranslation } from "@/context/language-context"

interface ContactItemData {
  icon: string
  text?: string
  lines?: string[]
  href?: string
}

function ContactItem({ item }: { item: ContactItemData }) {
  const textContent = item.lines ? (
    <span className="min-w-0 text-sm text-foreground">
      {item.lines.map((line, i) => (
        <span key={i} className="block break-words">
          {line}
        </span>
      ))}
    </span>
  ) : (
    <span className="min-w-0 break-words text-sm text-foreground">{item.text}</span>
  )
  const content = (
    <>
      <img src={item.icon} alt="" className="size-4 shrink-0" />
      {textContent}
    </>
  )

  return (
    <li className="flex items-center gap-2.5">
      {item.href ? (
        <a
          href={item.href}
          target={item.href.startsWith("http") ? "_blank" : undefined}
          rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
          className="flex min-w-0 items-center gap-2.5 rounded-md transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#12B9DA]"
        >
          {content}
        </a>
      ) : (
        <span className="flex min-w-0 items-center gap-2.5">{content}</span>
      )}
    </li>
  )
}

function ContactSection({
  title,
  items,
  className = "",
}: {
  title: string
  items: ContactItemData[]
  className?: string
}) {
  return (
    <section aria-label={title} className={`min-w-0 ${className}`}>
      <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#12B9DA]">
        {title}
      </h4>
      <ul className="mt-3 flex flex-col gap-2.5">
        {items.map((item) => (
          <ContactItem key={`${title}-${item.text ?? item.lines?.join("|")}`} item={item} />
        ))}
      </ul>
    </section>
  )
}

function LegalRow() {
  const t = useTranslation()
  return (
    <div className="mt-6 flex flex-col items-center justify-between gap-2 border-t border-border/40 pt-4 sm:flex-row">
      <p className="text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Park &amp; Charge. {t("footer.rights")}
      </p>
      <nav aria-label="Legal" className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <span className="cursor-pointer text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#12B9DA]">
          {t("footer.privacy")}
        </span>
        <span aria-hidden="true" className="text-xs text-muted-foreground/50">
          |
        </span>
        <span className="cursor-pointer text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#12B9DA]">
          {t("footer.terms")}
        </span>
      </nav>
    </div>
  )
}

export function Footer() {
  const t = useTranslation()

  const infos: ContactItemData[] = [
    {
      icon: "/email.png",
      text: t("footer.email"),
      href: `mailto:${t("footer.email")}`,
    },
    {
      icon: "/phone.png",
      text: t("footer.phone"),
      href: "tel:+21626342040",
    },
  ]

  const social: ContactItemData[] = [
    {
      icon: "/linkedin.png",
      text: t("footer.linkedin"),
      href: "https://www.linkedin.com/company/park-and-charge-tn/",
    },
    {
      icon: "/WhiteBlueCircle.png",
      text: "Park&Charge.io",
      href: "https://parkandcharge.io/",
    },
  ]

  const address: ContactItemData[] = [
    {
      icon: "/adress.png",
      lines: [t("footer.location_line1"), t("footer.location_line2")],
    },
  ]

  return (
    <footer className="bg-transparent">
      <div className="w-full px-4 py-6 sm:px-8 lg:px-16 lg:py-8">
          <div className="flex flex-col gap-6 sm:grid sm:grid-cols-2 lg:flex lg:flex-row lg:items-start lg:justify-between lg:gap-8">
            <ContactSection title="INFOS" items={infos} />
            <ContactSection
              title="SOCIAL"
              items={social}
              className="lg:border-l lg:border-border/40 lg:pl-8"
            />
            <div className="min-w-0 sm:col-span-2 lg:col-span-1">
              <ContactSection
                title="ADDRESS"
                items={address}
                className="lg:border-l lg:border-border/40 lg:pl-8"
              />
            </div>
          </div>
        <LegalRow />
      </div>
    </footer>
  )
}
