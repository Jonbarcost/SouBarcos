# Segurança — consolidação operacional

## Controles implementados e exercitados localmente

- Sessão do Supabase validada no backend; funções SQL verificam sessão ativa, conta atual e AAL2 para equipe. Papéis não vêm de user_metadata.
- Aprovação de vendedor exige admin/superadmin, não apenas moderator. Vendedor não aprova a si próprio e equipe não recebe promoção/rebaixamento comercial.
- Toda decisão compara revisão sob lock e grava estado/histórico na mesma transação. Evidência documental depende de política habilitada, revisão e validade atuais.
- Gravações comerciais passam pelas RPCs; sem permissões amplas de INSERT/UPDATE/DELETE para usuários comuns.
- Produtos controlled/prohibited não são aprovados pelo fluxo comum e classificação não desaparece nas correções. Publicação exige vendedor aprovado/ativo, estoque e atributos necessários no banco.
- Notas internas da moderação ficam em tabela separada com RLS de equipe; vendedor recebe apenas retorno destinado a ele.
- View de catálogo com security_invoker e filtros explícitos evita exposição em telas públicas quando dono/equipe têm acesso à tabela privada.
- IA: origem exata, JSON, limite de bytes reais, sessão/conta/quota, contexto mínimo e seleção estruturada validada. Erros não devolvem detalhes de Supabase/provedor. Métricas não incluem conteúdo pessoal.
- React renderiza texto sem HTML do modelo. Queries parametrizadas via Supabase/SQL; termos de busca removem curingas. Nonce CSP e headers existentes permanecem.
- Storage privado continua sem upload liberado. Não há documentos/segredos adicionados ao Git.

## Testes negativos

Comprador ou vendedor chamando RPC administrativa; AAL1; autoaprovação; revisão velha; conta suspensa/sessão revogada; evidência incompleta/expirada/política alterada; leitura de referência documental por vendedor; notas internas por vendedor; anúncio privado alheio; classe controlada/proibida; reclassificação por correção; quota esgotada; tentativa de escrever na tabela de quotas; origem maliciosa; corpo maior que Content-Length; saída do modelo com IDs/prosa inventados. Ver TESTING.md.

Revisão independente do código não encontrou defeitos críticos/importantes na versão revisada. Não substitui pentest, revisão jurídica ou validação remota.

## Pendente antes de abertura

- Concluir homologação remota de Auth e recuperação de conta. Confirmação, MFA, expiração/revogação e isolamento HTTP já têm evidência em Supabase real local.
- Verificar proteção contra senhas comprometidas no plano Supabase; o aviso histórico não foi novamente consultado.
- Configurar processo de evidências com minimização, finalidade, retenção, acesso e logs. Não basta habilitar policy no SQL. Sem scanner, manter upload bloqueado.
- Confirmar modelo, token OIDC/key, orçamento global e proteção operacional contra múltiplas contas abusivas. Quota por usuário não é teto de gasto do projeto.
- Repetir a suíte PostgreSQL no ambiente remoto isolado quando existir. Concorrência local real já cobre aprovação, edição, moderação, suspensão do vendedor, quota e rollback.
- Definir limpeza dos registros de quota, retenção de auditoria, backup criptografado e restauração ensaiada.
- Pagamento, split, estoque reservado e webhooks continuam ausentes. Nenhuma flag transforma a aplicação em checkout pronto.

Não desativar RLS, TLS, assinatura de pacotes ou verificações de checksum como solução. Nenhuma alteração remota de segurança foi aplicada nesta execução.

## Isolamento da Operação Primeiro Vendedor

Antes de mutações, o loader confere config local, URLs/portas exatas, status e chaves da CLI, ownership/workdir dos containers, IP real do servidor PostgreSQL e ausência de usuários/anúncios fora dos marcadores de teste. Objetos runtime não podem ser fabricados pelo chamador; atores têm vínculo privado com id/client/runtime. O projeto compartilhado é recusado. Os auxiliares de teste não são importados pelo app.

Auth e MFA TOTP são reais. Alterar user_metadata ou JWT sem assinatura válida não concede papel; UPDATE direto de role é negado. Storage real nega upload e URL de outro dono. Política TEST-ONLY só existe no Docker descartável. Traces, vídeos e screenshots automáticos ficam desligados; CI coleta apenas imagem pública do produto fictício. Segredos, QR, cookies e links de confirmação não são publicados.

A CSP permite o origin loopback configurado somente em development; production/test mantêm os destinos HTTPS anteriores. A suíte verifica essa separação. A revisão detectou e levou à correção de duas falhas no harness: ator mutável sem vínculo de destino e cleanup omitido após falha parcial de startup. CI também executa cleanup com always() após cancelamento. Consulte [FIRST-SELLER-OPERATION.md](FIRST-SELLER-OPERATION.md).
