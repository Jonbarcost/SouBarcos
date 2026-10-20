# Brasil Force no SouBarcos — 15/10/2026

## Alterações aplicadas

Projeto: SouBarcos (`rrymtjzsekmjplyuoqef`), região existente us-east-2, sem mudança de plano.

Migração `brasil_force_shared_foundation` aplicada com sucesso. Sete tabelas próprias (`bf_accounts`, `bf_profiles`, `bf_institution_verifications`, `bf_seller_applications`, `bf_categories`, `bf_listings`, `bf_audit_events`), todas com RLS. Helpers em `brasil_force_private`; bucket `bf-seller-documents` privado, uploads continuam bloqueados. Nenhuma tabela antiga renomeada, apagada, esvaziada ou migrada. Sem novos triggers em auth.users.

Adesão explícita por RPC invoker `bf_join`; função interna com search_path fixo, validação de sessão/e-mail confirmado, papel fixo buyer, versão de termos e inserção idempotente. Não importa permissões antigas. Readesão não remove suspensão nem muda papéis. No momento da entrega, zero membros Brasil Force; as quatro contas Auth antigas não foram inscritas automaticamente.

## Verificações no banco real

- Antes/depois: 1.768 produtos e quatro mensagens preservados; quatro usuários Auth preservados.
- Sete tabelas novas, sete com RLS; seis categorias estruturais, zero anúncios.
- Perfil não legível por anon; accounts sem grant de UPDATE; anon não executa bf_join.
- Role authenticated sem identidade enxerga zero perfis/contas e não pode alterar role/aprovação.
- REST com chave publicável: bf_categories HTTP 200 (6), bf_listings HTTP 200 (0), bf_profiles HTTP 401.
- Auth settings: confirmação de e-mail habilitada; cadastro global existente habilitado. Não alterado.
- 19 testes PGlite aprovados, incluindo associação explícita, repetição idempotente, sessão revogada e e-mail não confirmado. Build e TypeScript aprovados.
- Smoke HTTP da aplicação aprovado: nove rotas públicas, três rotas protegidas e bloqueios de cadastro/OAuth não configurados.
- Ainda não testados: envio de e-mail real, cadastro/login/MFA de ponta a ponta, callback publicado, renderização em navegador e Storage autenticado.

## Compartilhamento e riscos existentes

Serviço Auth, SMTP, OAuth, fatores MFA e limites são únicos para o projeto. Cookies próprios evitam colisão de armazenamento local, não isolam as identidades no provedor. Reset de senha e encerramento global afetam a mesma conta nos aplicativos associados. Avisos incluídos nas telas correspondentes.

**products:** políticas INSERT/DELETE com condição `true` e grants anônimos confirmados. Falha preexistente, não alterada nesta entrega. Precisa revisão antes de publicação. Não reutilizar essa tabela para anúncios Brasil Force e não assumir que RLS habilitado equivale a política segura.

Advisors antes/depois retornaram os mesmos alertas: messages com RLS sem políticas (bloqueio de leitura ordinária, não abertura de dados), proteção contra senhas vazadas desabilitada. Referências:

- https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
- https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

Não foi alterado o acesso das aplicações antigas para evitar quebrar fluxos desconhecidos. Isso impede considerar o projeto compartilhado auditado ou pronto para lançamento.

## Próximos passos

1. Revisar as regras antigas de products com o fluxo atual de cadastro/remoção de produtos.
2. Resolver a permissão Vercel (tentativa anterior devolveu 403).
3. Definir URL de publicação e adicionar callbacks sem remover os existentes.
4. Homologar SMTP/Auth/MFA e recuperar senha em sessão real.
5. Só então habilitar AUTH_REGISTRATION_ENABLED e seguir para anúncios/moderação e fase comercial.
