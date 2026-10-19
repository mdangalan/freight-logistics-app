# Freight Desk

Proof-of-concept freight desk for moving a customer shipping request toward a carrier booking. The UI simulates pasted email intake: you type customer messages, agents propose and refine a seven-field shipment form, and application rules (not the model alone) enforce guardrails and human-review pauses.

Broader product scope, workflow states, and future carrier integration are documented in [`docs/Overview.md`](docs/Overview.md).

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | [Next.js](https://nextjs.org) 16 (App Router), [React](https://react.dev) 19, TypeScript |
| Styling & UI | [Tailwind CSS](https://tailwindcss.com) 4, [shadcn/ui](https://ui.shadcn.com/) (`aria-nova`), [Lucide](https://lucide.dev) icons, [React Aria Components](https://react-spectrum.adobe.com/react-aria/) |
| Client state | [Zustand](https://zustand.docs.pmnd.rs/) — open sidebar section, selected item/thread, visit-only API key and LLM provider |
| LLM providers | **Gemini** (default), **OpenAI**, **Cursor** — selected in Settings; keys are sent per request and are not persisted server-side |
| Server persistence | Local JSON files under `data/` (`items.json`, clarification threads); no database in this slice |
| Reference data | Built-in sample customers and past bookings in `data/dummy/customers.json` (read-only; history is reference for name recognition, not auto-confirmed facts) |
| Validation | Deterministic form checks in `lib/form/validate.ts` plus regex guardrails in `lib/agent/guardrail.ts` |

Optional model overrides (server): see [`.env.example`](.env.example) (`GEMINI_MODEL`, `OPENAI_MODEL`, `CURSOR_MODEL`).

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Go to **Settings**, choose an LLM provider, and enter an API key for this browser visit only (refresh clears it).

Other scripts: `npm run build`, `npm run start`, `npm run lint`.

## Three agentic functions

The product splits work across three agents. Each agent has a narrow job: none of them book with a carrier or promise delivery in this POC.

### Assembler Agent — implemented

**Role:** Assemble customer-facing email only when the shipment information is complete.

- Accepts a **single pasted customer message** (simulated inbound email).
- Proposes a **seven-field shipment form**: customer name, pickup address, pickup date, delivery address, goods description, pallet count, total weight (kg).
- Each field is `filled`, `missing`, or `unclear`. Facts must come from the customer message; sample booking history must not be copied unless the message states the fact.
- When **every field is filled** and checks pass, the agent **assembles the outbound email**: plain-language restatement of the seven values and a request for the customer to confirm them.
- Does **not** book, quote carriers, or guarantee arrival dates.
- Trips **needs human review** (amber) for out-of-scope requests (e.g. hazardous cargo, air/sea freight, guaranteed dates, compensation, contracts, “skip the rules”), unreadable model output, or guardrail failures.

API: `POST /api/assembler`, `GET /api/assembler`, `PATCH /api/assembler/[id]` (clear human flag).

### Clarification Agent — implemented

**Role:** Clarify the order only while shipment details still need clarification.

- Runs **multi-turn threads** when missing, unclear, or **conflicting** fields remain on the form.
- Asks in one combined reply for everything still open; does not re-ask fields already filled unless the customer contradicts them.
- Uses the same seven-field form, validation, guardrails, and human-review rules as Assembler.
- When the form becomes **complete**, assembles the same style of **confirmation email** as Assembler (restate values, ask for confirmation).
- Does **not** book or return carrier quotes.

API: `POST /api/clarification`, `GET /api/clarification`, `POST /api/clarification/[id]`, `PATCH /api/clarification/[id]` (clear human flag).

### Booking Agent — not built yet

**Role:** When nothing else needs clarification, select an eligible carrier service and return a **quote** to the customer.

- Intended gate: shipment form complete, customer has confirmed facts, no open clarification or human-review hold.
- Out of scope for the current codebase: mock carrier APIs, price comparison, customer approval before submission, and booking submission/ retry handling (specified in `docs/features/`).

The sidebar **Booking Agent** section is a placeholder until this agent is implemented.

## Current capabilities (this repo)

- Single-page **Freight Desk** shell: sidebar for Assembler, Clarification, Booking, and Settings.
- **Assembler** and **Clarification** panels with item/thread lists, conversation timeline, live shipment form, and “I've got this” to clear human-review flags.
- **Settings**: provider switch (Gemini / OpenAI / Cursor) and visit-scoped API key.
- **Shipment form** UI with per-field status badges and form-level complete/incomplete indicator.
- **No** live email, attachments, database, carrier integrations, or working Booking agent.

## Project layout (high level)

```
app/              Next.js routes and API handlers
components/       Freight Desk UI and agent panels
lib/agent/        Prompts, LLM clients, guardrails, agent runners
lib/form/         Form catalog and validation
lib/items/        Assembler item JSON store
lib/clarification/ Clarification thread JSON store
data/             Persisted items and dummy customer data
docs/             Product and POC specifications
```

## Learn more

- [`docs/Overview.md`](docs/Overview.md) — goals, workflow states, MVP boundaries
- [`docs/POC Spec/POC-Technical-Spec.md`](docs/POC%20Spec/POC-Technical-Spec.md) — original POC slice definition (some items since implemented, e.g. Clarification)
