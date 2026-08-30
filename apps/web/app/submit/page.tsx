"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LinkIcon, TextIcon } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import type { Nest, PostType } from "@/lib/api";
import { useCreatePost, useNests } from "@/lib/queries";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export default function SubmitPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const { data: nests } = useNests();
  const [nestSlug, setNestSlug] = useState("");
  const [type, setType] = useState<PostType>("text");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const createPost = useCreatePost();

  const awaitingSession = isPending || !session?.user;

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace("/login");
    }
  }, [isPending, session, router]);

  if (awaitingSession) {
    return (
      <div className="mx-auto flex w-full max-w-xl justify-center px-4 py-16">
        <Spinner className="size-6" />
      </div>
    );
  }

  function handleTypeChange(value: string[]) {
    if (value[0] === "text" || value[0] === "link") {
      setType(value[0]);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!nestSlug || !title.trim()) return;
    try {
      const post = await createPost.mutateAsync({
        nestSlug,
        type,
        title: title.trim(),
        ...(type === "text"
          ? { content: content.trim() || undefined }
          : { url: url.trim() }),
      });
      router.push(`/p/${post.id}`);
    } catch {
      setError("Please check your input and try again.");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col px-4 py-6">
      <Card>
        <CardHeader>
          <CardTitle>Create a post</CardTitle>
          <CardDescription>Share text or a link with a nest.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <FieldGroup>
              <NestSelectField
                nests={nests}
                value={nestSlug}
                onChange={setNestSlug}
              />
              <PostTypeToggle
                value={type}
                onChange={handleTypeChange}
              />
              <Field>
                <FieldLabel htmlFor="submit-title">Title</FieldLabel>
                <Input
                  id="submit-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="An interesting title"
                  required
                  maxLength={300}
                />
              </Field>
              <ContentOrUrlField
                type={type}
                content={content}
                onContentChange={setContent}
                url={url}
                onUrlChange={setUrl}
              />
            </FieldGroup>
            {error ? (
              <Alert variant="destructive" className="mt-4">
                <AlertTitle>Could not create the post</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
          <CardFooter className="mt-6 justify-end gap-2">
            <Button render={<Link href="/">Cancel</Link>} nativeButton={false} variant="ghost" />
            <Button
              type="submit"
              disabled={!nestSlug || !title.trim() || createPost.isPending}
            >
              {createPost.isPending ? (
                <>
                  <Spinner data-icon="inline-start" />
                  Posting
                </>
              ) : (
                "Post"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

function NestSelectField({
  nests,
  value,
  onChange,
}: {
  nests: Nest[] | undefined;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field>
      <FieldLabel htmlFor="submit-nest">Nest</FieldLabel>
      <Select
        value={value || null}
        onValueChange={(val) => onChange(val ?? "")}
      >
        <SelectTrigger id="submit-nest" className="w-full">
          <SelectValue placeholder="Choose a nest" />
        </SelectTrigger>
        <SelectContent>
          {(nests ?? []).map((nest) => (
            <SelectItem key={nest.id} value={nest.slug}>
              n/{nest.slug}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function PostTypeToggle({
  value,
  onChange,
}: {
  value: PostType;
  onChange: (value: string[]) => void;
}) {
  return (
    <Field>
      <FieldLabel>Post type</FieldLabel>
      <ToggleGroup
        variant="outline"
        value={[value]}
        onValueChange={onChange}
      >
        <ToggleGroupItem value="text" aria-label="Text post">
          <TextIcon data-icon="inline-start" />
          Text
        </ToggleGroupItem>
        <ToggleGroupItem value="link" aria-label="Link post">
          <LinkIcon data-icon="inline-start" />
          Link
        </ToggleGroupItem>
      </ToggleGroup>
    </Field>
  );
}

function ContentOrUrlField({
  type,
  content,
  onContentChange,
  url,
  onUrlChange,
}: {
  type: PostType;
  content: string;
  onContentChange: (value: string) => void;
  url: string;
  onUrlChange: (value: string) => void;
}) {
  if (type === "text") {
    return (
      <Field>
        <FieldLabel htmlFor="submit-content">Content</FieldLabel>
        <Textarea
          id="submit-content"
          value={content}
          onChange={(event) => onContentChange(event.target.value)}
          placeholder="Write your post (optional)"
          className="min-h-32"
        />
      </Field>
    );
  }

  return (
    <Field>
      <FieldLabel htmlFor="submit-url">URL</FieldLabel>
      <Input
        id="submit-url"
        type="url"
        value={url}
        onChange={(event) => onUrlChange(event.target.value)}
        placeholder="https://example.com"
        required
      />
    </Field>
  );
}
