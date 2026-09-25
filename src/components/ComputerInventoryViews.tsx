import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { AssetStatus } from "@prisma/client";
import { auth } from "@/auth";
import { ComputerDetailActions } from "@/components/ComputerDetailActions";
import { ComputerEditor } from "@/components/ComputerEditor";
import { ComputerMover } from "@/components/ComputerMover";
import { ComputerTable } from "@/components/ComputerTable";
import { GrupoEquipamentos } from "@/components/GrupoEquipamentos";
import { MovementTimeline } from "@/components/MovementTimeline";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { loadComputerFormOptions, toComputerFormValues } from "@/lib/asset-form";
import { isAdminRole } from "@/lib/authz";
import { canOperateRole } from "@/lib/roles";
import { formatDbDate, formatCalendarDate } from "@/lib/dates";
import { listAgrupamentoCandidates, listGroupMembers, toClientGroupMember } from "@/lib/equipamento-grupo";
import { computeWarranty } from "@/lib/garantia";
import { desktopWhere, notebookWhere, variantCopy, type ComputerVariant } from "@/lib/inventory-kind";
import { computeModernization } from "@/lib/modernizacao";
import { formatPredio } from "@/lib/predios";
import { prisma } from "@/lib/prisma";

function tipoWhere(variant: ComputerVariant) {
  return variant === "NOTEBOOK" ? notebookWhere() : desktopWhere();
}

function Item({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900">{value || "—"}</dd>
    </div>
  );
}

export async function ComputerListView({
  variant,
  status,
}: {
  variant: ComputerVariant;
  status?: AssetStatus;
}) {
  const session = await auth();
  const copy = variantCopy(variant);
  const computers = await prisma.computador.findMany({
    where: { deletedAt: null, ...tipoWhere(variant), ...(status ? { status } : {}) },
    orderBy: { tombo: "asc" },
    include: { departamento: true, localizacao: true },
  });
  const groupIds = [...new Set(computers.map((item) => item.groupId).filter((id): id is string => Boolean(id)))];
  const [pcGroups, monitorGroups] = variant === "DESKTOP" && groupIds.length
    ? await Promise.all([
        prisma.computador.groupBy({
          by: ["groupId"],
          where: { deletedAt: null, tipo: "DESKTOP", groupId: { in: groupIds } },
          _count: { _all: true },
        }),
        prisma.monitor.groupBy({
          by: ["groupId"],
          where: { deletedAt: null, groupId: { in: groupIds } },
          _count: { _all: true },
        }),
      ])
    : [[], []];
  const pcCount = new Map(pcGroups.map((item) => [item.groupId, item._count._all]));
  const monCount = new Map(monitorGroups.map((item) => [item.groupId, item._count._all]));
  const rows = computers.map((item) => ({
    ...item,
    agrupados: item.groupId ? (pcCount.get(item.groupId) ?? 0) + (monCount.get(item.groupId) ?? 0) - 1 : 0,
  }));

  return (
    <>
      <PageHeader title={copy.title} description={copy.listDescription} />
      <ComputerTable
        computers={rows}
        isAdmin={isAdminRole(session?.user?.role)}
        canOperate={canOperateRole(session?.user?.role)}
        variant={variant}
      />
    </>
  );
}

export async function ComputerNewView({ variant }: { variant: ComputerVariant }) {
  const session = await auth();
  const copy = variantCopy(variant);
  if (!isAdminRole(session?.user?.role)) redirect(copy.basePath);
  const { departments, locations, people } = await loadComputerFormOptions();

  return (
    <>
      <p className="mb-2 text-xs font-medium text-slate-500">
        <Link href={copy.basePath} className="hover:underline">{copy.title}</Link>
        {" / Novo"}
      </p>
      <PageHeader title={copy.newTitle} description={copy.newDescription} />
      <ComputerEditor
        departments={departments}
        locations={locations}
        people={people}
        cancelHref={copy.basePath}
        variant={variant}
      />
    </>
  );
}

export async function ComputerDetailView({
  variant,
  id,
}: {
  variant: ComputerVariant;
  id: string;
}) {
  const session = await auth();
  const copy = variantCopy(variant);
  const [computer, members, candidates] = await Promise.all([
    prisma.computador.findFirst({
      where: { id, deletedAt: null, ...tipoWhere(variant) },
      include: {
        departamento: true,
        localizacao: true,
        movimentacoes: { orderBy: { createdDate: "desc" }, include: { actor: true, computador: true, monitor: true } },
      },
    }),
    variant === "DESKTOP" ? listGroupMembers("COMPUTER", id) : Promise.resolve([]),
    variant === "DESKTOP" ? listAgrupamentoCandidates() : Promise.resolve([]),
  ]);
  if (!computer) notFound();
  const warranty = computeWarranty({
    dataRecebimento: computer.dataRecebimento,
    prazoGarantiaAnos: computer.prazoGarantiaAnos,
  });
  const modernization = computeModernization({
    kind: copy.modernizationKind,
    dataRecebimento: computer.dataRecebimento,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500">
            <Link href={copy.basePath} className="hover:underline">{copy.title}</Link> / {computer.tombo}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{computer.tombo}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <StatusBadge status={computer.status} />
            <span>{computer.usuario || "Sem usuário"}</span>
            <span>{computer.departamento ? `${computer.departamento.codigo}. ${computer.departamento.nome}` : "Sem setor"}</span>
            <span>{formatPredio(computer.localizacao) || "Sem prédio"}</span>
          </div>
        </div>
        <ComputerDetailActions
          computerId={computer.id}
          isAdmin={isAdminRole(session?.user?.role)}
          canOperate={canOperateRole(session?.user?.role)}
          variant={variant}
        />
      </div>

      <section className="surface p-5">
        <h2 className="mb-4 text-sm font-semibold">Geral</h2>
        <dl className="grid gap-4 sm:grid-cols-3">
          <Item label="Patrimônio" value={computer.tombo} />
          <Item label="Nº de série" value={computer.serialNumber} />
          <Item label="Fabricante" value={computer.fabricante} />
          <Item label="Modelo" value={computer.modelo} />
        </dl>
      </section>

      <section className="surface p-5">
        <h2 className="mb-4 text-sm font-semibold">Hardware</h2>
        <dl className="grid gap-4 sm:grid-cols-3">
          <Item label="Processador" value={computer.processador} />
          <Item label="Memória RAM" value={computer.memoriaRam} />
          <Item label="Armazenamento" value={computer.armazenamento} />
        </dl>
      </section>

      <section className="surface p-5">
        <h2 className="mb-4 text-sm font-semibold">Aquisição e garantia</h2>
        <dl className="grid gap-4 sm:grid-cols-3">
          <Item label="Data da nota fiscal" value={formatDbDate(computer.dataNotaFiscal)} />
          <Item label="Data de entrada/recebimento" value={formatDbDate(computer.dataRecebimento)} />
          <Item
            label="Prazo de garantia"
            value={computer.prazoGarantiaAnos == null ? null : `${computer.prazoGarantiaAnos} ano(s)`}
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
          <Item label="Usuário" value={computer.usuario} />
          <Item label="Setor" value={computer.departamento ? `${computer.departamento.codigo}. ${computer.departamento.nome}` : null} />
          <Item label="Prédio" value={formatPredio(computer.localizacao) || null} />
          <Item label="Observações" value={computer.observacoes} />
        </dl>
      </section>

      {variant === "DESKTOP" ? (
        <GrupoEquipamentos
          current={{ kind: "COMPUTER", id: computer.id, tombo: computer.tombo }}
          members={members.map(toClientGroupMember)}
          candidates={candidates}
          canOperate={canOperateRole(session?.user?.role)}
        />
      ) : null}

      <section className="surface p-5">
        <h2 className="mb-4 text-sm font-semibold">Histórico</h2>
        <MovementTimeline items={computer.movimentacoes} />
      </section>
    </div>
  );
}

export async function ComputerEditView({
  variant,
  id,
}: {
  variant: ComputerVariant;
  id: string;
}) {
  const session = await auth();
  const copy = variantCopy(variant);
  if (!isAdminRole(session?.user?.role)) redirect(copy.basePath);
  const [computer, options] = await Promise.all([
    prisma.computador.findFirst({ where: { id, deletedAt: null, ...tipoWhere(variant) } }),
    loadComputerFormOptions(),
  ]);
  if (!computer) notFound();

  return (
    <>
      <p className="mb-2 text-xs font-medium text-slate-500">
        <Link href={copy.basePath} className="hover:underline">{copy.title}</Link>
        {" / "}
        <Link href={`${copy.basePath}/${computer.id}`} className="hover:underline">{computer.tombo}</Link>
        {" / Editar"}
      </p>
      <PageHeader title={`Editar ${computer.tombo}`} description={copy.editDescription} />
      <ComputerEditor
        computer={toComputerFormValues(computer)}
        departments={options.departments}
        locations={options.locations}
        people={options.people}
        cancelHref={`${copy.basePath}/${computer.id}`}
        variant={variant}
      />
    </>
  );
}

export async function ComputerMoveView({
  variant,
  id,
}: {
  variant: ComputerVariant;
  id: string;
}) {
  const session = await auth();
  const copy = variantCopy(variant);
  if (!session?.user?.id) redirect("/login");
  if (!canOperateRole(session.user.role)) redirect(copy.basePath);
  const [computer, options, members] = await Promise.all([
    prisma.computador.findFirst({ where: { id, deletedAt: null, ...tipoWhere(variant) } }),
    loadComputerFormOptions(),
    variant === "DESKTOP" ? listGroupMembers("COMPUTER", id) : Promise.resolve([]),
  ]);
  if (!computer) notFound();

  return (
    <>
      <p className="mb-2 text-xs font-medium text-slate-500">
        <Link href={copy.basePath} className="hover:underline">{copy.title}</Link>
        {" / "}
        <Link href={`${copy.basePath}/${computer.id}`} className="hover:underline">{computer.tombo}</Link>
        {" / Mover"}
      </p>
      <PageHeader title={`Mover ${computer.tombo}`} description={copy.moveDescription} />
      <ComputerMover
        computer={{
          id: computer.id,
          tombo: computer.tombo,
          status: computer.status,
          servidorId: computer.servidorId,
          departamentoId: computer.departamentoId,
          localizacaoId: computer.localizacaoId,
        }}
        departments={options.departments}
        locations={options.locations}
        people={options.people}
        grouped={members.length >= 2}
        cancelHref={`${copy.basePath}/${computer.id}`}
        variant={variant}
      />
    </>
  );
}
