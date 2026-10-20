# Brasil Force

Fundação de um marketplace brasileiro para artigos de venda livre, outdoor e colecionismo.

**Estado: fundação conectada ao projeto SouBarcos; não liberado para operação comercial.** Não há dados de produtos, vendas, reputação ou compradores inventados. O catálogo vazio é intencional. O banner é uma imagem editorial gerada por IA, não fotografia de um produto à venda.

## Executar

Requer Node.js 24 e npm. Na pasta do projeto:

```sh
npm ci
cp .env.example .env.local
npm run dev
```

No Windows, copie `.env.example` para `.env.local` pelo Explorador. Sem configuração do Supabase, o site abre com cadastro/login desabilitados e avisos claros. Não invente valores para as variáveis.

```sh
npm run typecheck
npm test
npm run build
node scripts/http-check.mjs
```

O teste HTTP verifica as páginas com novos cadastros desabilitados. Ele inicia o build na porta 3100 e verifica páginas, CSP, redirecionamentos e bloqueios de configuração. Os testes de banco usam PostgreSQL via PGlite com schemas de Auth/Storage mínimos, somente em memória. Não substituem testes contra Supabase Auth, Storage HTTP, SMTP e navegador reais.

## Já implementado

- Next.js App Router, TypeScript estrito, React, Tailwind e primitiva de botão no padrão shadcn (CVA).
- Identidade visual, monograma vetorial original, homepage, catálogo com busca por título/categoria e estado vazio verdadeiro.
- Integração Supabase SSR: cadastro, senha, confirmação por callback PKCE, recuperação, troca de senha, login e saída.
- Google/Apple aparecem somente quando habilitados por configuração; dependem do provedor OAuth configurado no Supabase.
- Perfil privado com vínculo opcional autodeclarado. Verificação institucional em tabela separada, sem escrita pelo usuário.
- Inscrição e confirmação de segundo fator TOTP. Exigência de AAL2 no servidor e no banco para administração.
- Encerramento global de sessões; RLS confere existência da sessão em `auth.sessions` nas leituras/escritas privadas.
- Solicitação inicial de vendedor PF/PJ e triagem administrativa com motivo, histórico privado, MFA e controle de revisão. Aprovação documental ainda não liberada.
- Painel do vendedor habilitado, rascunhos, edição, pausa e envio de anúncios para análise, com atributos de embalagem e validação no servidor e banco.
- Migração versionada com RLS, grants por coluna, auditoria de contas/solicitações/anúncios, classificações de produto e reenvio para moderação após edição relevante.
- Bucket de documentos privado, com upload deliberadamente bloqueado até existir triagem e fluxo documental.
- CSP com nonce por requisição, renderização dinâmica, respostas privadas sem cache, validação de entradas e proteção contra redirect externo.
- Minutas institucionais explicitamente identificadas como pré-abertura.

## Ambiente real — SouBarcos

Por autorização do proprietário, a fundação foi aplicada ao projeto `rrymtjzsekmjplyuoqef` (SouBarcos). API: `https://rrymtjzsekmjplyuoqef.supabase.co`. Não foi criado projeto pago nem alterado o plano. O uso da Brasil Force compartilha os limites do projeto existente.

- As tabelas da Brasil Force usam prefixo `bf_`; helpers estão em `brasil_force_private` e documentos em `bf-seller-documents`.
- Não foi instalado trigger em `auth.users`, nem copiados usuários/produtos preexistentes. Cada usuário precisa aderir via `/participar`, que chama `bf_join` com sessão válida, e-mail confirmado e termos.
- Auth, SMTP, OAuth, MFA e quotas são compartilhados. Cookies usam `bf-auth` para evitar colisão no navegador, mas isso não cria um segundo serviço de identidade. Troca de senha e saída global afetam a mesma conta nas outras aplicações.
- Credenciais publicáveis foram configuradas em `.env.local`, que não entra no ZIP/Git. O pacote traz `.env.example` para configuração em outra máquina; obtenha a chave publicável no painel do projeto. Nenhuma chave privilegiada é necessária.
- `AUTH_REGISTRATION_ENABLED=false`: novos cadastros e recuperação pela interface ficam fechados até configuração da URL de publicação/callbacks e homologação de e-mail. O cadastro global do SouBarcos não foi desativado.
- Antes de habilitar cadastro: configurar `SITE_URL` HTTPS, adicionar o callback sem remover os URLs existentes, validar SMTP e MFA e testar autenticação ponta a ponta. Não modificar remetente ou providers globais sem avaliar os outros sistemas.
- A migração aplicada é `supabase/migrations/20261015211311_brasil_force_shared_foundation.sql`. Não reaplicá-la. A migração original está arquivada em `supabase/legacy-not-for-shared/` e **não deve ser executada nesse projeto**.

**Legado aposentado:** a migração `retire_legacy_product_writes` fecha INSERT/DELETE públicos e revoga escrita comum em `public.products`, preservando os registros e leitura. O proprietário autorizou substituir o SouBarcos. Ver configuração, CI e pendências operacionais em [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md).

O teste HTTP pode executar com o Supabase configurado, mas depende de acesso à rede. O teste de banco usa PGlite. Ambos são complementados por verificações reais da Data API descritas em `docs/SHARED-PROJECT.md`.

## Limitações da fase 1

O banco está aplicado e a Data API foi testada. Cadastro/login são integrações implementadas, mas ainda não homologadas ponta a ponta. E-mail, MFA ponta a ponta, recuperação em outro dispositivo, sessões/dispositivos individuais e histórico de acessos ainda precisam de homologação/implementação complementar. Não há KYC, coleta de CPF/CNPJ/endereço, aprovação final de vendedores/anúncios, compra, pagamento, frete operacional, chat, IA ou painel financeiro.

A fase 1 não deve ser declarada aceita antes de testes reais completos de autenticação e publicação. O restante do marketplace está descrito no plano; não foi artificialmente preenchido com tabelas vazias ou botões sem ação.

Arquitetura: `docs/ARCHITECTURE.md`. Plano: `docs/PLAN.md`. Resultado da verificação: `docs/VERIFICATION.md`.

## Logística preparada

Adaptador interno de cotação Melhor Envio implementado, ainda desativado e sem homologação real. Configuração e próximos passos em [docs/LOGISTICS.md](docs/LOGISTICS.md). Suíte atual: 41 testes aprovados. Etiquetas, rastreamento e checkout dependem das próximas etapas.

Anúncios e painel: [docs/LISTINGS.md](docs/LISTINGS.md). Triagem de vendedores: [docs/SELLER-REVIEW.md](docs/SELLER-REVIEW.md).
