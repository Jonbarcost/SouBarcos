"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { browserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
export function Mfa() {
  const router = useRouter();
  const [factor, setFactor] = useState("");
  const [qr, setQr] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function start() {
    setBusy(true);
    setMessage("");
    try {
      const db = browserClient();
      const { data, error } = await db.auth.mfa.listFactors();
      if (error) throw error;
      const existing = data.totp.find((f) => f.status === "verified");
      if (existing) {
        setFactor(existing.id);
        setMessage("Digite o código do seu autenticador.");
      } else {
        for (const f of data.all.filter((f) => f.status === "unverified"))
          await db.auth.mfa.unenroll({ factorId: f.id });
        const r = await db.auth.mfa.enroll({
          factorType: "totp",
          friendlyName: "Brasil Force",
        });
        if (r.error) throw r.error;
        setFactor(r.data.id);
        setQr(r.data.totp.qr_code);
      }
    } catch {
      setMessage("Não foi possível preparar o segundo fator. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }
  async function verify(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const { error } = await browserClient().auth.mfa.challengeAndVerify({
        factorId: factor,
        code,
      });
      if (error) throw error;
      setQr("");
      setFactor("");
      setCode("");
      setMessage("Segundo fator confirmado.");
      router.refresh();
    } catch {
      setMessage("Código inválido ou expirado. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="form">
      {!factor ? (
        <Button onClick={start} disabled={busy}>
          {busy ? "Aguarde…" : "Configurar ou confirmar segundo fator"}
        </Button>
      ) : (
        <form onSubmit={verify}>
          {qr && (
            <>
              <p>Escaneie com seu aplicativo autenticador.</p>
              <img
                className="qr"
                src={qr}
                alt="QR code privado para configurar o autenticador"
              />
            </>
          )}
          <label>
            Código de seis dígitos
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              autoComplete="one-time-code"
            />
          </label>
          <Button disabled={busy}>
            {busy ? "Verificando…" : "Confirmar código"}
          </Button>
        </form>
      )}
      <p role="status">{message}</p>
    </div>
  );
}
