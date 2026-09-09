"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AssetStatus } from "@prisma/client";
import { Pencil, Plus } from "lucide-react";
import { MonitorForm } from "@/components/MonitorForm";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TextInput } from "@/components/ui/Field";
import { SearchSelect } from "@/components/ui/SearchSelect";
import { STATUS_OPTIONS } from "@/lib/status";
import { monitorAlocacao, setorLabel } from "@/lib/alocacao";

type Row = {
  id: string;
  tombo: string;
  serialNumber: string | null;
  fabricante: string | null;
  modelo: string | null;
  status: AssetStatus;
  tamanho: string | null;
  resolucao: string | null;
  conexoes: string | null;
  observacoes: string | null;
  usuario: string | null;
  servidorId: string | null;
  departamentoId: string | null;
  localizacaoId: string | null;
  computadorId: string | null;
  departamento: { id?: string; nome: string; codigo?: string } | null;
  computador: {
    id: string;
    tombo: string;
    usuario: string | null;
    status: AssetStatus;
    departamento: { codigo?: string; nome: string } | null;
  } | null;
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
  locations: { id: string; nome: string; cidade?: string | null; uf?: string | null }[];
  computers: {
    id: string;
    tombo: string;
    usuario: string | null;
    status: AssetStatus;
    departamento: { codigo: string; nome: string } | null;
  }[];
  people?: { id: string; nome: string; departamentoCodigo: string; departamentoNome: string }[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);

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
          <SearchSelect
            value={status}
            onChange={setStatus}
            emptyLabel="Todos os status"
            placeholder="Pesquisar status…"
            className="w-56"
            options={STATUS_OPTIONS}
          />
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
              {isAdmin ? <th className="px-4 py-3 text-right">Ações</th> : null}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const alocacao = monitorAlocacao(row);
              return (
              <tr key={row.id} className="cursor-pointer border-b border-line last:border-0 hover:bg-slate-50" onClick={() => router.push(`/monitores/${row.id}`)}>
                <td className="px-4 py-3 font-medium text-slate-900">{row.tombo}</td>
                <td className="px-4 py-3 text-slate-600">{[row.fabricante, row.modelo].filter(Boolean).join(" ") || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{row.computador?.tombo || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{alocacao.usuario || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{setorLabel(alocacao.departamento) || "—"}</td>
                <td className="px-4 py-3"><StatusBadge status={alocacao.status} /></td>
                {isAdmin ? (
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                      title="Editar"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditing(row);
                      }}
                    >
                      <Pencil size={14} />
                    </button>
                  </td>
                ) : null}
              </tr>
              );
            })}
          </tbody>
        </table>
        {!filtered.length ? <EmptyState title="Nenhum monitor encontrado" /> : null}
      </div>
      <p className="mt-3 text-xs text-slate-500">{filtered.length} de {monitors.length} monitores</p>
      <Dialog
        title={editing ? "Editar monitor" : "Novo monitor"}
        open={createOpen || Boolean(editing)}
        onClose={() => {
          setCreateOpen(false);
          setEditing(null);
        }}
      >
        <MonitorForm
          key={editing?.id ?? "new"}
          monitor={editing ?? undefined}
          departments={departments}
          locations={locations}
          computers={computers}
          people={people}
          onSuccess={() => {
            setCreateOpen(false);
            setEditing(null);
          }}
        />
      </Dialog>
    </>
  );
}
