"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ProjectState } from "@/lib/api-types";
import { CopyId, Modal } from "./ui";

const STEPS = [
  { title: "Price the client's request", body: "Open Change requests, pick a sample message and click Analyze. Check the items, then click Create invoice & send.", path: "/requests" },
  { title: "Pay as the client", body: 'Open the client view. Turn on "Simulate declined card" to see a failed payment and the retry, then pay with PayPal.', path: "/invoices" },
  { title: "Watch the work unlock", body: "Back on the Overview, the locked tasks open up on the timeline and the money log shows the payment.", path: "" },
  { title: "Pay the team", body: "Open Pay the team. When all six checks pass, click Pay contractors and PayPal Payouts splits the money.", path: "/team" },
];

export function JudgeGuide({
  open,
  onClose,
  config,
  base,
}: {
  open: boolean;
  onClose: () => void;
  config: ProjectState["config"];
  base: string;
}) {
  return (
    <Modal open={open} onClose={onClose} labelledBy="guide-title">
      <div className="hero-bg p-8 text-white">
        <div className="eyebrow text-brand-accent">Demo guide</div>
        <h2 id="guide-title" className="t-display-lg mt-2">
          The whole story in <span className="text-brand-accent">3 minutes</span>
        </h2>
        <p className="t-body-lg mt-3 text-white/85">
          You run a small agency. Your client keeps asking for &quot;just one more thing&quot;. ScopeLock makes sure every extra gets priced, paid and
          shared with your team.
        </p>
      </div>
      <div className="flex flex-col gap-6 p-8">
        <ol className="flex flex-col gap-3">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <Link href={`${base}${s.path}`} onClick={onClose} className="card-hover flex gap-4 rounded-md border border-hairline p-4">
                <span className="t-label flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-white">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-bold">{s.title}</div>
                  <div className="t-body-sm text-ink-muted">{s.body}</div>
                </div>
                <ArrowRight size={18} className="mt-1 shrink-0 text-ink-subtle" aria-hidden />
              </Link>
            </li>
          ))}
        </ol>

        <div className="rounded-sm bg-surface-sunken p-4">
          <div className="t-label mb-2">{config.paypalMode === "sandbox" ? "PayPal sandbox buyer login (fake test account)" : "PayPal mode"}</div>
          {config.paypalMode === "sandbox" ? (
            config.buyerEmail ? (
              <div className="t-body-sm flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  Email: <CopyId value={config.buyerEmail} max={40} />
                </div>
                {config.buyerPassword && (
                  <div className="flex items-center gap-2">
                    Password: <CopyId value={config.buyerPassword} max={40} />
                  </div>
                )}
              </div>
            ) : (
              <p className="t-body-sm">Use any PayPal sandbox personal account.</p>
            )
          ) : (
            <p className="t-body-sm">
              Running on the built-in PayPal simulator (no sandbox keys configured). Every call follows the real REST shapes; add sandbox keys to
              hit PayPal for real.
            </p>
          )}
        </div>

        <button type="button" className="btn btn-primary btn-lg self-start" onClick={onClose}>
          Got it <ArrowRight size={20} aria-hidden />
        </button>
      </div>
    </Modal>
  );
}
