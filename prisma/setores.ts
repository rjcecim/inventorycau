export type SetorSeed = {
  codigo: string;
  nome: string;
  qtdServidores: number;
  parentCodigo?: string;
};

/** Lotação oficial do órgão — códigos 1 a 13.6 */
export const SETORES: SetorSeed[] = [
  { codigo: "1", nome: "Gabinete da Presidência", qtdServidores: 4 },
  { codigo: "1.1", nome: "Assessoria de Comunicação e Relações Públicas", qtdServidores: 11, parentCodigo: "1" },
  { codigo: "1.2", nome: "Assessoria de Cerimonial e Relações Institucionais", qtdServidores: 7, parentCodigo: "1" },
  { codigo: "1.2.1", nome: "Gerência de Atendimento ao Público", qtdServidores: 1, parentCodigo: "1.2" },
  { codigo: "1.3", nome: "Coordenadoria de Apoio Técnico", qtdServidores: 5, parentCodigo: "1" },
  { codigo: "1.4", nome: "Gabinete Militar", qtdServidores: 30, parentCodigo: "1" },
  { codigo: "1.5", nome: "Unidade Regional de Representação - Santarém", qtdServidores: 3, parentCodigo: "1" },
  { codigo: "1.6", nome: "Unidade Regional de Representação - Marabá", qtdServidores: 4, parentCodigo: "1" },

  { codigo: "2", nome: "Gabinete da Vice-Presidência", qtdServidores: 0 },

  { codigo: "3", nome: "Gabinete dos Conselheiros", qtdServidores: 0 },
  { codigo: "3.1", nome: "Gabinete Conselheira Lourdes Lima", qtdServidores: 18, parentCodigo: "3" },
  { codigo: "3.2", nome: "Gabinete Conselheiro Cipriano Sabino", qtdServidores: 34, parentCodigo: "3" },
  { codigo: "3.3", nome: "Gabinete Conselheiro Luis Cunha", qtdServidores: 28, parentCodigo: "3" },
  { codigo: "3.4", nome: "Gabinete Conselheiro Odilon Teixeira", qtdServidores: 14, parentCodigo: "3" },
  { codigo: "3.5", nome: "Gabinete Conselheira Rosa Egidia", qtdServidores: 17, parentCodigo: "3" },
  { codigo: "3.6", nome: "Gabinete Conselheiro Fernando Ribeiro", qtdServidores: 19, parentCodigo: "3" },
  { codigo: "3.7", nome: "Gabinete Conselheira Daniela Barbalho", qtdServidores: 15, parentCodigo: "3" },

  { codigo: "4", nome: "Gabinete dos Auditores/Conselheiros Substitutos", qtdServidores: 0 },
  { codigo: "4.1", nome: "Gabinete Auditora/Conselheira Substituta Milene Cunha", qtdServidores: 11, parentCodigo: "4" },
  { codigo: "4.2", nome: "Gabinete Auditor/Conselheiro Substituto Julival Rocha", qtdServidores: 9, parentCodigo: "4" },
  { codigo: "4.3", nome: "Gabinete Auditor/Conselheiro Substituto Daniel Mello", qtdServidores: 10, parentCodigo: "4" },
  { codigo: "4.4", nome: "Gabinete Auditor/Conselheiro Substituto Edvaldo Souza", qtdServidores: 9, parentCodigo: "4" },

  { codigo: "5", nome: "Consultoria Jurídica", qtdServidores: 8 },
  { codigo: "5.1", nome: "Gerência de Expediente", qtdServidores: 6, parentCodigo: "5" },

  { codigo: "6", nome: "Auditoria Interna", qtdServidores: 10 },

  { codigo: "7", nome: "Secretaria Geral do Tribunal Pleno", qtdServidores: 2 },
  { codigo: "7.1", nome: "Assessoria Técnico-Jurídica", qtdServidores: 4, parentCodigo: "7" },
  { codigo: "7.2", nome: "Gerência de Expediente", qtdServidores: 2, parentCodigo: "7" },
  { codigo: "7.3", nome: "Coordenadoria de Atendimento ao Jurisdicionado", qtdServidores: 8, parentCodigo: "7" },
  { codigo: "7.4", nome: "Coordenadoria de Apoio as Sessões Plenárias", qtdServidores: 2, parentCodigo: "7" },
  { codigo: "7.5", nome: "Coordenadoria de Formalização de Decisões", qtdServidores: 9, parentCodigo: "7" },
  { codigo: "7.6", nome: "Coordenadoria de Informação e Documentação", qtdServidores: 14, parentCodigo: "7" },

  { codigo: "8", nome: "Secretaria Geral de Controle Externo", qtdServidores: 2 },
  { codigo: "8.1", nome: "Assessoria Técnico-Jurídica", qtdServidores: 3, parentCodigo: "8" },
  { codigo: "8.2", nome: "Gerência de Expediente", qtdServidores: 3, parentCodigo: "8" },
  { codigo: "8.3", nome: "1ª Controladoria de Contas de Gestão", qtdServidores: 15, parentCodigo: "8" },
  { codigo: "8.4", nome: "2ª Controladoria de Contas de Gestão", qtdServidores: 12, parentCodigo: "8" },
  { codigo: "8.5", nome: "3ª Controladoria de Contas de Gestão", qtdServidores: 20, parentCodigo: "8" },
  { codigo: "8.6", nome: "4ª Controladoria de Contas de Gestão", qtdServidores: 13, parentCodigo: "8" },
  { codigo: "8.7", nome: "5ª Controladoria de Contas de Gestão", qtdServidores: 19, parentCodigo: "8" },
  { codigo: "8.8", nome: "6ª Controladoria de Contas de Gestão", qtdServidores: 20, parentCodigo: "8" },
  { codigo: "8.9", nome: "7ª Controladoria de Contas de Gestão", qtdServidores: 11, parentCodigo: "8" },
  { codigo: "8.10", nome: "Controladoria de Pessoal e de Pensões", qtdServidores: 19, parentCodigo: "8" },
  { codigo: "8.11", nome: "Controladoria de Obras, Patrimônio Público e Meio Ambiente", qtdServidores: 16, parentCodigo: "8" },
  { codigo: "8.12", nome: "Controladoria de Assuntos Estratégicos", qtdServidores: 4, parentCodigo: "8" },

  { codigo: "9", nome: "Secretaria Geral da Presidência", qtdServidores: 1 },
  { codigo: "9.1", nome: "Assessoria Técnico–Jurídica", qtdServidores: 1, parentCodigo: "9" },
  { codigo: "9.2", nome: "Secretaria de Tecnologia da Informação", qtdServidores: 2, parentCodigo: "9" },
  { codigo: "9.2.1", nome: "Assessoria Técnico-Jurídica", qtdServidores: 8, parentCodigo: "9.2" },
  { codigo: "9.2.2", nome: "Gerência de Expediente", qtdServidores: 1, parentCodigo: "9.2" },
  { codigo: "9.2.3", nome: "Coordenadoria de Sistemas", qtdServidores: 21, parentCodigo: "9.2" },
  { codigo: "9.2.4", nome: "Coordenadoria de Infraestrutura e Segurança", qtdServidores: 10, parentCodigo: "9.2" },
  { codigo: "9.2.5", nome: "Coordenadoria de Apoio ao Usuário", qtdServidores: 14, parentCodigo: "9.2" },
  { codigo: "9.3", nome: "Secretaria de Administração", qtdServidores: 2, parentCodigo: "9" },
  { codigo: "9.3.1", nome: "Assessoria Técnico-Jurídica", qtdServidores: 16, parentCodigo: "9.3" },
  { codigo: "9.3.2", nome: "Gerência de Expediente", qtdServidores: 5, parentCodigo: "9.3" },
  { codigo: "9.3.3", nome: "Diretoria de Logística e Patrimônio", qtdServidores: 11, parentCodigo: "9.3" },
  { codigo: "9.3.3.1", nome: "Coordenadoria de Administração Predial", qtdServidores: 32, parentCodigo: "9.3.3" },
  { codigo: "9.3.3.2", nome: "Coordenadoria de Engenharia de Manutenção", qtdServidores: 14, parentCodigo: "9.3.3" },
  { codigo: "9.3.3.3", nome: "Coordenadoria de Transporte", qtdServidores: 22, parentCodigo: "9.3.3" },
  { codigo: "9.3.3.4", nome: "Coordenadoria de Suprimento e Almoxarifado", qtdServidores: 7, parentCodigo: "9.3.3" },
  { codigo: "9.3.3.5", nome: "Coordenadoria de Patrimônio", qtdServidores: 13, parentCodigo: "9.3.3" },
  { codigo: "9.3.4", nome: "Diretoria de Finanças", qtdServidores: 1, parentCodigo: "9.3" },
  { codigo: "9.3.4.1", nome: "Coordenadoria Orçamentária e Financeira", qtdServidores: 9, parentCodigo: "9.3.4" },
  { codigo: "9.3.4.2", nome: "Coordenadoria de Contabilidade", qtdServidores: 6, parentCodigo: "9.3.4" },
  { codigo: "9.4", nome: "Secretaria de Gestão de Pessoas", qtdServidores: 3, parentCodigo: "9" },
  { codigo: "9.4.1", nome: "Assessoria Técnico-Jurídica", qtdServidores: 3, parentCodigo: "9.4" },
  { codigo: "9.4.2", nome: "Gerência de Expediente", qtdServidores: 9, parentCodigo: "9.4" },
  { codigo: "9.4.3", nome: "Coordenadoria de Saúde e Qualidade de Vida", qtdServidores: 12, parentCodigo: "9.4" },
  { codigo: "9.4.4", nome: "Coordenadoria de Desenvolvimento de Competências", qtdServidores: 4, parentCodigo: "9.4" },
  { codigo: "9.4.5", nome: "Coordenadoria de Registros e Benefícios Funcionais", qtdServidores: 8, parentCodigo: "9.4" },
  { codigo: "9.4.6", nome: "Coordenadoria de Pagamento", qtdServidores: 9, parentCodigo: "9.4" },
  { codigo: "9.5", nome: "Secretaria de Planejamento e Gestão Estratégica", qtdServidores: 7, parentCodigo: "9" },

  { codigo: "10", nome: "Escola de Contas Alberto Veloso", qtdServidores: 1 },
  { codigo: "10.1", nome: "Diretoria Geral", qtdServidores: 0, parentCodigo: "10" },
  { codigo: "10.2", nome: "Gerência de Expediente", qtdServidores: 5, parentCodigo: "10" },
  { codigo: "10.3", nome: "Coordenação Acadêmica", qtdServidores: 5, parentCodigo: "10" },
  { codigo: "10.4", nome: "Coordenação de Ensino, Pesquisa e Extensão", qtdServidores: 11, parentCodigo: "10" },
  { codigo: "10.5", nome: "Coordenação de Acervo Técnico e Informação", qtdServidores: 6, parentCodigo: "10" },

  { codigo: "11", nome: "Ouvidoria", qtdServidores: 2 },
  { codigo: "12", nome: "Corregedoria", qtdServidores: 4 },

  { codigo: "13", nome: "Ministério Público de Contas", qtdServidores: 0 },
  { codigo: "13.1", nome: "Procuradoria-Geral de Contas", qtdServidores: 1, parentCodigo: "13" },
  { codigo: "13.1.1", nome: "Gabinete da Procuradoria-Geral de Contas", qtdServidores: 7, parentCodigo: "13.1" },
  { codigo: "13.2", nome: "Corregedoria Ministerial", qtdServidores: 0, parentCodigo: "13" },
  { codigo: "13.3", nome: "Ouvidoria Ministerial", qtdServidores: 1, parentCodigo: "13" },
  { codigo: "13.4", nome: "Procuradorias de Contas", qtdServidores: 0, parentCodigo: "13" },
  { codigo: "13.4.1", nome: "1ª Procuradoria de Contas", qtdServidores: 9, parentCodigo: "13.4" },
  { codigo: "13.4.2", nome: "2ª Procuradoria de Contas", qtdServidores: 8, parentCodigo: "13.4" },
  { codigo: "13.4.3", nome: "3ª Procuradoria de Contas", qtdServidores: 8, parentCodigo: "13.4" },
  { codigo: "13.4.4", nome: "4ª Procuradoria de Contas", qtdServidores: 9, parentCodigo: "13.4" },
  { codigo: "13.4.5", nome: "5ª Procuradoria de Contas", qtdServidores: 8, parentCodigo: "13.4" },
  { codigo: "13.4.6", nome: "6ª Procuradoria de Contas", qtdServidores: 8, parentCodigo: "13.4" },
  { codigo: "13.4.7", nome: "7ª Procuradoria de Contas", qtdServidores: 6, parentCodigo: "13.4" },
  { codigo: "13.4.8", nome: "8ª Procuradoria de Contas", qtdServidores: 8, parentCodigo: "13.4" },
  { codigo: "13.5", nome: "Coordenadoria de Acompanhamento de Decisões Executórias e Consensualidade", qtdServidores: 5, parentCodigo: "13" },
  { codigo: "13.6", nome: "Coordenadoria de Apoio Operacional", qtdServidores: 6, parentCodigo: "13" },
];

export function setorNivel(codigo: string) {
  return codigo.split(".").length;
}

export function setorLabel(codigo: string, nome: string) {
  return `${codigo}. ${nome}`;
}
