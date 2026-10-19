import {
  FORM_FIELD_KEYS,
  type FormStatus,
  type ShipmentFormData,
} from "@/lib/form/catalog";
import {
  formStatusFromFields,
  valueAppearsInChat,
} from "@/lib/form/validate";

export function mergeClarificationForm(
  previous: ShipmentFormData,
  proposed: ShipmentFormData,
  customerText: string
): { form: ShipmentFormData; formStatus: FormStatus } {
  const next: ShipmentFormData = { ...proposed };

  for (const key of FORM_FIELD_KEYS) {
    const prior = previous[key];
    const incoming = proposed[key];
    if (prior.status !== "filled") continue;

    if (incoming.status === "filled") {
      if (
        prior.value.trim().toLowerCase() !== incoming.value.trim().toLowerCase()
      ) {
        next[key] = {
          status: "unclear",
          value: incoming.value,
          note: `Conflicts with the earlier value "${prior.value}".`,
        };
      }
      continue;
    }

    if (
      incoming.status === "missing" &&
      valueAppearsInChat(prior.value, customerText)
    ) {
      next[key] = prior;
    }
  }

  return { form: next, formStatus: formStatusFromFields(next) };
}
