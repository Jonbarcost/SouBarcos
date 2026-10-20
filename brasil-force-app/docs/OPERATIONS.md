# Operação e continuidade

## Preparação local

Usar checkout existente /workspace/SouBarcos na branch codex/brasilforce-production-audit; não criar worktree sem solicitação. Aplicação em brasil-force-app; Node 24.19.0. Executar npm ci com lockfile congelado, npm run check e npm run test:http. .env.local é ignorado; não copiar credenciais para documentação.

Para smoke offline: SITE_URL=http://localhost:3100, BF_AI_ENABLED=false, AUTH_REGISTRATION_ENABLED=false, AUTH_GOOGLE_ENABLED=false, AUTH_APPLE_ENABLED=false, SHIPPING_ENABLED=false e SHIPPING_PRODUCTION_ENABLED=false. O runner HTTP inicia e encerra seu próprio processo. Serviços vivos precisam reiniciar em novas tarefas; dependências/build são arquivos retidos no snapshot.

## Antes de ativar IA

Confirmar credencial disponível sem imprimir valor, destino ai-gateway.vercel.sh autorizado, modelo atual compatível com JSON e teto de gastos aprovado. Testar autenticação real, 401/429/503 do provedor, quotas e comportamento em múltiplas instâncias. Manter cadastro público desativado até homologação de Auth/e-mail e controles de abuso. Nunca habilitar faturamento automaticamente. OIDC é credencial efêmera do runtime, não valor a salvar em arquivos.

## Antes de aprovar vendedores

Revisar as migrações já aplicadas (ver DATABASE.md), sem reaplicá-las. Definir política versionada por modalidade apenas quando houver processo privado de evidências com acesso auditado e retenção. Administrador AAL2 confere evidências e registra referência interna, então aprova a revisão atual com justificativa. Não inserir verificação fictícia nem criar conta artificial de equipe. Aprovação comercial não concede credenciamento institucional.

## Antes de publicar anúncios

Conferir vendedor ativo/aprovado, dados do produto, legalidade, procedência e requisitos aplicáveis. Equipe AAL2 inicia análise, registra classificação e decisão. Itens restritos não podem passar pelo fluxo comum. Pedidos/pagamentos seguem indisponíveis mesmo que o item esteja no catálogo.

## Incidentes e reversão

Desativar BF_AI_ENABLED para interromper chamadas; revogar credencial comprometida no provedor e revisar métricas sem conteúdo pessoal. Suspender conta retira seu catálogo; remover anúncio aprovado por RPC administrativa deixa histórico. Capturar deployment anterior e contexto de variáveis antes de qualquer release; rollback da aplicação não reverte banco. Manter notas/evidências/auditoria, sem exportá-las para Git.

Job de limpeza de quotas, alertas de erro/custo, retenção e backup/restore ainda não configurados. Não há monitoramento automático rodando implicitamente nesta entrega. Ver DATABASE.md e DEPLOYMENT.md.

## Executar a homologação isolada

Com Node 24.19.0, Docker ativo, acesso aos registries oficiais e Chromium instalado (ou npx playwright install --with-deps chromium), executar na aplicação:

```bash
npm ci
npm run test:first-seller
```

O comando inicia o projeto local bf-first-seller, aplica migrações na base local nova, comprova isolamento, cria identidades .invalid, executa integração e E2E, encerra Next e descarta somente o stack comprovado. Para investigação: test:local:start, test:integration, test:e2e, test:local:stop. Não executar duas instâncias da suíte sobre o mesmo projeto/portas. test:local:cleanup para recursos próprios preservando backup quando startup foi interrompido; não remove recursos de outro checkout.

Não executar db reset --linked, db push remoto nem fixtures em preview que use o banco compartilhado. Processos Docker/Next precisam ser reiniciados em outra sessão; nenhum serviço vivo é garantido pelo snapshot. Mais detalhes em [FIRST-SELLER-OPERATION.md](FIRST-SELLER-OPERATION.md).
