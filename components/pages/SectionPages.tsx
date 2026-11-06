"use client";

import clsx from "clsx";
import { Sparkles } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AGENCY_NAME } from "@/lib/brand";
import { formatUSD } from "@/lib/domain/money";
import { InvoiceList } from "../invoices/InvoiceList";
import { PayoutPanel } from "../payouts/PayoutPanel";
import { PageHeader, useProjectState } from "../shell/ProjectShell";
import { Avatar, moneyTotals, SkeletonRows } from "./Overview";

const LedgerGrid = dynamic(() => import("../ledger/LedgerGrid"), {
  ssr: false,
  loading: () => <SkeletonRows />,
});

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: "success" | "warning" | "brand" }) {
  return (
    <div className="kpi !p-4">
      <div className="t-label text-ink-muted">{label}</div>
      <div
        className={clsx(
          "t-title-lg mt-1",
          tone === "success" && "text-success",
          tone === "warning" && "text-warning",
          tone === "brand" && "text-brand",
        )}
      >
        {value}
      </div>
    </div>
  );
}

/* ---------------- Invoices ---------------- */

export function InvoicesPage() {
  const { state, refresh, base } = useProjectState();
  const t = moneyTotals(state);
  const open = state.invoices.filter((i) => i.status === "SENT").length;
  return (
    <>
      <PageHeader
        eyebrow="Invoices"
        title="Every invoice, and who still owes you"
        actions={
          <Link href={`${base}/requests`} className="btn btn-primary">
            <Sparkles size={16} aria-hidden /> New change request
          </Link>
        }
      >
        Milestone and change-order invoices, all sent through PayPal Invoicing. Click <span className="font-bold text-ink">Pay as the client</span>{" "}
        to see exactly what {state.project.clientName} sees.
      </PageHeader>
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <MiniStat label="Awaiting payment" value={formatUSD(t.awaiting)} tone="warning" />
        <MiniStat label="Collected" value={formatUSD(t.collected)} tone="success" />
        <MiniStat label="Extra work billed" value={formatUSD(t.extras)} tone="brand" />
        <MiniStat label="Open invoices" value={String(open)} />
      </div>
      <InvoiceList state={state} onChanged={refresh} />
    </>
  );
}

/* ---------------- Team / payouts ---------------- */

const SPLIT_BG: Record<string, string> = { design: "bg-role-design", dev: "bg-role-dev", qa: "bg-role-qa", pm: "bg-role-pm" };

export function TeamPage() {
  const { state, refresh } = useProjectState();
  const margin = state.project.agencyMarginBps;
  const devs = state.contractors.filter((c) => c.role === "dev");
  return (
    <>
      <PageHeader eyebrow="Pay the team" title="Split every payment, automatically">
        When {state.project.clientName} pays, {AGENCY_NAME} keeps its {margin / 100}% margin and the rest goes to the contractors through PayPal
        Payouts, after six safety checks.
      </PageHeader>

      <section className="panel mb-6" aria-labelledby="split-title">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <h2 id="split-title" className="t-title-md">
            How each dollar is split
          </h2>
          <span className="t-body-sm text-ink-muted">Set per project · amounts add up to the cent</span>
        </div>
        <div className="flex h-12 overflow-hidden rounded-sm" role="img" aria-label="Payment split bar">
          {state.contractors.map((c) => {
            const pct = (c.splitBps * (10000 - margin)) / 1_000_000;
            return (
              <div
                key={c.id}
                className={clsx("flex items-center justify-center text-sm font-bold text-white", SPLIT_BG[c.role], c.role === "dev" && devs.indexOf(c) === 1 && "brightness-75")}
                style={{ width: `${pct}%` }}
                title={`${c.name} ${pct.toFixed(0)}%`}
              >
                {pct.toFixed(0)}%
              </div>
            );
          })}
          <div className="flex items-center justify-center bg-navy text-sm font-bold text-white" style={{ width: `${margin / 100}%` }}>
            {margin / 100}%
          </div>
        </div>
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {state.contractors.map((c) => (
            <li key={c.id} className="flex items-center gap-3 rounded-md bg-surface-warm p-3">
              <Avatar name={c.name} role={c.role} size={36} />
              <div className="min-w-0">
                <div className="truncate font-bold">{c.name}</div>
                <div className="t-body-sm truncate text-ink-muted">
                  {c.title} · {((c.splitBps * (10000 - margin)) / 1_000_000).toFixed(0)}%
                </div>
              </div>
            </li>
          ))}
          <li className="flex items-center gap-3 rounded-md bg-surface-warm p-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-bold text-white" aria-hidden>
              NS
            </span>
            <div className="min-w-0">
              <div className="truncate font-bold">{AGENCY_NAME}</div>
              <div className="t-body-sm text-ink-muted">Agency margin · {margin / 100}%</div>
            </div>
          </li>
        </ul>
      </section>

      <section className="panel" aria-labelledby="payout-title">
        <h2 id="payout-title" className="t-title-md mb-1">
          Send a payout
        </h2>
        <p className="t-body-sm mb-4 text-ink-muted">Pick a paid invoice. Every check must pass before the money can move.</p>
        <PayoutPanel state={state} onChanged={refresh} />
      </section>
    </>
  );
}

/* ---------------- Ledger ---------------- */

export function LedgerPage() {
  const { state } = useProjectState();
  const t = moneyTotals(state);
  return (
    <>
      <PageHeader eyebrow="Money log" title="Every dollar in and out">
        Invoices, payments and payouts in one place, each with its PayPal reference ID. Try the <span className="font-bold text-ink">Ask</span> box:
        “unpaid invoices over $1,000”.
      </PageHeader>
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <MiniStat label="Money in" value={formatUSD(t.collected)} tone="success" />
        <MiniStat label="Paid to team" value={formatUSD(t.paidOut)} />
        <MiniStat label="Still owed" value={formatUSD(t.awaiting)} tone="warning" />
        <MiniStat label="Entries" value={String(state.ledger.length)} />
      </div>
      <section className="panel" aria-label="Ledger">
        <LedgerGrid rows={state.ledger} />
      </section>
    </>
  );
}
