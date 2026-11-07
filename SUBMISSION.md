# ScopeLock: hackathon submission

**Build What's Next with PayPal and AI**

- Code: https://github.com/Shambhavi500/ScopeLock
- Live demo: https://scopelock-536j.onrender.com (free tier, so the first load after a quiet spell can take about a minute)
- Demo video: _add the YouTube or Drive link after uploading `video/scopelock-demo.mp4`_

## One line

ScopeLock turns a client's "can you also add..." message into a priced PayPal invoice, keeps the extra work locked until it's paid, then splits the payment to the team with PayPal Payouts.

## The problem

Small agencies and freelancers work on fixed-price projects. Clients keep asking for small extras in email or chat. Pricing each one, invoicing it and chasing payment takes time, so the work often gets done for free. When the client does pay, someone still has to split the money between the contractors by hand.

## What it does

1. **Reads the request.** The agency pastes the client's message. Gemini 2.5 Flash lists the new work items, with the client's exact words for each one and a confidence score. Items it can't tie to a quote are dropped.
2. **Prices and invoices it.** Code prices every item from the project's hourly rate card. The agency reviews and edits the items, sees how far launch moves, and sends a PayPal invoice in one click. The new tasks appear on the timeline, locked.
3. **Collects payment.** The client opens a clear, itemized pay page and pays with PayPal. A declined card is handled cleanly and can be retried. Duplicate payments are blocked.
4. **Unlocks the work.** As soon as PayPal captures the payment, the invoice is marked paid and the locked tasks open up.
5. **Pays the team.** Six safety checks run, then one click sends a PayPal Payouts batch that splits the payment between three contractors. The agency keeps its margin, and every amount adds up to the cent.
6. **Keeps a record.** A money log lists every invoice, payment and payout with its PayPal reference ID, with search, a plain-English filter and CSV export.

## How we use PayPal

| API | Used for |
|---|---|
| Invoicing v2 | Creating, sending, reminding and syncing milestone and change-order invoices |
| Orders v2 | Creating and capturing the order on the server |
| JS SDK v6 | The PayPal button on the client's pay page |
| Payouts v1 | Splitting each payment between contractors |

Every PayPal request carries a `PayPal-Request-Id` built from our own record IDs, so retries never double-charge or double-pay. The declined-card path uses PayPal's `PayPal-Mock-Response` header in the sandbox.

## How we use AI, and where we don't

Gemini only reads the client's message and drafts payment reminders. It never sets a price, picks a payout amount, calls PayPal or approves anything. The client's message is treated as untrusted input, and the model's output is checked against a schema before anything uses it. If Gemini is unavailable, a rule-based reader takes over and the screen says so.

## Built with

Next.js, React, TypeScript, Tailwind CSS, SQLite with Drizzle ORM, Zod, the Vercel AI SDK, Google Gemini 2.5 Flash, PayPal REST APIs, SVAR Gantt, AG Grid, Vitest and Playwright. Hosted on Render.

## Trying it

Open the live demo and click **Try the live demo**. A guide on every screen shows the next step. The whole loop takes about three minutes. Everything runs in the PayPal sandbox, so no real money moves, and **Reset demo** in the sidebar restores the starting state.
