import type { Metadata } from "next";
import { RequestWizard } from "@/components/pages/RequestWizard";

export const metadata: Metadata = { title: "Change requests" };

export default function Page() {
  return <RequestWizard />;
}
