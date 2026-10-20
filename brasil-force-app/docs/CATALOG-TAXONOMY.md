# Taxonomia nacional — fase inicial

As seis categorias existentes são a referência para anúncios: `vestuario`, `campo`, `acessorios`, `colecionismo`, `outdoor`, `servicos`. A branch adiciona 12 áreas de descoberta em `src/lib/national-catalog.ts`, mapeadas às categorias existentes; os mapeamentos são amplos, não filtros específicos, e não criam produtos.

## Próxima migração proposta (não aplicada)
1. Levantar constraints, índices, políticas e dependências atuais em homologação.
2. Criar hierarquia aditiva com referência à chave `bf_categories.slug`, sem renomear ou excluir categorias.
3. Criar atributos tipados e vínculos de anúncios, com índices e RLS de leitura pública apenas para metadados aprovados.
4. Armazenar instituições verificadas com nome, UF quando aplicável, fonte, data de verificação, estado da revisão e sem alegar credenciamento.
5. Implementar revisão de conformidade em workflow separado. Nunca interpretar a seleção de instituição no perfil como elegibilidade.
6. Validar testes de rollback, não-regressão e isolamento por papéis antes de aplicar.

`free` equivale aproximadamente a GENERAL; `additional_review` a REVIEW_REQUIRED; `controlled` requer distinção futura entre RESTRICTED e REGULATED sem perder significado dos dados existentes; `prohibited` bloqueia publicação. Não alterar enum sem desenho formal de migração.
