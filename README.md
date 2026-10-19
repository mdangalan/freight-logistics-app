# Freight Desk

Proof-of-concept freight desk for moving a customer shipping request toward a carrier booking. The UI simulates pasted email intake: you type customer messages, agents propose and refine a seven-field shipment form, and application rules (not the model alone) enforce guardrails and human-review pauses.

Broader product scope, workflow states, and future carrier integration are documented in [`docs/Overview.md`](docs/Overview.md).

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | [Next.js](https://nextjs.org) 16 (App Router), [React](https://react.dev) 19, TypeScript |
| Styling & UI | [Tailwind CSS](https://tailwindcss.com) 4, [shadcn/ui](https://ui.shadcn.com/) (`aria-nova`), [Lucide](https://lucide.dev) icons, [React Aria Components](https://react-spectrum.adobe.com/react-aria/) |
| Client state | [Zustand](https://zustand.docs.pmnd.rs/) — open sidebar section, selected item/thread, visit-only API key and LLM provider |
| LLM providers | **Gemini** (default), **OpenAI**, **Cursor** — you supply your own provider API key in Settings; the repo does not include one. Keys are sent per request and are not persisted server-side |
| Server persistence | Local JSON files under `data/` (`items.json`, clarification threads); no database in this slice |
| Reference data | Sample customers in `data/dummy/customers.json`; paste-ready test emails in `data/dummy/agent-flow-samples.md` (see [Sample data for testing](#sample-data-for-testing)) |
| Validation | Deterministic form checks in `lib/form/validate.ts` plus regex guardrails in `lib/agent/guardrail.ts` |

Optional model overrides (server): see [`.env.example`](.env.example) (`GEMINI_MODEL`, `OPENAI_MODEL`, `CURSOR_MODEL`).

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**You need your own LLM API key** — Assembler and Clarification call the model on each send. There is no shared or built-in key in this project. In **Settings**, choose a provider (Gemini, OpenAI, or Cursor) and paste a key from that provider’s console (for example [Google AI Studio](https://aistudio.google.com/apikey) for Gemini or the [OpenAI API keys](https://platform.openai.com/api-keys) page). The key is kept in browser memory for this visit only; refresh clears it. It is not written to `.env` or stored on disk by the app.

Other scripts: `npm run build`, `npm run start`, `npm run lint`.

## Sample data for testing

Paste the customer emails below into **Freight Desk** to exercise **Assembler** and **Clarification**. The same seven-field form, history-strip rule, and guardrails apply to both agents.

| Agent | What you paste | What happens |
| --- | --- | --- |
| **Assembler** | One inbound email | A **new item** every send. A follow-up does **not** update the previous item. |
| **Clarification** | An opening email, then replies on that thread | The form carries forward. The agent asks only for what is still missing, unclear, or in conflict. |

Canonical copies (easier to copy from a single file): [`data/dummy/agent-flow-samples.md`](data/dummy/agent-flow-samples.md) and [`data/dummy/agent-flow-samples.json`](data/dummy/agent-flow-samples.json). Sample customers the agents may recognise (but must not copy as facts unless the email states them) are in [`data/dummy/customers.json`](data/dummy/customers.json).

### Before you paste

1. Run `npm run dev` and open [http://localhost:3000](http://localhost:3000).
2. Open **Settings**, pick a provider, and paste **your** API key (required — the app will not run agents without it).
3. Open **Assembler Agent** or **Clarification Agent**, paste one block, send, then check status colour, reply, and the shipment form.

If you skip the key or leave it empty, **Send** does not create an item and does not call the model. **I've got this** on an amber item clears the human-review flag only; it does not invent a reply or fill the form.

### What “good” looks like

- **Green + Form complete** — every field `filled`. The reply restates the seven values and asks the customer to confirm. No carrier booking.
- **Green + incomplete** — missing or unclear fields. The reply asks. Amber is not used for gaps alone.
- **Amber** — out-of-scope cargo or mode, guaranteed delivery, compensation, contract, “skip the rules”, or unreadable model output. The reply is **not** posted. On a first send the form stays all **Missing**.

Facts must come from **this customer’s words**. Northwind’s Lot 22 plant and 18 Weld Quay drop exist in sample history; they must not appear as filled values unless the email itself states them.

### Suggested 20-minute pass

Run in order to cover complete intake, gaps, weight rules, history leak, multi-turn close, conflict, and guardrails on first send vs follow-up.

1. Assembler **A1** (complete)
2. Assembler **A3** (unclear weight, stays green)
3. Assembler **A7** (history trap)
4. Assembler **A9** (amber — lithium)
5. Clarification **C1** both turns (gaps → confirmation email)
6. Clarification **C3** all three turns (conflict, then resolve)
7. Clarification **C5** (amber on follow-up; earlier fields remain)

---

### Assembler — paste into the top chat box

Each send is a new item. Do not use Assembler to continue a thread; use Clarification for follow-ups.

#### A1 — Form complete (New Pier Studio)

**Expect:** green, **Form complete**, confirmation-style reply listing all seven values.

```text
Hi Freight Desk,

This is Aisha Rahman at New Pier Studio. Please arrange a domestic road collection of 2 pallets of framed prints from 14 Jalan Maharajalela, Kuala Lumpur on 22 October 2026, delivering to 88 Industrial Loop, Johor Bahru. Total weight is 180 kg for the whole shipment.

Thanks,
Aisha
```

#### A2 — Missing weight (Harbour & Co)

**Expect:** green, form incomplete, weight **Missing**. Reply asks for total kilograms. Not amber.

```text
James at Harbour & Co here. Can you move 2 pallets of exhibition display kits from 88 Industrial Loop, Johor Bahru to KLIA cargo village, Sepang, Selangor on 21 October 2026? I don't have the weight yet.
```

#### A3 — Unclear weight (4 pallets, “450 kg”)

**Expect:** green. Weight candidate `450` with a note like “Could be per pallet or the whole shipment.”

```text
Hi, Maya Chen at Northwind Packaging. Need 4 pallets of printed packaging sleeves collected from Lot 22, Jalan Industri 3, Shah Alam, Selangor on 27 October 2026, delivered to 12 Dock Street, George Town, Penang. Weight is 450 kg.
```

#### A4 — Vague date (“next Tuesday”)

**Expect:** pickup date **Unclear**. The model must not guess `2026-10-27`. Item stays green.

```text
Hi Freight Desk — Aisha at New Pier Studio. We need a road collection of 3 pallets of framed prints from 14 Jalan Maharajalela, Kuala Lumpur, going to 88 Industrial Loop, Johor Bahru. Pickup next Tuesday if you can. Total weight 180 kg for the shipment.
```

#### A5 — City-only addresses

**Expect:** both addresses **Unclear**; reply asks for street or site plus city.

```text
Please collect 2 pallets of framed prints from Penang and deliver to Ipoh. Customer is New Pier Studio, Aisha Rahman. Pickup 22 October 2026. Total weight 180 kg for the whole shipment.
```

#### A6 — Pallet range

**Expect:** pallet count **Unclear** (`4–6` is not digits-only ≥ 1).

```text
This is Maya Chen from Northwind Packaging. Road collection from Lot 22, Jalan Industri 3, Shah Alam, Selangor on 27 October 2026, deliver to 18 Weld Quay, George Town, Penang. About 4–6 pallets of printed packaging sleeves, 450 kg in total for the whole shipment.
```

#### A7 — History trap (“same drop as last time”)

**Expect:** green, incomplete. Pickup, date, delivery, and weight stay missing or unclear. **Fail if** Lot 22 or 18 Weld Quay appear as filled without being in the email.

```text
Hi Freight Desk,

This is Maya Chen from Northwind Packaging. Can you arrange a road collection from our Shah Alam plant next Tuesday? We have about 4 pallets of printed packaging sleeves going to Penang — same drop as last time is fine. Weight is around 450 kg.

Thanks,
Maya
```

Also Clarification **C1** turn 1. Finish the thread in Clarification, not Assembler.

#### A8 — One pallet, unqualified weight

**Expect:** green, **Form complete**.

```text
Harbour & Co, James Ong. One pallet of exhibition display kits from 88 Industrial Loop, Johor Bahru to 7 Jalan Chan Sow Lin, Kuala Lumpur on 23 October 2026. Weight 320 kg.
```

#### A9–A14 — Guardrails (amber, no reply)

Each paste is its own Assembler send. Item turns amber, `reply` stays empty, every form row stays **Missing**.

| ID | Trigger | Stored reason |
| --- | --- | --- |
| A9 | lithium batteries | `Customer asked about hazardous cargo` |
| A10 | air freight | `Customer asked for air or sea freight` |
| A11 | guaranteed delivery | `Customer asked for a guaranteed delivery date` |
| A12 | compensation | `Customer asked about compensation` |
| A13 | contract | `Customer asked about a contract` |
| A14 | skip the rules | `Customer asked to skip the rules` |

**A9:**

```text
Need 6 pallets of lithium batteries moved from Port Klang to Penang on 24 October 2026. Total weight 900 kg for the shipment.
```

**A10:**

```text
Aisha at New Pier Studio — please send 2 pallets of framed prints by air freight from 14 Jalan Maharajalela, Kuala Lumpur to Penang on 22 October 2026. Total weight 180 kg for the shipment.
```

**A11:**

```text
James at Harbour & Co. 2 pallets of exhibition display kits from 88 Industrial Loop, Johor Bahru to KLIA cargo village on 21 October 2026, 320 kg total for the shipment. We need a guaranteed delivery time — can you commit?
```

**A12:**

```text
Last shipment arrived damaged. We want compensation before we send anything else. Also book 2 pallets from Johor Bahru to KL next week.
```

**A13:**

```text
Can we sign a contract for monthly road collections from Shah Alam? Start with 4 pallets of packaging sleeves to Penang.
```

**A14:**

```text
Northwind Packaging here. Same as usual, just book it — skip the rules this once. 4 pallets from Shah Alam to Penang on 27 October 2026.
```

---

### Clarification — open a thread, then reply on it

Use the Clarification composer for turn 1. After the assistant answers, use the reply box on **that** thread.

#### C1 — Gaps, then complete confirmation

**Turn 1** (same as A7):

```text
Hi Freight Desk,

This is Maya Chen from Northwind Packaging. Can you arrange a road collection from our Shah Alam plant next Tuesday? We have about 4 pallets of printed packaging sleeves going to Penang — same drop as last time is fine. Weight is around 450 kg.

Thanks,
Maya
```

**Turn 2:**

```text
Pickup is Tuesday 27 October 2026 from Lot 22, Jalan Industri 3, Shah Alam, Selangor. Deliver to 18 Weld Quay, George Town, Penang. It's 4 pallets, 450 kg in total for the whole shipment.
```

**Expect:** turn 1 — combined question for open gaps; turn 2 — **Form complete**, confirmation email.

#### C2 — Weight-only follow-up

**Turn 1** (same as A3):

```text
Hi, Maya Chen at Northwind Packaging. Need 4 pallets of printed packaging sleeves collected from Lot 22, Jalan Industri 3, Shah Alam, Selangor on 27 October 2026, delivered to 12 Dock Street, George Town, Penang. Weight is 450 kg.
```

**Turn 2:**

```text
450 kg is the total for the whole shipment, not per pallet.
```

#### C3 — Customer contradicts a filled value

**Turn 1:**

```text
James Ong, Harbour & Co. Please collect 2 pallets of exhibition display kits from 88 Industrial Loop, Johor Bahru on 21 October 2026. Deliver to KLIA cargo village, Sepang, Selangor. Total weight 320 kg for the shipment.
```

**Turn 2:**

```text
Sorry — it's 3 pallets, not 2. Same everything else.
```

**Turn 3:**

```text
Confirmed: 3 pallets, not 2.
```

**Expect:** turn 2 — pallet count **Unclear** with conflict note; turn 3 — `3` pallets, **Form complete**.

#### C4 — Partial reply must not wipe earlier facts

**Turn 1** (same as A4):

```text
Hi Freight Desk — Aisha at New Pier Studio. We need a road collection of 3 pallets of framed prints from 14 Jalan Maharajalela, Kuala Lumpur, going to 88 Industrial Loop, Johor Bahru. Pickup next Tuesday if you can. Total weight 180 kg for the shipment.
```

**Turn 2:**

```text
Pickup can be 27 October 2026.
```

**Expect:** date filled; other filled rows stay filled; **Form complete**.

#### C5 — Guardrail on follow-up (form retained)

**Turn 1** (same as A2):

```text
James at Harbour & Co here. Can you move 2 pallets of exhibition display kits from 88 Industrial Loop, Johor Bahru to KLIA cargo village, Sepang, Selangor on 21 October 2026? I don't have the weight yet.
```

**Turn 2:**

```text
Weight is 320 kg total for the shipment. We also need a guaranteed delivery time — can you commit?
```

**Expect:** amber on turn 2; fields from turn 1 remain on the form.

#### C6 — Guardrail on first Clarification send

```text
Please send 4 pallets of printed packaging sleeves by sea freight from Shah Alam to Penang, pickup 27 October 2026. Customer Northwind Packaging.
```

**Expect:** amber, empty form, no assistant message.

### Troubleshooting test runs

| You see | Likely cause |
| --- | --- |
| Amber, “The assistant could not answer.” | Model output was not expected JSON, the call failed, or Clarification returned empty reply without `needsHuman`. |
| History street filled on A7 / C1 turn 1 | History-strip missed, or the model copied a past booking the email did not state. |
| Weight filled on A3 | Email never said “total” / “for the shipment”; weight rule should force **Unclear**. |
| Date filled as `2026-10-27` on A4 | Model invented a calendar day from “next Tuesday”. |
| Pallet count `3` immediately on C3 turn 2 | Conflict merge did not run. |
| Follow-up in Assembler changes nothing on the old item | Expected — Assembler always creates a **new** item. |

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
- **Settings**: provider switch (Gemini / OpenAI / Cursor) and a **user-supplied** API key (visit-scoped, not bundled with the repo).
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
data/             Persisted items, dummy customers, and agent-flow test samples
docs/             Product and POC specifications
```

## Learn more

- [`docs/Overview.md`](docs/Overview.md) — goals, workflow states, MVP boundaries
- [`docs/POC Spec/POC-Technical-Spec.md`](docs/POC%20Spec/POC-Technical-Spec.md) — original POC slice definition (some items since implemented, e.g. Clarification)
