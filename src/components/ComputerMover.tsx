"use client";

import { useRouter } from "next/navigation";
import { ComputerMoveForm } from "@/components/ComputerMoveForm";

type Props = {
  computer: Parameters<typeof ComputerMoveForm>[0]["computer"];
  departments: Parameters<typeof ComputerMoveForm>[0]["departments"];
  locations: Parameters<typeof ComputerMoveForm>[0]["locations"];
  people: NonNullable<Parameters<typeof ComputerMoveForm>[0]["people"]>;
  grouped?: boolean;
  cancelHref: string;
};

export function ComputerMover({ computer, departments, locations, people, grouped, cancelHref }: Props) {
  const router = useRouter();
  return (
    <div className="surface p-5 sm:p-6">
      <ComputerMoveForm
        computer={computer}
        departments={departments}
        locations={locations}
        people={people}
        grouped={grouped}
        cancelHref={cancelHref}
        onSuccess={(id) => router.push(id ? `/computadores/${id}` : "/computadores")}
      />
    </div>
  );
}
