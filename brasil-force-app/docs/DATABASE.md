# Banco e migrações

Projeto remoto autorizado: rrymtjzsekmjplyuoqef. Não criar outro banco/projeto nem resetar linked database. O acesso remoto não estava disponível nesta execução; o estado abaixo distingue arquivos locais e operações efetivas.

## Histórico a reconciliar

Migrações conhecidas pelo histórico fornecido: brasil_force_shared_foundation, seller_review_workflow, listing_drafts, retire_legacy_product_writes, brasil_force_ai_usage_limits. O comando mestre informa a quota registrada remotamente como 20261017010219; o arquivo local é 20261016220500_ai_usage_limits.sql. Isso não autoriza reaplicar a migração. Ler schema_migrations e comparar nome/conteúdo com as funções existentes antes de qualquer mudança.

scripts/database-audit.sql contém consultas somente leitura de versões, tabelas, índices, constraints, RLS, grants de tabela/coluna, funções, triggers, Storage e contagens agregadas. Não exporta auth.users/documentos/credenciais. Ainda não foi executado no servidor remoto.

## Novas migrações aditivas, não aplicadas remotamente

| Arquivo                                     | Objetos / alterações                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 20261017020000_verified_seller_approval.sql | bf_seller_verification_policies, bf_seller_verifications, índices de solicitação/ator, RLS e SELECT restrito; helper privado is_admin; bf_verify_seller invoker e implementação privada; review_seller com aprovação atômica e assinatura preservada                                                                             |
| 20261017030000_listing_moderation.sql       | bf_listing_review_events/notes, índices de fila/ator, RLS de dono/equipe e notas só equipe; bf_review_listing invoker e implementação privada; helper de vendedor público; política de catálogo reforçada e view security_invoker; save_listing preserva classificação restrita; trigger mantém remoção administrativa explícita |

Todas as tabelas novas têm RLS, sem escrita direta para anon/authenticated. Funções públicas são security invoker. Implementações definer ficam em brasil_force_private com search_path vazio, EXECUTE revogado antes dos grants mínimos e autorização explícita de sessão/role/MFA. Não alteram contas/tabelas do legado nem removem dados.

## Aplicação autorizada futura

1. Obter acesso ao projeto existente e executar auditoria somente leitura.
2. Confirmar histórico, assinaturas, objetos existentes e backup/recuperação. Não executar supabase db push cegamente: timestamps históricos divergem.
3. Aplicar somente as duas novas migrações uma vez, em ordem, após revisar os requisitos de evidência. Cada arquivo tem BEGIN/COMMIT.
4. Conferir grants/RLS por Data API e executar fluxo autenticado controlado sem fixtures em produção. Não habilitar políticas documentais sem processo privado operacional.
5. Só então publicar preview dependente desses objetos e homologar com contas autorizadas.

## Reversão

Priorizar correção aditiva e rollback da aplicação. Desabilitar políticas de verificação e revogar EXECUTE das novas RPCs interrompe novas aprovações/decisões, preservando auditoria. Não apagar tabelas, decisões nem rebaixar contas em massa. Manter filtros públicos mais estritos. Rollback de aplicação não desfaz migrações nem restaura papéis anteriores. A antiga aplicação continua compatível com triagem/rascunhos, mas não apresenta novos recursos.

## Evidência local

Migrações aplicadas em bancos PostgreSQL em memória PGlite de testes, com fixtures locais. Isso valida syntax/transações/grants/RLS nesses testes, sem validar Auth/Storage reais nem concorrência entre conexões remotas. Não há migração remota aplicada ou banco remoto criado por esta execução.
