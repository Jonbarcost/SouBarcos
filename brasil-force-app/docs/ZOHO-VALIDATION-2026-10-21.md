# Validação técnica — 21/10/2026

Base: PR #6, branch feat/brasilforce-zoho-oauth-foundation-20261021, commit 2869c18. Main cbea822 já é ancestral da branch; nenhuma substituição do trabalho visual ou conversacional anterior.

## Executado
- TypeScript: aprovado.
- Suíte completa: 102 testes aprovados, zero falhas. Inclui testes SQL reais em PostgreSQL/PGlite descartável, sem fixtures remotas.
- Build Next.js 16.4.1: aprovado. Corrigida incompatibilidade de reexportar configuração de rota.
- RLS: comprador/moderador/AAL1/sessão revogada negados; escrita direta negada; funções privilegiadas no schema privado com wrappers invoker, grants explícitos e verificação interna.
- OAuth: assinatura, vínculo usuário/cookie, expiração, consumo único persistente e isolamento entre administradores; corrupção de ciphertext/AAD/chave incorreta rejeitados.
- Fornecedores: consentimento obrigatório, revisão otimista inclusive parâmetros nulos, 30 dias calculados por tempo real, opt-out e supressão em contatos duplicados.
- E-mails: rascunho imutável, aprovação, claim único, resultado incerto sem retry; provedor substituído por fetch de teste, sem e-mails reais.
- Quota de leitura e bloqueio de envio desativado verificados. Não houve leitura de caixa real.

## Bloqueios reais
- ZOHO_OAUTH_STATE_SECRET é secret protegido: API não forneceu valor. Presença confirmada, adequação NÃO confirmada. Nova validação exige 64 hexadecimais independentes, derivados de 32 bytes aleatórios. Configuração inválida bloqueia ativação.
- ZOHO_TOKEN_ENCRYPTION_KEY, região, callback, mailbox, revisão de credencial e flags ainda precisam ser configurados no ambiente apropriado. Nenhuma variável existente foi trocada.
- Documento original relata exposição de Client Secret: revisar/rotacionar antes de autorizar conexão.
- Migração nova validada localmente, NÃO aplicada no Supabase compartilhado. Histórico remoto contém sete migrações anteriores; fornecedor/OAuth ainda não operam nesse banco.
- Sem sessão administrativa MFA disponível para concluir OAuth e verificar leitura real. A conta mestre solicitada anteriormente não foi criada nesta entrega.
- Nenhuma publicação produtiva, e-mail real, cobrança ou alteração de privilégios executada.

## Passagem para operação
Disponibilizar banco e cliente OAuth de homologação, configurar segredos via painel seguro, revisar credencial exposta e concluir consentimento com administrador MFA. Só após esse teste real considerar migração/publicação produtiva; envio real continua dependente de autorização específica. Previews atualmente usam a configuração compartilhada de banco do projeto; não habilitar flags ou executar testes com fixtures nesse banco.
