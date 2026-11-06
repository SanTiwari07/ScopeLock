"use client";

import { ArrowLeft, ArrowRight, Check, CircleX, FlaskConical, Info, Lock, ShieldCheck, Unlock, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { InvoiceDTO } from "@/lib/api-types";
import { AGENCY_NAME, DEMO_PROJECT_PATH } from "@/lib/brand";
import { formatUSD } from "@/lib/domain/money";
import { Alert, Button, CopyId } from "../ui";
import { api, formatDate } from "../useProject";
import { PayPalCheckout, type CheckoutOutcome } from "./PayPalCheckout";

interface PublicInvoice {
  invoice: InvoiceDTO;
  project: { name: string; clientName: string };
  paypalMode: "sandbox" | "simulated";
}

export function PayPage({ invoiceId, sdkUrl }: { invoiceId: string; sdkUrl: string }) {
  const [data, setData] = useState<PublicInvoice | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<CheckoutOutcome | null>(null);
  const [simulateDecline, setSimulateDecline] = useState(false);
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const load = useCallback(async () => {
    try {
      setData(await api<PublicInvoice>(`/api/invoices/${invoiceId}`));
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : String(e));
    }
  }, [invoiceId]);

  useEffect(() => {
    let alive = true;
    api<PublicInvoice>(`/api/invoices/${invoiceId}`)
      .then((d) => alive && setData(d))
      .catch((e) => alive && setLoadError(e instanceof Error ? e.message : String(e)));
    return () => {
      alive = false;
    };
  }, [invoiceId]);

  const handleOutcome = useCallback(
    (o: CheckoutOutcome) => {
      setOutcome(o);
      if (o.kind === "success" || o.kind === "already_paid") load();
    },
    [load],
  );

  const inv = data?.invoice;
  const alreadyPaid = inv?.status === "PAID" && outcome?.kind !== "success";
  const payable = inv && !inv.seeded && inv.status === "SENT";

  return (
    <div className="min-h-screen bg-surface-warm">
      {/* Role banner: makes the perspective switch obvious */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#ffcf70] px-4 py-2 text-navy sm:px-8">
        <span className="t-body-sm font-bold">
          <span className="mr-2 rounded-full bg-navy px-2 py-0.5 text-xs text-white">Client view</span>
          You&apos;re now seeing exactly what {data?.project.clientName ?? "the client"} sees.
        </span>
        <Link href={DEMO_PROJECT_PATH} className="t-body-sm inline-flex items-center gap-1 font-bold hover:underline">
          <ArrowLeft size={14} aria-hidden /> Back to agency view
        </Link>
      </div>

      <header className="border-b border-hairline bg-canvas">
        <div className="mx-auto flex h-16 max-w-[1080px] items-center justify-between px-4 sm:px-8">
          <span className="inline-flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-navy font-display text-sm font-black text-white" aria-hidden>
              NS
            </span>
            <span className="font-display text-lg font-black tracking-[-0.5px]">{AGENCY_NAME}</span>
          </span>
          <span className="t-body-sm inline-flex items-center gap-1.5 text-ink-muted">
            <ShieldCheck size={16} className="text-success" aria-hidden /> Secure checkout by PayPal
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-[1080px] px-4 pt-10 pb-16 sm:px-8">
        {loadError && <Alert tone="danger" title="Couldn't load this invoice">{loadError}</Alert>}
        {!data && !loadError && (
          <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
            <div className="skeleton h-96" />
            <div className="skeleton h-72" />
          </div>
        )}

        {inv && data && (
          <>
            <h1 className="t-display-lg mb-2">{outcome?.kind === "success" ? "Thank you!" : "Pay invoice"}</h1>
            <p className="t-body-lg mb-8 text-ink-muted">
              {AGENCY_NAME} sent you an invoice for {data.project.name.replace(/^.*?—\s*/, "your ")}.
            </p>

            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[3fr_2fr]">
              {/* Invoice paper */}
              <article className="rounded-lg bg-canvas p-6 shadow-raised sm:p-8" aria-label="Invoice">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-hairline pb-6">
                  <div>
                    <div className="eyebrow text-ink-muted">Invoice</div>
                    {inv.invoiceNumber && <div className="t-title-lg">#{inv.invoiceNumber}</div>}
                    <div className="t-body-sm mt-1 text-ink-muted">{inv.kind === "change_order" ? "Change order: extra work you asked for" : "Project milestone"}</div>
                  </div>
                  <div className="t-body-sm sm:text-right">
                    <div className="t-label text-ink-muted">Billed to</div>
                    <div className="font-bold">{data.project.clientName}</div>
                    {inv.dueDate && <div className="text-ink-muted">Due {formatDate(inv.dueDate, { month: "short", day: "numeric", year: "numeric" })}</div>}
                  </div>
                </div>

                <div className="t-label mt-6 mb-3 flex justify-between text-ink-muted">
                  <span>Description</span>
                  <span>Amount</span>
                </div>
                <ul className="flex flex-col divide-y divide-hairline">
                  {inv.items.map((l, i) => (
                    <li key={i} className="flex items-start justify-between gap-4 py-3">
                      <div className="min-w-0">
                        <div className="font-bold">{l.title}</div>
                        {inv.kind === "change_order" && (
                          <div className="t-body-sm text-ink-muted tabular">
                            {l.hours} h × {formatUSD(l.rateCents)}
                            {l.description ? ` · ${l.description}` : ""}
                          </div>
                        )}
                      </div>
                      <div className="t-numeric shrink-0 font-bold">{formatUSD(l.amountCents)}</div>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex items-end justify-between border-t-2 border-ink pt-4">
                  <span className="t-label text-ink-muted">Total due</span>
                  <span className="t-amount-hero">{formatUSD(inv.totalCents)}</span>
                </div>
                {inv.paypalInvoiceId && (
                  <div className="t-body-sm mt-4 flex items-center gap-1 text-ink-muted">
                    PayPal invoice <CopyId value={inv.paypalInvoiceId} max={24} />
                  </div>
                )}
              </article>

              {/* Payment column */}
              <div className="flex flex-col gap-4 lg:sticky lg:top-6">
                <section className="rounded-lg bg-canvas p-6 shadow-raised" aria-live="polite" aria-label="Payment">
                  {outcome?.kind === "success" ? (
                    <div className="flex flex-col gap-4">
                      <span className="pop-in flex h-14 w-14 items-center justify-center rounded-full bg-success text-white">
                        <Check size={30} strokeWidth={3} aria-hidden />
                      </span>
                      <div>
                        <div className="t-title-lg">Payment received</div>
                        <p className="t-body-sm text-ink-muted">Thank you! The next phase of work is unlocked.</p>
                      </div>
                      {outcome.captureId && (
                        <div className="t-body-sm flex items-center gap-2">
                          Capture <CopyId value={outcome.captureId} max={24} />
                        </div>
                      )}
                      <div className="rounded-md bg-surface-warm p-4">
                        <div className="t-label mb-2 text-ink-muted">What just happened</div>
                        <ul className="t-body-sm flex flex-col gap-2">
                          <li className="flex gap-2">
                            <Check size={16} className="mt-0.5 shrink-0 text-success" aria-hidden /> PayPal captured {formatUSD(inv.totalCents)}
                          </li>
                          <li className="flex gap-2">
                            <Check size={16} className="mt-0.5 shrink-0 text-success" aria-hidden /> The PayPal invoice is marked paid
                          </li>
                          <li className="flex gap-2">
                            <Unlock size={16} className="mt-0.5 shrink-0 text-success" aria-hidden /> The locked tasks opened up for the team
                          </li>
                        </ul>
                      </div>
                      <Link href={DEMO_PROJECT_PATH} className="btn btn-primary btn-lg w-full">
                        Back to agency view <ArrowRight size={18} aria-hidden />
                      </Link>
                      <Link href={`${DEMO_PROJECT_PATH}/team`} className="t-body-sm inline-flex items-center justify-center gap-1 font-bold text-link hover:underline">
                        <Users size={14} aria-hidden /> Go straight to paying the team
                      </Link>
                    </div>
                  ) : alreadyPaid || outcome?.kind === "already_paid" ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex gap-3 rounded-sm bg-info-soft p-4 text-info">
                        <Info size={24} aria-hidden className="shrink-0" />
                        <div className="text-ink">
                          This invoice has already been paid
                          {inv.paidAt ? ` on ${formatDate(inv.paidAt, { month: "long", day: "numeric", year: "numeric" })}` : ""}.
                        </div>
                      </div>
                      <Link href={DEMO_PROJECT_PATH} className="btn btn-outline">
                        <ArrowLeft size={16} aria-hidden /> Back to agency view
                      </Link>
                    </div>
                  ) : inv.seeded || inv.status === "DRAFT" ? (
                    <Alert tone="info" title="This invoice can't be paid online." />
                  ) : outcome?.kind === "declined" ? (
                    <div className="rounded-sm bg-danger-soft p-5">
                      <CircleX size={32} className="text-danger" aria-hidden />
                      <div className="t-title-md mt-2">Your card was declined</div>
                      <p className="t-body-sm">No money was taken. Try again with a different payment method.</p>
                      {outcome.debugId && <div className="t-mono mt-2 text-ink-muted">paypal-debug-id: {outcome.debugId}</div>}
                      <Button
                        variant="primary"
                        size="lg"
                        className="mt-4"
                        onClick={() => {
                          setSimulateDecline(false);
                          setOutcome(null);
                          setAttempt((a) => a + 1);
                        }}
                      >
                        Try again
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4 flex items-end justify-between">
                        <span className="t-label text-ink-muted">You pay</span>
                        <span className="t-title-lg">{formatUSD(inv.totalCents)}</span>
                      </div>
                      <PayPalCheckout
                        key={attempt}
                        invoiceId={inv.id}
                        simulateDecline={simulateDecline}
                        mode={data.paypalMode}
                        sdkUrl={sdkUrl}
                        onOutcome={handleOutcome}
                        onBusy={setBusy}
                      />
                      {busy && <p className="t-body-sm mt-2 text-center text-ink-muted">Confirming your payment…</p>}
                      {outcome?.kind === "cancelled" && <p className="t-body-sm mt-2 text-ink-muted">Payment cancelled. You can try again.</p>}
                      {outcome?.kind === "error" && (
                        <Alert tone="danger" title="Payment didn't go through" className="mt-3">
                          {outcome.message}
                          {outcome.debugId && <div className="t-mono mt-1">paypal-debug-id: {outcome.debugId}</div>}
                        </Alert>
                      )}
                      <p className="t-body-sm mt-4 flex gap-2 text-ink-muted">
                        <Lock size={14} className="mt-1 shrink-0" aria-hidden />
                        Paying unlocks the work you asked for. Card details go straight to PayPal, never to {AGENCY_NAME}.
                      </p>
                    </>
                  )}
                </section>

                {payable && outcome?.kind !== "success" && (
                  <div className="rounded-md border-2 border-dashed border-border-control p-5">
                    <div className="t-label flex items-center gap-2">
                      <FlaskConical size={16} aria-hidden /> Demo controls (real clients don&apos;t see this)
                    </div>
                    <label className="mt-3 flex cursor-pointer items-center justify-between gap-4">
                      <span>
                        <span className="block font-bold">Simulate declined card</span>
                        <span className="t-body-sm text-ink-muted">Forces INSTRUMENT_DECLINED on capture via PayPal-Mock-Response.</span>
                      </span>
                      <input
                        type="checkbox"
                        role="switch"
                        aria-checked={simulateDecline}
                        className="peer sr-only"
                        checked={simulateDecline}
                        onChange={(e) => setSimulateDecline(e.target.checked)}
                      />
                      <span
                        aria-hidden
                        className="relative h-7 w-12 shrink-0 rounded-full bg-ink-subtle transition-colors peer-checked:bg-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus-ring after:absolute after:top-1 after:left-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
