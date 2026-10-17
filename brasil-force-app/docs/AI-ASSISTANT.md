# Assistente de catálogo — estado atual

## Implementado

/api/assistente aceita POST (outros métodos recebem 405 pelo Next.js). O recurso exige BF_AI_ENABLED=true, Supabase configurado, usuário com e-mail confirmado, conta BF ativa e RPC bf_ai_consume_quota bem-sucedida. A RPC confere sessão ativa e serializa a quota por usuário com advisory lock. Limites existentes: 5/minuto e 60/dia; falha da RPC retorna 503, quota negada 429 com Retry-After.

O serviço limita o corpo recebido a 4.096 bytes independentemente de Content-Length, exige JSON e pergunta de 3–500 caracteres. Compara a origem completa com a origem da requisição e rejeita requisições cross-site/same-site. Origem ausente é permitida para clientes não browser autenticados; isso não contorna sessão/quota.

Busca literal por termo relevante na projeção bf_public_listings, com estoque positivo e no máximo oito resultados. Sem resultado não chama o provedor. Sem configuração do gateway retorna apenas catálogo real, identificado como mode=catalog.

O gateway usa HTTPS fixo, sem redirecionamentos, timeout de 12 segundos e resposta limitada a 16 KiB. Prefere VERCEL_OIDC_TOKEN do runtime, depois AI_GATEWAY_API_KEY. Modelo configurável BF_AI_MODEL; nenhum ID descontinuado ou modelo padrão é embutido. O modelo deve suportar chat completions com response_format=json_object.

O modelo seleciona somente product_ids do contexto e guidance entre compare/refine/human_review. O backend rejeita IDs desconhecidos, repetidos, propriedades extras e orientações livres. Não renderiza prosa arbitrária do provedor: preço, estoque, título e link vêm do catálogo; mensagens de orientação são predefinidas. Essa restrição privilegia fatos verificáveis sobre uma conversa generativa aberta. Histórico de até 20 interações permanece apenas na memória da página; não é armazenado nem enviado ao modelo em chamadas futuras.

Logs contêm somente evento, status, resultado enumerado e duração. Sem pergunta, resposta, usuário, título ou credencial. UI oferece sugestões, estado de espera, histórico, erros e links para detalhes reais. Não há cartões fictícios.

## Testado

Testes locais de serviço/gateway com transportes controlados e quota SQL real em PGlite. Verificam origem, tamanho real, autenticação negada, erro de quota, limite por identidade, cap diário, revogação, suspensão, envelope inválido, token OIDC preferido, erros upstream e IDs/prosa inventados. Testes browser exercitam estado desativado real, não uma resposta simulada do modelo.

## Pendente / bloqueado

Nenhuma chamada real ao modelo foi executada. Token, modelo suportado e orçamento não foram validados; lista/documentação retornaram 403. Concorrência entre conexões/instâncias reais não foi executada: Promise.all em PGlite não prova isolamento multi-instância. Limites de orçamento global, retenção/limpeza de quotas e controles contra criação abusiva de contas precisam de homologação operacional antes da abertura. A busca por título é limitada e não verifica atributos ausentes (impermeabilidade etc.). Não afirmar compatibilidade ou certificação a partir da pergunta.

Manter BF_AI_ENABLED=false até configurar e homologar acesso e gastos. Não habilitar faturamento ou copiar OIDC para arquivos. Revise TESTING.md e OPERATIONS.md antes da ativação.
