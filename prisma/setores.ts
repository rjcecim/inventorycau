export type SetorSeed = {
  codigo: string;
  nome: string;
  parentCodigo?: string;
};

/** Lotação oficial do órgão — códigos 1 a 13.6 */
export const SETORES: SetorSeed[] = [
  { codigo: "1", nome: "Gabinete da Presidência" },
  { codigo: "1.1", nome: "Assessoria de Comunicação e Relações Públicas", parentCodigo: "1" },
  { codigo: "1.2", nome: "Assessoria de Cerimonial e Relações Institucionais", parentCodigo: "1" },
  { codigo: "1.2.1", nome: "Gerência de Atendimento ao Público", parentCodigo: "1.2" },
  { codigo: "1.3", nome: "Coordenadoria de Apoio Técnico", parentCodigo: "1" },
  { codigo: "1.4", nome: "Gabinete Militar", parentCodigo: "1" },
  { codigo: "1.5", nome: "Unidade Regional de Representação - Santarém", parentCodigo: "1" },
  { codigo: "1.6", nome: "Unidade Regional de Representação - Marabá", parentCodigo: "1" },

  { codigo: "2", nome: "Gabinete da Vice-Presidência" },

  { codigo: "3", nome: "Gabinete dos Conselheiros" },
  { codigo: "3.1", nome: "Gabinete Conselheira Lourdes Lima", parentCodigo: "3" },
  { codigo: "3.2", nome: "Gabinete Conselheiro Cipriano Sabino", parentCodigo: "3" },
  { codigo: "3.3", nome: "Gabinete Conselheiro Luis Cunha", parentCodigo: "3" },
  { codigo: "3.4", nome: "Gabinete Conselheiro Odilon Teixeira", parentCodigo: "3" },
  { codigo: "3.5", nome: "Gabinete Conselheira Rosa Egidia", parentCodigo: "3" },
  { codigo: "3.6", nome: "Gabinete Conselheiro Fernando Ribeiro", parentCodigo: "3" },
  { codigo: "3.7", nome: "Gabinete Conselheira Daniela Barbalho", parentCodigo: "3" },

  { codigo: "4", nome: "Gabinete dos Auditores/Conselheiros Substitutos" },
  { codigo: "4.1", nome: "Gabinete Auditora/Conselheira Substituta Milene Cunha", parentCodigo: "4" },
  { codigo: "4.2", nome: "Gabinete Auditor/Conselheiro Substituto Julival Rocha", parentCodigo: "4" },
  { codigo: "4.3", nome: "Gabinete Auditor/Conselheiro Substituto Daniel Mello", parentCodigo: "4" },
  { codigo: "4.4", nome: "Gabinete Auditor/Conselheiro Substituto Edvaldo Souza", parentCodigo: "4" },

  { codigo: "5", nome: "Consultoria Jurídica" },
  { codigo: "5.1", nome: "Gerência de Expediente", parentCodigo: "5" },

  { codigo: "6", nome: "Auditoria Interna" },

  { codigo: "7", nome: "Secretaria Geral do Tribunal Pleno" },
  { codigo: "7.1", nome: "Assessoria Técnico-Jurídica", parentCodigo: "7" },
  { codigo: "7.2", nome: "Gerência de Expediente", parentCodigo: "7" },
  { codigo: "7.3", nome: "Coordenadoria de Atendimento ao Jurisdicionado", parentCodigo: "7" },
  { codigo: "7.4", nome: "Coordenadoria de Apoio as Sessões Plenárias", parentCodigo: "7" },
  { codigo: "7.5", nome: "Coordenadoria de Formalização de Decisões", parentCodigo: "7" },
  { codigo: "7.6", nome: "Coordenadoria de Informação e Documentação", parentCodigo: "7" },

  { codigo: "8", nome: "Secretaria Geral de Controle Externo" },
  { codigo: "8.1", nome: "Assessoria Técnico-Jurídica", parentCodigo: "8" },
  { codigo: "8.2", nome: "Gerência de Expediente", parentCodigo: "8" },
  { codigo: "8.3", nome: "1ª Controladoria de Contas de Gestão", parentCodigo: "8" },
  { codigo: "8.4", nome: "2ª Controladoria de Contas de Gestão", parentCodigo: "8" },
  { codigo: "8.5", nome: "3ª Controladoria de Contas de Gestão", parentCodigo: "8" },
  { codigo: "8.6", nome: "4ª Controladoria de Contas de Gestão", parentCodigo: "8" },
  { codigo: "8.7", nome: "5ª Controladoria de Contas de Gestão", parentCodigo: "8" },
  { codigo: "8.8", nome: "6ª Controladoria de Contas de Gestão", parentCodigo: "8" },
  { codigo: "8.9", nome: "7ª Controladoria de Contas de Gestão", parentCodigo: "8" },
  { codigo: "8.10", nome: "Controladoria de Pessoal e de Pensões", parentCodigo: "8" },
  { codigo: "8.11", nome: "Controladoria de Obras, Patrimônio Público e Meio Ambiente", parentCodigo: "8" },
  { codigo: "8.12", nome: "Controladoria de Assuntos Estratégicos", parentCodigo: "8" },

  { codigo: "9", nome: "Secretaria Geral da Presidência" },
  { codigo: "9.1", nome: "Assessoria Técnico–Jurídica", parentCodigo: "9" },
  { codigo: "9.2", nome: "Secretaria de Tecnologia da Informação", parentCodigo: "9" },
  { codigo: "9.2.1", nome: "Assessoria Técnico-Jurídica", parentCodigo: "9.2" },
  { codigo: "9.2.2", nome: "Gerência de Expediente", parentCodigo: "9.2" },
  { codigo: "9.2.3", nome: "Coordenadoria de Sistemas", parentCodigo: "9.2" },
  { codigo: "9.2.4", nome: "Coordenadoria de Infraestrutura e Segurança", parentCodigo: "9.2" },
  { codigo: "9.2.5", nome: "Coordenadoria de Apoio ao Usuário", parentCodigo: "9.2" },
  { codigo: "9.3", nome: "Secretaria de Administração", parentCodigo: "9" },
  { codigo: "9.3.1", nome: "Assessoria Técnico-Jurídica", parentCodigo: "9.3" },
  { codigo: "9.3.2", nome: "Gerência de Expediente", parentCodigo: "9.3" },
  { codigo: "9.3.3", nome: "Diretoria de Logística e Patrimônio", parentCodigo: "9.3" },
  { codigo: "9.3.3.1", nome: "Coordenadoria de Administração Predial", parentCodigo: "9.3.3" },
  { codigo: "9.3.3.2", nome: "Coordenadoria de Engenharia de Manutenção", parentCodigo: "9.3.3" },
  { codigo: "9.3.3.3", nome: "Coordenadoria de Transporte", parentCodigo: "9.3.3" },
  { codigo: "9.3.3.4", nome: "Coordenadoria de Suprimento e Almoxarifado", parentCodigo: "9.3.3" },
  { codigo: "9.3.3.5", nome: "Coordenadoria de Patrimônio", parentCodigo: "9.3.3" },
  { codigo: "9.3.4", nome: "Diretoria de Finanças", parentCodigo: "9.3" },
  { codigo: "9.3.4.1", nome: "Coordenadoria Orçamentária e Financeira", parentCodigo: "9.3.4" },
  { codigo: "9.3.4.2", nome: "Coordenadoria de Contabilidade", parentCodigo: "9.3.4" },
  { codigo: "9.4", nome: "Secretaria de Gestão de Pessoas", parentCodigo: "9" },
  { codigo: "9.4.1", nome: "Assessoria Técnico-Jurídica", parentCodigo: "9.4" },
  { codigo: "9.4.2", nome: "Gerência de Expediente", parentCodigo: "9.4" },
  { codigo: "9.4.3", nome: "Coordenadoria de Saúde e Qualidade de Vida", parentCodigo: "9.4" },
  { codigo: "9.4.4", nome: "Coordenadoria de Desenvolvimento de Competências", parentCodigo: "9.4" },
  { codigo: "9.4.5", nome: "Coordenadoria de Registros e Benefícios Funcionais", parentCodigo: "9.4" },
  { codigo: "9.4.6", nome: "Coordenadoria de Pagamento", parentCodigo: "9.4" },
  { codigo: "9.5", nome: "Secretaria de Planejamento e Gestão Estratégica", parentCodigo: "9" },

  { codigo: "10", nome: "Escola de Contas Alberto Veloso" },
  { codigo: "10.1", nome: "Diretoria Geral", parentCodigo: "10" },
  { codigo: "10.2", nome: "Gerência de Expediente", parentCodigo: "10" },
  { codigo: "10.3", nome: "Coordenação Acadêmica", parentCodigo: "10" },
  { codigo: "10.4", nome: "Coordenação de Ensino, Pesquisa e Extensão", parentCodigo: "10" },
  { codigo: "10.5", nome: "Coordenação de Acervo Técnico e Informação", parentCodigo: "10" },

  { codigo: "11", nome: "Ouvidoria" },
  { codigo: "12", nome: "Corregedoria" },

  { codigo: "13", nome: "Ministério Público de Contas" },
  { codigo: "13.1", nome: "Procuradoria-Geral de Contas", parentCodigo: "13" },
  { codigo: "13.1.1", nome: "Gabinete da Procuradoria-Geral de Contas", parentCodigo: "13.1" },
  { codigo: "13.2", nome: "Corregedoria Ministerial", parentCodigo: "13" },
  { codigo: "13.3", nome: "Ouvidoria Ministerial", parentCodigo: "13" },
  { codigo: "13.4", nome: "Procuradorias de Contas", parentCodigo: "13" },
  { codigo: "13.4.1", nome: "1ª Procuradoria de Contas", parentCodigo: "13.4" },
  { codigo: "13.4.2", nome: "2ª Procuradoria de Contas", parentCodigo: "13.4" },
  { codigo: "13.4.3", nome: "3ª Procuradoria de Contas", parentCodigo: "13.4" },
  { codigo: "13.4.4", nome: "4ª Procuradoria de Contas", parentCodigo: "13.4" },
  { codigo: "13.4.5", nome: "5ª Procuradoria de Contas", parentCodigo: "13.4" },
  { codigo: "13.4.6", nome: "6ª Procuradoria de Contas", parentCodigo: "13.4" },
  { codigo: "13.4.7", nome: "7ª Procuradoria de Contas", parentCodigo: "13.4" },
  { codigo: "13.4.8", nome: "8ª Procuradoria de Contas", parentCodigo: "13.4" },
  { codigo: "13.5", nome: "Coordenadoria de Acompanhamento de Decisões Executórias e Consensualidade", parentCodigo: "13" },
  { codigo: "13.6", nome: "Coordenadoria de Apoio Operacional", parentCodigo: "13" },
];

export function setorNivel(codigo: string) {
  return codigo.split(".").length;
}
