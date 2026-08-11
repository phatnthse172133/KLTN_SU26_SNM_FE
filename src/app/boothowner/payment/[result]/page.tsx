"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, CircleAlert, LoaderCircle } from "lucide-react";
import { apiClient } from "@/infrastructure/api";

export default function BoothPaymentResultPage() {
  const router = useRouter();
  const params = useParams<{ result: string }>();
  const searchParams = useSearchParams();
  const isCancelled = params.result === "cancel" || searchParams.get("cancel") === "true";
  const [message, setMessage] = useState(isCancelled ? "Your payment was cancelled." : "Your payment result is being confirmed.");

  useEffect(() => {
    const subscriptionId = searchParams.get("subscriptionId");
    const finish = window.setTimeout(() => router.replace("/boothowner/fees"), isCancelled ? 1600 : 2600);

    if (isCancelled && subscriptionId) {
      void apiClient.post(`/subscriptions/${subscriptionId}/cancel-payment`, {})
        .then(() => setMessage("Your payment was cancelled. You can choose a plan again."))
        .catch(() => setMessage("Your payment has been closed. We will refresh your subscription status now."));
    }

    return () => window.clearTimeout(finish);
  }, [isCancelled, router, searchParams]);

  const Icon = isCancelled ? CircleAlert : CheckCircle2;
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">
        <Icon className={`mx-auto h-11 w-11 ${isCancelled ? "text-amber-500" : "text-emerald-500"}`} />
        <h1 className="mt-4 text-xl font-bold text-slate-950">{isCancelled ? "Payment cancelled" : "Payment received"}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
        <div className="mt-6 inline-flex items-center gap-2 text-xs font-medium text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" /> Returning to subscriptions...</div>
      </section>
    </main>
  );
}
