"use client";

import { useRouter } from "next/navigation";
import { ComputerForm } from "@/components/ComputerForm";

type Props = {
  computer?: Parameters<typeof ComputerForm>[0]["computer"];
  departments: Parameters<typeof ComputerForm>[0]["departments"];
  locations: Parameters<typeof ComputerForm>[0]["locations"];
  people: NonNullable<Parameters<typeof ComputerForm>[0]["people"]>;
  cancelHref: string;
};

export function ComputerEditor({ computer, departments, locations, people, cancelHref }: Props) {
  const router = useRouter();
  return (
    <div className="surface p-5 sm:p-6">
      <ComputerForm
        computer={computer}
        departments={departments}
        locations={locations}
        people={people}
        cancelHref={cancelHref}
        onSuccess={(id) => router.push(id ? `/computadores/${id}` : "/computadores")}
      />
    </div>
  );
}
