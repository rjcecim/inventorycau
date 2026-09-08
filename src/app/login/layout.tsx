import { Suspense } from "react";
import { Building2, MapPin, PcCase, ShieldCheck } from "lucide-react";

export const metadata = { title: "Entrar" };

const highlights = [
  {
    icon: PcCase,
    title: "Inventário de ativos",
    text: "Computadores e monitores com status, tombo e responsável.",
  },
  {
    icon: Building2,
    title: "Organização institucional",
    text: "Setores, usuários e prédios em uma estrutura única.",
  },
  {
    icon: ShieldCheck,
    title: "Acesso controlado",
    text: "Entrada restrita com perfis de administrador e usuário.",
  },
];

function BrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-sidebar text-white lg:flex lg:flex-col lg:justify-between">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-brand/25 blur-3xl" />
        <div className="absolute -bottom-28 -right-16 h-72 w-72 rounded-full bg-slate-700/40 blur-3xl" />
        <div className="absolute inset-y-0 left-0 w-1 bg-brand" />
      </div>

      <div className="relative flex h-full flex-col justify-between px-12 py-12 xl:px-16">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand text-sm font-bold tracking-wide">
            CAU
          </div>
          <div>
            <p className="text-sm font-semibold text-white">CAU Ativos</p>
            <p className="text-xs text-slate-400">Inventário de TI</p>
          </div>
        </div>

        <div className="max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">
            Acesso interno
          </p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-white xl:text-4xl">
            Gestão institucional de computadores e monitores
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-300">
            Cadastre, localize e acompanhe o parque de TI do CAU com histórico,
            setores e responsáveis em um único painel.
          </p>

          <ul className="mt-10 space-y-4">
            {highlights.map((item) => (
              <li key={item.title} className="flex gap-3">
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/10 text-blue-200 ring-1 ring-white/10">
                  <item.icon size={16} />
                </span>
                <span>
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <p className="text-sm text-slate-400">{item.text}</p>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="flex items-center gap-2 text-xs text-slate-500">
          <MapPin size={12} />
          Uso exclusivo da equipe autorizada
        </p>
      </div>
    </aside>
  );
}

function LoginFallback() {
  return (
    <div className="w-full max-w-[400px] animate-pulse">
      <div className="mb-8 h-10 w-36 rounded-lg bg-slate-200 lg:hidden" />
      <div className="h-7 w-28 rounded bg-slate-200" />
      <div className="mt-2 h-4 w-64 rounded bg-slate-200" />
      <div className="mt-8 h-24 rounded-xl bg-slate-200" />
      <div className="mt-4 h-24 rounded-xl bg-slate-200" />
      <div className="mt-6 h-11 rounded-xl bg-slate-200" />
    </div>
  );
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[minmax(22rem,1.05fr)_minmax(28rem,1fr)]">
      <BrandPanel />
      <section className="flex min-h-screen flex-col bg-canvas">
        <div className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-10">
          <div className="mx-auto w-full max-w-[400px]">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-xs font-bold text-white">
                CAU
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">CAU Ativos</p>
                <p className="text-xs text-muted">Inventário de TI</p>
              </div>
            </div>
            <Suspense fallback={<LoginFallback />}>{children}</Suspense>
          </div>
        </div>
        <p className="px-6 pb-6 text-center text-xs text-slate-400">
          CAU Ativos · ambiente interno
        </p>
      </section>
    </div>
  );
}
