# Homologação e implantação

## Identificações fornecidas (não revalidadas remotamente)

Projeto Vercel sou-barcos, prj_zhDl1iJuhJHAeB4FRNE09EG0B2FF. Aplicação em brasil-force-app/. Domínio oficial informado: https://brasilforce.com.br/. Projeto Supabase autorizado: rrymtjzsekmjplyuoqef.

Homologação histórica do baseline 03f6744: sou-barcos-m17gfxbt5-vers2.vercel.app, informada READY. Isso não comprova disponibilidade atual ou chamada real à IA. Nenhum novo deployment foi criado/validado nesta execução: não há acesso Vercel autenticado disponível.

## Sequência para o candidato atual

1. Auditar versões/migrações do Supabase existente por acesso autorizado. Reconciliar quota remota 20261017010219 com arquivo local; não reaplicar histórico.
2. Aplicar somente novas migrações verificadas e conferir grants/RLS.
3. Criar preview da branch codex/brasilforce-production-audit com rootDirectory=brasil-force-app por deployment, preservando configuração global/legado.
4. Configurar URL/chave publicável Supabase e callbacks exatos. Preview pode compartilhar banco real: não inserir fixtures nem tratar como banco descartável.
5. Manter cadastro, IA e frete desligados até sua homologação. Tokens nunca são NEXT_PUBLIC. Executar env:check --deployment; a validação estática não prova acesso ao provedor.
6. Validar Auth/MFA, vendedor autorizado, anúncio comum real, isolamento e IA com orçamento permitido. Não fabricar registros para demonstrar sucesso.
7. Verificar logs, headers, catálogo, rotas privadas e erros. Registrar ID do preview e resultados, sem confundir build READY com aceite comercial.

## Produção

Não promovida, sem DNS alterado, sem pagamentos ou gastos ativados. Antes de qualquer promoção futura: identificar produção atual e ID de rollback, revisar migrações compatíveis, variáveis/callbacks, checks e aceite comercial; promover somente candidato validado e executar smoke/monitoramento. Rollback Vercel não desfaz SQL. Não substituir o site por recurso incompleto.

GitHub API retornou Forbidden nesta sessão; autorização Git HTTPS é separada. Push/PR e IDs finais são registrados em RESTORE-STATUS.md conforme resultados observados, nunca inferidos.
