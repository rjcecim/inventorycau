import { cn } from "@/lib/utils";
import type { AssetStatus } from "@prisma/client";
import { ASSET_STATUS } from "@/lib/status";

export function StatusBadge({ status }: { status: AssetStatus }) {
  const meta = ASSET_STATUS[status];
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset", meta.className)}>
      {meta.label}
    </span>
  );
}
