"use client";

import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { useNests } from "../hooks/use-nests";
import { useCreateNestForm } from "../hooks/use-create-nest-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { NestAvatar } from "./nest-avatar";

export function NestSidebar() {
  const { data: nests, isLoading } = useNests();

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Nests</CardTitle>
        <CardDescription>Communities to explore</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-0.5">
        {isLoading ? (
          <>
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </>
        ) : nests && nests.length > 0 ? (
          nests.map((nest) => (
            <Link
              key={nest.id}
              href={`/n/${nest.slug}`}
              className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-muted"
            >
              <NestAvatar slug={nest.slug} size="sm" />
              <span className="truncate font-medium">n/{nest.slug}</span>
              <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                {nest.memberCount} {nest.memberCount === 1 ? "member" : "members"}
              </span>
            </Link>
          ))
        ) : (
          <p className="px-2 py-1.5 text-sm text-muted-foreground">
            No nests yet. Create the first one!
          </p>
        )}
        <CreateNestDialog />
      </CardContent>
    </Card>
  );
}

function CreateNestDialog() {
  const {
    open,
    setOpen,
    slug,
    setSlug,
    title,
    setTitle,
    description,
    setDescription,
    isPending,
    handleSubmit,
  } = useCreateNestForm();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="mt-2 w-full">
            <PlusIcon data-icon="inline-start" />
            Create nest
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a nest</DialogTitle>
          <DialogDescription>
            Start a new community for a topic you care about.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="nest-slug">Slug</FieldLabel>
              <Input
                id="nest-slug"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                placeholder="typescript"
                required
              />
              <FieldDescription>Lowercase letters, numbers and underscores.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="nest-title">Title</FieldLabel>
              <Input
                id="nest-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="TypeScript"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="nest-description">Description</FieldLabel>
              <Input
                id="nest-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="All things TypeScript"
              />
            </Field>
          </FieldGroup>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!slug.trim() || !title.trim() || isPending}>
              {isPending ? (
                <>
                  <Spinner data-icon="inline-start" />
                  Creating
                </>
              ) : (
                "Create nest"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
