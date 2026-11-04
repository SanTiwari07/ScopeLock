"use client";

import clsx from "clsx";
import { ArrowRight, Check, ExternalLink, PartyPopper } from "lucide-react";
import type { ProjectState } from "@/lib/api-types";
import { formatUSD } from "@/lib/domain/money";
import { Button } from "./ui";

export type CockpitTab = "change" | "invoices" | "payouts";

const STEPS = [
  { title: "Price the request", hint: "AI reads the client's message" },
  { title: "Client pays", hint: "On the PayPal pay page" },
  { title: "Work unlocks", hint: "Locked tasks open up" },
  { title: "Pay the team", hint: "PayPal Payouts splits it" },
] as const;

/**
 * Where the latest change order is in the story, as a 0-based step index (4 = all done),
 * so the cockpit can always say what to do next.
 */
function progress(state: ProjectState) {
  const order = [...state.invoices]
    .filter((i) => i.kind === "change_order" && !i.seeded)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const batch = order ? state.payoutBatches.find((b) => b.invoiceId === order.id) : undefined;
  let step = 0;
  if (order && order.status !== "DRAFT") step = 1;
  if (order?.status === "PAID") step = 3;
  if (batch?.status === "SUCCESS") step = 4;
  return { step, order, batch };
}

export function NextStep({ state, onGoTo }: { state: ProjectState; onGoTo: (tab: CockpitTab) => void }) {
  const { step, order, batch } = progress(state);

  return (
    <section className="panel flex flex-col gap-4" aria-label="How it works">
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {STEPS.map((s, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <li
              key={s.title}
              aria-current={current ? "step" : undefined}
              className={clsx(
                "flex items-center gap-3 rounded-sm border px-3 py-2.5",
                current ? "border-brand bg-info-soft" : done ? "border-hairline bg-success-soft" : "border-hairline",
              )}
            >
              <span
                className={clsx(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                  done ? "bg-success text-white" : current ? "bg-brand text-white" : "bg-surface-tint text-ink-muted",
                )}
                aria-hidden
              >
                {done ? <Check size={16} /> : i + 1}
              </span>
              <span className="min-w-0">
                <span className={clsx("block font-bold", !done && !current && "text-ink-muted")}>{s.title}</span>
                <span className="t-body-sm block truncate text-ink-muted">{done ? "Done" : s.hint}</span>
              </span>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap items-center gap-3 rounded-sm bg-surface-warm px-4 py-3">
        <span className="t-label rounded-full bg-brand px-2.5 py-1 text-white">Next</span>
        {step === 0 && (
          <>
            <p className="min-w-0 flex-1">
              Paste a client&apos;s &ldquo;can you also add…&rdquo; message, or try a sample. The AI lists the work, and the app prices it and
              sends a PayPal invoice.
            </p>
            <Button size="sm" variant="primary" icon={<ArrowRight size={16} aria-hidden />} onClick={() => onGoTo("change")}>
              Start
            </Button>
          </>
        )}
        {step === 1 && order && (
          <>
            <p className="min-w-0 flex-1">
              Invoice #{order.invoiceNumber} for {formatUSD(order.totalCents)} is waiting. Open the pay page and pay it as the client
              {state.config.buyerEmail ? (
                <>
                  {" "}
                  (PayPal login: <span className="t-mono">{state.config.buyerEmail}</span>)
                </>
              ) : null}
              . The new tasks stay locked until then.
            </p>
            <a className="btn btn-primary btn-sm" href={`/pay/${order.id}`} target="_blank" rel="noreferrer">
              Open pay page <ExternalLink size={14} aria-hidden />
            </a>
          </>
        )}
        {step === 3 && order && (
          <>
            <p className="min-w-0 flex-1">
              The client paid {formatUSD(order.totalCents)} and the new tasks are unlocked.{" "}
              {batch ? "The payout is on its way to the team." : "Now send each contractor their share."}
            </p>
            <Button size="sm" variant="primary" icon={<ArrowRight size={16} aria-hidden />} onClick={() => onGoTo("payouts")}>
              {batch ? "View payout" : "Pay the team"}
            </Button>
          </>
        )}
        {step === 4 && (
          <>
            <p className="min-w-0 flex-1">
              <PartyPopper size={16} className="mr-1 inline align-[-2px]" aria-hidden />
              All done: the extra work was priced, paid for and paid out. Try another client message, or reset the demo to start over.
            </p>
            <Button size="sm" icon={<ArrowRight size={16} aria-hidden />} onClick={() => onGoTo("change")}>
              New request
            </Button>
          </>
        )}
      </div>
    </section>
  );
}
