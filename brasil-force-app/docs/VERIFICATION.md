# Atualização da conexão ao SouBarcos

Em 15/10/2026, migração compartilhada aplicada e validada no projeto real. 19/19 testes locais e build aprovados. As evidências atuais estão em SHARED-PROJECT.md; os resultados abaixo são o registro histórico da primeira entrega, antes da autorização para reutilizar SouBarcos.

# Verificação — 15/10/2026

## Resultados comprovados

| Verificação                           | Resultado                        | Limite                                                                                                   |
| ------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `npm run typecheck`                   | Aprovado                         | Tipagem estática                                                                                         |
| `npm test`                            | 15/15 aprovados                  | PostgreSQL em PGlite com fixtures mínimas de Auth/Storage; não Supabase remoto                           |
| `npm run build`                       | Aprovado                         | Build Next.js 16.4.1, rotas dinâmicas para CSP com nonce                                                 |
| `node scripts/http-check.mjs`         | Aprovado                         | Nove páginas públicas; três rotas protegidas; CSP/nonce; login desabilitado e OAuth 404 sem configuração |
| `npm audit --omit=dev --json`         | Zero vulnerabilidades reportadas | Snapshot de dependências; não substitui auditoria de segurança                                           |
| Cadastro, e-mail e TOTP ponta a ponta | Não executado                    | Falta projeto Supabase dedicado e SMTP                                                                   |
| Revisão visual desktop/mobile         | Não executada                    | Download Chromium retornou arquivo inválido; não há browser local disponível                             |
| Publicação Vercel                     | Bloqueada                        | Criação do projeto recusada com HTTP 403 na equipe VERS; CLI autenticada alternativa indisponível        |

Testes SQL cobrem: metadata de cadastro sem autoelevação, anúncios aprovados vs. pendentes, privacidade de perfil, grants por coluna, solicitação de vendedor sem autoaprovação, AAL2 administrativo, documentos privados, classificação controlada sem aprovação, edição relevante reenviada, suspensão de vendedor, sessão revogada, RLS em todas as tabelas e ausência de funções definer públicas. Testes adicionais cobrem redirect e validação.

Durante a verificação HTTP, o Next.js precisou de hostname explícito devido à restrição de enumeração de interfaces de rede do ambiente. O script já usa `127.0.0.1`. Em contextos de streaming, o redirect autenticado pode ser um meta redirect com HTTP 200, comportamento documentado do Next.js; o teste verifica a meta tag e ausência do conteúdo privado, além do caminho HTTP 307.

Não há evidência de funcionamento de pagamento, compra, logística ou moderação de decisão: esses módulos não foram implementados nesta fundação. Os documentos de aceite não os marcam como concluídos.

## Infraestrutura encontrada

- Diretório inicial sem repositório; nenhum repositório Brasil Force retornado pela busca de instalações GitHub.
- Nenhum Supabase Brasil Force entre os quatro projetos conectados. Os projetos existentes não foram alterados.
- Organização Supabase encontrada: Jonbarcost's Org. A ferramenta exige escolha explícita da organização antes de consultar o custo de criação; essa confirmação está pendente.
- Equipe Vercel VERS (vers2), sem projeto Brasil Force. Tentativa de criação recusada por permissão, nenhum deployment realizado.

## Fontes técnicas consultadas

- https://supabase.com/docs/guides/auth/server-side/creating-a-client
- https://supabase.com/docs/guides/auth/auth-mfa
- https://supabase.com/docs/guides/auth/auth-mfa/totp
- https://supabase.com/changelog.md (incluindo aviso de mudança de cifras TLS)
- Documentação do Next.js instalada com a versão do projeto: CSP, Server Actions e redirects em streaming.
- https://vercel.com/docs/rest-api/deployments/create-a-new-deployment
