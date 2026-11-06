"use client";

import clsx from "clsx";
import { ArrowRight, Check, CircleDollarSign, Clock, Lock, PartyPopper, Sparkles, Unlock } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { ProjectState } from "@/lib/api-types";
import { formatUSD } from "@/lib/domain/money";
import { JOURNEY_STEPS, journey } from "../journey";
import { PageHeader, useProjectState } from "../shell/ProjectShell";
import { CopyId, StatusBadge } from "../ui";
import { formatDate, formatDateTime } from "../useProject";

const ProjectGantt = dynamic(() => import("../gantt/ProjectGantt"), {
  ssr: false,
  loading: () => <SkeletonRows />,
});

export function SkeletonRows() {
  return (
    <div className="flex flex-col gap-2 p-3" aria-busy>
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="skeleton h-8" style={{ width: `${90 - (i % 3) * 15}%` }} />
      ))}
    </div>
  );
}

export function moneyTotals(state: ProjectState) {
  const live = state.invoices.filter((i) => i.status !== "DRAFT" && i.status !== "CANCELLED");
  const sum = (xs: { totalCents: number }[]) => xs.reduce((s, x) => s + x.totalCents, 0);
  const extras = live.filter((i) => i.kind === "change_order");
  const contract = state.milestones.reduce((s, m) => s + m.amountCents, 0) + sum(extras);
  const collected = sum(live.filter((i) => i.status === "PAID"));
  const awaiting = sum(live.filter((i) => i.status === "SENT"));
  const paidOut = state.payoutBatches
    .filter((b) => b.status === "SUCCESS")
    .reduce((s, b) => s + b.items.reduce((t, it) => t + it.amountCents, 0), 0);
  return { contract, collected, awaiting, extras: sum(extras), extrasCount: extras.length, paidOut };
}

export function OverviewPage() {
  const { state, base } = useProjectState();
  const t = moneyTotals(state);
  const locked = state.tasks.filter((x) => x.locked).length;
  const end = state.tasks.reduce((m, x) => {
    const d = new Date(`${x.startDate}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + x.durationDays);
    const iso = d.toISOString().slice(0, 10);
    return iso > m ? iso : m;
  }, "");

  return (
    <>
      <PageHeader eyebrow="Project overview" title={state.project.name}>
        You&apos;re the agency building {state.project.clientName}&apos;s online store. Here&apos;s the money, the plan, and what to do next.
      </PageHeader>

      <NextActionHero />

      {/* KPIs */}
      <section aria-label="Money at a glance" className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={<CircleDollarSign size={18} />} label="Project value" value={formatUSD(t.contract)} hint="Milestones + approved extras" />
        <Kpi icon={<Check size={18} />} tone="success" label="Collected" value={formatUSD(t.collected)} hint="Paid through PayPal" />
        <Kpi icon={<Clock size={18} />} tone="warning" label="Awaiting payment" value={formatUSD(t.awaiting)} hint="Invoices sent, not yet paid" />
        <Kpi
          icon={<Sparkles size={18} />}
          tone="brand"
          label="Extra work billed"
          value={formatUSD(t.extras)}
          hint={t.extrasCount ? `${t.extrasCount} change order${t.extrasCount === 1 ? "" : "s"} that would have been free` : "No change orders yet"}
        />
      </section>

      {/* Milestones */}
      <section aria-labelledby="ms-title" className="mt-8">
        <div className="mb-3 flex items-end justify-between">
          <h2 id="ms-title" className="t-title-md">
            Milestones
          </h2>
          <span className="t-body-sm text-ink-muted">Each phase starts only after the previous one is paid</span>
        </div>
        <ol className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {state.milestones.map((m) => {
            const tasks = state.tasks.filter((x) => x.milestoneId === m.id);
            const lockedHere = tasks.filter((x) => x.locked).length;
            return (
              <li key={m.id} className="panel !p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="t-label text-ink-muted">Milestone {m.seq}</div>
                    <div className="t-title-lg">{m.title}</div>
                  </div>
                  <StatusBadge value={m.status} />
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <span className="t-title-md tabular">{formatUSD(m.amountCents)}</span>
                  <span className="t-body-sm inline-flex items-center gap-1 text-ink-muted">
                    {lockedHere ? <Lock size={14} aria-hidden /> : <Unlock size={14} aria-hidden />}
                    {tasks.length} tasks{lockedHere ? ` · ${lockedHere} locked` : ""}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Timeline */}
      <section className="panel mt-8 flex flex-col" aria-labelledby="timeline-title">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="timeline-title" className="t-title-md">
              Project timeline
            </h2>
            <p className="t-body-sm text-ink-muted">
              {locked ? `${locked} task${locked === 1 ? " is" : "s are"} locked until their invoice is paid.` : "Every task is unlocked."} Launch:{" "}
              <span className="font-bold text-ink">{formatDate(end, { month: "short", day: "numeric", year: "numeric" })}</span>
            </p>
          </div>
          <Legend />
        </div>
        <div className="h-[460px] overflow-hidden rounded-sm border border-hairline">
          <ProjectGantt tasks={state.tasks} milestones={state.milestones} />
        </div>
      </section>

      {/* Team + activity */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[2fr_3fr]">
        <section className="panel" aria-labelledby="team-title">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="team-title" className="t-title-md">
              Your team
            </h2>
            <Link href={`${base}/team`} className="t-body-sm font-bold text-link hover:underline">
              Pay the team →
            </Link>
          </div>
          <ul className="flex flex-col gap-3">
            {state.contractors.map((c) => (
              <li key={c.id} className="flex items-center gap-3">
                <Avatar name={c.name} role={c.role} />
                <div className="min-w-0 flex-1">
                  <div className="font-bold">{c.name}</div>
                  <div className="t-body-sm text-ink-muted">{c.title}</div>
                </div>
                <span className="t-label rounded-full bg-surface-tint px-2.5 py-1 tabular">{c.splitBps / 100}% share</span>
              </li>
            ))}
          </ul>
          <div className="t-body-sm mt-4 flex items-center justify-between rounded-sm bg-surface-warm px-3 py-2">
            <span className="text-ink-muted">Paid out to the team so far</span>
            <span className="font-bold tabular">{formatUSD(t.paidOut)}</span>
          </div>
        </section>

        <section className="panel" aria-labelledby="act-title">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="act-title" className="t-title-md">
              Latest activity
            </h2>
            <Link href={`${base}/ledger`} className="t-body-sm font-bold text-link hover:underline">
              Money log →
            </Link>
          </div>
          <ol className="relative ml-1 border-l border-hairline">
            {state.events.slice(0, 6).map((e) => (
              <li key={e.id} className="relative pb-4 pl-5 last:pb-0">
                <span
                  className={clsx(
                    "absolute top-1.5 -left-1 h-2 w-2 rounded-full",
                    { info: "bg-info", success: "bg-success", warning: "bg-warning", danger: "bg-danger" }[e.level],
                  )}
                  aria-hidden
                />
                <div className="t-body-sm">{e.message}</div>
                <div className="t-body-sm flex flex-wrap items-center gap-x-2 text-ink-muted">
                  <time dateTime={e.createdAt}>{formatDateTime(e.createdAt)}</time>
                  {e.paypalRef && <CopyId value={e.paypalRef} max={20} />}
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>
  );
}

/** Big "what to do next" card with the 4-step journey. Shared by several pages. */
export function NextActionHero({ compact }: { compact?: boolean }) {
  const { state } = useProjectState();
  const j = journey(state);
  const celebrate = j.step === 3 && !j.batch;
  const done = j.step === 4;
  return (
    <section
      aria-label="Next step"
      className={clsx(
        "relative overflow-hidden rounded-lg text-white",
        celebrate || done ? "bg-[linear-gradient(135deg,#0b5d3b,#0e7a46)]" : "hero-bg",
        compact ? "p-5" : "p-6 sm:p-8",
      )}
    >
      <div className="grid-bg pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative">
        <ol className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {JOURNEY_STEPS.map((s, i) => {
            const isDone = i < j.step;
            const cur = i === j.step;
            return (
              <li
                key={s.title}
                aria-current={cur ? "step" : undefined}
                className={clsx(
                  "flex items-center gap-2.5 rounded-sm px-3 py-2",
                  cur ? "bg-white text-navy" : isDone ? "bg-white/15" : "bg-white/[0.06] text-white/60",
                )}
              >
                <span
                  className={clsx(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    isDone ? "bg-[#7ee2a8] text-navy" : cur ? "bg-navy text-white" : "bg-white/10",
                  )}
                  aria-hidden
                >
                  {isDone ? <Check size={14} strokeWidth={3} /> : i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold">{s.title}</span>
                  <span className={clsx("block truncate text-xs", cur ? "text-navy/60" : "text-white/60")}>{isDone ? "Done" : s.hint}</span>
                </span>
              </li>
            );
          })}
        </ol>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <div className="eyebrow mb-1 text-brand-accent">{done ? "All done" : "Next step"}</div>
            <h2 className={clsx("font-display font-black tracking-[-0.03em]", compact ? "text-2xl" : "text-3xl sm:text-4xl")}>
              {(celebrate || done) && <PartyPopper size={compact ? 24 : 32} className="mr-2 inline align-[-4px]" aria-hidden />}
              {j.next.title}
            </h2>
            <p className="t-body-lg mt-2 text-white/85">{j.next.body}</p>
          </div>
          <Link href={j.next.href} className="btn btn-lg bg-white text-navy hover:bg-brand-accent-soft">
            {j.next.cta} <ArrowRight size={18} aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Kpi({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  tone?: "success" | "warning" | "brand";
}) {
  return (
    <div className="kpi">
      <div className="flex items-center gap-2">
        <span
          className={clsx(
            "flex h-8 w-8 items-center justify-center rounded-full",
            tone === "success" ? "bg-success-soft text-success" : tone === "warning" ? "bg-warning-soft text-warning" : tone === "brand" ? "bg-brand-accent-soft text-brand" : "bg-surface-tint text-ink",
          )}
          aria-hidden
        >
          {icon}
        </span>
        <span className="t-label text-ink-muted">{label}</span>
      </div>
      <div className="t-title-lg mt-3">{value}</div>
      <div className="t-body-sm mt-0.5 text-ink-muted">{hint}</div>
    </div>
  );
}

const ROLE_BG: Record<string, string> = { design: "bg-role-design", dev: "bg-role-dev", qa: "bg-role-qa", pm: "bg-role-pm" };

export function Avatar({ name, role, size = 40 }: { name: string; role: string; size?: number }) {
  return (
    <span
      className={clsx("flex shrink-0 items-center justify-center rounded-full font-bold text-white", ROLE_BG[role] ?? "bg-ink")}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-hidden
    >
      {name
        .split(" ")
        .map((p) => p[0])
        .join("")}
    </span>
  );
}

export function Legend() {
  const items = [
    ["Design", "bg-role-design"],
    ["Dev", "bg-role-dev"],
    ["QA", "bg-role-qa"],
    ["PM", "bg-role-pm"],
  ];
  return (
    <span className="t-body-sm flex flex-wrap items-center gap-3 text-ink-muted">
      {items.map(([label, cls]) => (
        <span key={label} className="inline-flex items-center gap-1">
          <span className={clsx("h-2.5 w-2.5 rounded-[2px]", cls)} aria-hidden />
          {label}
        </span>
      ))}
      <span className="inline-flex items-center gap-1">
        <span className="h-2.5 w-2.5 rounded-[2px] border border-dashed border-locked bg-locked-soft" aria-hidden />
        Locked
      </span>
    </span>
  );
}
