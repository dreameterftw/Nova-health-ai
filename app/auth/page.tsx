import { AuthPage } from "@/components/auth/AuthPage";

type AuthRouteProps = {
  searchParams?: Promise<{
    mode?: string;
  }>;
};

export default async function AuthRoute({ searchParams }: AuthRouteProps) {
  const params = await searchParams;
  const initialView = params?.mode === "register" || params?.mode === "signup"
    ? "register"
    : "login";

  return <AuthPage initialView={initialView} />;
}
