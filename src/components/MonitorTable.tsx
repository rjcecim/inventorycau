"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AssetStatus } from "@prisma/client";
import { Plus } from "lucide-react";
import { MonitorForm } from "@/components/MonitorForm";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SelectInput, TextInput } from "@/components/ui/Field";
import { STATUS_ORDER, statusLabel } from "@/lib/status";

type Row = {
  id: string;
  tombo: string;
  serialNumber: string | null;
  fabricante: string | null;
  modelo: string | null;
  status: AssetStatus;
  usuario: string | null;
  departamento: { id?: string; nome: string; codigo?: string } | null;
  computador: { id: string; tombo: string; hostname: string | null } | null;
};

export function MonitorTable({
  monitors,
  departments,
  locations,
  computers,
  people = [],
  isAdmin,
}: {
  monitors: Row[];
  departments: { id: string; nome: string; codigo?: string }[];
  locations: { id: string; nome: string }[];
  computers: { id: string; tombo: string; hostname: string | null }[];
  people?: { id: string; nome: string; departamentoCodigo: string; departamentoNome: string }[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    const term = q.toLowerCase();
    return monitors.filter((row) => {
      const hay = [row.tombo, row.serialNumber, row.usuario, row.fabricante, row.modelo, row.computador?.tombo]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (term && !hay.includes(term)) return false;
      if (status && row.status !== status) return false;
      return true;
    });
  }, [monitors, q, status]);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap gap-2">
          <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Patrimônio, serial, usuário, computador…" className="max-w-sm" />
          <SelectInput value={status} onChange={(e) => setStatus(e.target.value)} className="max-w-48">
            <option value="">Todos os status</option>
            {STATUS_ORDER.map((item) => <option key={item} value={item}>{statusLabel(item)}</option>)}
          </SelectInput>
        </div>
        {isAdmin ? (
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> Novo monitor
          </Button>
        ) : null}
      </div>
      <div className="overflow-x-auto rounded-xl border border-line bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b border-line bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Patrimônio</th>
              <th className="px-4 py-3">Modelo</th>
              <th className="px-4 py-3">Computador</th>
              <th className="px-4 py-3">Usuário</th>
              <th className="px-4 py-3">Setor</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="cursor-pointer border-b border-line last:border-0 hover:bg-slate-50" onClick={() => router.push(`/monitores/${row.id}`)}>
                <td className="px-4 py-3 font-medium text-slate-900">{row.tombo}</td>
                <td className="px-4 py-3 text-slate-600">{[row.fabricante, row.modelo].filter(Boolean).join(" ") || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{row.computador?.hostname || row.computador?.tombo || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{row.usuario || "—"}</td>
                <td className="px-4 py-3 text-slate-600">
                  {row.departamento
                    ? `${row.departamento.codigo ? `${row.departamento.codigo}. ` : ""}${row.departamento.nome}`
                    : "—"}
                </td>
                <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length ? <EmptyState title="Nenhum monitor encontrado" /> : null}
      </div>
      <p className="mt-3 text-xs text-slate-500">{filtered.length} de {monitors.length} monitores</p>
      <Dialog title="Novo monitor" open={createOpen} onClose={() => setCreateOpen(false)}>
        <MonitorForm
          departments={departments}
          locations={locations}
          computers={computers}
          people={people}
          onSuccess={() => setCreateOpen(false)}
        />
      </Dialog>
    </>
  );
}
