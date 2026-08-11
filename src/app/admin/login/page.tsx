import { LoginRegister } from "@/presentation/components/LoginRegister";
import { Suspense } from "react";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginRegister />
    </Suspense>
  );
}
