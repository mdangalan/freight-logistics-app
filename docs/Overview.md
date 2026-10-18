# Freight Desk

**Last updated:** 2026-10-18  
**Status:** Active

## Summary

Freight Desk helps a small freight forwarder move from an incomplete customer shipping request to a confirmed carrier booking. The MVP/assignment POC demonstrates a controlled workflow using pasted email intake, a simulated customer inbox, fictional customer history, two mock carrier APIs, AI-assisted preparation and clarification, explicit customer approval before submission, communication guardrails, and human review when automation must pause. Coordinators do not approve every routine booking—customer acceptance authorizes carrier submission.

## Goals

- Demonstrate end-to-end flow: **Received → Assessing → Clarifying / Awaiting customer → Ready for quotes → Awaiting customer approval → Submitting → Confirmed**, with **Needs human review** and rejection paths.
- Reduce staff effort per accurate booking by automating routine assembly, clarification, and carrier form mapping while staff handle exceptions.
- Give customers conversational email-style interaction, clear control over service and price, and separate approval of shipment facts vs booking commitment.
- Validate the case-study hypothesis (incomplete new-customer requests drive delay and rework) through observation and POC control tests—not as a production reliability claim.

## Constraints

- **Timeline:** Assignment deadline and delivery estimates provisional (not confirmed in baseline).
- **Budget:** Not specified.
- **Team:** Implementation capacity open; roles implied: booking coordinator, customer service representative, customer (simulated), engineering.
- **Stack (current):** Next.js 16 app scaffold in `freight-logistics-app/`. The first POC calls OpenAI through the official `openai` package (`responses.create`, model `gpt-6-astra` unless `OPENAI_MODEL` is set) with `OPENAI_API_KEY` on the server. Persistence for that slice is a local JSON file. Hosting and the fuller agent architecture stay open.
- **First build slice:** [POC technical spec](POC%20Spec/POC-Technical-Spec.md) — simulated inbox, multiple email threads, chat-style paste, one human-review color, one guardrail, and a fixed seven-item shipment form the assistant fills and the app checks. A completed form is the end of this slice. Full booking, carriers, history, and the separate assembler stay specified in `docs/features/` and are not in this first build.
- **POC boundaries:** Domestic road freight, non-hazardous palletized goods, one shipment per inquiry; simulated email and carriers; no live email, attachments, payments, or post-booking tracking.

## Notion

- **Page name:** Freight Desk
- **Page URL:** —
- **Last synced:** Not yet synced
- **Pending sync:** Yes

## Scope

### In scope (MVP / POC)

- Three agentic functions: **Assembler**, **Clarification**, **Booking** (may be one orchestrator in implementation).
- Single persistent **shipment record** with provenance per material value (provided, from history proposed, confirmed, unresolved/conflicting).
- Pasted email conversation intake; simulated inbox for agent and customer messages.
- Fictional customer profiles and booking history; history proposes—not confirms—current facts.
- Two mock carrier APIs with different requirements, prices, and availability.
- Lowest total-priced eligible service recommendation; customer approval before submission.
- Estimated arrival disclosed; not guaranteed.
- Communication guardrails enforced in application rules (not model-only).
- Human review: pause, explain, staff resolve, explicit release, revalidate before automation resumes.
- Booking failure handling: no false confirms, no duplicate submissions, timeout as uncertain.
- Review surfaces: status, conversation, shipment sources, history, quotes, approval, review cases, submission outcomes, activity history.
- POC control acceptance criteria (no invented facts, wrong-customer disclosure, prohibited sends, auto-continue while paused, unapproved submission, duplicate bookings in retry scenarios).

### Out of scope (deferred)

- Live email delivery and real carrier commitments.
- Attachments and document extraction.
- Multiple shipments per inquiry; hazardous and specialist cargo; air, sea, international, customs.
- Payments, route optimization, post-booking tracking, model retraining.
- Agreed numerical business targets (e.g. 30% handling-time reduction)—metrics follow baseline observation.

## Phases

| Phase | Focus | Milestone / gate |
| --- | --- | --- |
| **NOW — MVP / assignment POC** | Simulated integrations; three agents; history; approval; guardrails; human review; review UI | Workflow checks pass; task comparisons show potential value |
| **NEXT — Operational pilot** | One email channel + one carrier sandbox; attachments; staff profiles; team ownership and measurement | Useful savings after correction effort; reliable integrations |
| **LATER — Expansion** | More carriers/routes; post-booking assistance; permissions per new action | Validated demand, reliable outcome data, clear action boundaries |

## Workflow states (inquiry)

Normal progression:

`Received` → `Assessing` → `Clarifying` / `Awaiting customer` → `Ready for quotes` → `Awaiting customer approval` → `Submitting` → `Confirmed`

Any active stage may enter **Needs human review**. Rejection ends the inquiry. Booking failures stay visibly unresolved until recovery or staff action.

## Value metrics (validation)

| Measure | Purpose |
| --- | --- |
| Active handling time per booking (primary) | Staff effort reading, checking, clarifying, entering, reviewing, correcting |
| Elapsed time to booking confirmation | Includes customer wait and carrier response |
| Clarification cycles per request | Frequency of additional information needs |
| Corrections or rejected submissions | Accuracy vs speed |
| Staff intervention rate | Routine work still needing staff beyond customer approval |
| Customer history contribution | Repeat-customer effort and unnecessary questions |

Simulated elapsed-time results are demonstration evidence only.

## Open questions

- [ ] Customer identification and authorized contacts—POC matching rules.
- [ ] Demo routes and per-carrier constraints (configurable).
- [ ] Quote contents, expiry representation, and approval validity window.
- [ ] Tie-breaking when two eligible services have equal total price.
- [ ] Clarification escalation threshold and timing (configurable in principle).
- [ ] Technical storage for the full product (database choice) and agent architecture (single orchestrator vs separate agents). The first POC uses a JSON file and one OpenAI Responses call per paste.
- [ ] Assignment deadline and milestone dates.

## Change log

| Date | Change |
| --- | --- |
| 2026-10-18 | Initial project docs from consolidated requirements baseline (Create mode). |
| 2026-10-18 | Added the first-build POC spec: simulated multi-thread inbox, Cursor SDK, one human-review color, one guardrail. Features F1–F12 unchanged and still pending. |
| 2026-10-18 | First-build POC now includes a fixed seven-item shipment form (name, pickup address, pickup date, delivery address, goods, pallet count, total weight). The assistant proposes each item; the app checks it and shows a completed form when all seven are filled. Unclear items stay on a green thread. F1–F12 remain pending. No database change. |
| 2026-10-18 | The first-build assistant is OpenAI (`openai` Responses API, `OPENAI_API_KEY` on the server, model `gpt-6-astra` unless `OPENAI_MODEL` is set). The Cursor SDK call and local agent folder are removed from this slice. |
