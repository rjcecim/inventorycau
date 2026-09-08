"use client";

import { useState } from "react";
import type { AssetStatus } from "@prisma/client";
import { ComputerForm } from "@/components/ComputerForm";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { deleteComputador } from "@/app/actions/computadores";
import { useRouter } from "next/navigation";

type Computer = {
  id: string;
  tombo: string;
  hostname: string | null;
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
};

export function ComputerDetailActions({
  computer,
  departments,
  locations,
  people = [],
}: {
  computer: Computer;
  departments: { id: string; nome: string; codigo?: string }[];
  locations: { id: string; nome: string; cidade?: string | null; uf?: string | null }[];
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
      <Dialog title="Editar computador" open={edit} onClose={() => setEdit(false)}>
        <ComputerForm computer={computer} departments={departments} locations={locations} people={people} onSuccess={() => setEdit(false)} />
      </Dialog>
      <Dialog title="Excluir computador" open={remove} onClose={() => setRemove(false)}>
        <p className="mb-4 text-sm text-slate-600">O registro será inativado para preservar o histórico. Equipamentos em uso precisam ter o status alterado antes.</p>
        {error ? <p className="mb-3 text-sm text-rose-700">{error}</p> : null}
        <div className="flex gap-2">
          <Button type="button" variant="danger" onClick={async () => {
            const res = await deleteComputador(computer.id);
            if (res.error) setError(res.error);
            else router.push("/computadores");
          }}>Confirmar</Button>
          <Button type="button" variant="secondary" onClick={() => setRemove(false)}>Cancelar</Button>
        </div>
      </Dialog>
    </div>
  );
}
