"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, CircleAlert, LoaderCircle } from "lucide-react";
import { apiClient } from "@/infrastructure/api";
import type { BaseResponse } from "@/shared/types";
import type { PaymentStatusResponse } from "@/application/features/subscriptions/ownerSubscriptionService";

export default function BoothPaymentResultPage() {
  const router = useRouter();
  const params = useParams<{ result: string }>();
  const searchParams = useSearchParams();
  const isCancelled = params.result === "cancel" || searchParams.get("cancel") === "true";
  const [message, setMessage] = useState(isCancelled ? "Your payment was cancelled." : "Your payment result is being confirmed.");
  const [checking, setChecking] = useState(!isCancelled);

  useEffect(() => {
    const subscriptionId = searchParams.get("subscriptionId");
    let disposed = false;
    let retryTimer: number | undefined;
    let redirectTimer: number | undefined;
    let attempts = 0;
    const redirect = () => { redirectTimer = window.setTimeout(() => router.replace("/boothowner/fees"), 1200); };

    if (isCancelled && subscriptionId) {
      void apiClient.post(`/subscriptions/${subscriptionId}/cancel-payment`, {})
        .then(() => setMessage("Your payment was cancelled. You can choose a plan again."))
        .catch(() => setMessage("Your payment has been closed. We will refresh your subscription status now."))
        .finally(redirect);
    } else if (isCancelled) {
      redirectTimer = window.setTimeout(() => router.replace("/boothowner/fees"), 1200);
    } else if (subscriptionId) {
      const checkStatus = async () => {
        try {
          const result = await apiClient.get<BaseResponse<PaymentStatusResponse>>(`/subscriptions/${subscriptionId}/payment-status`);
          if (disposed) return;
          const payment = result.data;
          const status = payment?.status?.toLowerCase();
          setMessage(payment?.message || "Checking your payment status with PayOS...");
          if (status === "active" || status === "cancelled" || status === "expired") {
            setChecking(false);
            redirect();
            return;
          }
        } catch {
          if (disposed) return;
          setMessage("We are still confirming your payment. Please keep this page open or check again shortly.");
        }

        attempts += 1;
        if (attempts >= 22) {
          setChecking(false);
          setMessage("Payment received. We are still activating your plan. Please use Check payment status again shortly.");
          return;
        }
        retryTimer = window.setTimeout(checkStatus, 2000);
      };
      void checkStatus();
    } else {
      setChecking(false);
      setMessage("Payment reference is missing. Please return to subscriptions and check your payment status.");
    }

    return () => {
      disposed = true;
      if (retryTimer) window.clearTimeout(retryTimer);
      if (redirectTimer) window.clearTimeout(redirectTimer);
    };
  }, [isCancelled, router, searchParams]);

  const Icon = isCancelled ? CircleAlert : CheckCircle2;
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">
        <Icon className={`mx-auto h-11 w-11 ${isCancelled ? "text-amber-500" : "text-emerald-500"}`} />
        <h1 className="mt-4 text-xl font-bold text-slate-950">{isCancelled ? "Payment cancelled" : "Payment received"}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
        {checking && <div className="mt-6 inline-flex items-center gap-2 text-xs font-medium text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" /> Checking payment status...</div>}
      </section>
    </main>
  );
}
