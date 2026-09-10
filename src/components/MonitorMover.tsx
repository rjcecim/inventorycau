"use client";

import { useRouter } from "next/navigation";
import { MonitorMoveForm } from "@/components/MonitorMoveForm";

type Props = {
  monitor: Parameters<typeof MonitorMoveForm>[0]["monitor"];
  departments: Parameters<typeof MonitorMoveForm>[0]["departments"];
  locations: Parameters<typeof MonitorMoveForm>[0]["locations"];
  computers: Parameters<typeof MonitorMoveForm>[0]["computers"];
  people: NonNullable<Parameters<typeof MonitorMoveForm>[0]["people"]>;
  cancelHref: string;
};

export function MonitorMover({ monitor, departments, locations, computers, people, cancelHref }: Props) {
  const router = useRouter();
  return (
    <div className="surface p-5 sm:p-6">
      <MonitorMoveForm
        monitor={monitor}
        departments={departments}
        locations={locations}
        computers={computers}
        people={people}
        cancelHref={cancelHref}
        onSuccess={(id) => router.push(id ? `/monitores/${id}` : "/monitores")}
      />
    </div>
  );
}
