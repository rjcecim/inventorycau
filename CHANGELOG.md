# Changelog

O versionamento segue o padrão `X.Y.Z (Build N)`.
Alterações pequenas, correções e ajustes mantêm a mesma versão e incrementam apenas o Build.
`X.Y.Z` muda somente quando houver mudança funcional relevante ou significativa.
O número do Build é sequencial e não reinicia quando `X.Y.Z` avança.

## 1.6.0 (Build 13)

Notebooks entram no inventário, o perfil Usuário passa a ser só consulta e a Visão Geral ganha atalhos por setor.

### Adicionado

- Tipo `ComputerType` (`DESKTOP` | `NOTEBOOK`) no modelo `Computador`, com padrão `DESKTOP` para registros já existentes
- `AssetKind.NOTEBOOK` para histórico, busca e relatórios distinguirem notebook de computador
- Rotas `/notebooks`, `/notebooks/novo`, `/notebooks/[id]`, `/notebooks/[id]/editar` e `/notebooks/[id]/mover`
- Item Notebooks no grupo Inventário do menu lateral
- Filtro e identificação de Notebook nos relatórios de garantias, modernização, movimentações, exportação CSV e busca global
- Perfil Técnico, com as permissões do antigo Usuário, e perfil Usuário somente consulta (sem incluir, editar, mover ou agrupar)
- Coluna S/N nas listas de Computadores, Monitores e Notebooks, entre Modelo e Usuário
- Ícone de olho em cada setor, abrindo a Visão Geral filtrada por aquele setor
- Interruptor Mostrar S/N na Visão Geral, desligado por padrão, com o número de série abaixo de cada tombo

### Alterado

- `/computadores` lista somente desktops; `/notebooks` lista somente notebooks
- Visão Geral continua só com desktops e monitores — notebooks não entram nos agrupamentos nem na tabela
- Dashboard passa a ter indicador próprio de Notebooks; o índice institucional de modernização mantém 6 anos para desktop e notebook
- Prazo de modernização do notebook é 6 anos a partir da data de recebimento; upgrade de hardware não reinicia o prazo
- Novo setor entra na posição da escala do código, abaixo do setor pai
- Contas que eram Usuário passam a Técnico

## 1.5.0 (Build 12)

Agrupamento horizontal de computadores e monitores por identificador compartilhado, sem cadastro de estação e sem o computador como pai estrutural.

### Adicionado

- `groupId` compartilhado em computador e monitor, com migração dos vínculos antigos `computadorId`
- Ações para agrupar, adicionar a um grupo existente, desagrupar um equipamento, desagrupar tudo e transferir entre grupos
- Sincronização transacional de usuário, setor, prédio e status entre os integrantes do agrupamento
- Seção Equipamentos agrupados nas fichas, com confirmação quando a alocação for substituída
- Visão Geral passa a listar grupos com PC, só monitores ou equipamento avulso
- Paginação de 10 em 10 no histórico das fichas, em Movimentações e na Atividade recente
- Testes automatizados dos cenários de agrupamento (Vitest)

### Alterado

- Monitor deixa de herdar alocação pelo vínculo `Monitor → Computador`
- Relatórios, dashboard e listagens passam a usar o agrupamento compartilhado
- Data/hora do histórico formatada em UTC−3 (Belém), igual no servidor e no navegador
- Cadastro em lote deixa de exigir patrimônio só numérico com zeros à esquerda; a faixa aceita tombos como `3053-00` … `3062-00`

### Corrigido

- Hidratação do histórico: o Docker em UTC e o navegador em horário local deixavam de coincidir

## 1.4.0 (Build 10)

Cadastro em lote de computadores e monitores pela faixa de patrimônios, no mesmo formulário de novo equipamento.

### Adicionado

- Modo Lote nas telas de novo computador e novo monitor (Um equipamento / Lote), restrito a administradores
- Faixa de patrimônios inicial–final, com prévia da quantidade (até 500) e confirmação antes de gravar
- Criação atômica do lote, sem número de série e sem vínculo monitor–computador; o cadastro falha se algum patrimônio já existir
- Registro único de movimentação “Cadastro em lote” na linha do tempo

### Alterado

- Relatórios de Garantias e Modernização passam a exibir só a coluna Modelo, sem fabricante
- Placeholders de patrimônio alinhados ao padrão numérico (`000001`); exemplos de hardware baseados no OptiPlex 7010 e no HP P24a G4
- Texto de associação do monitor deixa claro que ele copia usuário, setor, prédio e status do computador
- Visão Geral: tombo do monitor com o mesmo peso visual do tombo do PC

### Corrigido

- Cadastro em lote grava usuário, setor e prédio (SearchSelect confirma o valor digitado; o diálogo de confirmação não descarta o formulário)
- Patrimônios inativos voltam a ficar livres para cadastro individual e em lote
- Movimentação do PC replica no histórico dos monitores vinculados (usuário, setor, prédio e status)

## 1.3.0 (Build 8)

Controle de aquisição, garantia e modernização de computadores e monitores, com indicadores no dashboard e relatórios próprios.

### Adicionado

- Seção “Aquisição e garantia” no cadastro e na ficha de computadores e monitores (nota fiscal, recebimento e prazo em anos)
- Cálculo compartilhado de garantia (vencimento, dias restantes e situações) e de modernização (PC 6 anos · monitores 8 anos)
- Indicadores de garantias e índices de modernização por categoria no dashboard, com links filtrados aos relatórios
- Relatórios de Garantias e Modernização com filtros, totais, exportação CSV, impressão e filtros estilo Excel nas tabelas
- Apuração anual de modernização com snapshot imutável (data de referência, equipamentos e resultados)
- Modelo `ApuracaoModernizacao` e campos de aquisição em `Computador` e `Monitor`

### Alterado

- Formulários, actions e detalhes passam a gravar e exibir dados de aquisição sem herança monitor ← computador
- Página de relatórios ganha atalhos para Garantias e Modernização
- README passa a descrever o CAU Ativos e o fluxo Docker, no lugar do texto padrão do create-next-app
- `next start` passa a escutar em `0.0.0.0:3000`, alinhado ao `dev` para acesso pela rede
- `.env.example` documenta `AUTH_SECRET`, `AUTH_TRUST_HOST` e `DATABASE_URL`

### Corrigido

- Ajustes de lint em filtros de tabela, busca global, menu lateral e SearchSelect (incluindo `aria-controls` no combobox)
- Remoção dos ícones SVG padrão do Next.js em `public/` que não eram usados pelo app
- Hidratação do menu lateral: a preferência recolhida no `localStorage` só é aplicada depois do HTML do servidor, evitando mismatch no React

## 1.2.0 (Build 5)

Gestão de contas de acesso: administração, perfil do usuário, senha temporária e recuperação por e-mail.

### Adicionado

- Administração de contas (Sistema → Contas) para criar, editar, redefinir senha e excluir usuários de login
- Tela Minha conta para atualizar nome, e-mail e trocar senha com a senha atual
- Recuperação de senha em `/login/recuperar` com código OTP enviado por e-mail (EmailJS)
- Troca obrigatória de senha no primeiro acesso quando a conta é criada ou a senha é redefinida pelo admin
- Campos de conta: e-mail de contato, flag de troca obrigatória e armazenamento de OTP

### Alterado

- Seed passa a criar apenas a conta inicial `admin`, sem recriar prédios, setores ou conta demo `user`
- Logout redireciona pelo host do navegador, evitando `0.0.0.0` no Docker
- Login com senha temporária envia direto para a troca obrigatória de senha

### Corrigido

- Sessão JWT atualizada após troca de senha obrigatória, com feedback de sucesso e entrada no sistema
- Envio de OTP pelo servidor usando chave privada do EmailJS (configuração via variáveis de ambiente)

## 1.1.0 (Build 4)

Cadastro de prédios do órgão, com cidade e UF, e associação de equipamentos a setor e prédio.

### Adicionado

- Cadastro de prédios com nome, cidade e UF, permitindo o mesmo tipo de unidade em cidades diferentes
- Listagem de prédios agrupada por cidade, com contagem de computadores e monitores
- Filtro por prédio na lista de computadores

### Alterado

- Localizações físicas (prédio, andar e sala) passam a ser o catálogo de prédios do órgão
- Formulários de computador e monitor, detalhes, dashboard e auditoria passam a tratar a localização como prédio

## 1.0.0 (Build 3)

Lançamento inicial do inventário de computadores e monitores do CAU.

### Adicionado

- Gestão de computadores e monitores como ativos independentes, com tombo, serial, fabricante, modelo, status, localização, setor e responsável
- Cadastro de hardware de computadores (processador, memória, armazenamento, sistema operacional) e de monitores (tamanho, resolução, conexões, vínculo com computador)
- Status operacionais de ativo: em uso, disponível, reserva, manutenção, aguardando instalação, baixado e inativo
- Dashboard com totais, indicadores por status e distribuição por setor, fabricante e localização
- Busca global de ativos
- Setores hierárquicos oficiais do CAU, com cadastro, edição, exclusão e contagem de servidores no banco
- Cadastro de usuários (servidores) associados a um setor
- Localizações físicas (prédio, andar, sala)
- Histórico de movimentações e auditoria das alterações de ativos
- Relatórios de inventário
- Autenticação com NextAuth, papéis ADMIN/USER e tela de login
- Ambiente de desenvolvimento em Docker com Next.js, Prisma e PostgreSQL

### Alterado

- Redesign da tela de login com identidade visual do CAU, layout responsivo e painel de contexto institucional
- Melhorias de usabilidade no acesso, incluindo mostrar/ocultar senha, indicação de Caps Lock, estado de autenticação e mensagens de erro mais claras

### Corrigido

- Acesso pela rede local via IP do servidor, que redirecionava o navegador para localhost por causa da URL fixa do Auth.js
- Erros de TypeScript que impediam o build do Next.js nos relatórios e na exclusão de usuários
