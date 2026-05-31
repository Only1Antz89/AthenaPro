import { Suspense } from "react";
import { SignupForm } from "@/features/auth/signup-form";

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
