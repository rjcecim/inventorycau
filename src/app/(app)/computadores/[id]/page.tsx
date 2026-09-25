import { ComputerDetailView } from "@/components/ComputerInventoryViews";

export const dynamic = "force-dynamic";

export default async function ComputerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ComputerDetailView variant="DESKTOP" id={id} />;
}
