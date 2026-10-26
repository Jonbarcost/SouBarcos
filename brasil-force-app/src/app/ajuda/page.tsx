import { PageTitle } from "@/components/shell";
import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { CaptchaField } from "@/components/captcha-field";
import { captchaSiteKey } from "@/lib/captcha";
import { contactTopics } from "@/lib/email-templates";
import { sendContact } from "./actions";
export default function Help() {
  return (
    <div className="container page narrow">
      <PageTitle
        title="Como podemos ajudar?"
        description="Informações claras para sua próxima jornada."
      />
      {[
        [
          "A plataforma já aceita compras?",
          "Ainda não. Estamos construindo a fundação. Checkout, pagamentos e entregas serão liberados somente após integração e testes.",
        ],
        [
          "Quem poderá comprar?",
          "Qualquer pessoa com cadastro autenticado, respeitando as regras dos produtos e os requisitos aplicáveis.",
        ],
        [
          "Como posso vender?",
          "Solicite habilitação. A autorização depende de verificação e análise. Cada anúncio também passa pela moderação.",
        ],
        [
          "Meu vínculo institucional será público?",
          "O vínculo é opcional e autodeclarado. Informá-lo não gera selo nem comprova vínculo institucional.",
        ],
        [
          "O que pode ser anunciado?",
          "No lançamento, somente produtos classificados como de venda livre. Armas, munições, explosivos e produtos controlados não terão compra habilitada.",
        ],
      ].map(([q, a]) => (
        <details key={q}>
          <summary>{q}</summary>
          <p>{a}</p>
        </details>
      ))}
      <section className="panel bf-contact" aria-labelledby="support-email">
        <h2 id="support-email">Fale com o Brasil Force</h2>
        <p>
          Dúvidas, parcerias ou interesse em vender? Envie sua mensagem: ela chega à nossa equipe em{" "}
          <a className="text-link" href="mailto:contato@brasilforce.com.br">contato@brasilforce.com.br</a>{" "}
          e você recebe a confirmação por e-mail.
        </p>
        <ActionForm action={sendContact} label="Enviar mensagem">
          <div className="bf-contact-grid">
            <label>
              Nome
              <input name="name" required minLength={2} maxLength={80} autoComplete="name" />
            </label>
            <label>
              E-mail
              <input name="email" type="email" required maxLength={254} autoComplete="email" />
            </label>
          </div>
          <label>
            Assunto
            <select name="topic" required defaultValue="duvida">
              {Object.entries(contactTopics).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label>
            Mensagem
            <textarea name="message" required minLength={10} maxLength={2000} rows={5} />
          </label>
          <label className="bf-honeypot" aria-hidden="true">
            Site
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
          <CaptchaField siteKey={captchaSiteKey()} />
        </ActionForm>
      </section>
      <p>
        Consulte também nossas{" "}
        <Link href="/regras" className="text-link">
          regras de produtos
        </Link>
        .
      </p>
    </div>
  );
}
