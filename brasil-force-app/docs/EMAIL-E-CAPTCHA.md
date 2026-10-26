# E-mails automáticos e captcha: como ativar em produção

O código já está pronto. A ativação depende de 4 configurações feitas por quem
administra as contas (Zoho, Cloudflare, Supabase e Vercel). Nenhuma senha ou
chave deve ser colocada no código ou enviada por chat: cole-as somente nos
painéis indicados.

## Fluxo MVP que fica automatizado

| Momento | O que acontece | Quem envia |
|---|---|---|
| Cadastro (cliente ou vendedor) | Captcha "não sou um robô" + e-mail de confirmação com link | Supabase Auth via SMTP Zoho |
| Clique no link de confirmação | Conta ativada; e-mail de boas-vindas (versão cliente ou vendedor); vendedor cai direto em **Como vender** | Site via SMTP Zoho |
| Solicitação de vendedor | Confirmação para o vendedor + alerta para contato@ | Site via SMTP Zoho |
| Esqueci a senha | Captcha + e-mail para criar nova senha | Supabase Auth via SMTP Zoho |
| Troca de e-mail | E-mail de confirmação no novo endereço | Supabase Auth via SMTP Zoho |
| Formulário de contato (Ajuda) | Captcha + mensagem para contato@ (responder = responder à pessoa) + confirmação automática para quem escreveu | Site via SMTP Zoho |
| Login | Captcha | Supabase Auth |

Todos os e-mails saem de **contato@brasilforce.com.br**.

## 1. Zoho Mail: senha de aplicativo

1. Entre em https://accounts.zoho.com com a conta de contato@brasilforce.com.br.
2. **Segurança → Senhas específicas de aplicativos → Gerar nova senha**. Nome: `Brasil Force site`.
3. Guarde a senha gerada; ela será usada nos passos 3 e 4.

Dados do servidor (contas Zoho no Brasil/EUA usam `smtp.zoho.com`; se o painel
da Zoho estiver em `zoho.eu` ou `zoho.in`, use `smtp.zoho.eu`/`smtp.zoho.in`):

- Host: `smtp.zoho.com`
- Porta: `465` (SSL)
- Usuário: `contato@brasilforce.com.br`

## 2. Cloudflare Turnstile (captcha gratuito)

1. Em https://dash.cloudflare.com → **Turnstile → Add widget**.
2. Nome `Brasil Force`; domínios `brasilforce.com.br` e `localhost`; modo **Managed**.
3. Copie a **Site Key** (pública) e a **Secret Key** (privada).

## 3. Supabase (painel do projeto de produção)

**Authentication → Emails → SMTP Settings → Enable custom SMTP**

- Sender email: `contato@brasilforce.com.br` · Sender name: `Brasil Force`
- Host `smtp.zoho.com` · Port `465` · Username `contato@brasilforce.com.br` · Password: a senha do passo 1

**Authentication → Emails → Templates** (cole o HTML de cada arquivo):

| Template | Assunto sugerido | Arquivo |
|---|---|---|
| Confirm signup | Confirme seu e-mail na Brasil Force | `email/confirm-signup.html` |
| Reset password | Redefinir sua senha na Brasil Force | `email/reset-password.html` |
| Change email address | Confirme seu novo e-mail na Brasil Force | `email/change-email.html` |

**Authentication → Sign In / Providers → Email**: manter **Confirm email** ligado.

**Authentication → URL Configuration**

- Site URL: `https://brasilforce.com.br`
- Redirect URLs: `https://brasilforce.com.br/**`

**Authentication → Attack Protection (Bot and Abuse Protection)**

- Enable Captcha protection → provider **Turnstile** → cole a **Secret Key** do passo 2.

**Authentication → Rate Limits**: com SMTP próprio, ajuste "emails sent per hour"
(sugestão inicial: 60).

## 4. Vercel (projeto `sou-barcos` → Settings → Environment Variables, Production)

| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Site Key do passo 2 |
| `TURNSTILE_SECRET_KEY` | Secret Key do passo 2 (formulário de contato) |
| `SMTP_HOST` | `smtp.zoho.com` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | `contato@brasilforce.com.br` |
| `SMTP_PASSWORD` | senha de aplicativo do passo 1 |
| `MAIL_FROM` | `Brasil Force <contato@brasilforce.com.br>` |
| `MAIL_TEAM_TO` | `contato@brasilforce.com.br` |
| `AUTH_REGISTRATION_ENABLED` | `true` (libera cadastro e recuperação) |

Depois de salvar, faça um novo deploy (ou **Redeploy**) e promova para produção.

## 5. Entregabilidade (evita cair no spam)

No DNS de brasilforce.com.br, confirme os registros que a Zoho mostra em
**Admin Console → Domínios → brasilforce.com.br → Configuração de e-mail**:
SPF (`include:zoho.com`), DKIM e um DMARC inicial
(`v=DMARC1; p=none; rua=mailto:contato@brasilforce.com.br`).

## Teste de aceitação

1. Abrir `/cadastro`, escolher **Quero vender**, resolver o captcha e enviar.
2. Receber o e-mail de confirmação de contato@ e clicar no botão.
3. Cair em **Como vender** e receber o e-mail de boas-vindas de vendedor.
4. Enviar a solicitação de vendedor: chega a confirmação ao vendedor e o alerta em contato@.
5. Em `/ajuda`, enviar uma mensagem: chega em contato@ e a pessoa recebe a confirmação.
6. Em `/recuperar-senha`, pedir o link e redefinir a senha.

Sem SMTP configurado, o site continua funcionando: os e-mails do site são
ignorados e registrados no log como `smtp-not-configured`, e o formulário de
contato orienta a escrever para contato@. Sem a Site Key, o captcha não aparece.
