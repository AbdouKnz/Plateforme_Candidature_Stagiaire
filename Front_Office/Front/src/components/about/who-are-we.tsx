import {
  BuildingIcon,
  RocketIcon,
  HeartHandshakeIcon,
  LayersIcon,
  UsersIcon,
  GlobeIcon,
} from "lucide-react"

const VALUES = [
  {
    title: "Interoperability",
    desc: "Open standards (OCPP), cross-CPO wallets, and white-label front-ends.",
    icon: LayersIcon,
  },
  {
    title: "Operator first",
    desc: "We build for the people who actually run charging networks every day.",
    icon: UsersIcon,
  },
  {
    title: "Global from Tunisia",
    desc: "International ambition, North African roots, Maltese subsidiary.",
    icon: GlobeIcon,
  },
]

const PARTNERS = [
  { name: "Tesla", icon: "/Tesla.png", imgClass: "h-11 w-auto max-w-[150px] lg:h-[52px]" },
  { name: "EPA", icon: "/EPA.png", imgClass: "h-11 w-auto max-w-[150px] lg:h-[52px]" },
  { name: "ADR", icon: "/ADR.png", imgClass: "h-10 w-auto max-w-[170px] lg:h-[46px]" },
  {
    name: "StartupAct",
    icon: "/StartupAct.png",
    imgClass: "h-8 w-auto max-w-[170px] lg:h-[38px]",
  },
  {
    name: "GrupOrtiz",
    icon: "/GrupOrtiz.png",
    imgClass: "h-9 w-auto max-w-[170px] lg:h-[40px]",
  },
]

const CARD_SHADOW = "shadow-[0_8px_24px_rgba(16,32,74,0.05)]"

function IconBadge({
  children,
  className = "size-[42px]",
  iconClassName = "size-5",
}: {
  children: React.ReactNode
  className?: string
  iconClassName?: string
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-[#10A9E8] text-white ${CARD_SHADOW} ${className}`}
    >
      <span className={`flex items-center justify-center ${iconClassName}`}>{children}</span>
    </div>
  )
}

function Underline({ className = "mt-2 w-12" }: { className?: string }) {
  return <div aria-hidden className={`h-[3px] rounded-full bg-[#10A9E8] ${className}`} />
}

export function WhoAreWeContent({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={
        compact
          ? "flex min-h-full w-full flex-col px-6 py-5 sm:px-8 lg:my-auto lg:px-12"
          : "flex w-full flex-col px-6 py-4 sm:px-10 lg:my-auto lg:px-12"
      }
    >
      {/* ── HERO (40/60) ── */}
      <section
        aria-labelledby="who-are-we-heading"
        className="grid flex-none grid-cols-1 items-center gap-6 lg:grid-cols-[40%_1fr] lg:gap-10"
      >
        <div className="min-w-0 lg:self-center">
          <span className="inline-flex items-center rounded-full bg-[#10A9E8] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white">
            Park & Charge
          </span>
          <h1
            id="who-are-we-heading"
            className={
              compact
                ? "mt-3 text-4xl font-bold leading-[1.0] tracking-tight text-[#10204A] sm:text-5xl lg:text-[68px]"
                : "mt-4 text-[42px] font-bold leading-[1.0] tracking-tight text-[#10204A] sm:text-[56px] lg:text-[76px]"
            }
          >
            Who <span className="text-[#10A9E8]">are</span> we?
          </h1>
          <p
            className={
              compact
                ? "mt-2.5 max-w-lg text-[15.5px] leading-[1.4] text-[#64748B] lg:text-lg"
                : "mt-3 max-w-lg text-[15px] leading-[1.4] text-[#64748B] lg:text-[18px]"
            }
          >
            We connect parking and charging, creating a seamless experience for
            drivers, operators and cities.
          </p>
        </div>
        <div className="min-w-0">
          <img
            src="/EV_Charging.png"
            alt="Electric car charging at a smart-city charging station at dusk"
            loading="eager"
            className={
              compact
                ? "h-64 w-full rounded-[20px] border border-[#D7E6F2] object-cover object-[50%_70%] sm:h-72 lg:h-[320px] " + CARD_SHADOW
                : "h-[240px] w-full rounded-[20px] border border-[#D7E6F2] object-cover object-[50%_70%] sm:h-[260px] lg:h-[395px] " + CARD_SHADOW
            }
          />
        </div>
      </section>

      {/* ── MAIN GRID (38/62) ── */}
      <section
        aria-label="About Park and Charge"
        className={
        compact
          ? "mt-4 grid flex-none grid-cols-1 gap-3 lg:grid-cols-[38%_1fr] lg:gap-5"
          : "mt-4 grid flex-none grid-cols-1 gap-4 lg:mt-4 lg:grid-cols-[38%_1fr] lg:gap-4"
        }
      >
        {/* Company overview */}
        <article
          className={
            compact
              ? `min-w-0 rounded-[18px] border border-[#D7E6F2] bg-[#F1F8FC] p-5 ${CARD_SHADOW}`
              : `min-w-0 rounded-[18px] border border-[#D7E6F2] bg-[#F1F8FC] p-4 lg:p-[18px] ${CARD_SHADOW}`
          }
        >
          <div className="flex items-center gap-3">
            <IconBadge className={compact ? "size-10" : "size-[42px]"} iconClassName={compact ? "size-4" : "size-5"}>
              <BuildingIcon strokeWidth={1.8} className="size-full" />
            </IconBadge>
            <h2 className="text-2xl font-bold tracking-tight text-[#0B1B45]">
              Company overview
            </h2>
          </div>
          <Underline />
          <div
            className={
              compact
                ? "mt-3 space-y-2.5 text-[17.5px] leading-[1.4] text-[#64748B]"
                : "mt-3 space-y-3 text-[15px] leading-[1.4] text-[#64748B]"
            }
          >
            <p>
              <strong className="font-semibold text-[#10204A]">Park & Charge</strong>{" "}
              was founded in Tunisia and is officially labelled under the Tunisia
              Startup Act.
            </p>
            <p>
              With a daughter company in{" "}
              <strong className="font-semibold text-[#10204A]">Malta</strong>, we
              now serve operators from{" "}
              <strong className="font-semibold text-[#10204A]">
                Rome to Madrid and Berlin
              </strong>
              .
            </p>
            <p>Connecting parking and charging into one seamless experience.</p>
          </div>
        </article>

        {/* Right column */}
        <div className="flex min-w-0 min-h-0 flex-col gap-3">
          {/* Our Mission */}
          <article
            className={
              compact
                ? `min-w-0 flex-none rounded-[18px] border border-[#D7E6F2] bg-white p-4 ${CARD_SHADOW}`
                : `min-w-0 flex-none rounded-[18px] border border-[#D7E6F2] bg-white p-3.5 ${CARD_SHADOW}`
            }
          >
            <div className="flex items-center gap-3.5">
              <IconBadge className="size-[38px]" iconClassName="size-4">
                <RocketIcon strokeWidth={1.8} className="size-full" />
              </IconBadge>
              <div className="min-w-0 flex-1">
                <h2 className="text-[22px] font-bold tracking-tight text-[#0B1B45]">
                  Our Mission
                </h2>
                <Underline className="mt-1.5 w-12" />
                <p className="mt-1.5 text-[15.5px] leading-snug text-[#64748B] lg:text-base">
                  Make{" "}
                  <strong className="font-semibold text-[#10204A]">
                    EV charging management
                  </strong>{" "}
                  seamless, from the charger to the parking spot.
                </p>
              </div>
            </div>
          </article>

          {/* What we stand for */}
          <article
            className={
              compact
                ? `flex min-h-0 min-w-0 flex-col rounded-[18px] border border-[#D7E6F2] bg-white p-4 ${CARD_SHADOW}`
                : `flex min-h-0 min-w-0 flex-col rounded-[18px] border border-[#D7E6F2] bg-white p-4 ${CARD_SHADOW}`
            }
          >
            <div className="flex items-center gap-3">
              <IconBadge className={compact ? "size-9" : "size-[38px]"} iconClassName={compact ? "size-4" : "size-4"}>
                <HeartHandshakeIcon strokeWidth={1.8} className="size-full" />
              </IconBadge>
              <h2 className="text-[22px] font-bold tracking-tight text-[#0B1B45]">
                What we stand for
              </h2>
            </div>
            <Underline />
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {VALUES.map((v) => (
                <div
                  key={v.title}
                  className={
                    compact
                      ? "flex h-full min-h-0 flex-col rounded-[14px] border border-[#D7E6F2] bg-[#F1F8FC] p-3"
                      : "flex h-full flex-col rounded-[14px] border border-[#D7E6F2] bg-[#F1F8FC] p-3"
                  }
                >
                  <div className="flex size-8 items-center justify-center rounded-lg bg-[#10A9E8]/10 text-[#168FE0]">
                    <v.icon className="size-4" strokeWidth={1.8} />
                  </div>
                  <h3 className="mt-2 text-lg font-bold tracking-tight text-[#0B1B45]">
                    {v.title}
                  </h3>
                  <p className="mt-1 text-[15.5px] leading-[1.4] text-[#64748B]">
                    {v.desc}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      {/* ── TRUST STRIP ── */}
      <section
        aria-label="Trusted partners"
        className={compact ? "mt-4 flex-none" : "mt-3 flex-none"}
      >
        <div
          className={`flex flex-col gap-2 rounded-[20px] border border-[#D7E6F2] bg-[#F1F8FC] px-5 py-3 ${CARD_SHADOW} lg:flex-row lg:items-center lg:gap-8 lg:px-6`}
        >
          <div className="min-w-0 shrink-0">
            <h2 className="whitespace-nowrap text-xl font-bold tracking-tight text-[#0B1B45] lg:text-2xl">
              Trusted across Europe and beyond
            </h2>
            <Underline className="mt-1.5 w-10" />
          </div>
          <ul className="grid flex-1 list-none grid-cols-2 items-center gap-3 p-0 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
            {PARTNERS.map((p, i) => (
              <li
                key={p.name}
                className={`flex h-12 min-w-0 items-center justify-center px-2 lg:h-[54px] ${
                  i > 0 ? "sm:border-l sm:border-[#D7E6F2]" : ""
                }`}
              >
                <img
                  src={p.icon}
                  alt={p.name}
                  loading="lazy"
                  className={`max-w-full object-contain ${p.imgClass}`}
                />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
