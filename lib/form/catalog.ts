export type FieldStatus = "filled" | "missing" | "unclear";

export type FormField = {
  status: FieldStatus;
  value: string;
  note: string;
};

export type FormFieldKey =
  | "customerName"
  | "pickupAddress"
  | "pickupDate"
  | "deliveryAddress"
  | "goodsDescription"
  | "palletCount"
  | "totalWeightKg";

export type ShipmentFormData = Record<FormFieldKey, FormField>;

export type FormStatus = "complete" | "incomplete";

export type AssemblerItem = {
  id: string;
  title: string;
  needsHuman: boolean;
  humanReason: string;
  message: string;
  reply: string;
  form: ShipmentFormData;
  formStatus: FormStatus;
  createdAt: string;
};

export const FORM_FIELD_CATALOG: { key: FormFieldKey; label: string }[] = [
  { key: "customerName", label: "Customer name" },
  { key: "pickupAddress", label: "Pickup address" },
  { key: "pickupDate", label: "Pickup date" },
  { key: "deliveryAddress", label: "Delivery address" },
  { key: "goodsDescription", label: "Goods description" },
  { key: "palletCount", label: "Number of pallets" },
  { key: "totalWeightKg", label: "Total weight (kg)" },
];

const emptyField = (): FormField => ({
  status: "missing",
  value: "",
  note: "",
});

export function createEmptyShipmentForm(): ShipmentFormData {
  return {
    customerName: emptyField(),
    pickupAddress: emptyField(),
    pickupDate: emptyField(),
    deliveryAddress: emptyField(),
    goodsDescription: emptyField(),
    palletCount: emptyField(),
    totalWeightKg: emptyField(),
  };
}
