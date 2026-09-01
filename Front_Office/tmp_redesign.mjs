import fs from 'fs';

const filePath = 'Front/src/pages/pfe-book-page.tsx';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log('Before — line 911:', JSON.stringify(lines[910]));
console.log('Before — line 941:', JSON.stringify(lines[940]));
console.log('Before — line 942:', JSON.stringify(lines[941]));

const newBlock = [
  `          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-6 overflow-auto scrollbar-thin">`,
  `            {/* Decorative rocket silhouette */}`,
  `            <RocketIcon`,
  `              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-40 sm:size-52 text-[#7C3AED]/5"`,
  `              style={{ filter: "blur(1px)" }}`,
  `            />`,
  ``,
  `            <div className="my-auto flex w-full max-w-5xl flex-col items-center gap-8 sm:gap-10">`,
  `              {/* Two-column composition: quote | divider | contact */}`,
  `              <div className="grid w-full grid-cols-1 items-center gap-6 lg:grid-cols-[minmax(0,3fr)_1px_minmax(0,2fr)] lg:items-stretch lg:gap-x-8">`,
  `                {/* ── QUOTE CARD (left, ~60%) ── */}`,
  `                <div className="relative flex w-full items-center rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 sm:p-10 shadow-[0_0_60px_rgba(124,58,237,0.1)]">`,
  `                  {/* Speech-bubble notch on the right edge */}`,
  `                  <div aria-hidden className="absolute top-1/2 -right-[11px] hidden lg:block -translate-y-1/2 border-y-[10px] border-y-transparent border-l-[11px] border-l-white/10" />`,
  `                  <QuoteIcon className="absolute top-6 left-6 size-9 sm:top-10 sm:left-10 sm:size-14 text-[#C4B5FD]/20" />`,
  `                  <div className="pl-16 sm:pl-24">`,
  `                    <p className="text-2xl sm:text-3xl md:text-4xl font-light leading-tight text-white">`,
  `                      “If you’re offered a seat on a <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#C4B5FD] to-[#7C3AED]">rocket ship</span>, don’t ask what seat. Just get on.”`,
  `                    </p>`,
  `                    <p className="mt-4 text-xs font-semibold tracking-widest text-white/50 uppercase">— Sheryl Sandberg, Former COO of Facebook</p>`,
  `                  </div>`,
  `                </div>`,
  ``,
  `                {/* ── VERTICAL DIVIDER (desktop only) ── */}`,
  `                <div aria-hidden className="hidden lg:block h-full w-px bg-white/10" />`,
  ``,
  `                {/* ── CONTACT (right, ~35–40%) ── */}`,
  `                <div className="flex w-full flex-col items-center gap-4 lg:items-start lg:justify-center">`,
  `                  <div className="h-px w-full max-w-xs bg-white/10 lg:hidden" />`,
  `                  <p className="text-sm text-white/55">Ready to launch your career? Let's talk.</p>`,
  `                  <p className="flex items-center justify-center gap-2 text-xs text-white/35 lg:justify-start">`,
  `                    <MapPinIcon className="size-3 text-[#C4B5FD] shrink-0" />`,
  `                    87 rue de la république, Mégrine — 2033, Ben Arous, Tunisia`,
  `                  </p>`,
  `                  <div className="mt-1 flex flex-col items-center gap-3 lg:items-start lg:w-auto">`,
  `                    <a href="mailto:careers@asteroidea.co" className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-4 py-2 hover:bg-white/10 text-xs sm:text-sm text-white/75 transition-colors"><MailIcon className="size-4" /> careers@asteroidea.co</a>`,
  `                    <a href="https://asteroidea.co" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-4 py-2 hover:bg-white/10 text-xs sm:text-sm text-white/75 transition-colors"><GlobeIcon className="size-4" /> asteroidea.co</a>`,
  `                    <a href="https://www.linkedin.com/company/asteroidea-co" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-4 py-2 hover:bg-white/10 text-xs sm:text-sm text-white/75 transition-colors"><LinkedinIcon className="size-4" /> Asteroidea</a>`,
  `                  </div>`,
  `                </div>`,
  `              </div>`,
  ``,
  `              {/* ── NAVIGATION BUTTONS (below, compact) ── */}`,
  `              <div className="flex items-center justify-center gap-3">`,
  `                <Button variant="outline" size="sm" className="rounded-full border-white/20 bg-white/5 px-5 text-white hover:bg-white/10 hover:text-white" onClick={() => goTo(0)}>Back to cover</Button>`,
  `                <Button size="sm" className="rounded-full bg-[#7C3AED] px-5 text-white hover:bg-[#6D28D9]" onClick={() => goTo(4)}>Browse subjects</Button>`,
  `              </div>`,
  `            </div>`,
  `          </div>`,
];

// Replace indices 910..940 (1-indexed lines 911..941)
const result = [...lines.slice(0, 910), ...newBlock, ...lines.slice(941)];
fs.writeFileSync(filePath, result.join('\n'), 'utf8');
console.log('Replaced lines 911-941 with', newBlock.length, 'lines');