import type { InvoiceDTO, PayoutBatchDTO, ProjectState } from "@/lib/api-types";
import { formatUSD } from "@/lib/domain/money";

export const JOURNEY_STEPS = [
  { title: "Price the request", hint: "AI reads the client's message" },
  { title: "Client pays", hint: "PayPal checkout" },
  { title: "Work unlocks", hint: "Locked tasks open up" },
  { title: "Pay the team", hint: "PayPal Payouts" },
] as const;

export interface NextAction {
  title: string;
  body: string;
  cta: string;
  href: string;
}

export interface Journey {
  /** 0-based index into JOURNEY_STEPS; 4 means the whole story is done. */
  step: number;
  order?: InvoiceDTO;
  batch?: PayoutBatchDTO;
  next: NextAction;
}

/** Where the latest change order is in the story, so every page can say what to do next. */
export function journey(state: ProjectState): Journey {
  const base = `/projects/${state.project.id}`;
  const order = [...state.invoices]
    .filter((i) => i.kind === "change_order" && !i.seeded)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const batch = order ? state.payoutBatches.find((b) => b.invoiceId === order.id) : undefined;

  let step = 0;
  if (order && order.status !== "DRAFT") step = 1;
  if (order?.status === "PAID") step = 3;
  if (batch?.status === "SUCCESS") step = 4;

  const unlocked = order ? state.tasks.filter((t) => t.source === "change_order" && t.changeOrderId === order.refId).length : 0;

  let next: NextAction;
  if (step === 0) {
    next = {
      title: `${state.project.clientName} asked for extra work`,
      body: "Paste their message. The AI lists the new work, the app prices it from your rate card, and one click sends a PayPal invoice.",
      cta: "Price the request",
      href: `${base}/requests`,
    };
  } else if (step === 1 && order) {
    next = {
      title: `Invoice #${order.invoiceNumber} for ${formatUSD(order.totalCents)} is waiting`,
      body: `Switch to ${state.project.clientName}'s view and pay it with PayPal. The new tasks stay locked on the timeline until then.`,
      cta: "Pay as the client",
      href: `/pay/${order.id}`,
    };
  } else if (step === 3 && order) {
    next = batch
      ? {
          title: "Payout on its way",
          body: "PayPal is processing the batch. Each contractor gets their share in a moment.",
          cta: "View payout",
          href: `${base}/team`,
        }
      : {
          title: `Paid! ${unlocked || "New"} task${unlocked === 1 ? "" : "s"} unlocked`,
          body: `${state.project.clientName} paid ${formatUSD(order.totalCents)} and the work is open. Now send each contractor their share.`,
          cta: "Pay the team",
          href: `${base}/team`,
        };
  } else {
    next = {
      title: "Done: priced, paid and paid out",
      body: "The extra work was invoiced, collected and split to the team in minutes. Try another client message, or reset the demo.",
      cta: "New request",
      href: `${base}/requests`,
    };
  }
  return { step, order, batch, next };
}
