import { describe, expect, it } from "vitest";
import { formatTomboRangeLabel, parseTomboRange } from "@/lib/tombo-range";

describe("parseTomboRange", () => {
  it("aceita faixa numérica com zeros à esquerda", () => {
    const parsed = parseTomboRange("023038", "023040");
    expect(parsed).toEqual({
      ok: {
        tombos: ["023038", "023039", "023040"],
        start: "023038",
        end: "023040",
        count: 3,
      },
    });
  });

  it("aceita patrimônios com sufixo, como 3053-00", () => {
    const parsed = parseTomboRange("3053-00", "3056-00");
    expect(parsed).toEqual({
      ok: {
        tombos: ["3053-00", "3054-00", "3055-00", "3056-00"],
        start: "3053-00",
        end: "3056-00",
        count: 4,
      },
    });
  });

  it("aceita um único patrimônio quando inicial e final são iguais", () => {
    const parsed = parseTomboRange("3053-00", "3053-00");
    expect(parsed).toEqual({
      ok: { tombos: ["3053-00"], start: "3053-00", end: "3053-00", count: 1 },
    });
  });

  it("rejeita faixas que não variam só na parte numérica", () => {
    expect(parseTomboRange("3053-00", "3062-AA")).toEqual({
      error: "O inicial e o final precisam variar só na parte numérica (ex.: 3053-00 e 3062-00).",
    });
  });

  it("formata o rótulo da faixa", () => {
    expect(formatTomboRangeLabel({ start: "3053-00", end: "3062-00", count: 10 })).toBe(
      "10 patrimônios: 3053-00 … 3062-00",
    );
  });
});
