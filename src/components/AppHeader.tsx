"use client";

import { usePathname } from "next/navigation";
import { GlobalSearch } from "@/components/GlobalSearch";

function showAssetSearch(pathname: string) {
  if (pathname.endsWith("/novo") || pathname.endsWith("/editar")) return false;
  return (
    pathname === "/" ||
    pathname === "/visao-geral" ||
    pathname === "/movimentacoes" ||
    pathname === "/computadores" ||
    pathname.startsWith("/computadores/") ||
    pathname === "/monitores" ||
    pathname.startsWith("/monitores/")
  );
}

export function AppHeader() {
  const pathname = usePathname();
  if (!showAssetSearch(pathname)) return null;

  return (
    <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-line bg-white/80 px-6 py-3 backdrop-blur-md">
      <GlobalSearch />
    </header>
  );
}
