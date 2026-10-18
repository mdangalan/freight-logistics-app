export type GuardrailTrip = {
  tripped: true;
  reason: string;
};

export type GuardrailClear = {
  tripped: false;
};

export type GuardrailResult = GuardrailTrip | GuardrailClear;

const OUT_OF_SCOPE: { reason: string; pattern: RegExp }[] = [
  {
    reason: "Customer asked about hazardous cargo",
    pattern:
      /\b(hazardous|hazmat|dangerous goods|dangerous cargo|lithium|explosive|flammable|corrosive|radioactive|toxic waste|imdg)\b/i,
  },
  {
    reason: "Customer asked for air or sea freight",
    pattern:
      /\b(air freight|air cargo|by air|via air|fly it|sea freight|ocean freight|by sea|by ocean|sea cargo|ocean cargo)\b/i,
  },
  {
    reason: "Customer asked for a guaranteed delivery date",
    pattern:
      /\b(guaranteed (delivery|arrival|date|time)|guarantee(d)? (that|it arrives|delivery)|must arrive by)\b/i,
  },
  {
    reason: "Customer asked about compensation",
    pattern:
      /\b(compensation|damages|reimburse|reimbursement|insurance payout|claim against)\b/i,
  },
  {
    reason: "Customer asked about a contract",
    pattern:
      /\b(annual contract|service contract|master agreement|sign a contract|contract rates|contract)\b/i,
  },
  {
    reason: "Customer asked to skip the rules",
    pattern:
      /\b(just book it|skip the rules|skip the process|ignore the rules|ignore the process|bypass (the )?(rules|process|checks)|don'?t bother with (the )?(rules|process))\b/i,
  },
];

export function detectOutOfScopeShipment(chatText: string): GuardrailResult {
  for (const rule of OUT_OF_SCOPE) {
    if (rule.pattern.test(chatText)) {
      return { tripped: true, reason: rule.reason };
    }
  }
  return { tripped: false };
}

export function applyAssemblerGuardrail(args: {
  chatText: string;
  needsHuman: boolean;
  modelReason: string;
  readable: boolean;
}): GuardrailResult {
  const outOfScope = detectOutOfScopeShipment(args.chatText);
  if (outOfScope.tripped) return outOfScope;

  if (args.needsHuman) {
    return {
      tripped: true,
      reason: args.modelReason.trim() || "A person should look at this item.",
    };
  }

  if (!args.readable) {
    return {
      tripped: true,
      reason: "The assistant could not answer.",
    };
  }

  return { tripped: false };
}
