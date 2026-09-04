"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { MonitorSmartphone, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    if (res?.error) setError("Usuário ou senha inválidos.");
    else {
      router.push(params.get("callbackUrl") || "/");
      router.refresh();
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(37,99,235,0.35),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(14,165,233,0.18),_transparent_40%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-6 py-10 lg:px-10">
        <div className="grid w-full gap-10 lg:grid-cols-2 lg:items-center">
          <div className="hidden text-white lg:block">
            <div className="mb-8 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-600 text-sm font-bold">CAU</div>
              <div>
                <p className="text-sm font-semibold">CAU Ativos</p>
                <p className="text-xs text-slate-300">Inventário de TI</p>
              </div>
            </div>
            <h1 className="max-w-md text-4xl font-semibold tracking-tight text-white">
              Controle o parque de computadores e monitores com clareza.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-300">
              Setores, usuários, equipamentos, status e histórico em um único painel operacional.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-slate-300">
              <li className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-500/20 text-blue-300">
                  <MonitorSmartphone size={16} />
                </span>
                Inventário de ativos por setor e localização
              </li>
              <li className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-sky-500/20 text-sky-300">
                  <ShieldCheck size={16} />
                </span>
                Acesso restrito com papéis de administrador e usuário
              </li>
            </ul>
          </div>

          <div className="mx-auto w-full max-w-md">
            <div className="rounded-3xl border border-white/10 bg-white p-8 shadow-2xl shadow-blue-950/40">
              <div className="mb-6 flex items-center gap-3 lg:hidden">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-xs font-bold text-white">CAU</div>
                <div>
                  <p className="font-semibold text-slate-900">CAU Ativos</p>
                  <p className="text-xs text-slate-500">Inventário de TI</p>
                </div>
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Entrar na plataforma</h2>
              <p className="mt-1 text-sm text-slate-500">Informe suas credenciais para continuar.</p>

              <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
                <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                  Usuário
                  <input
                    name="username"
                    autoComplete="username"
                    required
                    placeholder="admin"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                  Senha
                  <input
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />
                </label>
                {error ? (
                  <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
                ) : null}
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {loading ? "Entrando…" : "Entrar"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
