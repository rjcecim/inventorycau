const MAX_LOTE = 500;

export type TomboRange = {
  tombos: string[];
  start: string;
  end: string;
  count: number;
};

function splitVaryingNumeric(start: string, end: string) {
  let prefixLen = 0;
  const minLen = Math.min(start.length, end.length);
  while (prefixLen < minLen && start[prefixLen] === end[prefixLen]) prefixLen++;

  let suffixLen = 0;
  while (
    suffixLen < minLen - prefixLen &&
    start[start.length - 1 - suffixLen] === end[end.length - 1 - suffixLen]
  ) {
    suffixLen++;
  }

  const prefix = start.slice(0, prefixLen);
  const suffix = suffixLen ? start.slice(start.length - suffixLen) : "";
  const midStart = start.slice(prefixLen, start.length - suffixLen);
  const midEnd = end.slice(prefixLen, end.length - suffixLen);
  return { prefix, suffix, midStart, midEnd };
}

export function parseTomboRange(startRaw: string, endRaw: string): { ok: TomboRange } | { error: string } {
  const start = startRaw.trim();
  const end = endRaw.trim();
  if (!start || !end) return { error: "Informe o patrimônio inicial e o final." };

  if (start === end) {
    return { ok: { tombos: [start], start, end, count: 1 } };
  }

  const { prefix, suffix, midStart, midEnd } = splitVaryingNumeric(start, end);
  if (!/^\d+$/.test(midStart) || !/^\d+$/.test(midEnd)) {
    return { error: "O inicial e o final precisam variar só na parte numérica (ex.: 3053-00 e 3062-00)." };
  }

  const from = BigInt(midStart);
  const to = BigInt(midEnd);
  if (from > to) return { error: "O patrimônio inicial deve ser menor ou igual ao final." };

  const count = Number(to - from) + 1;
  if (count > MAX_LOTE) return { error: `O lote pode ter no máximo ${MAX_LOTE} patrimônios.` };

  const width = midStart.length === midEnd.length ? midStart.length : 0;
  const tombos = Array.from({ length: count }, (_, index) => {
    const n = (from + BigInt(index)).toString();
    const numeric = width ? n.padStart(width, "0") : n;
    return `${prefix}${numeric}${suffix}`;
  });
  return { ok: { tombos, start, end, count } };
}

export function formatTomboRangeLabel(range: Pick<TomboRange, "start" | "end" | "count">) {
  if (range.count === 1) return `1 patrimônio: ${range.start}`;
  return `${range.count} patrimônios: ${range.start} … ${range.end}`;
}
