"use client";

import { useState } from "react";
import { FileSignature } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { CustodyItem } from "@/lib/custody-term";

function setorNomeParaTermo(setor: string) {
  return setor.replace(/^\d+(?:\.\d+)*\.\s*/, "").trim() || setor;
}

export function CustodyTermButton({
  usuario,
  matricula = "",
  setor,
  predio,
  items,
  compact = false,
}: {
  usuario: string;
  matricula?: string;
  setor: string;
  predio: string;
  items: CustodyItem[];
  compact?: boolean;
}) {
  const [pending, setPending] = useState(false);

  async function generate() {
    setPending(true);
    try {
      const [{ pdf }, { CustodyTermPdf }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/print/CustodyTermPdf"),
      ]);
      const dateLabel = new Date().toLocaleDateString("pt-BR", { timeZone: "America/Belem" });
      const logoResponse = await fetch("/marca-tce.jpg");
      const logoBlob = await logoResponse.blob();
      const logoSrc = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(logoBlob);
      });
      const blob = await pdf(
        <CustodyTermPdf
          usuario={usuario.trim() || "—"}
          matricula={matricula.trim() || "—"}
          setor={setorNomeParaTermo(setor.trim()) || "—"}
          predio={predio.trim() || "—"}
          dateLabel={dateLabel}
          items={items}
          logoSrc={logoSrc}
        />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `termo-${items[0]?.tombo || "equipamento"}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setPending(false);
    }
  }

  const label = pending ? "Gerando termo" : "Gerar termo para o usuário assinar";

  if (compact) {
    return (
      <button
        type="button"
        disabled={pending || !items.length}
        onClick={() => void generate()}
        className="inline-flex rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:pointer-events-none disabled:opacity-50"
        title={pending ? "Gerando…" : "Gerar termo para o usuário assinar"}
        aria-label={label}
      >
        <FileSignature size={14} />
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant="secondary"
      disabled={pending || !items.length}
      onClick={() => void generate()}
      title={pending ? "Gerando…" : "Gerar termo para o usuário assinar"}
      aria-label={label}
    >
      <FileSignature size={16} />
      {pending ? "Gerando…" : "Termo"}
    </Button>
  );
}
