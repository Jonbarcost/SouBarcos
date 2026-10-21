# Assistente conversacional Brasil Force

## Objetivo
Atender compradores e vendedores com respostas elaboradas, perguntas de esclarecimento e continuidade entre mensagens. Evolui a caixa existente sem alterar autenticação, banco, quotas, aprovação ou pagamentos.

## Fluxo
- O cliente mantém a conversa somente em memória e envia as últimas três trocas concluídas (até seis mensagens, 1.200 caracteres por mensagem).
- A API valida corpo, origem, sessão verificada, conta ativa e quota antes de consultar catálogo ou modelo. O corpo é limitado a 32 KiB; o texto atual continua limitado a 500 caracteres.
- O catálogo usa somente a visão pública existente. Consultas incluem termos de até duas perguntas anteriores para apoiar referências na conversa; resultados são deduplicados e limitados a oito.
- O modelo recebe as regras públicas, catálogo e histórico marcado como dado não confiável. Produz resposta textual, categoria de orientação e IDs de produtos.
- IDs são validados contra a consulta real. Links vêm de uma lista do servidor; valores e estoque são renderizados a partir dos dados do catálogo. Texto é exibido como texto React, sem HTML ou Markdown interpretado.
- O validador bloqueia formatos comuns de URLs, preços e afirmações de aprovação/pagamento. É uma defesa adicional, não prova de ausência de alucinações; a avaliação humana de respostas reais continua necessária.
- Na indisponibilidade do modelo, perguntas comuns podem receber orientação básica com aviso explícito. Não se apresenta texto fixo como resposta gerada.

## Experiência
Balões distintos, sugestões iniciais, respostas em parágrafos, links úteis, campo multilinha, Enter para enviar / Shift+Enter para nova linha, nova conversa e reutilização de pergunta após erro. A conversa não persiste entre páginas. Credenciais e documentos não devem ser enviados.

## Verificação
Testes de regressão cobrem histórico, mensagens de saudação, catálogo vazio, limites de entrada, papel system proibido, IDs inventados, saída inesperada, orientação básica e erros sem vazamento. O teste do provedor usa uma implementação substituta de fetch; não comprova disponibilidade, cobrança ou qualidade do modelo real.

Roteiro de aceitação autenticada:
1. Dizer oi e perguntar como vender; verificar resposta própria e link de habilitação.
2. Pedir mochila para três dias; responder uma pergunta de esclarecimento com uma frase curta. Verificar continuidade sem repetição da saudação.
3. Perguntar sobre fornecedor; verificar que não inventa telefone nem diz que enviou mensagem.
4. Pedir confirmação de pagamento; verificar que explica a indisponibilidade das compras.
5. Reiniciar conversa e verificar que o contexto anterior foi descartado.

Referência de configuração: https://vercel.com/docs/ai-gateway/models-and-providers/reasoning
O Qwen3-14B usa reasoning_effort=none para reservar o limite de saída para resposta de atendimento; outros modelos mantêm sua configuração padrão.
