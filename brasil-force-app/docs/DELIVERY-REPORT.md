# Relatório técnico — consolidação operacional

Data: 16/10/2026 (America/Sao_Paulo). Repositório Jonbarcost/SouBarcos, branch codex/brasilforce-production-audit, aplicação brasil-force-app.

## Resumo executivo

Entregue código funcional/testado localmente para reforço da IA, aprovação verificada de vendedores, habilitação comercial atômica, moderação auditada e projeção/detalhe de catálogo público. Não equivale a marketplace comercial pronto. Serviços externos e dados reais não foram usados como demonstração.

## Código e commits

- 48d8e40 — auditoria, desenho operacional e consultas SQL somente leitura.
- 246d719 — migração de aprovação verificada, schema/ações/UI administrativas, histórico completo, acesso ao painel e testes SQL.
- 0eafa16 — migração de moderação/projeção pública, fila/detalhe administrativo, detalhe público, retorno ao vendedor e testes de classificação/isolamento.
- 421d2e7 — serviço/adaptador de IA, rota autenticada, histórico local, validação de ambiente, ícone derivado da marca e testes de quota/gateway.
- Commit documental desta entrega — AI-ASSISTANT, ARCHITECTURE, DATABASE, DEPLOYMENT, LISTINGS, OPERATIONS, RESTORE-STATUS, SECURITY, SELLER-REVIEW, TESTING, descrição de PR e este relatório.

O histórico Git fornece a lista completa de arquivos por módulo. package.json/lockfile e legado Express/static não foram alterados. Nenhum commit novo foi direcionado ao repositório auxiliar.

## Banco

Arquivos novos: 20261017020000_verified_seller_approval.sql e 20261017030000_listing_moderation.sql. Criam tabelas/índices de verificação e histórico, RLS/grants mínimos, RPCs invoker com implementação privada autorizada, aprovação atômica, moderação e view pública security_invoker. Preservam assinatura de revisão de vendedor e funções de gravação existentes.

Aplicadas somente nos bancos em memória dos testes. **Nenhuma migração remota foi aplicada.** Histórico remoto da quota 20261017010219 precisa ser reconciliado com o nome local antes de qualquer implantação. Rollback e consulta de auditoria estão em DATABASE.md e scripts/database-audit.sql.

## Testes

Comandos: npm ci; npm run typecheck; npm test; npm run build; npm run test:http; npm run env:check com configuração local e recursos desativados. Baseline 47/47. Execução final 70/70, zero falhas, skips ou cancelamentos; tipos/build/HTTP/env:check exit 0.

Testes novos foram executados antes da implementação. Foram corrigidos: perda de classificação restrita em correção de anúncio; compatibilidade do adaptador com configuração TypeScript; pressuposto antigo de publicação sem estoque/embalagem/vendedor aprovado; tratamento de notFound após streaming; favicon ausente. As reexecuções passaram.

Browser: Chromium por Playwright Core fora das dependências da app (Browser plugin indisponível). Desktop 1440×1000 e celular 390×844: sugestão preenche campo, envio real recebe 503 esperado, histórico mostra erro; rota privada redireciona; sem erro JavaScript, overlay ou overflow. Evidência local em /tmp/brasil-force-qa. Não foi testado painel administrativo autenticado remotamente.

Revisão independente de segurança não encontrou defeitos críticos/importantes. PGlite não comprova concorrência entre conexões reais nem Supabase Auth/Storage remoto.

## Inteligência artificial

Backend autenticado, conta ativa, e-mail confirmado, quota de banco, entradas/origem/bytes e falhas sanitizadas. Gateway fixo HTTPS, OIDC preferido quando presente, timeout e envelope limitado. Saída aceita apenas IDs fornecidos e orientação enumerada; fatos vêm do catálogo. UI com histórico local de sessão, sugestões, carregamento, erros e links de anúncios reais.

Não há modelo selecionado/validado nem credencial/orçamento comprovados nesta sessão. Lista de modelos/documentação retornaram 403. **Nenhuma resposta real do modelo foi obtida.** BF_AI_ENABLED permanece fechado até homologação real, incluindo custo e múltiplas instâncias.

## Vendedores

Aprovação implementada somente para admin/superadmin AAL2, solicitação in_review, revisão atual, conta elegível e evidência vigente conforme política. Papel seller/store, estado e auditoria mudam na mesma transação. Verificação guarda apenas referência opaca a processo externo seguro, não documentos. Sem autoaprovação.

Política começa desabilitada/não preenchida. Processo real de evidências, retenção e acesso auditado ainda não configurado. Upload continua bloqueado. Nenhuma conta real promovida; homologação Auth/MFA remota pendente.

## Anúncios

Rascunho/gravação e envio existentes preservados. Moderação adicionada: fila, análise, correção, rejeição, aprovação comum e remoção. Notas internas segregadas, histórico e revisão sob lock. Catálogo/detalhe/assistente exigem anúncio permitido, estoque e vendedor aprovado/ativo no banco/projeção pública; classificação restrita não é apagada por correção.

Nenhum anúncio real criado/aprovado nesta execução. Fotos, carrinho, reserva transacional de estoque, pedidos, PSP/split/webhooks e logística completa não foram implementados. Pagamentos reais permanecem indisponíveis.

## Vercel

Nenhum deployment novo criado ou validado: faltam credenciais/ferramenta autenticada. Preview histórico do baseline informado pelo proprietário não é apresentado como evidência atual. Projeto existente e diretório por deployment constam em DEPLOYMENT.md. Não alterar a configuração global que pode atender o legado.

## Produção

Nenhuma promoção, alteração DNS, pagamento ou gasto habilitado. Nenhuma operação remota de banco ou dado comercial. Código candidato fica na branch autorizada, sem merge/force. Para release futuro, identificar e preservar ID de produção/rollback, auditar/aplicar migrações, validar preview completo e somente então avaliar promoção. Rollback da app não desfaz SQL.

## Configuração reutilizável

Rascunho salvo com instalação, inicialização, requisitos de variáveis/credenciais e destinos de rede. Novos destinos: api.github.com, vercel.com, api.vercel.com, api.supabase.com e rrymtjzsekmjplyuoqef.supabase.co; ai-gateway.vercel.sh já constava do rascunho. Segredos são requisitos sem valores: SUPABASE_ACCESS_TOKEN para api.supabase.com, VERCEL_TOKEN para api.vercel.com e AI_GATEWAY_API_KEY para o gateway (ou OIDC válido no runtime). Salvar rascunho não aplica configuração nem publica ambiente. Revisar/salvar e publicar nas configurações do ambiente.

## Pendências e ação necessária

1. Disponibilizar acesso seguro ao Supabase existente e Vercel nas configurações; nunca enviar valores no chat. Executar auditoria somente leitura e reconciliar histórico antes das novas migrações.
2. Habilitar os destinos necessários. A API GitHub retornou Forbidden mesmo com variável de autenticação presente; não foi solicitada chave duplicada. A descrição revisável do PR está em PR-DESCRIPTION.md, mas edição da descrição via API permanece bloqueada.
3. Configurar processo privado de evidências e política por modalidade; homologar contas autorizadas com MFA e isolamento sem fixtures em produção.
4. Validar modelo/credencial/orçamento real do gateway e concorrência PostgreSQL com conexões independentes.
5. Criar/validar preview após migrações e Auth. Só então avançar ao subsistema comercial de estoque reservado/pedidos/pagamento sandbox.

## Próxima etapa

Retomar pelos acessos externos sem repetir o trabalho local: auditoria remota → migrações novas verificadas → homologação Auth/MFA e evidências → aprovação/anúncio comum real → chamada real de IA autorizada → preview completo. Comércio essencial e critérios de produção continuam sem aceite.
