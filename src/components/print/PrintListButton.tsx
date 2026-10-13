"use client";

import { useState } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import type { PdfCell, PdfColumn } from "@/components/print/InventoryPdf";

async function downloadInventoryPdf({
  title,
  filename,
  columns,
  rows,
}: {
  title: string;
  filename: string;
  columns: PdfColumn[];
  rows: Array<Record<string, PdfCell>>;
}) {
  const [{ pdf }, { InventoryPdf }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/print/InventoryPdf"),
  ]);
  const generatedAt = new Date().toLocaleString("pt-BR", { timeZone: "America/Belem" });
  const blob = await pdf(
    <InventoryPdf title={title} generatedAt={generatedAt} columns={columns} rows={rows} />,
  ).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function PrintListButton({
  title,
  filename,
  columns,
  rows,
  disabled = false,
}: {
  title: string;
  filename: string;
  columns: PdfColumn[];
  rows: Array<Record<string, PdfCell>>;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(() => columns.map((column) => column.id));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  function openDialog() {
    setSelected(columns.map((column) => column.id));
    setError("");
    setOpen(true);
  }

  function toggle(id: string) {
    setSelected((current) => (
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    ));
  }

  async function confirm() {
    const chosen = columns.filter((column) => selected.includes(column.id));
    if (!chosen.length) return;
    setPending(true);
    setError("");
    try {
      await downloadInventoryPdf({ title, filename, columns: chosen, rows });
      setOpen(false);
    } catch {
      setError("Não foi possível gerar o PDF.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button type="button" variant="secondary" disabled={disabled} onClick={openDialog}>
        <Printer size={16} /> Imprimir
      </Button>
      <Dialog title="Imprimir" open={open} onClose={() => setOpen(false)}>
        <p className="mb-3 text-sm text-slate-600">
          {rows.length} {rows.length === 1 ? "linha visível" : "linhas visíveis"}. Desmarque as colunas que não devem sair no PDF.
        </p>
        <ul className="grid gap-2">
          {columns.map((column) => (
            <li key={column.id}>
              <label className="flex items-center gap-2 text-sm text-slate-800">
                <input
                  type="checkbox"
                  checked={selected.includes(column.id)}
                  onChange={() => toggle(column.id)}
                />
                {column.label}
              </label>
            </li>
          ))}
        </ul>
        {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button type="button" disabled={pending || !selected.length} onClick={() => void confirm()}>
            {pending ? "Gerando…" : "Gerar PDF"}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
