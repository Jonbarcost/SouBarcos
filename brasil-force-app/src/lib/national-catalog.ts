/**
 * Discovery metadata only. The database remains the authority for products,
 * stock, listing approval, and institutional eligibility.
 * Legacy category mappings are intentionally BROAD, not precise filters.
 */
export type DiscoverySector = {
  slug: string;
  name: string;
  legacyCategory: "vestuario" | "campo" | "acessorios" | "colecionismo" | "outdoor" | "servicos";
  examples: readonly string[];
  note?: string;
};

export const discoverySectors: readonly DiscoverySector[] = [
  {slug:"uniformes-vestuario",name:"Uniformes e vestuário",legacyCategory:"vestuario",examples:["Camisetas","Calças cargo","Roupas de trilha"],note:"Identificações e uniformes oficiais dependem de revisão e autorização."},
  {slug:"calcados",name:"Calçados",legacyCategory:"vestuario",examples:["Botas de trekking","Coturnos civis","Meias técnicas"]},
  {slug:"mochilas-bolsas",name:"Mochilas e bolsas",legacyCategory:"campo",examples:["Mochilas cargueiras","Bolsas impermeáveis","Organizadores"]},
  {slug:"equipamentos-campo",name:"Equipamentos de campo",legacyCategory:"campo",examples:["Bússolas","Cantis","Lanternas"]},
  {slug:"camping",name:"Camping",legacyCategory:"outdoor",examples:["Barracas","Sacos de dormir","Filtros de água"]},
  {slug:"pesca",name:"Pesca",legacyCategory:"outdoor",examples:["Varas","Molinetes","Roupas UV"]},
  {slug:"resgate",name:"Primeiros socorros e resgate",legacyCategory:"acessorios",examples:["Bolsas de curativos","Mantas térmicas","Sinalização"],note:"Produtos sujeitos a regras sanitárias exigem análise."},
  {slug:"sinalizacao-comunicacao",name:"Sinalização e comunicação",legacyCategory:"acessorios",examples:["Apitos","Refletivos","Suportes"],note:"Equipamentos de telecomunicações podem exigir homologação."},
  {slug:"ferramentas",name:"Ferramentas e cutelaria",legacyCategory:"acessorios",examples:["Alicates","Estojos","Ferramentas manuais"],note:"Cutelaria e artigos sujeitos a restrições não estão automaticamente habilitados à venda."},
  {slug:"personalizacao",name:"Personalização",legacyCategory:"servicos",examples:["Bordados não oficiais","Estamparia","Ajustes"],note:"Insígnias e identificações oficiais exigem verificação."},
  {slug:"colecionismo",name:"Colecionismo",legacyCategory:"colecionismo",examples:["Livros","Miniaturas","Maquetes"]},
  {slug:"servicos",name:"Serviços",legacyCategory:"servicos",examples:["Confecção","Manutenção comum","Reparos"]},
];

export const brazilStates = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
] as const;

export type VerifiedInstitution = {
  slug:string;
  name:string;
  kind:"armed_forces" | "federal_public_safety";
  sourceUrl:string;
  sourceVerifiedOn:string;
};
export const verifiedInstitutions: readonly VerifiedInstitution[] = [
  {slug:"exercito-brasileiro",name:"Exército Brasileiro",kind:"armed_forces",sourceUrl:"https://www.gov.br/defesa/pt-br/assuntos/estado-maior-conjunto-das-forcas-armadas/forcas-armadas",sourceVerifiedOn:"2026-10-16"},
  {slug:"marinha-do-brasil",name:"Marinha do Brasil",kind:"armed_forces",sourceUrl:"https://www.gov.br/defesa/pt-br/assuntos/estado-maior-conjunto-das-forcas-armadas/forcas-armadas",sourceVerifiedOn:"2026-10-16"},
  {slug:"forca-aerea-brasileira",name:"Força Aérea Brasileira",kind:"armed_forces",sourceUrl:"https://www.gov.br/defesa/pt-br/assuntos/estado-maior-conjunto-das-forcas-armadas/forcas-armadas",sourceVerifiedOn:"2026-10-16"},
  {slug:"policia-rodoviaria-federal",name:"Polícia Rodoviária Federal",kind:"federal_public_safety",sourceUrl:"https://www.gov.br/pt-br/orgaos/policia-rodoviaria-federal",sourceVerifiedOn:"2026-10-16"},
];

export function sectorFromSlug(slug:string | undefined):DiscoverySector | undefined {
  return discoverySectors.find(s => s.slug === slug);
}
