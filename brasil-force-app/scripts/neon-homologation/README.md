# Homologação SQL isolada — Zoho Mail

Alvo autorizado: projeto `long-paper-36480042`, branch `br-jolly-waterfall-b7v4zwy5` (`homologacao`), database `brasil_force_test`, owner `brasil_force_test_owner`.

Não usar no Supabase nem apontar a aplicação para este banco como substituto do Supabase. Os schemas Auth abaixo são simulações SQL, sem emissão/validação de JWT, GoTrue, PostgREST ou Storage. Nenhum script acessa o Zoho ou envia e-mails.

## Estado e reprodução

A preparação e a migração já foram executadas em 21/10/2026. **Não reaplicar bootstrap/migração nesse banco.** O bootstrap recusa dados preexistentes ou migração já instalada. Ele foi feito especificamente para os três stubs vazios inspecionados (`auth.users`, `bf_accounts`, `bf_audit_events`), não é instalador genérico para qualquer banco vazio.

1. Confirmar os quatro identificadores do alvo no console/conector; não confiar no branch padrão.
2. Em uma reprodução com a mesma baseline inspecionada, executar `bootstrap.sql` uma vez. Ele completa enums, constraints, sessões, funções de acesso e permissões sem remover tabelas. Os helpers `active_session`, `is_staff` e `is_admin` preservam as condições das migrações originais. `auth.jwt/uid` recebem claims de teste controladas pelo executor.
3. Aplicar o arquivo original `supabase/migrations/20261021164942_zoho_secure_supplier_operations.sql`, em **Execute/Run**, nunca Analyze. Não trocar a migração de produção por este bootstrap. Na execução via conector desta homologação, apenas o `begin/commit` externo foi substituído por um bloco `DO` atômico com guarda do database/owner; o DDL interno foi preservado.
4. Reexecutar `verify.sql` em uma única conexão/transação. No conector `run_sql_transaction`, enviar as cinco instruções de nível superior (tabela temporária, três funções temporárias, SELECT) na mesma chamada. Não dividir por todos os `;`, pois existem blocos PL/pgSQL. O resultado é uma lista de 10 grupos aprovados; qualquer falha inesperada aborta a chamada.
5. Executar `catalog.sql` para consultar os objetos e comprovar ausência de fixtures. Comparar com `evidence-2026-10-21.json`.

As fixtures são revertidas por uma subtransação explícita, inclusive as credenciais fictícias e os registros de outbox. Sequences podem avançar durante o teste; isso não representa envio. Funções de teste são temporárias e não ficam publicadas. Testes exigem banco sem usuários/fornecedores/conexão real. A associação do owner aos papéis `anon/authenticated` usa `SET TRUE`, mantendo `INHERIT FALSE`; estes papéis permanecem NOLOGIN, sem SUPERUSER e sem BYPASSRLS. Sem isso o PG17 negava `SET ROLE`, e testar como owner teria ignorado RLS.

## Evidências e limites

- Hash SHA-256 da migração intacta: `0a56ed857e50a3b42fc441e3023af80a9365924452e9c347f6168e1d3affce6e`.
- SQL do Neon: 10 grupos, 6 tabelas com RLS, 18 funções RPC (9 wrappers e 9 implementações), 9 índices válidos, 31 constraints validadas e 7 políticas.
- As três políticas antigas de escrita de fornecedores permanecem no arquivo original, mas não concedem escrita: os privilégios INSERT/UPDATE foram revogados. As escritas são feitas pelas RPCs auditadas; os testes confirmam a negação de escrita direta.
- Testes locais do aplicativo: `npm test` (102/102) e `npm run typecheck` (sucesso).
- A função SQL de gravação aceita ciphertext sintético com prefixo `v1`; isso não prova criptografia. AES-GCM, assinatura de state, adulteração, configuração inválida e mocks HTTP são verificados separadamente pelos testes locais existentes.
- Não houve validação OAuth real, consentimento Zoho real, envio real, validação UI ponta a ponta, teste concorrente de carga nem substituição dos testes de Supabase.

Relatório: `docs/ZOHO-NEON-HOMOLOGATION-2026-10-21.md`.
