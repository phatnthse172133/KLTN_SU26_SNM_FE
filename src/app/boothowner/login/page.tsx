import { LoginRegister } from "@/presentation/components/LoginRegister";
import { Suspense } from "react";

export default function BoothOwnerLoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginRegister />
    </Suspense>
  );
}
