# Operação e continuidade

## Preparação local

Usar checkout existente /workspace/SouBarcos na branch codex/brasilforce-production-audit; não criar worktree sem solicitação. Aplicação em brasil-force-app; Node 24.19.0. Executar npm ci com lockfile congelado, npm run check e npm run test:http. .env.local é ignorado; não copiar credenciais para documentação.

Para smoke offline: SITE_URL=http://localhost:3100, BF_AI_ENABLED=false, AUTH_REGISTRATION_ENABLED=false, AUTH_GOOGLE_ENABLED=false, AUTH_APPLE_ENABLED=false, SHIPPING_ENABLED=false e SHIPPING_PRODUCTION_ENABLED=false. O runner HTTP inicia e encerra seu próprio processo. Serviços vivos precisam reiniciar em novas tarefas; dependências/build são arquivos retidos no snapshot.

## Antes de ativar IA

Confirmar credencial disponível sem imprimir valor, destino ai-gateway.vercel.sh autorizado, modelo atual compatível com JSON e teto de gastos aprovado. Testar autenticação real, 401/429/503 do provedor, quotas e comportamento em múltiplas instâncias. Manter cadastro público desativado até homologação de Auth/e-mail e controles de abuso. Nunca habilitar faturamento automaticamente. OIDC é credencial efêmera do runtime, não valor a salvar em arquivos.

## Antes de aprovar vendedores

Aplicar/revisar novas migrações após auditoria autorizada do projeto existente. Definir política versionada por modalidade apenas quando houver processo privado de evidências com acesso auditado e retenção. Administrador AAL2 confere evidências e registra referência interna, então aprova a revisão atual com justificativa. Não inserir verificação fictícia nem criar conta artificial de equipe. Aprovação comercial não concede credenciamento institucional.

## Antes de publicar anúncios

Conferir vendedor ativo/aprovado, dados do produto, legalidade, procedência e requisitos aplicáveis. Equipe AAL2 inicia análise, registra classificação e decisão. Itens restritos não podem passar pelo fluxo comum. Pedidos/pagamentos seguem indisponíveis mesmo que o item esteja no catálogo.

## Incidentes e reversão

Desativar BF_AI_ENABLED para interromper chamadas; revogar credencial comprometida no provedor e revisar métricas sem conteúdo pessoal. Suspender conta retira seu catálogo; remover anúncio aprovado por RPC administrativa deixa histórico. Capturar deployment anterior e contexto de variáveis antes de qualquer release; rollback da aplicação não reverte banco. Manter notas/evidências/auditoria, sem exportá-las para Git.

Job de limpeza de quotas, alertas de erro/custo, retenção e backup/restore ainda não configurados. Não há monitoramento automático rodando implicitamente nesta entrega. Ver DATABASE.md e DEPLOYMENT.md.
