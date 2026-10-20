# Logística Brasil Force

Objetivo: permitir ao comprador comparar entregas e ao vendedor operar pelo celular, sem depender de uma transportadora única. Decisões técnicas delegadas pelo usuário; implementação progressiva.

## Escolha

Melhor Envio primeiro: API de cotação, etiquetas e rastreio documentada para marketplaces. Correios direto depois, com contrato e credenciais próprios; construir integrações individuais agora aumenta manutenção. Não hospedar o Supabase por conta própria para economizar nesta etapa.

## Escopo executável desta entrega

Adaptador interno de cotação por produtos. Entrada por origem/vendedor, CEP destino, medidas em cm, peso kg, valores unitários em centavos. Apenas servidor obtém valores do catálogo antes de invocar o adaptador. Não expor endpoint que aceite preços ou peso do navegador. Sem catálogo completo/pedidos, não anunciar checkout operacional.

Uma chamada por vendedor/origem e credencial autorizada. Validar que itens pertençam ao vendedor. Comparar somente serviços habilitados pela operação; lista vazia bloqueia integração. Usar custom_price e custom_delivery_time, respeitando ajustes da conta. Serviço sem preço/prazo válido não é ofertado. Resposta vazia significa nenhuma opção disponível, nunca frete grátis. Timeout 10 segundos, sem redirecionamentos, sem cache de dados pessoais e sem retorno de token/corpo de erro externo. Sandbox explicitamente identificado; produção exige habilitação separada.

## Próximas entregas dependentes de pedidos

1. Origens privadas por loja, embalagens e atributos logísticos no catálogo; validação de produtos aceitos por transportadoras (venda livre não garante transporte permitido).
2. OAuth por vendedor, tokens cifrados no servidor, escopos mínimos e revogação. Conta central só após definir responsabilidade comercial e fiscal. Não pedir senhas no chat.
3. Checkout divide pedidos por vendedor; recota preço/estoque/frete no servidor e solicita aceite se total mudar. Prazo inclui preparação e transporte com calendário aplicável.
4. Após pagamento validado: compra/geração de etiqueta com chave idempotente e reconciliação de timeouts antes de repetir cobrança; falhas não geram nova etiqueta automaticamente.
5. Rastreamento: eventos autenticados conforme contrato do provedor, deduplicação, histórico e consulta periódica de reconciliação; notificações reais, devolução e logística reversa.
6. Painel mobile: pedidos a postar, etiqueta, ponto de postagem, prazo e ocorrências. Indicadores reais: custo de frete/pedido, atraso, abandono, falha de etiqueta. Futuro: recomendação por preço/prazo/desempenho medido, sem prometer entrega.

## Habilitação

Precisa de conta/app Melhor Envio, credencial sandbox, e-mail técnico, serviços aprovados e homologação; produção em etapa distinta. Nenhuma contratação ou cobrança nesta entrega. Correios direto exige contrato conforme documentação. Não foram configuradas credenciais nem criadas etiquetas.

## Fontes oficiais consultadas em 15/10/2026

- https://docs.melhorenvio.com.br/reference/calculo-de-fretes-por-produtos
- https://docs.melhorenvio.com.br/docs/introducao-a-integracao
- https://docs.melhorenvio.com.br/docs/sandbox
- https://www.correios.com.br/atendimento/developers/manuais/manual-api-preco-1

A documentação alerta que a compra de etiqueta comercial Azul Cargo não está disponível via API: não habilitar serviços só porque retornam cotação. Disponibilidade e aceitação devem ser homologadas por serviço.
