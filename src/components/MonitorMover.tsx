"use client";

import { useRouter } from "next/navigation";
import { MonitorMoveForm } from "@/components/MonitorMoveForm";

type Props = {
  monitor: Parameters<typeof MonitorMoveForm>[0]["monitor"];
  departments: Parameters<typeof MonitorMoveForm>[0]["departments"];
  locations: Parameters<typeof MonitorMoveForm>[0]["locations"];
  people: NonNullable<Parameters<typeof MonitorMoveForm>[0]["people"]>;
  grouped?: boolean;
  cancelHref: string;
};

export function MonitorMover({ monitor, departments, locations, people, grouped, cancelHref }: Props) {
  const router = useRouter();
  return (
    <div className="surface p-5 sm:p-6">
      <MonitorMoveForm
        monitor={monitor}
        departments={departments}
        locations={locations}
        people={people}
        grouped={grouped}
        cancelHref={cancelHref}
        onSuccess={(id) => router.push(id ? `/monitores/${id}` : "/monitores")}
      />
    </div>
  );
}
