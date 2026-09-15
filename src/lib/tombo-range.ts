const MAX_LOTE = 500;

export type TomboRange = {
  tombos: string[];
  start: string;
  end: string;
  count: number;
};

export function parseTomboRange(startRaw: string, endRaw: string): { ok: TomboRange } | { error: string } {
  const start = startRaw.trim();
  const end = endRaw.trim();
  if (!start || !end) return { error: "Informe o patrimônio inicial e o final." };
  if (!/^\d+$/.test(start) || !/^\d+$/.test(end)) {
    return { error: "O lote só aceita patrimônios numéricos, com os zeros à esquerda." };
  }
  if (start.length !== end.length) {
    return { error: "O inicial e o final precisam ter o mesmo número de dígitos (ex.: 023038 e 023217)." };
  }

  const from = BigInt(start);
  const to = BigInt(end);
  if (from > to) return { error: "O patrimônio inicial deve ser menor ou igual ao final." };

  const count = Number(to - from) + 1;
  if (count > MAX_LOTE) return { error: `O lote pode ter no máximo ${MAX_LOTE} patrimônios.` };

  const tombos = Array.from({ length: count }, (_, index) => (from + BigInt(index)).toString().padStart(start.length, "0"));
  return { ok: { tombos, start, end, count } };
}

export function formatTomboRangeLabel(range: Pick<TomboRange, "start" | "end" | "count">) {
  if (range.count === 1) return `1 patrimônio: ${range.start}`;
  return `${range.count} patrimônios: ${range.start} … ${range.end}`;
}
