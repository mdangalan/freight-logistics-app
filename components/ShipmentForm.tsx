"use client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  FORM_FIELD_CATALOG,
  type FormField,
  type FormStatus,
  type ShipmentFormData,
} from "@/lib/form/catalog";
import { cn } from "@/lib/utils";

function FieldStatusBadge({ field }: { field: FormField }) {
  if (field.status === "filled") {
    return (
      <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-200">
        Filled
      </Badge>
    );
  }
  if (field.status === "unclear") {
    return (
      <Badge variant="secondary" className="bg-amber-500/15 text-amber-900 dark:text-amber-100">
        Unclear
      </Badge>
    );
  }
  return <Badge variant="outline">Missing</Badge>;
}

type ShipmentFormProps = {
  form: ShipmentFormData;
  formStatus: FormStatus;
  className?: string;
};

export function ShipmentForm({ form, formStatus, className }: ShipmentFormProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-medium">Shipment form</h3>
        {formStatus === "complete" ? (
          <Badge className="bg-emerald-600 text-white hover:bg-emerald-600/90">
            Form complete
          </Badge>
        ) : (
          <Badge variant="secondary">Incomplete</Badge>
        )}
      </div>
      <Separator />
      <dl className="space-y-3">
        {FORM_FIELD_CATALOG.map(({ key, label }) => {
          const field = form[key];
          return (
            <div
              key={key}
              className="grid gap-1 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5 sm:grid-cols-[minmax(0,1fr)_auto]"
            >
              <div className="min-w-0 space-y-1">
                <dt className="text-xs font-medium text-muted-foreground">
                  {label}
                </dt>
                <dd className="text-sm">
                  {field.status === "missing" ? (
                    <span className="text-muted-foreground italic">—</span>
                  ) : (
                    <span className="break-words">{field.value || "—"}</span>
                  )}
                </dd>
                {field.status === "unclear" && field.note ? (
                  <p className="text-xs text-muted-foreground">{field.note}</p>
                ) : null}
              </div>
              <div className="flex items-start sm:justify-end">
                <FieldStatusBadge field={field} />
              </div>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
