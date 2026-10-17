# Anúncios e moderação

## Implementado

Vendedor aprovado cria/edita rascunhos via bf_save_listing e envia/pausa via bf_transition_listing; não existe escrita paralela pelo navegador. Preço em centavos, estoque inteiro, embalagem e prazo de postagem passam pela validação existente. Edição de anúncio aprovado retira publicação e exige revisão. A nova implementação preserva controlled/prohibited durante correções; o vendedor não apaga a classificação de risco.

/admin/anuncios oferece fila paginada por situação. /admin/anuncios/[id] mostra atributos, vendedor, classificação e histórico paginado. bf_review_listing exige equipe AAL2, não aceita decisão contra anúncio próprio, trava UUID/linha e confere revisão esperada. Sem INSERT/UPDATE direto para authenticated.

Transições administrativas:

- pending → in_review / changes_requested / rejected.
- in_review → approved / changes_requested / rejected.
- approved → removed.

Aprovação comum exige classificação free conferida por humano, vendedor ativo e aprovado, categoria ativa distinta de serviços, estoque positivo e embalagem. controlled/prohibited não podem ser convertidos para free por esta RPC. Não há aprovação automática regulatória nem fluxo especial para comercializar itens controlados.

bf_listing_review_events registra ator, estados, classificação, justificativa e revisão na transação. bf_listing_review_notes separa nota interna, legível apenas pela equipe AAL2. Vendedor vê retorno e histórico recente; não recebe notas internas nem histórico privado de terceiros. Rejeitado não é editável/reaberto por este fluxo.

## Catálogo público

A política RLS e bf_public_listings exigem approved/free, vendedor ativo e aprovado, estoque positivo, categoria ativa e embalagem. A view security_invoker repete os filtros para que donos/equipe não publiquem linhas privadas por terem acesso mais amplo à tabela base. Só projeta campos comerciais públicos, sem identidade privada do vendedor.

/catalogo/[id] usa essa projeção, valida UUID e mostra notFound para item indisponível. UI/assistente vinculam somente detalhes reais. O Next.js pode transmitir HTTP 200 com marcador de 404 quando a página já iniciou streaming; smoke verifica o conteúdo de não encontrado e ausência de dados comerciais.

## Testado e pendente

PGlite cobre revisão, autoaprovação, MFA, conflitos, correções, rejeição terminal, notas privadas, restrições persistentes e retirada do catálogo após suspensão/desaprovação/estoque zero. Tipos/build e smoke HTTP também executados; veja TESTING.md.

Migração já aplicada remotamente por operação anterior como 20261017030041, conforme e91a236; não reaplicar o arquivo local. Nenhum anúncio real foi criado/aprovado nesta execução. Fotografias, comprovação de procedência, carrinho, estoque reservado, pedido, pagamento, split, webhook, etiquetas e rastreio não estão implementados. Compras continuam indisponíveis.

## Operação Primeiro Vendedor

Jornada automatizada no Chromium desktop e 390×844: rascunho com título/descrição/categoria/preço/estoque/embalagem/prazo, envio, análise por moderador AAL2, aprovação free e detalhe público anônimo. Integração real local também cobre correção/reenvio, remoção, classe restrita, notas privadas e disputa de revisão. O catálogo recebe exclusivamente produtos TESTE — NÃO COMERCIALIZÁVEL no banco Docker isolado. Sem fotografia no teste: upload de imagens continua uma lacuna comercial. Ver [FIRST-SELLER-OPERATION.md](FIRST-SELLER-OPERATION.md).
