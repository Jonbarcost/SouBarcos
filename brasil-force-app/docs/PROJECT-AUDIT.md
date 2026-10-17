# Auditoria inicial — Brasil Force (16/10/2026)

## Confirmado em serviços conectados
- Supabase SouBarcos: `rrymtjzsekmjplyuoqef`, ACTIVE_HEALTHY, PostgreSQL 17.
- 8 tabelas `public.bf_*` com RLS; 6 categorias; 0 anúncios e 0 solicitações de vendedores na consulta.
- Quatro migrações aplicadas no banco, versões: 20261015211450, 20261016004612, 20261016092818, 20261016103404. Os nomes dos arquivos da branch não coincidem numericamente com as versões registradas; **não executar migrações existentes novamente**.
- `public.products` é legado, com 1768 registros; não alterar nem reutilizar para Brasil Force.
- Projeto Vercel `sou-barcos`, ID `prj_zhDl1iJuhJHAeB4FRNE09EG0B2FF`, possui domínio verificado `brasilforce.com.br`. Deployment READY `dpl_DiLWqCWzXBLfL3d59QpVG3g9oJpZ`; a origem Git exata desse deployment não veio em seus metadados. Não assumir que uma branch corresponde ao site publicado.
- GitHub `Jonbarcost/Brasil-Force`: `main` contém README e .gitattributes; `codex/foundation-seller-listings` contém Next.js 16, testes e fluxo de vendedor; `codex/listing-moderation-triage` apresentou a mesma árvore na inspeção.
- `Jonbarcost/SouBarcos`: `main` contém legado HTML/Node/Express.
- Não foi possível inspecionar alterações que estejam apenas em computadores locais, ainda não enviadas ao GitHub.

## Achados críticos
- O enum `bf_product_classification` é `free, additional_review, controlled, prohibited`; não substituir por enum novo sem migração compatível.
- `brasil_force_private.review_seller` não permite `approved` apesar de o campo status da solicitação aceitá-lo. A habilitação precisa de verificação documental, decisão auditada e revisão dos papéis antes de ser implementada.
- `brasil_force_private.can_sell` requer sessão ativa, papel seller/store e solicitação approved; preservar.
- O catálogo público exige status approved, classification free e vendedor ativo; preservar.
- Grants diretos de tabelas bf_ a anon/authenticated são majoritariamente SELECT, com INSERT restrito para bf_seller_applications e UPDATE para bf_profiles; gravação de anúncios ocorre por RPC autorizada.
- Advisors: `public.messages` tem RLS sem política (não é autorização para abrir acesso); proteção de senhas vazadas desativada. Referências: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy e https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection.

## Escopo desta branch
- Páginas informativas `/explorar` e `/instituicoes` e catálogo de descoberta tipado, com testes.
- Nenhuma alteração de banco, RLS, grants, dados legados, domínio ou deploy.
- **Pendente:** validação build/typecheck/HTTP em CI e integração de produção. Esta entrega não habilita compras nem aprovação de vendedores.
