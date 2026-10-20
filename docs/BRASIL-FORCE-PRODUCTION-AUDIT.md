# Brasil Force — verificação de origem e plano de integração segura
Data: 2026-10-16

## Resultados observados
- Repositório canônico solicitado: `Jonbarcost/SouBarcos`, branch `main` (única branch retornada).
- Conteúdo de `main`: aplicação legada Express (`server.js`), páginas HTML estáticas, `package.json` com `express`, sem `next`.
- Projeto Vercel `sou-barcos`: framework `nextjs`, deployment de produção READY `dpl_DiLWqCWzXBLfL3d59QpVG3g9oJpZ`.
- A consulta de metadados do deployment não retornou `gitSource`, `meta` veio vazio. Portanto, **não está demonstrado que o deployment publicado tenha sido criado a partir da main deste repositório**.
- Variáveis Vercel identificadas: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SITE_URL`, configurações de autenticação e frete. Não foram identificadas `AI_GATEWAY_API_KEY` ou `BF_AI_MODEL`.
- Supabase utilizado: `rrymtjzsekmjplyuoqef`, com tabelas `bf_*` e RLS.
- Desenvolvimento experimental do assistente Next.js está em `Jonbarcost/Brasil-Force`, branch `codex/national-catalog-phase-a`, PR #2. **Não copiar rotas Next.js para a aplicação Express sem integrar a árvore de origem correta.**

## Bloqueios reais
1. Identificar a árvore fonte do deployment READY, por metadados de build, artefatos e configuração de integração Vercel. A main atual do GitHub não corresponde ao framework publicado.
2. Garantir build e testes em ambiente de preview com fonte verificada.
3. Integrar gateway de IA apenas no backend, com autenticação, rate limit distribuído, limites de custo e monitoramento.
4. Habilitar o assistente por flag após validação. Não colocar credenciais no navegador.
5. Não promover deploy para produção sem conferir rotas, autenticação e dados reais.

## Preservação
Este commit contém apenas documentação. Não altera API, tabelas, migrações, domínio, RLS, produtos, credenciais ou produção.

## Próxima implementação
Recuperar o código Next.js efetivamente publicado; criar branch a partir desse código no repositório canônico; portar seletivamente o assistente; validar `npm ci`, typecheck, testes, build e smoke test; publicar em preview e promover somente quando aprovado pelos testes.
