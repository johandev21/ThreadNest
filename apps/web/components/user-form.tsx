"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";
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

interface UserFormProps {
  mode: "login" | "register";
}

export function UserForm({ mode }: UserFormProps) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

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
        <CardTitle>{isRegister ? "Create your account" : "Welcome back"}</CardTitle>
        <CardDescription>
          {isRegister
            ? "Join ThreadNest and start nesting."
            : "Sign in to vote, post and comment."}
        </CardDescription>
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
                {isRegister ? "Creating account" : "Signing in"}
              </>
            ) : isRegister ? (
              "Register"
            ) : (
              "Sign in"
            )}
          </Button>
          <p className="text-sm text-muted-foreground">
            {isRegister ? "Already have an account? " : "New to ThreadNest? "}
            <Link
              href={isRegister ? "/login" : "/register"}
              className="text-primary underline-offset-4 hover:underline"
            >
              {isRegister ? "Sign in" : "Register"}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
