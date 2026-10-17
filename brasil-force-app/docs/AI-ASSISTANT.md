# Assistente Brasil Force — implementação inicial

## Componentes
- `/assistente`: formulário conversacional.
- `/api/assistente`: API autenticada, com e-mail confirmado, validação de pergunta e limite de tamanho.
- `src/lib/assistant.ts`: regras de comportamento e transformação dos resultados.
- Consulta exclusivamente `bf_listings` com `status=approved`, `classification=free`, `stock>0`. RLS do Supabase permanece ativa.

## Configuração pendente
- `AI_GATEWAY_API_KEY` no ambiente servidor, nunca no cliente.
- `BF_AI_MODEL` com ID de modelo válido e atualmente suportado pelo gateway, validado contra a lista ao configurar.
- O sistema retorna somente resultados do catálogo quando não há configuração de IA.
- Não fazer deploy de produção sem homologar login, orçamento, limites de uso e proteção contra abuso.

## Limitações
- A consulta usa correspondência literal do título, não pesquisa semântica. Perguntas longas podem retornar zero produtos.
- A resposta gerada é orientativa, não autoriza compras ou produtos regulados.
- Falta rate limiting distribuído, controle de gastos e testes de integração/segurança.
- Não foi executado build nem chamada real ao provedor nesta entrega.
- Respostas do modelo não substituem validação de estoque, conformidade ou preço no backend.
- Endpoint e UI precisam de revisão de privacidade e política de retenção antes de abertura pública.
