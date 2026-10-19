# Sample data — Assembler and Clarification

Paste these customer emails into the Freight Desk to exercise the two agents that are built.

The same seven-field form, the same history-strip rule, and the same guardrails sit behind both screens. The difference is the conversation shape:

| Agent | What you paste | What happens |
| --- | --- | --- |
| **Assembler** | One inbound email | A **new item** every send. A follow-up sentence does **not** update the previous item. |
| **Clarification** | An opening email, then replies on that thread | The form carries forward. The agent asks only for what is still missing, unclear, or in conflict. |

The machine-readable copy of every paste block is [`agent-flow-samples.json`](./agent-flow-samples.json). Sample customers the agents can recognise (but must not copy as facts) live in [`customers.json`](./customers.json).

## Before you start

1. Run the app (`npm run dev` in `freight-logistics-app/`).
2. Open **Settings**, pick a provider, and type an API key for this visit.
3. Open **Assembler Agent** or **Clarification Agent**.
4. Paste one block, send, then check the colour, the reply, and the shipment form.

If the key is empty, Send does not create an item and does not call the model.

**I've got this** on an amber item clears the flag only. It does not invent a reply or fill the form.

## What “good” looks like

- **Green + Form complete** — every field `filled`. The reply restates the seven values and asks the customer to confirm. Nobody books a carrier.
- **Green + incomplete** — missing or unclear fields. The reply asks. Amber is not for gaps.
- **Amber** — out-of-scope cargo or mode, a guarantee, compensation, a contract, “skip the rules”, or unreadable model output. The reply is **not** posted. On a first send the form stays all **Missing**.

Facts must come from **this customer’s words**. Northwind’s Lot 22 plant and 18 Weld Quay drop exist in sample history. They must not appear as filled values unless the email itself states them.

---

## Suggested 20-minute pass

Run these in order. That covers complete, gap, weight rule, history leak, multi-turn close, conflict, and both guardrail timings.

1. Assembler **A1** (complete)
2. Assembler **A3** (unclear weight, stays green)
3. Assembler **A7** (history trap)
4. Assembler **A9** (amber — lithium)
5. Clarification **C1** both turns (gaps → confirmation email)
6. Clarification **C3** all three turns (conflict, then resolve)
7. Clarification **C5** (amber on the follow-up; earlier fields remain)

---

## Assembler — paste into the top chat box

Each send is a new item. Use a fresh paste; do not try to “reply” on an Assembler item.

### A1 — Form complete (New Pier Studio)

New Pier has no bookings, so a complete form here cannot be a history leak.

**Expect:** green, **Form complete**, confirmation-style reply listing all seven values.

```text
Hi Freight Desk,

This is Aisha Rahman at New Pier Studio. Please arrange a domestic road collection of 2 pallets of framed prints from 14 Jalan Maharajalela, Kuala Lumpur on 22 October 2026, delivering to 88 Industrial Loop, Johor Bahru. Total weight is 180 kg for the whole shipment.

Thanks,
Aisha
```

| Field | Status |
| --- | --- |
| Customer name | filled — Aisha Rahman / New Pier Studio |
| Pickup | filled — 14 Jalan Maharajalela, Kuala Lumpur |
| Pickup date | filled — 22 October 2026 (or `2026-10-22`) |
| Delivery | filled — 88 Industrial Loop, Johor Bahru |
| Goods | filled — framed prints |
| Pallets | filled — `2` |
| Weight | filled — `180` (the email says **total** / **whole shipment**) |

### A2 — Missing weight (Harbour & Co)

**Expect:** green, form incomplete, weight **Missing**. Reply asks for the total kilograms. This is not amber.

```text
James at Harbour & Co here. Can you move 2 pallets of exhibition display kits from 88 Industrial Loop, Johor Bahru to KLIA cargo village, Sepang, Selangor on 21 October 2026? I don't have the weight yet.
```

### A3 — Unclear weight (4 pallets, “450 kg”)

The server’s weight rule, not the model, is the authority here. More than one pallet plus a bare kilogram figure stays **Unclear**.

**Expect:** green. Weight candidate `450` with a note like “Could be per pallet or the whole shipment.”

```text
Hi, Maya Chen at Northwind Packaging. Need 4 pallets of printed packaging sleeves collected from Lot 22, Jalan Industri 3, Shah Alam, Selangor on 27 October 2026, delivered to 12 Dock Street, George Town, Penang. Weight is 450 kg.
```

`12 Dock Street` is **not** in sample history. If it fills, it came from this email.

### A4 — Vague date (“next Tuesday”)

**Expect:** pickup date **Unclear**. The model must not guess `2026-10-27`. Item stays green.

```text
Hi Freight Desk — Aisha at New Pier Studio. We need a road collection of 3 pallets of framed prints from 14 Jalan Maharajalela, Kuala Lumpur, going to 88 Industrial Loop, Johor Bahru. Pickup next Tuesday if you can. Total weight 180 kg for the shipment.
```

### A5 — City-only addresses

“Penang” and “Ipoh” are too short for the server’s address rule (needs 8+ characters and a letter). Even if the model marks them filled, the form should show **Unclear**.

**Expect:** both addresses unclear; reply asks for street or site plus city.

```text
Please collect 2 pallets of framed prints from Penang and deliver to Ipoh. Customer is New Pier Studio, Aisha Rahman. Pickup 22 October 2026. Total weight 180 kg for the whole shipment.
```

### A6 — Pallet range

**Expect:** pallet count **Unclear** (`4–6` is not digits-only ≥ 1). Weight can fill because the email says **in total for the whole shipment**.

```text
This is Maya Chen from Northwind Packaging. Road collection from Lot 22, Jalan Industri 3, Shah Alam, Selangor on 27 October 2026, deliver to 18 Weld Quay, George Town, Penang. About 4–6 pallets of printed packaging sleeves, 450 kg in total for the whole shipment.
```

### A7 — History trap (“same drop as last time”)

Northwind’s sample bookings include Lot 22, Shah Alam and 18 Weld Quay, Penang. This email names the customer and the cities, not those streets.

**Expect:** green, incomplete. Pickup, date, delivery, and weight stay missing or unclear. **Fail if** Lot 22 or 18 Weld Quay appear as filled values.

```text
Hi Freight Desk,

This is Maya Chen from Northwind Packaging. Can you arrange a road collection from our Shah Alam plant next Tuesday? We have about 4 pallets of printed packaging sleeves going to Penang — same drop as last time is fine. Weight is around 450 kg.

Thanks,
Maya
```

This opening is also turn 1 of Clarification **C1**. Assembler will not continue it; switch to Clarification to finish the thread.

### A8 — One pallet, unqualified weight

With exactly one pallet, per-pallet and total are the same number, so `320 kg` may stay **filled** without the word “total”.

**Expect:** green, **Form complete**.

```text
Harbour & Co, James Ong. One pallet of exhibition display kits from 88 Industrial Loop, Johor Bahru to 7 Jalan Chan Sow Lin, Kuala Lumpur on 23 October 2026. Weight 320 kg.
```

`7 Jalan Chan Sow Lin` is a Northwind drop in history, but it is also written in this Harbour email, so filling it is allowed.

### A9–A14 — Guardrails (amber, no reply)

Paste each as its own Assembler send. The item turns amber, `reply` stays empty, and every form row stays **Missing**. Reason strings below are the ones the app stores.

**A9 — lithium (hazardous)** — reason: `Customer asked about hazardous cargo`

```text
Need 6 pallets of lithium batteries moved from Port Klang to Penang on 24 October 2026. Total weight 900 kg for the shipment.
```

**A10 — air freight** — reason: `Customer asked for air or sea freight`

```text
Aisha at New Pier Studio — please send 2 pallets of framed prints by air freight from 14 Jalan Maharajalela, Kuala Lumpur to Penang on 22 October 2026. Total weight 180 kg for the shipment.
```

**A11 — guaranteed delivery** — reason: `Customer asked for a guaranteed delivery date`

```text
James at Harbour & Co. 2 pallets of exhibition display kits from 88 Industrial Loop, Johor Bahru to KLIA cargo village on 21 October 2026, 320 kg total for the shipment. We need a guaranteed delivery time — can you commit?
```

**A12 — compensation** — reason: `Customer asked about compensation`

```text
Last shipment arrived damaged. We want compensation before we send anything else. Also book 2 pallets from Johor Bahru to KL next week.
```

**A13 — contract** — reason: `Customer asked about a contract`

```text
Can we sign a contract for monthly road collections from Shah Alam? Start with 4 pallets of packaging sleeves to Penang.
```

**A14 — skip the rules** — reason: `Customer asked to skip the rules`

```text
Northwind Packaging here. Same as usual, just book it — skip the rules this once. 4 pallets from Shah Alam to Penang on 27 October 2026.
```

After an amber item, click **I've got this** if you want to confirm the flag clears without adding a reply.

---

## Clarification — open a thread, then reply on it

Use the Clarification composer for turn 1. After the assistant answers, use the reply box on **that** thread. Do not paste follow-ups into Assembler.

### C1 — Gaps, then a complete confirmation

**Turn 1** — same text as Assembler A7.

```text
Hi Freight Desk,

This is Maya Chen from Northwind Packaging. Can you arrange a road collection from our Shah Alam plant next Tuesday? We have about 4 pallets of printed packaging sleeves going to Penang — same drop as last time is fine. Weight is around 450 kg.

Thanks,
Maya
```

**Expect:** one combined question covering the open gaps (Shah Alam street, calendar date, Penang street, total vs per-pallet). History streets stay unfilled. Status **Awaiting customer**.

**Turn 2** — reply on the same thread:

```text
Pickup is Tuesday 27 October 2026 from Lot 22, Jalan Industri 3, Shah Alam, Selangor. Deliver to 18 Weld Quay, George Town, Penang. It's 4 pallets, 450 kg in total for the whole shipment.
```

**Expect:** **Form complete**. Reply restates all seven values and asks Maya to confirm. It must not re-ask the gaps that this message closed.

Lot 22 and 18 Weld Quay may fill **now**, because Maya just wrote them.

### C2 — Weight-only follow-up

**Turn 1** — same text as Assembler A3.

```text
Hi, Maya Chen at Northwind Packaging. Need 4 pallets of printed packaging sleeves collected from Lot 22, Jalan Industri 3, Shah Alam, Selangor on 27 October 2026, delivered to 12 Dock Street, George Town, Penang. Weight is 450 kg.
```

**Expect:** only weight is unclear. The question is only about 450 kg.

**Turn 2:**

```text
450 kg is the total for the whole shipment, not per pallet.
```

**Expect:** weight filled, **Form complete**, confirmation email. Addresses and date are not asked again.

### C3 — Customer contradicts a filled value

**Turn 1** — this email is already complete:

```text
James Ong, Harbour & Co. Please collect 2 pallets of exhibition display kits from 88 Industrial Loop, Johor Bahru on 21 October 2026. Deliver to KLIA cargo village, Sepang, Selangor. Total weight 320 kg for the shipment.
```

**Expect:** **Form complete**, confirmation of **2** pallets.

**Turn 2:**

```text
Sorry — it's 3 pallets, not 2. Same everything else.
```

**Expect:** still green. Pallet count **Unclear**, with a note that it conflicts with the earlier value `2`. Other fields stay filled. Reply asks which count is correct. It does not silently keep 2 or switch to 3.

**Turn 3:**

```text
Confirmed: 3 pallets, not 2.
```

**Expect:** pallet count filled `3`, **Form complete**, confirmation email now using 3.

### C4 — Partial reply must not wipe earlier facts

**Turn 1** — same text as Assembler A4 (date is “next Tuesday”).

```text
Hi Freight Desk — Aisha at New Pier Studio. We need a road collection of 3 pallets of framed prints from 14 Jalan Maharajalela, Kuala Lumpur, going to 88 Industrial Loop, Johor Bahru. Pickup next Tuesday if you can. Total weight 180 kg for the shipment.
```

**Turn 2** — answer **only** the date:

```text
Pickup can be 27 October 2026.
```

**Expect:** date filled. Pickup, delivery, goods, pallets, and weight stay filled. **Form complete**. Fail if any previously filled row goes back to Missing.

### C5 — Guardrail on a follow-up (keep the form)

**Turn 1** — same text as Assembler A2 (weight missing).

```text
James at Harbour & Co here. Can you move 2 pallets of exhibition display kits from 88 Industrial Loop, Johor Bahru to KLIA cargo village, Sepang, Selangor on 21 October 2026? I don't have the weight yet.
```

**Expect:** green, weight missing, five or six other fields filled.

**Turn 2:**

```text
Weight is 320 kg total for the shipment. We also need a guaranteed delivery time — can you commit?
```

**Expect:** amber, reason `Customer asked for a guaranteed delivery date`, **no** new assistant bubble. Fields gathered on turn 1 must still be on the form (a failed follow-up does not reset the record the way a failed first send does). **I've got this** clears amber without adding a reply.

### C6 — Guardrail on the first Clarification send

```text
Please send 4 pallets of printed packaging sleeves by sea freight from Shah Alam to Penang, pickup 27 October 2026. Customer Northwind Packaging.
```

**Expect:** amber, reason `Customer asked for air or sea freight`, empty form, no assistant message.

---

## How to read a failure

| You see | Likely cause |
| --- | --- |
| Amber, “The assistant could not answer.” | Model output was not the expected JSON, the call failed, or (Clarification) `needsHuman` was false with an empty reply. |
| History street filled on A7 / C1 turn 1 | History-strip missed, or the model copied a past booking the email did not state. |
| Weight filled on A3 | The email never said “total” / “for the shipment”, so the weight rule should have forced **Unclear**. |
| Date filled as `2026-10-27` on A4 | The model invented a calendar day from “next Tuesday”. |
| Pallet count filled `3` immediately on C3 turn 2 | Conflict merge did not run; the agent silently picked the new number. |
| Follow-up in Assembler “updates” nothing on the old item | Expected. Assembler always creates a **new** item. Use Clarification for threads. |
| Amber on A2 / A3 / A4 | A gap is not a guardrail. If this happens, the model set `needsHuman` without an out-of-scope phrase. |
