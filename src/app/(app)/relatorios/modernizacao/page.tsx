import Link from "next/link";
import { auth } from "@/auth";
import { PageHeader } from "@/components/PageHeader";
import { ModernizacaoReport } from "@/components/ModernizacaoReport";
import { monitorAlocacao, setorLabel } from "@/lib/alocacao";
import { isAdminRole } from "@/lib/authz";
import { calendarToIso, toCalendarDate, toInputDate } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function RelatorioModernizacaoPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const [{ tipo }, session] = await Promise.all([searchParams, auth()]);

  const [computers, monitors, departments, apuracoes] = await Promise.all([
    prisma.computador.findMany({
      where: { deletedAt: null },
      include: { departamento: true },
      orderBy: { tombo: "asc" },
    }),
    prisma.monitor.findMany({
      where: { deletedAt: null },
      include: {
        departamento: true,
      },
      orderBy: { tombo: "asc" },
    }),
    prisma.departamento.findMany({ orderBy: [{ sortOrder: "asc" }, { nome: "asc" }] }),
    prisma.apuracaoModernizacao.findMany({
      orderBy: { ano: "desc" },
      include: { createdBy: { select: { fullName: true } } },
    }),
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
      dataRecebimento: toInputDate(item.dataRecebimento) || null,
    })),
    ...monitors.map((item) => {
      const aloc = monitorAlocacao(item);
      return {
        id: item.id,
        kind: "MONITOR" as const,
        tombo: item.tombo,
        fabricante: item.fabricante,
        modelo: item.modelo,
        setorId: item.departamentoId,
        setorLabel: setorLabel(aloc.departamento),
        dataRecebimento: toInputDate(item.dataRecebimento) || null,
      };
    }),
  ];

  const setores = departments.map((item) => ({
    id: item.id,
    label: setorLabel(item),
  }));

  const apuracaoRows = apuracoes.map((item) => ({
    id: item.id,
    ano: item.ano,
    dataReferencia: calendarToIso(toCalendarDate(item.dataReferencia)!),
    escopo: item.escopo,
    observacao: item.observacao,
    createdDate: item.createdDate.toISOString(),
    createdByName: item.createdBy?.fullName ?? null,
    resultado: item.resultado,
    equipamentos: item.equipamentos,
  }));

  return (
    <>
      <PageHeader
        title="Relatório de modernização"
        description="Computadores: 6 anos · Monitores: 8 anos, a partir da data de recebimento. Índices por categoria."
        actions={
          <Link href="/relatorios" className="text-sm font-medium text-brand hover:underline">
            Voltar aos relatórios
          </Link>
        }
      />
      <ModernizacaoReport
        rows={rows}
        setores={setores}
        apuracoes={apuracaoRows}
        canSave={isAdminRole(session?.user?.role)}
        initialTipo={tipo ?? "todos"}
      />
    </>
  );
}
