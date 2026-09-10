import type { AssetStatus } from "@prisma/client";

export function setorLabel(departamento: { codigo?: string; nome: string } | null | undefined) {
  if (!departamento) return "";
  return `${departamento.codigo ? `${departamento.codigo}. ` : ""}${departamento.nome}`;
}

export function monitorAlocacao(monitor: {
  usuario: string | null;
  status: AssetStatus;
  departamento: { codigo?: string; nome: string } | null;
  localizacao?: { nome: string; cidade?: string | null; uf?: string | null } | null;
  computador: {
    usuario: string | null;
    status: AssetStatus;
    departamento: { codigo?: string; nome: string } | null;
    localizacao?: { nome: string; cidade?: string | null; uf?: string | null } | null;
  } | null;
}) {
  if (monitor.computador) {
    return {
      usuario: monitor.computador.usuario,
      status: monitor.computador.status,
      departamento: monitor.computador.departamento,
      localizacao: monitor.computador.localizacao ?? null,
    };
  }
  return {
    usuario: monitor.usuario,
    status: monitor.status,
    departamento: monitor.departamento,
    localizacao: monitor.localizacao ?? null,
  };
}
