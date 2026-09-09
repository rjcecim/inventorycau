"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AssetStatus } from "@prisma/client";
import { Pencil, Plus } from "lucide-react";
import { ComputerForm } from "@/components/ComputerForm";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TextInput } from "@/components/ui/Field";
import { SearchSelect } from "@/components/ui/SearchSelect";
import { STATUS_OPTIONS } from "@/lib/status";
import { formatPredio } from "@/lib/predios";

type Row = {
  id: string;
  tombo: string;
  serialNumber: string | null;
  fabricante: string | null;
  modelo: string | null;
  status: AssetStatus;
  processador: string | null;
  memoriaRam: string | null;
  armazenamento: string | null;
  sistemaOperacional: string | null;
  soVersao: string | null;
  arquitetura: string | null;
  observacoes: string | null;
  usuario: string | null;
  servidorId: string | null;
  departamentoId: string | null;
  localizacaoId: string | null;
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
  const [editing, setEditing] = useState<Row | null>(null);

  const filtered = useMemo(() => {
    const term = q.toLowerCase();
    return computers.filter((row) => {
      const hay = [row.tombo, row.serialNumber, row.usuario, row.fabricante, row.modelo]
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
          <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Patrimônio, serial, usuário…" className="max-w-sm" />
          <SearchSelect
            value={status}
            onChange={setStatus}
            emptyLabel="Todos os status"
            placeholder="Pesquisar status…"
            className="w-56"
            options={STATUS_OPTIONS}
          />
          <SearchSelect
            value={dept}
            onChange={setDept}
            emptyLabel="Todos os setores"
            placeholder="Pesquisar setor…"
            className="w-72"
            options={departments.map((item) => ({
              id: item.id,
              label: item.codigo ? `${item.codigo}. ${item.nome}` : item.nome,
            }))}
          />
          <SearchSelect
            value={predio}
            onChange={setPredio}
            emptyLabel="Todos os prédios"
            placeholder="Pesquisar prédio…"
            className="w-72"
            options={locations.map((item) => ({
              id: item.id,
              label: formatPredio(item),
            }))}
          />
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
              <th className="px-4 py-3">Patrimônio</th>
              <th className="px-4 py-3">Modelo</th>
              <th className="px-4 py-3">Usuário</th>
              <th className="px-4 py-3">Setor</th>
              <th className="px-4 py-3">Prédio</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Monitores</th>
              {isAdmin ? <th className="px-4 py-3 text-right">Ações</th> : null}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr
                key={row.id}
                className="cursor-pointer border-b border-line last:border-0 hover:bg-slate-50"
                onClick={() => router.push(`/computadores/${row.id}`)}
              >
                <td className="px-4 py-3 font-medium text-slate-900">{row.tombo}</td>
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
            ))}
          </tbody>
        </table>
        {!filtered.length ? <EmptyState title="Nenhum computador encontrado" description="Ajuste os filtros ou cadastre um novo ativo." /> : null}
      </div>
      <p className="mt-3 text-xs text-slate-500">{filtered.length} de {computers.length} computadores</p>
      <Dialog
        title={editing ? "Editar computador" : "Novo computador"}
        open={createOpen || Boolean(editing)}
        onClose={() => {
          setCreateOpen(false);
          setEditing(null);
        }}
      >
        <ComputerForm
          key={editing?.id ?? "new"}
          computer={editing ?? undefined}
          departments={departments}
          locations={locations}
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
