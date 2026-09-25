import { ComputerMoveView } from "@/components/ComputerInventoryViews";

export const dynamic = "force-dynamic";

export default async function MoverNotebookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ComputerMoveView variant="NOTEBOOK" id={id} />;
}
