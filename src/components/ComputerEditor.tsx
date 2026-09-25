"use client";

import { useRouter } from "next/navigation";
import { ComputerForm } from "@/components/ComputerForm";
import { variantCopy, type ComputerVariant } from "@/lib/inventory-kind";

type Props = {
  computer?: Parameters<typeof ComputerForm>[0]["computer"];
  departments: Parameters<typeof ComputerForm>[0]["departments"];
  locations: Parameters<typeof ComputerForm>[0]["locations"];
  people: NonNullable<Parameters<typeof ComputerForm>[0]["people"]>;
  cancelHref: string;
  variant?: ComputerVariant;
};

export function ComputerEditor({ computer, departments, locations, people, cancelHref, variant = "DESKTOP" }: Props) {
  const router = useRouter();
  const copy = variantCopy(variant);
  return (
    <div className="surface p-5 sm:p-6">
      <ComputerForm
        computer={computer}
        departments={departments}
        locations={locations}
        people={people}
        cancelHref={cancelHref}
        variant={variant}
        onSuccess={(id) => router.push(id ? `${copy.basePath}/${id}` : copy.basePath)}
      />
    </div>
  );
}
