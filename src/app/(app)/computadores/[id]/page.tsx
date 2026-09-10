import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/authz";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ComputerDetailActions } from "@/components/ComputerDetailActions";
import { MovementTimeline } from "@/components/MovementTimeline";
import { formatPredio } from "@/lib/predios";

export const dynamic = "force-dynamic";

function Item({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900">{value || "—"}</dd>
    </div>
  );
}

export default async function ComputerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const computer = await prisma.computador.findFirst({
    where: { id, deletedAt: null },
    include: {
      departamento: true,
      localizacao: true,
      monitores: { where: { deletedAt: null }, orderBy: { tombo: "asc" } },
      movimentacoes: { orderBy: { createdDate: "desc" }, take: 30, include: { actor: true, computador: true, monitor: true } },
    },
  });
  if (!computer) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500">
            <Link href="/computadores" className="hover:underline">Computadores</Link> / {computer.tombo}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{computer.tombo}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <StatusBadge status={computer.status} />
            <span>{computer.usuario || "Sem usuário"}</span>
            <span>{computer.departamento ? `${computer.departamento.codigo}. ${computer.departamento.nome}` : "Sem setor"}</span>
            <span>{formatPredio(computer.localizacao) || "Sem prédio"}</span>
          </div>
        </div>
        <ComputerDetailActions computerId={computer.id} isAdmin={isAdminRole(session?.user?.role)} />
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
        <h2 className="mb-4 text-sm font-semibold">Alocação</h2>
        <dl className="grid gap-4 sm:grid-cols-3">
          <Item label="Usuário" value={computer.usuario} />
          <Item label="Setor" value={computer.departamento ? `${computer.departamento.codigo}. ${computer.departamento.nome}` : null} />
          <Item label="Prédio" value={formatPredio(computer.localizacao) || null} />
          <Item label="Observações" value={computer.observacoes} />
        </dl>
      </section>

      <section className="surface p-5">
        <h2 className="mb-4 text-sm font-semibold">Periféricos</h2>
        {computer.monitores.length ? (
          <ul className="divide-y divide-line">
            {computer.monitores.map((monitor) => (
              <li key={monitor.id} className="flex items-center justify-between py-3 text-sm">
                <Link href={`/monitores/${monitor.id}`} className="font-medium text-brand hover:underline">{monitor.tombo}</Link>
                <span className="text-slate-500">{monitor.modelo || "Monitor"}</span>
                <StatusBadge status={monitor.status} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">Nenhum monitor associado.</p>
        )}
      </section>

      <section className="surface p-5">
        <h2 className="mb-4 text-sm font-semibold">Histórico</h2>
        <MovementTimeline items={computer.movimentacoes} />
      </section>
    </div>
  );
}
