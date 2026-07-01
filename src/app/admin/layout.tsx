import { Sidebar } from "@/presentation/components/admin/Sidebar";
import { Header } from "@/presentation/components/admin/Header";

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
  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-auto bg-[#F8FAFC]">
          <div className="min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
