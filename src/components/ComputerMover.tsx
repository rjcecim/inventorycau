"use client";

import { useRouter } from "next/navigation";
import { ComputerMoveForm } from "@/components/ComputerMoveForm";
import { variantCopy, type ComputerVariant } from "@/lib/inventory-kind";

type Props = {
  computer: Parameters<typeof ComputerMoveForm>[0]["computer"];
  departments: Parameters<typeof ComputerMoveForm>[0]["departments"];
  locations: Parameters<typeof ComputerMoveForm>[0]["locations"];
  people: NonNullable<Parameters<typeof ComputerMoveForm>[0]["people"]>;
  grouped?: boolean;
  cancelHref: string;
  variant?: ComputerVariant;
};

export function ComputerMover({ computer, departments, locations, people, grouped, cancelHref, variant = "DESKTOP" }: Props) {
  const router = useRouter();
  const copy = variantCopy(variant);
  return (
    <div className="surface p-5 sm:p-6">
      <ComputerMoveForm
        computer={computer}
        departments={departments}
        locations={locations}
        people={people}
        grouped={grouped}
        cancelHref={cancelHref}
        onSuccess={(id) => router.push(id ? `${copy.basePath}/${id}` : copy.basePath)}
      />
    </div>
  );
}
