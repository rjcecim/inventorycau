"use client";

import { useRef, useState, type FormEvent } from "react";
import { flushSync } from "react-dom";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { formatTomboRangeLabel, parseTomboRange } from "@/lib/tombo-range";

export type CadastroMode = "um" | "lote";

export const CADASTRO_MODE_OPTIONS: { id: CadastroMode; label: string }[] = [
  { id: "um", label: "Um equipamento" },
  { id: "lote", label: "Lote" },
];

export function useLoteCadastro(enabled: boolean) {
  const [mode, setMode] = useState<CadastroMode>("um");
  const [tomboInicio, setTomboInicio] = useState("");
  const [tomboFim, setTomboFim] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmToken, setConfirmToken] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const lote = enabled && mode === "lote";
  const parsed = parseTomboRange(tomboInicio, tomboFim);
  const rangeLabel = "ok" in parsed ? formatTomboRangeLabel(parsed.ok) : null;

  function requestConfirm() {
    if (!("ok" in parsed)) return;
    setConfirmOpen(true);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    if (!lote || confirmToken) return;
    event.preventDefault();
    requestConfirm();
  }

  function confirm() {
    setConfirmOpen(false);
    flushSync(() => setConfirmToken(true));
    formRef.current?.requestSubmit();
    setConfirmToken(false);
  }

  return {
    mode,
    setMode,
    tomboInicio,
    setTomboInicio,
    tomboFim,
    setTomboFim,
    confirmOpen,
    setConfirmOpen,
    confirmToken,
    formRef,
    lote,
    rangeLabel,
    onSubmit,
    confirm,
    requestConfirm,
  };
}

export function LoteConfirmDialog({
  open,
  onClose,
  onConfirm,
  noun,
  rangeLabel,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  noun: string;
  rangeLabel: string | null;
}) {
  return (
    <Dialog title="Confirmar cadastro em lote" open={open} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Vai cadastrar {rangeLabel ?? `os ${noun}`} com os mesmos dados, sem número de série.
          {noun === "monitores" ? " Nenhum monitor será vinculado a um computador." : ""} Confirma?
        </p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={onConfirm}>
            Confirmar lote
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
