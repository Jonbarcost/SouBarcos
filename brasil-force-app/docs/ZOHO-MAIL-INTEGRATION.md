# Zoho Mail e Central de Fornecedores — revisão do PR #6

## Estado de entrega
Implementação para homologação. Nenhum e-mail real enviado, token real obtido, cobrança criada ou migração aplicada à produção por esta revisão. Flags ausentes desativam OAuth, leitura e envio. Não confundir build pronto com autorização real da caixa.

## Configuração e bloqueios
A Vercel contém ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET e ZOHO_OAUTH_STATE_SECRET somente em Production, do tipo sensitive/secret. O endpoint autorizado devolveu metadados, sem valor; **o segredo atual não pôde ser validado**. Não houve substituição de variável. Uma credencial exposta foi relatada no documento original deste PR: revisar/rotacionar o Client Secret no console Zoho antes da ativação.

Variáveis privadas, sem NEXT_PUBLIC:
- ZOHO_CLIENT_ID e ZOHO_CLIENT_SECRET: cliente Server-based do Zoho.
- ZOHO_OAUTH_STATE_SECRET: 32 bytes aleatórios codificados em **64 caracteres hexadecimais**. Independente de qualquer chave de provedor.
- ZOHO_TOKEN_ENCRYPTION_KEY: outros 32 bytes aleatórios, também 64 hexadecimais. Nunca reutilizar o state secret. Guardar em gerenciador de segredos.
- ZOHO_REGION: us/eu/in/au, conforme a conta. Destinos HTTPS são fixos; URLs vindas do callback/provedor nunca escolhem o host.
- ZOHO_REDIRECT_URI: URL exata registrada no console, terminando em /api/integrations/zoho/callback. Produção: https://brasilforce.com.br/api/integrations/zoho/callback. Preview: usar cliente, conta e banco de homologação; não copiar credenciais produtivas para Preview.
- ZOHO_MAILBOX_ADDRESS: contato@brasilforce.com.br. A API confirma que o endereço pertence à conta autorizada.
- ZOHO_CREDENTIALS_REVIEWED=true somente após revisão/rotação da credencial exposta.
- ZOHO_OAUTH_ENABLED, ZOHO_MAIL_READ_ENABLED, ZOHO_MAIL_SEND_ENABLED: flags independentes; todas fechadas por padrão. Manter SEND desativada até autorização expressa de envio real.

`GET /api/integrations/zoho/status` (ou /readiness) exige administrador/superadmin com MFA e retorna apenas indicadores. Formato/variedade não provam entropia: as duas chaves devem ser geradas por CSPRNG, não escolhidas manualmente. Se qualquer requisito falhar, o fluxo não inicia. Nunca colar valores em chat, relatório, comandos versionados ou screenshots.

## OAuth e tokens
POST /start exige mesma origem, conta ativa e MFA. State assinado HMAC, TTL 10 minutos, vínculo usuário + cookie HttpOnly/Secure/SameSite=Lax + sessão de autenticação. Banco guarda somente SHA-256 do state; DELETE RETURNING faz o consumo atômico, inclusive quando o provedor recusa autorização. Repetição, outro usuário/sessão/cookie, assinatura alterada ou expiração são negados. Limite de cinco autorizações pendentes por usuário.

Callback troca código pelo endpoint fixo do data center, confirma a caixa corporativa e salva tokens criptografados com AES-256-GCM/IV aleatório/AAD vinculada a ambiente e caixa. Nunca retorna tokens ao navegador. Tabelas RLS são exclusivas da administração com sessão ativa e MFA; clientes só conseguem ler ciphertext, nunca plaintext. Não há service-role no browser. Callback redireciona para destino fixo sem código, com no-store e no-referrer. Configure também retenção/redação de URLs com códigos nos logs da infraestrutura.

Acesso é renovado sob demanda; tokens de acesso renovados ficam somente em memória. Reautorizar substitui a conexão. Revogar e desconectar primeiro revoga no Zoho, depois apaga o ciphertext/estados e cancela rascunhos pendentes. Falha de revogação mantém a conexão para investigação; não declara sucesso falso. Rotação da chave de criptografia requer desconectar/revogar com a chave antiga antes de trocar e reautorizar; não há recriptografia automática. Mudança de região/redirect também requer reconexão.

## Leitura e envio
Leitura é manual no painel, 20 mensagens por página, até 60 consultas/hora por administrador. Conteúdo HTML é mostrado como texto escapado, sem scripts, imagens remotas, anexos ou execução de instruções da mensagem. Não há cópia permanente automática de mensagens recebidas.

Envio: salvar rascunho imutável → aprovar conteúdo e destinatário → confirmar envio individual. Aprovação vence em 24 horas. Destinatário deriva do contato cadastrado; corpo em plaintext, sem CC/BCC. Antes de enviar, banco verifica estado atual, supressão por e-mail inclusive em prospects duplicados, conexão, limite global de 20 tentativas/dia e claim atômico. Máximo 50 rascunhos/dia/administrador. Revisão pode ser feita pelo mesmo administrador; não é um sistema de dupla aprovação.

Após claim o rascunho nunca volta automaticamente a aprovado. Timeout/erro fica `uncertain`; falha após claim pode deixar `sending`. Ambos requerem conferência humana na pasta Enviados. Não há garantia de exactly-once do provedor nem retry automático; o bloqueio local evita repetir o mesmo rascunho. Aceite Zoho não comprova entrega. Cancelamento/opt-out após uma chamada já em andamento não recolhe a mensagem.

## Fornecedores e 30 dias
Cadastro, mudança de etapa, evidência de consentimento, ativação, cancelamento, opt-out, notas e contatos geram histórico na mesma transação. Escrita direta nas tabelas não é concedida ao cliente. Revisão otimista impede sobrescrever alterações concorrentes. Consentimento exige referência/escopo; o operador é responsável por verificar sua autenticidade. Não guardar documentos, dados sensíveis ou credenciais nesse campo.

Ativação só ocorre após consentimento, começa no momento do registro e não pode ser reiniciada. Prazo: 720 horas. A view bf_supplier_eligibility calcula elegibilidade no momento da leitura, sem depender de cron. O painel mostra término; não publica anúncios automaticamente nem relaciona catálogos de terceiros a vendedores. Produtos continuam no fluxo existente de habilitação/moderação. Não há cobrança, renovação ou ativação paga implementada.

## Migração
O arquivo não aplicado 20261021170000_supplier_prospecting.sql do rascunho foi consolidado em 20261021164942_zoho_secure_supplier_operations.sql, gerado pela CLI, corrigindo a ordem cronológica futura. Consulta remota confirmou apenas as sete migrações anteriores. Não aplicar o arquivo antigo em conjunto. Migração transacional/aditiva, tabelas bf_ e schema privado; não altera pagamentos, auth.users ou papéis de contas.

## Validação exigida antes da operação
1. Aplicar migração primeiro em banco de homologação e executar testes de RLS/sessão/MFA.
2. Configurar cliente Zoho de homologação, dois segredos independentes e callback exato; revisar credencial exposta.
3. Usuário admin com MFA inicia conexão. Verificar conta correta, recusa, expiração e replay.
4. Ler mensagem autorizada e testar conteúdo hostil escapado.
5. Manter envio bloqueado; revisar rascunho e opt-out. Teste real de envio somente com autorização específica e destinatário de teste consentido.
6. Aprovar publicação/migração produtiva após validação real. Não habilitar flags por um build READY.

Referências oficiais consultadas em 21/10/2026:
- https://www.zoho.com/mail/help/api/using-oauth-2.html
- https://www.zoho.com/mail/help/api/get-all-users-accounts.html
- https://www.zoho.com/mail/help/api/get-emails-list.html
- https://www.zoho.com/mail/help/api/get-email-content.html
- https://www.zoho.com/mail/help/api/post-send-an-email.html
