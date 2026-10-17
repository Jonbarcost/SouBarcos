# Triagem de vendedores — 16/10/2026 UTC

Entregue: fila administrativa filtrável/paginada; iniciar análise, solicitar correção ou rejeitar com confirmação e motivo; solicitante acompanha histórico privado e reenvia nome/tipo de pessoa após solicitação de correções.

Decisões registradas em bf_seller_review_events na mesma transação que muda o status. RPC pública security invoker encaminha para função privada com autorização explícita, sessão ativa e AAL2 para equipe. Controle por revision previne sobrescrita de decisão por página antiga. Rejeição é terminal nesta etapa. Nenhuma função aprova vendedor, altera role ou gera selo. Recursos de contestação/reabertura ainda pendentes.

Aplicada a migração 20261016004302_seller_review_workflow.sql ao SouBarcos. RLS confirmado; leitura anônima, inserção direta no histórico e execução anônima da decisão bloqueadas. Sem usuários fictícios nem decisões em solicitações reais. Zero membros BF e solicitações no momento da verificação inicial.

31 testes automatizados aprovados, TypeScript e build aprovados. Testes cobrem permissões, MFA, estados, motivo, concorrência otimista, privacidade e reenvio. Homologação em navegador autenticado com usuário real permanece pendente.

Os advisors mantêm apenas os avisos anteriores: messages sem política e proteção contra senhas vazadas desabilitada. Referências:
- https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
- https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

Cadastro público, vendas e logística continuam desligados. Próximo marco: homologação Auth/e-mail, identificação do administrador e verificação documental real, antes de aprovação de vendedores e anúncios.

Publicação confirmada READY: dpl_8woTKqY55qYJVXKpiMG4VNoFgnpx, commit de aplicação f57a9dc, https://sou-barcos.vercel.app. Smoke HTTP local aprovado para páginas públicas, rotas protegidas e gates de cadastro/OAuth.
