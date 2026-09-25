import type { AssetStatus } from "@prisma/client";
import { ComputerListView } from "@/components/ComputerInventoryViews";

export const dynamic = "force-dynamic";

export default async function NotebooksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  return <ComputerListView variant="NOTEBOOK" status={params.status as AssetStatus | undefined} />;
}
