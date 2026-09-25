import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/authz";
import { canOperateRole } from "@/lib/roles";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MovementTimeline } from "@/components/MovementTimeline";
import { MonitorDetailActions } from "@/components/MonitorDetailActions";
import { GrupoEquipamentos } from "@/components/GrupoEquipamentos";
import { formatPredio } from "@/lib/predios";
import { setorLabel } from "@/lib/alocacao";
import { listAgrupamentoCandidates, listGroupMembers, toClientGroupMember } from "@/lib/equipamento-grupo";
import { computeWarranty } from "@/lib/garantia";
import { computeModernization } from "@/lib/modernizacao";
import { formatCalendarDate, formatDbDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

function Item({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900">{value || "—"}</dd>
    </div>
  );
}

export default async function MonitorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const [monitor, members, candidates] = await Promise.all([
    prisma.monitor.findFirst({
      where: { id, deletedAt: null },
      include: {
        departamento: true,
        localizacao: true,
        movimentacoes: { orderBy: { createdDate: "desc" }, include: { actor: true, computador: true, monitor: true } },
      },
    }),
    listGroupMembers("MONITOR", id),
    listAgrupamentoCandidates(),
  ]);
  if (!monitor) notFound();
  const warranty = computeWarranty({
    dataRecebimento: monitor.dataRecebimento,
    prazoGarantiaAnos: monitor.prazoGarantiaAnos,
  });
  const modernization = computeModernization({
    kind: "MONITOR",
    dataRecebimento: monitor.dataRecebimento,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500">
            <Link href="/monitores" className="hover:underline">Monitores</Link> / {monitor.tombo}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{monitor.tombo}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <StatusBadge status={monitor.status} />
            <span>{monitor.modelo || "Modelo não informado"}</span>
          </div>
        </div>
        <MonitorDetailActions
          monitorId={monitor.id}
          isAdmin={isAdminRole(session?.user?.role)}
          canOperate={canOperateRole(session?.user?.role)}
        />
      </div>

      <section className="surface p-5">
        <h2 className="mb-4 text-sm font-semibold">Identificação</h2>
        <dl className="grid gap-4 sm:grid-cols-3">
          <Item label="Patrimônio" value={monitor.tombo} />
          <Item label="Nº de série" value={monitor.serialNumber} />
          <Item label="Fabricante" value={monitor.fabricante} />
          <Item label="Modelo" value={monitor.modelo} />
          <Item label="Tamanho" value={monitor.tamanho} />
          <Item label="Resolução" value={monitor.resolucao} />
          <Item label="Conexões" value={monitor.conexoes} />
        </dl>
      </section>

      <section className="surface p-5">
        <h2 className="mb-4 text-sm font-semibold">Aquisição e garantia</h2>
        <dl className="grid gap-4 sm:grid-cols-3">
          <Item label="Data da nota fiscal" value={formatDbDate(monitor.dataNotaFiscal)} />
          <Item label="Data de entrada/recebimento" value={formatDbDate(monitor.dataRecebimento)} />
          <Item
            label="Prazo de garantia"
            value={monitor.prazoGarantiaAnos == null ? null : `${monitor.prazoGarantiaAnos} ano(s)`}
          />
          <Item label="Vencimento da garantia" value={formatCalendarDate(warranty.expiresAt)} />
          <Item label="Situação da garantia" value={`${warranty.situationLabel}${warranty.daysLabel !== "—" ? ` · ${warranty.daysLabel}` : ""}`} />
          <Item label="Limite de modernização" value={formatCalendarDate(modernization.deadline)} />
          <Item label="Situação da modernização" value={`${modernization.situationLabel}${modernization.daysLabel !== "—" ? ` · ${modernization.daysLabel}` : ""}`} />
        </dl>
      </section>

      <section className="surface p-5">
        <h2 className="mb-4 text-sm font-semibold">Alocação</h2>
        <dl className="grid gap-4 sm:grid-cols-3">
          <Item label="Usuário" value={monitor.usuario} />
          <Item label="Setor" value={setorLabel(monitor.departamento) || null} />
          <Item label="Prédio" value={formatPredio(monitor.localizacao) || null} />
        </dl>
      </section>

      <GrupoEquipamentos
        current={{ kind: "MONITOR", id: monitor.id, tombo: monitor.tombo }}
        members={members.map(toClientGroupMember)}
        candidates={candidates}
        canOperate={canOperateRole(session?.user?.role)}
      />

      <section className="surface p-5">
        <h2 className="mb-4 text-sm font-semibold">Histórico</h2>
        <MovementTimeline items={monitor.movimentacoes} />
      </section>
    </div>
  );
}
