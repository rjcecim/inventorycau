import type { AssetStatus } from "@prisma/client";

export function setorLabel(departamento: { codigo?: string; nome: string } | null | undefined) {
  if (!departamento) return "";
  return `${departamento.codigo ? `${departamento.codigo}. ` : ""}${departamento.nome}`;
}

export function monitorAlocacao(monitor: {
  usuario: string | null;
  status: AssetStatus;
  departamento: { codigo?: string; nome: string } | null;
  computador: {
    usuario: string | null;
    status: AssetStatus;
    departamento: { codigo?: string; nome: string } | null;
  } | null;
}) {
  if (monitor.computador) {
    return {
      usuario: monitor.computador.usuario,
      status: monitor.computador.status,
      departamento: monitor.computador.departamento,
    };
  }
  return {
    usuario: monitor.usuario,
    status: monitor.status,
    departamento: monitor.departamento,
  };
}
