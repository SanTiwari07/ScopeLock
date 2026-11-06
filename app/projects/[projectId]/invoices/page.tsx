import type { Metadata } from "next";
import { InvoicesPage } from "@/components/pages/SectionPages";

export const metadata: Metadata = { title: "Invoices" };

export default function Page() {
  return <InvoicesPage />;
}
