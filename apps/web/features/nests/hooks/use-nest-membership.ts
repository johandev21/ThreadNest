"use client";

import { useState } from "react";
import { useSession } from "@/features/auth/hooks/use-session";
import { useJoinNest } from "./use-join-nest";
import { useLeaveNest } from "./use-leave-nest";

export function useNestMembership(slug: string) {
  const { data: session } = useSession();
  const authenticated = Boolean(session?.user);
  const [joined, setJoined] = useState(false);
  const [prevSlug, setPrevSlug] = useState(slug);
  const joinNest = useJoinNest(slug);
  const leaveNest = useLeaveNest(slug);

  if (prevSlug !== slug) {
    setPrevSlug(slug);
    setJoined(false);
  }

  const pending = joinNest.isPending || leaveNest.isPending;

  function toggleMembership() {
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

  return {
    authenticated,
    joined,
    pending,
    toggleMembership,
  };
}
