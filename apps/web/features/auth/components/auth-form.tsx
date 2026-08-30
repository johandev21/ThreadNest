"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { authClient } from "../api/auth-client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

interface AuthFormProps {
  mode: "login" | "register";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const copy = isRegister
    ? {
        title: "Create your account",
        description: "Join ThreadNest and start nesting.",
        submitLabel: "Register",
        submitPendingLabel: "Creating account",
        altPrompt: "Already have an account? ",
        altLinkText: "Sign in",
        altHref: "/login",
      }
    : {
        title: "Welcome back",
        description: "Sign in to vote, post and comment.",
        submitLabel: "Sign in",
        submitPendingLabel: "Signing in",
        altPrompt: "New to ThreadNest? ",
        altLinkText: "Register",
        altHref: "/register",
      };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const result = isRegister
        ? await authClient.signUp.email({
            name: name.trim(),
            email: email.trim(),
            password,
          })
        : await authClient.signIn.email({
            email: email.trim(),
            password,
          });
      if (result.error) {
        setError(result.error.message ?? "Something went wrong. Try again.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <FieldGroup>
            {isRegister ? (
              <Field>
                <FieldLabel htmlFor="form-name">Name</FieldLabel>
                <Input
                  id="form-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ada Lovelace"
                  required
                />
              </Field>
            ) : null}
            <Field>
              <FieldLabel htmlFor="form-email">Email</FieldLabel>
              <Input
                id="form-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="form-password">Password</FieldLabel>
              <Input
                id="form-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
              />
            </Field>
          </FieldGroup>
          {error ? (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
        <CardFooter className="mt-6 flex-col gap-3">
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? (
              <>
                <Spinner data-icon="inline-start" />
                {copy.submitPendingLabel}
              </>
            ) : (
              copy.submitLabel
            )}
          </Button>
          <p className="text-sm text-muted-foreground">
            {copy.altPrompt}
            <Link
              href={copy.altHref}
              className="text-primary underline-offset-4 hover:underline"
            >
              {copy.altLinkText}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

// Backward compatibility alias for migration
export { AuthForm as UserForm };
