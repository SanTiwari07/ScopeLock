import type { Metadata } from "next";
import { LedgerPage } from "@/components/pages/SectionPages";

export const metadata: Metadata = { title: "Money log" };

export default function Page() {
  return <LedgerPage />;
}
