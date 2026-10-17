import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireSeller } from "@/lib/auth";
import { ListingForm } from "@/components/listing-form";
import { ActionForm } from "@/components/action-form";
import { PageTitle, Notice } from "@/components/shell";
import { editableStatuses, listingStatus, type Listing } from "@/lib/listings";
import { transitionListing } from "../../actions";
export default async function EditListing({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { db, user } = await requireSeller();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [itemResult, categories] = await Promise.all([
    db
      .from("bf_listings")
      .select(
        "id,title,description,category_slug,condition,price_cents,stock,brand,model,weight_grams,length_cm,width_cm,height_cm,dispatch_business_days,status,revision",
      )
      .eq("id", id)
      .eq("seller_id", user.id)
      .maybeSingle(),
    db
      .from("bf_categories")
      .select("slug,name")
      .eq("active", true)
      .neq("slug", "servicos")
      .order("name"),
  ]);
  if (itemResult.error || categories.error)
    throw new Error("Não foi possível carregar o anúncio.");
  if (!itemResult.data) notFound();
  const item = itemResult.data as Listing;
  const canSubmit = ["draft", "changes_requested", "paused"].includes(
    item.status,
  );
  const canPause = ["approved", "pending", "in_review"].includes(item.status);
  return (
    <div className="container page narrow">
      <PageTitle
        title={item.title}
        description={`Situação: ${listingStatus[item.status] ?? item.status}`}
      />
      <Link href="/painel-vendedor">Voltar aos anúncios</Link>
      <Notice>
        A análise não substitui a classificação legal. Este fluxo ainda não
        habilita publicação ou compras.
      </Notice>
      <section className="panel">
        {editableStatuses.includes(item.status) ? (
          <ListingForm
            key={item.revision}
            id={id}
            item={item}
            categories={categories.data ?? []}
          />
        ) : (
          <>
            <h2>Dados enviados</h2>
            <p style={{ whiteSpace: "pre-wrap" }}>{item.description}</p>
            <p>
              Preço:{" "}
              {(item.price_cents / 100).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}{" "}
              · Estoque: {item.stock}
            </p>
            <p>A edição está bloqueada nesta etapa.</p>
          </>
        )}
      </section>
      {(canSubmit || canPause) && (
        <section className="panel">
          <h2>
            {canSubmit ? "Enviar dados salvos para análise" : "Pausar anúncio"}
          </h2>
          <ActionForm
            key={`${item.revision}-transition`}
            action={transitionListing}
            label={canSubmit ? "Enviar para análise" : "Pausar"}
          >
            <input type="hidden" name="p_id" value={id} />
            <input type="hidden" name="p_revision" value={item.revision} />
            <input
              type="hidden"
              name="p_action"
              value={canSubmit ? "submit" : "pause"}
            />
            <label className="check">
              <input type="checkbox" name="confirm" required />
              {canSubmit
                ? "Revisei e salvei os dados. Entendo que o anúncio continuará fora do catálogo enquanto aguarda avaliação."
                : "Confirmo a pausa e a retirada do catálogo público."}
            </label>
          </ActionForm>
        </section>
      )}
    </div>
  );
}
