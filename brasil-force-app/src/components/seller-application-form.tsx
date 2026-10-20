import Link from "next/link";
export function SellerApplicationFields({
  name = "",
  personType = "individual",
  correction = false,
}: {
  name?: string;
  personType?: string;
  correction?: boolean;
}) {
  return (
    <>
      <label>
        Nome da loja ou vendedor
        <input
          name={correction ? "p_name" : "display_name"}
          defaultValue={name}
          required
          minLength={2}
          maxLength={100}
        />
      </label>
      <label>
        Tipo de cadastro
        <select
          name={correction ? "p_person_type" : "person_type"}
          defaultValue={personType}
        >
          <option value="individual">Pessoa física</option>
          <option value="company">Pessoa jurídica</option>
        </select>
      </label>
      <label className="check">
        <input name="rules" type="checkbox" required />
        <span>
          Li as <Link href="/regras">regras de produtos permitidos</Link> e
          entendo que preciso de aprovação.
        </span>
      </label>
    </>
  );
}
