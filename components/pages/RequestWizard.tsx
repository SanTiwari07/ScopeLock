"use client";

import clsx from "clsx";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Check,
  CircleCheck,
  CircleHelp,
  Code2,
  Lock,
  Mail,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  TriangleAlert,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { MAX_MESSAGE_CHARS } from "@/lib/ai/schema";
import { SAMPLE_MESSAGES } from "@/lib/ai/samples";
import type { ExtractResponse, ProjectState } from "@/lib/api-types";
import { formatUSD } from "@/lib/domain/money";
import { priceItems, roundHours } from "@/lib/domain/pricing";
import { applyChangeOrder } from "@/lib/domain/schedule";
import { ROLES, type Role } from "@/lib/domain/types";
import { PageHeader, useProjectState } from "../shell/ProjectShell";
import { Alert, Badge, Button, CopyId, ProvenanceBadge, useToast } from "../ui";
import { api, ApiRequestError, formatDate } from "../useProject";

interface EditableItem {
  key: number;
  include: boolean;
  title: string;
  description: string;
  role: Role;
  hours: number;
  confidence: number | null;
  inOriginalScope: boolean;
  sourceQuote: string;
}

interface Created {
  invoiceId: string;
  invoiceNumber: string | null;
  paypalInvoiceId: string | null;
  totalCents: number;
  itemCount: number;
  addedDays: number;
}

const ROLE_LABEL: Record<Role, string> = { design: "Design", dev: "Dev", qa: "QA", pm: "PM" };
const WIZARD = ["Client message", "Review & price", "Invoice sent"];

export function RequestWizard() {
  const { state, refresh } = useProjectState();
  const toast = useToast();
  const [text, setText] = useState("");
  const [sentText, setSentText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<ExtractResponse | null>(null);
  const [items, setItems] = useState<EditableItem[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<{ message: string; debugId?: string | null } | null>(null);
  const [created, setCreated] = useState<Created | null>(null);

  const stage = created ? 2 : result ? 1 : 0;

  const included = items.filter((i) => i.include && i.title.trim().length >= 3);
  const pricing = useMemo(
    () => priceItems(included.map((i) => ({ title: i.title, role: i.role, hours: i.hours, description: i.description })), state.rateCard),
    [included, state.rateCard],
  );
  const milestone = state.milestones.find((m) => m.status === "invoiced" || m.status === "planned");
  const preview = useMemo(() => {
    if (!milestone || included.length === 0) return null;
    return applyChangeOrder(state.tasks, milestone.id, included.map((i) => ({ title: i.title, role: i.role, hours: roundHours(i.hours) })));
  }, [state.tasks, milestone, included]);

  async function analyze() {
    setAnalyzing(true);
    setError(null);
    setCreated(null);
    try {
      const r = await api<ExtractResponse>("/api/scope/extract", { body: { projectId: state.project.id, text } });
      setSentText(text);
      setResult(r);
      setItems(
        r.extraction.items.map((it, i) => ({
          key: i,
          include: !it.inOriginalScope,
          title: it.title,
          description: it.description,
          role: it.role,
          hours: it.estimatedHours,
          confidence: it.confidence,
          inOriginalScope: it.inOriginalScope,
          sourceQuote: it.sourceQuote,
        })),
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
      await refresh();
    } catch (e) {
      setError({ message: e instanceof Error ? e.message : String(e) });
    } finally {
      setAnalyzing(false);
    }
  }

  async function createInvoice() {
    if (!result) return;
    setCreating(true);
    setError(null);
    try {
      const r = await api<{ invoice: { id: string; invoiceNumber: string | null; paypalInvoiceId: string | null; totalCents: number } }>(
        "/api/change-orders",
        {
          body: {
            changeRequestId: result.changeRequestId,
            items: included.map((i) => ({ title: i.title.trim(), description: i.description, role: i.role, hours: roundHours(i.hours) })),
          },
        },
      );
      setCreated({
        invoiceId: r.invoice.id,
        invoiceNumber: r.invoice.invoiceNumber,
        paypalInvoiceId: r.invoice.paypalInvoiceId,
        totalCents: r.invoice.totalCents,
        itemCount: included.length,
        addedDays: preview?.addedDays ?? 0,
      });
      toast({ tone: "success", message: `Invoice ${r.invoice.invoiceNumber} sent to ${state.project.clientName}`, ref: r.invoice.paypalInvoiceId });
      setResult(null);
      setItems([]);
      setText("");
      window.scrollTo({ top: 0, behavior: "smooth" });
      await refresh();
    } catch (e) {
      const body = e instanceof ApiRequestError ? e.body : null;
      setError({ message: e instanceof Error ? e.message : String(e), debugId: body?.debugId });
    } finally {
      setCreating(false);
    }
  }

  const update = (key: number, patch: Partial<EditableItem>) => setItems((xs) => xs.map((x) => (x.key === key ? { ...x, ...patch } : x)));

  return (
    <>
      <PageHeader eyebrow="Change requests" title="Turn “can you also add…” into an invoice">
        Paste what {state.project.clientName} sent. AI reads it, your rate card prices it, and you approve before anything goes to the client.
      </PageHeader>

      <WizardSteps stage={stage} />

      {!state.config.aiEnabled && stage === 0 && (
        <Alert tone="warning" title="AI is off, so the rule-based extractor is used" className="mb-6">
          Set GEMINI_API_KEY to turn on Gemini extraction. The sample messages still give the same results.
        </Alert>
      )}

      {error && (
        <Alert tone="danger" title="That didn't work" className="mb-6">
          {error.message}
          {error.debugId && <div className="t-mono mt-1">paypal-debug-id: {error.debugId}</div>}
        </Alert>
      )}

      {stage === 0 && (
        <div className="fade-in grid grid-cols-1 gap-6 lg:grid-cols-[3fr_2fr]">
          <div className="flex flex-col gap-6">
            <section aria-labelledby="samples-title">
              <h2 id="samples-title" className="t-label mb-3 text-ink-muted">
                No message handy? Pick one {state.project.clientName} might send
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {SAMPLE_MESSAGES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    aria-label={s.label}
                    disabled={analyzing}
                    onClick={() => setText(s.text)}
                    className={clsx(
                      "card-hover flex flex-col gap-2 rounded-md border bg-canvas p-4 text-left",
                      text === s.text ? "border-brand ring-2 ring-brand/20" : "border-hairline",
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-bold">{s.label}</span>
                      {text === s.text && <CircleCheck size={18} className="text-brand" aria-hidden />}
                    </span>
                    <span className="t-body-sm line-clamp-3 text-ink-muted">“{s.text}”</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="overflow-hidden rounded-lg border border-hairline bg-canvas shadow-raised" aria-labelledby="msg-title">
              <div className="flex items-center gap-3 border-b border-hairline bg-surface-warm px-5 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ffcf70] text-sm font-black text-navy" aria-hidden>
                  AB
                </span>
                <div className="t-body-sm min-w-0 flex-1">
                  <div id="msg-title" className="font-bold">
                    Message from {state.project.clientName}
                  </div>
                  <div className="truncate text-ink-muted">{state.project.clientEmail || "client"} → you</div>
                </div>
                <Mail size={18} className="text-ink-subtle" aria-hidden />
              </div>
              <label htmlFor="cr-text" className="sr-only">
                Client message
              </label>
              <textarea
                id="cr-text"
                className="block min-h-[180px] w-full resize-y border-0 p-5 text-[17px] leading-relaxed outline-none placeholder:text-ink-subtle"
                placeholder="Paste the client's email, Slack or WhatsApp message here, e.g. “Love it! Can we also add…”"
                value={text}
                maxLength={MAX_MESSAGE_CHARS}
                disabled={analyzing}
                onChange={(e) => setText(e.target.value)}
              />
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline px-5 py-3">
                <span className={clsx("t-body-sm tabular", text.length >= MAX_MESSAGE_CHARS * 0.9 ? "text-warning" : "text-ink-muted")}>
                  {text.length.toLocaleString()} / {MAX_MESSAGE_CHARS.toLocaleString()}
                </span>
                <Button variant="primary" size="lg" icon={<Sparkles size={20} aria-hidden />} loading={analyzing} disabled={text.trim().length < 3} onClick={analyze}>
                  {analyzing ? "Reading the request…" : "Analyze"}
                </Button>
              </div>
              {analyzing && <div className="indeterminate !rounded-none" aria-hidden />}
            </section>
          </div>

          <aside className="flex flex-col gap-4">
            <div className="panel">
              <h2 className="t-title-md">What happens when you click Analyze</h2>
              <ul className="mt-4 flex flex-col gap-4">
                <Explainer icon={<Sparkles size={18} />} title="AI reads the message">
                  {state.config.aiEnabled ? state.config.aiProvider : "A rule-based extractor"} lists each new piece of work, with the exact words it came
                  from.
                </Explainer>
                <Explainer icon={<Code2 size={18} />} title="Code prices it">
                  Hours × your rate card. The AI never sets a price.
                </Explainer>
                <Explainer icon={<UserCheck size={18} />} title="You approve">
                  Edit anything. Nothing reaches the client until you click send.
                </Explainer>
              </ul>
            </div>
            <div className="panel">
              <h2 className="t-label mb-3 text-ink-muted">Your rate card</h2>
              <ul className="grid grid-cols-2 gap-2">
                {ROLES.map((r) => (
                  <li key={r} className="flex items-center justify-between rounded-sm bg-surface-warm px-3 py-2">
                    <span className="t-body-sm">{ROLE_LABEL[r]}</span>
                    <span className="font-bold tabular">{formatUSD(state.rateCard[r])}/h</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      )}

      {stage === 1 && result && (
        <div className="fade-in grid grid-cols-1 items-start gap-6 lg:grid-cols-[3fr_2fr]">
          <div className="flex flex-col gap-6">
            <section className="panel" aria-labelledby="said-title">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <h2 id="said-title" className="t-title-md mr-auto">
                  What the client said
                </h2>
                <ProvenanceBadge source={result.source} />
                {result.extraction.isScopeChange ? <Badge tone="warning">Scope change</Badge> : <Badge tone="info">Not a scope change</Badge>}
              </div>
              <blockquote className="t-body-lg rounded-sm bg-surface-warm p-4">
                <HighlightedQuote text={sentText} quotes={items.map((i) => i.sourceQuote).filter(Boolean)} />
              </blockquote>
              <p className="t-body-sm mt-3 flex gap-2 text-ink-muted">
                <Sparkles size={16} className="mt-0.5 shrink-0 text-brand" aria-hidden />
                <span>
                  <span className="font-bold text-ink">AI summary:</span> {result.extraction.summary}
                </span>
              </p>
              {result.fallbackReason && <p className="t-body-sm mt-1 text-ink-muted">Fallback because: {result.fallbackReason}</p>}
            </section>

            <section className="panel" aria-labelledby="items-title">
              <div className="mb-1 flex items-center justify-between">
                <h2 id="items-title" className="t-title-md">
                  Work found ({items.length})
                </h2>
                <Button
                  size="sm"
                  icon={<Plus size={16} aria-hidden />}
                  onClick={() =>
                    setItems((xs) => [
                      ...xs,
                      { key: Date.now(), include: true, title: "", description: "", role: "dev", hours: 2, confidence: null, inOriginalScope: false, sourceQuote: "" },
                    ])
                  }
                >
                  Add item
                </Button>
              </div>
              <p className="t-body-sm mb-3 text-ink-muted">Untick anything you&apos;ll do for free. Change the role or hours and the price updates.</p>
              <ScopeItemsTable items={items} rateCard={state.rateCard} update={update} remove={(k) => setItems((xs) => xs.filter((x) => x.key !== k))} />
            </section>

            {result.extraction.clarifyingQuestions.length > 0 && (
              <section className="rounded-md bg-info-soft p-5" aria-labelledby="q-title">
                <h2 id="q-title" className="t-label mb-2 text-info">
                  Questions worth asking the client
                </h2>
                <ul className="flex flex-col gap-1.5">
                  {result.extraction.clarifyingQuestions.map((q) => (
                    <li key={q} className="t-body-sm flex gap-2">
                      <CircleHelp size={16} className="mt-0.5 shrink-0 text-info" aria-hidden />
                      {q}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
            <section className="overflow-hidden rounded-lg border border-hairline bg-canvas shadow-raised" aria-labelledby="co-title">
              <div className="bg-navy px-6 py-4 text-white">
                <div className="eyebrow text-brand-accent">Change order</div>
                <h2 id="co-title" className="t-title-md">
                  Invoice for {state.project.clientName}
                </h2>
              </div>
              <div className="flex flex-col gap-4 p-6">
                <ul className="flex flex-col gap-2">
                  {pricing.lines.map((l, i) => (
                    <li key={i} className="t-body-sm flex items-start justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block font-bold">{l.title}</span>
                        <span className="text-ink-muted tabular">
                          {l.hours} h × {formatUSD(l.rateCents)}
                        </span>
                      </span>
                      <span className="font-bold tabular">{formatUSD(l.amountCents)}</span>
                    </li>
                  ))}
                  {pricing.lines.length === 0 && <li className="t-body-sm text-ink-muted">Tick at least one item.</li>}
                </ul>
                <div className="border-t border-hairline pt-4">
                  <div className="t-label text-ink-muted">Change-order total</div>
                  <div className="t-amount-hero !text-[44px]">{formatUSD(pricing.totalCents)}</div>
                  <div className="t-body-sm mt-1 inline-flex items-center gap-1 text-ink-muted">
                    <ShieldCheck size={14} aria-hidden /> Priced by code from the rate card, not by the AI
                  </div>
                </div>
                {preview && preview.addedDays > 0 && (
                  <div className="t-body-sm flex gap-2 rounded-sm bg-warning-soft p-3">
                    <CalendarClock size={18} className="mt-0.5 shrink-0 text-warning" aria-hidden />
                    <span>
                      <span className="font-bold text-warning">
                        +{preview.addedDays} day{preview.addedDays === 1 ? "" : "s"}
                      </span>{" "}
                      · Launch moves {formatDate(preview.endBefore)} → {formatDate(preview.endAfter)}
                      {preview.shifted.length > 0 && ` · ${preview.shifted.length} later tasks shift`}
                    </span>
                  </div>
                )}
                <div className="t-body-sm flex gap-2 rounded-sm bg-surface-warm p-3">
                  <Lock size={16} className="mt-0.5 shrink-0 text-locked" aria-hidden />
                  The new tasks are added to the timeline, locked until this invoice is paid.
                </div>
                <Button variant="primary" size="lg" className="w-full" icon={<Send size={20} aria-hidden />} loading={creating} disabled={included.length === 0} onClick={createInvoice}>
                  {creating ? "Sending…" : "Create invoice & send"}
                </Button>
                <button
                  type="button"
                  className="t-body-sm inline-flex items-center justify-center gap-1 text-ink-muted hover:text-ink"
                  onClick={() => {
                    setResult(null);
                    setItems([]);
                  }}
                >
                  <ArrowLeft size={14} aria-hidden /> Back to the message
                </button>
              </div>
            </section>
          </aside>
        </div>
      )}

      {stage === 2 && created && <SentScreen created={created} state={state} onAnother={() => setCreated(null)} />}
    </>
  );
}

function SentScreen({ created, state, onAnother }: { created: Created; state: ProjectState; onAnother: () => void }) {
  return (
    <section className="fade-in mx-auto max-w-3xl overflow-hidden rounded-lg border border-hairline bg-canvas shadow-raised" aria-labelledby="sent-title">
      <div className="flex flex-col items-center gap-3 bg-success-soft px-6 py-10 text-center">
        <span className="pop-in flex h-16 w-16 items-center justify-center rounded-full bg-success text-white">
          <Check size={36} strokeWidth={3} aria-hidden />
        </span>
        <h2 id="sent-title" className="t-headline">
          Invoice #{created.invoiceNumber} sent
        </h2>
        <p className="t-body-lg max-w-lg text-ink-muted">
          {state.project.clientName} got a PayPal invoice for <span className="font-bold text-ink">{formatUSD(created.totalCents)}</span>. The{" "}
          {created.itemCount} new task{created.itemCount === 1 ? " is" : "s are"} on the timeline, locked until it&apos;s paid.
        </p>
        {created.paypalInvoiceId && (
          <span className="t-body-sm inline-flex items-center gap-1 text-ink-muted">
            PayPal invoice <CopyId value={created.paypalInvoiceId} max={24} />
          </span>
        )}
      </div>
      <div className="p-6 sm:p-8">
        <h3 className="t-label mb-4 text-ink-muted">What happens next</h3>
        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { t: "Client pays", d: "With PayPal or a card, on the pay page." },
            { t: "Work unlocks", d: "Locked tasks open up automatically." },
            { t: "Team gets paid", d: "PayPal Payouts splits the money." },
          ].map((s, i) => (
            <li key={s.t} className="rounded-md bg-surface-warm p-4">
              <span className="t-label flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white">{i + 1}</span>
              <div className="mt-2 font-bold">{s.t}</div>
              <div className="t-body-sm text-ink-muted">{s.d}</div>
            </li>
          ))}
        </ol>
        <div className="mt-6 flex flex-col gap-3 rounded-md border-2 border-dashed border-brand/30 bg-brand-accent-soft/50 p-5 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <div className="font-bold">Now play the client</div>
            <div className="t-body-sm text-ink-muted">Switch to {state.project.clientName}&apos;s view and pay the invoice yourself.</div>
          </div>
          <Link href={`/pay/${created.invoiceId}`} className="btn btn-primary btn-lg">
            Open client pay page <ArrowRight size={18} aria-hidden />
          </Link>
        </div>
        <div className="mt-4 flex justify-center">
          <button type="button" className="t-body-sm text-ink-muted hover:text-ink hover:underline" onClick={onAnother}>
            Price another request instead
          </button>
        </div>
      </div>
    </section>
  );
}

function WizardSteps({ stage }: { stage: number }) {
  return (
    <ol className="mb-6 flex flex-wrap items-center gap-2" aria-label="Progress">
      {WIZARD.map((label, i) => (
        <li key={label} className="flex items-center gap-2" aria-current={i === stage ? "step" : undefined}>
          <span
            className={clsx(
              "t-label inline-flex h-8 items-center gap-2 rounded-full pr-3 pl-1",
              i < stage ? "bg-success-soft text-success" : i === stage ? "bg-ink text-white" : "bg-surface-tint text-ink-muted",
            )}
          >
            <span
              className={clsx(
                "flex h-6 w-6 items-center justify-center rounded-full",
                i < stage ? "bg-success text-white" : i === stage ? "bg-white text-ink" : "bg-canvas",
              )}
            >
              {i < stage ? <Check size={14} strokeWidth={3} aria-hidden /> : i + 1}
            </span>
            {label}
          </span>
          {i < WIZARD.length - 1 && <ArrowRight size={14} className="text-ink-subtle" aria-hidden />}
        </li>
      ))}
    </ol>
  );
}

function Explainer({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-accent-soft text-brand" aria-hidden>
        {icon}
      </span>
      <div>
        <div className="font-bold">{title}</div>
        <div className="t-body-sm text-ink-muted">{children}</div>
      </div>
    </li>
  );
}

/** Message text with each AI source quote highlighted, so you can see where every item came from. */
function HighlightedQuote({ text, quotes }: { text: string; quotes: string[] }) {
  const ranges: [number, number][] = [];
  const lower = text.toLowerCase();
  for (const q of quotes) {
    const i = lower.indexOf(q.toLowerCase());
    if (i >= 0) ranges.push([i, i + q.length]);
  }
  ranges.sort((a, b) => a[0] - b[0]);
  const parts: ReactNode[] = [];
  let at = 0;
  ranges.forEach(([s, e], k) => {
    if (s < at) return;
    if (s > at) parts.push(text.slice(at, s));
    parts.push(
      <mark key={k} className="quote">
        {text.slice(s, e)}
      </mark>,
    );
    at = e;
  });
  parts.push(text.slice(at));
  return <>“{parts}”</>;
}

function ScopeItemsTable({
  items,
  rateCard,
  update,
  remove,
}: {
  items: EditableItem[];
  rateCard: ProjectState["rateCard"];
  update: (key: number, patch: Partial<EditableItem>) => void;
  remove: (key: number) => void;
}) {
  if (items.length === 0) return <p className="t-body-sm text-ink-muted">No billable items found. Add one manually.</p>;
  return (
    <ul className="flex flex-col gap-3" aria-label="Scope items">
      {items.map((it) => {
        const hours = roundHours(it.hours);
        const amount = Math.round((rateCard[it.role] * Math.round(hours * 2)) / 2);
        const low = it.confidence !== null && it.confidence < 0.5;
        return (
          <li key={it.key} className={clsx("t-body-sm flex gap-3 rounded-md border p-4 transition-opacity", it.include ? "border-hairline" : "border-dashed border-hairline opacity-60")}>
            <input
              type="checkbox"
              className="mt-2.5 h-4 w-4 shrink-0 accent-black"
              checked={it.include}
              onChange={(e) => update(it.key, { include: e.target.checked })}
              aria-label={`Include ${it.title || "item"} on the invoice`}
            />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex items-start gap-2">
                <input
                  className="field field-sm min-w-0 flex-1 font-bold"
                  value={it.title}
                  maxLength={80}
                  placeholder="Item title"
                  aria-label="Item title"
                  aria-invalid={it.title.trim().length < 3}
                  onChange={(e) => update(it.key, { title: e.target.value })}
                />
                <span className="t-numeric mt-1.5 w-24 shrink-0 text-right font-bold">{formatUSD(amount)}</span>
              </div>
              {it.sourceQuote && <div className="rounded-[4px] border-l-[3px] border-brand bg-brand-accent-soft px-2 py-1 italic">“{it.sourceQuote}”</div>}
              <div className="flex flex-wrap items-center gap-2">
                <select className="field field-sm !w-28" value={it.role} aria-label="Role" onChange={(e) => update(it.key, { role: e.target.value as Role })}>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABEL[r]}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  className="field field-sm !w-20 text-right tabular"
                  min={0.5}
                  max={80}
                  step={0.5}
                  value={it.hours}
                  aria-label="Hours"
                  onChange={(e) => update(it.key, { hours: Number(e.target.value) })}
                />
                <span className="text-ink-muted tabular">h × {formatUSD(rateCard[it.role])}</span>
                {it.inOriginalScope && <Badge tone="info">Already in scope</Badge>}
                <span className="ml-auto flex items-center gap-1">
                  {it.confidence !== null && (
                    <span
                      className={clsx("inline-flex items-center gap-1 tabular", low ? "text-warning" : "text-ink-muted")}
                      title={low ? "Low confidence: check this estimate" : "How sure the AI is"}
                    >
                      {low && <TriangleAlert size={14} aria-hidden />}
                      <span className="inline-block h-1.5 w-12 overflow-hidden rounded-full bg-surface-sunken" aria-hidden>
                        <span className={clsx("block h-full", low ? "bg-warning" : "bg-success")} style={{ width: `${Math.round(it.confidence * 100)}%` }} />
                      </span>
                      <span className="sr-only">Confidence</span>
                      {Math.round(it.confidence * 100)}%
                    </span>
                  )}
                  <button type="button" className="btn btn-ghost btn-sm" aria-label={`Remove ${it.title || "item"}`} title="Remove" onClick={() => remove(it.key)}>
                    <Trash2 size={16} aria-hidden />
                  </button>
                </span>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
