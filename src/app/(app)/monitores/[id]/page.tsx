import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/authz";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MovementTimeline } from "@/components/MovementTimeline";
import { MonitorDetailActions } from "@/components/MonitorDetailActions";

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
  const monitor = await prisma.monitor.findFirst({
    where: { id, deletedAt: null },
    include: {
      departamento: true,
      localizacao: true,
      computador: true,
      movimentacoes: { orderBy: { createdDate: "desc" }, take: 30, include: { actor: true, computador: true, monitor: true } },
    },
  });
  if (!monitor) notFound();

  const [departments, locations, computers, people] = await Promise.all([
    prisma.departamento.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.localizacao.findMany({ orderBy: { nome: "asc" } }),
    prisma.computador.findMany({ where: { deletedAt: null }, orderBy: { tombo: "asc" } }),
    prisma.servidor.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      include: { departamento: true },
    }),
  ]);

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
            <span>{[monitor.fabricante, monitor.modelo].filter(Boolean).join(" ") || "Modelo não informado"}</span>
          </div>
        </div>
        {isAdminRole(session?.user?.role) ? (
          <MonitorDetailActions
            monitor={monitor}
            departments={departments}
            locations={locations}
            computers={computers}
            people={people.map((p) => ({
              id: p.id,
              nome: p.nome,
              departamentoCodigo: p.departamento.codigo,
              departamentoNome: p.departamento.nome,
            }))}
          />
        ) : null}
      </div>

      <section className="rounded-xl border border-line bg-white p-5">
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

      <section className="rounded-xl border border-line bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold">Alocação</h2>
        <dl className="grid gap-4 sm:grid-cols-3">
          <Item label="Usuário" value={monitor.usuario} />
          <Item label="Setor" value={monitor.departamento ? `${monitor.departamento.codigo}. ${monitor.departamento.nome}` : null} />
          <Item label="Localização" value={monitor.localizacao?.nome} />
          <div>
            <dt className="text-xs font-medium text-slate-500">Computador associado</dt>
            <dd className="mt-1 text-sm">
              {monitor.computador ? (
                <Link className="font-medium text-brand hover:underline" href={`/computadores/${monitor.computador.id}`}>
                  {monitor.computador.hostname || monitor.computador.tombo}
                </Link>
              ) : "—"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-line bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold">Histórico</h2>
        <MovementTimeline items={monitor.movimentacoes} />
      </section>
    </div>
  );
}
