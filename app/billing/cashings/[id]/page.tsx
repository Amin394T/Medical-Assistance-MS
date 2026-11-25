import { redirect } from "next/navigation";

export default async function LegacyInvoiceCollectionDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/billing/collections/${id}`);
}
