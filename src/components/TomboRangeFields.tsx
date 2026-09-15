import { Field, TextInput } from "@/components/ui/Field";
import { formatTomboRangeLabel, parseTomboRange } from "@/lib/tombo-range";

export function TomboRangeFields({
  start,
  end,
  onStartChange,
  onEndChange,
}: {
  start: string;
  end: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
}) {
  const parsed = parseTomboRange(start, end);
  const preview = "ok" in parsed ? formatTomboRangeLabel(parsed.ok) : start && end ? parsed.error : "Informe o inicial e o final para ver a quantidade.";

  return (
    <div className="grid gap-3 sm:col-span-2">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Patrimônio inicial">
          <TextInput
            name="tomboInicio"
            required
            inputMode="numeric"
            autoComplete="off"
            value={start}
            onChange={(event) => onStartChange(event.target.value)}
            placeholder="000001"
          />
        </Field>
        <Field label="Patrimônio final">
          <TextInput
            name="tomboFim"
            required
            inputMode="numeric"
            autoComplete="off"
            value={end}
            onChange={(event) => onEndChange(event.target.value)}
            placeholder="000100"
          />
        </Field>
      </div>
      <p className={"ok" in parsed ? "text-sm text-slate-600" : start && end ? "text-sm text-rose-600" : "text-sm text-slate-500"}>{preview}</p>
    </div>
  );
}
