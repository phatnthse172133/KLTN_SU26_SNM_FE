import { LoginRegister } from "@/presentation/components/LoginRegister";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginRegister />
    </Suspense>
  );
}
