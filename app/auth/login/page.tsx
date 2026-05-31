import { LoginForm } from "@/features/auth/login-form";

export default function LoginPage({
  searchParams
}: {
  searchParams?: { redirectTo?: string };
}) {
  return <LoginForm redirectTo={searchParams?.redirectTo} />;
}
