"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { changePasswordWithOtp, requestPasswordOtp } from "@/app/actions/contas";
import { Button } from "@/components/ui/Button";
import { Field, TextInput } from "@/components/ui/Field";

export default function RecuperarSenhaPage() {
  const [login, setLogin] = useState("");
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");

  const [state, action, pending] = useActionState(async (_: unknown, fd: FormData) => {
    const res = await changePasswordWithOtp(_, fd);
    if (res.success) {
      window.location.replace("/login");
    }
    return res;
  }, null);

  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight text-ink">Recuperar senha</h2>
      <p className="mt-1.5 text-sm text-muted">
        Informe seu login ou e-mail. Se a conta existir e tiver e-mail cadastrado, enviaremos um código.
      </p>

      <div className="mt-7 grid gap-4">
        <Field label="Login ou e-mail">
          <TextInput
            value={login}
            onChange={(event) => setLogin(event.target.value)}
            required
            autoComplete="username"
          />
        </Field>
        <Button
          type="button"
          variant="secondary"
          onClick={async () => {
            setMessage("");
            const res = await requestPasswordOtp(login);
            if (res.error) setMessage(res.error);
            else {
              setSent(true);
              setMessage("Se a conta existir, o código foi enviado. Confira também o spam.");
            }
          }}
        >
          Enviar código
        </Button>
        {message ? <p className="text-sm text-slate-600">{message}</p> : null}

        {sent ? (
          <form action={action} className="grid gap-3">
            <input type="hidden" name="login" value={login} />
            <Field label="Código">
              <TextInput name="code" required inputMode="numeric" autoComplete="one-time-code" />
            </Field>
            <Field label="Nova senha">
              <TextInput name="next" type="password" required minLength={6} />
            </Field>
            <Field label="Confirmar senha">
              <TextInput name="confirm" type="password" required minLength={6} />
            </Field>
            {state && "error" in state && state.error ? (
              <p className="text-sm text-rose-700">{state.error}</p>
            ) : null}
            <Button type="submit" disabled={pending}>{pending ? "Alterando…" : "Definir nova senha"}</Button>
          </form>
        ) : null}

        <Link href="/login" className="text-sm font-medium text-brand hover:underline">
          Voltar ao login
        </Link>
      </div>
    </div>
  );
}
