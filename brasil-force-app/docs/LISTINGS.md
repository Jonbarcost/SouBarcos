# Painel e preparação de anúncios — 16/10/2026

## Entregue

- `/painel-vendedor`: listagem própria paginada (20), filtro de situação e contagem real.
- Criação e edição de rascunhos com título, descrição, categoria, condição, preço, estoque, marca/modelo, peso embalado, dimensões e prazo de postagem.
- Preço convertido em centavos com parser decimal, sem multiplicação de fração binária ou separadores ambíguos.
- Envio para análise e pausa confirmados pelo usuário, com versão esperada e verificação de proprietário no banco.
- `bf_save_listing` e `bf_transition_listing`: wrappers invoker e implementação privada com autorização explícita, sessão ativa, conta seller/store e solicitação aprovada. Login isoladamente não habilita escrita.
- Rascunhos nunca públicos. Edição de aprovado retira publicação, redefine classificação para revisão adicional e exige nova análise.
- Nenhuma role, classificação livre ou aprovação é aceita do formulário. Sem INSERT/UPDATE direto por authenticated.
- Atualizações continuam registradas na auditoria genérica existente. Histórico detalhado de decisões de anúncios será uma etapa separada.

## Estados

Salvar: novo → rascunho; rascunho/correção/pausado → rascunho; aprovado → pendente.
Enviar: rascunho/correção/pausado → pendente (estoque positivo e embalagem obrigatórios).
Pausar: aprovado/pendente/em análise → pausado.
Não existe ação de autoaprovação, exclusão definitiva ou alteração de proprietário.
UUID estável e trava transacional serializam salvamentos; versão repetida retorna 40001.

## Evidências e limites

- 38 testes automatizados passaram, incluindo 5 novos testes de integração SQL de anúncios e 2 de validação de valores/embalagem.
- TypeScript e build de produção aprovados; teste HTTP validou redirecionamento anônimo nas três novas rotas.
- Migração `20261016092032_listing_drafts.sql` aplicada ao SouBarcos pelo MCP. O timestamp do histórico remoto é gerado pelo serviço; não reaplicar o SQL.
- Conferência remota: zero membros BF e zero anúncios; execução anônima de save negada, authenticated pode chamar a RPC mas depende das verificações internas; INSERT direto negado.
- Advisors permanecem com os avisos preexistentes de messages sem política e proteção contra senhas vazadas desabilitada.
- Sem usuário vendedor real habilitado: navegação e salvamento autenticados no navegador ainda não foram homologados. Testes PGlite não substituem Supabase Auth real.

## Próxima entrega

Homologar Auth/e-mail e administrador real, implementar verificação documental segura e só então habilitar vendedor de teste controlado. Depois: fotos reais com validação/quarentena, atributos de procedência, fila e decisões auditáveis de moderação de anúncios, catálogo com detalhes e variantes. Serviços continuam fora deste cadastro de produtos físicos.

O envio atual prepara a fila; não significa publicação, venda ou classificação legal definitiva. Nenhuma conta foi artificialmente promovida para demonstrar o painel. Pagamentos e logística continuam desligados. Medidas são dados de entrada futuros, não promessa de frete ou aceitação por transportadora.
