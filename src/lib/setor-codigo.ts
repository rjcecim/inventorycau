/** Pai na escala: 9.2.5 fica sob 9.2. Código sem ponto é raiz. */
export function parentSetorCodigo(codigo: string) {
  const parts = codigo.trim().split(".").filter(Boolean);
  if (parts.length < 2) return null;
  return parts.slice(0, -1).join(".");
}

/** Compara códigos de lotação por trecho numérico: 1.1.1 fica antes de 1.2 e de 10. */
export function compareSetorCodigo(a: string, b: string) {
  const left = a.split(".");
  const right = b.split(".");
  const len = Math.max(left.length, right.length);
  for (let i = 0; i < len; i++) {
    const av = left[i];
    const bv = right[i];
    if (av === undefined) return -1;
    if (bv === undefined) return 1;
    const an = Number(av);
    const bn = Number(bv);
    const bothNumeric = av !== "" && bv !== "" && Number.isInteger(an) && Number.isInteger(bn);
    if (bothNumeric && an !== bn) return an - bn;
    if (!bothNumeric && av !== bv) return av < bv ? -1 : 1;
  }
  return 0;
}
