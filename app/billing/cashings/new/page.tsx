import { redirect } from "next/navigation";

export default function LegacyNewInvoiceCollectionPage() {
  redirect("/billing/collections/new");
}
