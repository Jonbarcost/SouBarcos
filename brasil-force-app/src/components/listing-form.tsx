import { ActionForm } from "@/components/action-form";
import { saveListing } from "@/app/painel-vendedor/actions";
import type { Listing } from "@/lib/listings";

export function ListingForm({
  id,
  item,
  categories,
}: {
  id: string;
  item?: Listing;
  categories: { slug: string; name: string }[];
}) {
  const fields = [
    {
      name: "stock",
      label: "Quantidade em estoque",
      min: 0,
      max: 2147483647,
      value: item?.stock ?? 1,
    },
    {
      name: "weight_grams",
      label: "Peso embalado (gramas)",
      min: 1,
      max: 1000000,
      value: item?.weight_grams,
    },
    {
      name: "length_cm",
      label: "Comprimento da embalagem (cm)",
      min: 0.01,
      max: 1000,
      value: item?.length_cm,
      step: "0.01",
    },
    {
      name: "width_cm",
      label: "Largura da embalagem (cm)",
      min: 0.01,
      max: 1000,
      value: item?.width_cm,
      step: "0.01",
    },
    {
      name: "height_cm",
      label: "Altura da embalagem (cm)",
      min: 0.01,
      max: 1000,
      value: item?.height_cm,
      step: "0.01",
    },
    {
      name: "dispatch_business_days",
      label: "Prazo de postagem (dias úteis)",
      min: 0,
      max: 30,
      value: item?.dispatch_business_days ?? 3,
    },
  ];
  return (
    <ActionForm action={saveListing} label="Salvar anúncio">
      <input type="hidden" name="p_id" value={id} />
      <input type="hidden" name="p_revision" value={item?.revision ?? 0} />
      <label>
        Título
        <input
          name="title"
          required
          minLength={5}
          maxLength={160}
          defaultValue={item?.title}
        />
      </label>
      <label>
        Descrição
        <textarea
          name="description"
          required
          minLength={20}
          maxLength={10000}
          rows={7}
          defaultValue={item?.description}
        />
      </label>
      <small>
        Descreva o estado real, itens inclusos, garantia e devolução. Não inclua
        dados pessoais, contatos ou instruções de pagamento externo.
      </small>
      <div className="listing-fields">
        <label>
          Categoria
          <select
            name="category_slug"
            required
            defaultValue={item?.category_slug ?? ""}
          >
            <option value="" disabled>
              Selecione
            </option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Condição
          <select name="condition" defaultValue={item?.condition ?? "new"}>
            <option value="new">Novo</option>
            <option value="like_new">Seminovo</option>
            <option value="used">Usado</option>
          </select>
        </label>
        <label>
          Marca (opcional)
          <input name="brand" maxLength={100} defaultValue={item?.brand} />
        </label>
        <label>
          Modelo (opcional)
          <input name="model" maxLength={100} defaultValue={item?.model} />
        </label>
        <label>
          Preço (R$)
          <input
            name="price_cents"
            required
            inputMode="decimal"
            placeholder="149,90"
            defaultValue={
              item ? (item.price_cents / 100).toFixed(2).replace(".", ",") : ""
            }
          />
        </label>
        {fields.map((f) => (
          <label key={f.name}>
            {f.label}
            <input
              type="number"
              name={f.name}
              required
              min={f.min}
              max={f.max}
              step={f.step ?? "1"}
              defaultValue={f.value ?? ""}
            />
          </label>
        ))}
      </div>
      <small>
        As medidas preparam a cotação de frete. Não são uma cotação nem garantem
        aceitação pela transportadora.
      </small>
      {item?.status === "approved" && (
        <p className="notice">
          Salvar alterações retira este anúncio do catálogo até uma nova
          análise.
        </p>
      )}
    </ActionForm>
  );
}
