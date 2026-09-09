"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { AssetStatus } from "@prisma/client";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TextInput } from "@/components/ui/Field";
import { statusLabel } from "@/lib/status";

type MonitorRef = { id: string; tombo: string; modelo: string };

type Row = {
  id: string;
  kind: "computer" | "monitor";
  href: string;
  setor: string;
  predio: string;
  computadorTombo: string;
  modelo: string;
  status: AssetStatus;
  usuario: string;
  monitores: MonitorRef[];
};

function PatrimonioLink({ href, label, modelo }: { href: string; label: string; modelo: string }) {
  return (
    <Link className="text-brand hover:underline" href={href} title={modelo || "Modelo não informado"}>
      {label}
    </Link>
  );
}

export function VisaoGeralTable({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) => {
      const hay = [
        row.setor,
        row.predio,
        row.computadorTombo,
        row.modelo,
        statusLabel(row.status),
        row.usuario,
        ...row.monitores.flatMap((monitor) => [monitor.tombo, monitor.modelo]),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(term);
    });
  }, [rows, q]);

  return (
    <>
      <div className="mb-4">
        <TextInput
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar setor, prédio, patrimônio, modelo, status ou usuário…"
          className="max-w-lg"
        />
      </div>
      <div className="overflow-x-auto rounded-xl border border-line bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b border-line bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Setor</th>
              <th className="px-4 py-3">Prédio</th>
              <th className="px-4 py-3">Patrimônio do computador</th>
              <th className="px-4 py-3">Modelo</th>
              <th className="px-4 py-3">Patrimônio dos monitores</th>
              <th className="px-4 py-3">Nome do usuário</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="border-b border-line last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-600">{row.setor || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{row.predio || "—"}</td>
                <td className="px-4 py-3 font-medium">
                  {row.kind === "computer" ? (
                    <PatrimonioLink href={row.href} label={row.computadorTombo} modelo={row.modelo} />
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">{row.modelo || "—"}</td>
                <td className="px-4 py-3 text-slate-600">
                  {row.monitores.length ? (
                    <span className="flex flex-wrap gap-x-2 gap-y-1">
                      {row.monitores.map((monitor, index) => (
                        <span key={monitor.id}>
                          <PatrimonioLink href={`/monitores/${monitor.id}`} label={monitor.tombo} modelo={monitor.modelo} />
                          {index < row.monitores.length - 1 ? "," : ""}
                        </span>
                      ))}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">{row.usuario || "—"}</td>
                <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length ? (
          <EmptyState
            title="Nenhum registro nesta visão"
            description="Cadastre equipamentos associados a um setor ou ajuste a busca."
          />
        ) : null}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        {filtered.length} de {rows.length} registros
      </p>
    </>
  );
}
