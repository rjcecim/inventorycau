import { ComputerDetailView } from "@/components/ComputerInventoryViews";

export const dynamic = "force-dynamic";

export default async function NotebookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ComputerDetailView variant="NOTEBOOK" id={id} />;
}
