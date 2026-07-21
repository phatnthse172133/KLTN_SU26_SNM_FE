import { AlertCircle } from "lucide-react";

export function ApiUnavailable({ title, description }: { title: string; description: string }) {
  return <div className="p-8 max-w-5xl mx-auto space-y-6"><div><h2 className="text-2xl font-bold text-gray-900">{title}</h2><p className="text-sm text-gray-500 mt-1">{description}</p></div><div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center"><AlertCircle className="mx-auto h-10 w-10 text-amber-500"/><p className="mt-3 font-semibold text-amber-900">This feature is not available yet.</p><p className="mt-1 text-sm text-amber-700">Please check back later.</p></div></div>;
}
