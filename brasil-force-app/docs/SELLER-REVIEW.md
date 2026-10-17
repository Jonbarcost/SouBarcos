# Aprovação de vendedores

## Implementado localmente

Fluxo: pending → in_review → approved / changes_requested / rejected. Reenvio de correções retorna a pending e incrementa a revisão. Rejeição é terminal. A RPC bf_review_seller conserva nome e assinatura anteriores.

Triagem continua disponível à equipe AAL2. Aprovação exige admin/superadmin com sessão ativa e MFA, nunca o próprio solicitante. O banco exige conta destinatária ativa, e-mail confirmado, papel buyer/seller/store, estado in_review, revisão esperada e atestado de verificação vigente para essa mesma revisão e política. Não promove nem rebaixa equipe.

Na mesma transação, approved habilita seller para pessoa física ou store para empresa, incrementa revisão e registra ator/motivo no histórico. Erros/conflitos não deixam papel ou evento parcialmente atualizado. can_sell e requireSeller continuam exigindo conta habilitada e solicitação aprovada; anúncio ainda precisa de moderação.

## Verificação documental

A migração cria bf_seller_verification_policies e bf_seller_verifications. Nenhuma política é pré-habilitada. Um operador deve definir o processo privado de evidências, retenção e acesso auditado antes de configurar política versionada para individual/company. Não criar outro banco.

Requisitos configuráveis: identity, commercial e policy são obrigatórios; fiscal e activity_credentials somente quando pertinentes à modalidade. bf_verify_seller exige administrador AAL2, revisão atual, todos os requisitos exatos da política habilitada e referência opaca de 8–100 caracteres. Não aceita URL, documento ou texto livre como referência. Validade é definida pelo servidor conforme política, entre 1–90 dias. Alterar política, revisar/reencaminhar a solicitação ou expirar a evidência invalida a elegibilidade para uma nova aprovação.

O atestado registra que um administrador conferiu a evidência em processo externo seguro. **Não valida documento automaticamente nem comprova que esse processo externo já existe.** O acesso a documentos e seus logs/retenção pertencem ao processo que ainda precisa ser configurado. Upload no bucket privado continua bloqueado; não há scanner integrado.

Referências de evidência são visíveis somente a administradores AAL2. Dono acompanha decisões e justificativas, sem referência interna. Histórico administrativo completo tem paginação em /admin/vendedores/[id].

## Evidência e implantação

Testes PGlite cobrem MFA/admin, estados, requisitos ausentes, política ausente/alterada, referência inválida, expiração, revisão antiga, autoaprovação, papel, auditoria e criação de rascunho após aprovação. Sem contas fictícias remotas ou decisões reais.

Migração 20261017020000_verified_seller_approval.sql **não aplicada remotamente nesta execução**. Sem política configurada não existe vendedor novo elegível à aprovação. Homologação Auth/MFA e processo de evidência continuam pendentes. Aprovação geral não concede autorização para itens institucionais restritos.
