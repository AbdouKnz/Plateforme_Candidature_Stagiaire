import { WhoAreWeContent } from "@/components/about/who-are-we"

/**
 * Standalone About / "Who are we?" page.
 * No global header or navigation — content only.
 * Desktop: fixed viewport height, no vertical scrolling.
 * Mobile: normal vertically scrollable layout.
 */
export function AboutPage() {
  return (
    <main className="relative min-h-svh w-full overflow-x-clip bg-[#FCFDFE] text-[#10204A] lg:flex lg:h-screen lg:min-h-0 lg:flex-col lg:overflow-hidden">
      {/* subtle pale-blue background decoration */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#F1F8FC] via-[#FCFDFE] to-[#F1F8FC]" />
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage: `radial-gradient(720px 420px at 12% 6%, rgba(16,169,232,0.10), transparent 65%), radial-gradient(860px 480px at 88% 30%, rgba(22,143,224,0.10), transparent 65%), radial-gradient(900px 520px at 50% 100%, rgba(16,169,232,0.08), transparent 65%)`,
          }}
        />
      </div>
      <div className="relative min-h-0 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
        <WhoAreWeContent />
      </div>
    </main>
  )
}
