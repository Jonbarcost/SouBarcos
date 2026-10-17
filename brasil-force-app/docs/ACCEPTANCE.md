# Aceite da fundação

## Comprovado localmente

- [x] TypeScript estrito sem erros.
- [x] Build Next.js de produção.
- [x] 19 testes automatizados, incluindo políticas SQL executadas em PGlite.
- [x] Nenhum anúncio, pedido, vendedor ou receita fictícios incluídos na aplicação.
- [x] Papéis não alteráveis pela conta comum.
- [x] Perfil de outra conta invisível.
- [x] MFA exigido nas leituras administrativas do banco.
- [x] Publicação condicionada à classificação livre e vendedor ativo.
- [x] Edição relevante retira aprovação.
- [x] Upload documental bloqueado até existir fluxo seguro.

## Ainda necessário para aceitar a fase 1 em ambiente real

- [x] Migração aplicada ao SouBarcos autorizado, com prefixos e RLS; dados preexistentes preservados.
- [ ] Revisão das permissões antigas de products e demais alertas do projeto compartilhado.
- [ ] Configurar e testar SMTP, confirmação obrigatória, callbacks/URLs e rate limits.
- [ ] Cadastro e confirmação de e-mail, login e saída com contas reais de homologação.
- [ ] Recuperação e troca de senha, inclusive erro de link expirado e navegador diferente.
- [ ] Inscrição/desafio TOTP, conta administrativa AAL1 bloqueada e AAL2 autorizada.
- [ ] Revogação de sessão validada contra Auth/Data API reais; definir/testar revogação por dispositivo e histórico de acesso.
- [x] Data API pública real: categorias 200, catálogo 200 vazio, perfis privados 401.
- [ ] Fluxo autenticado e Storage HTTP completo com usuários de homologação.
- [ ] Revisão visual desktop/mobile em navegador real, navegação por teclado e validação de foco/contraste.
- [ ] Identificar controlador/operadores, retenção e canais de privacidade antes de coletar dados reais de clientes.

## Fora do aceite desta entrega

Compra real, aprovação de anúncios por moderador, estoque transacional, confirmação de webhook, frete, disputas e demais critérios comerciais dependem das fases 2–6. Nenhum está marcado como realizado.
