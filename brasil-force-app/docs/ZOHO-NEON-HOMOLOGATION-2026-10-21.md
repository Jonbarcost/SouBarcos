# Homologação SQL Zoho Mail — 21/10/2026

A homologação de banco no Neon foi concluída. A ativação real do Zoho permanece pendente de validação no ambiente Supabase e de autorização para publicação. Este relatório não declara a integração ativa em produção.

## Origem preservada e alvo

- Repositório: `Jonbarcost/SouBarcos`, PR #6, branch `feat/brasilforce-zoho-oauth-foundation-20261021`.
- Código inspecionado: `7c4d177737560e20c2b01ce76c2afec9d3b9ab58`; não houve substituição de trabalho anterior.
- Neon: projeto `long-paper-36480042`, branch `br-jolly-waterfall-b7v4zwy5`, banco `brasil_force_test`, owner `brasil_force_test_owner`.
- Migração original mantida byte a byte: `20261021164942_zoho_secure_supplier_operations.sql`, SHA-256 `0a56ed857e50a3b42fc441e3023af80a9365924452e9c347f6168e1d3affce6e`.

## Diagnóstico e correções executadas

O print do SQL Editor mostrava `ERROR: syntax error at or near "begin" (SQLSTATE 42601)` e `EXPLAIN (FORMAT JSON, COSTS, BUFFERS, VERBOSE, PREFETCH, FILECACHE) begin`. A opção Analyze tentou analisar o comando de transação. A solução executada foi aplicar o DDL como operação transacional normal, sem EXPLAIN.

A inspeção também encontrou três tabelas vazias de compatibilidade, sem `auth.sessions`, enums e parte das constraints originais. O helper administrativo verificava papel e AAL2, mas ignorava sessão revogada. Foi aplicado um bootstrap exclusivo de homologação para completar essas dependências e reproduzir os checks originais de conta ativa, sessão existente, MFA e papel persistido no banco. Os papéis de teste não podem fazer login nem ignorar RLS.

A primeira execução de testes retornou `permission denied to set role "anon"`. O PG17 tinha associação do owner com `ADMIN TRUE`, `INHERIT FALSE`, `SET FALSE`. Corrigido exclusivamente nesse branch de teste para `SET TRUE`; nenhum privilégio de bypass foi concedido aos papéis da aplicação. Os testes seguintes executaram como `authenticated`/`anon`, não como owner privilegiado.

A migração foi aplicada integralmente. Foram acrescentados scripts de bootstrap, verificação e inventário e evidências JSON, fora da pasta de migrações de produção.

## Resultado verificável

| Verificação | Resultado |
|---|---|
| Neon, autenticação simulada e operações SQL | 10 grupos aprovados |
| Anônimo, comprador com metadata forjada, moderador e AAL1 | Acesso administrativo negado |
| Conta suspensa e sessão revogada | RPC negada |
| Administrador/superadmin AAL2 com sessão ativa | Permitidos |
| OAuth nonce | Vínculo por usuário/sessão, uso único, replay e expiração verificados |
| Fornecedores | Consentimento e evidência obrigatórios, revisão otimista, histórico atômico |
| Período gratuito | 720 horas, expiração na leitura e impedimento de reinício |
| E-mail | Aprovação exigida, conteúdo imutável, claim único, estado incerto sem retry |
| Aprovação antiga | Claim negado após 24 horas |
| Opt-out | Cancela pendências e bloqueia endereços duplicados |
| Leitura de mensagens | Cota SQL de 60/h validada; não houve leitura real do Zoho |
| RLS | Dados administrativos invisíveis ao comprador; escrita direta negada |
| Catálogo PostgreSQL | 6 tabelas com RLS, 18 RPCs, 9 índices válidos, 31 constraints validadas, 7 políticas, view security_invoker |
| Fixtures após teste | Zero linhas em usuários, sessões, contas, auditoria e tabelas Zoho/fornecedores |
| Suite local | 102 testes aprovados, 0 falhas |
| TypeScript | `npm run typecheck` aprovado |

Evidências detalhadas: `scripts/neon-homologation/evidence-2026-10-21.json`. SQL reproduzível e instruções específicas: `scripts/neon-homologation/README.md`. Os testes locais incluem criptografia AES-GCM, integridade, state assinado e chamadas de provider simuladas. O ciphertext utilizado no teste de banco é deliberadamente fictício e foi revertido.

## Produção e limites

Nenhuma chamada desta homologação foi direcionada ao Supabase oficial. Todas as operações de banco usaram explicitamente o projeto/branch/database Neon acima. Não houve alteração de variáveis de produção, credenciais reais, envio de e-mail, cobrança, merge ou comando de publicação. Isso descreve as ações desta execução; não é uma auditoria de alterações externas feitas por terceiros.

Neon valida PostgreSQL/RLS/RPCs, mas não substitui Supabase Auth, verificação de JWT, MFA real, PostgREST, Storage ou browser/callback OAuth. Nenhum build/deployment novo foi solicitado nesta etapa, pois as alterações são scripts e documentação; não se declara revalidação do site oficial.

## Pendências para ativação controlada

1. Validar os mesmos fluxos em ambiente isolado com serviços reais Supabase, inclusive sessão/MFA e acesso via PostgREST. Não aplicar este bootstrap no Supabase.
2. Validar a configuração efetiva do ambiente escolhido sem revelar valores. O validador existente bloqueia configuração ausente/inadequada. O valor atual de `ZOHO_OAUTH_STATE_SECRET` **não foi inspecionado nesta homologação**: os testes provam o comportamento do validador, não a adequação do segredo instalado. Ele exige 64 caracteres hexadecimais, diversidade mínima, ausência de padrões repetitivos e chave distinta do client secret; a chave de criptografia também deve ser distinta. Usar geração criptograficamente aleatória no gerenciador seguro, se for necessária correção, nunca no chat.
3. Concluir OAuth real com administrador autorizado e comprovar leitura controlada, mantendo envio desativado. A autenticação/consentimento da conta Zoho depende do responsável pela conta.
4. Somente após essa validação, obter autorização para merge/publicação e, separadamente, para qualquer envio real. Nenhuma dessas ações é coberta pelo resultado SQL deste relatório.
