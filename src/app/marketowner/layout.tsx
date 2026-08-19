import { MarketOwnerLayoutShell } from "@/presentation/components/marketowner/MarketOwnerLayoutShell";

export default function MarketOwnerLayout({ children }: { children: React.ReactNode }) {
  return <MarketOwnerLayoutShell>{children}</MarketOwnerLayoutShell>;
}
