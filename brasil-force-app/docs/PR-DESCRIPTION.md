# Consolidação de autorização, IA e moderação do Brasil Force

A aplicação recuperada não tinha uma decisão administrativa segura de aprovação comercial nem moderação completa de anúncios. Este candidato acrescenta aprovação com política/evidência vigente, MFA/admin e habilitação atômica; moderação com revisão/auditoria e notas privadas; catálogo público com filtros explícitos também para donos/equipe.

O assistente passa a validar bytes/origem/sessão/quota e aceitar apenas seleção estruturada de anúncios reais pelo gateway. A interface mantém histórico local e trata o estado indisponível. Nenhum texto livre do modelo é usado como fato comercial.

Validação: 70 testes, TypeScript, build, smoke HTTP e interação Chromium em desktop/celular passaram. Revisão independente não encontrou defeitos críticos/importantes na versão revisada.

**Pré-requisitos de implantação:** auditar o Supabase existente e aplicar somente as duas novas migrações; nenhuma delas foi aplicada remotamente nesta execução. Não há política documental habilitada, chamada real ao modelo ou preview novo validado. APIs externas retornaram 403 e credenciais Supabase/Vercel estavam ausentes. Sem promoção de produção, pagamentos ou alteração do legado. Ver DATABASE.md, TESTING.md e DELIVERY-REPORT.md.
