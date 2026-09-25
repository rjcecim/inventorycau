import { ComputerNewView } from "@/components/ComputerInventoryViews";

export const dynamic = "force-dynamic";

export default async function NovoComputadorPage() {
  return <ComputerNewView variant="DESKTOP" />;
}
