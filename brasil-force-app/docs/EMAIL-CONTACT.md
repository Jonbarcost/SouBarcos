# Brasil Force — E-mail corporativo e mensagens do site

**Endereço pretendido:** `contato@brasilforce.com.br`

## Estado verificado em 17/10/2026
- O projeto Vercel `sou-barcos` tem o domínio `brasilforce.com.br` vinculado e verificado.
- DNS autoritativo é externo: `a.sec.dns.br` e `c.sec.dns.br` (Registro.br), de acordo com a configuração de domínio retornada pela Vercel.
- A Vercel não tem permissão para consultar ou alterar os registros DNS deste domínio pela integração atual (retorna HTTP 403 na API de gerenciamento da zona).
- Não há configuração de serviço de e-mail transacional nas variáveis visíveis da aplicação.
- O app Next.js possui `src/app/ajuda/page.tsx` (FAQ), mas ainda não possui um formulário de e-mail real para esse endereço.
- **Não foi confirmada a existência da caixa postal nem de registros MX externos.** Não anunciar o e-mail como funcional antes do teste de recebimento.

## Preparação operacional
1. Selecionar um provedor com caixa postal real para envio e recebimento (por exemplo, Zoho Mail, Hostinger Mail ou Google Workspace).
2. Criar organização/conta com autorização do proprietário do domínio e adicionar `brasilforce.com.br`.
3. Verificar propriedade do domínio usando os registros TXT/CNAME **exatos** emitidos pelo provedor, no gerenciador de DNS do Registro.br. Nunca inventar código de verificação.
4. Provisionar a caixa ou alias `contato@brasilforce.com.br`.
5. Adicionar registros MX emitidos pelo provedor; configurar SPF (um único registro SPF), DKIM e DMARC. Não substituir A/CNAME atuais do site.
6. Testar envio e recebimento com remetente externo e responder usando a caixa corporativa.
7. Somente após sucesso, adicionar `contato@brasilforce.com.br` à página Ajuda e integrar a funcionalidade de contato.
8. Para formulário de contato no site, usar endpoint server-side com validação, anti-spam, limitação por IP/usuário, tratamento de erros, consentimento/LGPD e um serviço de entrega autorizado. Não armazenar segredos no navegador. Não afirmar sucesso se envio falhar.
9. Separar caixa humana de envio automático: `contato@` para atendimento; `notificacoes@`/subdomínio específico se for usar prestador de e-mail transacional.

## Pendências bloqueantes
- Provedor e conta de e-mail ainda não foram provisionados ou verificados.
- Gerenciamento DNS permanece sob controle externo à integração disponível.
- Não há validação de MX nem teste fim a fim de e-mail.
- Não publicar uma página que afirme existir canal ativo antes da ativação real.

**Produção:** nenhum DNS, MX, formulário, domínio ou caixa postal foi alterado por este documento.
