Homologa localmente o ciclo cadastro → confirmação → aprovação com MFA → painel → anúncio → moderação → catálogo, usando Supabase Docker descartável. Impede fixtures no banco compartilhado por prova de projeto, URL/chaves, ownership Docker e dados exclusivos de teste. A CSP passa a aceitar Auth loopback somente em development.

Adiciona 16 testes contra Auth/Storage/PostgreSQL reais, concorrência com PIDs distintos, rollback e isolamento entre vendedores; Playwright desktop/mobile com artefatos públicos restritos; CI sem secrets de produção e cleanup condicionado à prova de isolamento. Preserva migrações remotas já aplicadas e todo o legado.

Validação final após integrar os sete commits remotos até 0f128b5: npm ci, npm run check (80/80 + tipos/build), test:http e test:first-seller (16/16 integrações + 2/2 E2E em base nova) passaram. Cleanup concluído sem containers restantes. Ver docs/TESTING.md e docs/FIRST-SELLER-OPERATION.md. Novo preview e jornada remota dependem de acesso Vercel e banco remoto isolado; não há deploy de produção, fixtures remotas, DNS ou pagamentos reais. Evidência documental continua opaca e a política real não foi habilitada. Pedidos/frete/pagamentos sandbox ficam para a próxima fase.

Push acionou preview automático 2a9fb79 (dpl_24wZUVBVL6u89T1zNDvXxsficeho), que retornou failure. Sem token Vercel para logs (403); diagnóstico e novo preview válido pendentes. Não foi alterada a configuração global do legado. Detalhes em docs/DEPLOYMENT.md.

CI remoto confirmado em 2a9fb79: duas execuções success (38999323883 e 38999319287), com jobs verify e first-seller, cleanup e artifacts aprovados. A atualização final documenta esses resultados e o bloqueio Vercel, sem alterar código.
