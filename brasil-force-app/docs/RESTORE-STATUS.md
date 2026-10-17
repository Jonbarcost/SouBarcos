# Brasil Force — recuperação e homologação

Data de referência: 2026-10-16.

## Recuperação realizada
- O aplicativo Next.js foi recuperado em `brasil-force-app/` a partir da branch `codex/national-catalog-phase-a` do repositório auxiliar.
- 100/103 arquivos da árvore original recuperados com hash Git idêntico antes das últimas correções.
- Os três itens que não foram copiados literalmente são `.gitattributes`, workflow original e `public/hero.webp`. O workflow isolado foi criado em `.github/workflows/brasil-force-verify.yml`; o banner utiliza um gradiente até a arte original ser recuperada.
- O legado Express/SouBarcos permanece intacto no diretório raiz.

## Verificações executadas
- GitHub Actions na branch: `npm ci`, `npm run check`, `npm run test:http` concluíram com sucesso no commit 380bf3207ed0f9cdcdf1252bf15264e4ec18889d.
- Deployment de homologação Vercel: `dpl_9PQd1W3Zgi9QkLQMNax58oeVuUvU`, READY, com `projectSettings.rootDirectory=brasil-force-app`; **não é produção**.
- Supabase existente: migração `brasil_force_ai_usage_limits` aplicada, com limites de 5/minuto e 60/dia por identidade autenticada. A função pública de quota possui EXECUTE para authenticated e não para anon.
- Segurança: consultas do assistente só usam anúncios `approved`, `free` e estoque positivo e respeitam RLS. Os valores reais são consultados no banco; nunca são fabricados.
- Nenhum anúncio, fornecedor, saldo ou pedido de produção foi criado por esta recuperação.

## Pendências que impedem abertura da IA
1. O recurso permanece bloqueado enquanto `BF_AI_ENABLED` não for explicitamente `true`.
2. Escolher modelo atual e configurar `BF_AI_MODEL`; a autenticação ao gateway usa `AI_GATEWAY_API_KEY` ou `VERCEL_OIDC_TOKEN` no backend.
3. Verificar o orçamento/permissões do AI Gateway antes de gastar créditos. Não foram executadas chamadas pagas ou expostos tokens.
4. Testar autenticação real, cotas, comportamento em cargas simultâneas, limites do provedor e mensagens maliciosas em ambiente de homologação.
5. Não publicar automaticamente em `brasilforce.com.br`: release depende dos testes de ponta a ponta e verificação do domínio.
6. Reincorporar a imagem hero.webp original por meio legítimo de transferência binária. Nenhuma imagem fictícia foi inserida.

## Observação operacional
O projeto Vercel existente recebe builds automáticos do monorepo sem `rootDirectory` e esses builds podem falhar. Um deploy de homologação com `rootDirectory=brasil-force-app` foi compilado com sucesso. Alterar a configuração global antes de migrar a branch produtiva pode quebrar futuras entregas do legado.
