import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { inventoryKindHref, inventoryKindLabel, variantInventoryKind } from "@/lib/inventory-kind";
import { prisma } from "@/lib/prisma";

function computerResult(item: {
  id: string;
  tipo: string;
  tombo: string;
  serialNumber: string | null;
  usuario: string | null;
  modelo: string | null;
}) {
  const kind = variantInventoryKind(item.tipo === "NOTEBOOK" ? "NOTEBOOK" : "DESKTOP");
  return {
    id: item.id,
    type: inventoryKindLabel(kind),
    title: item.tombo,
    subtitle: [item.tombo, item.serialNumber, item.usuario, item.modelo].filter(Boolean).join(" · "),
    href: inventoryKindHref(kind, item.id),
  };
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json([], { status: 401 });

  const q = (request.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 1) {
    const [computers, monitors] = await Promise.all([
      prisma.computador.findMany({ take: 8, orderBy: { updatedDate: "desc" }, where: { deletedAt: null } }),
      prisma.monitor.findMany({ take: 8, orderBy: { updatedDate: "desc" }, where: { deletedAt: null } }),
    ]);
    return NextResponse.json([
      ...computers.map((item) => ({
        ...computerResult(item),
        subtitle: [item.tombo, item.usuario].filter(Boolean).join(" · "),
      })),
      ...monitors.map((item) => ({
        id: item.id,
        type: "Monitor",
        title: item.tombo,
        subtitle: [item.modelo, item.usuario].filter(Boolean).join(" · "),
        href: `/monitores/${item.id}`,
      })),
    ]);
  }

  const contains = { contains: q, mode: "insensitive" as const };

  const [computers, monitors] = await Promise.all([
    prisma.computador.findMany({
      where: {
        deletedAt: null,
        OR: [
          { tombo: contains },
          { serialNumber: contains },
          { usuario: contains },
          { modelo: contains },
          { fabricante: contains },
        ],
      },
      take: 12,
    }),
    prisma.monitor.findMany({
      where: {
        deletedAt: null,
        OR: [
          { tombo: contains },
          { serialNumber: contains },
          { usuario: contains },
          { modelo: contains },
          { fabricante: contains },
        ],
      },
      take: 12,
    }),
  ]);

  return NextResponse.json([
    ...computers.map(computerResult),
    ...monitors.map((item) => ({
      id: item.id,
      type: "Monitor",
      title: item.tombo,
      subtitle: [item.serialNumber, item.usuario, item.modelo].filter(Boolean).join(" · "),
      href: `/monitores/${item.id}`,
    })),
  ]);
}
