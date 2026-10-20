# Brasil Force — E-mail corporativo e mensagens do site

**Endereço informado como criado pelo proprietário:** `contato@brasilforce.com.br`

## Estado verificado em 17/10/2026
- O projeto Vercel `sou-barcos` tem o domínio `brasilforce.com.br` vinculado e verificado.
- DNS autoritativo é externo: `a.sec.dns.br` e `c.sec.dns.br` (Registro.br), de acordo com a configuração de domínio retornada pela Vercel.
- A Vercel não tem permissão para consultar ou alterar os registros DNS deste domínio pela integração atual (retorna HTTP 403 na API de gerenciamento da zona).
- Não há configuração de serviço de e-mail transacional nas variáveis visíveis da aplicação.
- O app Next.js possui `src/app/ajuda/page.tsx` (FAQ), mas ainda não possui um formulário de e-mail real para esse endereço.
- O proprietário informou que criou a caixa postal. **Ainda não foi possível confirmar registros MX, SPF, DKIM ou o recebimento real**. Consultas DNS diretas neste ambiente não responderam.

## Preparação operacional
1. Selecionar um provedor com caixa postal real para envio e recebimento (por exemplo, Zoho Mail, Hostinger Mail ou Google Workspace).
2. Criar organização/conta com autorização do proprietário do domínio e adicionar `brasilforce.com.br`.
3. Verificar propriedade do domínio usando os registros TXT/CNAME **exatos** emitidos pelo provedor, no gerenciador de DNS do Registro.br. Nunca inventar código de verificação.
4. Provisionar a caixa ou alias `contato@brasilforce.com.br`.
5. Adicionar registros MX emitidos pelo provedor; configurar SPF (um único registro SPF), DKIM e DMARC. Não substituir A/CNAME atuais do site.
6. Testar envio e recebimento com remetente externo e responder usando a caixa corporativa.
7. O endereço foi adicionado à página Ajuda e ao rodapé como link `mailto:` (abre o aplicativo de e-mail do visitante, sem simular envio). Manter testes de recebimento e resposta pendentes; implantar formulário de contato somente após confirmação do serviço.
8. Para formulário de contato no site, usar endpoint server-side com validação, anti-spam, limitação por IP/usuário, tratamento de erros, consentimento/LGPD e um serviço de entrega autorizado. Não armazenar segredos no navegador. Não afirmar sucesso se envio falhar.
9. Separar caixa humana de envio automático: `contato@` para atendimento; `notificacoes@`/subdomínio específico se for usar prestador de e-mail transacional.

## Pendências bloqueantes
- A caixa foi informada como criada pelo proprietário, mas o provedor, os registros e o funcionamento não foram confirmados de forma independente.
- Gerenciamento DNS permanece sob controle externo à integração disponível.
- Não há validação de MX nem teste fim a fim de e-mail.
- O website pode apresentar o endereço comunicado pelo proprietário, mas não deve prometer resposta ou registrar mensagens enviadas sem validação.

**Produção:** nenhuma configuração DNS, MX, SMTP, domínio ou caixa postal foi alterada por esta entrega. Os links no site estão somente na branch de homologação, até deploy/merge explícito.
