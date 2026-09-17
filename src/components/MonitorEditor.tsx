"use client";

import { useRouter } from "next/navigation";
import { MonitorForm } from "@/components/MonitorForm";

type Props = {
  monitor?: Parameters<typeof MonitorForm>[0]["monitor"];
  departments: Parameters<typeof MonitorForm>[0]["departments"];
  locations: Parameters<typeof MonitorForm>[0]["locations"];
  people: NonNullable<Parameters<typeof MonitorForm>[0]["people"]>;
  cancelHref: string;
};

export function MonitorEditor({ monitor, departments, locations, people, cancelHref }: Props) {
  const router = useRouter();
  return (
    <div className="surface p-5 sm:p-6">
      <MonitorForm
        monitor={monitor}
        departments={departments}
        locations={locations}
        people={people}
        cancelHref={cancelHref}
        onSuccess={(id) => router.push(id ? `/monitores/${id}` : "/monitores")}
      />
    </div>
  );
}
