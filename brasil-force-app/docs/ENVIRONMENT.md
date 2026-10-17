# Ambiente Brasil Force

## Estado em 16/10/2026

Produção: https://sou-barcos.vercel.app, projeto Vercel `prj_zhDl1iJuhJHAeB4FRNE09EG0B2FF`, equipe `team_ljGPS1QogR1kyxfTrsroQuZQ`. Deploy da aplicação: `dpl_DiLWqCWzXBLfL3d59QpVG3g9oJpZ`, READY. Supabase reutilizado: `rrymtjzsekmjplyuoqef`.

Código revisado: branch `codex/foundation-seller-listings`, PR #1 no repositório Jonbarcost/Brasil-Force. A main ainda precisa receber o PR. Os deploys foram enviados pela API; conexão automática Vercel/GitHub e regras obrigatórias de merge não estão confirmadas. Não enviar código antigo do SouBarcos para produção.

## Desenvolvimento e CI

Node fixado em `.nvmrc`. Instalação: `npm ci`. Copiar `.env.example` para `.env.local` e configurar valores pelo painel do provedor, sem enviar segredos por chat ou Git.

```
npm run env:check -- --file=.env.local
npm run check
npm run test:http
```

Em um ambiente publicado, executar `npm run env:check -- --deployment` com variáveis já injetadas pelo provedor. O script não imprime valores e rejeita URLs inseguras, chaves privilegiadas no frontend e frete habilitado sem configuração. Ele não testa credenciais no provedor nem substitui homologação.

`.github/workflows/verify.yml` executa instalação, TypeScript, testes SQL em memória, build e smoke HTTP em push/PR. Permissão somente leitura e sem credenciais de produção. Actions fixadas por SHA. Não usa pull_request_target, não aplica migrações, não publica produção e não cria contas reais.

## Separação dos ambientes

| Ambiente | Dados e acessos |
| --- | --- |
| CI | PostgreSQL em memória e fixtures locais. Sem conexão Supabase nem segredos. |
| Desenvolvimento atual | Supabase SouBarcos quando .env.local está configurado. Não inserir fixtures remotas. |
| Preview Vercel atual | Não é um banco isolado: variáveis podem apontar ao mesmo Supabase. Tratar como produção. |
| Homologação completa | Pendente banco/stack Supabase isolado e contas de teste. Pode ser local com Docker; não executar supabase db reset --linked. |
| Produção | Dados reais, cadastro público e integrações comerciais desabilitados até validação. |

## Domínio e e-mail

O domínio `brasilforce.com` não foi registrado nem conectado. Após registro pelo proprietário:

1. Adicionar domínio raiz e www ao projeto Vercel; usar os registros DNS exibidos pelo provedor, sem adivinhar IP.
2. Escolher uma origem principal HTTPS e redirecionar a outra.
3. Atualizar SITE_URL em produção e revisar a lista de redirecionamentos do Supabase (`/auth/callback`). Usar URLs exatas; avaliar antes de remover callbacks anteriores do projeto compartilhado.
4. Configurar remetente de e-mail transacional e SPF/DKIM/DMARC conforme o provedor. Caixa postal e serviço de envio transacional são configurações distintas.
5. Homologar cadastro, confirmação, recuperação, expiração/reuso de link e MFA. Só então habilitar AUTH_REGISTRATION_ENABLED.

Não criar conta administrativa por correspondência de nome, e-mail de usuário antigo ou metadata. O proprietário deve identificar a conta real; atribuição de role deve ser auditada e acesso administrativo exige AAL2.

## Credenciais pendentes

- SMTP/e-mail transacional no Supabase (credenciais no painel, não NEXT_PUBLIC).
- Melhor Envio: conta e token sandbox, e-mail técnico e serviços permitidos; testar cotação com embalagem real antes de habilitar. Fluxo multi-vendedor/OAuth, etiquetas e rastreio ainda não implementados.
- Gateway compatível com marketplace: conta, credenciais sandbox, split e webhooks assinados. Não há checkout implementado; não existe flag que transforme esta fundação em comércio pronto.
- Monitoramento de erros: provedor e retenção a definir. Logs devem omitir documentos, tokens e dados de pagamento.

## Publicação e recuperação

Antes de cada versão: branch revisada, checks aprovados, migração testada em banco isolado e compatível com o código anterior. Aplicar migração uma vez, conferir grants/RLS, publicar build e verificar /api/health, páginas públicas e redirecionamentos privados. READY não comprova funcionamento de pagamento ou Auth.

Recuperação do app: manter o ID da versão anterior testada e restaurar a publicação por rollback da Vercel. Rollback do app não desfaz migrações de banco; priorizar migrações aditivas e correção posterior. Não aplicar SQL de reversão que apague dados.

Backups: ainda falta confirmar retenção disponível no plano, definir exportação criptografada para armazenamento privado e executar restauração em ambiente separado. Nenhum backup completo foi criado por esta entrega. Não exportar auth.users/documentos para Git ou artefatos públicos de CI.

Monitoramento: health atual comprova resposta da aplicação e presença de configuração, não conectividade de banco/pagamento. Alerta externo de indisponibilidade e teste periódico de restauração ainda precisam ser configurados; não há automação silenciosa em execução.

## Segurança do legado

O proprietário autorizou aposentar o SouBarcos. A migração `retire_legacy_product_writes` remove as políticas públicas de INSERT/DELETE de products e revoga escrita dos papéis public/anon/authenticated, sem apagar registros nem alterar leitura. A manutenção privilegiada permanece possível. Não reativar as políticas permissivas para recuperar o app antigo.

Ainda pendente: proteção contra senhas vazadas desabilitada no Supabase; messages legado com RLS sem política mantém acesso comum bloqueado. Revisar o legado remanescente antes da abertura comercial.

Verificação desta entrega: 41 testes locais aprovados, TypeScript, build e smoke HTTP. Migração aplicada; contagem remota manteve 1.768 produtos e INSERT/DELETE efetivos negados para anon/authenticated. A execução do workflow no GitHub deve ser confirmada separadamente.
