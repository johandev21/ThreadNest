"use client";

import { useState } from "react";
import Link from "next/link";

import { authClient } from "@/lib/auth-client";
import { useJoinNest, useLeaveNest, useNest } from "@/lib/queries";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function NestHeader({ slug }: { slug: string }) {
  const { data: nest, isLoading, isError } = useNest(slug);
  const { data: session } = authClient.useSession();
  const authenticated = Boolean(session?.user);
  const [joined, setJoined] = useState(false);
  const [prevSlug, setPrevSlug] = useState(slug);
  const joinNest = useJoinNest(slug);
  const leaveNest = useLeaveNest(slug);

  if (prevSlug !== slug) {
    setPrevSlug(slug);
    setJoined(false);
  }

  if (isLoading) {
    return (
      <Card size="sm">
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="flex gap-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-24" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !nest) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Nest not found</AlertTitle>
        <AlertDescription>
          The nest n/{slug} does not exist or failed to load.
        </AlertDescription>
      </Alert>
    );
  }

  const pending = joinNest.isPending || leaveNest.isPending;

  function handleJoinToggle() {
    if (joined) {
      leaveNest.mutate(undefined, {
        onSuccess: () => setJoined(false),
      });
    } else {
      joinNest.mutate(undefined, {
        onSuccess: () => setJoined(true),
      });
    }
  }

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-lg">{nest.title}</CardTitle>
        <CardDescription>n/{nest.slug}</CardDescription>
        <CardAction>
          <MembershipButton
            authenticated={authenticated}
            joined={joined}
            pending={pending}
            onToggle={handleJoinToggle}
          />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        {nest.description ? (
          <p className="w-full">{nest.description}</p>
        ) : null}
        <div className={nest.description ? "mt-2 flex flex-wrap items-center gap-2" : "flex flex-wrap items-center gap-2"}>
          <Badge variant="secondary">{nest.memberCount} members</Badge>
          <Badge variant="outline">{nest.postCount} posts</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

interface MembershipButtonProps {
  authenticated: boolean;
  joined: boolean;
  pending: boolean;
  onToggle: () => void;
}

function MembershipButton({
  authenticated,
  joined,
  pending,
  onToggle,
}: MembershipButtonProps) {
  if (!authenticated) {
    return (
      <Button
        render={<Link href="/login" />}
        nativeButton={false}
        variant="outline"
        size="sm"
      >
        Sign in to join
      </Button>
    );
  }

  return (
    <Button
      variant={joined ? "secondary" : "default"}
      size="sm"
      disabled={pending}
      onClick={onToggle}
    >
      {joined ? "Leave" : "Join"}
    </Button>
  );
}
