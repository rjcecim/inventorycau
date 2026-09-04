"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Eye, EyeOff, Loader2, Lock, User } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  const callbackUrl = params.get("callbackUrl");
  const redirected = Boolean(callbackUrl && callbackUrl !== "/");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      username: fd.get("username"),
      password: fd.get("password"),
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Usuário ou senha inválidos. Verifique os dados e tente novamente.");
      return;
    }
    router.push(callbackUrl || "/");
    router.refresh();
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight text-ink">Entrar</h2>
      <p className="mt-1.5 text-sm text-muted">
        Informe suas credenciais institucionais para acessar o painel.
      </p>

      {redirected && !error ? (
        <p className="mt-5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-600">
          Sua sessão expirou ou este recurso exige autenticação.
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-7 grid gap-4" noValidate>
        <label className="grid gap-1.5 text-sm font-medium text-slate-700" htmlFor="username">
          Usuário
          <span className="relative">
            <User size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="username"
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              required
              autoFocus
              disabled={loading}
              aria-invalid={Boolean(error)}
              placeholder="seu.usuario"
              className="w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-3.5 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-4 focus:ring-brand/10 disabled:bg-slate-50"
            />
          </span>
        </label>

        <label className="grid gap-1.5 text-sm font-medium text-slate-700" htmlFor="password">
          Senha
          <span className="relative">
            <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              disabled={loading}
              aria-invalid={Boolean(error)}
              aria-describedby={capsLock ? "caps-lock-hint" : undefined}
              placeholder="••••••••"
              onKeyUp={(e) => setCapsLock(e.getModifierState("CapsLock"))}
              onKeyDown={(e) => setCapsLock(e.getModifierState("CapsLock"))}
              className="w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-11 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-4 focus:ring-brand/10 disabled:bg-slate-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </span>
        </label>

        {capsLock ? (
          <p id="caps-lock-hint" className="text-xs text-amber-700">
            O Caps Lock está ativado.
          </p>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800"
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Autenticando…
            </>
          ) : (
            "Acessar sistema"
          )}
        </button>
      </form>
    </div>
  );
}
