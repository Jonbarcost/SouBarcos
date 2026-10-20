# Cotação logística — plano de implementação

**Goal:** adaptador de cotação utilizável pelo servidor, bloqueado sem configuração real.
**Architecture:** interface de cotação por vendedor; adaptador Melhor Envio e factory exclusiva do servidor. Sem endpoint público nesta etapa.
**Tech Stack:** TypeScript, Zod, fetch nativo, node:test.
**Spec:** ../specs/2026-10-15-logistics.md

## Restrições

Sem novas dependências, dados fictícios apenas em testes. Sem mutações no SouBarcos. Sem compra de etiqueta. Não aceitar preço do navegador.

## Revisão

Testar conta sem configuração, mistura de vendedores, erro parcial de serviço, customização monetária e falha/timeout externo. Ambiente inválido deve falhar fechado.

## Tarefa única: adaptador testável

- [x] Criar tests/shipping.test.ts, cobrindo configuração, formato, rejeição de entradas, falha externa e normalização.
- [x] Executar teste e observar ausência da implementação.
- [x] Criar src/lib/shipping/melhor-envio.ts: createShippingProvider(config, fetcher) retorna quote(input). Config contém ambiente, token, contato, serviços e habilitação de produção. Input contém vendedor, CEPs e itens vinculados.
- [x] Criar src/lib/shipping/server.ts: getShippingProvider lê somente variáveis privadas e importa server-only.
- [x] Documentar configuração em .env.example e docs/LOGISTICS.md.
- [x] Executar npm test e npm run typecheck; registrar limites de homologação.
- [x] Commit e atualizar pacote persistido.

Resultado: 26 testes aprovados e TypeScript sem erros. Cotação real não executada: credenciais ausentes. Não houve contratação, emissão de etiqueta ou mudança no banco compartilhado.
