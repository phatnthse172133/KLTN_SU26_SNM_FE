import { Complaints } from "@/presentation/components/admin/Complaints";

export const metadata = { title: "Complaints Management | Admin | Smart Night Market" };

interface ComplaintsPageProps {
  searchParams?: Promise<{ id?: string | string[] }>;
}

export default async function ComplaintsPage({ searchParams }: ComplaintsPageProps) {
  const params = await searchParams;
  const complaintId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  return <Complaints initialComplaintId={complaintId} />;
}
