"use client";

import { useRouter } from "next/navigation";
import { ComputerMoveForm } from "@/components/ComputerMoveForm";

type Props = {
  computer: Parameters<typeof ComputerMoveForm>[0]["computer"];
  departments: Parameters<typeof ComputerMoveForm>[0]["departments"];
  locations: Parameters<typeof ComputerMoveForm>[0]["locations"];
  people: NonNullable<Parameters<typeof ComputerMoveForm>[0]["people"]>;
  cancelHref: string;
};

export function ComputerMover({ computer, departments, locations, people, cancelHref }: Props) {
  const router = useRouter();
  return (
    <div className="surface p-5 sm:p-6">
      <ComputerMoveForm
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
