# Atualização: projeto compartilhado

A versão atual usa SouBarcos com tabelas `bf_*`, schema `brasil_force_private`, bucket `bf-seller-documents` e adesão explícita via `bf_join`. Auth é compartilhado, sem novo trigger nem cadastro automático dos usuários existentes. O restante deste documento registra decisões gerais da fundação; nomes sem prefixo representam os domínios, não os nomes SQL atuais. Veja SHARED-PROJECT.md para a implantação efetiva.

# Arquitetura técnica

## Decisão

Monólito modular Next.js/TypeScript na Vercel. Mantém uma implantação e transações de banco simples na fase inicial. Microserviços e um backend separado acrescentariam operação e consistência distribuída sem benefício imediato. Separar módulos por domínio, extraindo workers quando a carga real justificar.

Browser → Next.js (Server Components / Server Actions / Route Handlers) → Supabase Auth e PostgreSQL com RLS. Supabase Storage privado para documentos e assets aprovados separados; Realtime apenas em canais autorizados na fase 4. Gateway, logística e e-mail operam através de adaptadores server-side nas fases correspondentes.

Não há credencial privilegiada no frontend nem autorização por `user_metadata`. O Next.js usa a sessão do solicitante: o banco continua aplicando RLS mesmo se a requisição vier direto da API.

## Fronteiras de dados

| Domínio     | Fundação                                                                       | Evolução planejada                                                                               |
| ----------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Identidade  | accounts, profiles, institution_verifications; auth.users/sessions do Supabase | organizações, CPF/CNPJ/endereço segregados, KYC, histórico de dispositivos e sessões individuais |
| Catálogo    | categories, listings e classificação de risco                                  | produtos/variantes/imagens, revisão de alterações, moderação e lojas                             |
| Comercial   | fechado                                                                        | carrinhos, pedidos, itens, estoque reservado, pagamentos, webhooks, repasses, entregas e cupons  |
| Confiança   | seller_applications, audit_events, bucket privado                              | documentos, denúncias, devoluções, disputas e avaliações transacionais                           |
| Comunicação | sem dados simulados                                                            | mensagens, propostas, notificações e preferências                                                |
| Expansão    | previsto                                                                       | assinaturas, anúncios patrocinados, Radar, Pro, Empresas, Academy, Comunidade e AI               |

## Invariantes

- Identidade vem de `getUser()` no servidor. Claims são verificados para MFA; papéis atuais vêm de `accounts` protegida contra escrita pelo próprio usuário.
- Todas as tabelas públicas têm RLS e grants explícitos. Perfil pessoal só pode ser lido pelo dono com sessão ativa; administração não recebe acesso irrestrito a dados pessoais.
- Papéis buyer/seller/store/moderator/admin/superadmin já são diferenciados no banco. A separação de capacidades administrativas por ação será completada com os fluxos da fase 2. Não existe endpoint de mutação administrativa nesta fundação.
- Dados públicos de loja serão uma projeção explícita separada, nunca `select *` de perfil pessoal.
- Classificação padrão de anúncio é `additional_review`. Aprovação é impossível para qualquer classificação diferente de `free`; anúncios de vendedor suspenso não são públicos.
- Estado aprovado sozinho não é autorização legal. A governança de categorias precisa ser concluída antes do catálogo comercial.
- Histórico administrativo registra ator, entidade, ID, ação e timestamp, sem copiar documentos ou dados pessoais. Justificativa/decisão/versionamento e trilha de contestação entram com a moderação.
- Funções privilegiadas ficam em schema privado não exposto pela Data API, com `search_path` fixo e `EXECUTE` revogado por padrão. As exceções são helpers de RLS e triggers internos, sem aceitar papel informado pelo usuário.
- A bucket policy permite leitura apenas do caminho do proprietário. Upload não está liberado. Não se promete segurança de documentos antes de antivírus, retenção e fluxo de revisão.

## Comércio futuro

Usar centavos inteiros. Checkout recalcula preço, disponibilidade e frete no servidor e cria reserva de estoque em transação com locks/atualizações condicionais. Idempotency key única para pedido e provider event ID único para webhooks. Não confiar em retorno do navegador para marcar pagamento. Validar assinatura e corpo bruto, conferir valor/moeda/pedido/recebedor e persistir histórico transacional antes do processamento assíncrono.

Split e repasses pertencem ao PSP escolhido; nenhum saldo custodial próprio. Gateway precisa aceitar o ramo, subcontas verificadas, chargebacks e reembolsos. Nenhuma escolha de provedor foi tratada como contrato ou integração pronta.

## Privacidade e operação

Minimização desde o início; nenhuma coleta de CPF/CNPJ/endereço sem finalidade e política de retenção definidas. Segregar PII, evitar PII em logs, registrar consentimentos por finalidade quando aplicáveis. Definir controlador, atendimento e políticas com revisão jurídica antes de ativar onboarding comercial. Métricas, alertas, backup/restore, exclusão/exportação e resposta a incidentes são gates de produção, não características já certificadas.
