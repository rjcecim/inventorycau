import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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
        id: item.id,
        type: "Computador",
        title: item.hostname || item.tombo,
        subtitle: [item.tombo, item.usuario].filter(Boolean).join(" · "),
        href: `/computadores/${item.id}`,
      })),
      ...monitors.map((item) => ({
        id: item.id,
        type: "Monitor",
        title: item.tombo,
        subtitle: [item.fabricante, item.modelo, item.usuario].filter(Boolean).join(" · "),
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
          { hostname: contains },
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
    ...computers.map((item) => ({
      id: item.id,
      type: "Computador",
      title: item.hostname || item.tombo,
      subtitle: [item.tombo, item.serialNumber, item.usuario].filter(Boolean).join(" · "),
      href: `/computadores/${item.id}`,
    })),
    ...monitors.map((item) => ({
      id: item.id,
      type: "Monitor",
      title: item.tombo,
      subtitle: [item.serialNumber, item.usuario, item.modelo].filter(Boolean).join(" · "),
      href: `/monitores/${item.id}`,
    })),
  ]);
}
