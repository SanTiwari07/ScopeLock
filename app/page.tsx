import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Bot,
  Calculator,
  Check,
  CircleDollarSign,
  Clock,
  Code2,
  FileText,
  Lock,
  MessageSquareText,
  ShieldCheck,
  Unlock,
  UserCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Wordmark } from "@/components/ui";
import { AGENCY_NAME, DEMO_PROJECT_PATH } from "@/lib/brand";

const STEPS = [
  {
    Icon: MessageSquareText,
    title: "Paste the client's message",
    body: `"Love it! Can we also add a gift-card page?" Gemini turns the message into a list of work items and shows the words each one came from.`,
    api: "Gemini 2.5 Flash",
  },
  {
    Icon: FileText,
    title: "Send a priced PayPal invoice",
    body: "Hours × your rate card, computed by code. Review, edit, and send a real PayPal invoice in one click. The new tasks go on the timeline, locked.",
    api: "PayPal Invoicing v2",
  },
  {
    Icon: Unlock,
    title: "Client pays, work unlocks",
    body: "The client pays with PayPal or a card. The moment the payment is captured, the locked tasks open up. No chasing, no awkward emails.",
    api: "Orders v2 + JS SDK v6",
  },
  {
    Icon: Users,
    title: "The team gets their share",
    body: "Six safety checks, then one click splits the payment to every contractor. Your agency margin stays put, to the cent.",
    api: "PayPal Payouts v1",
  },
];

const PAINS = [
  { Icon: MessageSquareText, title: "Requests hide in chat", body: `Extra work arrives as a friendly "one more thing" in email or Slack, never as a purchase order.` },
  { Icon: Clock, title: "Pricing takes too long", body: "Scoping and quoting each small ask is a chore, so agencies quietly do it for free." },
  { Icon: Lock, title: "Work starts before money", body: "The team builds first and invoices later, and then waits weeks to get paid." },
  { Icon: Banknote, title: "Splitting pay is manual", body: "Every payment means a spreadsheet and a round of transfers to each freelancer." },
];

const GUARDS = [
  { Icon: Bot, title: "Gemini reads the message", body: "It lists the work items and quotes the client's words. Any item it can't quote is dropped." },
  { Icon: Calculator, title: "Code sets every price", body: "Every dollar comes from your rate card in integer cents. The model never sets an amount." },
  { Icon: UserCheck, title: "You approve each step", body: "Nothing goes to the client, and no money moves, until a human clicks the button." },
  { Icon: ShieldCheck, title: "Duplicates are blocked", body: "Idempotency keys on every call. Duplicate payments and duplicate payouts are blocked." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-canvas">
      {/* ---------- Hero ---------- */}
      <div className="hero-bg relative overflow-hidden text-white">
        <div className="grid-bg pointer-events-none absolute inset-0" aria-hidden />
        <header className="relative mx-auto flex h-20 max-w-[1200px] items-center justify-between px-4 sm:px-8">
          <Wordmark inverse />
          <nav aria-label="Main" className="hidden items-center gap-8 text-sm font-semibold text-white/80 md:flex">
            <a href="#how" className="hover:text-white">
              How it works
            </a>
            <a href="#why" className="hover:text-white">
              Why it matters
            </a>
            <a href="#trust" className="hover:text-white">
              Where AI is used
            </a>
          </nav>
          <Link href={DEMO_PROJECT_PATH} className="btn btn-sm bg-white text-navy hover:bg-brand-accent-soft">
            Open the demo <ArrowRight size={14} aria-hidden />
          </Link>
        </header>

        <section className="relative mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-12 px-4 pt-10 pb-24 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:pt-16">
          <div>
            <span className="t-label inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-brand-accent ring-1 ring-white/15">
              For agencies and freelancers
            </span>
            <h1 className="mt-6 font-display text-5xl leading-[1.02] font-black tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              Get paid for every <span className="text-brand-accent">&quot;can you also add...&quot;</span>
            </h1>
            <p className="t-body-lg mt-6 max-w-xl text-white/85 sm:text-xl">
              ScopeLock turns a client&apos;s change request into a priced PayPal invoice in seconds, locks the extra work until it&apos;s paid, then
              splits the money to your team automatically.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href={DEMO_PROJECT_PATH} className="btn btn-lg bg-white text-navy hover:bg-brand-accent-soft">
                Try the live demo <ArrowRight size={18} aria-hidden />
              </Link>
              <a href="#how" className="btn btn-lg bg-white/10 text-white ring-1 ring-white/25 hover:bg-white/20">
                See how it works
              </a>
            </div>
            <p className="t-body-sm mt-5 flex flex-wrap gap-x-5 gap-y-1 text-white/60">
              <span className="inline-flex items-center gap-1.5">
                <Check size={14} aria-hidden /> No sign-up
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check size={14} aria-hidden /> PayPal sandbox, no real money
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check size={14} aria-hidden /> 3-minute walkthrough
              </span>
            </p>
          </div>

          <HeroMock />
        </section>
      </div>

      {/* ---------- Problem ---------- */}
      <section id="why" className="mx-auto max-w-[1200px] scroll-mt-8 px-4 py-24 sm:px-8">
        <div className="max-w-2xl">
          <div className="eyebrow text-brand">The problem</div>
          <h2 className="t-display-lg mt-2">Scope creep is work you never get paid for</h2>
          <p className="t-body-lg mt-4 text-ink-muted">
            Small agencies and freelancers live on fixed-price projects. Every &quot;quick extra&quot; eats into the margin, and nobody has time to turn a
            chat message into a quote, an invoice and four payouts.
          </p>
        </div>
        <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PAINS.map((p) => (
            <li key={p.title} className="rounded-lg bg-surface-warm p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-canvas text-danger shadow-raised" aria-hidden>
                <p.Icon size={20} />
              </span>
              <h3 className="t-title-md mt-4">{p.title}</h3>
              <p className="t-body-sm mt-1 text-ink-muted">{p.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- How it works ---------- */}
      <section id="how" className="scroll-mt-8 bg-surface-warm py-24">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="eyebrow text-brand">How it works</div>
            <h2 className="t-display-lg mt-2">From chat message to paid team in four steps</h2>
            <p className="t-body-lg mt-4 text-ink-muted">Each step is a real PayPal API call. The demo runs the whole loop end to end.</p>
          </div>
          <ol className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="card-hover relative flex flex-col rounded-lg border border-hairline bg-canvas p-6">
                <span className="font-display text-6xl font-black text-surface-sunken" aria-hidden>
                  0{i + 1}
                </span>
                <span className="mt-2 flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white" aria-hidden>
                  <s.Icon size={20} />
                </span>
                <h3 className="t-title-md mt-4">{s.title}</h3>
                <p className="t-body-sm mt-2 flex-1 text-ink-muted">{s.body}</p>
                <span className="t-label mt-5 inline-flex self-start rounded-full bg-brand-accent-soft px-2.5 py-1 text-brand">{s.api}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- Two views ---------- */}
      <section className="mx-auto max-w-[1200px] px-4 py-24 sm:px-8">
        <div className="max-w-2xl">
          <div className="eyebrow text-brand">In the demo</div>
          <h2 className="t-display-lg mt-2">Play both sides of the deal</h2>
          <p className="t-body-lg mt-4 text-ink-muted">
            You start as {AGENCY_NAME}, a small studio building an online store for Acme Bakery. Halfway through, you switch seats and pay the
            invoice as the client.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg bg-navy p-8 text-white">
            <span className="t-label rounded-full bg-white/10 px-2.5 py-1 text-brand-accent">Agency view</span>
            <h3 className="t-headline mt-4">{AGENCY_NAME}</h3>
            <ul className="t-body-lg mt-4 flex flex-col gap-2 text-white/85">
              {["Price change requests with AI", "Track invoices and locked work", "Pay contractors with one click", "See every dollar in the money log"].map((x) => (
                <li key={x} className="flex gap-2">
                  <Check size={20} className="mt-0.5 shrink-0 text-brand-accent" aria-hidden /> {x}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg bg-[#ffcf70] p-8 text-navy">
            <span className="t-label rounded-full bg-navy px-2.5 py-1 text-white">Client view</span>
            <h3 className="t-headline mt-4">Acme Bakery</h3>
            <ul className="t-body-lg mt-4 flex flex-col gap-2">
              {["Gets a clear, itemized invoice", "Sees why each item costs what it does", "Pays with PayPal or a card", "Watches the work unlock right away"].map((x) => (
                <li key={x} className="flex gap-2">
                  <Check size={20} className="mt-0.5 shrink-0" aria-hidden /> {x}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------- Trust ---------- */}
      <section id="trust" className="scroll-mt-8 bg-navy py-24 text-white">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
          <div className="max-w-2xl">
            <div className="eyebrow text-brand-accent">Where AI is used</div>
            <h2 className="t-display-lg mt-2">The AI never touches the money</h2>
            <p className="t-body-lg mt-4 text-white/75">
              Gemini only reads the client&apos;s message. Prices, invoices, payments and payouts are handled by plain code, and each one waits
              for your click.
            </p>
          </div>
          <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {GUARDS.map((g) => (
              <li key={g.title} className="rounded-lg bg-white/[0.06] p-6 ring-1 ring-white/10">
                <g.Icon size={24} className="text-brand-accent" aria-hidden />
                <h3 className="t-title-md mt-4">{g.title}</h3>
                <p className="t-body-sm mt-1 text-white/70">{g.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="mx-auto max-w-[1200px] px-4 py-24 sm:px-8">
        <div className="hero-bg relative overflow-hidden rounded-lg px-6 py-16 text-center text-white sm:px-12">
          <div className="grid-bg pointer-events-none absolute inset-0" aria-hidden />
          <div className="relative">
            <h2 className="t-display-lg">See the whole loop in 3 minutes</h2>
            <p className="t-body-lg mx-auto mt-4 max-w-xl text-white/85">
              Price a request, pay it as the client, watch the work unlock and pay the team. A guide on every screen tells you what to do next.
            </p>
            <Link href={DEMO_PROJECT_PATH} className="btn btn-lg mt-8 bg-white text-navy hover:bg-brand-accent-soft">
              Start the demo <ArrowRight size={18} aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-hairline">
        <div className="t-body-sm mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-4 py-8 text-ink-muted sm:px-8">
          <Wordmark />
          <span>Built for the Build What&apos;s Next with PayPal and AI hackathon. Sandbox only, all data is fake. MIT licensed.</span>
        </div>
      </footer>
    </div>
  );
}

/** Product collage: the request, the priced invoice and the unlocked work. */
function HeroMock() {
  return (
    <div className="relative mx-auto w-full max-w-[520px]" aria-hidden>
      {/* Client message */}
      <div className="float-a relative z-10 ml-auto w-[88%] rounded-lg bg-white p-5 text-ink shadow-overlay">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ffcf70] text-sm font-black text-navy">AB</span>
          <div className="t-body-sm">
            <div className="font-bold">Acme Bakery</div>
            <div className="text-ink-muted">just now</div>
          </div>
        </div>
        <p className="mt-3">
          Love it! Can we also <mark className="quote">add a gift-card page</mark> and <mark className="quote">make the menu filterable by allergens</mark>?
        </p>
      </div>

      {/* Priced invoice */}
      <div className="float-b relative z-20 -mt-4 w-[92%] rounded-lg bg-white p-5 text-ink shadow-overlay">
        <div className="mb-3 flex items-center justify-between">
          <span className="t-label inline-flex items-center gap-1 rounded-full bg-brand-accent px-2.5 py-1 text-brand">
            3 work items found
          </span>
          <span className="t-label inline-flex items-center gap-1 rounded-full bg-warning-soft px-2.5 py-1 text-warning">
            <Clock size={12} /> Awaiting payment
          </span>
        </div>
        <ul className="t-body-sm flex flex-col gap-1.5">
          {[
            ["Gift-card page", "10 h × $95", "$950.00"],
            ["Allergen filter", "6 h × $95", "$570.00"],
            ["QA for new features", "3 h × $60", "$180.00"],
          ].map(([t, h, a]) => (
            <li key={t} className="flex items-center justify-between gap-2">
              <span>
                <span className="font-bold">{t}</span> <span className="text-ink-muted">{h}</span>
              </span>
              <span className="font-bold tabular">{a}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-end justify-between border-t border-hairline pt-3">
          <span className="t-label inline-flex items-center gap-1 text-ink-muted">
            <CircleDollarSign size={14} /> PayPal invoice
          </span>
          <span className="font-display text-3xl font-black tracking-[-0.03em]">$1,700.00</span>
        </div>
      </div>

      {/* Unlocked + payout */}
      <div className="float-c relative z-30 -mt-4 ml-auto flex w-[80%] flex-col gap-2 rounded-lg bg-white p-4 text-ink shadow-overlay">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-success text-white">
            <BadgeCheck size={16} />
          </span>
          <span className="font-bold">Paid · 3 tasks unlocked</span>
        </div>
        <div className="flex h-2.5 overflow-hidden rounded-full">
          <span className="w-[24%] bg-role-design" />
          <span className="w-[28%] bg-role-dev" />
          <span className="w-[28%] bg-[#0047ab]" />
          <span className="w-[20%] bg-navy" />
        </div>
        <span className="t-body-sm inline-flex items-center gap-1 text-ink-muted">
          <Code2 size={14} /> Split to 3 contractors via PayPal Payouts
        </span>
      </div>
    </div>
  );
}
