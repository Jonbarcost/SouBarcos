# Consolidação operacional autorizada

O comando mestre v2 autoriza implementação autônoma na branch codex/brasilforce-production-audit, mantendo legado e produção. Não criar outro projeto/banco remoto, não repetir migrações e não ativar gastos.

## Desenho

1. IA: Route Handler fino com serviço testável. Autorização por conta ativa e sessão confirmada, limite real de bytes, origem exata, quota SQL existente e contexto mínimo. Gateway retorna seleção estruturada de IDs e orientação enumerada; fatos comerciais e links vêm exclusivamente do catálogo. Sem texto livre do modelo renderizado como fato. OIDC preferido quando presente. Logs somente de resultado/status/duração, sem pergunta, usuário ou token.
2. Vendedores: manter RPC de revisão e assinatura. Nova configuração versionada de requisitos por modalidade, inicialmente desabilitada. Administrador AAL2 registra atestado de verificação com referência opaca a evidência em processo externo seguro, sem copiar documentos/PII; requisitos, revisão e validade conferidos no banco. Aprovação somente de in_review, sem autoaprovação, atualiza papel buyer→seller/store e histórico atomicamente. Não rebaixa nem promove equipe. Upload privado continua fechado: não há scanner ou política de retenção aprovada nesta máquina.
3. Anúncios: RPC administrativa de moderação com lock e revisão esperada, auditoria separando retorno ao vendedor de notas internas. Aprovação somente para item comum conferido como free, vendedor habilitado, categoria ativa, estoque e embalagem válidos. Classificações controlled/prohibited nunca são reclassificadas para free por essa RPC. RLS pública exige vendedor aprovado e estoque positivo. Criar detalhe público somente de itens autorizados.
4. Testes: casos de erro/sucesso do serviço, quota SQL, autorização, verificação, aprovação, revisão antiga, isolamento e moderação. PGlite valida lógica PostgreSQL, não comprova concorrência multi-instância real nem Supabase Auth remoto. Build e smoke HTTP após cada módulo relevante.

## Plano

- Executar baseline e registrar acessos externos.
- Adicionar testes que falham para IA, implementar e validar; commit isolado.
- Adicionar testes SQL que falham para aprovação verificada, implementar migração aditiva e UI; commit isolado.
- Adicionar testes que falham para moderação, implementar migração aditiva e UI/detalhe público; commit isolado.
- Executar suíte completa, atualizar documentação e rollback. Push sem force. Atualizar PR/preview somente se acesso autorizado funcionar.

## Gates externos

403 observado em API GitHub, documentação Vercel e lista Gateway; nenhuma credencial Supabase/Vercel injetada. Não foi inspecionado banco remoto nem confirmado orçamento/modelo. Nenhuma migração remota ou promoção de produção é parte da validação local.
