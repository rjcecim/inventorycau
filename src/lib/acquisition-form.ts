import { z } from "zod";
import { calendarToDbDate, parseIsoDate } from "@/lib/dates";
import { emptyToNull } from "@/lib/utils";

export const acquisitionSchema = z.object({
  dataNotaFiscal: z.date().nullable(),
  dataRecebimento: z.date().nullable(),
  prazoGarantiaAnos: z.number().int().min(0).max(50).nullable(),
});

export type AcquisitionData = z.infer<typeof acquisitionSchema>;

export function parseAcquisitionFromForm(formData: FormData): { data?: AcquisitionData; error?: string } {
  const invoiceRaw = String(formData.get("dataNotaFiscal") ?? "").trim();
  const receivedRaw = String(formData.get("dataRecebimento") ?? "").trim();
  const yearsRaw = emptyToNull(formData.get("prazoGarantiaAnos"));

  const invoice = invoiceRaw ? parseIsoDate(invoiceRaw) : null;
  const received = receivedRaw ? parseIsoDate(receivedRaw) : null;

  if (invoiceRaw && !invoice) return { error: "Data da nota fiscal inválida." };
  if (receivedRaw && !received) return { error: "Data de entrada/recebimento inválida." };

  let years: number | null = null;
  if (yearsRaw != null) {
    const n = Number(yearsRaw);
    if (!Number.isInteger(n) || n < 0 || n > 50) {
      return { error: "Prazo de garantia deve ser um número inteiro entre 0 e 50." };
    }
    years = n;
  }

  const parsed = acquisitionSchema.safeParse({
    dataNotaFiscal: invoice ? calendarToDbDate(invoice) : null,
    dataRecebimento: received ? calendarToDbDate(received) : null,
    prazoGarantiaAnos: years,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  return { data: parsed.data };
}
