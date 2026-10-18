const formFieldSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    status: {
      type: "string",
      enum: ["filled", "missing", "unclear"],
    },
    value: { type: "string" },
    note: { type: "string" },
  },
  required: ["status", "value", "note"],
} as const;

export const ASSEMBLER_OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    reply: { type: "string" },
    needsHuman: { type: "boolean" },
    reason: { type: "string" },
    form: {
      type: "object",
      additionalProperties: false,
      properties: {
        customerName: formFieldSchema,
        pickupAddress: formFieldSchema,
        pickupDate: formFieldSchema,
        deliveryAddress: formFieldSchema,
        goodsDescription: formFieldSchema,
        palletCount: formFieldSchema,
        totalWeightKg: formFieldSchema,
      },
      required: [
        "customerName",
        "pickupAddress",
        "pickupDate",
        "deliveryAddress",
        "goodsDescription",
        "palletCount",
        "totalWeightKg",
      ],
    },
  },
  required: ["reply", "needsHuman", "reason", "form"],
} as const;

export type AssemblerFormProposal = {
  status: "filled" | "missing" | "unclear";
  value: string;
  note: string;
};

export type AssemblerModelOutput = {
  reply: string;
  needsHuman: boolean;
  reason: string;
  form: {
    customerName: AssemblerFormProposal;
    pickupAddress: AssemblerFormProposal;
    pickupDate: AssemblerFormProposal;
    deliveryAddress: AssemblerFormProposal;
    goodsDescription: AssemblerFormProposal;
    palletCount: AssemblerFormProposal;
    totalWeightKg: AssemblerFormProposal;
  };
};
