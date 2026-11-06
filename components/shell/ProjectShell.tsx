"use client";

import clsx from "clsx";
import {
  Activity,
  ArrowRight,
  BookOpenText,
  Check,
  CircleHelp,
  FileText,
  FlaskConical,
  House,
  LayoutDashboard,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { ProjectState } from "@/lib/api-types";
import { AGENCY_NAME } from "@/lib/brand";
import { ActivityDrawer } from "../activity/ActivityDrawer";
import { JOURNEY_STEPS, journey } from "../journey";
import { JudgeGuide } from "../JudgeGuide";
import { Alert, Button, Modal, ToastProvider, useToast, Wordmark } from "../ui";
import { api, useProject } from "../useProject";

interface ProjectCtx {
  state: ProjectState;
  refresh: () => Promise<void>;
  base: string;
}

const Ctx = createContext<ProjectCtx | null>(null);

export function useProjectState(): ProjectCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useProjectState must be used inside ProjectShell");
  return c;
}

export function ProjectShell({ projectId, children }: { projectId: string; children: ReactNode }) {
  return (
    <ToastProvider>
      <ShellInner projectId={projectId}>{children}</ShellInner>
    </ToastProvider>
  );
}

function ShellInner({ projectId, children }: { projectId: string; children: ReactNode }) {
  const { state, error, slow, refresh } = useProject(projectId);
  const toast = useToast();
  const pathname = usePathname();
  const base = `/projects/${projectId}`;
  const [activityOpen, setActivityOpen] = useState(false);
  const [seenEvents, setSeenEvents] = useState(0);
  const [guideOpen, setGuideOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Stay in sync when the client pays in another tab.
  useEffect(() => {
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    const t = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, 10_000);
    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(t);
    };
  }, [refresh]);

  async function reset() {
    setResetting(true);
    try {
      await api("/api/demo/reset", { method: "POST" });
      await refresh();
      setSeenEvents(0);
      toast({ tone: "success", message: "Demo reset to its starting state" });
      setResetOpen(false);
    } catch (e) {
      toast({ tone: "error", message: e instanceof Error ? e.message : String(e) });
    } finally {
      setResetting(false);
    }
  }

  if (!state) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy p-6">
        {error ? (
          <div className="w-full max-w-md">
            <Alert tone="danger" title="Couldn't load the project" action={<Button onClick={refresh}>Retry</Button>}>
              {error}
            </Alert>
          </div>
        ) : (
          <div className="w-full max-w-md rounded-lg bg-white/5 p-8 text-white ring-1 ring-white/10">
            <Wordmark inverse />
            <p className="t-body-lg mt-4">{slow ? "Waking up the demo server (about a minute on the free tier)…" : "Loading your project…"}</p>
            <div className="indeterminate mt-4 !bg-white/20" />
          </div>
        )}
      </div>
    );
  }

  const j = journey(state);
  const openInvoices = state.invoices.filter((i) => i.status === "SENT").length;
  const toPayOut = state.invoices.filter((i) => !i.seeded && i.status === "PAID" && !i.payoutBatchId).length;
  const unread = Math.max(0, state.events.length - seenEvents);

  const nav = [
    { href: base, label: "Overview", Icon: LayoutDashboard },
    { href: `${base}/requests`, label: "Change requests", Icon: Sparkles },
    { href: `${base}/invoices`, label: "Invoices", Icon: FileText, count: openInvoices },
    { href: `${base}/team`, label: "Pay the team", Icon: Users, count: toPayOut },
    { href: `${base}/ledger`, label: "Money log", Icon: BookOpenText },
  ];
  const current = nav.find((n) => n.href === pathname) ?? nav[0];

  return (
    <Ctx.Provider value={{ state, refresh, base }}>
      <div className="min-h-screen lg:pl-[280px]">
        {/* Sidebar */}
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-[280px] flex-col bg-navy text-white lg:flex">
          <div className="flex h-16 items-center px-6">
            <Link href="/" aria-label="ScopeLock home">
              <Wordmark inverse />
            </Link>
          </div>

          <div className="px-4">
            <div className="flex items-center gap-3 rounded-md bg-white/[0.06] p-3 ring-1 ring-white/10">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-[#ffcf70] font-display text-lg font-black text-navy" aria-hidden>
                AB
              </span>
              <span className="min-w-0">
                <span className="block truncate font-bold">{state.project.clientName}</span>
                <span className="t-body-sm block truncate text-white/60">E-commerce site</span>
              </span>
            </div>
          </div>

          <nav aria-label="Project" className="mt-6 flex flex-col gap-1 px-4">
            <div className="eyebrow mb-1 px-3 text-white/40">Workspace</div>
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="nav-item" aria-current={n.href === pathname ? "page" : undefined}>
                <n.Icon size={18} aria-hidden />
                <span className="flex-1">{n.label}</span>
                {!!n.count && (
                  <span className="t-label rounded-full bg-brand-accent px-2 py-0.5 text-navy tabular">{n.count}</span>
                )}
              </Link>
            ))}
          </nav>

          {/* Journey tracker */}
          <div className="mx-4 mt-auto mb-4 rounded-md bg-white/[0.06] p-4 ring-1 ring-white/10">
            <div className="eyebrow mb-3 text-brand-accent">Demo journey</div>
            <ol className="flex flex-col gap-2">
              {JOURNEY_STEPS.map((s, i) => {
                const done = i < j.step;
                const cur = i === j.step;
                return (
                  <li key={s.title} className="flex items-center gap-2.5 text-sm">
                    <span
                      className={clsx(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                        done ? "bg-[#7ee2a8] text-navy" : cur ? "pulse-dot bg-brand-accent text-navy" : "bg-white/10 text-white/50",
                      )}
                      aria-hidden
                    >
                      {done ? <Check size={12} strokeWidth={3} /> : i + 1}
                    </span>
                    <span className={clsx(done ? "text-white/60 line-through decoration-white/30" : cur ? "font-bold text-white" : "text-white/50")}>{s.title}</span>
                  </li>
                );
              })}
            </ol>
            <Link
              href={j.next.href}
              className="btn btn-sm mt-4 w-full bg-white text-navy hover:bg-brand-accent-soft"
            >
              {j.next.cta} <ArrowRight size={14} aria-hidden />
            </Link>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
            <span className="t-body-sm inline-flex items-center gap-1.5 text-white/60">
              {state.config.paypalMode === "sandbox" ? <ShieldCheck size={14} aria-hidden /> : <FlaskConical size={14} aria-hidden />}
              PayPal {state.config.paypalMode === "sandbox" ? "sandbox" : "simulator"}
            </span>
            <button type="button" className="t-body-sm inline-flex items-center gap-1 rounded-full px-2 py-1 text-white/70 hover:bg-white/10 hover:text-white" onClick={() => setResetOpen(true)}>
              <RotateCcw size={14} aria-hidden /> Reset demo
            </button>
          </div>
        </aside>

        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-hairline bg-canvas/90 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-8">
            <Link href="/" className="lg:hidden" aria-label="ScopeLock home">
              <Wordmark />
            </Link>
            <div className="t-body-sm hidden min-w-0 items-center gap-2 text-ink-muted lg:flex">
              <span className="truncate">{state.project.name}</span>
              <span aria-hidden>/</span>
              <span className="font-bold text-ink">{current.label}</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="t-label hidden items-center gap-2 rounded-full bg-surface-tint px-3 py-1.5 sm:inline-flex" title="You are the agency running this project">
                <span className="h-2 w-2 rounded-full bg-success" aria-hidden />
                Agency view · {AGENCY_NAME}
              </span>
              <button
                type="button"
                className="btn btn-ghost relative"
                aria-label={`Activity${unread ? `, ${unread} new` : ""}`}
                title="Activity"
                onClick={() => {
                  setActivityOpen(true);
                  setSeenEvents(state.events.length);
                }}
              >
                <Activity size={20} aria-hidden />
                {unread > 0 && <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-brand-accent ring-2 ring-canvas" aria-hidden />}
              </button>
              <button type="button" className="btn btn-ghost" aria-label="Demo guide" title="Demo guide" onClick={() => setGuideOpen(true)}>
                <CircleHelp size={20} aria-hidden />
              </button>
              <Link href="/" className="btn btn-ghost hidden sm:inline-flex lg:hidden" aria-label="Home">
                <House size={20} aria-hidden />
              </Link>
            </div>
          </div>
          {/* Mobile nav */}
          <nav aria-label="Project (mobile)" className="flex gap-1 overflow-x-auto px-4 pb-2 lg:hidden">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                aria-current={n.href === pathname ? "page" : undefined}
                className={clsx(
                  "t-label inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3",
                  n.href === pathname ? "bg-ink text-white" : "bg-surface-tint text-ink",
                )}
              >
                <n.Icon size={14} aria-hidden /> {n.label}
                {!!n.count && <span className="rounded-full bg-brand-accent px-1.5 text-navy">{n.count}</span>}
              </Link>
            ))}
          </nav>
        </header>

        {state.config.paypalMode === "simulated" && (
          <div className="t-body-sm flex items-center gap-2 border-b border-hairline bg-info-soft px-4 py-2 text-info sm:px-8">
            <FlaskConical size={16} aria-hidden className="shrink-0" />
            Running on the built-in PayPal simulator (same REST shapes, no sandbox keys set).
          </div>
        )}

        <main className="mx-auto w-full max-w-[1320px] px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>

      <ActivityDrawer open={activityOpen} onClose={() => setActivityOpen(false)} events={state.events} />
      <JudgeGuide open={guideOpen} onClose={() => setGuideOpen(false)} config={state.config} base={base} />
      <Modal open={resetOpen} onClose={() => setResetOpen(false)} labelledBy="reset-title" width={480}>
        <div className="flex flex-col gap-4 p-8">
          <h2 id="reset-title" className="t-title-lg">
            Reset the demo?
          </h2>
          <p className="t-body-sm text-ink-muted">
            This wipes every change request, invoice, payment and payout, re-seeds the Acme Bakery project and issues a fresh Milestone 2
            invoice.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" size="lg" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="lg" loading={resetting} onClick={reset}>
              Reset demo
            </Button>
          </div>
        </div>
      </Modal>
    </Ctx.Provider>
  );
}

/** Shared page header: eyebrow, title, plain-language description, optional actions. */
export function PageHeader({
  eyebrow,
  title,
  children,
  actions,
}: {
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <div className="eyebrow mb-2 text-brand">{eyebrow}</div>
        <h1 className="t-headline">{title}</h1>
        {children && <p className="t-body-lg mt-2 text-ink-muted">{children}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
