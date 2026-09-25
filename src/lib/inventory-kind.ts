import { AssetKind, ComputerType } from "@prisma/client";

export type InventoryKind = "COMPUTER" | "NOTEBOOK" | "MONITOR";
export type ComputerVariant = "DESKTOP" | "NOTEBOOK";

export function computerVariant(tipo?: ComputerType | string | null): ComputerVariant {
  return tipo === "NOTEBOOK" ? "NOTEBOOK" : "DESKTOP";
}

export function variantAssetKind(variant: ComputerVariant): AssetKind {
  return variant === "NOTEBOOK" ? AssetKind.NOTEBOOK : AssetKind.COMPUTER;
}

export function variantInventoryKind(variant: ComputerVariant): InventoryKind {
  return variant === "NOTEBOOK" ? "NOTEBOOK" : "COMPUTER";
}

export function inventoryKindLabel(kind: InventoryKind | AssetKind | string) {
  if (kind === "NOTEBOOK") return "Notebook";
  if (kind === "MONITOR") return "Monitor";
  return "Computador";
}

export function computerRowKind(tipo?: ComputerType | string | null): InventoryKind {
  return tipo === "NOTEBOOK" ? "NOTEBOOK" : "COMPUTER";
}

export function inventoryKindHref(kind: InventoryKind | AssetKind | string, id: string) {
  if (kind === "NOTEBOOK") return `/notebooks/${id}`;
  if (kind === "MONITOR") return `/monitores/${id}`;
  return `/computadores/${id}`;
}

export function variantCopy(variant: ComputerVariant) {
  if (variant === "NOTEBOOK") {
    return {
      variant,
      tipo: "NOTEBOOK" as const,
      noun: "notebook",
      nounPlural: "notebooks",
      title: "Notebooks",
      singular: "Notebook",
      basePath: "/notebooks",
      newTitle: "Novo notebook",
      newDescription:
        "Cadastre um notebook ou um lote pela faixa de patrimônios. Depois de salvar um, você vai para a ficha; o lote volta para a lista.",
      editDescription: "Altere os dados do notebook e salve para atualizar o inventário.",
      moveDescription: "Altere usuário, setor, prédio ou status. Dados técnicos do equipamento não são alterados aqui.",
      listDescription: "Inventário de notebooks. Use o filtro no cabeçalho de cada coluna, como no Excel.",
      emptyTitle: "Nenhum notebook encontrado",
      emptyDescription: "Ajuste os filtros do cabeçalho ou cadastre um novo ativo.",
      deleteTitle: "Excluir notebook",
      modeloPlaceholder: "ThinkPad T14",
      assetKind: AssetKind.NOTEBOOK,
      inventoryKind: "NOTEBOOK" as const,
      modernizationKind: "NOTEBOOK" as const,
    };
  }

  return {
    variant,
    tipo: "DESKTOP" as const,
    noun: "computador",
    nounPlural: "computadores",
    title: "Computadores",
    singular: "Computador",
    basePath: "/computadores",
    newTitle: "Novo computador",
    newDescription:
      "Cadastre um equipamento ou um lote pela faixa de patrimônios. Depois de salvar um, você vai para a ficha; o lote volta para a lista.",
    editDescription: "Altere os dados do computador e salve para atualizar o inventário.",
    moveDescription: "Altere usuário, setor, prédio ou status. Dados técnicos do equipamento não são alterados aqui.",
    listDescription: "Inventário de computadores. Use o filtro no cabeçalho de cada coluna, como no Excel.",
    emptyTitle: "Nenhum computador encontrado",
    emptyDescription: "Ajuste os filtros do cabeçalho ou cadastre um novo ativo.",
    deleteTitle: "Excluir computador",
    modeloPlaceholder: "OptiPlex 7010",
    assetKind: AssetKind.COMPUTER,
    inventoryKind: "COMPUTER" as const,
    modernizationKind: "COMPUTER" as const,
  };
}

export function desktopWhere() {
  return { tipo: "DESKTOP" as const };
}

export function notebookWhere() {
  return { tipo: "NOTEBOOK" as const };
}
