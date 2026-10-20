# Banco e migrações

Projeto remoto autorizado: rrymtjzsekmjplyuoqef. Não criar outro projeto remoto nem resetar linked database. A homologação usa exclusivamente um Supabase local Docker descartável, autorizado pelo comando 3.0. O histórico remoto confirmado pelo proprietário foi incorporado em e91a236; esta operação não executou SQL remoto.

## Histórico a reconciliar

Migrações conhecidas pelo histórico fornecido: brasil_force_shared_foundation, seller_review_workflow, listing_drafts, retire_legacy_product_writes, brasil_force_ai_usage_limits. O comando mestre informa a quota registrada remotamente como 20261017010219; o arquivo local é 20261016220500_ai_usage_limits.sql. Isso não autoriza reaplicar a migração. Ler schema_migrations e comparar nome/conteúdo com as funções existentes antes de qualquer mudança.

scripts/database-audit.sql contém consultas somente leitura de versões, tabelas, índices, constraints, RLS, grants de tabela/coluna, funções, triggers, Storage e contagens agregadas. Não exporta auth.users/documentos/credenciais. Ainda não foi executado no servidor remoto.

## Migrações aditivas já aplicadas remotamente (não reaplicar)

| Arquivo                                     | Objetos / alterações                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 20261017020000_verified_seller_approval.sql | bf_seller_verification_policies, bf_seller_verifications, índices de solicitação/ator, RLS e SELECT restrito; helper privado is_admin; bf_verify_seller invoker e implementação privada; review_seller com aprovação atômica e assinatura preservada                                                                             |
| 20261017030000_listing_moderation.sql       | bf_listing_review_events/notes, índices de fila/ator, RLS de dono/equipe e notas só equipe; bf_review_listing invoker e implementação privada; helper de vendedor público; política de catálogo reforçada e view security_invoker; save_listing preserva classificação restrita; trigger mantém remoção administrativa explícita |

Todas as tabelas novas têm RLS, sem escrita direta para anon/authenticated. Funções públicas são security invoker. Implementações definer ficam em brasil_force_private com search_path vazio, EXECUTE revogado antes dos grants mínimos e autorização explícita de sessão/role/MFA. Não alteram contas/tabelas do legado nem removem dados.

## Histórico remoto e ambiente local

| Nome                     | Arquivo local  | Versão remota confirmada |
| ------------------------ | -------------- | ------------------------ |
| verified_seller_approval | 20261017020000 | 20261017030036           |
| listing_moderation       | 20261017030000 | 20261017030041           |

Não reaplicar esses arquivos no projeto compartilhado. A quota mantém a divergência histórica já descrita. Antes de qualquer mudança remota futura, executar a auditoria somente leitura e conferir conteúdo/versões; nunca usar db push indiscriminadamente.

O projeto local bf-first-seller usa PostgreSQL 17, portas fixas 55321/55322 e todas as migrações versionadas em uma base nova. Supabase CLI não recebe --linked, project-ref remoto nem credenciais remotas. Fixtures e política TEST-ONLY-v1 só são carregadas depois da prova de isolamento. Consulte [FIRST-SELLER-OPERATION.md](FIRST-SELLER-OPERATION.md).

## Reversão

Priorizar correção aditiva e rollback da aplicação. Desabilitar políticas de verificação e revogar EXECUTE das novas RPCs interrompe novas aprovações/decisões, preservando auditoria. Não apagar tabelas, decisões nem rebaixar contas em massa. Manter filtros públicos mais estritos. Rollback de aplicação não desfaz migrações nem restaura papéis anteriores. A antiga aplicação continua compatível com triagem/rascunhos, mas não apresenta novos recursos.

## Evidência local

PGlite continua como suíte rápida. A nova integração usa Auth/Storage/Data API reais locais e conexões PostgreSQL distintas, observando lock waiters por PID, revisão concorrente, rollback por falha de auditoria e encerramento de transação. A suíte não depende de JWTs simulados para conceder MFA. Nenhuma migração remota foi executada por esta operação.
