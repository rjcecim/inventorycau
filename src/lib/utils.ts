export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function emptyToNull(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length ? text : null;
}

/** Belém/PA (UTC−3 o ano todo). Evita Intl/ICU diferente entre Docker e o navegador. */
const BELEM_OFFSET_MS = 3 * 60 * 60 * 1000;

export function formatDateTime(value: Date | string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const local = new Date(date.getTime() - BELEM_OFFSET_MS);
  const day = String(local.getUTCDate()).padStart(2, "0");
  const month = String(local.getUTCMonth() + 1).padStart(2, "0");
  const year = String(local.getUTCFullYear());
  const hour = String(local.getUTCHours()).padStart(2, "0");
  const minute = String(local.getUTCMinutes()).padStart(2, "0");
  return `${day}/${month}/${year}, ${hour}:${minute}`;
}
