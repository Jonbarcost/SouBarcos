# Resposta automática de cadastro — Brasil Force

## Implementação proposta
- O cadastro existente chama `db.auth.signUp()` em `src/app/auth/actions.ts` e inclui `emailRedirectTo: siteUrl() + "/auth/callback"`.
- **Canal correto:** editar o template **Confirm sign up** do Supabase Auth. Isso envia **um único e-mail** que combina confirmação de endereço com instruções. Não adicionar envio paralelo no server action ou disparador SQL.
- HTML versionado: `email/confirm-signup.html`. Assunto sugerido: **Brasil Force | Confirme seu cadastro — missão recebida**.
- O template usa a variável oficial `{{ .ConfirmationURL }}` para construir um link seguro e expiráveis do Supabase Auth. Não construir links com tokens inventados ou expor segredos em logs.
- Remetente pretendido: **Brasil Force <contato@brasilforce.com.br>**. Este remetente não é definido por HTML: configurar em **Supabase Dashboard → Authentication → SMTP Settings** usando as credenciais SMTP autorizadas do provedor da caixa postal, TLS e porta recomendada pelo provedor.
- Verificar **Authentication → URL Configuration**: Site URL e Redirect URL `https://brasilforce.com.br/auth/callback` autorizadas, preservando URLs anteriores do projeto compartilhado. Checar o fluxo PKCE SSR e `exchangeCodeForSession` antes de habilitar o cadastro.
- Em **Authentication → Email Templates → Confirm sign up** definir o assunto e colar o HTML versionado. A interface da Supabase hospeda e envia o template, não a aplicação Next.js.
- Confirmar SPF, DKIM e DMARC conforme o servidor SMTP contratado; a simples criação da caixa `contato@` não comprova permissão de envio SMTP.
- Fazer teste de ponta a ponta com uma conta autorizada em ambiente isolado. Testar link válido, expirado, já utilizado, links para o domínio correto, entregabilidade e resposta, caixa de spam e remetente. Não usar dados fictícios no banco compartilhado.
- **Nenhum SMTP/SMTP secret foi recebido, nem o template aplicado no projeto remoto. Não declarar envio automático ativo antes de configurar e testar.**
- `AUTH_REGISTRATION_ENABLED` permanece sob flag: ativar somente após a confirmação de SMTP e segurança.
- E-mails de recuperação de senha utilizam template separado; não reutilizar o link de confirmação de cadastro.
- Não usar e-mail pessoal do visitante para distribuir detalhes de vendedores, documentos ou status de moderação.

## Procedimento de ativação
1. Confirmar provedor do e-mail e permissão para enviar como `contato@`.
2. Obter hostname/porta TLS e credenciais SMTP **no painel do provedor**, nunca em arquivos do Git ou chat.
3. Aplicar configuração SMTP no Supabase Auth (projeto `rrymtjzsekmjplyuoqef`) somente com autorização e preservar/validar a configuração existente, pois o projeto é compartilhado.
4. Instalar o template versionado e configurar o assunto.
5. Executar cadastro e confirmar que uma mensagem única chega com remetente correto.
6. Verificar link no app, login, recuperação, throttling e se o envio falha corretamente quando serviço indisponível.
7. Só depois considerar ativação pública do cadastro.

Documentação: https://supabase.com/docs/guides/auth/auth-email-templates e https://supabase.com/docs/guides/auth/auth-smtp
