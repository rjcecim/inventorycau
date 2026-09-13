import {
  addCalendarYears,
  compareCalendar,
  diffCalendarDays,
  formatDaysLabel,
  toCalendarDate,
  todayCalendar,
  type CalendarDate,
} from "@/lib/dates";

export type WarrantySituation = "vigente" | "vence_90" | "vencida" | "incompleto";

export type WarrantyInfo = {
  receivedAt: CalendarDate | null;
  years: number | null;
  expiresAt: CalendarDate | null;
  situation: WarrantySituation;
  situationLabel: string;
  daysRemaining: number | null;
  daysLabel: string;
  isVigente: boolean;
};

export function warrantySituationLabel(situation: WarrantySituation) {
  if (situation === "vigente") return "Vigente";
  if (situation === "vence_90") return "Vence em até 90 dias";
  if (situation === "vencida") return "Vencida";
  return "Dados incompletos";
}

/**
 * Vencimento = data de recebimento + prazo em anos.
 * Válida até o dia do vencimento (inclusive). Nota fiscal não entra no cálculo.
 */
export function computeWarranty(params: {
  dataRecebimento?: Date | string | CalendarDate | null;
  prazoGarantiaAnos?: number | null;
  asOf?: CalendarDate;
}): WarrantyInfo {
  const asOf = params.asOf ?? todayCalendar();
  const receivedAt = toCalendarDate(params.dataRecebimento ?? null);
  const years =
    params.prazoGarantiaAnos == null || !Number.isFinite(params.prazoGarantiaAnos)
      ? null
      : Math.trunc(params.prazoGarantiaAnos);

  if (!receivedAt || years == null || years < 0) {
    return {
      receivedAt,
      years: years != null && years >= 0 ? years : null,
      expiresAt: null,
      situation: "incompleto",
      situationLabel: warrantySituationLabel("incompleto"),
      daysRemaining: null,
      daysLabel: "—",
      isVigente: false,
    };
  }

  const expiresAt = addCalendarYears(receivedAt, years);
  const daysRemaining = diffCalendarDays(asOf, expiresAt);

  if (compareCalendar(asOf, expiresAt) > 0) {
    return {
      receivedAt,
      years,
      expiresAt,
      situation: "vencida",
      situationLabel: warrantySituationLabel("vencida"),
      daysRemaining,
      daysLabel: formatDaysLabel(daysRemaining),
      isVigente: false,
    };
  }

  const situation: WarrantySituation = daysRemaining <= 90 ? "vence_90" : "vigente";
  return {
    receivedAt,
    years,
    expiresAt,
    situation,
    situationLabel: warrantySituationLabel(situation),
    daysRemaining,
    daysLabel: formatDaysLabel(daysRemaining),
    isVigente: true,
  };
}

export function matchesWarrantyFilter(situation: WarrantySituation, filter: string | null | undefined) {
  if (!filter || filter === "todas") return true;
  if (filter === "vigente") return situation === "vigente" || situation === "vence_90";
  return situation === filter;
}
