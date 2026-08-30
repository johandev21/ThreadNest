import { AuthForm } from "@/features/auth";

export const metadata = {
  title: "Register · ThreadNest",
};

export default function RegisterPage() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col px-4 py-16">
      <AuthForm mode="register" />
    </div>
  );
}
