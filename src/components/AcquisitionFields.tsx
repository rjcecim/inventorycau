"use client";

import { useMemo, useState } from "react";
import { Field, TextInput } from "@/components/ui/Field";
import { computeWarranty } from "@/lib/garantia";
import { computeModernization, type ModernizationKind } from "@/lib/modernizacao";
import { formatCalendarDate, parseIsoDate, toInputDate } from "@/lib/dates";

export function AcquisitionFields({
  kind,
  values,
}: {
  kind: ModernizationKind;
  values?: {
    dataNotaFiscal?: string | Date | null;
    dataRecebimento?: string | Date | null;
    prazoGarantiaAnos?: number | null;
  };
}) {
  const [invoice, setInvoice] = useState(toInputDate(values?.dataNotaFiscal));
  const [received, setReceived] = useState(toInputDate(values?.dataRecebimento));
  const [years, setYears] = useState(
    values?.prazoGarantiaAnos == null ? "" : String(values.prazoGarantiaAnos),
  );

  const warranty = useMemo(
    () =>
      computeWarranty({
        dataRecebimento: parseIsoDate(received),
        prazoGarantiaAnos: years === "" ? null : Number(years),
      }),
    [received, years],
  );

  const modernization = useMemo(
    () => computeModernization({ kind, dataRecebimento: parseIsoDate(received) }),
    [kind, received],
  );

  return (
    <div className="grid gap-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Aquisição e garantia</p>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Data da nota fiscal" hint="informativa">
          <TextInput
            name="dataNotaFiscal"
            type="date"
            value={invoice}
            onChange={(event) => setInvoice(event.target.value)}
          />
        </Field>
        <Field label="Data de entrada/recebimento" hint="base dos cálculos">
          <TextInput
            name="dataRecebimento"
            type="date"
            value={received}
            onChange={(event) => setReceived(event.target.value)}
          />
        </Field>
        <Field label="Prazo de garantia (anos)" hint="opcional">
          <TextInput
            name="prazoGarantiaAnos"
            type="number"
            min={0}
            max={50}
            step={1}
            value={years}
            onChange={(event) => setYears(event.target.value)}
            placeholder="5"
          />
        </Field>
      </div>
      <div className="grid gap-3 rounded-xl border border-line bg-slate-50 px-3.5 py-3 text-sm text-slate-600 sm:grid-cols-2">
        <p>
          <span className="font-medium text-slate-800">Garantia: </span>
          {warranty.situationLabel}
          {warranty.expiresAt ? ` · vence ${formatCalendarDate(warranty.expiresAt)}` : ""}
          {warranty.daysLabel !== "—" ? ` · ${warranty.daysLabel}` : ""}
        </p>
        <p>
          <span className="font-medium text-slate-800">Modernização: </span>
          {modernization.situationLabel}
          {modernization.deadline ? ` · limite ${formatCalendarDate(modernization.deadline)}` : ""}
          {modernization.daysLabel !== "—" ? ` · ${modernization.daysLabel}` : ""}
        </p>
      </div>
    </div>
  );
}
