import { ComputerNewView } from "@/components/ComputerInventoryViews";

export const dynamic = "force-dynamic";

export default async function NovoNotebookPage() {
  return <ComputerNewView variant="NOTEBOOK" />;
}
