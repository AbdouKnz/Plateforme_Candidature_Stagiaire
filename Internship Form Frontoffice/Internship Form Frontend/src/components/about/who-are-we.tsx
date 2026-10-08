import {
  BuildingIcon,
  RocketIcon,
  HeartHandshakeIcon,
  LightbulbIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react"

const VALUES = [
  {
    title: "Innovation",
    desc: (
      <>
        We constantly explore{" "}
        <strong className="font-semibold text-[#10204A]">
          new technologies and ideas
        </strong>{" "}
        to create{" "}
        <strong className="font-semibold text-[#10204A]">
          smarter, more efficient solutions
        </strong>{" "}
        for the future of urban mobility.
      </>
    ),
    icon: LightbulbIcon,
  },
  {
    title: "Integrity",
    desc: (
      <>
        We build trust through{" "}
        <strong className="font-semibold text-[#10204A]">
          transparency, responsibility, and commitment
        </strong>{" "}
        to delivering{" "}
        <strong className="font-semibold text-[#10204A]">
          high-quality solutions
        </strong>{" "}
        to our clients and partners.
      </>
    ),
    icon: ShieldCheckIcon,
  },
  {
    title: "Teamwork",
    desc: (
      <>
        We believe great solutions are{" "}
        <strong className="font-semibold text-[#10204A]">built together</strong>.
        We foster{" "}
        <strong className="font-semibold text-[#10204A]">
          collaboration, knowledge sharing, and mutual support
        </strong>{" "}
        to achieve ambitious goals.
      </>
    ),
    icon: UsersIcon,
  },
]

const PARTNERS = [
  { name: "Tesla", icon: "/Tesla.png", imgClass: "h-10 w-auto max-w-[100px] lg:h-[46px]" },
  { name: "EPA", icon: "/EPA.png", imgClass: "h-8 w-auto max-w-[150px] lg:h-[40px]" },
  { name: "ADR", icon: "/ADR.png", imgClass: "h-8 w-auto max-w-[150px] lg:h-[36px]" },
  {
    name: "StartupAct",
    icon: "/StartupAct.png",
    imgClass: "h-6 w-auto max-w-[150px] lg:h-[30px]",
  },
  {
    name: "Nvidia",
    icon: "/Nvidia.png",
    imgClass: "h-8 w-auto max-w-[140px] lg:h-[38px]",
  },
  {
    name: "BPA",
    icon: "/BPA.png",
    imgClass: "h-10 w-auto max-w-[160px] lg:h-[50px]",
  },
  {
    name: "Terna",
    icon: "/Terna.png",
    imgClass: "h-8 w-auto max-w-[150px] lg:h-[36px]",
  },
  {
    name: "EIT",
    icon: "/EIT.png",
    imgClass: "h-10 w-auto max-w-[150px] lg:h-[48px]",
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
          ? "flex min-h-full w-full flex-col px-4 pt-4 pb-2 sm:px-8 lg:h-full lg:px-12"
          : "flex w-full flex-col px-6 pt-4 pb-2 sm:px-10 lg:h-full lg:px-12"
      }
    >
      {/* ── HERO (40/60) ── */}
      <section
        aria-labelledby="who-are-we-heading"
        className={
          compact
            ? "grid flex-none grid-cols-1 items-center gap-4 sm:gap-6 lg:grid-cols-[38%_1fr] lg:gap-5"
            : "grid flex-none grid-cols-1 items-center gap-4 sm:gap-6 lg:grid-cols-[38%_1fr] lg:gap-4"
        }
      >
        <div className="min-w-0 lg:self-center">
          <span className="inline-flex items-center rounded-full bg-[#10A9E8] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white">
            Park & Charge
          </span>
          <h1
            id="who-are-we-heading"
            className={
              compact
                ? "mt-3 text-3xl font-bold leading-[1.0] tracking-tight text-[#10204A] sm:text-5xl lg:text-[68px]"
                : "mt-4 text-[34px] font-bold leading-[1.0] tracking-tight text-[#10204A] min-[420px]:text-[42px] sm:text-[56px] lg:text-[76px]"
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
            A passionate team of technology and mobility experts building innovative digital solutions for a smarter, more connected urban future, with 50+ projects delivered across 19 countries.
          </p>
        </div>
        <div className="min-w-0">
          <img
            src="/EV_Charging.png"
            alt="Electric car charging at a smart-city charging station at dusk"
            loading="eager"
            className={
              compact
                ? "h-48 w-full rounded-[20px] border border-[#D7E6F2] object-cover object-[50%_70%] sm:h-72 lg:h-[320px] " + CARD_SHADOW
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
          ? "mt-3 grid flex-none grid-cols-1 gap-3 sm:mt-4 sm:gap-4 lg:grid-cols-[38%_1fr] lg:gap-5"
          : "mt-4 grid flex-none grid-cols-1 gap-5 lg:mt-3 lg:grid-cols-[38%_1fr] lg:gap-4"
        }
      >
        {/* Company overview */}
        <article
          className={
            compact
              ? `min-w-0 rounded-[18px] border border-[#D7E6F2] bg-[#F1F8FC] p-4 sm:p-5 ${CARD_SHADOW}`
              : `min-w-0 rounded-[18px] border border-[#D7E6F2] bg-[#F1F8FC] p-4 lg:p-4 ${CARD_SHADOW}`
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
                ? "mt-3 space-y-2.5 text-[15.5px] sm:text-[17.5px] leading-[1.4] text-[#64748B]"
                : "mt-3 space-y-3 text-[15px] leading-[1.4] text-[#64748B]"
            }
          >
            <p>
              <strong className="font-semibold text-[#10204A]">Park & Charge</strong>{" "}
              is a{" "}
              <strong className="font-semibold text-[#10204A]">
                global technology company
              </strong>{" "}
              developing{" "}
              <strong className="font-semibold text-[#10204A]">
                smart digital solutions
              </strong>{" "}
              for urban mobility, EV charging, and parking.
            </p>
            <p>
              We help{" "}
              <strong className="font-semibold text-[#10204A]">
                cities, governments, parking operators, and private companies
              </strong>{" "}
              make urban mobility{" "}
                <strong className="font-semibold text-[#10204A]">
                  smoother, more efficient, connected, and future-ready
                </strong>
              .
            </p>
            <p>
              By{" "}
              <strong className="font-semibold text-[#10204A]">
                digitizing parking operations, connecting EV charging infrastructure,
                and leveraging AI and data
              </strong>
              , we design innovative solutions that optimize operations, improve user
              experiences, and contribute to a{" "}
              <strong className="font-semibold text-[#10204A]">
                smarter and more sustainable future
              </strong>{" "}
              for urban mobility.
            </p>
          </div>
        </article>

        {/* Right column */}
        <div className="flex min-w-0 min-h-0 flex-col gap-4">
          {/* Our Mission */}
          <article
            className={
              compact
                ? `min-w-0 flex-none rounded-[18px] border border-[#D7E6F2] bg-white p-3.5 sm:p-4 ${CARD_SHADOW}`
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
                  To{" "}
                  <strong className="font-semibold text-[#10204A]">
                    build intelligent digital solutions
                  </strong>{" "}
                  that make urban mobility{" "}
                  <strong className="font-semibold text-[#10204A]">
                    smarter, more connected, efficient, and sustainable
                  </strong>
                  .
                </p>
              </div>
            </div>
          </article>

          {/* What we stand for */}
          <article
            className={
              compact
                ? `flex min-h-0 min-w-0 flex-col rounded-[18px] border border-[#D7E6F2] bg-white p-3.5 sm:p-4 ${CARD_SHADOW}`
                : `flex min-h-0 min-w-0 flex-col rounded-[18px] border border-[#D7E6F2] bg-white p-4 ${CARD_SHADOW}`
            }
          >
            <div className="flex items-center gap-3">
              <IconBadge className={compact ? "size-9" : "size-[38px]"} iconClassName={compact ? "size-4" : "size-4"}>
                <HeartHandshakeIcon strokeWidth={1.8} className="size-full" />
              </IconBadge>
              <h2 className="text-[22px] font-bold tracking-tight text-[#0B1B45]">
                Core Values
              </h2>
            </div>
            <Underline />
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
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
        className={compact ? "mt-8 flex-none lg:mt-auto lg:pt-4" : "mt-7 flex-none lg:mt-auto lg:pt-4"}
      >
        <div
          className={`flex flex-col gap-2 rounded-[20px] border border-[#D7E6F2] bg-[#F1F8FC] px-4 py-2 sm:px-5 ${CARD_SHADOW} lg:flex-row lg:items-center lg:gap-8 lg:px-6`}
        >
          <div className="min-w-0 shrink-0">
            <h2 className="whitespace-nowrap text-xl font-bold tracking-tight text-[#0B1B45] lg:text-2xl">
              Strategic Partners
            </h2>
            <Underline className="mt-1.5 w-10" />
          </div>
          <ul className="flex min-w-0 flex-1 list-none flex-nowrap snap-x items-center gap-1 overflow-x-auto scrollbar-thin p-0 pb-1 sm:gap-2 lg:gap-2">
            {PARTNERS.map((p) => (
              <li
                key={p.name}
                className="flex h-10 min-w-[128px] flex-1 basis-0 snap-start items-center justify-center px-1 sm:h-11 lg:h-[58px] lg:min-w-0"
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
