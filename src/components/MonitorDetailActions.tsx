"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { deleteMonitor } from "@/app/actions/monitores";

export function MonitorDetailActions({
  monitorId,
  isAdmin,
}: {
  monitorId: string;
  isAdmin: boolean;
}) {
  const [remove, setRemove] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={`/monitores/${monitorId}/mover`}
        className="inline-flex items-center justify-center rounded-xl bg-brand px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-hover"
      >
        Mover
      </Link>
      {isAdmin ? (
        <>
          <Link
            href={`/monitores/${monitorId}/editar`}
            className="inline-flex items-center justify-center rounded-xl bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-line hover:bg-slate-50"
          >
            Editar
          </Link>
          <Button type="button" variant="danger" onClick={() => { setError(""); setRemove(true); }}>
            Excluir
          </Button>
          <Dialog title="Excluir monitor" open={remove} onClose={() => setRemove(false)}>
            <p className="mb-4 text-sm text-slate-600">O monitor será inativado para preservar o histórico.</p>
            {error ? <p className="mb-3 text-sm text-rose-700">{error}</p> : null}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="danger"
                onClick={async () => {
                  const res = await deleteMonitor(monitorId);
                  if (res.error) setError(res.error);
                  else router.push("/monitores");
                }}
              >
                Confirmar
              </Button>
              <Button type="button" variant="secondary" onClick={() => setRemove(false)}>
                Cancelar
              </Button>
            </div>
          </Dialog>
        </>
      ) : null}
    </div>
  );
}
