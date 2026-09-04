# Changelog

O versionamento segue o padrão `X.Y.Z (Build N)`.
Alterações pequenas, correções e ajustes mantêm a mesma versão e incrementam apenas o Build.
`X.Y.Z` muda somente quando houver mudança funcional relevante ou significativa.

## 1.0.0 (Build 2)

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
