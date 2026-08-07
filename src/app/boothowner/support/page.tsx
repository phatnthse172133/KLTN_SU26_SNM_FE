"use client";

import { Support } from "@/presentation/components/Support";
import { useBooth } from "@/application/context/BoothContext";

export default function SupportPage() {
  const { selectedBooth } = useBooth();
  return <Support boothId={selectedBooth?.id} />;
}
