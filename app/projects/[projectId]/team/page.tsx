import type { Metadata } from "next";
import { TeamPage } from "@/components/pages/SectionPages";

export const metadata: Metadata = { title: "Pay the team" };

export default function Page() {
  return <TeamPage />;
}
