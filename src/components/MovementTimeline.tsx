import { FIELD_LABELS } from "@/lib/audit";
import { formatDateTime } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";

type Movement = {
  id: string;
  campo: string;
  valorAnterior: string | null;
  valorNovo: string | null;
  createdDate: Date;
  actor: { fullName: string } | null;
  computador: { tombo: string } | null;
  monitor: { tombo: string } | null;
  kind: "COMPUTER" | "MONITOR";
};

export function MovementTimeline({ items, showAsset = false }: { items: Movement[]; showAsset?: boolean }) {
  if (!items.length) {
    return <EmptyState title="Nenhuma movimentação registrada" description="Alterações de status, alocação e vínculos aparecerão aqui." />;
  }

  return (
    <ol className="space-y-4">
      {items.map((item) => (
        <li key={item.id} className="relative border-l border-line pl-4">
          <span className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-brand" />
          <p className="text-sm font-medium text-slate-900">
            {FIELD_LABELS[item.campo] ?? item.campo}
            {showAsset ? (
              <span className="ml-2 text-xs font-normal text-slate-500">
                {item.kind === "COMPUTER" ? item.computador?.tombo : item.monitor?.tombo}
              </span>
            ) : null}
          </p>
          <p className="text-sm text-slate-600">
            {item.valorAnterior || "—"} → {item.valorNovo || "—"}
          </p>
          <p className="text-xs text-slate-400">
            {formatDateTime(item.createdDate)}
            {item.actor ? ` · ${item.actor.fullName}` : ""}
          </p>
        </li>
      ))}
    </ol>
  );
}
