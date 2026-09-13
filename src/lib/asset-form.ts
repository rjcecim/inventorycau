import { prisma } from "@/lib/prisma";
import type { AssetStatus } from "@prisma/client";

export function toComputerFormValues(computer: {
  id: string;
  tombo: string;
  serialNumber: string | null;
  fabricante: string | null;
  modelo: string | null;
  status: AssetStatus;
  processador: string | null;
  memoriaRam: string | null;
  armazenamento: string | null;
  observacoes: string | null;
  usuario: string | null;
  servidorId: string | null;
  departamentoId: string | null;
  localizacaoId: string | null;
  dataNotaFiscal?: Date | string | null;
  dataRecebimento?: Date | string | null;
  prazoGarantiaAnos?: number | null;
}) {
  return {
    id: computer.id,
    tombo: computer.tombo,
    serialNumber: computer.serialNumber,
    fabricante: computer.fabricante,
    modelo: computer.modelo,
    status: computer.status,
    processador: computer.processador,
    memoriaRam: computer.memoriaRam,
    armazenamento: computer.armazenamento,
    observacoes: computer.observacoes,
    usuario: computer.usuario,
    servidorId: computer.servidorId,
    departamentoId: computer.departamentoId,
    localizacaoId: computer.localizacaoId,
    dataNotaFiscal: computer.dataNotaFiscal ?? null,
    dataRecebimento: computer.dataRecebimento ?? null,
    prazoGarantiaAnos: computer.prazoGarantiaAnos ?? null,
  };
}

export function toMonitorFormValues(monitor: {
  id: string;
  tombo: string;
  serialNumber: string | null;
  fabricante: string | null;
  modelo: string | null;
  tamanho: string | null;
  resolucao: string | null;
  conexoes: string | null;
  status: AssetStatus;
  observacoes: string | null;
  usuario: string | null;
  servidorId: string | null;
  departamentoId: string | null;
  localizacaoId: string | null;
  computadorId: string | null;
  dataNotaFiscal?: Date | string | null;
  dataRecebimento?: Date | string | null;
  prazoGarantiaAnos?: number | null;
}) {
  return {
    id: monitor.id,
    tombo: monitor.tombo,
    serialNumber: monitor.serialNumber,
    fabricante: monitor.fabricante,
    modelo: monitor.modelo,
    tamanho: monitor.tamanho,
    resolucao: monitor.resolucao,
    conexoes: monitor.conexoes,
    status: monitor.status,
    observacoes: monitor.observacoes,
    usuario: monitor.usuario,
    servidorId: monitor.servidorId,
    departamentoId: monitor.departamentoId,
    localizacaoId: monitor.localizacaoId,
    computadorId: monitor.computadorId,
    dataNotaFiscal: monitor.dataNotaFiscal ?? null,
    dataRecebimento: monitor.dataRecebimento ?? null,
    prazoGarantiaAnos: monitor.prazoGarantiaAnos ?? null,
  };
}

export async function loadComputerFormOptions() {
  const [departments, locations, people] = await Promise.all([
    prisma.departamento.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.localizacao.findMany({ orderBy: [{ cidade: "asc" }, { nome: "asc" }] }),
    prisma.servidor.findMany({
      orderBy: { nome: "asc" },
    }),
  ]);
  return {
    departments: departments.map((item) => ({ id: item.id, nome: item.nome, codigo: item.codigo })),
    locations: locations.map((item) => ({
      id: item.id,
      nome: item.nome,
      cidade: item.cidade,
      uf: item.uf,
    })),
    people: people.map((p) => ({ id: p.id, nome: p.nome, matricula: p.matricula })),
  };
}

export async function loadMonitorFormOptions() {
  const [options, computers] = await Promise.all([
    loadComputerFormOptions(),
    prisma.computador.findMany({
      where: { deletedAt: null },
      orderBy: { tombo: "asc" },
      include: { departamento: true },
    }),
  ]);
  return {
    ...options,
    computers: computers.map((item) => ({
      id: item.id,
      tombo: item.tombo,
      usuario: item.usuario,
      status: item.status,
      departamento: item.departamento
        ? { codigo: item.departamento.codigo, nome: item.departamento.nome }
        : null,
    })),
  };
}
