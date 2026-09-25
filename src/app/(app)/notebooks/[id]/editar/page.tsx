import { ComputerEditView } from "@/components/ComputerInventoryViews";

export const dynamic = "force-dynamic";

export default async function EditarNotebookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ComputerEditView variant="NOTEBOOK" id={id} />;
}
