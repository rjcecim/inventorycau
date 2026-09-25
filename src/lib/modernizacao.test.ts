import { describe, expect, it } from "vitest";
import { computeModernization, MODERNIZATION_YEARS } from "@/lib/modernizacao";

describe("modernização PETI", () => {
  it("usa 6 anos para desktop e notebook e 8 para monitor", () => {
    expect(MODERNIZATION_YEARS.COMPUTER).toBe(6);
    expect(MODERNIZATION_YEARS.NOTEBOOK).toBe(6);
    expect(MODERNIZATION_YEARS.MONITOR).toBe(8);
  });

  it("calcula o limite do notebook a partir da data de recebimento", () => {
    const info = computeModernization({
      kind: "NOTEBOOK",
      dataRecebimento: "2020-01-15",
      asOf: { y: 2026, m: 1, d: 15 },
    });
    expect(info.years).toBe(6);
    expect(info.deadline).toEqual({ y: 2026, m: 1, d: 15 });
    expect(info.situation).toBe("no_prazo");
  });
});
