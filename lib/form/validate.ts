import { SAMPLE_CUSTOMERS, type SampleCustomer } from "@/lib/data/customers";
import {
  createEmptyShipmentForm,
  FIELD_STATUSES,
  FORM_FIELD_KEYS,
  type FieldStatus,
  type FormField,
  type FormFieldKey,
  type FormStatus,
  type ShipmentFormData,
} from "@/lib/form/catalog";

export type ProposedFormField = {
  status?: unknown;
  value?: unknown;
  note?: unknown;
};

export type ProposedForm = Partial<Record<FormFieldKey, ProposedFormField>>;

export type FormCheckResult =
  | { ok: false; reason: "unreadable" }
  | { ok: true; form: ShipmentFormData; formStatus: FormStatus };

const MONTH_NAMES = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
  "jan",
  "feb",
  "mar",
  "apr",
  "jun",
  "jul",
  "aug",
  "sep",
  "sept",
  "oct",
  "nov",
  "dec",
];

const RELATIVE_DATE =
  /\bnext\s+(week|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i;

const EXPLICIT_TOTAL =
  /\b(in total|altogether|whole shipment|for the shipment|total)\b/i;

const PER_PALLET =
  /\b(per pallet|each pallet|a pallet|per plt|apiece)\b|\/pallet\b/i;

const WEIGHT_AMBIGUITY_NOTE =
  "Could be per pallet or the whole shipment.";

function isFieldStatus(value: unknown): value is FieldStatus {
  return (
    typeof value === "string" &&
    FIELD_STATUSES.includes(value as FieldStatus)
  );
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function missingField(): FormField {
  return { status: "missing", value: "", note: "" };
}

function unclearField(value: string, note: string): FormField {
  return {
    status: "unclear",
    value,
    note: note.trim() || "Unclear from the chat text.",
  };
}

function filledField(value: string): FormField {
  return { status: "filled", value, note: "" };
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function hasDayAndMonth(value: string): boolean {
  if (RELATIVE_DATE.test(value)) return false;
  const lower = value.toLowerCase();
  const hasMonth = MONTH_NAMES.some((month) =>
    new RegExp(`\\b${month}\\b`, "i").test(lower)
  );
  const hasDay = /\b(?:[0-2]?\d|3[01])(?:st|nd|rd|th)?\b/.test(lower);
  return hasMonth && hasDay;
}

function parsePalletCount(value: string): string | null {
  if (!/^\d+$/.test(value)) return null;
  const count = Number(value);
  if (!Number.isInteger(count) || count < 1) return null;
  return String(count);
}

function parseWeightKg(value: string): string | null {
  const trimmed = value.trim().toLowerCase().replace(/,/g, "");
  const match = trimmed.match(
    /^(\d+(?:\.\d+)?)\s*(?:kg|kgs|kilogram|kilograms)?$/
  );
  if (!match) return null;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return String(amount);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function chatWindowsForWeight(chatText: string, weightValue: string): string[] {
  const escaped = escapeRegExp(weightValue);
  const pattern = new RegExp(
    `(?:^|\\D)(${escaped})(?:\\.0+)?\\s*(?:kg|kgs|kilogram|kilograms)?\\b`,
    "gi"
  );
  const windows: string[] = [];
  const source = chatText;
  for (const match of source.matchAll(pattern)) {
    const index = match.index ?? 0;
    const start = Math.max(0, index - 80);
    const end = Math.min(source.length, index + match[0].length + 80);
    windows.push(source.slice(start, end));
  }
  return windows;
}

function classifyWeightInChat(
  chatText: string,
  weightValue: string
): { explicitTotal: boolean; perPallet: boolean } {
  const windows = chatWindowsForWeight(chatText, weightValue);
  const scopes = windows.length > 0 ? windows : [chatText];
  let explicitTotal = false;
  let perPallet = false;
  for (const scope of scopes) {
    if (EXPLICIT_TOTAL.test(scope)) explicitTotal = true;
    if (PER_PALLET.test(scope)) perPallet = true;
  }
  return { explicitTotal, perPallet };
}

function applyWeightRule(
  field: FormField,
  palletCount: FormField,
  chatText: string
): FormField {
  if (field.status !== "filled") return field;
  const { explicitTotal, perPallet } = classifyWeightInChat(
    chatText,
    field.value
  );

  const palletFilled = palletCount.status === "filled";
  const palletNumber = palletFilled ? Number(palletCount.value) : null;

  if (!palletFilled) {
    if (explicitTotal && !perPallet) return field;
    return unclearField(field.value, WEIGHT_AMBIGUITY_NOTE);
  }

  if (palletNumber === 1) {
    return field;
  }

  if (palletNumber !== null && palletNumber > 1) {
    if (explicitTotal && !perPallet) return field;
    return unclearField(field.value, WEIGHT_AMBIGUITY_NOTE);
  }

  return unclearField(field.value, WEIGHT_AMBIGUITY_NOTE);
}

function acceptFilledValue(
  key: FormFieldKey,
  rawValue: string
): { ok: true; value: string } | { ok: false; note: string; value: string } {
  const trimmed = rawValue.trim();

  switch (key) {
    case "customerName":
      if (trimmed.length >= 2) return { ok: true, value: trimmed };
      return { ok: false, note: "Name is too short.", value: trimmed };
    case "pickupAddress":
    case "deliveryAddress":
      if (trimmed.length >= 8 && /[A-Za-z\u00C0-\u024F]/.test(trimmed)) {
        return { ok: true, value: trimmed };
      }
      return {
        ok: false,
        note: "Not specific enough to collect from.",
        value: trimmed,
      };
    case "pickupDate": {
      const compact = trimmed;
      if (isIsoDate(compact) || hasDayAndMonth(compact)) {
        return { ok: true, value: compact };
      }
      return {
        ok: false,
        note: "Not a specific calendar day.",
        value: trimmed,
      };
    }
    case "goodsDescription":
      if (trimmed.length >= 3) return { ok: true, value: trimmed };
      return {
        ok: false,
        note: "Description is too short.",
        value: trimmed,
      };
    case "palletCount": {
      const parsed = parsePalletCount(trimmed);
      if (parsed) return { ok: true, value: parsed };
      return {
        ok: false,
        note: "Not a whole number of pallets.",
        value: trimmed,
      };
    }
    case "totalWeightKg": {
      const parsed = parseWeightKg(trimmed);
      if (parsed) return { ok: true, value: parsed };
      return {
        ok: false,
        note: "Not a shipment weight in kilograms.",
        value: trimmed,
      };
    }
  }
}

function normalizeProposedField(
  key: FormFieldKey,
  proposed: ProposedFormField
): FormField | null {
  if (!isFieldStatus(proposed.status)) return null;
  const value = asString(proposed.value).trim();
  const note = asString(proposed.note).trim();

  if (proposed.status === "filled") {
    if (!value) return null;
    const accepted = acceptFilledValue(key, value);
    if (accepted.ok) return filledField(accepted.value);
    return unclearField(accepted.value, accepted.note);
  }

  if (proposed.status === "missing") {
    return missingField();
  }

  return unclearField(value, note);
}

export function valueAppearsInChat(value: string, chatText: string): boolean {
  const needle = value.trim().toLowerCase();
  if (!needle) return false;
  if (needle.length >= 3) {
    return chatText.toLowerCase().includes(needle);
  }
  return new RegExp(
    `(?:^|\\D)${escapeRegExp(needle)}(?:\\D|$)`,
    "i"
  ).test(chatText);
}

function historyValues(customers: SampleCustomer[]): string[] {
  const values: string[] = [];
  for (const customer of customers) {
    values.push(customer.name);
    for (const contact of customer.contacts) {
      values.push(contact.name, contact.email);
    }
    for (const booking of customer.bookings) {
      values.push(
        booking.pickupAddress,
        booking.deliveryAddress,
        booking.date,
        booking.goodsDescription,
        String(booking.palletCount),
        String(booking.totalWeightKg)
      );
    }
  }
  return values.filter((value) => value.trim().length > 0);
}

export function stripUnstatedHistoryValues(
  form: ShipmentFormData,
  chatText: string,
  customers: SampleCustomer[] = SAMPLE_CUSTOMERS
): ShipmentFormData {
  const copied = historyValues(customers).map((value) => value.trim());
  const next = { ...form };

  for (const key of FORM_FIELD_KEYS) {
    const field = next[key];
    if (field.status !== "filled") continue;
    const matchesHistory = copied.some(
      (historyValue) =>
        historyValue.toLowerCase() === field.value.trim().toLowerCase()
    );
    if (matchesHistory && !valueAppearsInChat(field.value, chatText)) {
      next[key] = missingField();
    }
  }

  return next;
}

export function formStatusFromFields(form: ShipmentFormData): FormStatus {
  const complete = FORM_FIELD_KEYS.every(
    (key) => form[key].status === "filled"
  );
  return complete ? "complete" : "incomplete";
}

export function checkAssemblerForm(
  proposed: unknown,
  chatText: string,
  customers: SampleCustomer[] = SAMPLE_CUSTOMERS
): FormCheckResult {
  if (!proposed || typeof proposed !== "object" || Array.isArray(proposed)) {
    return { ok: false, reason: "unreadable" };
  }

  const record = proposed as ProposedForm;
  const form = createEmptyShipmentForm();

  for (const key of FORM_FIELD_KEYS) {
    const field = record[key];
    if (!field || typeof field !== "object") {
      return { ok: false, reason: "unreadable" };
    }
    const normalized = normalizeProposedField(key, field);
    if (!normalized) {
      return { ok: false, reason: "unreadable" };
    }
    form[key] = normalized;
  }

  form.totalWeightKg = applyWeightRule(
    form.totalWeightKg,
    form.palletCount,
    chatText
  );

  const grounded = stripUnstatedHistoryValues(form, chatText, customers);
  return {
    ok: true,
    form: grounded,
    formStatus: formStatusFromFields(grounded),
  };
}
