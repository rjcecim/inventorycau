import { PageHeader } from "@/components/PageHeader";
import { GarantiasReport } from "@/components/GarantiasReport";
import { monitorAlocacao, setorLabel } from "@/lib/alocacao";
import { toInputDate } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function RelatorioGarantiasPage({
  searchParams,
}: {
  searchParams: Promise<{ situacao?: string }>;
}) {
  const { situacao } = await searchParams;

  const [computers, monitors, departments] = await Promise.all([
    prisma.computador.findMany({
      where: { deletedAt: null },
      include: { departamento: true },
      orderBy: { tombo: "asc" },
    }),
    prisma.monitor.findMany({
      where: { deletedAt: null },
      include: {
        departamento: true,
        computador: { include: { departamento: true } },
      },
      orderBy: { tombo: "asc" },
    }),
    prisma.departamento.findMany({ orderBy: [{ sortOrder: "asc" }, { nome: "asc" }] }),
  ]);

  const rows = [
    ...computers.map((item) => ({
      id: item.id,
      kind: "COMPUTER" as const,
      tombo: item.tombo,
      fabricante: item.fabricante,
      modelo: item.modelo,
      setorId: item.departamentoId,
      setorLabel: setorLabel(item.departamento),
      dataNotaFiscal: toInputDate(item.dataNotaFiscal) || null,
      dataRecebimento: toInputDate(item.dataRecebimento) || null,
      prazoGarantiaAnos: item.prazoGarantiaAnos,
    })),
    ...monitors.map((item) => {
      const aloc = monitorAlocacao(item);
      return {
        id: item.id,
        kind: "MONITOR" as const,
        tombo: item.tombo,
        fabricante: item.fabricante,
        modelo: item.modelo,
        setorId: item.computador?.departamentoId ?? item.departamentoId,
        setorLabel: setorLabel(aloc.departamento),
        dataNotaFiscal: toInputDate(item.dataNotaFiscal) || null,
        dataRecebimento: toInputDate(item.dataRecebimento) || null,
        prazoGarantiaAnos: item.prazoGarantiaAnos,
      };
    }),
  ];

  const setores = departments.map((item) => ({
    id: item.id,
    label: setorLabel(item),
  }));

  return (
    <>
      <PageHeader
        title="Relatório de garantias"
        description="Vencimento = data de recebimento + prazo em anos. A data da nota fiscal é apenas informativa."
        actions={
          <Link href="/relatorios" className="text-sm font-medium text-brand hover:underline">
            Voltar aos relatórios
          </Link>
        }
      />
      <GarantiasReport rows={rows} setores={setores} initialSituacao={situacao ?? "todas"} />
    </>
  );
}
