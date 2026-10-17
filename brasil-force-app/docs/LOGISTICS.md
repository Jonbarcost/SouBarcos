# Logística: estado real da integração

Implementado: adaptador interno `src/lib/shipping/melhor-envio.ts` para cotação por produtos pela API Melhor Envio. Factory `server.ts` protege a leitura de credenciais com `server-only`. Sem endpoint público, checkout, compra de etiquetas ou rastreamento ativos nesta entrega.

## Configuração e homologação

1. Criar conta/aplicativo no ambiente sandbox do Melhor Envio e obter credencial apropriada. Não enviar token em chat nem versioná-lo.
2. Preencher MELHOR_ENVIO_TOKEN e SHIPPING_TECHNICAL_EMAIL no ambiente seguro do servidor. Definir MELHOR_ENVIO_SERVICE_IDS apenas com serviços homologados; manter MELHOR_ENVIO_ENVIRONMENT=sandbox e SHIPPING_PRODUCTION_ENABLED=false. Habilitar SHIPPING_ENABLED para testes controlados.
3. Invocar getShippingProvider().quote com itens reais de um vendedor/origem, carregados do banco no servidor; unitValueCents é unitário, medidas cm e peso kg. O frontend poderá fornecer somente IDs, quantidades e destino após implementação do endpoint autenticado e limitado por taxa. Não foi exposto endpoint para evitar entrada de preço/peso manipuláveis.
4. Homologar Correios e outras transportadoras disponíveis na conta para a rota e mercadoria. O retorno inclui environment=sandbox; jamais apresentar simulação como frete contratado. custom_price respeita ajustes da conta; custom_delivery_time é trânsito, sem prazo de preparação do vendedor.
5. Antes de produção: implementar pedidos, autorização por vendedor, limite de requisições, dados logísticos verificados, responsabilidades fiscais e consentimento/privacidade. Trocar para token de produção, environment=production e SHIPPING_PRODUCTION_ENABLED=true somente após homologação. Cotação não reserva preço nem compra etiqueta.

Nenhum serviço fica habilitado por padrão. Alguns serviços podem cotar sem suportar etiqueta comercial pela API; a lista deve considerar o fluxo inteiro. Não basta o produto ser de venda livre: conferir aceitação da transportadora.

## Estratégia de negócio

Primeiro operar vendedores convidados, catálogo de venda livre e entregas homologadas. Consolidar pedidos e reputação antes de expandir. Cobrança, comissão e etiquetas precisam de rastreabilidade e conciliação. Em seguida, automatizar mensagens de rastreio, alertas de atraso e reposição. IA pode sugerir opções usando dados reais; preço e promessa de entrega vêm do provedor e regras verificadas.

Rotas futuras: frete por vendedor/origem; conta conectada por OAuth; compra idempotente de etiquetas após pagamento validado; rastreio e devolução. Consulte `superpowers/specs/2026-10-15-logistics.md` para a sequência. Não existe prazo/custo de entrega fixo no código.

## Verificação

Testes usam transporte HTTP substituído exclusivamente no ambiente de teste. Cobrem conversão monetária, customizações, mistura de vendedores, configuração, indisponibilidade e proteção contra vazamento de erro. Não substituem teste integrado com credenciais reais. Nenhum envio foi comprado ou criado.
