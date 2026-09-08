"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AssetStatus } from "@prisma/client";
import { Plus } from "lucide-react";
import { ComputerForm } from "@/components/ComputerForm";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TextInput, SelectInput } from "@/components/ui/Field";
import { STATUS_ORDER, statusLabel } from "@/lib/status";
import { formatPredio } from "@/lib/predios";

type Row = {
  id: string;
  hostname: string | null;
  tombo: string;
  serialNumber: string | null;
  fabricante: string | null;
  modelo: string | null;
  status: AssetStatus;
  usuario: string | null;
  departamento: { id: string; nome: string; codigo?: string } | null;
  localizacao: { id: string; nome: string; cidade: string; uf: string | null } | null;
  _count: { monitores: number };
};

export function ComputerTable({
  computers,
  departments,
  locations,
  people = [],
  isAdmin,
}: {
  computers: Row[];
  departments: { id: string; nome: string; codigo?: string }[];
  locations: { id: string; nome: string; cidade?: string | null; uf?: string | null }[];
  people?: { id: string; nome: string; departamentoCodigo: string; departamentoNome: string }[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [dept, setDept] = useState("");
  const [predio, setPredio] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    const term = q.toLowerCase();
    return computers.filter((row) => {
      const hay = [row.hostname, row.tombo, row.serialNumber, row.usuario, row.fabricante, row.modelo]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (term && !hay.includes(term)) return false;
      if (status && row.status !== status) return false;
      if (dept && row.departamento?.id !== dept) return false;
      if (predio && row.localizacao?.id !== predio) return false;
      return true;
    });
  }, [computers, q, status, dept, predio]);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap gap-2">
          <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Hostname, patrimônio, serial, usuário…" className="max-w-sm" />
          <SelectInput value={status} onChange={(e) => setStatus(e.target.value)} className="max-w-48">
            <option value="">Todos os status</option>
            {STATUS_ORDER.map((item) => <option key={item} value={item}>{statusLabel(item)}</option>)}
          </SelectInput>
          <SelectInput value={dept} onChange={(e) => setDept(e.target.value)} className="max-w-72">
            <option value="">Todos os setores</option>
            {departments.map((item) => (
              <option key={item.id} value={item.id}>
                {item.codigo ? `${item.codigo}. ${item.nome}` : item.nome}
              </option>
            ))}
          </SelectInput>
          <SelectInput value={predio} onChange={(e) => setPredio(e.target.value)} className="max-w-72">
            <option value="">Todos os prédios</option>
            {locations.map((item) => (
              <option key={item.id} value={item.id}>{formatPredio(item)}</option>
            ))}
          </SelectInput>
          {(q || status || dept || predio) ? (
            <Button variant="ghost" type="button" onClick={() => { setQ(""); setStatus(""); setDept(""); setPredio(""); }}>
              Limpar
            </Button>
          ) : null}
        </div>
        {isAdmin ? (
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> Novo computador
          </Button>
        ) : null}
      </div>
      <div className="overflow-x-auto rounded-xl border border-line bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b border-line bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Hostname</th>
              <th className="px-4 py-3">Patrimônio</th>
              <th className="px-4 py-3">Modelo</th>
              <th className="px-4 py-3">Usuário</th>
              <th className="px-4 py-3">Setor</th>
              <th className="px-4 py-3">Prédio</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Monitores</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr
                key={row.id}
                className="cursor-pointer border-b border-line last:border-0 hover:bg-slate-50"
                onClick={() => router.push(`/computadores/${row.id}`)}
              >
                <td className="px-4 py-3 font-medium text-slate-900">{row.hostname || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{row.tombo}</td>
                <td className="px-4 py-3 text-slate-600">{[row.fabricante, row.modelo].filter(Boolean).join(" ") || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{row.usuario || "—"}</td>
                <td className="px-4 py-3 text-slate-600">
                  {row.departamento
                    ? `${row.departamento.codigo ? `${row.departamento.codigo}. ` : ""}${row.departamento.nome}`
                    : "—"}
                </td>
                <td className="px-4 py-3 text-slate-600">{formatPredio(row.localizacao) || "—"}</td>
                <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                <td className="px-4 py-3 text-slate-600">{row._count.monitores}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length ? <EmptyState title="Nenhum computador encontrado" description="Ajuste os filtros ou cadastre um novo ativo." /> : null}
      </div>
      <p className="mt-3 text-xs text-slate-500">{filtered.length} de {computers.length} computadores</p>
      <Dialog title="Novo computador" open={createOpen} onClose={() => setCreateOpen(false)}>
        <ComputerForm
          departments={departments}
          locations={locations}
          people={people}
          onSuccess={() => setCreateOpen(false)}
        />
      </Dialog>
    </>
  );
}
