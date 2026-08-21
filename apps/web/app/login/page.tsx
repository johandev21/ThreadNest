import { UserForm } from "@/components/user-form";

export const metadata = {
  title: "Sign in · ThreadNest",
};

export default function LoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col px-4 py-16">
      <UserForm mode="login" />
    </div>
  );
}
