import { AdminLayoutShell } from "@/presentation/components/admin/AdminLayoutShell";

// ============================================================================
// ADMIN LAYOUT
// This layout applies only to the /admin route group.
// It uses a separate Sidebar and Header specifically for Admin users.
// ============================================================================
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutShell>{children}</AdminLayoutShell>;
}
