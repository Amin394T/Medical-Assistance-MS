import { redirect } from "next/navigation";

export default function LegacyInvoiceCollectionsPage() {
  redirect("/billing/collections");
}
