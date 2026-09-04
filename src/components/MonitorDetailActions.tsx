"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AssetStatus } from "@prisma/client";
import { MonitorForm } from "@/components/MonitorForm";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { deleteMonitor } from "@/app/actions/monitores";

type Monitor = {
  id: string;
  tombo: string;
  serialNumber: string | null;
  fabricante: string | null;
  modelo: string | null;
  tamanho: string | null;
  resolucao: string | null;
  conexoes: string | null;
  status: AssetStatus;
  observacoes: string | null;
  usuario: string | null;
  servidorId: string | null;
  departamentoId: string | null;
  localizacaoId: string | null;
  computadorId: string | null;
};

export function MonitorDetailActions({
  monitor,
  departments,
  locations,
  computers,
  people = [],
}: {
  monitor: Monitor;
  departments: { id: string; nome: string; codigo?: string }[];
  locations: { id: string; nome: string }[];
  computers: { id: string; tombo: string; hostname: string | null }[];
  people?: { id: string; nome: string; departamentoCodigo: string; departamentoNome: string }[];
}) {
  const [edit, setEdit] = useState(false);
  const [remove, setRemove] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  return (
    <div className="flex gap-2">
      <Button type="button" variant="secondary" onClick={() => setEdit(true)}>Editar</Button>
      <Button type="button" variant="danger" onClick={() => { setError(""); setRemove(true); }}>Excluir</Button>
      <Dialog title="Editar monitor" open={edit} onClose={() => setEdit(false)}>
        <MonitorForm monitor={monitor} departments={departments} locations={locations} computers={computers} people={people} onSuccess={() => setEdit(false)} />
      </Dialog>
      <Dialog title="Excluir monitor" open={remove} onClose={() => setRemove(false)}>
        <p className="mb-4 text-sm text-slate-600">O monitor será inativado para preservar o histórico.</p>
        {error ? <p className="mb-3 text-sm text-rose-700">{error}</p> : null}
        <div className="flex gap-2">
          <Button type="button" variant="danger" onClick={async () => {
            const res = await deleteMonitor(monitor.id);
            if (res.error) setError(res.error);
            else router.push("/monitores");
          }}>Confirmar</Button>
          <Button type="button" variant="secondary" onClick={() => setRemove(false)}>Cancelar</Button>
        </div>
      </Dialog>
    </div>
  );
}
