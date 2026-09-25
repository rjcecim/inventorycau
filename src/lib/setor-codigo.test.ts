import { describe, expect, it } from "vitest";
import { compareSetorCodigo, parentSetorCodigo } from "@/lib/setor-codigo";

describe("código de setor", () => {
  it("aponta o pai pelo trecho anterior do código", () => {
    expect(parentSetorCodigo("9.2.5")).toBe("9.2");
    expect(parentSetorCodigo("1.1.1")).toBe("1.1");
    expect(parentSetorCodigo("14")).toBeNull();
  });

  it("coloca o filho logo depois do pai e antes do irmão seguinte", () => {
    const codes = ["1.2", "1", "1.1.1", "1.1", "10", "1.2.1", "2"];
    expect([...codes].sort(compareSetorCodigo)).toEqual([
      "1",
      "1.1",
      "1.1.1",
      "1.2",
      "1.2.1",
      "2",
      "10",
    ]);
  });
});
