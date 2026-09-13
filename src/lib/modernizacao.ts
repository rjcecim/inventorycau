import {
  addCalendarYears,
  compareCalendar,
  diffCalendarDays,
  formatDaysModernization,
  toCalendarDate,
  todayCalendar,
  type CalendarDate,
} from "@/lib/dates";

export type ModernizationKind = "COMPUTER" | "MONITOR";
export type ModernizationSituation = "no_prazo" | "fora_prazo" | "sem_data";

export const MODERNIZATION_YEARS: Record<ModernizationKind, number> = {
  COMPUTER: 6,
  MONITOR: 8,
};

export type ModernizationInfo = {
  kind: ModernizationKind;
  categoryLabel: string;
  years: number;
  receivedAt: CalendarDate | null;
  deadline: CalendarDate | null;
  situation: ModernizationSituation;
  situationLabel: string;
  daysRemaining: number | null;
  daysLabel: string;
};

export function categoryLabel(kind: ModernizationKind) {
  return kind === "COMPUTER" ? "Computadores" : "Monitores";
}

export function modernizationSituationLabel(situation: ModernizationSituation) {
  if (situation === "no_prazo") return "Dentro do prazo";
  if (situation === "fora_prazo") return "Prazo excedido";
  return "Data não informada";
}

/** Sem data entra; recebimento após a referência fica fora da apuração. */
export function isInModernizationScope(params: {
  dataRecebimento?: Date | string | CalendarDate | null;
  asOf: CalendarDate;
}) {
  const received = toCalendarDate(params.dataRecebimento ?? null);
  if (!received) return true;
  return compareCalendar(received, params.asOf) <= 0;
}

export function computeModernization(params: {
  kind: ModernizationKind;
  dataRecebimento?: Date | string | CalendarDate | null;
  asOf?: CalendarDate;
}): ModernizationInfo {
  const asOf = params.asOf ?? todayCalendar();
  const years = MODERNIZATION_YEARS[params.kind];
  const receivedAt = toCalendarDate(params.dataRecebimento ?? null);

  if (!receivedAt) {
    return {
      kind: params.kind,
      categoryLabel: categoryLabel(params.kind),
      years,
      receivedAt: null,
      deadline: null,
      situation: "sem_data",
      situationLabel: modernizationSituationLabel("sem_data"),
      daysRemaining: null,
      daysLabel: "—",
    };
  }

  const deadline = addCalendarYears(receivedAt, years);
  const daysRemaining = diffCalendarDays(asOf, deadline);
  const inDeadline = compareCalendar(asOf, deadline) <= 0;
  const situation: ModernizationSituation = inDeadline ? "no_prazo" : "fora_prazo";

  return {
    kind: params.kind,
    categoryLabel: categoryLabel(params.kind),
    years,
    receivedAt,
    deadline,
    situation,
    situationLabel: modernizationSituationLabel(situation),
    daysRemaining,
    daysLabel: formatDaysModernization(daysRemaining),
  };
}

export type CategoryIndex = {
  kind: ModernizationKind;
  label: string;
  total: number;
  within: number;
  outside: number;
  missing: number;
  index: number | null;
  provisional: boolean;
  applicable: boolean;
  summary: string;
};

export function buildModernizationIndexes(
  rows: { kind: ModernizationKind; dataRecebimento?: Date | string | CalendarDate | null }[],
  asOf?: CalendarDate,
): CategoryIndex[] {
  const reference = asOf ?? todayCalendar();
  return (["COMPUTER", "MONITOR"] as const).map((kind) => {
    const scoped = rows.filter(
      (row) => row.kind === kind && isInModernizationScope({ dataRecebimento: row.dataRecebimento, asOf: reference }),
    );
    const infos = scoped.map((row) =>
      computeModernization({ kind, dataRecebimento: row.dataRecebimento, asOf: reference }),
    );
    const total = infos.length;
    if (!total) {
      return {
        kind,
        label: categoryLabel(kind),
        total: 0,
        within: 0,
        outside: 0,
        missing: 0,
        index: null,
        provisional: false,
        applicable: false,
        summary: "Não aplicável",
      };
    }
    const within = infos.filter((item) => item.situation === "no_prazo").length;
    const outside = infos.filter((item) => item.situation === "fora_prazo").length;
    const missing = infos.filter((item) => item.situation === "sem_data").length;
    const index = (within / total) * 100;
    const provisional = missing > 0;
    return {
      kind,
      label: categoryLabel(kind),
      total,
      within,
      outside,
      missing,
      index,
      provisional,
      applicable: true,
      summary: provisional
        ? `${index.toFixed(1)}% (provisório — ${missing} sem data)`
        : `${index.toFixed(1)}%`,
    };
  });
}
