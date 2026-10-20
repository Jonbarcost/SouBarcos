# Comando para o agente auxiliar

Atue como pesquisador técnico da Brasil Force, marketplace brasileiro de vestuário, equipamentos outdoor e colecionáveis de venda livre. A stack é Next.js, Supabase e Vercel, com adaptador inicial de cotação Melhor Envio. O negócio ainda não está aberto a compras.

Sua tarefa é pesquisar, sem acessar contas privadas nem modificar código ou produção:

1. Compare Mercado Pago, Pagar.me e Asaas para marketplace: Pix, cartão, split, cadastro/verificação de vendedores, repasses, estornos, chargebacks, webhooks autenticados e idempotência. Confirme quais recursos exigem contratação ou aprovação comercial. Não presuma que split está disponível em toda conta.
2. Identifique restrições oficiais para artigos táticos/outdoor/colecionáveis lícitos; a plataforma não venderá armas, munição, explosivos nem produtos controlados no lançamento. Diferencie política do provedor de legislação. Liste dúvidas que exigem resposta escrita da equipe comercial/jurídica.
3. Investigue verificação de identidade para pessoa física/jurídica, uso da verificação do próprio gateway, minimização de documentos armazenados pela plataforma e integração por webhook. Não proponha selo baseado em autodeclaração.
4. Documente o onboarding OAuth do Melhor Envio por vendedor, escopos, renovação de tokens, ambientes, cotação por origem, criação/pagamento/geração de etiquetas, rastreio, logística reversa e restrições por transportadora. Separe o que a API oferece do que precisa ser homologado.

Entregue uma tabela comparativa curta, recomendação justificada para um piloto de baixo custo, links oficiais e data de consulta, roteiro de integração e lista do que depende do titular da conta. Preços só com fonte oficial; marque dados indisponíveis como não confirmados. Não crie contas, não compre serviços, não peça senhas/tokens e não altere Supabase, GitHub ou Vercel. Não entre em contato com empresas em nome do usuário; redija perguntas para revisão.

## Continuidade técnica para outro desenvolvedor

- Fonte versionada local: brasil-force; pacote atualizado Brasil-Force-Fundacao.zip.
- Supabase SouBarcos reutilizado com tabelas bf_ e schema privado brasil_force_private. Nenhuma tabela legada deve ser apagada.
- Vercel projeto sou-barcos; URL https://sou-barcos.vercel.app. Código publicado diretamente pela API; GitHub antigo ainda não substituído. Não disparar deployment do antigo repositório.
- Migração seller_review_workflow aplicada em 16/10/2026 UTC. Fluxo real: pending → in_review/changes_requested/rejected; correção pelo proprietário → pending. Sem aprovação antes de KYC real.
- Histórico protegido por RLS, decisões exigem MFA, justificativa, revisão esperada e bloqueio da linha. Sem grants diretos de update das solicitações.
- Não atribuir administrador sem identificar a conta do titular; não há membros BF no checkpoint inicial desta entrega. Cadastro público segue desativado até homologação de e-mail e callbacks.
- Próximas dependências: homologar Auth/e-mail; bootstrap controlado de administrador; KYC; imagens e anúncios; pedidos/estoque/pagamentos; frete e rastreio. A triagem não conclui o marketplace.
- Falha legada já conhecida: policies de products aceitam escrita anônima. Precisa fechamento antes de abertura comercial. Alertas adicionais em docs/SHARED-PROJECT.md.
- Validar com npm test, npm run typecheck, npm run build e scripts/http-check.mjs. Nunca inserir dados fictícios na produção para apresentar métricas.
